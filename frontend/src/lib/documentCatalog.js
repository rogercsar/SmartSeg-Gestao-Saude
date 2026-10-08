// Catálogo de documentos organizado em 4 grupos.
// status: "active" = implementado e funcional | "planned" = em breve
export const DOC_GROUPS = [
  { id: 1, title: "Documentos do dia a dia", desc: "Maior demanda, prontos em segundos" },
  { id: 2, title: "Documentos técnicos", desc: "Maior valor percebido pelo cliente" },
  { id: 3, title: "CIPA", desc: "Processo eleitoral e reuniões (NR-5)" },
  { id: 4, title: "Funções além de documentos", desc: "O que fideliza o cliente" },
];

export const DOC_TYPES = [
  // Grupo 1 — dia a dia
  {
    id: "lista_presenca", group: 1, label: "Lista de Presença",
    desc: "Tema, data, carga horária, instrutor e nomes — pronta para assinatura.",
    status: "active", needsCargo: false, needsAI: false,
    fields: [
      { key: "tema", label: "Tema do treinamento", type: "text" },
      { key: "data", label: "Data", type: "date" },
      { key: "carga_horaria", label: "Carga horária", type: "text", placeholder: "ex: 8h" },
      { key: "instrutor", label: "Instrutor", type: "text" },
      { key: "nomes", label: "Nomes dos colaboradores (um por linha)", type: "textarea" },
    ],
  },
  {
    id: "dds", group: 1, label: "Sugestão de DDS",
    desc: "Tema do dia conforme atividade/CNAE, com roteiro e perguntas para engajar.",
    status: "active", needsCargo: false, needsAI: true,
    fields: [
      { key: "tema", label: "Tema (opcional — deixe vazio para a IA sugerir)", type: "text" },
    ],
  },
  {
    id: "certificado", group: 1, label: "Certificado de Treinamento",
    desc: "Conteúdo programático e carga horária exigidos por cada NR.",
    status: "active", needsCargo: false, needsAI: true,
    fields: [
      { key: "nr", label: "NR do treinamento", type: "text", placeholder: "ex: NR-10" },
      { key: "treinando", label: "Nome do treinando", type: "text" },
      { key: "carga_horaria", label: "Carga horária", type: "text", placeholder: "ex: 40h" },
      { key: "data_conclusao", label: "Data de conclusão", type: "date" },
      { key: "instrutor", label: "Instrutor", type: "text" },
    ],
  },
  {
    id: "termo_recusa_epi", group: 1, label: "Termo de Recusa de EPI",
    desc: "Recusa e advertência por não uso — útil em defesa trabalhista.",
    status: "active", needsCargo: false, needsAI: false,
    fields: [
      { key: "funcionario", label: "Nome do funcionário", type: "text" },
      { key: "epi_recusado", label: "EPI recusado", type: "text" },
      { key: "motivo", label: "Motivo da recusa", type: "textarea" },
      { key: "data", label: "Data", type: "date" },
    ],
  },
  {
    id: "sipat", group: 1, label: "Programação de SIPAT",
    desc: "Cronograma de palestras e atividades da semana.",
    status: "planned",
  },
  // Grupo 2 — técnicos
  {
    id: "ordem_servico", group: 2, label: "Ordem de Serviço (NR-1)",
    desc: "Instruções de segurança por cargo/função.",
    status: "active", needsCargo: true, needsAI: false, fields: [],
  },
  {
    id: "ficha_epi", group: 2, label: "Ficha de Entrega de EPI (NR-6)",
    desc: "Registro de entrega de EPIs com CA.",
    status: "active", needsCargo: true, needsAI: false, fields: [],
  },
  {
    id: "pgr", group: 2, label: "PGR / APR — Rascunho",
    desc: "Perigos, riscos e medidas de controle com matriz 5×5. Sugestão da IA, você edita cada linha.",
    status: "active", needsCargo: false, needsAI: true, customForm: true, fields: [],
  },
  {
    id: "pt", group: 2, label: "Permissão de Trabalho (PT)",
    desc: "Altura, espaço confinado, trabalho a quente e eletricidade.",
    status: "planned",
  },
  {
    id: "checklist_inspecao", group: 2, label: "Checklists de Inspeção",
    desc: "Máquinas (NR-12), andaimes (NR-18), extintores, elétrica.",
    status: "planned",
  },
  {
    id: "relatorio_acidente", group: 2, label: "Relatório de Investigação de Acidente",
    desc: "Árvore de causas / 5 porquês e plano de ação.",
    status: "planned",
  },
  {
    id: "pgr_inventario", group: 2, label: "Apoio ao Inventário de Riscos (PGR)",
    desc: "Perigos e riscos por função, incluindo os psicossociais.",
    status: "planned",
  },
  // Grupo 3 — CIPA
  {
    id: "cipa_kit", group: 3, label: "Kit Eleitoral NR-5",
    desc: "Edital, inscrição, ata de eleição, ata de posse e calendário.",
    status: "planned",
  },
  {
    id: "ata_reuniao", group: 3, label: "Atas de Reunião Ordinária",
    desc: "A partir de anotações soltas do técnico.",
    status: "planned",
  },
  // Grupo 4 — além de documentos
  {
    id: "controle_vencimentos", group: 4, label: "Controle de Vencimentos",
    desc: "Avisos de treinamento, ASO e CA de EPI.",
    status: "planned",
  },
  {
    id: "consulta_ca", group: 4, label: "Consulta de CA",
    desc: "Verificar se o Certificado de Aprovação do EPI é válido.",
    status: "planned",
  },
];

export const DOC_BY_ID = Object.fromEntries(DOC_TYPES.map((d) => [d.id, d]));