import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { invokeAI, transcreverAudio } from "@/lib/ai";
import { generateCatPdf } from "@/lib/catPdf";
import {
  Plus, Trash2, Mic, Square, Sparkles, Download, FileWarning,
  AlertTriangle, Heart, ShieldQuestion, ChevronRight, X,
} from "lucide-react";
import ComboboxCodigoEsocial from "@/components/esocial/ComboboxCodigoEsocial";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const CAMPOS_COMBO = { parte_corpo: "parte_corpo", agente_causador: "agente_causador", situacao_geradora: "situacao_geradora", natureza_lesao: "natureza_lesao" };

const FIELDS = [
  { key: "data_hora", label: "Data e hora" },
  { key: "local", label: "Local" },
  { key: "funcao_acidentado", label: "Função do acidentado" },
  { key: "descricao", label: "Descrição do acidente" },
  { key: "parte_corpo", label: "Parte do corpo atingida" },
  { key: "agente_causador", label: "Agente causador" },
  { key: "situacao_geradora", label: "Situação geradora" },
  { key: "natureza_lesao", label: "Natureza da lesão" },
  { key: "testemunhas", label: "Testemunhas" },
  { key: "cat_numero", label: "Número da CAT / recibo do S-2210" },
  { key: "cat_data", label: "Data de registro da CAT (AAAA-MM-DD)" },
];

export default function Acidentes() {
  const navigate = useNavigate();
  const { activeCompanyId } = useAppState();
  const [companies, setCompanies] = useState([]);
  const [selCompany, setSelCompany] = useState(activeCompanyId || "");
  const [ocorrencias, setOcorrencias] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRef, setMediaRef] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [rawInput, setRawInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [doneLink, setDoneLink] = useState(null);

  useEffect(() => {
    base44.entities.Company.list("-created_date", 100).then((c) => {
      setCompanies(c);
      if (!selCompany && c.length > 0) setSelCompany(c[0].id);
    });
  }, []);

  const loadOcorrencias = () => {
    if (!selCompany) return;
    base44.entities.OcorrenciaAcidente.filter({ company_id: selCompany }).then(setOcorrencias).catch(() => {});
  };

  useEffect(() => { loadOcorrencias(); }, [selCompany]);

  const company = companies.find((c) => c.id === selCompany);

  const extract = async (text) => {
    if (!text.trim() || !company) return;
    setExtracting(true);
    try {
      const res = await invokeAI("acidente_extracao", {
        prompt: `Você é um assistente de SST. Extraia os dados do acidente de trabalho descrito abaixo. Retorne apenas JSON. Se um campo não estiver no texto, deixe vazio. Para "afastamento" e "envolve_maquina", retorne boolean.\n\nTexto: """${text}"""`,
        response_json_schema: {
          type: "object",
          properties: {
            data_hora: { type: "string" }, local: { type: "string" }, funcao_acidentado: { type: "string" },
            descricao: { type: "string" }, parte_corpo: { type: "string" }, agente_causador: { type: "string" },
            situacao_geradora: { type: "string" }, natureza_lesao: { type: "string" },
            afastamento: { type: "boolean" }, testemunhas: { type: "string" }, envolve_maquina: { type: "boolean" },
          },
        },
      });
      const data = typeof res === "object" ? res : JSON.parse(res);
      setDraft({ ...data, descricao: data.descricao || text, _raw: text });
      setRawInput("");
    } catch (err) {
      alert("Erro ao extrair. Tente novamente.");
    } finally {
      setExtracting(false);
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const localChunks = [];
      rec.ondataavailable = (e) => localChunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(localChunks, { type: rec.mimeType || "audio/webm" });
        setExtracting(true);
        try {
          // Áudio fica privado; transcrição gratuita, a extração dos dados custa 1 crédito
          const transcript = await transcreverAudio("transcricao_acidente", blob);
          if (transcript.trim()) extract(transcript.trim());
          else { alert("Não consegui entender o áudio."); setExtracting(false); }
        } catch (err) { alert(err?.message || "Erro no áudio."); setExtracting(false); }
      };
      rec.start();
      setMediaRef(rec);
      setRecording(true);
    } catch { alert("Sem acesso ao microfone."); }
  };

  const stopRec = () => mediaRef?.stop();

  const save = async () => {
    if (!draft?.descricao) { alert("Descrição é obrigatória."); return; }
    setSaving(true);
    try {
      const { _raw, ...clean } = draft;
      const created = await base44.entities.OcorrenciaAcidente.create({ ...clean, company_id: selCompany, status: "rascunho" });
      setOcorrencias((list) => [created, ...list]);
      setShowNew(false);
      setDraft(null);
      setDoneLink(created.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runInvestigation = async (oco) => {
    setInvestigating(true);
    try {
      const res = await invokeAI("acidente_investigacao", {
        prompt: `Você é um especialista em investigação de acidentes de trabalho. Com base na ocorrência abaixo, gere uma análise estruturada. Retorne apenas JSON.\n\nOcorrência: ${JSON.stringify({ descricao: oco.descricao, funcao: oco.funcao_acidentado, local: oco.local, envolve_maquina: oco.envolve_maquina })}`,
        response_json_schema: {
          type: "object",
          properties: {
            cinco_porques: { type: "array", items: { type: "string" } },
            ishikawa: { type: "object", properties: {
              metodo: { type: "array", items: { type: "string" } }, maquina: { type: "array", items: { type: "string" } },
              material: { type: "array", items: { type: "string" } }, mao_de_obra: { type: "array", items: { type: "string" } },
              medida: { type: "array", items: { type: "string" } }, meio_ambiente: { type: "array", items: { type: "string" } },
            } },
            plano_acao: { type: "array", items: { type: "object", properties: { acao: { type: "string" }, responsavel: { type: "string" }, prazo: { type: "string" } } } },
            nr12: { type: "string" },
          },
        },
      });
      const data = typeof res === "object" ? res : JSON.parse(res);
      if (!oco.envolve_maquina) data.nr12 = "";
      const updated = await base44.entities.OcorrenciaAcidente.update(oco.id, { investigacao: data, status: "em_investigacao" });
      setOcorrencias((list) => list.map((o) => (o.id === oco.id ? updated : o)));
    } catch { alert("Erro na investigação."); }
    finally { setInvestigating(false); }
  };

  const conclude = async (oco) => {
    await base44.entities.OcorrenciaAcidente.update(oco.id, { status: "concluida" });
    setOcorrencias((list) => list.map((o) => (o.id === oco.id ? { ...o, status: "concluida" } : o)));
    setDoneLink(oco.id);
  };

  const downloadCat = (oco) => {
    const pdf = generateCatPdf(company, oco);
    pdf.save(`CAT_${(company?.razao_social || "oco").replace(/\s/g, "_")}.pdf`);
  };

  const remove = async (oco) => {
    if (!confirm("Remover esta ocorrência?")) return;
    await base44.entities.OcorrenciaAcidente.delete(oco.id);
    setOcorrencias((list) => list.filter((o) => o.id !== oco.id));
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";
  const statusLabel = { rascunho: "Rascunho", em_investigacao: "Em investigação", concluida: "Concluída" };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Acidentes e CAT</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>Registro de ocorrências e minuta de CAT para conferência.</p>
        </div>
        <button onClick={() => { setShowNew(true); setDraft(null); setRawInput(""); }} disabled={!company} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
          <Plus size={16} /> Nova ocorrência
        </button>
      </div>

      {!company && <p className="text-sm" style={{ color: WORK.muted }}>Cadastre uma empresa primeiro.</p>}

      {/* Lembrete discreto do prazo da CAT */}
      <div className="rounded-lg border p-3 mb-5 flex items-start gap-2" style={{ background: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.3)" }}>
        <ShieldQuestion size={16} className="shrink-0 mt-0.5" style={{ color: "#EAB308" }} />
        <p className="text-xs" style={{ color: WORK.muted }}>
          Lembre-se de conferir o prazo legal para comunicação da CAT. O app não afirma o prazo — confira na fonte oficial.
        </p>
      </div>

      <div className="space-y-2">
        {ocorrencias.length === 0 && company && (
          <div className="rounded-lg border p-8 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <AlertTriangle size={28} className="mx-auto mb-2" style={{ color: WORK.muted }} />
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhuma ocorrência registrada.</p>
          </div>
      )}
        {ocorrencias.map((o) => (
          <div key={o.id} className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: o.status === "concluida" ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)", color: o.status === "concluida" ? "#22C55E" : WORK.accent }}>{statusLabel[o.status]}</span>
                  {o.envolve_maquina && <span className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: "rgba(220,38,38,0.12)", color: "#ef4444" }}><FileWarning size={10} /> NR-12</span>}
                  <span className="text-xs" style={{ color: WORK.muted }}>{o.data_hora || "—"}</span>
                </div>
                <p className="text-sm" style={{ color: WORK.text }}>{o.descricao}</p>
                {o.funcao_acidentado && <p className="text-xs mt-1" style={{ color: WORK.muted }}>Função: {o.funcao_acidentado}</p>}
              </div>
              <button onClick={() => remove(o)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => downloadCat(o)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
                <Download size={13} /> Minuta CAT
              </button>
              {!o.investigacao && (
                <button onClick={() => runInvestigation(o)} disabled={investigating} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md disabled:opacity-50" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                  <Sparkles size={13} /> {investigating ? "Analisando..." : "Investigar"}
                </button>
            )}
              {o.status !== "concluida" && (
                <button onClick={() => conclude(o)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
                  <ChevronRight size={13} /> Concluir
                </button>
            )}
            </div>
            {o.investigacao && (
              <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: WORK.border }}>
                {o.investigacao.cinco_porques?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: WORK.text }}>5 Porquês</p>
                    {o.investigacao.cinco_porques.map((q, i) => <p key={i} className="text-xs" style={{ color: WORK.muted }}>{i + 1}. {q}</p>)}
                  </div>
              )}
                {o.investigacao.plano_acao?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: WORK.text }}>Plano de ação</p>
                    {o.investigacao.plano_acao.map((a, i) => <p key={i} className="text-xs" style={{ color: WORK.muted }}>{i + 1}. {a.acao}{a.responsavel ? ` (${a.responsavel})` : ""}{a.prazo ? ` — ${a.prazo}` : ""}</p>)}
                  </div>
              )}
              </div>
          )}
            {doneLink === o.id && o.status === "concluida" && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: WORK.border }}>
                <Heart size={14} style={{ color: "#EAB308" }} />
                <span className="text-xs" style={{ color: WORK.muted }}>Isso pesa.</span>
                <button onClick={() => { navigate("/espaco-zela"); setDoneLink(null); }} className="text-xs underline" style={{ color: "#EAB308" }}>Quer conversar no Canal de escuta?</button>
              </div>
          )}
          </div>
      ))}
      </div>

      {/* Modal nova ocorrência */}
      {showNew && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl border p-5 max-h-[92vh] overflow-y-auto" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>Nova ocorrência</h2>
              <button onClick={() => setShowNew(false)} style={{ color: WORK.muted }}><X size={20} /></button>
            </div>

            {!draft && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: WORK.muted }}>Descreva o acidente por texto ou áudio. A IA extrai os campos — você confirma cada um.</p>
                <textarea rows={5} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={rawInput} onChange={(e) => setRawInput(e.target.value)} placeholder="Ex: Hoje às 14h, o soldador João escorregou em óleo no chão da oficina e bateu o cotovelo..." />
                <div className="flex gap-2">
                  <button onClick={() => extract(rawInput)} disabled={extracting || !rawInput.trim()} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                    <Sparkles size={16} /> {extracting ? "Extraindo..." : "Extrair com IA"}
                  </button>
                  <button onClick={recording ? stopRec : startRec} disabled={extracting} className="p-2.5 rounded-lg border disabled:opacity-50" style={{ borderColor: recording ? "#ef4444" : WORK.border, color: recording ? "#ef4444" : WORK.muted }}>
                    {recording ? <Square size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              </div>
          )}

            {draft && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: WORK.muted }}>Campos extraídos — revise e confirme cada um.</p>
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>{f.label} <span style={{ color: WORK.accent }}>· confirmar</span></label>
                    {f.key === "descricao" ? (
                      <textarea rows={3} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={draft[f.key] || ""} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
                  ) : CAMPOS_COMBO[f.key] ? (
                      <ComboboxCodigoEsocial tabela={CAMPOS_COMBO[f.key]} value={draft[f.key] || ""} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
                  ) : (
                      <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={draft[f.key] || ""} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
                  )}
                  </div>
              ))}
                <div className="flex items-center gap-4">
                  <label className="text-xs flex items-center gap-2" style={{ color: WORK.text }}>
                    <input type="checkbox" checked={!!draft.afastamento} onChange={(e) => setDraft((d) => ({ ...d, afastamento: e.target.checked }))} /> Houve afastamento
                  </label>
                  <label className="text-xs flex items-center gap-2" style={{ color: WORK.text }}>
                    <input type="checkbox" checked={!!draft.envolve_maquina} onChange={(e) => setDraft((d) => ({ ...d, envolve_maquina: e.target.checked }))} /> Envolve máquina/equipamento
                  </label>
                </div>
                <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                  {saving ? "Salvando..." : "Salvar ocorrência"}
                </button>
              </div>
          )}
          </div>
        </div>
    )}
    </div>
);
}