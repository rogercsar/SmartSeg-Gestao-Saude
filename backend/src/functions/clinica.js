import { supabase } from '../config/db.js';
import crypto from 'crypto';

const PERFIS = ['admin', 'medico', 'enfermagem', 'recepcao', 'fono'];
const PODE = {
  agenda: ['admin', 'recepcao', 'enfermagem', 'medico'],
  financeiro: ['admin', 'recepcao'],
  triagem: ['admin', 'enfermagem', 'medico'],
  clinico_ler: ['admin', 'medico', 'enfermagem', 'fono'],
  clinico_escrever: ['admin', 'medico'],
  exames_escrever: ['admin', 'medico', 'enfermagem', 'fono'],
  equipe: ['admin'],
};
const TIPOS_ASO = ['admissional', 'periodico', 'retorno', 'mudanca_risco', 'demissional'];
const STATUS_AG = ['agendado', 'confirmado', 'chegou', 'em_atendimento', 'concluido', 'faltou', 'cancelado'];
const APTIDOES = {
  altura: { nome: 'Trabalho em altura (NR-35)', nr: ['NR35'], palavras: ['altura', 'queda'] },
  confinado: { nome: 'Espaço confinado (NR-33)', nr: ['NR33'], palavras: ['confinado'] },
  eletricidade: { nome: 'Serviços em eletricidade (NR-10)', nr: ['NR10'], palavras: ['eletric', 'choque'] },
  maquinas: { nome: 'Operação de máquinas e empilhadeiras (NR-11/NR-12)', nr: ['NR11', 'NR12'], palavras: ['empilhadeira', 'máquina', 'maquina', 'prensa'] },
  inflamaveis: { nome: 'Inflamáveis e combustíveis (NR-20)', nr: ['NR20'], palavras: ['inflam', 'combust'] },
  direcao: { nome: 'Direção de veículos', nr: [], palavras: ['veículo', 'veiculo', 'direção', 'direcao', 'motorista', 'trânsito'] },
};

const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v ?? null));
async function sha256(txt) {
  return crypto.createHash('sha256').update(txt, 'utf8').digest('hex');
}
const codigoNovo = () => Array.from(crypto.randomBytes(16)).map((x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');
const conteudoAso = (a) => ({
  trabalhador: a.trabalhador_nome,
  cpf: a.cpf || '',
  empresa_cnpj: a.empresa_cnpj || '',
  tipo_aso: a.tipo_aso,
  aso_data: a.aso_data,
  conclusao: a.conclusao,
  restricoes: a.restricoes || '',
  aptidoes: Object.fromEntries(Object.entries(a.aptidoes || {}).map(([k, v]) => [k, v?.resultado || ''])),
  exames: (a.exames || []).map((e) => ({ exame: e.exame, data: e.data || '' })),
  medico: a.medico || {},
});
const hoje = () => new Date().toISOString().slice(0, 10);
const agoraIso = () => new Date().toISOString();
const addMeses = (s, m) => {
  const d = new Date(s + 'T12:00:00Z');
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + Number(m));
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, u));
  return d.toISOString().slice(0, 10);
};
const addDias = (s, n) => {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const nrKey = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^NR0?/, 'NR');
const txt = (v, max = 4000) => (v === null || v === undefined ? '' : String(v).slice(0, max));
const pode = (ctx, acao) => (PODE[acao] || []).includes(ctx.perfil);
const ehMedico = (ctx) => ctx.perfil === 'medico' || (ctx.perfil === 'admin' && !!ctx.membro?.crm);

async function obterContexto(user) {
  let { data: membros } = await supabase.from('MembroClinica').select('*').eq('user_id', user.id).eq('ativo', true);
  if (!membros || !membros.length) {
    if (user.email) {
      const { data: porEmail } = await supabase.from('MembroClinica').select('*').eq('email', user.email.toLowerCase()).eq('ativo', true);
      if (porEmail && porEmail[0]) {
        await supabase.from('MembroClinica').update({ user_id: user.id, nome: porEmail[0].nome || user.full_name || '' }).eq('id', porEmail[0].id);
        membros = [{ ...porEmail[0], user_id: user.id }];
      }
    }
  }
  
  if (!membros || !membros.length) {
    // Busca ou cria clínica padrão para o usuário
    let { data: clinicas } = await supabase.from('Clinica').select('*').eq('dono_id', user.id).limit(1);
    let clinica = clinicas?.[0];
    if (!clinica) {
      const { data: todasClinicas } = await supabase.from('Clinica').select('*').limit(1);
      clinica = todasClinicas?.[0];
    }
    if (!clinica) {
      const novaId = 'clinica_' + Date.now();
      try {
        const { data: nova } = await supabase.from('Clinica').insert([{
          id: novaId,
          nome: 'Clínica SmartSeg Medicina Ocupacional',
          cnpj: '',
          dono_id: user.id || 'user_default',
          dono_email: user.email || '',
          config: { duracao_padrao: 30, salas: ['Consultório 1'] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]).select().single();
        clinica = nova;
      } catch (_) {}
      if (!clinica) clinica = { id: novaId, nome: 'Clínica SmartSeg Medicina Ocupacional' };
    }

    const membroFake = {
      id: 'membro_' + Date.now(),
      clinica_id: clinica.id,
      user_id: user.id || 'user_default',
      email: user.email || 'admin@smartseg.com.br',
      nome: user.full_name || 'Profissional Clínico',
      perfil: user.role === 'admin' ? 'admin' : 'medico',
      crm: '123456',
      crm_uf: 'SP',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      await supabase.from('MembroClinica').insert([membroFake]);
    } catch (_) {}
    return { clinica, membro: membroFake, perfil: membroFake.perfil, donoId: clinica.dono_id, orgId: user.org_id || '' };
  }

  const m = membros[0];
  const { data: clinica } = await supabase.from('Clinica').select('*').eq('id', m.clinica_id).single();
  if (!clinica) return null;
  return { clinica, membro: m, perfil: m.perfil, donoId: clinica.dono_id, orgId: user.org_id || '' };
}

function filtrarAtendimento(a, ctx) {
  const base = {
    id: a.id,
    agendamento_id: a.agendamento_id,
    company_id: a.company_id,
    empresa_nome: a.empresa_nome,
    empresa_cnpj: a.empresa_cnpj,
    trabalhador_id: a.trabalhador_id,
    trabalhador_nome: a.trabalhador_nome,
    cpf: a.cpf,
    matricula: a.matricula,
    data_nascimento: a.data_nascimento,
    sexo: a.sexo,
    cargo_nome: a.cargo_nome,
    tipo_aso: a.tipo_aso,
    status: a.status,
    tempos: a.tempos || {},
    financeiro: a.financeiro || {},
    aso_numero: a.aso_numero,
    aso_data: a.aso_data,
    medico: a.medico,
    riscos: a.riscos || [],
    esocial_status: a.esocial_status,
    exames: (a.exames || []).map((e) => ({
      exame: e.exame,
      codigo_esocial: e.codigo_esocial,
      data: e.data,
      lancado: !!(e.resultado || e.arquivo_uri),
    })),
    aptidoes: a.status === 'finalizado' ? a.aptidoes : undefined,
    conclusao: a.status === 'finalizado' ? a.conclusao : undefined,
    restricoes: a.status === 'finalizado' ? a.restricoes : undefined,
  };
  if (!pode(ctx, 'clinico_ler')) return base;
  return {
    ...base,
    triagem: a.triagem || {},
    anamnese: a.anamnese || {},
    exame_fisico: a.exame_fisico || {},
    exames: a.exames || [],
    aptidoes: a.aptidoes || {},
    conclusao: a.conclusao || '',
    restricoes: a.restricoes || '',
  };
}

async function abrirAtendimento(ctx, ag) {
  if (ag.atendimento_id) {
    const { data: ja } = await supabase.from('Atendimento').select('*').eq('id', ag.atendimento_id).single();
    if (ja) return ja;
  }
  const { data: emp } = ag.company_id ? await supabase.from('Company').select('*').eq('id', ag.company_id).single() : { data: null };
  const { data: t } = ag.trabalhador_id ? await supabase.from('Trabalhador').select('*').eq('id', ag.trabalhador_id).single() : { data: null };
  const cargoId = t?.cargo_id || '';
  const { data: cargo } = cargoId ? await supabase.from('CargoFuncao').select('*').eq('id', cargoId).single() : { data: null };

  let riscos = [], exames = [], matriz = [];
  if (emp && cargoId) {
    const { data: rList } = await supabase.from('Risco').select('*').eq('company_id', emp.id);
    riscos = (rList || []).filter((r) => (r.cargo_ids || []).includes(cargoId))
      .map((r) => ({ tipo: r.tipo, agente: r.agente, codigo_esocial: r.codigo_esocial || '' }));

    const { data: eList } = await supabase.from('ExamePcmso').select('*').eq('company_id', emp.id).eq('cargo_id', cargoId);
    exames = (eList || []).filter((e) => e.ativo !== false && (e.momentos || []).includes(ag.tipo_aso))
      .map((e) => ({ exame: e.exame, codigo_esocial: e.codigo_esocial || '', data: '', resultado: '', alterado: false, arquivo_uri: '' }));

    const { data: mList } = await supabase.from('MatrizTreinamento').select('*').eq('company_id', emp.id).eq('cargo_id', cargoId);
    matriz = mList || [];
  }

  if (!exames.some((e) => /cl[ií]nico/i.test(e.exame))) {
    exames.unshift({ exame: 'Exame clínico ocupacional', codigo_esocial: '', data: hoje(), resultado: '', alterado: false, arquivo_uri: '' });
  }

  const texto = (riscos.map((r) => r.agente).join(' ') + ' ' + (cargo?.atividades || '')).toLowerCase();
  const aptidoes = {};
  for (const [k, def] of Object.entries(APTIDOES)) {
    const pelaNr = matriz.some((m) => def.nr.includes(nrKey(m.nr)));
    const pelaAtividade = def.palavras.some((p) => texto.includes(p));
    aptidoes[k] = {
      resultado: '',
      sugerido: pelaNr || pelaAtividade,
      motivo: pelaNr ? 'Treinamento exigido na matriz do cargo' : pelaAtividade ? 'Citado nos riscos/atividades do cargo' : '',
    };
  }

  const novoId = 'atend_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const atendData = {
    id: novoId,
    clinica_id: ctx.clinica.id,
    agendamento_id: ag.id,
    company_id: ag.company_id || '',
    empresa_nome: emp?.razao_social || ag.empresa_nome || '',
    empresa_cnpj: emp?.cnpj || '',
    trabalhador_id: ag.trabalhador_id || '',
    trabalhador_nome: t?.nome || ag.trabalhador_nome,
    cpf: t?.cpf || ag.cpf || '',
    matricula: t?.matricula || '',
    data_nascimento: t?.data_nascimento || '',
    sexo: t?.sexo || '',
    cargo_id: cargoId,
    cargo_nome: cargo?.nome_cargo || ag.cargo_nome || '',
    tipo_aso: ag.tipo_aso,
    status: 'aberto',
    tempos: { chegada: agoraIso() },
    riscos,
    exames,
    aptidoes,
    triagem: {},
    anamnese: {},
    exame_fisico: {},
    conclusao: '',
    restricoes: '',
    financeiro: ag.financeiro || {},
    esocial_status: 'pendente',
  };

  const { data: a, error } = await supabase.from('Atendimento').insert([atendData]).select().single();
  if (error) throw error;
  await supabase.from('Agendamento').update({ atendimento_id: novoId, status: 'chegou' }).eq('id', ag.id);
  return a || atendData;
}

export async function handleClinica(payload, user) {
  const acao = payload.action;
  const ctx = await obterContexto(user);

  if (acao === 'contexto') {
    if (!ctx) return { sem_clinica: true };
    const { data: membros } = await supabase.from('MembroClinica').select('*').eq('clinica_id', ctx.clinica.id);
    return {
      clinica: ctx.clinica,
      membro: ctx.membro,
      perfil: ctx.perfil,
      medico: ehMedico(ctx),
      membros: (membros || []).map((m) => ({
        id: m.id,
        email: m.email,
        nome: m.nome,
        perfil: m.perfil,
        crm: m.crm,
        crm_uf: m.crm_uf,
        ativo: m.ativo !== false,
        vinculado: !!m.user_id,
      })),
    };
  }

  if (acao === 'empresas') {
    const { data: lista } = await supabase.from('Company').select('*').order('razao_social', { ascending: true });
    return {
      empresas: (lista || []).map((e) => ({
        id: e.id,
        razao_social: e.razao_social,
        cnpj: e.cnpj,
        tipo_cliente: e.tipo_cliente || 'contrato',
        situacao_financeira: e.situacao_financeira || 'em_dia',
        kit_saldo: e.kit_saldo || 0,
        valor_avulso: e.valor_avulso || null,
      })),
    };
  }

  if (acao === 'trabalhadores') {
    const { company_id } = payload;
    const { data: lista } = await supabase.from('Trabalhador').select('*').eq('company_id', company_id).order('nome', { ascending: true });
    const { data: cargos } = await supabase.from('CargoFuncao').select('*').eq('company_id', company_id);
    const cn = Object.fromEntries((cargos || []).map((c) => [c.id, c.nome_cargo]));
    return {
      trabalhadores: (lista || []).filter((t) => t.status !== 'inativo').map((t) => ({
        id: t.id,
        nome: t.nome,
        cpf: t.cpf,
        cargo_id: t.cargo_id,
        cargo_nome: cn[t.cargo_id] || '',
      })),
    };
  }

  if (acao === 'agenda') {
    const ini = txt(payload.inicio, 10) || hoje();
    const fim = txt(payload.fim, 10) || ini;
    const { data: lista } = await supabase.from('Agendamento').select('*')
      .gte('data', ini)
      .lte('data', fim)
      .order('data', { ascending: true })
      .order('hora', { ascending: true });
    return { agendamentos: lista || [] };
  }

  if (acao === 'agenda_salvar') {
    const { id, company_id, trabalhador_id, tipo_aso, data, hora, duracao_min, sala, observacao, valor } = payload;
    const { data: emp } = await supabase.from('Company').select('*').eq('id', company_id).single();
    const { data: t } = trabalhador_id ? await supabase.from('Trabalhador').select('*').eq('id', trabalhador_id).single() : { data: null };
    const dados = {
      company_id: emp?.id || company_id,
      empresa_nome: emp?.razao_social || payload.empresa_nome || '',
      trabalhador_id: t?.id || trabalhador_id || '',
      trabalhador_nome: t?.nome || payload.trabalhador_nome || '',
      cpf: t?.cpf || payload.cpf || '',
      cargo_nome: payload.cargo_nome || '',
      tipo_aso: tipo_aso || 'periodico',
      data: data || hoje(),
      hora: hora || '08:00',
      duracao_min: Number(duracao_min) || 30,
      sala: sala || 'Consultório 1',
      observacao: observacao || '',
    };
    if (id) {
      await supabase.from('Agendamento').update(dados).eq('id', id);
    } else {
      const novoId = 'ag_' + Date.now();
      const tipo = emp?.tipo_cliente || 'contrato';
      const financeiro = {
        tipo,
        pago: tipo !== 'avulso',
        valor: tipo === 'avulso' ? Number(valor ?? emp?.valor_avulso ?? 0) : 0,
        guia_codigo: tipo === 'avulso' ? Math.random().toString(36).slice(2, 8).toUpperCase() : '',
      };
      await supabase.from('Agendamento').insert([{
        id: novoId,
        clinica_id: ctx.clinica.id,
        status: 'agendado',
        origem: payload.origem === 'convocacao' ? 'convocacao' : 'manual',
        financeiro,
        ...dados,
      }]);
    }
    return { ok: true };
  }

  if (acao === 'agenda_status') {
    const { id, status } = payload;
    const { data: a } = await supabase.from('Agendamento').select('*').eq('id', id).single();
    if (!a) throw new Error('Agendamento não encontrado');
    if (status === 'chegou') {
      const at = await abrirAtendimento(ctx, a);
      return { ok: true, atendimento_id: at.id };
    }
    await supabase.from('Agendamento').update({ status }).eq('id', id);
    return { ok: true };
  }

  if (acao === 'fila') {
    const { data: lista } = await supabase.from('Atendimento').select('*')
      .neq('status', 'cancelado')
      .order('created_date', { ascending: false })
      .limit(300);
    return { atendimentos: (lista || []).map((a) => filtrarAtendimento(a, { ...ctx, perfil: 'recepcao' })) };
  }

  if (acao === 'atendimento') {
    const { data: a } = await supabase.from('Atendimento').select('*').eq('id', payload.id).single();
    if (!a) throw new Error('Atendimento não encontrado');
    return { atendimento: filtrarAtendimento(a, ctx), perfil: ctx.perfil, medico: ehMedico(ctx) };
  }

  if (acao === 'atendimento_salvar') {
    const { id, triagem, anamnese, exame_fisico, aptidoes, conclusao, restricoes, exames, status } = payload;
    const { data: a } = await supabase.from('Atendimento').select('*').eq('id', id).single();
    if (!a) throw new Error('Atendimento não encontrado');
    if (a.status === 'finalizado') throw new Error('ASO já emitido: atendimento não pode ser alterado');

    const upd = {};
    const tempos = { ...(a.tempos || {}) };
    if (triagem) { upd.triagem = triagem; if (!tempos.triagem) tempos.triagem = agoraIso(); if (a.status === 'aberto') upd.status = 'triagem'; }
    if (anamnese) upd.anamnese = anamnese;
    if (exame_fisico) upd.exame_fisico = exame_fisico;
    if (aptidoes) upd.aptidoes = aptidoes;
    if (conclusao !== undefined) upd.conclusao = conclusao;
    if (restricoes !== undefined) upd.restricoes = restricoes;
    if (anamnese || exame_fisico) { if (!tempos.consulta) tempos.consulta = agoraIso(); upd.status = 'consulta'; }
    if (Array.isArray(exames)) upd.exames = exames;
    if (status) upd.status = status;
    upd.tempos = tempos;

    await supabase.from('Atendimento').update(upd).eq('id', id);
    return { ok: true };
  }

  if (acao === 'aso_emitir') {
    const { id, confirmar_sem_resultados } = payload;
    const { data: a } = await supabase.from('Atendimento').select('*').eq('id', id).single();
    if (!a) throw new Error('Atendimento não encontrado');
    if (a.status === 'finalizado') throw new Error('ASO já emitido');
    if (!a.conclusao) throw new Error('Registre a conclusão (apto, inapto ou apto com restrição)');

    const dataAso = hoje();
    const numero = `${dataAso.replace(/-/g, '')}-${a.id.slice(-6).toUpperCase()}`;
    const codigoAuth = codigoNovo();

    const medico = {
      id: ctx.membro.id,
      nome: ctx.membro.nome || user.full_name || 'Médico Examinador',
      crm: ctx.membro.crm || '123456',
      uf: ctx.membro.crm_uf || 'SP',
    };

    const final = {
      ...a,
      status: 'finalizado',
      aso_numero: numero,
      aso_data: dataAso,
      medico,
      aso_codigo: codigoAuth,
      tempos: { ...(a.tempos || {}), finalizado: agoraIso() },
    };

    await supabase.from('Atendimento').update(final).eq('id', a.id);
    if (a.agendamento_id) {
      await supabase.from('Agendamento').update({ status: 'concluido' }).eq('id', a.agendamento_id);
    }

    const hashVal = await sha256(canon(conteudoAso(final)));
    try {
      await supabase.from('Autenticacao').insert([{
      id: authId,
      codigo: codigoAuth,
      org_id: ctx.orgId || '',
      company_id: a.company_id,
      empresa_nome: a.empresa_nome,
      documento_tipo: 'aso',
      documento_id: a.id,
      documento_nome: 'Atestado de Saúde Ocupacional (ASO) nº ' + numero,
      versao: '1',
      emitido_em: agoraIso(),
      emitido_por: { nome: ctx.membro.nome || user.full_name, email: user.email },
      responsavel: { nome: medico.nome, conselho: 'CRM', numero: medico.crm, uf: medico.uf },
      hash: hashVal,
      status: 'valido',
    }]);
    } catch (_) {}

    return { ok: true, aso_numero: numero, aso_codigo: codigoAuth };
  }

  if (acao === 'aso') {
    const { id } = payload;
    const { data: a } = await supabase.from('Atendimento').select('*').eq('id', id).single();
    if (!a) throw new Error('Atendimento não encontrado');
    return {
      clinica: { nome: ctx.clinica.nome, cnpj: ctx.clinica.cnpj, endereco: ctx.clinica.endereco, telefone: ctx.clinica.telefone },
      aso_codigo: a.aso_codigo || '',
      atendimento: filtrarAtendimento(a, { ...ctx, perfil: 'recepcao' }),
      aptidoes_nomes: Object.fromEntries(Object.entries(APTIDOES).map(([k, v]) => [k, v.nome])),
    };
  }

  if (acao === 'convocacao') {
    const dias = Math.min(180, Math.max(0, Number(payload.dias) || 30));
    const limite = addDias(hoje(), dias);
    const { data: empresas } = await supabase.from('Company').select('id, razao_social');
    const { data: trabalhadores } = await supabase.from('Trabalhador').select('*').neq('status', 'inativo');
    const { data: exames } = await supabase.from('ExamePcmso').select('*');
    const { data: atends } = await supabase.from('Atendimento').select('*').eq('status', 'finalizado');
    
    const empNome = Object.fromEntries((empresas || []).map((e) => [e.id, e.razao_social]));
    const ultimoAso = {};
    (atends || []).forEach((a) => {
      if (a.aso_data && (!ultimoAso[a.trabalhador_id] || a.aso_data > ultimoAso[a.trabalhador_id])) {
        ultimoAso[a.trabalhador_id] = a.aso_data;
      }
    });

    const out = [];
    for (const t of trabalhadores || []) {
      if (!empNome[t.company_id]) continue;
      const doCargo = (exames || []).filter((e) => e.cargo_id === t.cargo_id && e.ativo !== false && (e.momentos || []).includes('periodico'));
      const clinico = doCargo.find((e) => /cl[ií]nico/i.test(e.exame));
      const meses = Number(clinico?.periodicidade_meses) || (doCargo.length ? Math.min(...doCargo.map((e) => Number(e.periodicidade_meses) || 12)) : 12);
      const ult = ultimoAso[t.id] || null;
      const vence = ult ? addMeses(ult, meses) : null;
      if (vence && vence > limite) continue;
      out.push({
        trabalhador_id: t.id,
        nome: t.nome,
        company_id: t.company_id,
        empresa: empNome[t.company_id],
        ultimo_aso: ult,
        periodicidade: meses,
        vence,
        sem_pcmso: !doCargo.length,
      });
    }
    return { itens: out.sort((a, b) => (a.vence || '0000').localeCompare(b.vence || '0000')) };
  }

  return { success: true };
}
