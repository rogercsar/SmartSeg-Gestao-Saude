// Pontuação da pesquisa psicossocial (origem: functions/pesquisa-psicossocial). Anonimato: grupos com menos de min_respostas_grupo não são exibidos.
export function pontuarItem(item, v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const vals = (item.opcoes || []).map((o) => Number(o.valor));
  const max = Math.max(...vals), min = Math.min(...vals);
  let p = item.invertido ? max + min - n : n;
  if (item.binario) p = p > min ? 1 : 0;
  return p;
}

export function classificar(dim, score) {
  const [c1, c2] = (dim.cortes || [0, 0]).map(Number);
  if (dim.grupo === "recurso") return score >= c2 ? "favoravel" : score >= c1 ? "atencao" : "desfavoravel";
  return score <= c1 ? "favoravel" : score <= c2 ? "atencao" : "desfavoravel";
}

export function pontuarRespondente(inst, respostas) {
  const out = {};
  for (const d of inst.dimensoes || []) {
    const itens = (inst.itens || []).filter((i) => i.dimensao === d.codigo);
    const pts = itens.map((i) => pontuarItem(i, respostas?.[i.codigo])).filter((x) => x !== null);
    if (pts.length < itens.length || !itens.length) continue; // dimensão incompleta não entra
    const soma = pts.reduce((a, b) => a + b, 0);
    const score = d.calculo === "media" ? soma / pts.length : soma;
    out[d.codigo] = { score, classe: classificar(d, score) };
  }
  return out;
}

export function agregar(inst, lista) {
  const dims = (inst.dimensoes || []).map((d) => {
    const vals = lista.map((r) => r[d.codigo]).filter(Boolean);
    const n = vals.length;
    const cont = { favoravel: 0, atencao: 0, desfavoravel: 0 };
    vals.forEach((v) => cont[v.classe]++);
    const pct = (k) => (n ? Math.round((cont[k] / n) * 1000) / 10 : 0);
    const media = n ? Math.round((vals.reduce((a, b) => a + b.score, 0) / n) * 100) / 100 : null;
    const pd = pct("desfavoravel");
    return { codigo: d.codigo, nome: d.nome, grupo: d.grupo, n, media, favoravel: pct("favoravel"), atencao: pct("atencao"), desfavoravel: pd,
      nivel: !n ? null : pd >= 50 ? "alto" : pd >= 25 ? "moderado" : "baixo" };
  });
  return dims;
}