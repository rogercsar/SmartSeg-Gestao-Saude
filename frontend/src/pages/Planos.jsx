import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, X, Users, Crown, ShieldCheck, Lock, Sparkles } from "lucide-react";
import CreditosPlanos from "@/components/CreditosPlanos";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const PLAN_INFO = [
  { nome: "Grátis", creditos: 30, descricao: "Para começar — 1 empresa, documentos básicos.", limite: 1, recursos: ["1 empresa", "Chat de NR", "Documentos básicos", "Canal de escuta"] },
  { nome: "Essencial", creditos: 200, descricao: "Para o autônomo — múltiplas empresas e documentos.", limite: 1, recursos: ["Empresas ilimitadas", "Todos os documentos", "Acidentes e CAT", "Treinamentos"] },
  { nome: "Profissional", creditos: 750, descricao: "Para quem precisa de mais — dados abertos e multas.", limite: 1, recursos: ["Tudo do Essencial", "Estatísticas de setor", "Calculadora de multas", "Risco de autuação"] },
  { nome: "Equipe", creditos: 2500, descricao: "Para consultorias — assentos para o time de SST.", limite: 10, recursos: ["Tudo do Profissional", "Assentos para o time", "Gestão de assentos", "Painel do administrador"] },
];

export default function Planos() {
  const { toast } = useToast();
  const [assentos, setAssentos] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email_convite: "", role: "user" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.Assento.list("-created_date", 100).then(setAssentos).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const invite = async (e) => {
    e.preventDefault();
    if (!form.email_convite) return;
    setSaving(true);
    try {
      await base44.entities.Assento.create({ ...form, plano_nome: "Equipe", status: "pendente" });
      try {
        // Sempre convida como usuário do app; o papel "admin" aqui é só da equipe (não dá acesso de administrador do sistema)
        await base44.users.inviteUser(form.email_convite, "user");
      } catch (err) {
        // O convite do assento fica registrado mesmo se o convite de usuário falhar
      }
      setForm({ email_convite: "", role: "user" });
      setShowInvite(false);
      load();
      toast({ title: "Assento criado e convite enviado." });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAssento = async (a) => {
    if (!confirm(`Remover assento de ${a.email_convite}?`)) return;
    await base44.entities.Assento.delete(a.id);
    load();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Planos</h1>
      <p className="text-sm mb-6" style={{ color: WORK.muted }}>Cada plano inclui créditos mensais de IA; recargas extras não expiram. O plano Equipe permite gerenciar assentos do time.</p>

      <CreditosPlanos />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {PLAN_INFO.map((p) => (
          <div key={p.nome} className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: p.nome === "Equipe" ? WORK.accent : WORK.border }}>
            <div className="flex items-center gap-2 mb-2">
              {p.nome === "Equipe" ? <Crown size={18} style={{ color: WORK.accent }} /> : <Users size={18} style={{ color: WORK.muted }} />}
              <h2 className="font-semibold" style={{ color: WORK.text }}>{p.nome}</h2>
            </div>
            <p className="text-xs mb-3" style={{ color: WORK.muted }}>{p.descricao}</p>
            <p className="text-sm mb-3 flex items-center gap-1.5 font-medium" style={{ color: WORK.text }}>
              <Sparkles size={14} style={{ color: WORK.accent }} /> {p.creditos.toLocaleString("pt-BR")} créditos de IA / mês
            </p>
            <ul className="space-y-1">
              {p.recursos.map((r) => (
                <li key={r} className="text-xs flex items-center gap-2" style={{ color: WORK.text }}>
                  <ShieldCheck size={12} style={{ color: "#22C55E" }} /> {r}
                </li>
            ))}
            </ul>
          </div>
      ))}
      </div>

      {/* Gestão de assentos — plano Equipe */}
      <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown size={18} style={{ color: WORK.accent }} />
            <h2 className="font-semibold" style={{ color: WORK.text }}>Assentos do time (Equipe)</h2>
          </div>
          <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: WORK.accent, color: "#FFFFFF" }}>
            <Plus size={15} /> Convidar
          </button>
        </div>

        <div className="rounded-lg p-3 mb-4 flex items-start gap-2" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)" }}>
          <Lock size={14} className="shrink-0 mt-0.5" style={{ color: "#EAB308" }} />
          <p className="text-xs" style={{ color: WORK.muted }}>
            O administrador gerencia quem tem assento, mas <strong style={{ color: WORK.text }}>nunca acessa o conteúdo do Canal de escuta</strong>. O desabafo de cada profissional é privado.
          </p>
        </div>

        <div className="space-y-2">
          {assentos.length === 0 && <p className="text-sm text-center py-4" style={{ color: WORK.muted }}>Nenhum assento ainda.</p>}
          {assentos.map((a) => (
            <div key={a.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: WORK.bg, borderColor: WORK.border }}>
              <div>
                <p className="text-sm" style={{ color: WORK.text }}>{a.email_convite}</p>
                <p className="text-xs" style={{ color: WORK.muted }}>{a.role === "admin" ? "Admin da equipe" : "Profissional"} · {a.status}</p>
              </div>
              <button onClick={() => removeAssento(a)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
            </div>
        ))}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <form onSubmit={invite} className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5 space-y-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>Convidar profissional</h2>
              <button type="button" onClick={() => setShowInvite(false)} style={{ color: WORK.muted }}><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>E-mail *</label>
              <input type="email" className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.email_convite} onChange={(e) => setForm((f) => ({ ...f, email_convite: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Papel</label>
              <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="user">Profissional (user)</option>
                <option value="admin">Admin da equipe</option>
              </select>
            </div>
            <p className="text-xs" style={{ color: WORK.muted }}>O convidado terá acesso ao módulo de Trabalho. O Canal de escuta dele é privado — você não vê o conteúdo.</p>
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
              {saving ? "Enviando..." : "Enviar convite"}
            </button>
          </form>
        </div>
    )}
    </div>
);
}