import { jsPDF } from "jspdf";

const WATERMARK = "Rascunho gerado por IA — revisar e assinar pelo profissional habilitado";

function header(doc, company) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("COMUNICAÇÃO DE ACIDENTE DE TRABALHO — CAT (Minuta)", 105, 20, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company?.razao_social || "—", 105, 27, { align: "center" });
  if (company?.cnpj) doc.text(`CNPJ: ${company.cnpj} · CNAE: ${company.cnae || "—"}`, 105, 32, { align: "center" });
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);
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

export function generateCatPdf(company, oco) {
  const doc = new jsPDF();
  header(doc, company);
  let y = 44;
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

  field("Data e hora", oco.data_hora);
  field("Local", oco.local);
  field("Função do acidentado", oco.funcao_acidentado);
  field("Descrição do acidente", oco.descricao);
  field("Parte do corpo atingida", oco.parte_corpo);
  field("Agente causador", oco.agente_causador);
  field("Situação geradora", oco.situacao_geradora);
  field("Natureza da lesão", oco.natureza_lesao);
  field("Houve afastamento", oco.afastamento ? "Sim" : "Não");
  field("Testemunhas", oco.testemunhas);

  if (oco.envolve_maquina && oco.investigacao?.nr12) {
    doc.setFont("helvetica", "bold");
    doc.setFillColor(254, 243, 199);
    doc.rect(14, y - 4, 182, 8, "F");
    doc.text("Medidas imediatas de bloqueio (NR-12) — sugestão a validar", 16, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const nr12 = doc.splitTextToSize(oco.investigacao.nr12, 178);
    doc.text(nr12, 16, y);
    y += 6 * nr12.length + 4;
  }

  const inv = oco.investigacao || {};
  if (inv.cinco_porques?.length || inv.ishikawa || inv.plano_acao?.length) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, "F");
    doc.text("Investigação", 16, y);
    y += 10;
    doc.setFont("helvetica", "normal");

    if (inv.cinco_porques?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("5 Porquês", 16, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      inv.cinco_porques.forEach((q, i) => {
        doc.text(`${i + 1}. ${q}`, 18, y);
        y += 6;
      });
      y += 4;
    }
    if (inv.ishikawa) {
      doc.setFont("helvetica", "bold");
      doc.text("Ishikawa (causas por categoria)", 16, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      ["metodo", "maquina", "material", "mao_de_obra", "medida", "meio_ambiente"].forEach((cat) => {
        const items = inv.ishikawa[cat];
        if (items?.length) {
          doc.text(`${cat}: ${items.join(", ")}`, 18, y);
          y += 6;
        }
      });
      y += 4;
    }
    if (inv.plano_acao?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Plano de ação", 16, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      inv.plano_acao.forEach((a, i) => {
        const line = `${i + 1}. ${a.acao || ""}${a.responsavel ? ` (resp.: ${a.responsavel})` : ""}${a.prazo ? ` — prazo: ${a.prazo}` : ""}`;
        const wrapped = doc.splitTextToSize(line, 176);
        doc.text(wrapped, 18, y);
        y += 6 * wrapped.length;
      });
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