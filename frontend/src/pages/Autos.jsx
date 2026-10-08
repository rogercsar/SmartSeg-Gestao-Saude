import React, { useState, useEffect } from "react";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { invokeAI, extrairPdf } from "@/lib/ai";
import { generateDefensePdf } from "@/lib/autoDefensePdf";
import { Scale, Upload, Trash2, Gavel, Download, X, Loader2, AlertCircle } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const STATUS = {
  pendente: { label: "Pendente", color: "#EAB308" },
  defendido: { label: "Defendido", color: "#22C55E" },
  julgado: { label: "Julgado", color: "#94A3B8" },
};

export default function Autos() {
  const { activeCompanyId } = useAppState();
  const [companies, setCompanies] = useState([]);
  const [selCompany, setSelCompany] = useState(activeCompanyId || "");
  const [autos, setAutos] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [draft, setDraft] = useState(null);
  const [defending, setDefending] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [defense, setDefense] = useState(null);

  useEffect(() => {
    base44.entities.Company.list("-created_date", 100).then((c) => {
      setCompanies(c);
      if (!selCompany && c.length > 0) setSelCompany(c[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selCompany) { setAutos([]); return; }
    base44.entities.AutoInfracao.filter({ company_id: selCompany }).then((list) =>
      setAutos((list || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)))
    );
  }, [selCompany]);

  const company = companies.find((c) => c.id === selCompany);
  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(false);
    setExtracting(true);
    try {
      // PDF vai para armazenamento privado e é lido pela IA (1 crédito)
      const { dados, file_uri } = await extrairPdf("auto_extracao", file, {
        type: "object",
        properties: {
          numero_ai: { type: "string" },
          data_autuacao: { type: "string" },
          orgao_autuador: { type: "string" },
          nr_item_citado: { type: "string" },
          descricao_irregularidade: { type: "string" },
          valor_multa: { type: "string" },
          prazo_defesa: { type: "string" },
        },
      }, "Este é um auto de infração trabalhista. Extraia os dados pedidos. Se um campo não existir no documento, deixe vazio.");
      // Guarda a referência privada (abrir exige gerar link temporário com linkTemporario)
      setDraft({ ...dados, pdf_url: file_uri });
    } catch (err) {
      if (err?.code !== "SEM_CREDITOS") alert(err?.message || "Erro ao processar o PDF. Tente novamente.");
    } finally {
      setExtracting(false);
      setUploading(false);
    }
  };

  const saveDraft = async () => {
    if (!draft?.numero_ai) { alert("Número do AI é obrigatório."); return; }
    try {
      const created = await base44.entities.AutoInfracao.create({
        ...draft, company_id: selCompany, status: "pendente",
      });
      setAutos((list) => [created, ...list]);
      setShowImport(false);
      setDraft(null);
    } catch (err) { alert(err.message); }
  };

  const generateDefense = async () => {
    if (!defending) return;
    setGenerating(true);
    try {
      const res = await invokeAI("auto_defesa", {
        prompt: `Você é um advogado especialista em defesa prévia de autos de infração trabalhista (NRs do Ministério do Trabalho). Com base no auto abaixo, sugira argumentos de defesa prévia. Cite a NR e o item exato quando relevante. Não invente números de itens, valores de multa ou jurisprudência — se não souber, escreva "verificar na fonte oficial". Retorne apenas JSON.

Auto: ${JSON.stringify({
          nr_item_citado: defending.nr_item_citado,
          descricao_irregularidade: defending.descricao_irregularidade,
          orgao_autuador: defending.orgao_autuador,
        })}`,
        response_json_schema: {
          type: "object",
          properties: {
            argumentos: { type: "array", items: { type: "string" } },
            fundamentacao: { type: "array", items: { type: "string" } },
            conclusao: { type: "string" },
          },
        },
      });
      const data = typeof res === "object" ? res : JSON.parse(res);
      setDefense(data);
    } catch { alert("Erro ao gerar defesa."); }
    finally { setGenerating(false); }
  };

  const saveDefense = async () => {
    const updated = await base44.entities.AutoInfracao.update(defending.id, {
      defesa: defense, status: "defendido",
    });
    setAutos((list) => list.map((a) => (a.id === defending.id ? updated : a)));
    setDefending(null);
    setDefense(null);
  };

  const downloadDefense = (a) => {
    const pdf = generateDefensePdf(company, a);
    pdf.save(`Defesa_${(a.numero_ai || "AI").replace(/\s/g, "_")}.pdf`);
  };

  const remove = async (a) => {
    if (!confirm("Remover este auto?")) return;
    await base44.entities.AutoInfracao.delete(a.id);
    setAutos((list) => list.filter((x) => x.id !== a.id));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>
        Autos de Infração
      </h1>
      <p className="text-sm mb-6" style={{ color: WORK.muted }}>
        Importe o auto em PDF, revise os dados extraídos e gere uma minuta de defesa prévia assistida.
      </p>

      <div className="mb-5">
        <select
          className={inputCls}
          style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
          value={selCompany}
          onChange={(e) => setSelCompany(e.target.value)}
        >
          <option value="">Selecione a empresa...</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
        </select>
      </div>

      <button
        onClick={() => { setShowImport(true); setDraft(null); }}
        disabled={!selCompany}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm mb-6 disabled:opacity-50"
        style={{ background: WORK.accent, color: "#FFFFFF" }}
      >
        <Upload size={16} /> Importar auto (PDF)
      </button>

      <div className="space-y-2">
        {autos.length === 0 && selCompany && (
          <p className="text-sm" style={{ color: WORK.muted }}>Nenhum auto importado ainda.</p>
        )}
        {autos.map((a) => (
          <div key={a.id} className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Scale size={16} style={{ color: WORK.accent }} />
                  <span className="font-medium text-sm" style={{ color: WORK.text }}>{a.numero_ai || "—"}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${STATUS[a.status]?.color}22`, color: STATUS[a.status]?.color }}>
                    {STATUS[a.status]?.label}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: WORK.muted }}>
                  {a.nr_item_citado || "—"} · {a.orgao_autuador || "—"}
                </p>
                {a.descricao_irregularidade && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: WORK.muted }}>{a.descricao_irregularidade}</p>
                )}
                {a.prazo_defesa && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                    Prazo: {new Date(a.prazo_defesa).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setDefending(a); setDefense(a.defesa || null); }}
                  className="p-2 rounded-md"
                  style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}
                  title="Defesa prévia"
                >
                  <Gavel size={15} />
                </button>
                {a.defesa && (
                  <button onClick={() => downloadDefense(a)} className="p-2 rounded-md" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }} title="Baixar PDF">
                    <Download size={15} />
                  </button>
                )}
                <button onClick={() => remove(a)} className="p-2 rounded-md" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4">
          <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border max-h-[92vh] overflow-y-auto" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}>
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b" style={{ background: WORK.bg, borderColor: WORK.border }}>
              <span className="flex items-center gap-2 text-sm font-medium"><Scale size={16} style={{ color: WORK.accent }} /> Importar auto de infração</span>
              <button onClick={() => setShowImport(false)} style={{ color: WORK.muted }}><X size={20} /></button>
            </div>
            <div className="p-5">
              {!draft && !uploading && !extracting && (
                <label className="block">
                  <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/50" style={{ borderColor: WORK.border }}>
                    <Upload size={28} className="mx-auto mb-2" style={{ color: WORK.muted }} />
                    <p className="text-sm" style={{ color: WORK.text }}>Anexar PDF do auto</p>
                    <p className="text-xs mt-1" style={{ color: WORK.muted }}>A IA vai extrair os campos automaticamente</p>
                  </div>
                  <input type="file" accept="application/pdf" className="hidden" onChange={onFile} />
                </label>
              )}
              {(uploading || extracting) && (
                <div className="text-center py-8">
                  <Loader2 size={28} className="mx-auto mb-2 animate-spin" style={{ color: WORK.accent }} />
                  <p className="text-sm" style={{ color: WORK.muted }}>{uploading ? "Enviando PDF..." : "Extraindo dados do auto..."}</p>
                </div>
              )}
              {draft && (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: WORK.muted }}>Revise os dados extraídos. Cada campo é editável.</p>
                  {[
                    { k: "numero_ai", l: "Número do AI" },
                    { k: "data_autuacao", l: "Data da autuação" },
                    { k: "orgao_autuador", l: "Órgão autuador" },
                    { k: "nr_item_citado", l: "NR/Item citado" },
                    { k: "valor_multa", l: "Valor da multa" },
                    { k: "prazo_defesa", l: "Prazo para defesa" },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>{f.l}</label>
                      <input
                        className={inputCls}
                        style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
                        value={draft[f.k] || ""}
                        onChange={(e) => setDraft({ ...draft, [f.k]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Descrição da irregularidade</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
                      value={draft.descricao_irregularidade || ""}
                      onChange={(e) => setDraft({ ...draft, descricao_irregularidade: e.target.value })}
                    />
                  </div>
                  <button onClick={saveDraft} className="w-full px-4 py-2.5 rounded-lg font-medium text-sm" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                    Salvar auto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Defense modal */}
      {defending && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4">
          <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border max-h-[92vh] overflow-y-auto" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}>
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b" style={{ background: WORK.bg, borderColor: WORK.border }}>
              <span className="flex items-center gap-2 text-sm font-medium"><Gavel size={16} style={{ color: WORK.accent }} /> Defesa prévia — {defending.numero_ai}</span>
              <button onClick={() => { setDefending(null); setDefense(null); }} style={{ color: WORK.muted }}><X size={20} /></button>
            </div>
            <div className="p-5">
              {!defense && !generating && (
                <div className="text-center py-6">
                  <AlertCircle size={28} className="mx-auto mb-2" style={{ color: WORK.muted }} />
                  <p className="text-sm mb-4" style={{ color: WORK.text }}>Gere a minuta de defesa com base no auto importado.</p>
                  <button onClick={generateDefense} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                    <Gavel size={16} /> Gerar defesa
                  </button>
                </div>
              )}
              {generating && (
                <div className="text-center py-8">
                  <Loader2 size={28} className="mx-auto mb-2 animate-spin" style={{ color: WORK.accent }} />
                  <p className="text-sm" style={{ color: WORK.muted }}>Elaborando argumentos de defesa...</p>
                </div>
              )}
              {defense && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: WORK.accent }}>Argumentos</label>
                    <textarea
                      rows={5}
                      className={inputCls}
                      style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
                      value={(defense.argumentos || []).join("\n")}
                      onChange={(e) => setDefense({ ...defense, argumentos: e.target.value.split("\n").filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: WORK.accent }}>Fundamentação</label>
                    <textarea
                      rows={4}
                      className={inputCls}
                      style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
                      value={(defense.fundamentacao || []).join("\n")}
                      onChange={(e) => setDefense({ ...defense, fundamentacao: e.target.value.split("\n").filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: WORK.accent }}>Conclusão</label>
                    <textarea
                      rows={3}
                      className={inputCls}
                      style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
                      value={defense.conclusao || ""}
                      onChange={(e) => setDefense({ ...defense, conclusao: e.target.value })}
                    />
                  </div>
                  <p className="text-xs" style={{ color: WORK.muted }}>Minuta de rascunho. Revise com um advogado antes de protocolar.</p>
                  <div className="flex gap-2">
                    <button onClick={saveDefense} className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                      Salvar defesa
                    </button>
                    <button onClick={() => downloadDefense({ ...defending, defesa: defense })} className="px-4 py-2.5 rounded-lg font-medium text-sm border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}