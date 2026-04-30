import { z } from "zod";

export const DocumentStatusSchema = z.enum([
  "pending",
  "parsing",
  "chunking",
  "embedding",
  "ready",
  "failed",
]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const DocumentSourceSchema = z.enum([
  "customer_upload",
  "sap_help",
  "sap_notes",
  "abap_code",
  "internal",
]);
export type DocumentSource = z.infer<typeof DocumentSourceSchema>;
