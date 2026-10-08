import { supabase } from '../config/db.js';

const hojeStr = () => new Date().toISOString().slice(0, 10);

function somaDias(d, n) {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export async function handleLembretesPlano(payload, user) {
  const hoje = hojeStr();
  let enviados = 0;
  let planosTocados = 0;

  const { data: planos } = await supabase.from('PlanoAcao').select('*').in('status', ['pendente', 'andamento']);

  for (const plano of planos || []) {
    const lembretes = (plano.lembretes || []).filter((l) => l.ativo !== false);
    if (!lembretes.length) continue;

    let alterado = false;
    const novosLembretes = lembretes.map((l) => ({ ...l }));
    const novasNotificacoes = [...(plano.notificacoes_enviadas || [])];

    for (const l of novosLembretes) {
      const ant = Number(l.antecedencia_dias) || 0;
      let disparar = false;
      let motivo = '';

      if (l.tipo === 'prazo' && plano.prazo) {
        const alvo = somaDias(plano.prazo, -ant);
        if (hoje >= alvo && hoje <= plano.prazo && !l.ultimo_envio) {
          disparar = true;
          motivo = ant ? `o prazo vence em ${plano.prazo} (falta(m) ${ant} dia(s))` : `o prazo vence hoje (${plano.prazo})`;
        }
      }

      if (disparar) {
        const reg = {
          data: hoje,
          tipo: `${l.tipo}${l.antecedencia_dias ? ` (-${l.antecedencia_dias}d)` : ''}`,
          destinatarios: [plano.responsavel_email || 'responsavel@empresa.com'],
          meio: 'painel',
          status: 'enviado',
          motivo,
        };
        novasNotificacoes.push(reg);
        l.ultimo_envio = hoje;
        enviados++;
        alterado = true;
      }
    }

    if (alterado) {
      await supabase.from('PlanoAcao').update({
        lembretes: novosLembretes,
        notificacoes_enviadas: novasNotificacoes,
      }).eq('id', plano.id);
      planosTocados++;
    }
  }

  return {
    ok: true,
    enviados,
    planos_tocados: planosTocados,
    responsavel: user?.full_name || 'Agente de Sistema',
    rodado_em: hoje,
  };
}
