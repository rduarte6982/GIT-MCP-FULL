# ADR-002: Drizzle as schema source of truth

**Status:** Accepted

## Context
Postgres serves three writers: the dashboard API (CRUD), the MCP server
(read-mostly retrieval), and the Python ingestion worker (heavy chunk inserts).
We need exactly one place where the schema is defined and migrated.

## Decision
- `packages/db` owns the schema, written in Drizzle ORM.
- Migrations are generated with `drizzle-kit` into `packages/db/src/migrations`.
- Hand-written migrations (HNSW index, GIN FTS index, RLS policies) are
  committed as numbered SQL files alongside the generated ones.
- The Python worker never imports Drizzle. It reads/writes via parameterised
  SQL using psycopg + pgvector adapter.

## Consequences
- TS code gets full type-inference (`InferSelectModel`, `InferInsertModel`).
- The worker's SQL must be kept in sync manually — covered by an integration
  test that runs the worker against a freshly-migrated test DB.
- Index tuning (HNSW `m`, `ef_construction`, `ef_search`) is decoupled from
  the schema and lives in plain SQL files where it can be reviewed.
