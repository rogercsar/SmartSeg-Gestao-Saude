import { jsPDF } from "jspdf";
import { header, footer, signatures } from "@/lib/documentPdf";

export function generateListaPresencaPDF(company, data) {
  const doc = new jsPDF();
  header(doc, "LISTA DE PRESENÇA", company);
  let y = 48;
  doc.setFontSize(10);
  const info = [
    ["Tema", data.tema],
    ["Data", data.data],
    ["Carga horária", data.carga_horaria],
    ["Instrutor", data.instrutor],
  ];
  info.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 16, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(val || "—"), 16 + doc.getTextWidth(`${label}: `), y);
    y += 6;
  });
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Nº", 16, y);
  doc.text("Nome do colaborador", 30, y);
  doc.text("Assinatura", 140, y);
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const nomes = (data.nomes || "").split("\n").map((n) => n.trim()).filter(Boolean);
  if (nomes.length === 0) {
    for (let i = 1; i <= 15; i++) {
      doc.text(String(i), 16, y);
      doc.line(30, y + 1, 130, y + 1);
      doc.line(140, y + 1, 196, y + 1);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    }
  } else {
    nomes.forEach((nome, i) => {
      doc.text(String(i + 1), 16, y);
      doc.text(doc.splitTextToSize(nome, 100), 30, y);
      doc.line(140, y + 1, 196, y + 1);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
  }
  footer(doc);
  return doc;
}

export function generateDDSPDF(company, data) {
  const doc = new jsPDF();
  header(doc, "DDS — DIÁLOGO DIÁRIO DE SEGURANÇA", company);
  let y = 48;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Tema do dia: ", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.tema || "—", 16 + doc.getTextWidth("Tema do dia: "), y);
  y += 8;
  if (data.introducao) {
    doc.setFont("helvetica", "bold");
    doc.text("Introdução", 16, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const intro = doc.splitTextToSize(data.introducao, 180);
    doc.text(intro, 16, y);
    y += 6 * intro.length + 4;
  }
  if (data.pontos_chave?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Pontos-chave", 16, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    data.pontos_chave.forEach((p) => {
      const w = doc.splitTextToSize("• " + p, 174);
      doc.text(w, 16, y);
      y += 6 * w.length;
    });
    y += 4;
  }
  if (data.perguntas_engajamento?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Perguntas para a equipe", 16, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    data.perguntas_engajamento.forEach((p, i) => {
      const w = doc.splitTextToSize(`${i + 1}. ${p}`, 180);
      doc.text(w, 16, y);
      y += 6 * w.length + 2;
    });
    y += 6;
  }
  if (y > 240) { doc.addPage(); y = 20; }
  signatures(doc, y, ["Responsável pela DDS", "Data"]);
  footer(doc);
  return doc;
}

export function generateCertificadoPDF(company, data) {
  const doc = new jsPDF();
  header(doc, "CERTIFICADO DE TREINAMENTO", company);
  let y = 52;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Certificamos que", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(16);
  doc.text(data.treinando || "—", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const compl = doc.splitTextToSize(
    `concluiu o treinamento de ${data.curso || data.nr || "—"} com carga horária de ${data.carga_horaria || "—"}, em conformidade com a ${data.nr || "NR aplicável"}.`,
    180
  );
  doc.text(compl, 105, y, { align: "center" });
  y += 6 * compl.length + 8;
  if (data.conteudo_programatico?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Conteúdo programático", 16, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    data.conteudo_programatico.forEach((c) => {
      const w = doc.splitTextToSize("• " + c, 174);
      doc.text(w, 16, y);
      y += 6 * w.length;
      if (y > 240) { doc.addPage(); y = 20; }
    });
    y += 6;
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Data de conclusão: ", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.data_conclusao || "—", 16 + doc.getTextWidth("Data de conclusão: "), y);
  y += 20;
  signatures(doc, y, ["Instrutor", "Responsável da empresa"]);
  footer(doc);
  return doc;
}

export function generateTermoRecusaEpiPDF(company, data) {
  const doc = new jsPDF();
  header(doc, "TERMO DE RECUSA DE EPI / ADVERTÊNCIA", company);
  let y = 48;
  doc.setFontSize(10);
  const fields = [
    ["Funcionário", data.funcionario],
    ["EPI recusado", data.epi_recusado],
    ["Data", data.data],
  ];
  fields.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 16, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(val || "—"), 16 + doc.getTextWidth(`${label}: `), y);
    y += 6;
  });
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Motivo da recusa", 16, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const motivoW = doc.splitTextToSize(data.motivo || "—", 180);
  doc.text(motivoW, 16, y);
  y += 6 * motivoW.length + 10;
  const decl = doc.splitTextToSize(
    "Declaro estar ciente de que o uso do EPI é obrigatório conforme NR-6 e que a recusa caracteriza falta grave, sujeita às medidas disciplinares cabíveis, sem prejuízo da responsabilidade civil e penal.",
    180
  );
  doc.text(decl, 16, y);
  y += 6 * decl.length + 16;
  signatures(doc, y, ["Funcionário", "Testemunha / Responsável"]);
  footer(doc);
  return doc;
}