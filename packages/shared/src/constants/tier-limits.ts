import type { Tier } from "../schemas/tenant.js";

export interface TierLimit {
  mcpQueriesPerHour: number;
  uploadBytes: number;
  knowledgeBases: number;
  apiKeys: number;
  retentionDays: number;
}

export const TIER_LIMITS: Record<Tier, TierLimit> = {
  free: {
    mcpQueriesPerHour: 30,
    uploadBytes: 50 * 1024 * 1024,
    knowledgeBases: 1,
    apiKeys: 1,
    retentionDays: 30,
  },
  base: {
    mcpQueriesPerHour: 200,
    uploadBytes: 500 * 1024 * 1024,
    knowledgeBases: 3,
    apiKeys: 3,
    retentionDays: 90,
  },
  pro: {
    mcpQueriesPerHour: 1_000,
    uploadBytes: 5 * 1024 * 1024 * 1024,
    knowledgeBases: 10,
    apiKeys: 10,
    retentionDays: 180,
  },
  team: {
    mcpQueriesPerHour: 5_000,
    uploadBytes: 25 * 1024 * 1024 * 1024,
    knowledgeBases: 25,
    apiKeys: 25,
    retentionDays: 365,
  },
  enterprise: {
    mcpQueriesPerHour: 50_000,
    uploadBytes: 250 * 1024 * 1024 * 1024,
    knowledgeBases: 250,
    apiKeys: 250,
    retentionDays: 1095,
  },
};

export const TIER_ORDER: Tier[] = ["free", "base", "pro", "team", "enterprise"];

export function tierAtLeast(tier: Tier, min: Tier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(min);
}
