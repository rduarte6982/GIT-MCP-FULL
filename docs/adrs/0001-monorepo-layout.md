# ADR-001: Monorepo layout (pnpm workspaces + Turborepo)

**Status:** Accepted

## Context
Three TypeScript services and one Python service need to share types,
schemas, retrieval logic, and configuration. We want fast incremental builds,
type-safe inter-package consumption, and a single dependency-locked source of
truth.

## Decision
- Single repository, top-level **`apps/`** for runnables, **`packages/`** for libs.
- pnpm workspaces with `workspace:*` references between packages.
- Turborepo for task orchestration (`build`, `test`, `lint`, `type-check`).
- Python worker keeps its own `pyproject.toml` and is built as a separate Docker
  image. It does not consume `packages/` directly — schema parity is enforced
  via integration tests against the same Postgres.

## Consequences
- All TS apps boot from `loadEnv()` in `@scm/shared/config`, so env validation
  lives in one place.
- Adding a new service is mechanical: drop a folder under `apps/`, add it to
  the workspace, set up its Dockerfile.
- The Python worker has to re-declare any DB structure changes. ADR-002 pins
  Drizzle as the source of truth and the worker reads via raw SQL.
