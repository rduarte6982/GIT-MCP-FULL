import type { Tier } from "@scm/shared/schemas";
import { tierAtLeast } from "@scm/shared/constants";
import { glossaryResource } from "./glossary.js";
import { nfeSchemaResource } from "./nfe-schema.js";
import { reformTimelineResource } from "./reform-timeline.js";
import type { McpResource } from "./types.js";

export const resources: McpResource[] = [
  glossaryResource,
  nfeSchemaResource,
  reformTimelineResource,
];

export function listResourcesForTier(tier: Tier) {
  return resources
    .filter((r) => tierAtLeast(tier, r.minTier))
    .map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    }));
}

export function findResource(uri: string): McpResource | undefined {
  return resources.find((r) => r.matches(uri));
}
