import { jsPDF } from "jspdf";

const WATERMARK = "Rascunho gerado automaticamente — revisar antes de uso oficial";

export function header(doc, title, company) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 105, 20, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company?.razao_social || "—", 105, 27, { align: "center" });
  if (company?.cnpj) doc.text(`CNPJ: ${company.cnpj}`, 105, 32, { align: "center" });
  if (company?.cnae) doc.text(`CNAE: ${company.cnae} · ${company.uf || ""}`, 105, 37, { align: "center" });
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 41, 196, 41);
}

export function footer(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(WATERMARK, 105, 290, { align: "center" });
    doc.text(`Página ${i}/${pages}`, 196, 290, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }
}

export function signatures(doc, yStart, labels) {
  let y = yStart;
  const colW = 90;
  const startX = 14;
  labels.forEach((label, i) => {
    const x = startX + (i % 2) * (colW + 6);
    if (i % 2 === 0 && i > 0) y += 26;
    doc.setDrawColor(120, 120, 120);
    doc.line(x, y, x + colW, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label, x + colW / 2, y + 5, { align: "center" });
  });
}

export function generateOrdemServicoPDF(company, cargo) {
  const doc = new jsPDF();
  header(doc, "ORDEM DE SERVIÇO (NR-1)", company);
  let y = 48;
  doc.setFontSize(10);

  const section = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, "F");
    doc.text(title, 16, y);
    y += 8;
    doc.setFont("helvetica", "normal");
  };
  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 16, y);
    doc.setFont("helvetica", "normal");
    const val = value || "—";
    const wrapped = doc.splitTextToSize(val, 170);
    doc.text(wrapped, 16 + doc.getTextWidth(`${label}: `), y);
    y += 6 * wrapped.length;
  };

  section("1. Identificação do cargo/função");
  line("Cargo/Função", cargo?.nome_cargo);
  line("CBO", cargo?.cbo);
  line("Nº de funcionários", String(cargo?.quantidade_funcionarios || ""));

  section("2. Descrição das atividades");
  doc.text(doc.splitTextToSize(cargo?.atividades || "—", 180), 16, y);
  y += 14;

  section("3. Riscos identificados");
  const riscos = cargo?.riscos_identificados?.length ? cargo.riscos_identificados.join(", ") : "—";
  doc.text(doc.splitTextToSize(riscos, 180), 16, y);
  y += 12;

  section("4. EPIs obrigatórios");
  const epis = cargo?.epis_obrigatorios?.length ? cargo.epis_obrigatorios.join(", ") : "—";
  doc.text(doc.splitTextToSize(epis, 180), 16, y);
  y += 12;

  section("5. Procedimentos de emergência");
  doc.text(doc.splitTextToSize(cargo?.procedimentos_emergencia || "—", 180), 16, y);
  y += 16;

  section("6. Responsabilidades do trabalhador");
  doc.text(doc.splitTextToSize(
    "Cumprir as normas de segurança, usar os EPIs fornecidos, participar dos treinamentos e comunicar qualquer condição insegura.",
    180
  ), 16, y);
  y += 16;

  section("7. Assinaturas");
  signatures(doc, y, ["Funcionário", "Responsável da empresa"]);

  footer(doc);
  return doc;
}

export function generateFichaEpiPDF(company, cargo, epis = []) {
  const doc = new jsPDF();
  header(doc, "FICHA DE ENTREGA DE EPI (NR-6)", company);
  let y = 48;
  doc.setFontSize(10);

  doc.setFont("helvetica", "bold");
  doc.text("Funcionário: ", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(cargo?.nome_cargo || "—", 16 + doc.getTextWidth("Funcionário: "), y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Cargo: ", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(cargo?.nome_cargo || "—", 16 + doc.getTextWidth("Cargo: "), y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("CBO: ", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(cargo?.cbo || "—", 16 + doc.getTextWidth("CBO: "), y);
  y += 10;

  // Tabela de EPIs
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("EPIs entregues", 16, y);
  y += 8;

  doc.setFontSize(9);
  doc.text("EPI", 16, y);
  doc.text("CA (Certificado de Aprovação)", 120, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  const items = epis.length ? epis : (cargo?.epis_obrigatorios || []).map((e) => ({ epi: e, ca: "" }));
  if (items.length === 0) {
    doc.text("Nenhum EPI registrado.", 16, y);
    y += 8;
  }
  items.forEach((it) => {
    doc.text(it.epi || it.nome || "—", 16, y);
    doc.text(it.ca || "", 120, y);
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
  });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.text("Declaração", 16, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(
    "Declaro ter recebido o(s) EPI(s) acima em perfeito estado de conservação e funcionamento, bem como ter recebido treinamento para uso, guarda e conservação.",
    180
  ), 16, y);
  y += 20;

  signatures(doc, y, ["Funcionário", "Responsável pela entrega"]);

  footer(doc);
  return doc;
}