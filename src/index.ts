import { createApp } from "./app";

const port = Number(process.env.PORT) || 3000;
const app = createApp();

const server = Bun.serve({
  port,
  fetch(req) {
    return app.fetch(req);
  },
});

console.log(`🚀 User CRUD Mock server listening on http://localhost:${server.port}`);
