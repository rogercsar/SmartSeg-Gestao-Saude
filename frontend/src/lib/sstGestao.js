// Utilitários e catálogos da gestão operacional de SST (EPI, treinamentos, CIPA, inspeções, vencimentos)
import { hojeLocal, addDias, diffDias, dataBR } from "@/lib/afastamentos";

export { hojeLocal, addDias, diffDias, dataBR };

export const addMeses = (s, m) => {
  if (!s || !m) return null;
  const d = new Date(s + "T12:00:00Z");
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + Number(m));
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return d.toISOString().slice(0, 10);
};

// Situação de um prazo: vencido | vence (dentro do aviso) | ok | sem (sem data)
export function situacao(data, avisoDias = 30, hoje = hojeLocal()) {
  if (!data) return { k: "sem", label: "Sem data", cor: "#5F6368", dias: null };
  const d = diffDias(data, hoje);
  if (d < 0) return { k: "vencido", label: `Vencido há ${-d} dia(s)`, cor: "#B42318", dias: d };
  if (d <= avisoDias) return { k: "vence", label: d === 0 ? "Vence hoje" : `Vence em ${d} dia(s)`, cor: "#8A5A00", dias: d };
  return { k: "ok", label: `Em dia (${dataBR(data)})`, cor: "#146C43", dias: d };
}

export const TIPOS_EPI = {
  cabeca: "Cabeça", olhos_face: "Olhos e face", auditivo: "Auditivo", respiratorio: "Respiratório", tronco: "Tronco",
  maos_bracos: "Mãos e braços", pernas_pes: "Pernas e pés", corpo_inteiro: "Corpo inteiro", queda_altura: "Queda de altura", outro: "Outro",
};
export const MOTIVOS_ENTREGA = { primeira_entrega: "Primeira entrega", troca_periodica: "Troca periódica", desgaste: "Desgaste / dano", perda: "Perda", outro: "Outro" };

// Treinamentos usuais — valores de referência; o responsável técnico deve confirmar na NR vigente
export const CATALOGO_TREINAMENTOS = [
  { nr: "NR-01", titulo: "Integração de SST — riscos da função e medidas de prevenção", carga_horaria: "", reciclagem_meses: 0, fundamento: "NR-1 (capacitação inicial; nova capacitação em mudança de função/risco)" },
  { nr: "NR-05", titulo: "Treinamento da CIPA / designado", carga_horaria: "", reciclagem_meses: 12, fundamento: "NR-5 (carga horária conforme o grau de risco; a cada mandato)" },
  { nr: "NR-06", titulo: "Uso, guarda e conservação de EPI", carga_horaria: "", reciclagem_meses: 0, fundamento: "NR-6" },
  { nr: "NR-09", titulo: "Exposição ao calor — riscos, sinais e sintomas, prevenção e emergência", carga_horaria: "", reciclagem_meses: 12, fundamento: "NR-09 Anexo III, 3.1.1 e 3.1.2 (anual, quando indicado nas medidas de prevenção)" },
  { nr: "NR-10", titulo: "Segurança em instalações e serviços em eletricidade — básico", carga_horaria: 40, reciclagem_meses: 24, fundamento: "NR-10" },
  { nr: "NR-12", titulo: "Segurança na operação de máquinas e equipamentos", carga_horaria: "", reciclagem_meses: 0, fundamento: "NR-12 (reciclagem em mudanças de máquina, processo ou método)" },
  { nr: "NR-23", titulo: "Brigada de emergência / prevenção e combate a incêndio", carga_horaria: "", reciclagem_meses: 12, fundamento: "NR-23 e normas do Corpo de Bombeiros" },
  { nr: "NR-33", titulo: "Espaço confinado — trabalhador autorizado e vigia", carga_horaria: 16, reciclagem_meses: 12, fundamento: "NR-33" },
  { nr: "NR-35", titulo: "Trabalho em altura", carga_horaria: 8, reciclagem_meses: 24, fundamento: "NR-35" },
];

// Carga horária do treinamento da CIPA por grau de risco (NR-5)
export const CH_CIPA = { 1: 8, 2: 12, 3: 16, 4: 20 };

export const FUNCOES_CIPA = { presidente: "Presidente", vice_presidente: "Vice-presidente", secretario: "Secretário(a)", titular: "Membro titular", suplente: "Suplente", designado: "Designado(a) NR-5" };

// Cronograma eleitoral a partir do fim do mandato atual (prazos mínimos da NR-5)
export function cronogramaEleitoral(fimMandato) {
  if (!fimMandato) return null;
  const edital = addDias(fimMandato, -60);
  return {
    edital,
    inscricoes_inicio: addDias(edital, 1),
    inscricoes_fim: addDias(edital, 15),
    votacao: addDias(fimMandato, -30),
    apuracao: addDias(fimMandato, -29),
    posse: addDias(fimMandato, 1),
  };
}

// Estabilidade: representantes eleitos dos empregados (titulares e suplentes) até 1 ano após o fim do mandato
export const fimEstabilidade = (fimMandato) => (fimMandato ? addMeses(fimMandato, 12) : null);

export const CHECKLISTS_PADRAO = [
  {
    nome: "Extintores, saídas e emergência", norma: "NR-23 e normas do Corpo de Bombeiros",
    itens: [
      "Extintores com carga e teste hidrostático dentro da validade",
      "Lacre intacto e manômetro na faixa de operação",
      "Extintores sinalizados, desobstruídos e na altura adequada",
      "Saídas de emergência desobstruídas, sinalizadas e com abertura no sentido de fuga",
      "Iluminação de emergência funcionando",
      "Hidrantes e mangueiras (se houver) sinalizados e em condições de uso",
      "Brigada de emergência com treinamento válido",
    ],
  },
  {
    nome: "Máquinas e equipamentos", norma: "NR-12",
    itens: [
      "Partes móveis e zonas de perigo com proteções fixas ou móveis intertravadas",
      "Parada de emergência acessível, identificada e funcionando",
      "Comandos identificados e protegidos contra acionamento acidental",
      "Aterramento elétrico da máquina",
      "Manual e procedimento de trabalho seguro disponíveis",
      "Operador capacitado e autorizado",
      "Manutenção preventiva registrada",
      "Área de circulação ao redor demarcada e livre",
    ],
  },
  {
    nome: "Instalações elétricas", norma: "NR-10",
    itens: [
      "Quadros elétricos fechados, sinalizados e com circuitos identificados",
      "Ausência de fios expostos, emendas precárias e sobrecarga em tomadas",
      "Tomadas, plugues e extensões em bom estado",
      "Sistema de aterramento existente",
      "Trabalhadores que intervêm em eletricidade são autorizados e capacitados",
      "Dispositivos de bloqueio e etiquetagem disponíveis",
    ],
  },
  {
    nome: "Trabalho em altura", norma: "NR-35",
    itens: [
      "Análise de risco e permissão de trabalho emitidas",
      "Cinto tipo paraquedista e talabarte inspecionados e com CA válido",
      "Pontos de ancoragem definidos e adequados",
      "Trabalhadores com treinamento válido e aptidão registrada no ASO",
      "Área abaixo isolada e sinalizada",
      "Plano de resgate definido e equipe informada",
    ],
  },
  {
    nome: "Uso e conservação de EPI", norma: "NR-6",
    itens: [
      "EPIs exigidos no PGR estão sendo usados",
      "EPIs em bom estado de conservação",
      "CA dos EPIs dentro da validade",
      "Fichas de entrega atualizadas e assinadas",
      "Local adequado para guarda e higienização",
    ],
  },
  {
    nome: "Ordem, limpeza e condições sanitárias", norma: "NR-24 e NR-8",
    itens: [
      "Pisos limpos, sem obstáculos, buracos ou saliências",
      "Instalações sanitárias limpas e em número adequado",
      "Vestiários com armários, quando exigidos",
      "Água potável e fresca disponível",
      "Local adequado para refeições",
      "Resíduos segregados e com descarte adequado",
    ],
  },
  {
    nome: "Produtos químicos", norma: "NR-26 e NR-20",
    itens: [
      "FISPQ/FDS disponível para todos os produtos",
      "Embalagens rotuladas (GHS) e identificadas",
      "Armazenamento ventilado, segregado por compatibilidade",
      "Contenção para derramamentos e kit de emergência",
      "EPI adequado para o manuseio disponível",
      "Trabalhadores orientados sobre os riscos dos produtos",
    ],
  },
];

export const PRIORIDADES = { baixa: ["Baixa", "#146C43"], media: ["Média", "#8A5A00"], alta: ["Alta", "#B42318"] };
export const STATUS_ACAO = { pendente: "Pendente", andamento: "Em andamento", concluida: "Concluída" };
