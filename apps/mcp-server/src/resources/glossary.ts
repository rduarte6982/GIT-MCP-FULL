import type { McpResource } from "./types.js";

const URI = "sap-context://br/glossary";

const GLOSSARY_TEXT = `# Glossário SAP Brasil

## Notas Fiscais
- **NF-e**: Nota Fiscal Eletrônica (modelo 55) — documento fiscal mercantil emitido eletronicamente.
- **NFC-e**: Nota Fiscal de Consumidor Eletrônica (modelo 65) — varejo.
- **CT-e**: Conhecimento de Transporte Eletrônico — transporte de cargas.
- **MDF-e**: Manifesto Eletrônico de Documentos Fiscais.

## SPED
- **SPED Fiscal (EFD ICMS/IPI)**: arquivo digital com escrituração fiscal.
- **SPED Contribuições (EFD-Contribuições)**: PIS, COFINS, CPRB.
- **ECD**: Escrituração Contábil Digital.
- **ECF**: Escrituração Contábil Fiscal — IRPJ/CSLL.

## SAP localização Brasil
- **J_1B*** : prefixo de tabelas/objetos da localização Brasil.
- **J1BTAX**: principal transação de manutenção de impostos BR.
- **J_1BBRANCH**: cadastro de filiais (obrigações fiscais).
- **CBT (Condition-Based Tax)**: motor de cálculo de impostos por condições.
- **TAXBRA**: schema de cálculo padrão BR.

## Reforma Tributária
- **CBS**: Contribuição sobre Bens e Serviços (federal).
- **IBS**: Imposto sobre Bens e Serviços (estadual + municipal).
- **IS**: Imposto Seletivo.
- **Período de transição**: 2026-2032.
`;

export const glossaryResource: McpResource = {
  uri: URI,
  name: "Glossário SAP Brasil",
  description: "Termos essenciais de localização SAP BR (NF-e, SPED, J_1B, reforma tributária)",
  mimeType: "text/markdown",
  minTier: "free",
  matches: (uri) => uri === URI,
  async read() {
    return {
      contents: [{ uri: URI, mimeType: "text/markdown", text: GLOSSARY_TEXT }],
    };
  },
};
