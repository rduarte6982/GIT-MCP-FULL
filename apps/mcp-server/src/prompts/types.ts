import type { AuthContext } from "../types.js";

export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface McpPrompt {
  name: string;
  description: string;
  arguments: PromptArgument[];
  build(args: Record<string, string>, auth: AuthContext): Promise<{
    messages: Array<{
      role: "user" | "assistant";
      content: { type: "text"; text: string };
    }>;
  }>;
}
