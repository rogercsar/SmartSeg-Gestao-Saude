// Origem: referencia-base44/src/lib/precos.js — preços: planos de uso, créditos, faixas de vidas (legado), fatura
// Tabela de preços por vidas ativas — faixas PROGRESSIVAS (cada faixa cobra só as vidas dentro dela).
// Mantenha idêntica a FAIXAS_VIDAS em base44/functions/ai-invoke/entry.ts (o servidor é quem cobra).

export const FAIXAS_VIDAS = [
  { ate: 100, fixo: 149, creditos_fixos: 300 },
  { ate: 1000, preco: 1.2, creditos: 3 },
  { ate: 5000, preco: 1.05, creditos: 2.5 },
  { ate: 20000, preco: 0.9, creditos: 2 },
  { ate: 50000, preco: 0.8, creditos: 1.5 },
  { ate: Infinity, preco: 0.7, creditos: 1 },
];
export const PRECO_EXCEDENTE = 0.4;
export const CREDITOS_GRATUITO = 30;

export function calcularPlanoVidas(vidas) {
  const v = Math.max(0, Math.floor(Number(vidas) || 0));
  if (!v) return { vidas: 0, valor: 0, creditos: CREDITOS_GRATUITO, faixas: [], preco_medio: 0 };
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

export const brl = (v, dec = 2) => (v === null || v === undefined || isNaN(v) ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: dec, maximumFractionDigits: dec }));
export const num = (v) => Number(v || 0).toLocaleString("pt-BR");
export const descFaixa = (f) => (f.fixo !== null && f.fixo !== undefined ? `Até ${num(f.ate)} vidas — valor fixo` : `${num(f.de)} a ${f.ate === Infinity || f.ate === null ? "∞" : num(f.ate)} vidas`);

export const NOMES_RECURSO = {
  chat_nr: "Chat NR", normas_cnae: "NRs por CNAE", dds: "DDS", certificado: "Certificado", acidente_extracao: "Acidente — leitura do relato",
  auto_extracao: "Auto de infração — leitura", atestado_leitura: "Atestado — leitura", pgr_riscos: "PGR — riscos", riscos_sugestao: "Inventário de riscos",
  risco_caracterizacao: "Caracterização de risco", foto_riscos: "Análise de foto", pcmso_exames: "PCMSO — exames", laudo_enquadramento: "Enquadramento de laudos",
  levantamento_analise: "Levantamento — análise", documento_texto: "Textos de documento", relatorio_saude: "Relatório de saúde", treinamentos_matriz: "Matriz de treinamentos",
  checklist_modelo: "Checklist com IA", cipa_ata: "Ata da CIPA", acidente_investigacao: "Investigação de acidente", auto_defesa: "Defesa de auto de infração",
  zeca: "Canal de escuta", zeca_risco: "Canal de escuta — triagem", transcricao_zeca: "Transcrição de áudio", transcricao_acidente: "Transcrição de áudio",
};

// Cobrança pelo uso ("pague pelo que produz") — mantenha igual a ai-invoke, assinar e faturamento
export const PLANOS_USO = {
  tecnico: { nome: "Técnico", base: 79, creditos: 200, usuarios: 1, empresas: 15, excedente: 0.4, aso: 0.4 },
  consultoria: { nome: "Consultoria", base: 199, creditos: 600, usuarios: 5, empresas: null, excedente: 0.35, aso: 0.4 },
  clinica: { nome: "Clínica", base: 299, creditos: 600, usuarios: 10, empresas: null, excedente: 0.35, aso: 0.4 },
};
export function faturaUso(plano, creditosUsados, asos = 0) {
  const p = PLANOS_USO[plano] || PLANOS_USO.tecnico;
  const extra = Math.max(0, creditosUsados - p.creditos);
  const valor = p.base + extra * p.excedente + asos * p.aso;
  return { plano: p.nome, base: p.base, creditos_extras: extra, valor_extras: Math.round(extra * p.excedente * 100) / 100, valor_asos: Math.round(asos * p.aso * 100) / 100, total: Math.round(valor * 100) / 100 };
}
