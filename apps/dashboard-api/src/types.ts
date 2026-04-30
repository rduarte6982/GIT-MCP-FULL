import type { Tier, MemberRole } from "@scm/shared/schemas";

export interface AppVariables {
  userId: string;
  userEmail: string;
  tenantId: string;
  tier: Tier;
  memberRole: MemberRole;
}
