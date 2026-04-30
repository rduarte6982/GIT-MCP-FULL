import type { McpPrompt } from "./types.js";

export const nfeTroubleshootPrompt: McpPrompt = {
  name: "nfe-troubleshoot",
  description: "Diagnóstico estruturado de rejeição NF-e da SEFAZ",
  arguments: [
    { name: "rejection_code", description: "Código de rejeição da SEFAZ (ex: 539, 217)", required: true },
    { name: "uf", description: "UF emitente", required: false },
  ],
  async build(args) {
    const code = args.rejection_code;
    const uf = args.uf;
    const text = `Você é especialista em NF-e Brasil. Diagnostique a rejeição SEFAZ ${code}${uf ? ` (UF ${uf})` : ""}.

Use a tool search_context primeiro para buscar:
1. Documentação oficial da rejeição ${code}
2. Casos similares conhecidos
3. Customizing SAP J_1B* relacionado

Estruture a resposta:
- **Causa raiz mais provável**
- **Como reproduzir**
- **Customizing SAP a verificar** (J1BTAX, OB40, etc)
- **Código ABAP a inspecionar** (BADIs, classes J_1B*)
- **Próximos passos**`;

    return {
      messages: [{ role: "user", content: { type: "text", text } }],
    };
  },
};
