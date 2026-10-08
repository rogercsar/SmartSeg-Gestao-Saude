// @ts-nocheck — TIPAGEM PENDENTE (9 avisos do TypeScript): lógica validada no protótipo e coberta pelos testes; adicionar tipos ao portar.
// Origem: referencia-base44/src/lib/epidemiologia.js — perfil epidemiológico e absenteísmo
// Perfil epidemiológico e absenteísmo — cálculos puros a partir dos atestados.
import { addDias, diffDias, fimAfastamento, grupoCid, riscoNtep, hojeLocal } from "./afastamentos";

export const CAPITULOS_CID = {
  A: "I — Infecciosas e parasitárias", B: "I — Infecciosas e parasitárias", C: "II — Neoplasias", D: "II/III — Neoplasias e sangue",
  E: "IV — Endócrinas e metabólicas", F: "V — Transtornos mentais e comportamentais", G: "VI — Sistema nervoso",
  H: "VII/VIII — Olhos e ouvidos", I: "IX — Circulatórias", J: "X — Respiratórias", K: "XI — Digestivas", L: "XII — Pele",
  M: "XIII — Osteomusculares e conjuntivo", N: "XIV — Geniturinárias", O: "XV — Gravidez, parto e puerpério",
  R: "XVIII — Sintomas e achados anormais", S: "XIX — Lesões e traumatismos", T: "XIX — Lesões e envenenamentos",
  V: "XX — Causas externas", W: "XX — Causas externas", X: "XX — Causas externas", Y: "XX — Causas externas", Z: "XXI — Fatores/contato com serviços",
};
export const capitulo = (cid) => (cid ? CAPITULOS_CID[String(cid)[0].toUpperCase()] || "Outros" : "Sem CID informado");

export const FAIXAS = [[0, 24, "até 24"], [25, 34, "25–34"], [35, 44, "35–44"], [45, 54, "45–54"], [55, 200, "55+"]];
export function idade(nasc, ref) {
  if (!nasc) return null;
  const n = new Date(nasc + "T12:00:00Z"), r = new Date(ref + "T12:00:00Z");
  let i = r.getUTCFullYear() - n.getUTCFullYear();
  if (r.getUTCMonth() < n.getUTCMonth() || (r.getUTCMonth() === n.getUTCMonth() && r.getUTCDate() < n.getUTCDate())) i--;
  return i;
}
export const faixa = (i) => (i === null ? "Não informado" : FAIXAS.find(([a, b]) => i >= a && i <= b)?.[2] || "Não informado");

// dias do afastamento que caem dentro do período
export function diasNoPeriodo(a, inicio, fim) {
  const ini = a.data_inicio > inicio ? a.data_inicio : inicio;
  const f = fimAfastamento(a);
  const fi = f < fim ? f : fim;
  return fi < ini ? 0 : diffDias(fi, ini) + 1;
}

function agrupar(itens, chave, total) {
  const m = {};
  itens.forEach((x) => {
    const k = chave(x) ?? "—";
    m[k] ||= { chave: k, atestados: 0, dias: 0, pessoas: new Set() };
    m[k].atestados++;
    m[k].dias += x._dias;
    m[k].pessoas.add(x._pessoa);
  });
  return Object.values(m)
    .map((v) => ({ chave: v.chave, atestados: v.atestados, dias: v.dias, pessoas: v.pessoas.size, pct_dias: total ? (v.dias / total) * 100 : 0 }))
    .sort((a, b) => b.dias - a.dias);
}

export function perfilEpidemiologico({ atestados, trabalhadores, cargos, setores, cats = [], empresa = {}, inicio, fim, setorId = "" }) {
  const trab = Object.fromEntries(trabalhadores.map((t) => [t.id, t]));
  const cargo = Object.fromEntries(cargos.map((c) => [c.id, c]));
  const setorNome = Object.fromEntries(setores.map((s) => [s.id, s.nome]));
  const setorDe = (t) => t?.setor_id || cargo[t?.cargo_id]?.setor_id || "";
  const dentroSetor = (t) => !setorId || setorDe(t) === setorId;

  const pop = trabalhadores.filter(dentroSetor);
  const efetivo = setorId ? pop.length : (pop.length || Number(empresa.vinculos_medios) || 0);
  const diasPeriodo = diffDias(fim, inicio) + 1;

  const itens = atestados
    .filter((a) => a.data_inicio && Number(a.dias) > 0 && a.data_inicio <= fim && fimAfastamento(a) >= inicio)
    .map((a) => ({ ...a, _t: trab[a.trabalhador_id], _dias: diasNoPeriodo(a, inicio, fim), _pessoa: a.trabalhador_id || a.trabalhador_nome }))
    .filter((a) => dentroSetor(a._t));

  const diasPerdidos = itens.reduce((s, a) => s + a._dias, 0);
  const pessoas = new Set(itens.map((a) => a._pessoa));
  const porPessoa = {};
  itens.forEach((a) => { porPessoa[a._pessoa] ||= { nome: a.trabalhador_nome, atestados: 0, dias: 0, cargo: cargo[a._t?.cargo_id]?.nome_cargo || "" }; porPessoa[a._pessoa].atestados++; porPessoa[a._pessoa].dias += a._dias; });

  // série mensal
  const meses = [];
  let cursor = inicio.slice(0, 7);
  while (cursor <= fim.slice(0, 7) && meses.length < 36) {
    const mi = cursor + "-01";
    const [y, m] = cursor.split("-").map(Number);
    const mf = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    const ini = mi < inicio ? inicio : mi, f = mf > fim ? fim : mf;
    const dm = itens.reduce((s, a) => s + diasNoPeriodo(a, ini, f), 0);
    const nd = diffDias(f, ini) + 1;
    meses.push({ mes: cursor, atestados: itens.filter((a) => a.data_inicio.slice(0, 7) === cursor).length, dias: dm, taxa: efetivo ? (dm / (efetivo * nd)) * 100 : null });
    cursor = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  }

  const ocup = itens.filter((a) => a.motivo === "trabalho" || a.motivo === "trajeto");
  const longos = itens.filter((a) => Number(a.dias) > 15);
  const catsPeriodo = cats.filter((c) => (c.data_hora || "").slice(0, 10) >= inicio && (c.data_hora || "").slice(0, 10) <= fim);

  // alertas de concentração (mesmo capítulo no mesmo setor, 3+ casos)
  const alertas = [];
  const conc = agrupar(itens.filter((a) => a.cid), (a) => `${setorDe(a._t)}|${String(a.cid)[0].toUpperCase()}`, diasPerdidos);
  conc.forEach((g) => {
    if (g.atestados >= 3 && g.pessoas >= 2) {
      const [s, l] = g.chave.split("|");
      alertas.push(`${g.pessoas} colaboradores / ${g.atestados} atestados por ${CAPITULOS_CID[l] || l} no setor ${setorNome[s] || "sem setor"} — investigar nexo com o trabalho e revisar o PGR.`);
    }
  });
  const reincidentes = Object.values(porPessoa).filter((p) => p.atestados >= 3).sort((a, b) => b.atestados - a.atestados);
  if (reincidentes.length) alertas.push(`${reincidentes.length} colaborador(es) com 3 ou mais atestados no período — avaliar em consulta clínica ocupacional.`);
  const ntep = itens.filter((a) => a.motivo === "doenca" && Number(a.dias) > 15 && riscoNtep(grupoCid(a.cid)));
  if (ntep.length) alertas.push(`${ntep.length} afastamento(s) por doença comum acima de 15 dias com CID de nexo epidemiológico frequente (risco de NTEP e impacto no FAP).`);

  const comCid = itens.filter((a) => a.cid).length;

  return {
    inicio, fim, dias_periodo: diasPeriodo, efetivo, setor: setorId ? setorNome[setorId] : "Todos",
    indicadores: {
      atestados: itens.length,
      dias_perdidos: diasPerdidos,
      colaboradores_afastados: pessoas.size,
      taxa_absenteismo: efetivo ? (diasPerdidos / (efetivo * diasPeriodo)) * 100 : null,
      indice_frequencia: efetivo ? itens.length / efetivo : null,
      prevalencia: efetivo ? (pessoas.size / efetivo) * 100 : null,
      duracao_media: itens.length ? diasPerdidos / itens.length : null,
      dias_por_colaborador: efetivo ? diasPerdidos / efetivo : null,
      afastamentos_longos: longos.length,
      ocupacionais: ocup.length,
      dias_ocupacionais: ocup.reduce((s, a) => s + a._dias, 0),
      cats: catsPeriodo.length,
      cobertura_cid: itens.length ? (comCid / itens.length) * 100 : null,
    },
    por_capitulo: agrupar(itens, (a) => capitulo(a.cid), diasPerdidos),
    por_cid: agrupar(itens.filter((a) => a.cid), (a) => grupoCid(a.cid), diasPerdidos).slice(0, 10),
    por_setor: agrupar(itens, (a) => setorNome[setorDe(a._t)] || "Sem setor", diasPerdidos),
    por_cargo: agrupar(itens, (a) => cargo[a._t?.cargo_id]?.nome_cargo || "Sem cargo", diasPerdidos),
    por_sexo: agrupar(itens, (a) => ({ M: "Masculino", F: "Feminino" }[a._t?.sexo] || "Não informado"), diasPerdidos),
    por_faixa: agrupar(itens, (a) => faixa(idade(a._t?.data_nascimento, a.data_inicio)), diasPerdidos),
    por_motivo: agrupar(itens, (a) => ({ doenca: "Doença não ocupacional", trabalho: "Acidente/doença do trabalho", trajeto: "Trajeto", outro: "Outro" }[a.motivo] || "Outro"), diasPerdidos),
    por_duracao: agrupar(itens, (a) => (a.dias <= 2 ? "1–2 dias" : a.dias <= 5 ? "3–5 dias" : a.dias <= 15 ? "6–15 dias" : "mais de 15 dias"), diasPerdidos),
    meses,
    reincidentes,
    alertas,
    populacao: {
      sexo: agrupar(pop.map((t) => ({ _dias: 0, _pessoa: t.id, sexo: t.sexo })), (t) => ({ M: "Masculino", F: "Feminino" }[t.sexo] || "Não informado"), 0).map((g) => ({ chave: g.chave, n: g.pessoas })),
      faixa: agrupar(pop.map((t) => ({ _dias: 0, _pessoa: t.id, n: t.data_nascimento })), (t) => faixa(idade(t.n, fim)), 0).map((g) => ({ chave: g.chave, n: g.pessoas })),
    },
  };
}

export function periodoPadrao(tipo, hoje = hojeLocal()) {
  const ano = hoje.slice(0, 4);
  if (tipo === "ano") return { inicio: `${ano}-01-01`, fim: hoje };
  if (tipo === "ano_anterior") return { inicio: `${Number(ano) - 1}-01-01`, fim: `${Number(ano) - 1}-12-31` };
  if (tipo === "trimestre") return { inicio: addDias(hoje, -89), fim: hoje };
  return { inicio: addDias(hoje, -364), fim: hoje };
}
