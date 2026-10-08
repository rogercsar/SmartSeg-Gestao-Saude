import { jsPDF } from "jspdf";

const WATERMARK = "Rascunho gerado por IA — revisar com advogado antes de protocolar";

const dataBR = (s) => (s ? new Date(s + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "");

function header(doc, company, auto) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DEFESA PRÉVIA — AUTO DE INFRAÇÃO (Minuta)", 105, 20, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company?.razao_social || "—", 105, 27, { align: "center" });
  if (company?.cnpj) doc.text(`CNPJ: ${company.cnpj} · CNAE: ${company.cnae || "—"}`, 105, 32, { align: "center" });
  if (auto?.numero_ai) doc.text(`Auto de Infração nº ${auto.numero_ai}`, 105, 37, { align: "center" });
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 41, 196, 41);
}

function footer(doc) {
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

export function generateDefensePdf(company, auto) {
  const doc = new jsPDF();
  header(doc, company, auto);
  let y = 49;
  doc.setFontSize(10);

  const field = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 16, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(value || "—", 168);
    doc.text(wrapped, 16 + doc.getTextWidth(`${label}: `) + 2, y);
    y += 6 * Math.max(wrapped.length, 1) + 2;
    if (y > 270) { doc.addPage(); y = 20; }
  };

  field("Data da autuação", dataBR(auto.data_autuacao) || "—");
  field("Órgão autuador", auto.orgao_autuador);
  field("NR/Item citado", auto.nr_item_citado);
  field("Valor da multa", auto.valor_multa);
  field("Prazo para defesa", dataBR(auto.prazo_defesa) || "—");
  field("Descrição da irregularidade", auto.descricao_irregularidade);

  const def = auto.defesa || {};

  if (def.argumentos?.length || def.fundamentacao?.length || def.conclusao) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, "F");
    doc.text("Defesa Prévia", 16, y);
    y += 10;
    doc.setFont("helvetica", "normal");

    if (def.argumentos?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Argumentos", 16, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      def.argumentos.forEach((arg, i) => {
        const wrapped = doc.splitTextToSize(`${i + 1}. ${arg}`, 176);
        doc.text(wrapped, 18, y);
        y += 6 * wrapped.length + 1;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 3;
    }

    if (def.fundamentacao?.length) {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("Fundamentação", 16, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      def.fundamentacao.forEach((f, i) => {
        const wrapped = doc.splitTextToSize(`${i + 1}. ${f}`, 176);
        doc.text(wrapped, 18, y);
        y += 6 * wrapped.length + 1;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 3;
    }

    if (def.conclusao) {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("Conclusão", 16, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(def.conclusao, 176);
      doc.text(wrapped, 18, y);
      y += 6 * wrapped.length + 2;
    }
  }

  // Assinaturas
  if (y > 250) { doc.addPage(); y = 20; }
  y += 10;
  doc.setDrawColor(120, 120, 120);
  doc.line(16, y, 96, y);
  doc.line(114, y, 194, y);
  doc.setFontSize(9);
  doc.text("Profissional de SST", 56, y + 5, { align: "center" });
  doc.text("Responsável da empresa", 154, y + 5, { align: "center" });

  footer(doc);
  return doc;
}