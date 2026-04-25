#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import dotenv from "dotenv";
import { createOctokit, buildTools, registerHandlers } from "./tools.js";

dotenv.config();

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("[git-mcp-full] ERRO: defina GITHUB_TOKEN no .env ou no ambiente");
  process.exit(1);
}

const octokit = createOctokit(TOKEN);
const tools = buildTools(octokit);

function makeServer() {
  const server = new Server(
    { name: "git-mcp-full", version: "1.1.0" },
    { capabilities: { tools: {} } }
  );
  registerHandlers(server, tools, { ListToolsRequestSchema, CallToolRequestSchema });
  return server;
}

const transport = (process.env.MCP_TRANSPORT || "stdio").toLowerCase();

if (transport === "stdio") {
  const server = makeServer();
  await server.connect(new StdioServerTransport());
  console.error("[git-mcp-full] modo stdio iniciado");
} else if (transport === "http") {
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
  if (!AUTH_TOKEN) {
    console.error("[git-mcp-full] ERRO: em modo HTTP defina MCP_AUTH_TOKEN (bearer)");
    process.exit(1);
  }

  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true, name: "git-mcp-full", version: "1.1.0" }));

  const requireAuth = (req, res, next) => {
    const h = req.headers.authorization || "";
    const match = h.match(/^Bearer\s+(.+)$/i);
    if (!match || match[1] !== AUTH_TOKEN) {
      return res.status(401).json({ error: "unauthorized: missing or invalid bearer token" });
    }
    next();
  };

  app.post("/mcp", requireAuth, async (req, res) => {
    try {
      const server = makeServer();
      const t = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        t.close();
        server.close();
      });
      await server.connect(t);
      await t.handleRequest(req, res, req.body);
    } catch (e) {
      console.error("[git-mcp-full] erro na requisicao:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: "internal error", message: e.message });
      }
    }
  });

  app.get("/mcp", requireAuth, (_req, res) => {
    res.status(405).json({ error: "method not allowed; use POST" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.error(`[git-mcp-full] modo HTTP escutando em :${PORT} (POST /mcp)`);
  });
} else {
  console.error(`[git-mcp-full] MCP_TRANSPORT desconhecido: ${transport} (use stdio|http)`);
  process.exit(1);
}
