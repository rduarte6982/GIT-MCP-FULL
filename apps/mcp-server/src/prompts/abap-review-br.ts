import type { McpPrompt } from "./types.js";

export const abapReviewBrPrompt: McpPrompt = {
  name: "abap-review-br",
  description: "Revisa um trecho de ABAP focando em particularidades fiscais BR (J_1B*, BADIs de NF-e, CBT).",
  arguments: [
    { name: "code", description: "Trecho de ABAP a revisar", required: true },
    { name: "release", description: "Release SAP (ex: S4_2023, ECC6_EHP8)", required: false },
  ],
  async build(args) {
    const code = args.code;
    const release = args.release ?? "release não informado";
    const text = `Revise o ABAP abaixo com foco em localização Brasil. Identifique:
- Uso indevido de tabelas internas BR (J_1B*, J_1BNFE_NFE_S04 etc).
- BADIs/exits desatualizadas para o release ${release}.
- Cálculo tributário incorreto (CBT, condições, schema TAXBRA).
- Hardcodes que quebram em outros estados/UFs.
- Pontos onde \`search_context\` deve ser usado para buscar documentação.

Antes de responder, use \`search_context\` para validar os pontos críticos.

\`\`\`abap
${code}
\`\`\``;

    return { messages: [{ role: "user", content: { type: "text", text } }] };
  },
};
