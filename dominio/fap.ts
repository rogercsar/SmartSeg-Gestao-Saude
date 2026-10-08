// Origem: referencia-base44/src/lib/fap.js — simulação do FAP (Resolução CNP 1.329/2017)
// Cálculo do FAP (metodologia da Resolução CNP nº 1.329/2017, vigente a partir do FAP 2019).
// IC = (0,50 × percentil gravidade + 0,35 × percentil frequência + 0,15 × percentil custo) × 0,02  → 0 a 2
// IC ≤ 1 (bônus): FAP = 0,5 + 0,5 × IC   |   IC > 1 (malus): FAP = IC
// Travas: morte/invalidez permanente (exceto trajeto) ou rotatividade média > 75% → sem bônus (FAP mínimo 1,0000)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const n = (v) => { const x = Number(String(v ?? "").replace(",", ".")); return isFinite(x) ? x : 0; };
export const r4 = (v) => Math.round(v * 10000) / 10000;

export function indiceComposto({ pg, pf, pc }) {
  return (0.5 * clamp(n(pg), 0, 100) + 0.35 * clamp(n(pf), 0, 100) + 0.15 * clamp(n(pc), 0, 100)) * 0.02;
}

// Percentil de ordem dentro da subclasse CNAE: 100 × (nº de ordem − 1) / (nº de estabelecimentos − 1)
export const percentilOrdem = (ordem, total) => (n(total) > 1 ? clamp((100 * (n(ordem) - 1)) / (n(total) - 1), 0, 100) : 0);

export function calcularFap({ pg, pf, pc, trava_morte, rotatividade }) {
  const ic = indiceComposto({ pg, pf, pc });
  let fap = ic <= 1 ? 0.5 + 0.5 * ic : ic;
  const travaRot = n(rotatividade) > 75;
  const travado = fap < 1 && (!!trava_morte || travaRot);
  if (travado) fap = 1;
  fap = r4(clamp(fap, 0.5, 2));
  return { ic: r4(ic), fap, faixa: fap < 1 ? "bônus" : fap > 1 ? "malus" : "neutro", travado, motivo_trava: travado ? (trava_morte ? "morte ou invalidez permanente" : "rotatividade acima de 75%") : "" };
}

// Contribuição anual do GILRAT (RAT ajustado) sobre a folha
export function contribuicao({ rat, fap, folha_anual }) {
  const ajustado = n(rat) * n(fap);
  return { rat_ajustado: r4(ajustado), valor: (n(folha_anual) * ajustado) / 100 };
}

// Compara situação atual × cenário simulado
export function simularFap({ atual, cenario, rat, folha_anual }) {
  const a = calcularFap(atual);
  const s = calcularFap(cenario);
  const ca = contribuicao({ rat, fap: a.fap, folha_anual });
  const cs = contribuicao({ rat, fap: s.fap, folha_anual });
  const minFap = cenario.trava_morte || n(cenario.rotatividade) > 75 ? 1 : 0.5;
  const cm = contribuicao({ rat, fap: minFap, folha_anual });
  return {
    atual: { ...a, ...ca },
    simulado: { ...s, ...cs },
    minimo: { fap: minFap, ...cm, limitado_por_trava: minFap === 1 },
    economia_simulada: ca.valor - cs.valor,
    economia_maxima: ca.valor - cm.valor,
    reducao_pct: ca.valor ? ((ca.valor - cs.valor) / ca.valor) * 100 : 0,
  };
}

export const CENARIOS = {
  reduz25: { label: "Reduzir 25% nos percentis", fn: (a) => ({ ...a, pg: n(a.pg) * 0.75, pf: n(a.pf) * 0.75, pc: n(a.pc) * 0.75 }) },
  reduz50: { label: "Reduzir 50% nos percentis", fn: (a) => ({ ...a, pg: n(a.pg) * 0.5, pf: n(a.pf) * 0.5, pc: n(a.pc) * 0.5 }) },
  sem_gravidade: { label: "Zerar eventos graves (gravidade)", fn: (a) => ({ ...a, pg: 0 }) },
  sem_trava: { label: "Remover travas", fn: (a) => ({ ...a, trava_morte: false, rotatividade: Math.min(n(a.rotatividade), 75) }) },
  melhor: { label: "Melhor cenário (tudo zerado)", fn: (a) => ({ ...a, pg: 0, pf: 0, pc: 0, trava_morte: false, rotatividade: Math.min(n(a.rotatividade), 75) }) },
};
