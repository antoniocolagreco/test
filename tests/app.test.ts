import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createApp } from "../src/app";
import { createDatabase, type UserDatabase } from "../src/db";
import { unlinkSync, existsSync } from "node:fs";

const TEST_DB = "test_users.db";

describe("User CRUD API", () => {
  let db: UserDatabase;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    db = createDatabase(TEST_DB);
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it("GET /health should return ok", async () => {
    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
  });

  it("POST /api/users creates a user", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mario Rossi", email: "mario@example.com", role: "admin" }),
      })
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("Mario Rossi");
    expect(body.data.email).toBe("mario@example.com");
    expect(body.data.role).toBe("admin");
  });

  it("POST /api/users rejects invalid email or missing name", async () => {
    const badEmail = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mario", email: "not-an-email" }),
      })
    );
    expect(badEmail.status).toBe(400);

    const missingName = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "valid@example.com" }),
      })
    );
    expect(missingName.status).toBe(400);
  });

  it("POST /api/users rejects duplicate email", async () => {
    await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User 1", email: "duplicate@example.com" }),
      })
    );

    const dup = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User 2", email: "duplicate@example.com" }),
      })
    );
    expect(dup.status).toBe(409);
  });

  it("GET /api/users lists users", async () => {
    await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User 1", email: "u1@example.com" }),
      })
    );

    const res = await app.fetch(new Request("http://localhost/api/users"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.count).toBe(1);
    expect(body.data[0].email).toBe("u1@example.com");
  });

  it("GET /api/users/:id fetches single user or 404", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test User", email: "test@example.com" }),
      })
    );
    const created = (await createRes.json()) as any;

    const fetchRes = await app.fetch(new Request(`http://localhost/api/users/${created.data.id}`));
    expect(fetchRes.status).toBe(200);
    const fetched = (await fetchRes.json()) as any;
    expect(fetched.data.name).toBe("Test User");

    const notFound = await app.fetch(new Request("http://localhost/api/users/non-existent-id"));
    expect(notFound.status).toBe(404);
  });

  it("PUT /api/users/:id updates user", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Old Name", email: "old@example.com" }),
      })
    );
    const created = (await createRes.json()) as any;

    const updateRes = await app.fetch(
      new Request(`http://localhost/api/users/${created.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      })
    );
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as any;
    expect(updated.data.name).toBe("New Name");
    expect(updated.data.email).toBe("old@example.com");
  });

  it("PATCH /api/users/:id partially updates user fields", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Initial Name", email: "initial@example.com", role: "user" }),
      })
    );
    const created = (await createRes.json()) as any;

    // Patch only role
    const patchRoleRes = await app.fetch(
      new Request(`http://localhost/api/users/${created.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      })
    );
    expect(patchRoleRes.status).toBe(200);
    const patchedRole = (await patchRoleRes.json()) as any;
    expect(patchedRole.data.role).toBe("admin");
    expect(patchedRole.data.name).toBe("Initial Name");
    expect(patchedRole.data.email).toBe("initial@example.com");

    // Patch only email
    const patchEmailRes = await app.fetch(
      new Request(`http://localhost/api/users/${created.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "updated@example.com" }),
      })
    );
    expect(patchEmailRes.status).toBe(200);
    const patchedEmail = (await patchEmailRes.json()) as any;
    expect(patchedEmail.data.email).toBe("updated@example.com");
    expect(patchedEmail.data.name).toBe("Initial Name");
    expect(patchedRole.data.role).toBe("admin");

    // Patch with invalid email returns 400
    const badEmailRes = await app.fetch(
      new Request(`http://localhost/api/users/${created.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email" }),
      })
    );
    expect(badEmailRes.status).toBe(400);

    // Patch non-existent user returns 404
    const notFoundRes = await app.fetch(
      new Request("http://localhost/api/users/non-existent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ghost" }),
      })
    );
    expect(notFoundRes.status).toBe(404);
  });

  it("DELETE /api/users/:id removes user", async () => {
    const createRes = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "To Delete", email: "delete@example.com" }),
      })
    );
    const created = (await createRes.json()) as any;

    const delRes = await app.fetch(
      new Request(`http://localhost/api/users/${created.data.id}`, {
        method: "DELETE",
      })
    );
    expect(delRes.status).toBe(200);

    const getRes = await app.fetch(new Request(`http://localhost/api/users/${created.data.id}`));
    expect(getRes.status).toBe(404);
  });
});
