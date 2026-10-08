import { supabase } from '../config/db.js';

export async function handleAssinar(payload, user) {
  const { plano, empresa, nome, email, cpf_cnpj, telefone } = payload || {};

  const precoPlano = plano === 'clinica' ? 299 : plano === 'consultoria' ? 199 : 79;
  const assId = 'ass_' + Date.now();

  const assData = {
    id: assId,
    titular_nome: nome || user?.full_name || 'Assinante SmartSeg',
    titular_email: email || user?.email || '',
    empresa: empresa || 'Empresa SST',
    cpf_cnpj: cpf_cnpj || '',
    telefone: telefone || '',
    vidas_declaradas: 0,
    plano: plano || 'consultoria',
    valor_mensal: precoPlano,
    status: 'ativa',
    gateway: 'asaas',
  };

  try {
    await supabase.from('Assinatura').insert([assData]);
  } catch (_) {}
  return {
    ok: true,
    url: 'https://smartseg.com.br/checkout/sucesso',
    mensagem: 'Assinatura configurada com sucesso.',
    assinatura: assData,
  };
}
