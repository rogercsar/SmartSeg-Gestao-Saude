import { supabase } from '../config/db.js';
import crypto from 'crypto';

const NOMES = {
  pgr: 'Programa de Gerenciamento de Riscos (PGR)',
  pcmso: 'Programa de Controle Médico de Saúde Ocupacional (PCMSO)',
  ltcat: 'Laudo Técnico das Condições Ambientais do Trabalho (LTCAT)',
  insalubridade: 'Laudo de Insalubridade',
  periculosidade: 'Laudo de Periculosidade',
  aso: 'Atestado de Saúde Ocupacional (ASO)',
};

const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v ?? null));

function sha256(txt) {
  return crypto.createHash('sha256').update(txt, 'utf8').digest('hex');
}

const codigoNovo = () => Array.from(crypto.randomBytes(16)).map((x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');

async function conteudoPrograma(p) {
  const { data: riscos } = await supabase.from('Risco').select('*').eq('company_id', p.company_id);
  const riscosMapeados = (riscos || [])
    .map((r) => ({
      id: r.id,
      agente: r.agente,
      tipo: r.tipo,
      cargos: (r.cargo_ids || []).slice().sort(),
      intensidade: r.intensidade || '',
      unidade: r.unidade_medida || '',
      severidade: r.severidade ?? null,
      probabilidade: r.probabilidade ?? null,
      insal: r.insalubridade?.caracteriza ?? null,
      grau: r.insalubridade?.grau || '',
      aposent: r.aposentadoria_especial?.enquadra ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    tipo: p.tipo,
    versao: p.versao || '',
    data_emissao: p.data_emissao || '',
    vigencia_ate: p.vigencia_ate || '',
    responsavel: p.responsavel || {},
    medico_coordenador: p.medico_coordenador || {},
    textos: p.textos || {},
    matriz: p.matriz || '',
    riscos: riscosMapeados,
  };
}

export async function handleAutenticidade(payload, user) {
  const { action, documento_id, evento, secoes, codigo } = payload;

  if (codigo) {
    const { data: au } = await supabase.from('Autenticacao').select('*').eq('codigo', codigo.toUpperCase()).single();
    if (!au) return { valido: false, mensagem: 'Documento não encontrado' };
    return { valido: true, documento: au };
  }

  if (action === 'trilha') {
    const { data: ev } = await supabase.from('TrilhaDocumento').select('*').eq('documento_id', documento_id).order('created_date', { ascending: false }).limit(300);
    const { data: au } = await supabase.from('Autenticacao').select('*').eq('documento_id', documento_id).order('created_date', { ascending: false }).limit(50);
    return {
      eventos: (ev || []).map((e) => ({
        id: e.id,
        data: e.created_date,
        evento: e.evento,
        usuario: e.usuario_nome || e.usuario_email,
        versao: e.versao,
        detalhes: e.detalhes,
        hash: e.hash,
      })),
      autenticacoes: (au || []).map((a) => ({
        codigo: a.codigo,
        versao: a.versao,
        emitido_em: a.emitido_em,
        status: a.status,
      })),
    };
  }

  if (action === 'registrar') {
    const { data: p } = await supabase.from('ProgramaSST').select('*').eq('id', documento_id).single();
    if (!p) throw new Error('Documento não encontrado');
    const hashVal = sha256(canon(secoes || {}));
    const trilhaId = 'trilha_' + Date.now();
    await supabase.from('TrilhaDocumento').insert([{
      id: trilhaId,
      org_id: p.org_id || user?.org_id || '',
      company_id: p.company_id,
      documento_tipo: p.tipo,
      documento_id: p.id,
      usuario_email: user?.email || '',
      usuario_nome: user?.full_name || '',
      versao: p.versao || '',
      evento: evento || 'editado',
      hash: hashVal,
      detalhes: { secoes: Object.keys(secoes || {}) },
    }]);
    return { ok: true, hash: hashVal };
  }

  if (action === 'emitir') {
    const { data: p } = await supabase.from('ProgramaSST').select('*').eq('id', documento_id).single();
    if (!p) throw new Error('Documento não encontrado');

    const conteudo = await conteudoPrograma(p);
    const hashVal = sha256(canon(conteudo));

    const { data: anteriores } = await supabase.from('Autenticacao').select('*').eq('documento_id', p.id);
    const igual = (anteriores || []).find((a) => a.status === 'valido' && a.hash === hashVal);
    if (igual) return { codigo: igual.codigo, reaproveitado: true };

    for (const a of (anteriores || []).filter((x) => x.status === 'valido')) {
      await supabase.from('Autenticacao').update({ status: 'substituido' }).eq('id', a.id);
    }

    const { data: emp } = await supabase.from('Company').select('*').eq('id', p.company_id).single();
    const cod = codigoNovo();
    const novoAuthId = 'auth_' + Date.now();

    await supabase.from('Autenticacao').insert([{
      id: novoAuthId,
      codigo: cod,
      org_id: p.org_id || user?.org_id || '',
      company_id: p.company_id,
      empresa_nome: emp?.razao_social || '',
      documento_tipo: p.tipo,
      documento_id: p.id,
      documento_nome: NOMES[p.tipo] || p.tipo,
      versao: p.versao || '1',
      emitido_em: new Date().toISOString(),
      emitido_por: { nome: user?.full_name || '', email: user?.email || '' },
      responsavel: p.tipo === 'pcmso'
        ? { nome: p.medico_coordenador?.nome, conselho: 'CRM', numero: p.medico_coordenador?.crm, uf: p.medico_coordenador?.uf }
        : (p.responsavel || {}),
      hash: hashVal,
      status: 'valido',
    }]);

    await supabase.from('ProgramaSST').update({ autenticacao_codigo: cod, status: 'emitido' }).eq('id', p.id);
    return { codigo: cod, hash: hashVal };
  }

  return { valido: true, data: new Date().toISOString() };
}
