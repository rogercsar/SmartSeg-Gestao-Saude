// Regras de créditos e cobrança (origem: referencia-base44/base44/functions/ai-invoke/entry.ts)

export const PLANOS = { gratuito: 30, essencial: 200, profissional: 750, equipe: 2500 };

export const FAIXAS_VIDAS = [
  { ate: 100, fixo: 149, creditos_fixos: 300 },
  { ate: 1000, preco: 1.2, creditos: 3 },
  { ate: 5000, preco: 1.05, creditos: 2.5 },
  { ate: 20000, preco: 0.9, creditos: 2 },
  { ate: 50000, preco: 0.8, creditos: 1.5 },
  { ate: Infinity, preco: 0.7, creditos: 1 },
];

export const PLANOS_USO = {
  tecnico: { nome: "Técnico", base: 79, creditos: 200, usuarios: 1, empresas: 15, excedente: 0.4, aso: 0.4 },
  consultoria: { nome: "Consultoria", base: 199, creditos: 600, usuarios: 5, empresas: null, excedente: 0.35, aso: 0.4 },
  clinica: { nome: "Clínica", base: 299, creditos: 600, usuarios: 10, empresas: null, excedente: 0.35, aso: 0.4 },
};

export const PACOTES = [
  { id: "p250", creditos: 250, valor: 89 },
  { id: "p600", creditos: 600, valor: 179 },
  { id: "p1500", creditos: 1500, valor: 397 },
];

export const CUSTOS = {
  chat_nr: 1,
  normas_cnae: 1,
  dds: 1,
  certificado: 1,
  acidente_extracao: 1,
  auto_extracao: 1,
  pgr_riscos: 2,
  acidente_investigacao: 3,
  auto_defesa: 3,
  // Módulo Programas (PGR/PCMSO/LTCAT/Laudos)
  riscos_sugestao: 2,
  risco_caracterizacao: 2,
  foto_riscos: 2,
  pcmso_exames: 2,
  laudo_enquadramento: 2,
  levantamento_analise: 2,
  plano_acao_ia: 2,
  documento_texto: 3,
  atestado_leitura: 1,
  relatorio_saude: 3,
  treinamentos_matriz: 2,
  checklist_modelo: 1,
  cipa_ata: 1,
  zeca: 0, // Espaço Zela: acolhimento nunca é cobrado
  zeca_risco: 0, // triagem de risco: nunca é bloqueada
  transcricao_zeca: 0,
  transcricao_acidente: 0,
};

export const PRECO_EXCEDENTE = 0.4;

export const LIMITE_DIARIO = 150;

export function calcularPlanoVidas(vidas) {
  const v = Math.max(0, Math.floor(Number(vidas) || 0));
  if (!v) return { vidas: 0, valor: 0, creditos: PLANOS.gratuito, faixas: [], preco_medio: 0 };
  let valor = 0, creditos = 0, de = 1;
  const faixas = [];
  for (const f of FAIXAS_VIDAS) {
    if (v < de) break;
    const ate = Math.min(v, f.ate);
    const n = ate - de + 1;
    const fv = f.fixo !== undefined ? f.fixo : n * f.preco;
    const fc = f.fixo !== undefined ? f.creditos_fixos : Math.round(n * f.creditos);
    faixas.push({ de, ate, vidas: n, preco: f.fixo !== undefined ? null : f.preco, fixo: f.fixo ?? null, valor: Math.round(fv * 100) / 100, creditos: fc });
    valor += fv; creditos += fc;
    de = f.ate + 1;
  }
  valor = Math.round(valor * 100) / 100;
  return { vidas: v, valor, creditos, faixas, preco_medio: Math.round((valor / v) * 10000) / 10000 };
}