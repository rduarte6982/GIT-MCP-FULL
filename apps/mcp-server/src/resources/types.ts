import type { Tier } from "@scm/shared/schemas";
import type { AuthContext } from "../types.js";

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType: string;
  minTier: Tier;
  matches(uri: string): boolean;
  read(uri: string, auth: AuthContext): Promise<{
    contents: Array<{ uri: string; mimeType: string; text: string }>;
  }>;
}
