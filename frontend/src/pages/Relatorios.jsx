import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { novoDoc, secao, tabela, kpisLinha, finalizar } from "@/lib/relatorioPdf";
import EmailModal from "@/components/relatorios/EmailModal";
import {
  FileBarChart, Download, Printer, Mail, Loader2, ArrowRight,
  Building2, Users, AlertTriangle, Stethoscope, GraduationCap, ClipboardList,
  HardHat, Wallet, ShieldAlert, FileText, TrendingUp, UsersRound, ClipboardCheck, Brain, Send,
  Syringe, Activity, PackageSearch, CheckCircle2, FileSpreadsheet, TestTube2,
} from "lucide-react";

const WORK = { bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE", accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368" };
const M = (o, k, f = "—") => (o && o[k] != null && o[k] !== "" ? String(o[k]) : f);
const brlShort = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MOTIVO_ATESTADO = { doenca: "Doença", trabalho: "Trabalho", trajeto: "Trajeto", outro: "Outro" };
const TX_TIPO = { PAYABLE: "Pagar", RECEIVABLE: "Receber" };
const TX_STATUS = { PENDING: "Pendente", PAID: "Pago", OVERDUE: "Atrasado", CANCELLED: "Cancelado" };

// Catálogo de relatórios: cada item tem carregar() (busca dados) e montar(dados, user) (gera o jsPDF final).
const RELATORIOS = [
  {
    id: "indicadores", titulo: "Indicadores gerais de SST", modulo: "Visão geral", icone: TrendingUp,
    descricao: "Totais de empresas, colaboradores, riscos, acidentes, atestados, treinamentos, inspeções e EPIs.",
    carregar: async () => {
      const [emp, col, ris, aci, ate, tre, ins, epi, pla] = await Promise.all([
        base44.entities.Company.count({}), base44.entities.Trabalhador.count({ status: "ativo" }),
        base44.entities.Risco.count({}), base44.entities.OcorrenciaAcidente.count({}),
        base44.entities.Atestado.count({}), base44.entities.Treinamento.count({}),
        base44.entities.InspecaoChecklist.count({}), base44.entities.EntregaEpi.count({}),
        base44.entities.PlanoAcao.count({ status: { $in: ["pendente", "andamento"] } }),
      ].map((p) => p.catch(() => 0)));
      return { emp, col, ris, aci, ate, tre, ins, epi, pla };
    },
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Indicadores gerais de SST", subtitulo: "Resumo quantitativo da operação", meta: [user?.full_name ? `Responsável: ${user.full_name}` : null].filter(Boolean) });
      let yy = kpisLinha(doc, y, [
        { label: "Empresas", valor: d.emp }, { label: "Colaboradores ativos", valor: d.col },
        { label: "Riscos", valor: d.ris }, { label: "Acidentes", valor: d.aci },
      ]);
      yy = kpisLinha(doc, yy, [
        { label: "Atestados", valor: d.ate }, { label: "Treinamentos", valor: d.tre },
        { label: "Inspeções", valor: d.ins }, { label: "Entregas de EPI", valor: d.epi },
      ]);
      yy = secao(doc, yy, "Plano de ação");
      yy = kpisLinha(doc, yy, [{ label: "Ações em aberto", valor: d.pla }]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "empresas", titulo: "Relação de empresas", modulo: "Cadastros", icone: Building2,
    descricao: "Lista de empresas-cliente com CNPJ, CNAE, porte e situação financeira.",
    carregar: async () => (await base44.entities.Company.filter({}, { limit: 500, sort: "razao_social" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Relação de empresas", meta: [`${d.length} registro(s)`] });
      const yy = tabela(doc, y, ["Razão Social", "CNPJ", "CNAE", "UF", "Porte", "Risco", "Situação"],
        d.map((e) => [M(e, "razao_social"), M(e, "cnpj"), M(e, "cnae"), M(e, "uf"), M(e, "porte"), M(e, "grau_de_risco"), M(e, "situacao_financeira")]),
        [54, 30, 30, 14, 20, 16, 28]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "colaboradores", titulo: "Relação de colaboradores", modulo: "Cadastros", icone: Users,
    descricao: "Colaboradores ativos com matrícula, admissão e dados cadastrais.",
    carregar: async () => (await base44.entities.Trabalhador.filter({ status: "ativo" }, { limit: 1000, sort: "nome" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Relação de colaboradores ativos", meta: [`${d.length} registro(s)`] });
      tabela(doc, y, ["Nome", "CPF", "Matrícula", "Admissão", "Sexo"],
        d.map((t) => [M(t, "nome"), M(t, "cpf"), M(t, "matricula"), M(t, "data_admissao"), M(t, "sexo", "—")]),
        [70, 34, 30, 30, 18]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "riscos", titulo: "Inventário de riscos", modulo: "Programas", icone: ShieldAlert,
    descricao: "Riscos identificados por tipo, agente, severidade/probabilidade e nível.",
    carregar: async () => (await base44.entities.Risco.filter({}, { limit: 2000, sort: "-created_date" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Inventário de riscos (PGR)", meta: [`${d.length} registro(s)`] });
      tabela(doc, y, ["Tipo", "Agente", "Fonte", "Sev.", "Prob.", "Nível", "Rev."],
        d.map((r) => [M(r, "tipo"), M(r, "agente"), M(r, "fonte_geradora"), M(r, "severidade"), M(r, "probabilidade"), M(r, "nivel_risco"), r.revisado ? "Sim" : "Não"]),
        [22, 34, 44, 14, 14, 28, 16]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "acidentes", titulo: "Relação de acidentes", modulo: "Segurança", icone: AlertTriangle,
    descricao: "Ocorrências de acidente com CAT, agente causador e afastamento.",
    carregar: async () => (await base44.entities.OcorrenciaAcidente.filter({}, { limit: 500, sort: "-data_hora" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Relação de acidentes / CAT", meta: [`${d.length} registro(s)`] });
      tabela(doc, y, ["Data/hora", "Trabalhador", "Local", "Agente", "Natureza", "Afast.", "CAT"],
        d.map((a) => [M(a, "data_hora"), M(a, "trabalhador_nome"), M(a, "local"), M(a, "agente_causador"), M(a, "natureza_lesao"), a.afastamento ? "Sim" : "Não", M(a, "cat_numero")]),
        [26, 44, 32, 30, 26, 12, 22]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "atestados", titulo: "Relação de atestados", modulo: "Saúde", icone: Stethoscope,
    descricao: "Atestados com dias de afastamento, motivo e médico emitente (sem CID).",
    carregar: async () => (await base44.entities.Atestado.filter({}, { limit: 500, sort: "-data_inicio" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Relação de atestados / afastamentos", meta: [`${d.length} registro(s)`, "Sem CID (dado sensível reservado)"] });
      tabela(doc, y, ["Colaborador", "Início", "Dias", "Motivo", "Médico", "CRM", "Benefício"],
        d.map((a) => [M(a, "trabalhador_nome"), M(a, "data_inicio"), M(a, "dias"), MOTIVO_ATESTADO[a.motivo] || M(a, "motivo"), M(a, "medico_nome"), M(a, "crm"), M(a, "beneficio_inss", "—")]),
        [46, 22, 12, 18, 38, 18, 28]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "treinamentos", titulo: "Relação de treinamentos", modulo: "Segurança", icone: GraduationCap,
    descricao: "Treinamentos realizados com NR, validade, carga horária e instrutor.",
    carregar: async () => (await base44.entities.Treinamento.filter({}, { limit: 1000, sort: "-validade" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Relação de treinamentos", meta: [`${d.length} registro(s)`] });
      tabela(doc, y, ["Trabalhador", "NR", "Título", "Realização", "Validade", "CH", "Instrutor"],
        d.map((t) => [M(t, "trabalhador_nome"), M(t, "nr"), M(t, "titulo"), M(t, "data_realizacao"), M(t, "validade"), M(t, "carga_horaria", "0") + "h", M(t, "instrutor")]),
        [44, 14, 40, 22, 22, 12, 28]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "inspecoes", titulo: "Relação de inspeções", modulo: "Segurança", icone: ClipboardList,
    descricao: "Inspeções de checklist com local, inspetor, conformidade e status.",
    carregar: async () => (await base44.entities.InspecaoChecklist.filter({}, { limit: 500, sort: "-data" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Relação de inspeções", meta: [`${d.length} registro(s)`] });
      tabela(doc, y, ["Data", "Checklist", "Local", "Inspetor", "Norma", "Conf.", "Status"],
        d.map((i) => [M(i, "data"), M(i, "modelo_nome"), M(i, "local"), M(i, "inspetor"), M(i, "norma"), M(i, "conformidade_pct", "—") + "%", M(i, "status")]),
        [22, 36, 40, 30, 20, 18, 16]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "epis", titulo: "Entregas de EPI", modulo: "Segurança", icone: HardHat,
    descricao: "Histórico de entregas de EPI com CA, quantidade e próxima troca.",
    carregar: async () => (await base44.entities.EntregaEpi.filter({}, { limit: 1000, sort: "-data_entrega" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Entregas de EPI", meta: [`${d.length} registro(s)`] });
      tabela(doc, y, ["Data", "Colaborador", "EPI", "CA", "Qtd", "Motivo", "Próx. troca"],
        d.map((e) => [M(e, "data_entrega"), M(e, "trabalhador_nome"), M(e, "epi_nome"), M(e, "ca"), M(e, "quantidade", "1"), M(e, "motivo"), M(e, "proxima_troca")]),
        [22, 44, 44, 18, 12, 24, 18]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "financeiro", titulo: "Resumo financeiro", modulo: "Financeiro", icone: Wallet,
    descricao: "Lançamentos a pagar/receber com vencimento, status e totais.",
    carregar: async () => (await base44.entities.FinancialTransaction.filter({}, { limit: 5000, sort: "-dueDate" })).items || [],
    montar: (d, user) => {
      const receber = d.filter((t) => t.type === "RECEIVABLE" && ["PENDING", "OVERDUE"].includes(t.status)).reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const pagar = d.filter((t) => t.type === "PAYABLE" && ["PENDING", "OVERDUE"].includes(t.status)).reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const quitado = d.filter((t) => t.status === "PAID").reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const { doc, y } = novoDoc({ titulo: "Resumo financeiro", meta: [`${d.length} lançamento(s)`] });
      let yy = kpisLinha(doc, y, [
        { label: "A receber", valor: brlShort(receber) }, { label: "A pagar", valor: brlShort(pagar) },
        { label: "Saldo", valor: brlShort(receber - pagar) }, { label: "Quitado", valor: brlShort(quitado) },
      ]);
      yy = secao(doc, yy, "Lançamentos");
      tabela(doc, yy, ["Tipo", "Descrição", "Vencimento", "Pagamento", "Status", "Valor"],
        d.map((t) => [TX_TIPO[t.type] || t.type, M(t, "description"), M(t, "dueDate"), M(t, "paymentDate", "—"), TX_STATUS[t.status] || t.status, brlShort(t.amount)]),
        [18, 54, 26, 26, 22, 26]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "cipa", titulo: "Mandatos da CIPA", modulo: "Segurança", icone: UsersRound,
    descricao: "Mandatos e membros da CIPA/designação, com vigência e status.",
    carregar: async () => (await base44.entities.MandatoCipa.filter({}, { limit: 200, sort: "-inicio" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Mandatos da CIPA", meta: [`${d.length} mandato(s)`] });
      tabela(doc, y, ["Tipo", "Início", "Fim", "Grau", "Membros", "Status"],
        d.map((m) => [m.tipo === "designado" ? "Designado" : "CIPA", M(m, "inicio"), M(m, "fim"), M(m, "grau_risco"), (m.membros || []).length, M(m, "status")]),
        [26, 24, 24, 28, 30, 30]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "esocial", titulo: "Eventos do eSocial", modulo: "eSocial", icone: Send,
    descricao: "Eventos transmitidos ao eSocial com recibo, data e status.",
    carregar: async () => (await base44.entities.EventoEsocial.filter({}, { limit: 1000, sort: "-data_evento" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Eventos do eSocial", meta: [`${d.length} evento(s)`] });
      tabela(doc, y, ["Evento", "Trabalhador", "Data", "Descrição", "Recibo", "Status"],
        d.map((e) => [M(e, "tipo_evento"), M(e, "trabalhador_nome"), M(e, "data_evento"), M(e, "descricao"), M(e, "recibo"), M(e, "status")]),
        [18, 44, 24, 40, 26, 20]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "plano-acao", titulo: "Planos de ação em aberto", modulo: "Programas", icone: ClipboardCheck,
    descricao: "Ações pendentes/em andamento com responsável, prazo e prioridade.",
    carregar: async () => (await base44.entities.PlanoAcao.filter({ status: { $in: ["pendente", "andamento"] } }, { limit: 1000, sort: "prazo" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Planos de ação em aberto", meta: [`${d.length} ação(ões)`] });
      tabela(doc, y, ["Ação", "Origem", "Responsável", "Prazo", "Prioridade", "Status"],
        d.map((p) => [M(p, "descricao"), M(p, "origem"), M(p, "responsavel"), M(p, "prazo"), M(p, "prioridade"), M(p, "status")]),
        [60, 20, 34, 24, 22, 22]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "terceiros", titulo: "Terceiros e contratados", modulo: "Cadastros", icone: Users,
    descricao: "Empresas terceiras com contrato, vigência e área de atuação.",
    carregar: async () => (await base44.entities.Terceira.filter({}, { limit: 500, sort: "razao_social" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Terceiros e contratados", meta: [`${d.length} empresa(s)`] });
      tabela(doc, y, ["Razão Social", "CNPJ", "Responsável", "Contrato", "Início", "Fim", "Área"],
        d.map((t) => [M(t, "razao_social"), M(t, "cnpj"), M(t, "responsavel"), M(t, "contrato_numero"), M(t, "contrato_inicio"), M(t, "contrato_fim"), M(t, "area_atuacao")]),
        [44, 30, 36, 24, 22, 22, 28]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "psicossocial", titulo: "Aplicações psicossociais", modulo: "Programas", icone: Brain,
    descricao: "Campanhas de risco psicossocial com público, período e riscos gerados.",
    carregar: async () => (await base44.entities.AplicacaoPsicossocial.filter({}, { limit: 500, sort: "-inicio" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Aplicações de risco psicossocial", meta: [`${d.length} aplicação(ões)`] });
      tabela(doc, y, ["Nome", "Início", "Encerramento", "Público", "Status", "Riscos no PGR"],
        d.map((a) => [M(a, "nome"), M(a, "inicio"), M(a, "fim"), M(a, "publico_estimado", "—"), M(a, "status"), a.riscos_gerados ? "Sim" : "Não"]),
        [50, 26, 26, 24, 24, 26]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "exames-pcmso", titulo: "Exames do PCMSO", modulo: "Saúde", icone: TestTube2,
    descricao: "Exames clínicos do PCMSO por cargo, momentos e periodicidade.",
    carregar: async () => (await base44.entities.ExamePcmso.filter({}, { limit: 1000, sort: "-created_date" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Exames do PCMSO", meta: [`${d.length} exame(s)`] });
      tabela(doc, y, ["Exame", "Código eSocial", "Momentos", "Periodicidade", "Ativo"],
        d.map((e) => [M(e, "exame"), M(e, "codigo_esocial"), (e.momentos || []).join(", ") || "—", M(e, "periodicidade_meses", "12") + " meses", e.ativo === false ? "Não" : "Sim"]),
        [50, 30, 40, 30, 18]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "vacinas", titulo: "Controle de vacinas", modulo: "Saúde", icone: Syringe,
    descricao: "Vacinas aplicadas com dose, lote e próxima dose.",
    carregar: async () => (await base44.entities.Vacina.filter({}, { limit: 1000, sort: "-data_aplicacao" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Controle de vacinas", meta: [`${d.length} dose(s)`] });
      tabela(doc, y, ["Colaborador", "Vacina", "Dose", "Aplicação", "Próxima dose", "Lote"],
        d.map((v) => [M(v, "trabalhador_nome"), M(v, "vacina"), M(v, "dose"), M(v, "data_aplicacao"), M(v, "proxima_dose"), M(v, "lote")]),
        [44, 30, 18, 24, 24, 28]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "periodicos", titulo: "Atendimentos periódicos", modulo: "Saúde", icone: Stethoscope,
    descricao: "Atendimentos de ASO periódico com empresa, cargo e status.",
    carregar: async () => (await base44.entities.Atendimento.filter({ tipo_aso: "periodico" }, { limit: 1000, sort: "-created_date" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Atendimentos periódicos (ASO)", meta: [`${d.length} atendimento(s)`] });
      tabela(doc, y, ["Colaborador", "Empresa", "Cargo", "Tipo ASO", "Status"],
        d.map((a) => [M(a, "trabalhador_nome"), M(a, "empresa_nome"), M(a, "cargo_nome"), M(a, "tipo_aso"), M(a, "status")]),
        [44, 44, 34, 22, 20]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "epis-estoque", titulo: "Estoque de EPI", modulo: "Segurança", icone: PackageSearch,
    descricao: "Itens de EPI cadastrados com CA, estoque atual e mínimo.",
    carregar: async () => (await base44.entities.EpiItem.filter({}, { limit: 500, sort: "nome" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Estoque de EPI", meta: [`${d.length} item(ns)`] });
      tabela(doc, y, ["EPI", "Tipo", "CA", "Estoque", "Mínimo", "Validade CA"],
        d.map((e) => [M(e, "nome"), M(e, "tipo"), M(e, "ca"), M(e, "estoque_atual", "0"), M(e, "estoque_minimo", "0"), M(e, "validade_ca")]),
        [40, 30, 24, 20, 20, 24]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "riscos-cargo", titulo: "Riscos por cargo (GHE)", modulo: "Programas", icone: ShieldAlert,
    descricao: "Riscos aplicados aos cargos, com tipo, agente e nível de risco.",
    carregar: async () => (await base44.entities.Risco.filter({}, { limit: 2000, sort: "agente" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Riscos por cargo (GHE)", meta: [`${d.length} risco(s)`] });
      tabela(doc, y, ["Tipo", "Agente", "Cargos", "Nível", "Revisado"],
        d.map((r) => [M(r, "tipo"), M(r, "agente"), (r.cargo_ids || []).length || "—", M(r, "nivel_risco"), r.revisado ? "Sim" : "Não"]),
        [24, 46, 18, 28, 18]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "acoes-concluidas", titulo: "Ações realizadas", modulo: "Programas", icone: CheckCircle2,
    descricao: "Plano de ação concluído com responsável, data e prioridade.",
    carregar: async () => (await base44.entities.PlanoAcao.filter({ status: "concluida" }, { limit: 1000, sort: "-concluida_em" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Ações realizadas", meta: [`${d.length} ação(ões)`] });
      tabela(doc, y, ["Ação", "Origem", "Responsável", "Concluída em", "Prioridade"],
        d.map((p) => [M(p, "descricao"), M(p, "origem"), M(p, "responsavel"), M(p, "concluida_em"), M(p, "prioridade")]),
        [62, 20, 34, 26, 22]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "fap-ntep", titulo: "FAP / NTEP (afastamentos)", modulo: "Saúde", icone: Activity,
    descricao: "Afastamentos por atestados com total de dias e benefício INSS.",
    carregar: async () => (await base44.entities.Atestado.filter({ motivo: { $in: ["trabalho", "doenca"] } }, { limit: 1000, sort: "-data_inicio" })).items || [],
    montar: (d, user) => {
      const dias = d.reduce((s, a) => s + (Number(a.dias) || 0), 0);
      const { doc, y } = novoDoc({ titulo: "FAP / NTEP — afastamentos", meta: [`${d.length} atestado(s)`, `Total: ${dias} dias`] });
      let yy = kpisLinha(doc, y, [{ label: "Afastamentos", valor: d.length }, { label: "Dias totais", valor: dias }, { label: "B31", valor: d.filter((a) => a.beneficio_inss === "b31").length }, { label: "B91", valor: d.filter((a) => a.beneficio_inss === "b91").length }]);
      yy = secao(doc, yy, "Detalhamento");
      tabela(doc, yy, ["Colaborador", "Início", "Dias", "Motivo", "Médico", "Benefício"],
        d.map((a) => [M(a, "trabalhador_nome"), M(a, "data_inicio"), M(a, "dias"), MOTIVO_ATESTADO[a.motivo] || M(a, "motivo"), M(a, "medico_nome"), M(a, "beneficio_inss", "—")]),
        [46, 22, 12, 18, 38, 28]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
  {
    id: "gestao", titulo: "Gestão de empresas (FAP/RAT)", modulo: "Gestão", icone: FileSpreadsheet,
    descricao: "Empresas com grau de risco, FAP, RAT, folha e vínculos médios.",
    carregar: async () => (await base44.entities.Company.filter({}, { limit: 500, sort: "razao_social" })).items || [],
    montar: (d, user) => {
      const { doc, y } = novoDoc({ titulo: "Gestão de empresas — FAP/RAT", meta: [`${d.length} empresa(s)`] });
      tabela(doc, y, ["Razão Social", "Risco", "FAP", "RAT", "Folha (R$)", "Vínculos", "Situação"],
        d.map((e) => [M(e, "razao_social"), M(e, "grau_de_risco"), M(e, "fap"), M(e, "rat"), brlShort(e.folha_mensal), M(e, "vinculos_medios", "—"), M(e, "situacao_financeira")]),
        [44, 16, 22, 18, 30, 18, 24]);
      finalizar(doc, user?.full_name || "SmartSeg");
      return doc;
    },
  },
];

// Documentos que já possuem tela de impressão dedicada no sistema.
const IMPRIMIVEIS = [
  { to: "/programas/imprimir", label: "PGR / PCMSO / Programa", icone: FileText, modulo: "Programas" },
  { to: "/clinica/aso", label: "ASO (Atestado de Saúde Ocupacional)", icone: FileText, modulo: "Saúde" },
  { to: "/ppp", label: "PPP (Perfil Profissiográfico Previdenciário)", icone: FileText, modulo: "Saúde" },
  { to: "/epi/ficha", label: "Ficha de EPI", icone: FileText, modulo: "Segurança" },
  { to: "/inspecoes/relatorio", label: "Relatório de inspeção", icone: FileText, modulo: "Segurança" },
  { to: "/atestados/relatorio", label: "Relatório de saúde / absenteísmo", icone: FileText, modulo: "Saúde" },
  { to: "/atestados/fap-simulacao", label: "Simulação de FAP", icone: FileText, modulo: "Saúde" },
  { to: "/consumo/demonstrativo", label: "Demonstrativo de consumo", icone: FileText, modulo: "Consumo" },
  { to: "/dossie", label: "Dossiê da fiscalização", icone: FileText, modulo: "Gestão" },
];

function CardRelatorio({ r, onAcao, ocupado }) {
  const Icon = r.icone;
  return (
    <div className="rounded-lg border p-4 flex flex-col" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="flex items-start gap-3 mb-2">
        <div className="rounded-lg p-2 flex-shrink-0" style={{ background: "rgba(11,111,168,0.08)" }}>
          <Icon size={18} style={{ color: WORK.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>{r.titulo}</h3>
          <p className="text-xs mt-0.5" style={{ color: WORK.muted }}>{r.descricao}</p>
        </div>
      </div>
      <span className="text-[11px] mb-3" style={{ color: WORK.muted }}>{r.modulo}</span>
      <div className="flex flex-wrap gap-2 mt-auto">
        <BotaoAcao icone={Download} label="PDF" onClick={() => onAcao(r, "pdf")} ocupado={ocupado === r.id} />
        <BotaoAcao icone={Printer} label="Imprimir" onClick={() => onAcao(r, "imprimir")} ocupado={ocupado === `${r.id}_print`} />
        <BotaoAcao icone={Mail} label="E-mail" onClick={() => onAcao(r, "email")} ocupado={ocupado === `${r.id}_mail`} />
      </div>
    </div>
  );
}

function BotaoAcao({ icone: Icon, label, onClick, ocupado }) {
  return (
    <button onClick={onClick} disabled={ocupado} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50"
      style={{ borderColor: WORK.border, color: WORK.accent, background: WORK.bg }}>
      {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />} {label}
    </button>
  );
}

export default function Relatorios() {
  const [ocupado, setOcupado] = useState("");
  const [emailAlvo, setEmailAlvo] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  React.useEffect(() => { base44.auth.me().then((u) => setUserEmail(u?.email || "")).catch(() => {}); }, []);

  const gerar = async (r) => {
    const dados = await r.carregar();
    const user = await base44.auth.me().catch(() => null);
    return r.montar(dados, user);
  };

  const onAcao = async (r, tipo) => {
    try {
      if (tipo === "email") { setEmailAlvo(r); return; }
      if (tipo === "pdf") {
        setOcupado(r.id);
        const doc = await gerar(r);
        doc.save(`relatorio-${r.id}.pdf`);
      } else if (tipo === "imprimir") {
        setOcupado(`${r.id}_print`);
        const doc = await gerar(r);
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
      }
    } catch (e) {
      alert("Erro ao gerar relatório: " + (e?.message || e));
    } finally {
      setOcupado("");
    }
  };

  const enviarEmail = async (r, para, mensagem) => {
    setOcupado(`${r.id}_mail`);
    const doc = await gerar(r);
    const b64 = doc.output("datauristring").split(",")[1];
    const res = await base44.functions.invoke("enviar-relatorio", {
      to: para, subject: `Relatório SmartSeg — ${r.titulo}`, filename: `relatorio-${r.id}.pdf`, pdfBase64: b64, mensagem,
    });
    if (res?.data?.error) throw new Error(res.data.error);
    alert("Relatório enviado para " + para);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Relatórios</h1>
        <p className="text-sm" style={{ color: WORK.muted }}>Gere, imprima ou envie por e-mail relatórios de todos os módulos do sistema.</p>
        <Link to="/indicadores" className="text-xs underline" style={{ color: WORK.accent }}>Ver indicadores interativos</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {RELATORIOS.map((r) => (
          <CardRelatorio key={r.id} r={r} onAcao={onAcao} ocupado={ocupado} />
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <FileBarChart size={16} style={{ color: WORK.accent }} />
        <h2 className="text-sm font-semibold" style={{ color: WORK.text }}>Documentos já imprimíveis</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {IMPRIMIVEIS.map((d) => {
          const Icon = d.icone;
          return (
            <Link key={d.to} to={d.to} className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-sky-50"
              style={{ background: WORK.surface, borderColor: WORK.border }}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon size={16} style={{ color: WORK.accent }} />
                <span className="text-sm" style={{ color: WORK.text }}>{d.label}</span>
              </div>
              <ArrowRight size={14} style={{ color: WORK.muted }} />
            </Link>
          );
        })}
      </div>

      {emailAlvo && (
        <EmailModal
          aberto
          titulo={emailAlvo.titulo}
          emailPadrao={userEmail}
          onEnviar={(para, msg) => enviarEmail(emailAlvo, para, msg)}
          onFechar={() => { setEmailAlvo(null); setOcupado(""); }}
        />
      )}
    </div>
  );
}