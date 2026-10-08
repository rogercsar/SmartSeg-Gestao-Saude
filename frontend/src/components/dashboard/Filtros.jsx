import React from "react";
import { PRESETS } from "@/lib/dashboardData";
import { WORK } from "@/lib/sst";
import { CalendarDays, Filter } from "lucide-react";

const sel = "px-3 py-2 rounded-lg border text-sm outline-none";
const st = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };

export default function Filtros({ filtros, setFiltros, cats, providers }) {
  const setPreset = (preset) => setFiltros((f) => ({ ...f, preset }));
  return (
    <div className="rounded-xl border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: WORK.text }}>
          <Filter size={16} style={{ color: WORK.accent }} /> Filtros
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: filtros.preset === p.id ? WORK.accent : WORK.border, color: filtros.preset === p.id ? "#FFFFFF" : WORK.muted, background: filtros.preset === p.id ? WORK.accent : "transparent" }}>
              {p.label}
            </button>
          ))}
        </div>
        {filtros.preset === "custom" && (
          <div className="flex items-center gap-2">
            <CalendarDays size={15} style={{ color: WORK.muted }} />
            <input type="date" className={sel} style={st} value={filtros.customStart} onChange={(e) => setFiltros((f) => ({ ...f, customStart: e.target.value }))} />
            <span style={{ color: WORK.muted }}>→</span>
            <input type="date" className={sel} style={st} value={filtros.customEnd} onChange={(e) => setFiltros((f) => ({ ...f, customEnd: e.target.value }))} />
          </div>
        )}
        <div className="flex flex-wrap gap-2 ml-auto">
          <select className={sel} style={st} value={filtros.categoryId} onChange={(e) => setFiltros((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Todas as categorias</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={sel} style={st} value={filtros.providerId} onChange={(e) => setFiltros((f) => ({ ...f, providerId: e.target.value }))}>
            <option value="">Todos os prestadores</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}