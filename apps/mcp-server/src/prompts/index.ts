import { nfeTroubleshootPrompt } from "./nfe-troubleshoot.js";
import { abapReviewBrPrompt } from "./abap-review-br.js";

export const prompts = [nfeTroubleshootPrompt, abapReviewBrPrompt];
export type { McpPrompt } from "./types.js";
