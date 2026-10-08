import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { getSaldoIA } from "@/lib/ai";

const WORK = { surface: "#FFFFFF", border: "#E3E8EE", accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368" };

const NOME_PLANO = { gratuito: "Grátis", essencial: "Essencial", profissional: "Profissional", equipe: "Equipe" };

function useSaldo() {
  const [saldo, setSaldo] = useState(null);
  useEffect(() => {
    let vivo = true;
    getSaldoIA().then((s) => vivo && setSaldo(s)).catch(() => {});
    const onSaldo = (e) => setSaldo(e.detail);
    window.addEventListener("zela:saldo", onSaldo);
    return () => { vivo = false; window.removeEventListener("zela:saldo", onSaldo); };
  }, []);
  return saldo;
}

// Indicador de créditos (barra lateral e topo do celular)
export function CreditBadge({ compact = false }) {
  const saldo = useSaldo();
  if (!saldo) return null;

  if (compact) {
    return (
      <Link to="/consumo" className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
        style={{ borderColor: WORK.border, color: WORK.muted }}>
        <Sparkles size={13} style={{ color: WORK.accent }} />
        {saldo.ilimitado ? "∞" : saldo.total}
      </Link>
    );
  }

  const pct = saldo.ilimitado ? 100 : Math.round((saldo.restante_mensal / Math.max(1, saldo.mensal)) * 100);
  const baixo = !saldo.ilimitado && saldo.total <= Math.max(5, saldo.mensal * 0.1);
  return (
    <Link to="/consumo" className="block px-3 py-2.5 rounded-lg border text-xs"
      style={{ borderColor: baixo ? "rgba(249,115,22,0.5)" : WORK.border, color: WORK.muted }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5" style={{ color: WORK.text }}>
          <Sparkles size={14} style={{ color: WORK.accent }} /> Créditos de IA
        </span>
        <span>{NOME_PLANO[saldo.plano] || saldo.plano}</span>
      </div>
      {saldo.ilimitado ? (
        <span>Sem limite (administrador)</span>
      ) : (
        <>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: WORK.border }}>
            <div className="h-full" style={{ width: `${pct}%`, background: WORK.accent }} />
          </div>
          <div className="mt-1.5">
            {saldo.restante_mensal}/{saldo.mensal} do mês{saldo.excedente_disponivel > 0 ? ` + ${saldo.excedente_disponivel} no limite` : ""}
            {saldo.extras > 0 ? ` + ${saldo.extras} extras` : ""}
          </div>
        </>
      )}
    </Link>
  );
}

// Aviso quando os créditos acabam (disparado por invokeAI)
export function SemCreditosDialog() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    const on = (e) => setInfo(e.detail || {});
    window.addEventListener("zela:sem-creditos", on);
    return () => window.removeEventListener("zela:sem-creditos", on);
  }, []);
  if (!info) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-sm rounded-xl border p-5" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Sparkles size={18} style={{ color: WORK.accent }} /> Créditos de IA esgotados</h3>
          <button onClick={() => setInfo(null)} style={{ color: WORK.muted }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: WORK.muted }}>
          {info.mensagem || "Seus créditos de IA acabaram."} Os créditos do plano renovam todo mês; recargas extras não expiram.
        </p>
        <Link to="/consumo" onClick={() => setInfo(null)}
          className="block text-center py-2.5 rounded-lg text-sm font-medium"
          style={{ background: WORK.accent, color: "#FFFFFF" }}>
          Ver consumo, limite e recargas
        </Link>
      </div>
    </div>
  );
}
