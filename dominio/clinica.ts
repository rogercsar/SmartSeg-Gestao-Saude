// Origem: referencia-base44/src/lib/clinica.js — constantes e regras da clínica (o acesso aos dados fica no backend)


export const TIPOS_ASO = { admissional: "Admissional", periodico: "Periódico", retorno: "Retorno ao trabalho", mudanca_risco: "Mudança de risco", demissional: "Demissional" };
export const PERFIS = { admin: "Administrador", medico: "Médico(a)", enfermagem: "Enfermagem", recepcao: "Recepção", fono: "Fonoaudiologia" };
export const STATUS_AG = {
  agendado: ["Agendado", "#5F6368"], confirmado: ["Confirmado", "#0B6FA8"], chegou: ["Chegou", "#8A5A00"], em_atendimento: ["Em atendimento", "#7C3AED"],
  concluido: ["Concluído", "#146C43"], faltou: ["Faltou", "#B42318"], cancelado: ["Cancelado", "#5F6368"],
};
export const STATUS_AT = {
  aberto: ["Aguardando triagem", "#8A5A00"], triagem: ["Triagem feita", "#0B6FA8"], consulta: ["Em consulta", "#7C3AED"],
  aguardando_resultados: ["Aguardando resultados", "#8A5A00"], finalizado: ["ASO emitido", "#146C43"], cancelado: ["Cancelado", "#5F6368"],
};
export const CONCLUSOES = { apto: ["Apto", "#146C43"], apto_restricao: ["Apto com restrição", "#8A5A00"], inapto: ["Inapto", "#B42318"] };

// Etiqueta financeira mostrada na recepção
export function etiquetaFinanceira(fin, empFin) {
  if (!fin) return null;
  if (empFin?.situacao === "bloqueado") return ["Empresa bloqueada", "#B42318"];
  if (fin.tipo === "avulso") return fin.pago ? [`Avulso — guia ${fin.guia_codigo || ""} paga`, "#146C43"] : [`Avulso — pagar${fin.valor ? " R$ " + Number(fin.valor).toFixed(2).replace(".", ",") : ""} (guia ${fin.guia_codigo || "—"})`, "#B42318"];
  if (fin.tipo === "kit") return (empFin?.kit_saldo ?? 1) > 0 ? [`Kit — saldo ${empFin?.kit_saldo ?? "?"}`, "#146C43"] : ["Kit sem saldo", "#B42318"];
  if (empFin?.situacao === "pendente") return ["Contrato — pendência financeira", "#8A5A00"];
  return ["Contrato — liberado", "#146C43"];
}

export const ANTECEDENTES = ["Hipertensão", "Diabetes", "Epilepsia / convulsões", "Cardiopatia", "Labirintite / vertigem", "Asma / bronquite", "Lombalgia / hérnia de disco", "Depressão / ansiedade", "Perda auditiva", "Problema de visão", "Alergias", "Cirurgias prévias"];
export const CAMPOS_EXAME_FISICO = [
  ["estado_geral", "Estado geral"], ["pele", "Pele e anexos"], ["cabeca_pescoco", "Cabeça e pescoço"], ["cardiovascular", "Aparelho cardiovascular"],
  ["respiratorio", "Aparelho respiratório"], ["abdome", "Abdome"], ["membros", "Membros superiores e inferiores"], ["coluna", "Coluna"], ["neurologico", "Neurológico"],
];

// Códigos do eSocial (S-2220): tipo de exame e resultado
export const TP_EXAME_ESOCIAL = { admissional: 0, periodico: 1, retorno: 2, mudanca_risco: 3, demissional: 9 };
export const soNum = (s) => String(s || "").replace(/\D/g, "");
