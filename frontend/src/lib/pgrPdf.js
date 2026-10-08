import { jsPDF } from "jspdf";

const WATERMARK = "Rascunho gerado por IA — revisar e assinar pelo profissional habilitado";

const SEVERITY_LABEL = { 1: "Leve", 2: "Moderado", 3: "Alto", 4: "Crítico", 5: "Catastrófico" };
const PROB_LABEL = { 1: "Raro", 2: "Improvável", 3: "Possível", 4: "Provável", 5: "Frequente" };

function riskColor(score) {
  if (score >= 15) return [220, 38, 38];
  if (score >= 9) return [249, 115, 22];
  if (score >= 4) return [234, 179, 8];
  return [34, 197, 94];
}

export function generatePgrPdf(company, conteudo) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("PGR / APR — Rascunho", 105, 18, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company?.razao_social || "—", 105, 24, { align: "center" });
  if (company?.cnae) doc.text(`CNAE: ${company.cnae} · ${company.uf || ""}`, 105, 29, { align: "center" });
  doc.setDrawColor(249, 115, 22);
  doc.line(14, 33, 196, 33);

  let y = 40;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Setor:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(conteudo.setor || "—", 35, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Cargo:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(conteudo.cargo || "—", 35, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Atividades:", 16, y);
  doc.setFont("helvetica", "normal");
  const atv = doc.splitTextToSize(conteudo.atividades || "—", 168);
  doc.text(atv, 40, y);
  y += 6 * atv.length + 4;

  // Tabela de riscos
  doc.setFont("helvetica", "bold");
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.text("Matriz de riscos", 16, y);
  y += 10;

  const cols = ["Perigo", "Risco", "Sev.", "Prob.", "Nível", "Medidas de controle"];
  const colW = [34, 34, 16, 16, 20, 62];
  let x = 14;
  doc.setFontSize(8);
  cols.forEach((c, i) => {
    doc.setFillColor(203, 213, 225);
    doc.rect(x, y - 4, colW[i], 6, "F");
    doc.text(c, x + 1, y);
    x += colW[i];
  });
  y += 6;

  doc.setFont("helvetica", "normal");
  (conteudo.riscos || []).forEach((r) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const score = (r.severidade || 1) * (r.probabilidade || 1);
    const [r2, g, b] = riskColor(score);
    x = 14;
    const cells = [
      r.perigo || "—",
      r.risco || "—",
      SEVERITY_LABEL[r.severidade] || r.severidade,
      PROB_LABEL[r.probabilidade] || r.probabilidade,
      String(score),
      (r.medidas || []).join("; "),
    ];
    cells.forEach((c, i) => {
      const wrapped = doc.splitTextToSize(String(c), colW[i] - 2);
      const h = Math.max(6 * wrapped.length, 6);
      if (i === 4) {
        doc.setFillColor(r2, g, b);
        doc.rect(x, y - 4, colW[i], h, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(String(score), x + colW[i] / 2, y, { align: "center" });
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text(wrapped, x + 1, y);
      }
      x += colW[i];
    });
    y += Math.max(6, 6 * Math.max(...cells.map((c) => doc.splitTextToSize(String(c), 30).length))) + 2;
  });

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Sugestões geradas por IA — conferir antes do uso oficial.", 16, y);
  doc.setTextColor(0, 0, 0);

  // Watermark
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(WATERMARK, 105, 290, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  return doc;
}