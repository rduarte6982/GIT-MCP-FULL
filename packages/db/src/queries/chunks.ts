import { sql } from "drizzle-orm";
import type { DbClient } from "../client.js";

export interface HybridSearchParams {
  queryText: string;
  queryEmbedding: number[];
  tenantId: string;
  knowledgeBaseIds?: string[];
  sapRelease?: string;
  topK?: number;
  semanticWeight?: number;
  bm25Weight?: number;
}

export interface HybridSearchRow {
  id: string;
  document_id: string;
  content: string;
  context_prefix: string | null;
  section_path: string[] | null;
  page_start: number | null;
  page_end: number | null;
  entity_refs: Array<{ kind: string; name: string }> | null;
  semantic_score: number;
  bm25_score: number;
  fused_score: number;
  document_title: string;
  document_source_url: string | null;
}

export async function hybridSearchChunks(
  db: DbClient,
  params: HybridSearchParams,
): Promise<HybridSearchRow[]> {
  const topK = params.topK ?? 50;
  const semWeight = params.semanticWeight ?? 0.6;
  const bmWeight = params.bm25Weight ?? 0.4;
  const kbFilter =
    params.knowledgeBaseIds && params.knowledgeBaseIds.length > 0
      ? sql`AND c.knowledge_base_id = ANY(${params.knowledgeBaseIds})`
      : sql``;
  const releaseFilter = params.sapRelease
    ? sql`AND (c.sap_release IS NULL OR c.sap_release = ${params.sapRelease})`
    : sql``;
  const embeddingLiteral = `[${params.queryEmbedding.join(",")}]`;

  const rows = await db.execute<HybridSearchRow>(sql`
    WITH semantic AS (
      SELECT
        c.id,
        1 - (c.embedding <=> ${embeddingLiteral}::vector) AS score
      FROM chunks c
      WHERE c.tenant_id = ${params.tenantId}
        ${kbFilter}
        ${releaseFilter}
      ORDER BY c.embedding <=> ${embeddingLiteral}::vector
      LIMIT ${topK * 2}
    ),
    lexical AS (
      SELECT
        c.id,
        ts_rank_cd(
          to_tsvector('portuguese', coalesce(c.context_prefix, '') || ' ' || c.content),
          plainto_tsquery('portuguese', ${params.queryText})
        ) AS score
      FROM chunks c
      WHERE c.tenant_id = ${params.tenantId}
        ${kbFilter}
        ${releaseFilter}
        AND to_tsvector('portuguese', coalesce(c.context_prefix, '') || ' ' || c.content)
            @@ plainto_tsquery('portuguese', ${params.queryText})
      ORDER BY score DESC
      LIMIT ${topK * 2}
    ),
    fused AS (
      SELECT
        coalesce(s.id, l.id) AS id,
        coalesce(s.score, 0) AS semantic_score,
        coalesce(l.score, 0) AS bm25_score,
        coalesce(s.score, 0) * ${semWeight} + coalesce(l.score, 0) * ${bmWeight} AS fused_score
      FROM semantic s
      FULL OUTER JOIN lexical l ON s.id = l.id
    )
    SELECT
      c.id,
      c.document_id,
      c.content,
      c.context_prefix,
      c.section_path,
      c.page_start,
      c.page_end,
      c.entity_refs,
      f.semantic_score,
      f.bm25_score,
      f.fused_score,
      d.title AS document_title,
      d.source_url AS document_source_url
    FROM fused f
    JOIN chunks c ON c.id = f.id
    JOIN documents d ON d.id = c.document_id
    ORDER BY f.fused_score DESC
    LIMIT ${topK}
  `);

  return rows as unknown as HybridSearchRow[];
}
