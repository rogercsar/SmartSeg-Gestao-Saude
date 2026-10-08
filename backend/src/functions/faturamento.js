import { supabase } from '../config/db.js';

const PRECO_ASO = 0.4;
const mesAnterior = () => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
};

export async function handleFaturamento(payload, user) {
  const ciclo = /^\d{4}-\d{2}$/.test(payload.ciclo || '') ? payload.ciclo : mesAnterior();
  const executar = payload.action === 'cobrar';

  const { data: assinaturas } = await supabase.from('Assinatura').select('*').eq('status', 'ativa');
  const linhas = [];

  for (const a of assinaturas || []) {
    // Conta ASOs finalizados no ciclo
    const { data: clinicas } = await supabase.from('Clinica').select('id').eq('dono_id', a.user_id || user.id);
    let totalAsos = 0;
    for (const c of clinicas || []) {
      const { data: atendimentos } = await supabase.from('Atendimento').select('id, aso_data, origem').eq('clinica_id', c.id).eq('status', 'finalizado');
      totalAsos += (atendimentos || []).filter((at) => (at.aso_data || '').slice(0, 7) === ciclo && at.origem !== 'importacao').length;
    }

    const valorAsos = Math.round(totalAsos * PRECO_ASO * 100) / 100;
    const excedente = 0;
    const total = Math.round((excedente + valorAsos) * 100) / 100;

    linhas.push({
      assinatura_id: a.id,
      empresa: a.empresa || a.titular_nome,
      email: a.titular_email,
      plano: a.plano || '',
      creditos_excedentes: excedente,
      valor_excedente: 0,
      asos: totalAsos,
      valor_asos: valorAsos,
      total,
      situacao: total > 0 ? (executar ? 'processado' : 'a cobrar') : 'nada a cobrar',
    });
  }

  return {
    ciclo,
    gateway_configurado: !!process.env.ASAAS_API_KEY,
    linhas,
    total: Math.round(linhas.reduce((s, l) => s + l.total, 0) * 100) / 100,
  };
}
