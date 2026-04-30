import { FeedbackInput } from "@scm/shared/schemas";
import { db, feedback } from "@scm/db";
import { logger } from "@scm/observability";
import type { Tool } from "./types.js";

export const feedbackTool: Tool = {
  name: "record_feedback",
  description:
    "Registra feedback do agente sobre a qualidade dos resultados retornados por search_context (positivo/negativo + comentário opcional). Use isso quando o usuário sinalizar que a resposta foi útil ou não.",
  inputSchema: FeedbackInput,
  jsonSchema: {
    type: "object",
    properties: {
      trace_id: { type: "string" },
      rating: { type: "string", enum: ["positive", "negative"] },
      comment: { type: "string", maxLength: 2000 },
    },
    required: ["trace_id", "rating"],
  },

  async handler(rawInput, { auth }) {
    const input = FeedbackInput.parse(rawInput);
    await db().insert(feedback).values({
      tenantId: auth.tenantId,
      traceId: input.trace_id,
      rating: input.rating,
      comment: input.comment,
    });
    logger.info({ tenantId: auth.tenantId, traceId: input.trace_id, rating: input.rating }, "feedback.recorded");
    return {
      content: [{ type: "text", text: "Feedback recorded." }],
    };
  },
};
