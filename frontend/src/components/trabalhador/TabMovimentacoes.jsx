import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRightLeft, History, Power, X, Save } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const MOV_LABELS = {
  admissao: "Admissão", transferencia_cargo: "Troca de cargo",
  transferencia_setor: "Troca de setor", transferencia_unidade: "Troca de unidade",
  transferencia_empresa: "Transferência entre empresas", promocao: "Promoção",
  demissao: "Demissão", reativacao: "Reativação", inativacao: "Inativação",
};

export default function TabMovimentacoes({ trabalhador, cargo, setor, unidade, cargos, setores, unidades, companies, onUpdate }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [form, setForm] = useState({
    new_company_id: trabalhador.company_id,
    new_cargo_id: "",
    new_setor_id: "",
    new_unidade_id: "",
    tipo: "transferencia_cargo",
    observacao: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.LotacaoHistorico.filter({ trabalhador_id: trabalhador.id }, { sort: "-data_inicio" });
      setHistorico(res.items || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [trabalhador.id]);

  const toggleStatus = async () => {
    const newStatus = trabalhador.status === "ativo" ? "inativo" : "ativo";
    const tipoMov = newStatus === "inativo" ? "inativacao" : "reativacao";
    setSaving(true);
    try {
      await base44.entities.Trabalhador.update(trabalhador.id, {
        status: newStatus,
        data_demissao: newStatus === "inativo" ? new Date().toISOString().split("T")[0] : null,
      });
      await base44.entities.LotacaoHistorico.create({
        company_id: trabalhador.company_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
        data_inicio: new Date().toISOString().split("T")[0],
        tipo_movimentacao: tipoMov,
        observacao: newStatus === "inativo" ? "Inativação do trabalhador" : "Reativação do trabalhador",
      });
      onUpdate();
      load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const doTransfer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const isCompanyChange = form.new_company_id !== trabalhador.company_id;
      const tipoMov = isCompanyChange ? "transferencia_empresa"
        : form.new_cargo_id !== trabalhador.cargo_id ? "transferencia_cargo"
        : form.new_setor_id !== trabalhador.setor_id ? "transferencia_setor"
        : "transferencia_unidade";

      // Fecha lotação anterior
      const openHist = historico.find((h) => !h.data_fim);
      if (openHist) {
        await base44.entities.LotacaoHistorico.update(openHist.id, { data_fim: today });
      }

      // Atualiza trabalhador
      await base44.entities.Trabalhador.update(trabalhador.id, {
        company_id: form.new_company_id,
        cargo_id: form.new_cargo_id || trabalhador.cargo_id,
        setor_id: form.new_setor_id || undefined,
        unidade_id: form.new_unidade_id || undefined,
      });

      // Cria nova lotação
      await base44.entities.LotacaoHistorico.create({
        company_id: form.new_company_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
        cargo_id: form.new_cargo_id || trabalhador.cargo_id,
        setor_id: form.new_setor_id || undefined,
        unidade_id: form.new_unidade_id || undefined,
        data_inicio: today,
        tipo_movimentacao: tipoMov,
        observacao: form.observacao,
      });

      setShowTransfer(false);
      onUpdate();
      load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500";
  const cargoNome = (id) => cargos.find((c) => c.id === id)?.nome_cargo || "—";
  const setorNome = (id) => setores.find((s) => s.id === id)?.nome || "—";
  const unidadeNome = (id) => unidades.find((u) => u.id === id)?.nome || "—";
  const empresaNome = (id) => companies.find((c) => c.id === id)?.razao_social || "—";

  return (
    <div className="space-y-5">
      {/* Lotação atual */}
      <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: WORK.text }}>Lotação atual</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-xs" style={{ color: WORK.muted }}>Empresa</span><p style={{ color: WORK.text }}>{empresaNome(trabalhador.company_id)}</p></div>
          <div><span className="text-xs" style={{ color: WORK.muted }}>Cargo</span><p style={{ color: WORK.text }}>{cargo?.nome_cargo || "—"}</p></div>
          <div><span className="text-xs" style={{ color: WORK.muted }}>Setor</span><p style={{ color: WORK.text }}>{setor?.nome || "—"}</p></div>
          <div><span className="text-xs" style={{ color: WORK.muted }}>Unidade</span><p style={{ color: WORK.text }}>{unidade?.nome || "—"}</p></div>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowTransfer(true)} className="rounded-lg border p-4 flex items-center gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <ArrowRightLeft size={20} style={{ color: WORK.accent }} />
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: WORK.text }}>Transferir / Trocar</p>
            <p className="text-xs" style={{ color: WORK.muted }}>Cargo, setor, unidade ou empresa</p>
          </div>
        </button>
        <button onClick={toggleStatus} disabled={saving} className="rounded-lg border p-4 flex items-center gap-3 disabled:opacity-50" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <Power size={20} style={{ color: trabalhador.status === "ativo" ? "#ef4444" : "#22c55e" }} />
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: WORK.text }}>{trabalhador.status === "ativo" ? "Inativar" : "Reativar"}</p>
            <p className="text-xs" style={{ color: WORK.muted }}>{trabalhador.status === "ativo" ? "Desligar trabalhador" : "Voltar a ativo"}</p>
          </div>
        </button>
      </div>

      {/* Modal de transferência */}
      {showTransfer && (
        <form onSubmit={doTransfer} className="rounded-lg border p-4 space-y-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: WORK.text }}>Transferir trabalhador</span>
            <button type="button" onClick={() => setShowTransfer(false)} style={{ color: WORK.muted }}><X size={16} /></button>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Empresa de destino</label>
            <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.new_company_id} onChange={(e) => setForm((f) => ({ ...f, new_company_id: e.target.value, new_cargo_id: "", new_setor_id: "", new_unidade_id: "" }))}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Novo cargo</label>
            <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.new_cargo_id} onChange={(e) => setForm((f) => ({ ...f, new_cargo_id: e.target.value }))}>
              <option value="">Manter cargo atual</option>
              {cargos.filter((c) => c.company_id === form.new_company_id).map((c) => <option key={c.id} value={c.id}>{c.nome_cargo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Novo setor</label>
              <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.new_setor_id} onChange={(e) => setForm((f) => ({ ...f, new_setor_id: e.target.value }))}>
                <option value="">Sem setor</option>
                {setores.filter((s) => s.company_id === form.new_company_id).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Nova unidade</label>
              <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.new_unidade_id} onChange={(e) => setForm((f) => ({ ...f, new_unidade_id: e.target.value }))}>
                <option value="">Sem unidade</option>
                {unidades.filter((u) => u.company_id === form.new_company_id).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Observação</label>
            <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} placeholder="Motivo da transferência" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: WORK.accent, color: "#FFFFFF" }}>
            <Save size={14} /> {saving ? "Transferindo..." : "Confirmar transferência"}
          </button>
        </form>
      )}

      {/* Histórico de lotação */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History size={16} style={{ color: WORK.accent }} />
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Histórico de lotação</h3>
        </div>
        {loading ? (
          <div className="text-center py-4" style={{ color: WORK.muted }}>Carregando...</div>
        ) : historico.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Sem movimentações registradas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historico.map((h) => (
              <div key={h.id} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
                    {MOV_LABELS[h.tipo_movimentacao] || h.tipo_movimentacao}
                  </span>
                  <span className="text-xs" style={{ color: WORK.muted }}>
                    {new Date(h.data_inicio).toLocaleDateString("pt-BR")}{h.data_fim ? ` → ${new Date(h.data_fim).toLocaleDateString("pt-BR")}` : " — atual"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: WORK.muted }}>
                  {h.cargo_id ? cargoNome(h.cargo_id) : ""}{h.setor_id ? ` · ${setorNome(h.setor_id)}` : ""}{h.unidade_id ? ` · ${unidadeNome(h.unidade_id)}` : ""}
                </p>
                {h.observacao && <p className="text-xs mt-1" style={{ color: WORK.muted }}>{h.observacao}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}