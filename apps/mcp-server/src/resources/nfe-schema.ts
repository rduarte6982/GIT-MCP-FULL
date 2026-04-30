import type { McpResource } from "./types.js";

const URI = "sap-context://nfe/schema/4.00";

export const nfeSchemaResource: McpResource = {
  uri: URI,
  name: "Schema NF-e 4.00",
  description: "Resumo do schema XML da NF-e versão 4.00 (campos principais e validações).",
  mimeType: "text/markdown",
  minTier: "base",
  matches: (uri) => uri === URI,
  async read() {
    const text = `# NF-e 4.00 — Resumo do Schema

## Estrutura raiz
\`\`\`
nfeProc
  └── NFe
       ├── infNFe (Id = "NFe" + chave de acesso de 44 dígitos)
       │    ├── ide          (identificação: cUF, natOp, mod, serie, nNF, dhEmi, tpNF, idDest, cMunFG, tpEmis, cDV, tpAmb, finNFe, indFinal, indPres, procEmi)
       │    ├── emit         (emitente: CNPJ/CPF, xNome, IE, CRT, ender)
       │    ├── dest         (destinatário: CNPJ/CPF, xNome, IE/indIEDest, ISUF, email)
       │    ├── det          (itens: array de itens com prod + imposto)
       │    ├── total        (ICMSTot, retTrib)
       │    ├── transp       (modFrete, transporta, vol)
       │    ├── cobr         (fat + dup)
       │    ├── pag          (formas de pagamento)
       │    └── infAdic      (infCpl, obsCont, obsFisco, procRef)
       └── Signature (assinatura digital ICP-Brasil)
\`\`\`

## Validações comuns que disparam rejeição
- **Rejeição 217**: NF-e não consta na base da SEFAZ (consulta antes de cancelar).
- **Rejeição 539**: Duplicidade de NF-e (chave de acesso já autorizada).
- **Rejeição 204**: Duplicidade de NF-e (CNPJ + série + número + ambiente).
- **Rejeição 233**: Município de destino divergente da UF.
- **Rejeição 252**: Ambiente informado divergente do tpAmb da chave.

## Mapeamento SAP -> XML
- Cabeçalho: tabelas \`J_1BNFDOC\`, \`J_1BNFLIN\`.
- Itens: \`J_1BNFLIN\` + impostos calculados via CBT.
- IE/CNPJ destinatário: \`KNA1\`, \`KNA1.STCD1\` (CNPJ/CPF).
`;
    return { contents: [{ uri: URI, mimeType: "text/markdown", text }] };
  },
};
