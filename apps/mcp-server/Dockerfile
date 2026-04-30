FROM node:22-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY turbo.json tsconfig.base.json biome.json ./
COPY packages ./packages
COPY apps/mcp-server ./apps/mcp-server
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @scm/mcp-server... build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/mcp-server ./apps/mcp-server
EXPOSE 3001
USER node
CMD ["node", "apps/mcp-server/dist/index.js"]
