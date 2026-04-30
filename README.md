# SAP Context MCP

**Multi-tenant Model Context Protocol backend** that gives Claude (and any other
MCP client) curated context about SAP — with focus on Brazilian localization
(NF-e, SPED, J\_1B\* customising, reforma tributária).

This repository implements **§ Backend** of the project spec
(`02_BACKEND.md`). Frontend / dashboard UI lives in a separate repository.

## Services

| Service             | Stack                        | Port  | Responsibility |
|---------------------|------------------------------|-------|----------------|
| `apps/mcp-server`   | TypeScript, MCP SDK, Hono    | 3001  | MCP tools, resources, prompts. stdio + Streamable HTTP transports. |
| `apps/dashboard-api`| TypeScript, Hono             | 3002  | REST API for the dashboard (tenants, API keys, billing, uploads). |
| `apps/ingestion-worker` | Python 3.12, RQ, unstructured, anthropic | — | Parses → enriches → chunks → contextualises → embeds → persists. |
| `apps/embedder`     | TEI + BGE-M3                 | 8080  | 1024-dim multilingual embeddings. |

## Shared packages

| Package                | What it owns |
|------------------------|--------------|
| `@scm/shared`          | Zod schemas, error hierarchy, tier limits, env loader |
| `@scm/db`              | Drizzle schema, postgres-js client, hybrid-search SQL |
| `@scm/auth`            | API-key (argon2id + pepper) + Supabase JWT helpers |
| `@scm/embeddings`      | Typed client for the embedder service |
| `@scm/retrieval`       | Hybrid search, entity boost, Cohere rerank |
| `@scm/billing`         | Stripe SDK + tier mapping + webhook helpers |
| `@scm/observability`   | pino logger, Langfuse trace helper, metric utils |
| `@scm/eval`            | Golden-set BR + retrieval-quality runner |

## Dev quickstart

```sh
corepack enable
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

See `docs/runbooks/local-dev.md` for the full walk-through.

## Layout

```
apps/
  dashboard-api/        # REST API
  embedder/             # TEI+BGE-M3 image
  ingestion-worker/     # Python pipeline
  mcp-server/           # MCP server
packages/
  auth/  billing/  db/  embeddings/  eval/  observability/  retrieval/  shared/
docs/
  adrs/  runbooks/  api/
.github/workflows/
  ci.yml  eval.yml  deploy.yml
docker-compose.dev.yml
turbo.json  biome.json  tsconfig.base.json  pnpm-workspace.yaml
```

## Status

Initial scaffold of the monorepo. Each service is wired end-to-end:
auth + tenant scoping, retrieval pipeline, ingestion worker, billing webhooks,
CI, eval harness, Dockerfiles. Stripe / Supabase / Langfuse integrations
require real keys to exercise; with empty keys the system runs but skips those
sub-systems gracefully.

## Migration / archived code

The previous content of this repository (`git-mcp-full`, a single-purpose
GitHub-API MCP server) lives under `legacy-git-mcp/` and is not part of the new
monorepo build graph.

## License

Proprietary — duarteapps.cloud.
