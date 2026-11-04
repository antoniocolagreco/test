import { Database } from "bun:sqlite";
import type { User, CreateUserInput, UpdateUserInput } from "./types";
import { randomUUID } from "node:crypto";

export function createDatabase(filePath = process.env.DB_PATH || "users.db") {
  const db = new Database(filePath);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  return {
    getAllUsers(): User[] {
      const rows = db.query("SELECT * FROM users ORDER BY created_at DESC").all() as any[];
      return rows.map(mapRowToUser);
    },

    getUserById(id: string): User | null {
      const row = db.query("SELECT * FROM users WHERE id = ?").get(id) as any;
      return row ? mapRowToUser(row) : null;
    },

    getUserByEmail(email: string): User | null {
      const row = db.query("SELECT * FROM users WHERE email = ?").get(email) as any;
      return row ? mapRowToUser(row) : null;
    },

    createUser(input: CreateUserInput): User {
      const id = randomUUID();
      const now = new Date().toISOString();
      const role = input.role?.trim() || "user";

      db.query(`
        INSERT INTO users (id, name, email, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, input.name.trim(), input.email.trim().toLowerCase(), role, now, now);

      return {
        id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role,
        createdAt: now,
        updatedAt: now,
      };
    },

    updateUser(id: string, input: UpdateUserInput): User | null {
      const existing = this.getUserById(id);
      if (!existing) return null;

      const name = input.name !== undefined ? input.name.trim() : existing.name;
      const email = input.email !== undefined ? input.email.trim().toLowerCase() : existing.email;
      const role = input.role !== undefined ? input.role.trim() : existing.role;
      const updatedAt = new Date().toISOString();

      db.query(`
        UPDATE users
        SET name = ?, email = ?, role = ?, updated_at = ?
        WHERE id = ?
      `).run(name, email, role, updatedAt, id);

      return {
        id,
        name,
        email,
        role,
        createdAt: existing.createdAt,
        updatedAt,
      };
    },

    deleteUser(id: string): boolean {
      const result = db.query("DELETE FROM users WHERE id = ?").run(id);
      return result.changes > 0;
    },

    close() {
      db.close();
    }
  };
}

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type UserDatabase = ReturnType<typeof createDatabase>;
