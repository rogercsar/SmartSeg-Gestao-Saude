import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/ai";
import { generateOrdemServicoPDF, generateFichaEpiPDF } from "@/lib/documentPdf";
import { generateListaPresencaPDF, generateDDSPDF, generateCertificadoPDF, generateTermoRecusaEpiPDF } from "@/lib/documentPdfDaily";
import { generatePgrPdf } from "@/lib/pgrPdf";
import { DOC_BY_ID } from "@/lib/documentCatalog";
import PgrForm from "@/components/docs/PgrForm";
import DocumentCatalog from "@/components/docs/DocumentCatalog";
import DocumentForm from "@/components/docs/DocumentForm";
import { Download, CheckCircle2, Plus, Sparkles, FileText, ShieldCheck, Users, Award, FileWarning, ClipboardList } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const DOC_ICON = {
  ordem_servico: FileText, ficha_epi: ShieldCheck,
  lista_presenca: Users, dds: Sparkles, certificado: Award, termo_recusa_epi: FileWarning, pgr: ClipboardList,
};

const DOC_LABEL = {
  ordem_servico: "Ordem de Serviço (NR-1)", ficha_epi: "Ficha de EPI (NR-6)",
  lista_presenca: "Lista de Presença", dds: "Sugestão de DDS",
  certificado: "Certificado de Treinamento", termo_recusa_epi: "Termo de Recusa de EPI",
  pgr: "PGR / APR (Rascunho)",
};

export default function Documentos() {
  const [params] = useSearchParams();
  const { activeCompanyId } = useAppState();
  const [companies, setCompanies] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [selCompany, setSelCompany] = useState(activeCompanyId || "");
  const [selCargo, setSelCargo] = useState("");
  const [type, setType] = useState(params.get("type") || "lista_presenca");
  const [formData, setFormData] = useState({});
  const [docs, setDocs] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    base44.entities.Company.list("-created_date", 100).then((c) => {
      setCompanies(c);
      if (!selCompany && c.length > 0) setSelCompany(c[0].id);
    });
    base44.entities.GeneratedDocument.list("-created_date", 50).then(setDocs);
  }, []);

  useEffect(() => {
    if (!selCompany) { setCargos([]); return; }
    base44.entities.CargoFuncao.filter({ company_id: selCompany }).then(setCargos);
  }, [selCompany]);

  useEffect(() => { setFormData({}); }, [type]);

  const company = companies.find((c) => c.id === selCompany);
  const cargo = cargos.find((c) => c.id === selCargo) || cargos[0];
  const doc = DOC_BY_ID[type];

  const generateAIContent = async () => {
    if (type === "dds") {
      const prompt = `Você é um técnico de SST experiente. Gere um DDS (Diálogo Diário de Segurança) para a empresa ${company.razao_social} (CNAE ${company.cnae}, setor: ${company.setor_descricao || "não informado"}).
${formData.tema ? `Tema definido: ${formData.tema}` : "Sugira um tema relevante ao setor da empresa."}
Retorne apenas JSON.`;
      const res = await invokeAI("dds", {
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tema: { type: "string" },
            introducao: { type: "string" },
            pontos_chave: { type: "array", items: { type: "string" } },
            perguntas_engajamento: { type: "array", items: { type: "string" } },
          },
        },
      });
      return typeof res === "object" ? res : JSON.parse(res);
    }
    if (type === "certificado") {
      const prompt = `Gere o conteúdo de um certificado de treinamento para ${formData.nr || "a NR aplicável"}.
Retorne apenas JSON.`;
      const res = await invokeAI("certificado", {
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            curso: { type: "string" },
            conteudo_programatico: { type: "array", items: { type: "string" } },
            instrucoes_complementares: { type: "string" },
          },
        },
      });
      return typeof res === "object" ? res : JSON.parse(res);
    }
    return {};
  };

  const buildPdf = (docRecord) => {
    const c = companies.find((x) => x.id === docRecord.company_id);
    const cg = cargos.find((x) => x.id === docRecord.cargo_id) || docRecord.conteudo?.cargo;
    const cont = docRecord.conteudo || {};
    const empresa = c || cont.empresa;
    switch (docRecord.tipo_documento) {
      case "ordem_servico": return generateOrdemServicoPDF(empresa, cg || cont.cargo);
      case "ficha_epi": return generateFichaEpiPDF(empresa, cg || cont.cargo, cont.epis || []);
      case "lista_presenca": return generateListaPresencaPDF(empresa, cont);
      case "dds": return generateDDSPDF(empresa, cont);
      case "certificado": return generateCertificadoPDF(empresa, cont);
      case "termo_recusa_epi": return generateTermoRecusaEpiPDF(empresa, cont);
      case "pgr": return generatePgrPdf(empresa, cont);
      default: return null;
    }
  };

  const generate = async () => {
    if (!company) { alert("Selecione uma empresa."); return; }
    if (doc.needsCargo && !cargo) { alert("Selecione um cargo."); return; }
    setGenerating(true);
    try {
      let conteudo = { ...formData };
      if (doc.needsCargo && cargo) {
        conteudo.empresa = { razao_social: company.razao_social, cnpj: company.cnpj, cnae: company.cnae, uf: company.uf };
        conteudo.cargo = { nome_cargo: cargo.nome_cargo, cbo: cargo.cbo, atividades: cargo.atividades, riscos_identificados: cargo.riscos_identificados, epis_obrigatorios: cargo.epis_obrigatorios, procedimentos_emergencia: cargo.procedimentos_emergencia };
      }
      if (type === "pgr") {
        conteudo.empresa = { razao_social: company.razao_social, cnpj: company.cnpj, cnae: company.cnae, uf: company.uf };
      }
      if (doc.needsAI && type !== "pgr") {
        const ai = await generateAIContent();
        conteudo = { ...conteudo, ...ai };
      }
      const created = await base44.entities.GeneratedDocument.create({
        company_id: company.id,
        cargo_id: doc.needsCargo ? cargo?.id : null,
        tipo_documento: type,
        conteudo,
        status: "rascunho",
      });
      setDocs((list) => [created, ...list]);
      const pdf = buildPdf(created);
      if (pdf) pdf.save(`${type}_${(company.razao_social || "doc").replace(/\s/g, "_")}.pdf`);
    } catch (err) {
      alert(err.message || "Erro ao gerar documento.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = (d) => {
    const pdf = buildPdf(d);
    if (pdf) pdf.save(`${d.tipo_documento}.pdf`);
  };

  const markRevisado = async (d) => {
    const status = d.status === "rascunho" ? "revisado" : "rascunho";
    await base44.entities.GeneratedDocument.update(d.id, { status });
    setDocs((list) => list.map((x) => (x.id === d.id ? { ...x, status } : x)));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>
        Gerador de documentos
      </h1>
      <p className="text-sm mb-6" style={{ color: WORK.muted }}>
        Documentos preenchidos automaticamente, conectados aos dados da empresa. Marca d'água de rascunho incluída.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h2 className="font-semibold mb-3 text-sm" style={{ color: WORK.text }}>Catálogo</h2>
          <DocumentCatalog selected={type} onSelect={setType} />
        </div>

        <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center gap-2 mb-4">
            {(() => { const Icon = DOC_ICON[type] || FileText; return <Icon size={18} style={{ color: WORK.accent }} />; })()}
            <h2 className="font-semibold" style={{ color: WORK.text }}>{DOC_LABEL[type] || type}</h2>
            {doc?.needsAI && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.15)", color: WORK.accent }}>IA</span>}
          </div>
          {type === "pgr" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Empresa</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={selCompany}
                  onChange={(e) => setSelCompany(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <PgrForm formData={formData} setFormData={setFormData} />
            </div>
          ) : (
            <DocumentForm
              docType={type} companies={companies} cargos={cargos}
              selCompany={selCompany} setSelCompany={setSelCompany}
              selCargo={selCargo} setSelCargo={setSelCargo}
              formData={formData} setFormData={setFormData}
            />
          )}
          <div className="mt-4">
            <button onClick={generate} disabled={generating} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
              <Plus size={16} /> {generating ? "Gerando..." : "Gerar e baixar PDF"}
            </button>
            <p className="text-xs mt-3" style={{ color: WORK.muted }}>
              Salvo como "rascunho" no histórico. Revise antes do uso oficial.
            </p>
          </div>
        </div>
      </div>

      <h2 className="font-semibold mb-3 mt-6" style={{ color: WORK.text }}>Documentos gerados</h2>
      <div className="space-y-2">
        {docs.length === 0 && <p className="text-sm" style={{ color: WORK.muted }}>Nenhum documento gerado ainda.</p>}
        {docs.map((d) => {
          const c = companies.find((x) => x.id === d.company_id);
          const Icon = DOC_ICON[d.tipo_documento] || FileText;
          return (
            <div key={d.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <Icon size={18} style={{ color: WORK.accent }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: WORK.text }}>{DOC_LABEL[d.tipo_documento] || d.tipo_documento}</p>
                <p className="text-xs" style={{ color: WORK.muted }}>{c?.razao_social || "—"} · {new Date(d.created_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <button onClick={() => markRevisado(d)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "rgba(11,111,168,0.06)", color: d.status === "revisado" ? "#22C55E" : WORK.accent }}>
                <CheckCircle2 size={13} /> {d.status === "revisado" ? "Revisado" : "Revisar"}
              </button>
              <button onClick={() => downloadPdf(d)} className="p-2 rounded-md" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
                <Download size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}