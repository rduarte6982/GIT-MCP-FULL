import type { Tier } from "@scm/shared/schemas";

export interface AuthContext {
  tenantId: string;
  apiKeyId: string;
  tier: Tier;
  allowedKbIds: string[];
  defaultSapRelease?: string;
}

export interface ToolContext {
  auth: AuthContext;
  ctx: McpRequestContext;
}

export interface McpRequestContext {
  headers?: Record<string, string | undefined>;
  requestId?: string;
}
