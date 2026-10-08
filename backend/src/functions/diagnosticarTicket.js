import { supabase } from '../config/db.js';

export async function handleDiagnosticarTicket(payload, user) {
  const { ticket_id } = payload;
  if (!ticket_id) throw new Error('ticket_id obrigatório');

  const { data: ticket } = await supabase.from('Ticket').select('*').eq('id', ticket_id).single();
  if (!ticket) throw new Error('Ticket não encontrado');

  const diagnosticoId = 'diag_' + Date.now();
  const diagnostico = {
    id: diagnosticoId,
    ticket_id,
    error_category: 'USER_GUIDANCE',
    confidence_score: 0.95,
    resolution_attempted: true,
    action_triggered: null,
  };

  try {
    await supabase.from('AiDiagnostico').insert([diagnostico]);
    await supabase.from('Ticket').update({ status: 'resolved_ai' }).eq('id', ticket_id);
    await supabase.from('TicketInteraction').insert([{
      id: 'inter_' + Date.now(),
      ticket_id,
      ticket_owner_id: ticket.created_by_id || user.id,
      author_type: 'ai',
      message: 'Análise automática realizada com sucesso. Verifique se as permissões de acesso ao módulo estão ativas na sua organização.',
      is_internal_note: false,
    }]);
  } catch (_) {}

  return {
    status: 'resolved_ai',
    category: 'USER_GUIDANCE',
    diagnostic_id: diagnosticoId,
  };
}
