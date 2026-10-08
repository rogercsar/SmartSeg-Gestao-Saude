// Catálogos técnicos do módulo Programas (PGR / PCMSO / LTCAT / Laudos)

export const WORK = { bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE", accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368" };

// Cores usuais de mapa de risco
export const TIPOS_RISCO = {
  fisico: { label: "Físico", cor: "#22C55E" },
  quimico: { label: "Químico", cor: "#EF4444" },
  biologico: { label: "Biológico", cor: "#A16207" },
  ergonomico: { label: "Ergonômico", cor: "#EAB308" },
  acidente: { label: "Acidente / mecânico", cor: "#3B82F6" },
  psicossocial: { label: "Psicossocial", cor: "#A855F7" },
};

export const EXPOSICAO = {
  habitual_permanente: "Habitual e permanente",
  habitual_intermitente: "Habitual e intermitente",
  eventual: "Eventual / ocasional",
};

// Severidade e probabilidade são gravadas SEMPRE na escala 1–5.
// A matriz 4x4 converte na exibição.
export const MATRIZES = {
  "5x5": {
    n: 5,
    severidade: ["Insignificante", "Leve", "Moderada", "Grave", "Catastrófica"],
    probabilidade: ["Rara", "Improvável", "Possível", "Provável", "Quase certa"],
    classificar: (v) => (v >= 17 ? "critico" : v >= 10 ? "alto" : v >= 5 ? "moderado" : "baixo"),
  },
  "4x4": {
    n: 4,
    severidade: ["Leve", "Moderada", "Grave", "Gravíssima"],
    probabilidade: ["Improvável", "Possível", "Provável", "Muito provável"],
    classificar: (v) => (v >= 9 ? "critico" : v >= 6 ? "alto" : v >= 3 ? "moderado" : "baixo"),
  },
};

export const NIVEIS = {
  baixo: { label: "Baixo", cor: "#22C55E", acao: "Manter as medidas de controle e o monitoramento." },
  moderado: { label: "Moderado", cor: "#EAB308", acao: "Melhorar os controles; incluir no plano de ação com prazo definido." },
  alto: { label: "Alto", cor: "#F97316", acao: "Ação prioritária: implantar controles adicionais em curto prazo." },
  critico: { label: "Crítico", cor: "#EF4444", acao: "Intervenção imediata; avaliar interrupção da atividade até o controle." },
};

const P5_P4 = [0, 1, 2, 3, 4, 4];
const P4_P5 = [0, 1, 2, 3, 5];
export const paraEscala = (v, matriz) => (!v ? 0 : matriz === "4x4" ? P5_P4[v] : v);
export const deEscala = (v, matriz) => (!v ? 0 : matriz === "4x4" ? P4_P5[v] : v);

export function avaliar(risco, matriz = "5x5") {
  const m = MATRIZES[matriz];
  const s = paraEscala(risco?.severidade, matriz);
  const p = paraEscala(risco?.probabilidade, matriz);
  if (!s || !p) return null;
  const nivel = m.classificar(s * p);
  return { s, p, valor: s * p, nivel, ...NIVEIS[nivel] };
}

export const NR15_ANEXOS = {
  "1": "Anexo 1 — Ruído contínuo ou intermitente",
  "2": "Anexo 2 — Ruído de impacto",
  "3": "Anexo 3 — Calor",
  "5": "Anexo 5 — Radiações ionizantes",
  "6": "Anexo 6 — Condições hiperbáricas",
  "7": "Anexo 7 — Radiações não ionizantes",
  "8": "Anexo 8 — Vibrações",
  "9": "Anexo 9 — Frio",
  "10": "Anexo 10 — Umidade",
  "11": "Anexo 11 — Agentes químicos (limites de tolerância)",
  "12": "Anexo 12 — Poeiras minerais",
  "13": "Anexo 13 — Agentes químicos (avaliação qualitativa)",
  "13-A": "Anexo 13-A — Benzeno",
  "14": "Anexo 14 — Agentes biológicos",
};
export const GRAUS_INSALUBRIDADE = { minimo: "Mínimo (10%)", medio: "Médio (20%)", maximo: "Máximo (40%)" };

export const NR16_ANEXOS = {
  "1": "Anexo 1 — Explosivos",
  "2": "Anexo 2 — Inflamáveis",
  "3": "Anexo 3 — Roubos ou violência física (segurança pessoal/patrimonial)",
  "4": "Anexo 4 — Energia elétrica",
  "5": "Anexo 5 — Motocicleta",
  radiacao: "Radiações ionizantes / substâncias radioativas (Portaria MTE 518/2003)",
};

export const MOMENTOS_EXAME = {
  admissional: "Admissional",
  periodico: "Periódico",
  retorno: "Retorno ao trabalho",
  mudanca_risco: "Mudança de risco",
  demissional: "Demissional",
};

export const DOCUMENTOS = {
  pgr: { label: "PGR", nome: "Programa de Gerenciamento de Riscos", base: "NR-1 (GRO, cap. 1.5 — vigência 26/05/2026) e NR-9" },
  pcmso: { label: "PCMSO", nome: "Programa de Controle Médico de Saúde Ocupacional", base: "NR-7" },
  ltcat: { label: "LTCAT", nome: "Laudo Técnico das Condições Ambientais do Trabalho", base: "Lei 8.213/91 art. 58, Decreto 3.048/99 (Anexo IV) e IN PRES/INSS 128/2022" },
  insalubridade: { label: "Insalubridade", nome: "Laudo de Insalubridade", base: "NR-15 e CLT arts. 189 a 192" },
  periculosidade: { label: "Periculosidade", nome: "Laudo de Periculosidade", base: "NR-16 e CLT art. 193" },
};

export const CONSELHOS = { CREA: "CREA", CRM: "CRM", MTE: "Registro MTE (técnico de segurança)", outro: "Outro" };

export function novoToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const soNumeros = (s) => String(s || "").replace(/\D/g, "");