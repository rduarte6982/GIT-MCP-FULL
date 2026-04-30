import type { ZodSchema } from "zod";
import type { ToolContext } from "../types.js";

export interface Tool<I = unknown, O = unknown> {
  name: string;
  description: string;
  inputSchema: ZodSchema<I>;
  jsonSchema: Record<string, unknown>;
  handler: (input: unknown, ctx: ToolContext) => Promise<O>;
}
