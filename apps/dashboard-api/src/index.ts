import { serve } from "@hono/node-server";
import { logger } from "@scm/observability";
import { createApp } from "./app.js";
import { port, config } from "./config.js";

const app = createApp();

const server = serve({ fetch: app.fetch, port }, (info) => {
  logger.info({ port: info.port, env: config.NODE_ENV }, "dashboard-api.ready");
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "dashboard-api.shutdown");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
