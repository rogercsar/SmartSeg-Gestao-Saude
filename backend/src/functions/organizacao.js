import { supabase } from '../config/db.js';

const MODULOS = ['cadastros', 'programas', 'saude', 'seguranca', 'documentos', 'esocial', 'financeiro', 'clinica', 'vencimentos', 'consumo', 'sensiveis'];
const SO_VER = ['clinica', 'vencimentos', 'consumo', 'sensiveis'];

export const PADRAO = {
  gestor: { cadastros: 'editar', programas: 'editar', saude: 'editar', seguranca: 'editar', documentos: 'editar', esocial: 'editar', financeiro: 'ver', clinica: 'ver', vencimentos: 'ver', consumo: 'ver', sensiveis: 'nenhum' },
  funcionario: { cadastros: 'ver', programas: 'ver', saude: 'nenhum', seguranca: 'editar', documentos: 'ver', esocial: 'nenhum', financeiro: 'nenhum', clinica: 'nenhum', vencimentos: 'ver', consumo: 'nenhum', sensiveis: 'nenhum' },
};

function flags(perfil, permissoes, ativo = true, status = 'interna') {
  const f = { org_ativo: !!ativo };
  const leitura = ['sem_assinatura', 'pendente_pagamento', 'suspensa', 'cancelada'].includes(status);
  for (const m of MODULOS) {
    const nivel = perfil === 'admin' ? 'editar' : (permissoes?.[perfil]?.[m] || PADRAO[perfil]?.[m] || 'nenhum');
    f['pv_' + m] = !!ativo && (nivel === 'ver' || nivel === 'editar');
    f['pe_' + m] = !!ativo && !leitura && nivel === 'editar' && !SO_VER.includes(m);
  }
  return f;
}

export async function handleOrganizacao(payload, user) {
  const { action, company_id } = payload;
  const email = (user?.email || '').toLowerCase();

  if (action === 'dossie_asos') {
    const { data: asos } = await supabase
      .from('Atendimento')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'finalizado')
      .order('aso_data', { ascending: false });
    return asos || [];
  }

  if (action === 'garantir') {
    let org = null;
    let membro = null;

    // 1. Tenta buscar organização onde o usuário é dono ou membro
    const { data: membros } = await supabase.from('MembroOrganizacao').select('*').eq('email', email).limit(1);
    if (membros && membros.length > 0) {
      membro = membros[0];
      const { data: orgData } = await supabase.from('Organizacao').select('*').eq('id', membro.org_id).single();
      org = orgData;
    }

    if (!org) {
      const { data: orgDono } = await supabase.from('Organizacao').select('*').eq('dono_id', user.id).limit(1);
      if (orgDono && orgDono.length > 0) {
        org = orgDono[0];
      }
    }

    // Se ainda não existir, cria a organização do usuário
    if (!org) {
      const novaOrgId = 'org_' + Date.now();
      const orgCriada = {
        id: novaOrgId,
        nome: user.full_name ? `Organização de ${user.full_name}` : 'SmartSeg Gestão e Saúde',
        dono_id: user.id,
        dono_email: email,
        permissoes: PADRAO,
        status_assinatura: 'interna',
      };
      try {
        await supabase.from('Organizacao').insert([orgCriada]);
      } catch (_) {}
      org = orgCriada;
    }

    if (!membro) {
      membro = {
        id: 'mem_' + Date.now(),
        org_id: org.id,
        user_id: user.id,
        email,
        nome: user.full_name || 'Usuário',
        perfil: 'admin',
        ativo: true,
      };
      try {
        await supabase.from('MembroOrganizacao').insert([membro]);
      } catch (_) {}
    }

    return {
      org: {
        id: org.id,
        nome: org.nome,
        dono_id: org.dono_id,
        canal_escuta: !!org.canal_escuta,
        permissoes: { gestor: { ...PADRAO.gestor, ...(org.permissoes?.gestor || {}) }, funcionario: { ...PADRAO.funcionario, ...(org.permissoes?.funcionario || {}) } },
      },
      membro: {
        id: membro.id,
        perfil: membro.perfil,
        ativo: membro.ativo !== false,
        nome: membro.nome || user.full_name || '',
        email: membro.email,
      },
      permissoes: flags(membro.perfil, org.permissoes, membro.ativo !== false, org.status_assinatura || 'interna'),
      titular: org.dono_id === user.id,
      assinatura: { status: org.status_assinatura || 'interna', link_pagamento: '', inadimplente_desde: '' },
    };
  }

  if (action === 'renomear') {
    const nome = String(payload.nome || '').trim();
    if (!nome) throw new Error('Nome é obrigatório');
    const orgId = user.org_id || payload.org_id;
    if (orgId) {
      await supabase.from('Organizacao').update({ nome }).eq('id', orgId);
    }
    return { ok: true };
  }

  if (action === 'config') {
    const { canal_escuta, org_id } = payload;
    const targetId = user.org_id || org_id;
    if (targetId) {
      await supabase.from('Organizacao').update({ canal_escuta: !!canal_escuta }).eq('id', targetId);
    }
    return { ok: true };
  }

  return { ok: true };
}
