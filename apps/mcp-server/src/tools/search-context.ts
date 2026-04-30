import { SearchContextInput } from "@scm/shared/schemas";
import { entityBoost, hybridSearch, rerank, type RetrievedChunk } from "@scm/retrieval";
import { logger, startTrace } from "@scm/observability";
import { rateLimit } from "../middleware/rate-limit.js";
import type { Tool } from "./types.js";

export const searchContextTool: Tool = {
  name: "search_context",
  description:
    "Busca contexto técnico SAP relevante para uma pergunta. Retorna chunks com fontes e metadados estruturados (T-codes, BAPIs, tabelas mencionadas). Use sempre que precisar de informações sobre SAP, especialmente Brasil/NF-e/SPED/tributação.",
  inputSchema: SearchContextInput,
  jsonSchema: {
    type: "object",
    properties: {
      query: { type: "string", minLength: 1, maxLength: 2000 },
      knowledge_base_ids: { type: "array", items: { type: "string", format: "uuid" } },
      sap_release: { type: "string", pattern: "^[A-Z0-9_]+$" },
      max_results: { type: "integer", minimum: 1, maximum: 20, default: 8 },
      filters: {
        type: "object",
        properties: {
          module: { type: "string" },
          entity_refs: {
            type: "array",
            items: {
              type: "object",
              properties: { kind: { type: "string" }, name: { type: "string" } },
              required: ["kind", "name"],
            },
          },
        },
      },
    },
    required: ["query"],
  },

  async handler(rawInput, { auth }) {
    const input = SearchContextInput.parse(rawInput);
    await rateLimit(auth);

    const trace = startTrace({
      name: "mcp.search_context",
      userId: auth.tenantId,
      input,
    });

    try {
      const candidates = await hybridSearch({
        query: input.query,
        tenantId: auth.tenantId,
        knowledgeBaseIds: input.knowledge_base_ids ?? auth.allowedKbIds,
        sapRelease: input.sap_release ?? auth.defaultSapRelease,
        topK: 50,
        trace,
      });

      const boosted = entityBoost(candidates, input.query);
      const final = await rerank({
        query: input.query,
        candidates: boosted.slice(0, 30),
        topN: input.max_results,
        trace,
      });

      trace.update({ output: { chunks: final.length } });
      await trace.flush();

      return {
        content: [
          {
            type: "text",
            text: formatMcpResponse(final),
          },
        ],
      };
    } catch (err) {
      logger.error({ err, tenantId: auth.tenantId }, "mcp.search_context.failed");
      trace.update({ level: "ERROR", statusMessage: String(err) });
      await trace.flush();
      throw err;
    }
  },
};

function formatMcpResponse(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "_No matching context found._";
  return chunks
    .map((c, i) => {
      const sectionPath = c.source.section?.join(" > ") ?? "";
      const entitiesStr = c.entities.map((e) => `${e.kind}:${e.name}`).join(", ");
      const contextLine = c.contextPrefix ? `*Context:* ${c.contextPrefix}\n\n` : "";
      return [
        `## Result ${i + 1} (score: ${c.score.toFixed(3)})`,
        "",
        `**Source:** ${c.source.title}`,
        `**URL:** ${c.source.url ?? "(uploaded)"}`,
        sectionPath ? `**Section:** ${sectionPath}` : "",
        c.source.page !== null ? `**Page:** ${c.source.page}` : "",
        entitiesStr ? `**Entities:** ${entitiesStr}` : "",
        "",
        `${contextLine}${c.content}`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    })
    .join("\n\n---\n\n");
}
