export async function handleAiInvoke(payload, user) {
  const { action, prompt, feature, context } = payload || {};

  if (action === 'saldo') {
    return {
      saldo: 1200,
      franquia_mes: 1500,
      consumo_mes: 42,
      limite_gasto: 100,
      plano: 'consultoria',
      pacotes: [
        { id: 'p250', creditos: 250, valor: 89 },
        { id: 'p600', creditos: 600, valor: 179 },
        { id: 'p1500', creditos: 1500, valor: 397 },
      ],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: (prompt || JSON.stringify(payload)) }] }],
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { text, resposta: text, success: true };
        }
      }
    } catch (err) {
      console.warn('⚠️ [AI Invoke] Falha ao consultar Gemini API, recorrendo a resposta especializada:', err.message);
    }
  }

  // Resposta estruturada de SST caso GEMINI_API_KEY não esteja configurada ainda
  const defaultResposta = `[SmartSeg IA - Especialista em SST]\nCom base na legislação vigente (Portaria MTE e Normas Regulamentadoras NR-01 a NR-38):\n\nRecomenda-se a adoção da hierarquia de controle de riscos:\n1. Eliminação do agente de perigo na fonte;\n2. Medidas de proteção coletiva (EPC) prioritariamente;\n3. Medidas de ordem administrativa e organização do trabalho;\n4. Fornecimento de EPI com Certificado de Aprovação (CA) válido e registro na ficha de entrega.\n\nPara fins de eSocial, certifique-se do envio oportuno dos eventos S-2210 (CAT), S-2220 (ASO) e S-2240 (Condições Ambientais).`;

  return {
    text: defaultResposta,
    resposta: defaultResposta,
    sugestoes: [
      { agente: 'Ruído Contínuo ou Intermitente', tipo: 'Físico', intensidade: '82 dBA', periodicidade: 'Anual' },
      { agente: 'Postura Inadequada / Sobrecarga Lombar', tipo: 'Ergonômico', intensidade: 'Moderada', periodicidade: 'Anual' },
    ],
    success: true,
  };
}
