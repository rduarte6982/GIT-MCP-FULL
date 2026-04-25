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
    { name: "git-mcp-full", version: "1.2.0" },
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

  app.get("/health", (_req, res) => res.json({ ok: true, name: "git-mcp-full", version: "1.2.0" }));

  // Auth aceita o token de duas formas:
  //  1) Header Authorization: Bearer <token>          (POST /mcp)
  //  2) Token na propria URL como segmento de path    (POST /mcp/<token>)  ← util para clientes
  //     (como claude.ai web) que so aceitam URL e nao tem campo para header.
  const checkToken = (provided) =>
    typeof provided === "string" && provided.length > 0 && provided === AUTH_TOKEN;

  const requireAuthHeader = (req, res, next) => {
    const h = req.headers.authorization || "";
    const match = h.match(/^Bearer\s+(.+)$/i);
    if (!match || !checkToken(match[1])) {
      return res.status(401).json({ error: "unauthorized: missing or invalid bearer token" });
    }
    next();
  };

  const requireAuthPath = (req, res, next) => {
    if (!checkToken(req.params.token)) {
      return res.status(401).json({ error: "unauthorized: invalid url token" });
    }
    next();
  };

  const handleMcp = async (req, res) => {
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
  };

  app.post("/mcp", requireAuthHeader, handleMcp);
  app.post("/mcp/:token", requireAuthPath, handleMcp);

  app.get("/mcp", (_req, res) => res.status(405).json({ error: "method not allowed; use POST" }));
  app.get("/mcp/:token", (_req, res) =>
    res.status(405).json({ error: "method not allowed; use POST" })
  );

  app.listen(PORT, "0.0.0.0", () => {
    console.error(`[git-mcp-full] modo HTTP escutando em :${PORT} (POST /mcp)`);
  });
} else {
  console.error(`[git-mcp-full] MCP_TRANSPORT desconhecido: ${transport} (use stdio|http)`);
  process.exit(1);
}
