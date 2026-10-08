import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { INSTRUMENTS, LEVEL_COLORS } from "@/lib/wellnessInstruments";
import { getAnonymousId } from "@/lib/ventSafety";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { X, TrendingUp, TrendingDown, Minus, Activity, Lock, BarChart3, Calendar } from "lucide-react";

const CARE = {
  bg: "#0D1A18", surface: "#142925", border: "#1F3D38",
  accent: "#EAB308", text: "#F0FDF4", muted: "#86EFAC",
};

const STORAGE_KEY = "zela_wellness_history";
const INSTR_COLORS = {
  pss4: "#F97316", olbi8: "#ef4444", ucla3: "#818cf8", disconnection: "#22d3ee",
};

function loadLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

// Mescla histórico local + servidor, deduplicando por instrumento+data+score
function mergeHistories(local, remote) {
  const merged = {};
  Object.keys(INSTRUMENTS).forEach((id) => {
    const localList = local[id] || [];
    const remoteList = (remote[id] || []).map((r) => ({
      date: r.created_date || r.date,
      score: r.score,
      level: r.level,
    }));
    const all = [...localList, ...remoteList];
    const seen = new Set();
    merged[id] = all
      .filter((h) => {
        const key = `${h.score}_${new Date(h.date).getTime()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  return merged;
}

export default function WellnessPanel({ open, onClose }) {
  const [all, setAll] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const local = loadLocalHistory();
      try {
        const res = await base44.entities.WellnessAssessment.filter(
          { anonymous_id: getAnonymousId() },
          { sort: "created_date", limit: 500 }
        );
        const items = res.items || res || [];
        // Agrupa por instrumento
        const remote = {};
        items.forEach((r) => {
          if (!remote[r.instrument]) remote[r.instrument] = [];
          remote[r.instrument].push(r);
        });
        if (!cancelled) setAll(mergeHistories(local, remote));
      } catch {
        if (!cancelled) setAll(mergeHistories(local, {}));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  const instruments = Object.values(INSTRUMENTS);
  const totalAssessments = instruments.reduce((sum, inst) => sum + (all[inst.id]?.length || 0), 0);

  // Dados combinados por data (porcentagem do máximo de cada instrumento)
  const byDate = {};
  instruments.forEach((inst) => {
    (all[inst.id] || []).forEach((h) => {
      const d = new Date(h.date);
      const dKey = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!byDate[dKey]) byDate[dKey] = { date: dKey, _t: d.getTime() };
      byDate[dKey][inst.id] = Math.round((h.score / inst.max) * 100);
    });
  });
  const chartData = Object.values(byDate).sort((a, b) => a._t - b._t);

  // Linha do tempo (todas as avaliações, ordem decrescente)
  const timeline = [];
  instruments.forEach((inst) => {
    (all[inst.id] || []).forEach((h) => {
      timeline.push({ ...h, instrument: inst, dateObj: new Date(h.date) });
    });
  });
  timeline.sort((a, b) => b.dateObj - a.dateObj);

  const trendFor = (instId) => {
    const hist = all[instId] || [];
    if (hist.length < 2) return null;
    const last = hist[hist.length - 1].score;
    const prev = hist[hist.length - 2].score;
    if (last > prev) return "up";
    if (last < prev) return "down";
    return "stable";
  };

  // Estatística agregada: média de % do máximo entre todos os instrumentos na última avaliação
  const lastScores = instruments
    .map((inst) => {
      const hist = all[inst.id] || [];
      if (hist.length === 0) return null;
      return { inst, last: hist[hist.length - 1], pct: (hist[hist.length - 1].score / inst.max) * 100 };
    })
    .filter(Boolean);
  const avgPct = lastScores.length > 0
    ? Math.round(lastScores.reduce((s, x) => s + x.pct, 0) / lastScores.length)
    : 0;

  // Conta avaliações por faixa
  const levelCounts = { baixo: 0, moderado: 0, elevado: 0 };
  instruments.forEach((inst) => {
    (all[inst.id] || []).forEach((h) => {
      if (levelCounts[h.level] !== undefined) levelCounts[h.level]++;
    });
  });

  const activeInstrs = instruments.filter((i) => (all[i.id] || []).length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4">
      <div
        className="w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl border max-h-[92vh] overflow-y-auto"
        style={{ background: CARE.bg, borderColor: CARE.border, color: CARE.text }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ background: CARE.bg, borderColor: CARE.border }}>
          <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: CARE.text }}>
            <Activity size={16} style={{ color: CARE.accent }} /> Minha evolução
          </span>
          <button onClick={onClose} style={{ color: CARE.muted }}><X size={20} /></button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: CARE.border, borderTopColor: CARE.accent }} />
              <p className="text-xs" style={{ color: CARE.muted }}>Carregando seu histórico...</p>
            </div>
          ) : totalAssessments === 0 ? (
            <div className="text-center py-10">
              <Activity size={32} className="mx-auto mb-3" style={{ color: CARE.muted }} />
              <p className="text-sm mb-1" style={{ color: CARE.text }}>Você ainda não fez autoavaliações.</p>
              <p className="text-xs" style={{ color: CARE.muted }}>Responda "Entender como estou" para começar a acompanhar sua evolução aqui.</p>
            </div>
          ) : (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: CARE.border, background: CARE.surface }}>
                  <p className="text-2xl font-bold" style={{ color: CARE.accent }}>{totalAssessments}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: CARE.muted }}>avaliações</p>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: CARE.border, background: CARE.surface }}>
                  <p className="text-2xl font-bold" style={{ color: avgPct > 66 ? "#ef4444" : avgPct > 33 ? CARE.accent : "#22C55E" }}>
                    {avgPct}%
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: CARE.muted }}>média atual</p>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: CARE.border, background: CARE.surface }}>
                  <p className="text-2xl font-bold" style={{ color: "#22C55E" }}>{levelCounts.baixo}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: CARE.muted }}>sinais leves</p>
                </div>
              </div>

              {/* Gráfico combinado de evolução */}
              {chartData.length > 0 && (
                <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: CARE.border, background: CARE.surface }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <BarChart3 size={14} style={{ color: CARE.accent }} />
                    <span className="text-xs font-medium" style={{ color: CARE.text }}>Evolução ao longo do tempo (% do máximo)</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                      <defs>
                        {activeInstrs.map((inst) => (
                          <linearGradient key={inst.id} id={`grad-${inst.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={INSTR_COLORS[inst.id]} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={INSTR_COLORS[inst.id]} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CARE.border} opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: CARE.muted }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: CARE.muted }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: CARE.bg, border: `1px solid ${CARE.border}`, borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: CARE.muted }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {activeInstrs.map((inst) => (
                        <Area
                          key={inst.id}
                          type="monotone"
                          dataKey={inst.id}
                          name={inst.label}
                          stroke={INSTR_COLORS[inst.id]}
                          strokeWidth={2}
                          fill={`url(#grad-${inst.id})`}
                          dot={{ r: 3, fill: INSTR_COLORS[inst.id] }}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cards detalhados por instrumento */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {instruments.map((inst) => {
                  const hist = all[inst.id] || [];
                  const last = hist[hist.length - 1];
                  const trend = trendFor(inst.id);
                  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
                  const trendColor = trend === "up" ? "#ef4444" : trend === "down" ? "#22C55E" : CARE.muted;
                  const instData = hist.map((h, i) => ({
                    date: new Date(h.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                    score: h.score,
                  }));
                  return (
                    <div key={inst.id} className="rounded-xl border p-3" style={{ borderColor: CARE.border, background: CARE.surface }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{inst.emoji}</span>
                        {trend && <TrendIcon size={14} style={{ color: trendColor }} />}
                      </div>
                      <p className="text-xs" style={{ color: CARE.muted }}>{inst.label}</p>
                      {last ? (
                        <>
                          <p className="text-lg font-bold" style={{ color: LEVEL_COLORS[last.level] || CARE.text }}>
                            {last.score}/{inst.max}
                          </p>
                          <p className="text-[10px] mb-2" style={{ color: CARE.muted }}>{hist.length} {hist.length === 1 ? "avaliação" : "avaliações"}</p>
                          {instData.length > 1 && (
                            <ResponsiveContainer width="100%" height={50}>
                              <LineChart data={instData} margin={{ top: 2, right: 2, bottom: 0, left: -30 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis domain={[0, inst.max]} hide />
                                <Tooltip
                                  contentStyle={{ background: CARE.bg, border: `1px solid ${CARE.border}`, borderRadius: 6, fontSize: 10 }}
                                  labelStyle={{ color: CARE.muted }}
                                />
                                <Line type="monotone" dataKey="score" stroke={INSTR_COLORS[inst.id]} strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </>
                      ) : (
                        <p className="text-xs mt-1" style={{ color: CARE.muted }}>Sem dados</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Distribuição por faixa */}
              <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: CARE.border, background: CARE.surface }}>
                <span className="text-xs font-medium" style={{ color: CARE.text }}>Distribuição por faixa de sinais</span>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Sinais leves", key: "baixo", color: "#22C55E" },
                    { label: "Sinais moderados", key: "moderado", color: "#EAB308" },
                    { label: "Sinais elevados", key: "elevado", color: "#F97316" },
                  ].map((row) => {
                    const count = levelCounts[row.key];
                    const pct = totalAssessments > 0 ? (count / totalAssessments) * 100 : 0;
                    return (
                      <div key={row.key} className="flex items-center gap-2">
                        <span className="text-xs w-28" style={{ color: CARE.muted }}>{row.label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: CARE.bg }}>
                          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: row.color }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right" style={{ color: CARE.text }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linha do tempo */}
              <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: CARE.border, background: CARE.surface }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Calendar size={14} style={{ color: CARE.accent }} />
                  <span className="text-xs font-medium" style={{ color: CARE.text }}>Linha do tempo</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timeline.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-base">{t.instrument.emoji}</span>
                      <span style={{ color: CARE.muted }}>{t.dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="flex-1 truncate" style={{ color: CARE.text }}>{t.instrument.label}</span>
                      <span className="font-medium" style={{ color: LEVEL_COLORS[t.level] || CARE.text }}>{t.score}/{t.instrument.max}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota de anonimato */}
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <Lock size={14} className="shrink-0 mt-0.5" style={{ color: CARE.accent }} />
                <p className="text-xs leading-relaxed" style={{ color: CARE.muted }}>
                  Seus resultados são vinculados apenas a um identificador anônimo — nunca à sua conta ou empresa. Ninguém além de você vê este painel.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}