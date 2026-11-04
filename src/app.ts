import { createDatabase, type UserDatabase } from "./db";
import type { CreateUserInput, UpdateUserInput } from "./types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createApp(db: UserDatabase = createDatabase()) {
  return {
    db,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const method = req.method.toUpperCase();
      const path = url.pathname;

      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Root endpoint
      if (path === "/" && method === "GET") {
        return json({
          name: "User CRUD Mock API",
          status: "running",
          endpoints: [
            { method: "GET", path: "/health", description: "Health check" },
            { method: "GET", path: "/api/users", description: "List all users" },
            { method: "GET", path: "/api/users/:id", description: "Get user by ID" },
            { method: "POST", path: "/api/users", description: "Create user" },
            { method: "PUT", path: "/api/users/:id", description: "Update user" },
            { method: "PATCH", path: "/api/users/:id", description: "Partially update user" },
            { method: "DELETE", path: "/api/users/:id", description: "Delete user" },
          ],
        });
      }

      // Health endpoint
      if (path === "/health" && method === "GET") {
        return json({ status: "ok", timestamp: new Date().toISOString() });
      }

      // /api/users
      if (path === "/api/users") {
        if (method === "GET") {
          const users = db.getAllUsers();
          return json({ data: users, count: users.length });
        }

        if (method === "POST") {
          let body: CreateUserInput;
          try {
            body = (await req.json()) as CreateUserInput;
          } catch {
            return json({ error: "Invalid JSON body" }, 400);
          }

          if (!body || !body.name || typeof body.name !== "string" || !body.name.trim()) {
            return json({ error: "Field 'name' is required and must be non-empty" }, 400);
          }

          if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
            return json({ error: "A valid 'email' is required" }, 400);
          }

          const existing = db.getUserByEmail(body.email.trim().toLowerCase());
          if (existing) {
            return json({ error: `User with email '${body.email.trim()}' already exists` }, 409);
          }

          const created = db.createUser(body);
          return json({ data: created }, 201);
        }
      }

      // /api/users/:id
      const userMatch = path.match(/^\/api\/users\/([^/]+)$/);
      if (userMatch && userMatch[1]) {
        const id = decodeURIComponent(userMatch[1]);

        if (method === "GET") {
          const user = db.getUserById(id);
          if (!user) {
            return json({ error: "User not found" }, 404);
          }
          return json({ data: user });
        }

        if (method === "PUT" || method === "PATCH") {
          let body: UpdateUserInput;
          try {
            body = (await req.json()) as UpdateUserInput;
          } catch {
            return json({ error: "Invalid JSON body" }, 400);
          }

          if (!body || typeof body !== "object") {
            return json({ error: "Invalid JSON body" }, 400);
          }

          if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
            return json({ error: "Field 'name' must be a non-empty string" }, 400);
          }

          if (body.email !== undefined && (!body.email || typeof body.email !== "string" || !isValidEmail(body.email))) {
            return json({ error: "Invalid email format" }, 400);
          }

          const existingUser = db.getUserById(id);
          if (!existingUser) {
            return json({ error: "User not found" }, 404);
          }

          if (body.email && body.email.trim().toLowerCase() !== existingUser.email) {
            const conflict = db.getUserByEmail(body.email.trim().toLowerCase());
            if (conflict) {
              return json({ error: `User with email '${body.email.trim()}' already exists` }, 409);
            }
          }

          const updated = db.updateUser(id, body);
          return json({ data: updated });
        }

        if (method === "DELETE") {
          const deleted = db.deleteUser(id);
          if (!deleted) {
            return json({ error: "User not found" }, 404);
          }
          return json({ message: "User deleted successfully" });
        }
      }

      return json({ error: "Not Found" }, 404);
    },
  };
}
