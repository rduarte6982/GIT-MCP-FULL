import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { isAppError, NotFoundError } from "@scm/shared/errors";
import { logger } from "@scm/observability";
import { authMiddleware } from "./middleware/auth.js";
import { findResource, listResourcesForTier } from "./resources/index.js";
import { prompts } from "./prompts/index.js";
import { tools } from "./tools/index.js";
import type { McpRequestContext } from "./types.js";

export interface ServerHandle {
  server: Server;
  setContext(ctx: McpRequestContext): void;
}

export function createMcpServer(): ServerHandle {
  const server = new Server(
    {
      name: "sap-context-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: { subscribe: false },
        prompts: {},
        logging: {},
      },
    },
  );

  let currentCtx: McpRequestContext = { headers: {} };
  const setContext = (ctx: McpRequestContext) => {
    currentCtx = ctx;
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.jsonSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const auth = await authMiddleware(currentCtx);
      const tool = tools.find((t) => t.name === request.params.name);
      if (!tool) throw new NotFoundError(`tool:${request.params.name}`);
      return (await tool.handler(request.params.arguments, { auth, ctx: currentCtx })) as never;
    } catch (err) {
      logger.error({ err, tool: request.params.name }, "mcp.tool.failed");
      if (isAppError(err)) {
        throw new Error(`${err.code}: ${err.message}`);
      }
      throw err;
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const auth = await authMiddleware(currentCtx);
    return { resources: listResourcesForTier(auth.tier) };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const auth = await authMiddleware(currentCtx);
    const handler = findResource(request.params.uri);
    if (!handler) throw new NotFoundError(`resource:${request.params.uri}`);
    return handler.read(request.params.uri, auth);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: prompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const auth = await authMiddleware(currentCtx);
    const prompt = prompts.find((p) => p.name === request.params.name);
    if (!prompt) throw new NotFoundError(`prompt:${request.params.name}`);
    return prompt.build((request.params.arguments ?? {}) as Record<string, string>, auth);
  });

  return { server, setContext };
}
