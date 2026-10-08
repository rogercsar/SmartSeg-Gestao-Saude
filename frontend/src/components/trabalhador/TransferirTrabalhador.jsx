import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ArrowRight, Loader2, CheckCircle2, Users, FileText, Stethoscope, Syringe, Paperclip } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368", danger: "#B42318",
};

const MIGRA = [
  { icon: FileText, label: "Documentos gerados (OS, Ficha EPI, PPP, certificados)" },
  { icon: Stethoscope, label: "Atestados médicos e exames do PCMSO" },
  { icon: Syringe, label: "Vacinas e histórico de saúde" },
  { icon: Paperclip, label: "Anexos da ficha do trabalhador" },
  { icon: Users, label: "Histórico de lotação, eSocial e entregas de EPI" },
];

export default function TransferirTrabalhador({ trabalhador, onClose, onDone }) {
  const [empresas, setEmpresas] = useState([]);
  const [destinoId, setDestinoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    base44.entities.Company.list("razao_social", 500)
      .then((l) => {
        setEmpresas((l || []).filter((c) => c.id !== trabalhador.company_id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [trabalhador.company_id]);

  const confirmar = async () => {
    if (!destinoId) return;
    setSaving(true);
    setErro("");
    try {
      const res = await base44.functions.invoke("transferir-trabalhador", {
        trabalhador_id: trabalhador.id,
        empresa_destino_id: destinoId,
      });
      setResultado({ origem: res.data.origem, destino: res.data.destino, n: res.data.registros_atualizados });
    } catch (e) {
      setErro(e?.response?.data?.error || e?.message || "Falha na transferência.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
      <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border p-5 max-h-[92vh] overflow-y-auto"
        style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>Transferir colaborador</h2>
          <button onClick={onClose} style={{ color: WORK.muted }}><X size={20} /></button>
        </div>

        {resultado ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: "#22C55E" }} />
            <p className="font-medium mb-1" style={{ color: WORK.text }}>Transferência concluída</p>
            <p className="text-sm mb-3" style={{ color: WORK.muted }}>
              <b style={{ color: WORK.text }}>{trabalhador.nome}</b> foi transferido de <b>{resultado.origem}</b> para <b>{resultado.destino}</b>.
            </p>
            <p className="text-xs mb-4" style={{ color: WORK.muted }}>{resultado.n} registro(s) migrado(s).</p>
            <button onClick={() => onDone?.()} className="px-4 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: WORK.accent, color: "#FFFFFF" }}>Concluir</button>
          </div>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: WORK.muted }}>
              Selecione a empresa de destino. A ficha completa do colaborador migra junto:
            </p>
            <div className="space-y-1.5 mb-4">
              {MIGRA.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="flex items-center gap-2 text-xs" style={{ color: WORK.text }}>
                    <Icon size={14} style={{ color: WORK.accent }} /> {m.label}
                  </div>
                );
              })}
            </div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Empresa de destino *</label>
            {loading ? (
              <div className="py-4 text-center"><Loader2 size={18} className="animate-spin mx-auto" style={{ color: WORK.muted }} /></div>
            ) : (
              <select className={inputCls + " mb-1"} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
                <option value="">Selecione a empresa...</option>
                {empresas.map((c) => (
                  <option key={c.id} value={c.id}>{c.razao_social}{c.e_matriz ? " (Matriz)" : ""}{c.uf ? ` · ${c.uf}` : ""}</option>
                ))}
              </select>
            )}
            {empresas.length === 0 && !loading && (
              <p className="text-xs mt-1" style={{ color: WORK.danger }}>Cadastre outra empresa antes de transferir.</p>
            )}
            {erro && <p className="text-sm text-red-500 mt-2">{erro}</p>}
            <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: WORK.muted }}>
              <span>{trabalhador.nome}</span> <ArrowRight size={12} />
              <span style={{ color: destinoId ? WORK.accent : WORK.muted }}>
                {empresas.find((e) => e.id === destinoId)?.razao_social || "—"}
              </span>
            </div>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
                style={{ borderColor: WORK.border, color: WORK.text }}>Cancelar</button>
              <button type="button" onClick={confirmar} disabled={!destinoId || saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                style={{ background: WORK.accent, color: "#FFFFFF" }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />} Transferir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}