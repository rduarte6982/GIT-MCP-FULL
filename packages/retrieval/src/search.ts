import { db, queries } from "@scm/db";
import { embedder } from "@scm/embeddings";
import type { RetrievedChunk, TraceLike } from "./types.js";

export interface HybridSearchInput {
  query: string;
  tenantId: string;
  knowledgeBaseIds?: string[];
  sapRelease?: string;
  topK?: number;
  trace?: TraceLike;
}

export async function hybridSearch(input: HybridSearchInput): Promise<RetrievedChunk[]> {
  const span = input.trace?.span("hybrid_search");
  try {
    const queryEmbedding = await embedder().embedOne(input.query);
    const rows = await queries.hybridSearchChunks(db(), {
      queryText: input.query,
      queryEmbedding,
      tenantId: input.tenantId,
      knowledgeBaseIds: input.knowledgeBaseIds,
      sapRelease: input.sapRelease,
      topK: input.topK ?? 50,
    });
    span?.end({ candidates: rows.length });
    return rows.map((r) => ({
      id: r.id,
      documentId: r.document_id,
      score: r.fused_score,
      semanticScore: r.semantic_score,
      bm25Score: r.bm25_score,
      content: r.content,
      contextPrefix: r.context_prefix,
      entities: r.entity_refs ?? [],
      source: {
        title: r.document_title,
        url: r.document_source_url,
        section: r.section_path,
        page: r.page_start,
      },
    }));
  } catch (err) {
    span?.end({ error: String(err) });
    throw err;
  }
}
