-- Apply after initial Drizzle migration creates the chunks table.
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
  ON chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS chunks_fts_idx
  ON chunks USING gin (
    to_tsvector('portuguese', coalesce(context_prefix, '') || ' ' || content)
  );

CREATE INDEX IF NOT EXISTS chunks_content_trgm_idx
  ON chunks USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS chunks_entity_refs_gin_idx
  ON chunks USING gin (entity_refs jsonb_path_ops);
