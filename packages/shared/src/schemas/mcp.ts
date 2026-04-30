import { z } from "zod";

export const EntityRefSchema = z.object({
  kind: z.string(),
  name: z.string(),
});
export type EntityRef = z.infer<typeof EntityRefSchema>;

export const SearchContextInput = z.object({
  query: z.string().min(1).max(2000),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
  sap_release: z
    .string()
    .regex(/^[A-Z0-9_]+$/)
    .optional(),
  max_results: z.number().int().min(1).max(20).default(8),
  filters: z
    .object({
      module: z.string().optional(),
      entity_refs: z.array(EntityRefSchema).optional(),
    })
    .optional(),
});
export type SearchContextInput = z.infer<typeof SearchContextInput>;

export const FeedbackInput = z.object({
  trace_id: z.string().min(1),
  rating: z.enum(["positive", "negative"]),
  comment: z.string().max(2000).optional(),
});
export type FeedbackInput = z.infer<typeof FeedbackInput>;

export const RetrievedChunkSchema = z.object({
  id: z.string().uuid(),
  score: z.number(),
  content: z.string(),
  context_prefix: z.string().nullable(),
  source: z.object({
    title: z.string(),
    url: z.string().nullable(),
    section: z.array(z.string()).nullable(),
    page: z.number().nullable(),
  }),
  entities: z.array(EntityRefSchema),
});
export type RetrievedChunk = z.infer<typeof RetrievedChunkSchema>;
