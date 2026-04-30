import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "@scm/observability";
import type { ServerHandle } from "../server.js";

export async function startStdio(handle: ServerHandle): Promise<void> {
  const transport = new StdioServerTransport();
  handle.setContext({
    headers: {
      authorization: process.env.MCP_API_KEY ? `Bearer ${process.env.MCP_API_KEY}` : undefined,
    },
  });
  await handle.server.connect(transport);
  logger.info("mcp.transport.stdio.ready");
}
