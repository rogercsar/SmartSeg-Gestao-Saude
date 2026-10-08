import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/ai";
import { splitNrIntoTrechos } from "@/lib/nrRetrieval";
import { nrContextForPrompt } from "@/lib/nrKnowledge";
import { BookOpen, Upload, Plus, Trash2, Sparkles, Map, FileText } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function Normas() {
  const [tab, setTab] = useState("import");
  const [nrCodigo, setNrCodigo] = useState("");
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [trechoCount, setTrechoCount] = useState(0);
  const [maps, setMaps] = useState([]);
  const [newMap, setNewMap] = useState({ cnae: "", nr_codigo: "", observacao: "" });
  const [suggesting, setSuggesting] = useState(false);

  const loadCounts = () => {
    base44.entities.NormaTrecho.count().then(setTrechoCount).catch(() => {});
    base44.entities.CnaeNrMap.list("-created_date", 200).then(setMaps).catch(() => {});
  };

  useEffect(() => { loadCounts(); }, []);

  const doImport = async () => {
    if (!nrCodigo.trim() || !rawText.trim()) { alert("Informe o código da NR e cole o texto."); return; }
    setImporting(true);
    try {
      const trechos = splitNrIntoTrechos(nrCodigo.trim().toUpperCase(), rawText);
      if (trechos.length === 0) { alert("Não consegui dividir o texto em trechos. Verifique o formato."); return; }
      await base44.entities.NormaTrecho.bulkCreate(trechos);
      setRawText("");
      setNrCodigo("");
      loadCounts();
      alert(`${trechos.length} trechos importados para ${nrCodigo}.`);
    } catch (err) {
      alert(err.message || "Erro ao importar.");
    } finally {
      setImporting(false);
    }
  };

  const addMap = async (e) => {
    e.preventDefault();
    if (!newMap.cnae || !newMap.nr_codigo) return;
    await base44.entities.CnaeNrMap.create({ ...newMap, origem: "manual" });
    setNewMap({ cnae: "", nr_codigo: "", observacao: "" });
    loadCounts();
  };

  const removeMap = async (m) => {
    await base44.entities.CnaeNrMap.delete(m.id);
    loadCounts();
  };

  const suggestNrs = async () => {
    if (!newMap.cnae) { alert("Informe um CNAE para sugerir."); return; }
    setSuggesting(true);
    try {
      const res = await invokeAI("normas_cnae", {
        prompt: `Com base no CNAE ${newMap.cnae}, quais Normas Regulamentadoras (NR) são potencialmente aplicáveis? Retorne apenas JSON com uma lista de códigos de NR (ex: "NR-6") e uma breve observação para cada.\n\nReferência geral:\n${nrContextForPrompt().slice(0, 2000)}`,
        response_json_schema: {
          type: "object",
          properties: {
            sugestoes: { type: "array", items: { type: "object", properties: { nr_codigo: { type: "string" }, observacao: { type: "string" } } } },
          },
        },
      });
      const data = typeof res === "object" ? res : JSON.parse(res);
      const sugestoes = data.sugestoes || [];
      if (sugestoes.length === 0) { alert("Não consegui sugerir NRs para este CNAE."); return; }
      await base44.entities.CnaeNrMap.bulkCreate(
        sugestoes.map((s) => ({ cnae: newMap.cnae, nr_codigo: s.nr_codigo, observacao: s.observacao || "", origem: "sugestao_ia" }))
      );
      loadCounts();
      alert(`${sugestoes.length} NRs sugeridas (marcadas como "sugestão da IA — conferir").`);
    } catch (err) {
      alert("Erro ao sugerir. Tente novamente.");
    } finally {
      setSuggesting(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Base normativa</h1>
      <p className="text-sm mb-6" style={{ color: WORK.muted }}>
        Importe o texto oficial das NRs e gerencie o mapeamento CNAE → NR. Começa vazia — você carrega os dados oficiais.
      </p>

      <div className="flex gap-2 mb-5">
        {[
          { id: "import", label: "Importar NR", icon: Upload },
          { id: "map", label: "Mapeamento CNAE", icon: Map },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: tab === t.id ? WORK.accent : WORK.surface, color: tab === t.id ? "#FFFFFF" : WORK.muted, border: `1px solid ${WORK.border}` }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "import" && (
        <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: WORK.accent }} />
            <h2 className="font-semibold" style={{ color: WORK.text }}>Importar texto de uma NR</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: WORK.muted }}>
            Cole o texto oficial. O app divide automaticamente em trechos por item (linhas que começam com número como "6.1" ou "35.5.1"). {trechoCount} trechos na base no momento.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Código da NR *</label>
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={nrCodigo} onChange={(e) => setNrCodigo(e.target.value)} placeholder="Ex: NR-6" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Texto oficial *</label>
              <textarea rows={12} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Cole aqui o texto da NR..." />
            </div>
            <button onClick={doImport} disabled={importing} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
              <Upload size={16} /> {importing ? "Importando..." : "Importar trechos"}
            </button>
          </div>
        </div>
      )}

      {tab === "map" && (
        <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center gap-2 mb-4">
            <Map size={18} style={{ color: WORK.accent }} />
            <h2 className="font-semibold" style={{ color: WORK.text }}>Mapeamento CNAE → NR</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: WORK.muted }}>
            Define quais NRs se aplicam a cada CNAE. Sem mapeamento, o checklist usa sugestões automáticas. Você pode pedir uma sugestão da IA (marcada como "conferir").
          </p>
          <form onSubmit={addMap} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={newMap.cnae} onChange={(e) => setNewMap((f) => ({ ...f, cnae: e.target.value }))} placeholder="CNAE (ex: 2511-0/00)" />
            <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={newMap.nr_codigo} onChange={(e) => setNewMap((f) => ({ ...f, nr_codigo: e.target.value }))} placeholder="NR (ex: NR-6)" />
            <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={newMap.observacao} onChange={(e) => setNewMap((f) => ({ ...f, observacao: e.target.value }))} placeholder="Observação (opcional)" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                <Plus size={15} /> Add
              </button>
            </div>
          </form>
          <button onClick={suggestNrs} disabled={suggesting || !newMap.cnae} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-4 disabled:opacity-50" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent, border: `1px solid ${WORK.border}` }}>
            <Sparkles size={14} /> {suggesting ? "Sugerindo..." : "Sugerir NRs para este CNAE (IA)"}
          </button>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {maps.length === 0 && (
              <div className="text-center py-8" style={{ color: WORK.muted }}>
                <FileText size={24} className="mx-auto mb-2" />
                <p className="text-sm">Nenhum mapeamento ainda.</p>
              </div>
            )}
            {maps.map((m) => (
              <div key={m.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: WORK.bg, borderColor: WORK.border }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: WORK.text }}><span style={{ color: WORK.accent }}>{m.cnae}</span> → {m.nr_codigo}</p>
                  {m.observacao && <p className="text-xs" style={{ color: WORK.muted }}>{m.observacao}</p>}
                </div>
                {m.origem === "sugestao_ia" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full mr-2" style={{ background: "rgba(234,179,8,0.12)", color: "#EAB308" }}>sugestão IA · conferir</span>
                )}
                <button onClick={() => removeMap(m)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}