// Instrumentos de rastreamento de sinais de bem-estar ocupacional.
// Todos de domínio público / validados no Brasil, adaptados para triagem curta.
//
// IMPORTANTE — RASTREAMENTO, NÃO DIAGNÓSTICO:
// O resultado é um SINAL para o usuário decidir se quer procurar um profissional
// de saúde. Nenhum app substitui uma avaliação clínica. Nunca emitir rótulo
// diagnóstico ("você tem burnout") — apenas a faixa de sinais.

export const DISCLAIMER =
  "Isto é rastreamento de sinais, não diagnóstico. O resultado é um sinal para você decidir se quer procurar um profissional de saúde — nenhum app substitui uma avaliação.";

// Orientação de rotas quando o usuário decide buscar ajuda.
export const HELP_ROUTES = [
  { label: "CAPS", text: "Centro de Atenção Psicossocial — gratuito, pelo SUS. Procure a unidade do seu município." },
  { label: "Plano de saúde", text: "Verifique a cobertura de consultas com psicólogo e psiquiatra no seu plano." },
  { label: "CRP", text: "O Conselho Regional de Psicologia da sua região indica profissionais cadastrados." },
  { label: "CVV 188", text: "Apoio emocional gratuito, 24h, se estiver em crise aguda." },
];

export const INSTRUMENTS = {
  pss4: {
    id: "pss4",
    label: "Estresse percebido",
    emoji: "🌊",
    duration: "~1 min · 4 perguntas",
    kind: "screen",
    description: "Quão sobrecarregado você se sentiu no último mês. (PSS-4)",
    scale: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Muito frequentemente"],
    items: [
      { text: "No último mês, com que frequência você sentiu que não conseguia controlar as coisas importantes da sua vida?", reverse: false },
      { text: "No último mês, com que frequência você se sentiu confiante na sua capacidade de lidar com seus problemas pessoais?", reverse: true },
      { text: "No último mês, com que frequência você sentiu que as dificuldades se acumulavam tanto que você não conseguiria superá-las?", reverse: false },
      { text: "No último mês, com que frequência você sentiu que não conseguia lidar com tudo o que tinha que fazer?", reverse: false },
    ],
    max: 16,
    levels: [
      { max: 5, level: "baixo", label: "Sinais leves", message: "Seu nível de estresse parece manejável. Continue cuidando do seu equilíbrio e dos pequenos sinais do seu corpo." },
      { max: 10, level: "moderado", label: "Sinais moderados", message: "Você está carregando um peso moderado. Vale pausar e olhar o que está drenando sua energia — e considerar conversar com alguém." },
      { max: 16, level: "elevado", label: "Sinais elevados", message: "Seus sinais de estresse estão elevados. Isso merece atenção real — considere procurar um profissional de saúde." },
    ],
  },

  olbi8: {
    id: "olbi8",
    label: "Sinais de esgotamento",
    emoji: "🔥",
    duration: "~2 min · 8 perguntas",
    kind: "screen",
    description: "Sinais de exaustão e descrença no trabalho. (adaptado do OLBI)",
    scale: ["Discordo totalmente", "Discordo", "Concordo", "Concordo totalmente"],
    items: [
      { text: "Após o trabalho, costumo me sentir esgotado de energia.", reverse: false },
      { text: "Sinto-me cansado mesmo antes de começar a trabalhar.", reverse: false },
      { text: "Durante o trabalho, sinto-me exausto.", reverse: false },
      { text: "Frequentemente sinto que não tenho mais energia para o trabalho.", reverse: false },
      { text: "Tenho perdido o interesse pelo meu trabalho.", reverse: false },
      { text: "Sinto-me cada vez menos engajado com o que faço.", reverse: false },
      { text: "Falo do meu trabalho de forma mais negativa do que antes.", reverse: false },
      { text: "Tenho pensado em mudar de trabalho ou profissão.", reverse: false },
    ],
    max: 24,
    levels: [
      { max: 8, level: "baixo", label: "Sinais leves", message: "Seus sinais de esgotamento estão baixos. Você ainda se sente conectado com o sentido do seu trabalho." },
      { max: 16, level: "moderado", label: "Sinais moderados", message: "Há sinais de esgotamento e descrença. Vale olhar com carinho o que está te distanciando do trabalho." },
      { max: 24, level: "elevado", label: "Sinais elevados", message: "Seus sinais de esgotamento estão elevados. Isso é sério — considere uma conversa com um profissional de saúde." },
    ],
  },

  ucla3: {
    id: "ucla3",
    label: "Solidão",
    emoji: "🪨",
    duration: "~1 min · 3 perguntas",
    kind: "screen",
    description: "Com que frequência você se sente sozinho. (UCLA-3)",
    scale: ["Quase nunca", "Às vezes", "Frequentemente"],
    items: [
      { text: "Quantas vezes você sente falta de companhia?", reverse: false },
      { text: "Quantas vezes você se sente deixado de lado?", reverse: false },
      { text: "Quantas vezes você se sente isolado dos outros?", reverse: false },
    ],
    max: 6,
    levels: [
      { max: 1, level: "baixo", label: "Sinais leves", message: "Você tem se sentido acompanhado. Isso protege — manter conexões de verdade é parte do cuidado." },
      { max: 3, level: "moderado", label: "Sinais moderados", message: "Você sente solidão com alguma frequência. Você não é o único: muitos profissionais de SST relatam isolamento decisório. Pode ajudar falar com alguém de confiança." },
      { max: 6, level: "elevado", label: "Sinais elevados", message: "Você tem se sentido isolado com frequência. Solidão crônica pesa tanto quanto um fator de risco físico — considere buscar conexão e apoio profissional." },
    ],
  },

  disconnection: {
    id: "disconnection",
    label: "Desconexão digital",
    emoji: "📡",
    duration: "~1 min · 4 perguntas",
    kind: "reflection",
    description: "Seu padrão de hiperconexão com o trabalho. (auto-reflexão, não clínico)",
    scale: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Muito frequentemente"],
    items: [
      { text: "Quantas vezes você responde mensagens de trabalho fora do horário?", reverse: false },
      { text: "Quantas vezes você checa mensagens de trabalho ao acordar ou antes de dormir?", reverse: false },
      { text: "Quantas vezes você sente que precisa estar sempre disponível para o trabalho?", reverse: false },
      { text: "Quantas vezes você consegue ficar algumas horas sem checar mensagens de trabalho?", reverse: true },
    ],
    max: 16,
    levels: [
      { max: 5, level: "baixo", label: "Conexão saudável", message: "Você mantém um limite saudável entre trabalho e descanso. Continue protegendo esse espaço." },
      { max: 10, level: "moderado", label: "Hiperconexão moderada", message: "O trabalho costuma invadir seu descanso. Estudos da OIT associam esse padrão a fadiga e burnout — vale criar um horário fixo de desligar." },
      { max: 16, level: "elevado", label: "Hiperconexão elevada", message: "Você está quase sempre ligado ao trabalho. Isso é um fator de risco psicossocial reconhecido — considere um acordo de desconexão e apoio profissional se sentir esgotamento." },
    ],
  },
};

export function computeScore(instrument, values) {
  const n = instrument.scale.length;
  return values.reduce((sum, v, i) => {
    const item = instrument.items[i];
    const val = item.reverse ? n - 1 - v : v;
    return sum + val;
  }, 0);
}

export function levelFor(instrument, score) {
  return (
    instrument.levels.find((l) => score <= l.max) ||
    instrument.levels[instrument.levels.length - 1]
  );
}

export const LEVEL_COLORS = {
  baixo: "#22C55E",
  moderado: "#EAB308",
  elevado: "#F97316",
};