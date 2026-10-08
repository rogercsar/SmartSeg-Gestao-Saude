import { jsPDF } from "jspdf";

const WATERMARK = "Rascunho gerado automaticamente — revisar antes de uso oficial";

const dataBR = (s) => (s ? new Date(s + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "");

export function generatePppPDF(company, trabalhador, cargo, riscos = [], exames = [], vacinas = []) {
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PERFIL PROFISSIOGRÁFICO PREVIDENCIÁRIO (PPP)", 105, 18, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company?.razao_social || "—", 105, 24, { align: "center" });
  if (company?.cnpj) doc.text(`CNPJ: ${company.cnpj} · CNAE: ${company.cnae || "—"} · ${company.uf || ""}`, 105, 29, { align: "center" });
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 33, 196, 33);

  let y = 40;
  doc.setFontSize(10);

  const section = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, "F");
    doc.text(title, 16, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 16, y);
    doc.setFont("helvetica", "normal");
    const val = value || "—";
    const wrapped = doc.splitTextToSize(val, 170);
    doc.text(wrapped, 16 + doc.getTextWidth(`${label}: `), y);
    y += 5 * wrapped.length;
  };

  section("1. Dados do trabalhador");
  line("Nome", trabalhador?.nome);
  line("Matrícula", trabalhador?.matricula);
  line("CPF", trabalhador?.cpf);
  line("Data de admissão", dataBR(trabalhador?.data_admissao));
  line("Cargo/Função", cargo?.nome_cargo);
  line("CBO", cargo?.cbo);
  y += 4;

  section("2. Registros ambientais — riscos de exposição");
  if (riscos.length === 0) {
    doc.text("Nenhum risco cadastrado para o cargo.", 16, y);
    y += 6;
  } else {
    riscos.forEach((r) => {
      line(`Risco (${r.tipo})`, `${r.agente}${r.fonte_geradora ? ` — fonte: ${r.fonte_geradora}` : ""}${r.intensidade ? ` — ${r.intensidade} ${r.unidade_medida || ""}` : ""}`);
      if (r.insalubridade?.caracteriza) line("  Insalubridade", `${r.insalubridade.grau || ""} ${r.insalubridade.anexo || ""} — ${r.insalubridade.fundamentacao || ""}`);
      if (r.periculosidade?.caracteriza) line("  Periculosidade", `${r.periculosidade.anexo || ""} — ${r.periculosidade.fundamentacao || ""}`);
      if (r.aposentadoria_especial?.enquadra) line("  Aposentadoria especial", `Anexo IV: ${r.aposentadoria_especial.codigo_anexo_iv || ""}`);
    });
  }
  y += 4;

  section("3. Exames médicos (PCMSO)");
  if (exames.length === 0) {
    doc.text("Nenhum exame cadastrado para o cargo.", 16, y);
    y += 6;
  } else {
    exames.forEach((e) => {
      line(e.exame, `Periodicidade: ${e.periodicidade_meses || 12} meses${e.codigo_esocial ? ` · eSocial: ${e.codigo_esocial}` : ""}`);
    });
  }
  y += 4;

  section("4. Vacinas aplicadas");
  if (vacinas.length === 0) {
    doc.text("Nenhuma vacina registrada.", 16, y);
    y += 6;
  } else {
    vacinas.forEach((v) => {
      line(v.vacina, `Dose: ${v.dose} · Aplicada: ${dataBR(v.data_aplicacao)}${v.proxima_dose ? ` · Próxima: ${dataBR(v.proxima_dose)}` : ""}`);
    });
  }
  y += 8;

  section("5. Responsáveis");
  doc.text(doc.splitTextToSize("As informações deste PPP foram consolidadas a partir dos registros do SmartSeg e devem ser conferidas pelo responsável legal antes do uso oficial.", 180), 16, y);
  y += 16;

  doc.setFontSize(10);
  doc.setDrawColor(120, 120, 120);
  doc.line(14, y, 104, y);
  doc.line(110, y, 196, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Responsável pela empresa", 59, y + 5, { align: "center" });
  doc.text("Responsável técnico (SST)", 153, y + 5, { align: "center" });

  // Watermark
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(WATERMARK, 105, 290, { align: "center" });
    doc.text(`Página ${i}/${pages}`, 196, 290, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}