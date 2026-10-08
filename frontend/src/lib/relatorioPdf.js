import { jsPDF } from "jspdf";

// Motor genérico de PDF para relatórios do SmartSeg — cabeçalho com a marca,
// tabela paginada, linha de KPIs e rodapé com numeração/timestamp.
const MARGIN = 14;
const BRAND = { accent: [11, 111, 168], text: [31, 35, 40], muted: [95, 99, 104], border: [227, 232, 238], zebra: [246, 249, 251] };
export const PAGE_W = 210;
export const PAGE_H = 297;

// Cria um jsPDF com cabeçalho padrão Zela. Retorna { doc, y }.
export function novoDoc({ titulo, subtitulo, meta = [] }) {
  const doc = new jsPDF();
  doc.setFillColor(...BRAND.accent);
  doc.rect(0, 0, PAGE_W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SmartSeg", MARGIN, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Gestão em Saúde e Segurança do Trabalho", MARGIN + 26, 12);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, MARGIN, 20);
  let y = 32;
  if (subtitulo) {
    doc.setTextColor(...BRAND.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(subtitulo, MARGIN, y);
    y += 5;
  }
  if (meta.length) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(meta.join("    |    "), MARGIN, y);
    y += 5;
  }
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;
  return { doc, y };
}

export function secao(doc, y, titulo) {
  if (y > 274) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.accent);
  doc.text(titulo, MARGIN, y);
  doc.setDrawColor(...BRAND.border);
  doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
  return y + 7;
}

// Tabela paginada com zebra. headers/rows são arrays de strings; colWidths somam ~182mm.
export function tabela(doc, y, headers, rows, colWidths) {
  const fs = 8;
  doc.setFontSize(fs);
  const x0 = MARGIN;
  const drawHeader = (yy) => {
    let x = x0;
    doc.setFillColor(...BRAND.accent);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => {
      doc.rect(x, yy - 4, colWidths[i], 6, "F");
      doc.text(String(h), x + 1, yy);
      x += colWidths[i];
    });
  };
  drawHeader(y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.text);
  rows.forEach((row, ri) => {
    const wrapped = row.map((c, i) => doc.splitTextToSize(String(c ?? "—"), colWidths[i] - 2));
    const h = Math.max(5, Math.max(...wrapped.map((w) => w.length)) * 4 + 2);
    if (y + h > 282) { doc.addPage(); y = 20; drawHeader(y); y += 6; }
    if (ri % 2 === 1) {
      let x = x0;
      doc.setFillColor(...BRAND.zebra);
      doc.rect(x, y - 4, colWidths.reduce((a, b) => a + b, 0), h, "F");
    }
    let x = x0;
    wrapped.forEach((lines) => { doc.text(lines, x + 1, y); x += colWidths[wrapped.indexOf(lines)]; });
    y += h + 1.5;
  });
  return y;
}

// Caixinhas de KPI em linha. pares = [{label, valor}]
export function kpisLinha(doc, y, pares) {
  const colW = (PAGE_W - MARGIN * 2) / pares.length;
  pares.forEach((p, i) => {
    const x = MARGIN + i * colW;
    doc.setFillColor(...BRAND.zebra);
    doc.rect(x, y - 5, colW - 2, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text(String(p.label).toUpperCase(), x + 2, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.text);
    doc.text(String(p.valor), x + 2, y + 6);
  });
  return y + 16;
}

// Parágrafo de texto corrido com quebra de página.
export function paragrafo(doc, y, texto) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.text);
  const lines = doc.splitTextToSize(texto || "", PAGE_W - MARGIN * 2);
  lines.forEach((ln) => {
    if (y > 282) { doc.addPage(); y = 20; }
    doc.text(ln, MARGIN, y);
    y += 5;
  });
  return y + 2;
}

// Rodapé em todas as páginas: autor + data + numeração.
export function finalizar(doc, geradoPor = "SmartSeg") {
  const pages = doc.internal.getNumberOfPages();
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Cuiaba" });
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(`Gerado por ${geradoPor} em ${agora}`, MARGIN, 290);
    doc.text(`Página ${i}/${pages}`, PAGE_W - MARGIN, 290, { align: "right" });
  }
}