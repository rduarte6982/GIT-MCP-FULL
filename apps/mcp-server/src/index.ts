import { logger } from "@scm/observability";
import { config, transport, port } from "./config.js";
import { createMcpServer } from "./server.js";
import { startHttp } from "./transports/http.js";
import { startStdio } from "./transports/stdio.js";

async function main() {
  logger.info(
    { transport, port, env: config.NODE_ENV },
    "mcp.server.starting",
  );
  const handle = createMcpServer();
  if (transport === "stdio") {
    await startStdio(handle);
  } else {
    await startHttp(handle, { port });
  }
}

main().catch((err) => {
  logger.fatal({ err }, "mcp.server.crashed");
  process.exit(1);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "mcp.server.shutdown");
  setTimeout(() => process.exit(0), 5_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
