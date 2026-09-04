export type Prontuario = {
  id: string;
  pet: string;
  tutor: string;
  clinica: string;
  data: string;
  rt: string;
  has_conflict: boolean;
  motivo: string | null;
  travaTermica: "ok" | "alerta" | "violada";
  tempMin: number;
  tempMax: number;
  status: "pendente" | "aprovado" | "reprovado";
};

export const prontuarios: Prontuario[] = [
  {
    id: "PRT-10241",
    pet: "Thor",
    tutor: "Marina Cardoso",
    clinica: "PetPrev Pituba",
    data: "2026-08-28T09:12:00Z",
    rt: "Dra. Helena Braga",
    has_conflict: true,
    motivo: "Divergência entre diagnóstico e prescrição de antimicrobiano",
    travaTermica: "violada",
    tempMin: 1.8,
    tempMax: 11.4,
    status: "pendente",
  },
  {
    id: "PRT-10240",
    pet: "Nina",
    tutor: "Rafael Lopes",
    clinica: "PetPrev Barra",
    data: "2026-08-28T08:40:00Z",
    rt: "Dr. Caio Menezes",
    has_conflict: true,
    motivo: "Vacina aplicada fora da janela de validade do lote",
    travaTermica: "alerta",
    tempMin: 2.1,
    tempMax: 8.6,
    status: "pendente",
  },
  {
    id: "PRT-10238",
    pet: "Bidu",
    tutor: "Ana Paula Reis",
    clinica: "PetPrev Itaigara",
    data: "2026-08-27T17:05:00Z",
    rt: "Dra. Helena Braga",
    has_conflict: false,
    motivo: null,
    travaTermica: "ok",
    tempMin: 2.6,
    tempMax: 7.2,
    status: "aprovado",
  },
  {
    id: "PRT-10236",
    pet: "Mel",
    tutor: "Jorge Nascimento",
    clinica: "PetPrev Rio Vermelho",
    data: "2026-08-27T14:22:00Z",
    rt: "Dr. Caio Menezes",
    has_conflict: true,
    motivo: "Assinatura digital do RT ausente na versão final",
    travaTermica: "ok",
    tempMin: 3.0,
    tempMax: 7.8,
    status: "reprovado",
  },
  {
    id: "PRT-10233",
    pet: "Simba",
    tutor: "Letícia Andrade",
    clinica: "PetPrev Pituba",
    data: "2026-08-27T11:47:00Z",
    rt: "Dra. Helena Braga",
    has_conflict: false,
    motivo: null,
    travaTermica: "alerta",
    tempMin: 2.0,
    tempMax: 8.9,
    status: "pendente",
  },
  {
    id: "PRT-10229",
    pet: "Amora",
    tutor: "Diego Fontes",
    clinica: "PetPrev Barra",
    data: "2026-08-26T16:31:00Z",
    rt: "Dra. Sofia Nunes",
    has_conflict: false,
    motivo: null,
    travaTermica: "ok",
    tempMin: 2.9,
    tempMax: 7.1,
    status: "aprovado",
  },
];

export type Protocolo = {
  id: string;
  nome: string;
  versao: string;
  autor: string;
  atualizado: string;
  escopo: string;
  status: "pendente" | "aprovado" | "reprovado";
  mudancas: string[];
};

export const protocolos: Protocolo[] = [
  {
    id: "PCL-08",
    nome: "Protocolo Vacinal Felino",
    versao: "v3.2",
    autor: "Dra. Sofia Nunes",
    atualizado: "2026-08-26",
    escopo: "Rede completa",
    status: "pendente",
    mudancas: [
      "Reforço V4 antecipado para 21 dias",
      "Nova checagem de trava térmica pré-aplicação",
    ],
  },
  {
    id: "PCL-14",
    nome: "Triagem de Emergência Canina",
    versao: "v1.9",
    autor: "Dr. Caio Menezes",
    atualizado: "2026-08-24",
    escopo: "Unidades 24h",
    status: "pendente",
    mudancas: ["Escala de dor obrigatória na admissão"],
  },
  {
    id: "PCL-02",
    nome: "Cadeia de Frio de Imunobiológicos",
    versao: "v5.0",
    autor: "Dra. Helena Braga",
    atualizado: "2026-08-19",
    escopo: "Rede completa",
    status: "aprovado",
    mudancas: ["Faixa térmica travada em 2,0 °C a 8,0 °C"],
  },
];

export type CelulaH3 = {
  h3: string;
  bairro: string;
  atendimentos: number;
  conflitos: number;
  col: number;
  row: number;
};

export const celulasH3: CelulaH3[] = [
  { h3: "8a2a1072b59ffff", bairro: "Pituba", atendimentos: 84, conflitos: 6, col: 2, row: 1 },
  { h3: "8a2a1072b5affff", bairro: "Itaigara", atendimentos: 61, conflitos: 2, col: 3, row: 1 },
  { h3: "8a2a1072b47ffff", bairro: "Barra", atendimentos: 112, conflitos: 9, col: 1, row: 2 },
  { h3: "8a2a1072b4fffff", bairro: "Rio Vermelho", atendimentos: 47, conflitos: 1, col: 2, row: 2 },
  {
    h3: "8a2a1072b6bffff",
    bairro: "Caminho das Árvores",
    atendimentos: 29,
    conflitos: 0,
    col: 3,
    row: 2,
  },
  { h3: "8a2a1072b0fffff", bairro: "Graça", atendimentos: 73, conflitos: 4, col: 1, row: 3 },
  { h3: "8a2a1072b17ffff", bairro: "Ondina", atendimentos: 18, conflitos: 0, col: 2, row: 3 },
  { h3: "8a2a1072b23ffff", bairro: "Costa Azul", atendimentos: 55, conflitos: 3, col: 3, row: 3 },
  { h3: "8a2a1072b31ffff", bairro: "Stiep", atendimentos: 12, conflitos: 1, col: 4, row: 2 },
  { h3: "8a2a1072b3bffff", bairro: "Imbuí", atendimentos: 38, conflitos: 2, col: 4, row: 3 },
];

export const mrrSerie = [
  { mes: "Mar", mrr: 182 },
  { mes: "Abr", mrr: 201 },
  { mes: "Mai", mrr: 226 },
  { mes: "Jun", mrr: 247 },
  { mes: "Jul", mrr: 281 },
  { mes: "Ago", mrr: 312 },
];

export const atendimentosHora = [
  { hora: "07h", total: 4 },
  { hora: "09h", total: 12 },
  { hora: "11h", total: 19 },
  { hora: "13h", total: 9 },
  { hora: "15h", total: 21 },
  { hora: "17h", total: 16 },
  { hora: "19h", total: 7 },
];
