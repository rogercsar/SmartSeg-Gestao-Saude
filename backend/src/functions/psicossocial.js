import { supabase } from '../config/db.js';

function pontuarItem(item, v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const vals = (item.opcoes || []).map((o) => Number(o.valor));
  const max = Math.max(...vals), min = Math.min(...vals);
  let p = item.invertido ? max + min - n : n;
  if (item.binario) p = p > min ? 1 : 0;
  return p;
}

function classificar(dim, score) {
  const [c1, c2] = (dim.cortes || [0, 0]).map(Number);
  if (dim.grupo === 'recurso') return score >= c2 ? 'favoravel' : score >= c1 ? 'atencao' : 'desfavoravel';
  return score <= c1 ? 'favoravel' : score <= c2 ? 'atencao' : 'desfavoravel';
}

function pontuarRespondente(inst, respostas) {
  const out = {};
  for (const d of inst.dimensoes || []) {
    const itens = (inst.itens || []).filter((i) => i.dimensao === d.codigo);
    const pts = itens.map((i) => pontuarItem(i, respostas?.[i.codigo])).filter((x) => x !== null);
    if (pts.length < itens.length || !itens.length) continue;
    const soma = pts.reduce((a, b) => a + b, 0);
    const score = d.calculo === 'media' ? soma / pts.length : soma;
    out[d.codigo] = { score, classe: classificar(d, score) };
  }
  return out;
}

function agregar(inst, lista) {
  return (inst.dimensoes || []).map((d) => {
    const vals = lista.map((r) => r[d.codigo]).filter(Boolean);
    const n = vals.length;
    const cont = { favoravel: 0, atencao: 0, desfavoravel: 0 };
    vals.forEach((v) => cont[v.classe]++);
    const pct = (k) => (n ? Math.round((cont[k] / n) * 1000) / 10 : 0);
    const media = n ? Math.round((vals.reduce((a, b) => a + b.score, 0) / n) * 100) / 100 : null;
    const pd = pct('desfavoravel');
    return {
      codigo: d.codigo,
      nome: d.nome,
      grupo: d.grupo,
      n,
      media,
      favoravel: pct('favoravel'),
      atencao: pct('atencao'),
      desfavoravel: pd,
      nivel: !n ? null : pd >= 50 ? 'alto' : pd >= 25 ? 'moderado' : 'baixo',
    };
  });
}

export async function handlePsicossocial(payload, user) {
  const { action, aplicacao_id, token, setor_id, respostas } = payload;

  if (action === 'resultados') {
    const { data: ap } = await supabase.from('AplicacaoPsicossocial').select('*').eq('id', aplicacao_id).single();
    if (!ap) throw new Error('Aplicação não encontrada');

    const inst = ap.instrumento || {};
    const min = Number(inst.min_respostas_grupo) || 5;

    const { data: resp } = await supabase.from('RespostaPsicossocial').select('*').eq('aplicacao_id', ap.id);
    const pontuadas = (resp || []).map((r) => ({
      setor_id: r.setor_id || '',
      p: pontuarRespondente(inst, r.respostas),
    }));

    const total = pontuadas.length;
    const geral = total >= min ? agregar(inst, pontuadas.map((x) => x.p)) : null;
    const porSetor = (ap.setores || []).map((s) => {
      const doSetor = pontuadas.filter((x) => x.setor_id === s.id);
      return {
        id: s.id,
        nome: s.nome,
        n: doSetor.length,
        dimensoes: doSetor.length >= min ? agregar(inst, doSetor.map((x) => x.p)) : null,
      };
    });

    return {
      total,
      min,
      geral,
      porSetor,
      adesao: ap.publico_estimado ? Math.round((total / ap.publico_estimado) * 1000) / 10 : null,
    };
  }

  // Envio anônimo de respostas
  if (token && respostas) {
    const { data: ap } = await supabase.from('AplicacaoPsicossocial').select('*').eq('token', token).single();
    if (!ap) throw new Error('Pesquisa não encontrada ou token inválido');
    if (ap.status !== 'aberta') throw new Error('Pesquisa encerrada');

    const novoId = 'resp_psi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await supabase.from('RespostaPsicossocial').insert([{
      id: novoId,
      aplicacao_id: ap.id,
      org_id: ap.org_id || '',
      company_id: ap.company_id,
      setor_id: setor_id || '',
      respostas,
    }]);

    return { ok: true, id: novoId };
  }

  return { success: true };
}
