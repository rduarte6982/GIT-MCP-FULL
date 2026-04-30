export interface GoldenItem {
  id: string;
  query: string;
  expectedDocuments: string[];
  expectedAnswerFragments?: string[];
  category: "nfe" | "sped" | "abap" | "tributos" | "rh-folha" | "other";
  sapRelease?: string;
}

export const goldenSetBR: GoldenItem[] = [
  {
    id: "nfe-rejection-539",
    query: "Como tratar rejeição NF-e 539 da SEFAZ?",
    expectedDocuments: ["nfe-rejections-catalog", "j1btax-customizing"],
    expectedAnswerFragments: ["duplicidade", "chave de acesso", "reenvio"],
    category: "nfe",
  },
  {
    id: "sped-bloco-h",
    query: "Configuração SPED Fiscal bloco H inventário",
    expectedDocuments: ["sped-fiscal-guide"],
    category: "sped",
  },
  {
    id: "j1bbranchx",
    query: "Tabela J_1BBRANCH para obrigações fiscais por filial",
    expectedDocuments: ["br-localization-tables"],
    expectedAnswerFragments: ["J_1BBRANCH", "filial", "CNPJ"],
    category: "tributos",
  },
];
