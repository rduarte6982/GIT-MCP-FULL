-- Extensions required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- HNSW index hint: created after Drizzle generates table; adjust in custom migration:
-- CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
--   ON chunks USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- BM25 / FTS index on chunks:
-- CREATE INDEX IF NOT EXISTS chunks_fts_idx
--   ON chunks USING gin(to_tsvector('portuguese', coalesce(context_prefix, '') || ' ' || content));

-- Trigram index (useful for entity/code search):
-- CREATE INDEX IF NOT EXISTS chunks_content_trgm_idx
--   ON chunks USING gin (content gin_trgm_ops);
