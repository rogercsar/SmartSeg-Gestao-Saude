import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { generateOrdemServicoPDF, generateFichaEpiPDF } from "@/lib/documentPdf";
import { generatePppPDF } from "@/lib/pppPdf";
import { FileText, FileSignature, HardHat, ClipboardList } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function TabDocumentos({ trabalhador, company, cargo, riscos, exames, vacinas }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.GeneratedDocument.filter({ trabalhador_id: trabalhador.id });
      setDocs(res || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [trabalhador.id]);

  const gerarOS = async () => {
    setGenerating("os");
    try {
      const doc = generateOrdemServicoPDF(company, cargo);
      doc.save(`ordem_servico_${trabalhador.nome.replace(/\s/g, "_")}.pdf`);
      await base44.entities.GeneratedDocument.create({
        company_id: trabalhador.company_id,
        cargo_id: trabalhador.cargo_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
        tipo_documento: "ordem_servico",
        conteudo: { cargo: cargo?.nome_cargo, trabalhador: trabalhador.nome },
        status: "rascunho",
      });
      load();
    } catch (e) { alert(e.message); }
    setGenerating(null);
  };

  const gerarFichaEpi = async () => {
    setGenerating("epi");
    try {
      const episFromRiscos = riscos.flatMap((r) => r.epi || []);
      const episCargo = (cargo?.epis_obrigatorios || []).map((e) => ({ epi: e, ca: "" }));
      const allEpis = Array.from(new Map([...episFromRiscos.map((e) => ({ epi: e.nome, ca: e.ca })), ...episCargo].map((e) => [e.epi, e])).values());
      const doc = generateFichaEpiPDF(company, { ...cargo, nome_cargo: `${trabalhador.nome} — ${cargo?.nome_cargo || ""}` }, allEpis);
      doc.save(`ficha_epi_${trabalhador.nome.replace(/\s/g, "_")}.pdf`);
      await base44.entities.GeneratedDocument.create({
        company_id: trabalhador.company_id,
        cargo_id: trabalhador.cargo_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
        tipo_documento: "ficha_epi",
        conteudo: { epis: allEpis },
        status: "rascunho",
      });
      load();
    } catch (e) { alert(e.message); }
    setGenerating(null);
  };

  const gerarPPP = async () => {
    setGenerating("ppp");
    try {
      const doc = generatePppPDF(company, trabalhador, cargo, riscos, exames, vacinas);
      doc.save(`ppp_${trabalhador.nome.replace(/\s/g, "_")}.pdf`);
      await base44.entities.GeneratedDocument.create({
        company_id: trabalhador.company_id,
        cargo_id: trabalhador.cargo_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
        tipo_documento: "ppp",
        conteudo: { riscos: riscos.length, exames: exames.length, vacinas: vacinas.length },
        status: "rascunho",
      });
      load();
    } catch (e) { alert(e.message); }
    setGenerating(null);
  };

  const tipoLabel = {
    ordem_servico: "Ordem de Serviço", ficha_epi: "Ficha de EPI",
    ppp: "PPP", dds: "DDS", certificado: "Certificado",
    termo_recusa_epi: "Termo de Recusa de EPI", pgr: "PGR",
  };

  return (
    <div className="space-y-5">
      {/* Gerar documentos */}
      <div>
        <h3 className="font-semibold text-sm mb-3" style={{ color: WORK.text }}>Emitir documentos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={gerarOS} disabled={generating === "os"} className="rounded-lg border p-4 text-left disabled:opacity-50" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <ClipboardList size={20} className="mb-2" style={{ color: WORK.accent }} />
            <p className="text-sm font-medium" style={{ color: WORK.text }}>Ordem de Serviço</p>
            <p className="text-xs" style={{ color: WORK.muted }}>NR-1 — {generating === "os" ? "Gerando..." : "Gerar PDF"}</p>
          </button>
          <button onClick={gerarFichaEpi} disabled={generating === "epi"} className="rounded-lg border p-4 text-left disabled:opacity-50" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <HardHat size={20} className="mb-2" style={{ color: WORK.accent }} />
            <p className="text-sm font-medium" style={{ color: WORK.text }}>Ficha de EPI</p>
            <p className="text-xs" style={{ color: WORK.muted }}>NR-6 — {generating === "epi" ? "Gerando..." : "Gerar PDF"}</p>
          </button>
          <button onClick={gerarPPP} disabled={generating === "ppp"} className="rounded-lg border p-4 text-left disabled:opacity-50" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <FileText size={20} className="mb-2" style={{ color: WORK.accent }} />
            <p className="text-sm font-medium" style={{ color: WORK.text }}>PPP</p>
            <p className="text-xs" style={{ color: WORK.muted }}>Perfil Profissiográfico — {generating === "ppp" ? "Gerando..." : "Gerar PDF"}</p>
          </button>
        </div>
      </div>

      {/* Documentos assinados / gerados */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileSignature size={16} style={{ color: WORK.accent }} />
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Documentos gerados</h3>
        </div>
        {loading ? (
          <div className="text-center py-4" style={{ color: WORK.muted }}>Carregando...</div>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhum documento gerado para este trabalhador.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: WORK.text }}>{tipoLabel[d.tipo_documento] || d.tipo_documento}</span>
                  <p className="text-xs" style={{ color: WORK.muted }}>
                    {new Date(d.created_date).toLocaleDateString("pt-BR")} · {d.status === "revisado" ? "Revisado" : "Rascunho"}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: d.status === "revisado" ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.12)", color: d.status === "revisado" ? "#22c55e" : WORK.accent }}>
                  {d.status === "revisado" ? "Revisado" : "Rascunho"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}