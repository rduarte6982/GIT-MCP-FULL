# Local development

## Prerequisites
- Node 22 + pnpm 9 (`corepack enable`)
- Python 3.12
- Docker (for Postgres / Redis / embedder)

## Bring up infra

```sh
docker compose -f docker-compose.dev.yml up -d
```

This starts: `postgres` (with pgvector), `redis`, `embedder` (BGE-M3), and
optionally a self-hosted Langfuse on :3300.

## Install + migrate

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
```

## Run services

```sh
pnpm --filter @scm/dashboard-api dev      # http://localhost:3002
pnpm --filter @scm/mcp-server dev         # http://localhost:3001/mcp
```

Python worker (separate venv):

```sh
cd apps/ingestion-worker
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
python -m ingestion_worker.queue.rq_worker
```

## Smoke test the MCP server

```sh
curl http://localhost:3001/health
```

For full MCP exchange use the official inspector:

```sh
npx @modelcontextprotocol/inspector \
  -e MCP_API_KEY=<key> \
  http://localhost:3001/mcp
```
