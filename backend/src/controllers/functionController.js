import { handleClinica } from '../functions/clinica.js';
import { handlePsicossocial } from '../functions/psicossocial.js';
import { handleTransferirTrabalhador } from '../functions/transferirTrabalhador.js';
import { handleAutenticidade } from '../functions/autenticidade.js';
import { handleOrganizacao } from '../functions/organizacao.js';
import { handleFaturamento } from '../functions/faturamento.js';
import { handleLembretesPlano } from '../functions/lembretesPlano.js';
import { handleEnviarRelatorio } from '../functions/enviarRelatorio.js';
import { handleAiInvoke } from '../functions/aiInvoke.js';
import { handleDiagnosticarTicket } from '../functions/diagnosticarTicket.js';
import { handleAssinar } from '../functions/assinar.js';

export async function invokeFunction(req, res) {
  const { name } = req.params;
  const payload = req.body || {};
  const user = req.user || {
    id: 'user_default',
    email: 'admin@smartseg.com.br',
    full_name: 'Administrador SmartSeg',
    role: 'admin',
  };

  try {
    let result;
    switch (name) {
      case 'clinica':
        result = await handleClinica(payload, user);
        break;

      case 'pesquisa-psicossocial':
        result = await handlePsicossocial(payload, user);
        break;

      case 'transferir-trabalhador':
        result = await handleTransferirTrabalhador(payload, user);
        break;

      case 'autenticidade':
        result = await handleAutenticidade(payload, user);
        break;

      case 'organizacao':
        result = await handleOrganizacao(payload, user);
        break;

      case 'faturamento':
        result = await handleFaturamento(payload, user);
        break;

      case 'enviar-lembretes-plano':
        result = await handleLembretesPlano(payload, user);
        break;

      case 'enviar-relatorio':
        result = await handleEnviarRelatorio(payload, user);
        break;

      case 'ai-invoke':
        result = await handleAiInvoke(payload, user);
        break;

      case 'diagnosticar-ticket':
        result = await handleDiagnosticarTicket(payload, user);
        break;

      case 'assinar':
        result = await handleAssinar(payload, user);
        break;

      default:
        result = {
          status: 'ok',
          function: name,
          message: `Função ${name} executada com sucesso`,
          received: payload,
        };
    }

    return res.json(result);
  } catch (error) {
    console.error(`[Erro na Função ${name}]:`, error);
    return res.status(500).json({
      error: error.message || 'Erro ao processar função',
      function: name,
    });
  }
}
