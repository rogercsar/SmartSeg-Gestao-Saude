import { supabase } from '../config/db.js';

export async function handleTransferirTrabalhador(payload, user) {
  const { trabalhador_id, empresa_destino_id } = payload;
  if (!trabalhador_id || !empresa_destino_id) {
    throw new Error('trabalhador_id e empresa_destino_id são obrigatórios.');
  }

  const { data: trab } = await supabase.from('Trabalhador').select('*').eq('id', trabalhador_id).single();
  if (!trab) throw new Error('Trabalhador não encontrado.');
  if (trab.company_id === empresa_destino_id) {
    throw new Error('A empresa de destino é a mesma da origem.');
  }

  const origem_id = trab.company_id;
  const destino_id = empresa_destino_id;
  const nome = trab.nome || '';

  const { data: origem } = await supabase.from('Company').select('*').eq('id', origem_id).single();
  const { data: destino } = await supabase.from('Company').select('*').eq('id', destino_id).single();

  // 1. Atualiza o próprio trabalhador
  await supabase.from('Trabalhador').update({ company_id: destino_id }).eq('id', trabalhador_id);

  // 2. Entidades vinculadas ao trabalhador
  const tabelasVinculadas = [
    'LotacaoHistorico',
    'Vacina',
    'Atestado',
    'OcorrenciaAcidente',
    'RecusaTrabalho',
    'EntregaEpi',
    'GeneratedDocument',
    'EventoEsocial',
    'ExamePcmso',
  ];

  let atualizados = 0;
  for (const tab of tabelasVinculadas) {
    try {
      const { data, error } = await supabase
        .from(tab)
        .update({ company_id: destino_id })
        .eq('trabalhador_id', trabalhador_id)
        .select();
      if (!error && data) atualizados += data.length;
    } catch (_) {
      // Ignora se a tabela não tiver dados ou o campo
    }
  }

  // 3. Anexos vinculados ao trabalhador
  try {
    await supabase
      .from('Anexo')
      .update({ company_id: destino_id })
      .eq('vinculo_tipo', 'trabalhador')
      .eq('vinculo_id', trabalhador_id);
  } catch (_) {}

  // 4. Registra no histórico de lotação
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    await supabase.from('LotacaoHistorico').insert([{
      id: novoHistId,
      org_id: user?.org_id || undefined,
      company_id: destino_id,
      trabalhador_id,
      trabalhador_nome: nome,
      data_inicio: hoje,
      tipo_movimentacao: 'transferencia_empresa',
      observacao: `Transferido de ${origem?.razao_social || 'empresa de origem'} para ${destino?.razao_social || 'empresa de destino'}.`,
    }]);
  } catch (_) {}

  return {
    ok: true,
    origem: origem?.razao_social || origem_id,
    destino: destino?.razao_social || destino_id,
    registros_atualizados: atualizados,
  };
}
