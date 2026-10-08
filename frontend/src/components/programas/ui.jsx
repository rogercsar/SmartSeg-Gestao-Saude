import React from "react";
import { X, Loader2 } from "lucide-react";
import { WORK } from "@/lib/sst";

export function Botao({ children, onClick, tipo = "secundario", disabled, carregando, className = "", title }) {
  const estilos = {
    primario: { background: WORK.accent, color: "#FFFFFF", border: "1px solid " + WORK.accent },
    secundario: { background: "transparent", color: WORK.text, border: "1px solid " + WORK.border },
    perigo: { background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.4)" },
  };
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${className}`}
      style={estilos[tipo]}>
      {carregando && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Campo({ label, valor, onChange, tipo = "text", opcoes, placeholder, linhas = 3, className = "" }) {
  const base = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };
  const cls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  let input;
  if (tipo === "select") {
    input = (
      <select className={cls} style={base} value={valor ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {Object.entries(opcoes || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    );
  } else if (tipo === "textarea") {
    input = <textarea className={cls} style={base} rows={linhas} value={valor ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  } else if (tipo === "checkbox") {
    return (
      <label className={`flex items-center gap-2 text-sm ${className}`} style={{ color: WORK.text }}>
        <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} /> {label}
      </label>
    );
  } else {
    input = <input className={cls} style={base} type={tipo} value={valor ?? ""} placeholder={placeholder}
      onChange={(e) => onChange(tipo === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />;
  }
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs mb-1" style={{ color: WORK.muted }}>{label}</span>}
      {input}
    </label>
  );
}

export function Modal({ titulo, aberto, onFechar, children, largura = "max-w-3xl", rodape }) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 md:p-6 overflow-y-auto" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className={`w-full ${largura} rounded-xl border my-4`} style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: WORK.border }}>
          <h3 className="font-semibold" style={{ color: WORK.text }}>{titulo}</h3>
          <button onClick={onFechar} style={{ color: WORK.muted }}><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
        {rodape && <div className="px-5 py-4 border-t flex flex-wrap justify-end gap-2" style={{ borderColor: WORK.border }}>{rodape}</div>}
      </div>
    </div>
  );
}

export function Cartao({ titulo, acoes, children, className = "" }) {
  return (
    <div className={`rounded-lg border p-4 ${className}`} style={{ background: WORK.surface, borderColor: WORK.border }}>
      {(titulo || acoes) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {titulo && <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>{titulo}</h3>}
          {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Etiqueta({ cor, children }) {
  return (
    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: cor + "26", color: cor, border: `1px solid ${cor}55` }}>{children}</span>
  );
}

export function Vazio({ children }) {
  return <p className="text-sm py-4 text-center" style={{ color: WORK.muted }}>{children}</p>;
}

// Lista editável simples de textos (medidas, etc.)
export function ListaTexto({ label, itens = [], onChange, placeholder }) {
  const [novo, setNovo] = React.useState("");
  const add = () => { if (novo.trim()) { onChange([...itens, novo.trim()]); setNovo(""); } };
  return (
    <div>
      <span className="block text-xs mb-1" style={{ color: WORK.muted }}>{label}</span>
      <div className="space-y-1 mb-2">
        {itens.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
            <span className="flex-1">• {t}</span>
            <button onClick={() => onChange(itens.filter((_, j) => j !== i))} style={{ color: WORK.muted }}><X size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
          value={novo} placeholder={placeholder} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <Botao onClick={add}>Adicionar</Botao>
      </div>
    </div>
  );
}

export const erroMsg = (e) => { if (e?.code !== "SEM_CREDITOS") alert(e?.message || "Algo deu errado. Tente novamente."); };
