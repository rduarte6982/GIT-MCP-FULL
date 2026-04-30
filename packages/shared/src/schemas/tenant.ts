import { z } from "zod";

export const TierSchema = z.enum(["free", "base", "pro", "team", "enterprise"]);
export type Tier = z.infer<typeof TierSchema>;

export const MemberRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);
export type MemberRole = z.infer<typeof MemberRoleSchema>;

export const TenantMetadataSchema = z
  .object({
    defaultSapRelease: z.string().optional(),
    defaultLanguage: z.string().optional(),
  })
  .partial();
export type TenantMetadata = z.infer<typeof TenantMetadataSchema>;
