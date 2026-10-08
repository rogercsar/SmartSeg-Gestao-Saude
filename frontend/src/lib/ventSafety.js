import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/ai";

// Utilitários do Canal de escuta: anonimato e detecção de risco grave.

// Gera/Recupera um identificador anônimo persistente (não vinculado ao usuário logado).
export function getAnonymousId() {
  let id = localStorage.getItem("zela:anon_id");
  if (!id) {
    id = "anon-" + crypto.randomUUID();
    localStorage.setItem("zela:anon_id", id);
  }
  return id;
}

// Palavras/expressões que indicam risco grave — dispara o cartão de apoio imediato (fallback rápido).
const RISK_PATTERNS = [
  "desistir de tudo", "desistir", "não aguento mais", "nao aguento mais",
  "não vejo saída", "nao vejo saida", "não vejo saida", "sem saída", "sem saida",
  "acabar com tudo", "me machucar", "machucar a mim", "sumir", "pular",
  "me matar", "suicíd", "suicid", "tirar minha vida", "tirar a vida",
  "não quero viver", "nao quero viver", "não vale a pena", "cansado de viver",
  "fazer besteira", "perder o controle", "última vez", "ultima vez",
  "acabar com a minha vida", "não tenho mais forças", "nao tenho mais forcas",
];

export function detectRisk(text) {
  const lower = (text || "").toLowerCase();
  return RISK_PATTERNS.some((p) => lower.includes(p));
}

// Classificação de risco por IA (chamada separada ao modelo).
// Retorna { categoria, palavras }. Em caso de falha, retorna "nenhum".
// Para "terceiros": NUNCA sugere meios, locais ou métodos — apenas classifica.
export async function classifyRisk(text) {
  try {
    const res = await invokeAI("zeca_risco", {
      prompt: `Você é um sistema de triagem de risco em um espaço de escuta. Classifique a seguinte mensagem em UMA categoria:
- "autolesao": ideação suicida, autolesão, desesperança grave
- "risco_fisico": risco físico imediato (acidente, violência sofrida — não autolesão)
- "terceiros": plano concreto de violência contra terceiros (com meio, local ou horário definido)
- "nenhum": sem risco grave identificado

Para "terceiros": NUNCA sugira meios, locais ou métodos. Apenas classifique.

Retorne apenas JSON com a categoria e uma lista de palavras-chave que justificam a classificação.

Mensagem: """${text}"""`,
      response_json_schema: {
        type: "object",
        properties: {
          categoria: { type: "string", enum: ["nenhum", "autolesao", "risco_fisico", "terceiros"] },
          palavras: { type: "array", items: { type: "string" } },
        },
      },
    });
    return typeof res === "object" ? res : { categoria: "nenhum", palavras: [] };
  } catch {
    return { categoria: "nenhum", palavras: [] };
  }
}

export const CVV_INFO = {
  phone: "188",
  label: "CVV — Centro de Valorização da Vida",
  message:
    "Se o que você está sentindo pesa demais agora, você não precisa enfrentar isso sozinho. Ligue para o CVV no 188 (gratuito, 24h) ou acesse cvv.org.br. Procure também um profissional de saúde mental de confiança.",
};

// Números de emergência — sempre visíveis no cartão de apoio quando há risco.
export const EMERGENCY_NUMBERS = [
  { numero: "188", label: "CVV", desc: "Crise emocional · 24h" },
  { numero: "192", label: "SAMU", desc: "Emergência médica" },
  { numero: "193", label: "Bombeiros", desc: "Resgate e salvamento" },
  { numero: "190", label: "Polícia", desc: "Perigo iminente" },
];

// Técnica de aterramento 5-4-3-2-1 — oferecida dentro da própria conversa.
export const GROUNDING_TECHNIQUE = `Vamos ancorar juntos, devagar. Olha ao redor e me diz, no seu ritmo:

1. Cinco coisas que você consegue VER agora.
2. Quatro que consegue TOCAR.
3. Três que consegue OUVIR.
4. Duas que consegue CHEIRAR.
5. Uma que consegue SABOREAR.

Vai um por um. Eu fico aqui com você.`;

// Ponto de confiança: texto HONESTO sobre quem vê o quê.
// Não afirmamos "100% anônimo" enquanto existir vínculo técnico com a conta.
export const ACCESS_TRUST =
  "O que você escreve aqui não é exibido para sua empresa, seus clientes nem para a equipe. A plataforma registra um vínculo técnico interno (criado automaticamente), mas ninguém tem acesso ao conteúdo dos seus desabafos.";

// 3 rotas do Safety Kit (modelo Elomia, adaptado).
export const SAFETY_ROUTES = [
  {
    id: "ground",
    label: "Ancorar agora",
    desc: "Uma técnica de aterramento (5-4-3-2-1) aqui na conversa, agora.",
  },
  {
    id: "cvv",
    label: "Linha de crise (CVV)",
    desc: "188 — gratuito, 24h. Você não precisa enfrentar isso sozinho.",
  },
  {
    id: "contato",
    label: "Alguém de confiança",
    desc: "Quer que eu te lembre de ligar pra alguém em quem você confia, agora?",
  },
];