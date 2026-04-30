import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { logger } from "@scm/observability";
import { isAppError } from "@scm/shared/errors";
import type { ServerHandle } from "../server.js";

export interface HttpOpts {
  port: number;
}

export async function startHttp(handle: ServerHandle, opts: HttpOpts): Promise<void> {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", service: "sap-context-mcp" }));

  app.post("/mcp", async (c) => {
    const auth = c.req.header("authorization");
    if (!auth) {
      return c.json({ error: "missing_api_key" }, 401);
    }

    handle.setContext({
      headers: { authorization: auth },
      requestId: c.req.header("x-request-id") ?? randomUUID(),
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    transport.onerror = (err) => logger.error({ err }, "mcp.transport.http.error");

    try {
      await handle.server.connect(transport);
      const req = c.req.raw;
      const body = await req.json().catch(() => null);
      const response = await transport.handleRequest(req, body);
      return response;
    } catch (err) {
      logger.error({ err }, "mcp.http.handler.failed");
      if (isAppError(err)) {
        return c.json(err.toJSON(), err.statusCode as 400 | 401 | 402 | 404 | 429 | 500 | 502);
      }
      return c.json({ error: "internal_error" }, 500);
    }
  });

  serve({ fetch: app.fetch, port: opts.port });
  logger.info({ port: opts.port }, "mcp.transport.http.ready");
}
