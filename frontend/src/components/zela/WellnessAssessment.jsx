import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  INSTRUMENTS,
  DISCLAIMER,
  HELP_ROUTES,
  computeScore,
  levelFor,
  LEVEL_COLORS,
} from "@/lib/wellnessInstruments";
import { getAnonymousId } from "@/lib/ventSafety";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { X, ArrowLeft, LifeBuoy, Heart, TrendingUp } from "lucide-react";

const CARE = {
  bg: "#0D1A18",
  surface: "#142925",
  border: "#1F3D38",
  accent: "#EAB308",
  text: "#F0FDF4",
  muted: "#86EFAC",
};

const STORAGE_KEY = "zela_wellness_history";

function loadHistory(instrumentId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[instrumentId] || [];
  } catch {
    return [];
  }
}

function saveHistory(instrumentId, entry) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const list = all[instrumentId] || [];
    list.push(entry);
    all[instrumentId] = list;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* silencioso */
  }
}

export default function WellnessAssessment({ open, onClose, onVent }) {
  const [phase, setPhase] = useState("menu"); // menu | questions | result
  const [instr, setInstr] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (open) {
      setPhase("menu");
      setInstr(null);
      setAnswers([]);
      setIdx(0);
      setResult(null);
      setShowHelp(false);
    }
  }, [open]);

  if (!open) return null;

  const startInstrument = (key) => {
    const inst = INSTRUMENTS[key];
    setInstr(inst);
    setAnswers([]);
    setIdx(0);
    setPhase("questions");
  };

  const answer = (value) => {
    const next = [...answers, value];
    if (idx + 1 < instr.items.length) {
      setAnswers(next);
      setIdx(idx + 1);
    } else {
      finish(next);
    }
  };

  const finish = async (allAnswers) => {
    const score = computeScore(instr, allAnswers);
    const level = levelFor(instr, score);
    const entry = { date: new Date().toISOString(), score, level: level.level };
    saveHistory(instr.id, entry);
    setHistory(loadHistory(instr.id));
    setResult({ score, level });
    setPhase("result");
    try {
      await base44.entities.WellnessAssessment.create({
        anonymous_id: getAnonymousId(),
        instrument: instr.id,
        score,
        level: level.level,
        responses: allAnswers.map((v, i) => ({ item: i, value: v })),
        sinalizado_risco: false,
      });
    } catch (e) {
      /* silencioso: o rastreamento não depende de persistir */
    }
  };

  const back = () => {
    if (phase === "questions") {
      if (idx === 0) setPhase("menu");
      else {
        setIdx(idx - 1);
        setAnswers(answers.slice(0, -1));
      }
    } else if (phase === "result") {
      setPhase("menu");
    }
  };

  const chartData = history.map((h, i) => ({
    i: i + 1,
    score: h.score,
    date: new Date(h.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4">
      <div
        className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border max-h-[92vh] overflow-y-auto"
        style={{ background: CARE.bg, borderColor: CARE.border, color: CARE.text }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b z-10" style={{ background: CARE.bg, borderColor: CARE.border }}>
          {phase !== "menu" ? (
            <button onClick={back} className="flex items-center gap-1 text-sm" style={{ color: CARE.muted }}>
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <span className="flex items-center gap-2 text-sm font-medium" style={{ color: CARE.text }}>
              <Heart size={15} style={{ color: CARE.accent }} /> Entender como estou
            </span>
          )}
          <button onClick={onClose} style={{ color: CARE.muted }}>
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        {phase === "menu" && (
          <div className="p-5">
            <p className="text-sm mb-1" style={{ color: CARE.text }}>
              Rastreamento de sinais de bem-estar. Você escolhe um tema, responde com sinceridade e recebe uma leitura — nunca um diagnóstico.
            </p>
            <p className="text-xs mb-4" style={{ color: CARE.muted }}>
              {DISCLAIMER}
            </p>
            <div className="space-y-2">
              {Object.values(INSTRUMENTS).map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => startInstrument(inst.id)}
                  className="w-full text-left p-3 rounded-xl border flex items-start gap-3 hover:bg-white/5 transition-colors"
                  style={{ borderColor: CARE.border, background: CARE.surface }}
                >
                  <span className="text-2xl shrink-0">{inst.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm" style={{ color: CARE.text }}>{inst.label}</span>
                      {inst.kind === "reflection" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(134,239,172,0.12)", color: CARE.muted }}>auto-reflexão</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: CARE.muted }}>{inst.description}</p>
                    <p className="text-[11px] mt-1" style={{ color: CARE.accent }}>{inst.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {phase === "questions" && instr && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs" style={{ color: CARE.muted }}>{instr.label}</span>
              <span className="text-xs" style={{ color: CARE.muted }}>{idx + 1} / {instr.items.length}</span>
            </div>
            <div className="w-full h-1 rounded-full mb-5" style={{ background: CARE.surface }}>
              <div className="h-1 rounded-full transition-all" style={{ width: `${((idx) / instr.items.length) * 100}%`, background: CARE.accent }} />
            </div>
            <p className="text-base font-medium leading-relaxed mb-5" style={{ color: CARE.text }}>
              {instr.items[idx].text}
            </p>
            <div className="space-y-2">
              {instr.scale.map((label, value) => (
                <button
                  key={value}
                  onClick={() => answer(value)}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm hover:bg-white/5 transition-colors"
                  style={{ borderColor: CARE.border, background: CARE.surface, color: CARE.text }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && instr && result && (
          <div className="p-5">
            <div className="text-center mb-4">
              <span className="text-3xl">{instr.emoji}</span>
              <h3 className="text-lg font-semibold mt-1" style={{ color: CARE.text, fontFamily: "Plus Jakarta Sans" }}>
                {instr.label}
              </h3>
            </div>

            <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: CARE.border, background: CARE.surface }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: CARE.muted }}>Pontuação</span>
                <span className="text-sm font-semibold" style={{ color: CARE.text }}>
                  {result.score} / {instr.max}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ background: `${LEVEL_COLORS[result.level.level]}22`, color: LEVEL_COLORS[result.level.level] }}
                >
                  {result.level.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: CARE.text }}>
                {result.level.message}
              </p>
            </div>

            {/* Histórico longitudinal (localStorage, anônimo) */}
            {chartData.length > 1 && (
              <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: CARE.border, background: CARE.surface }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={14} style={{ color: CARE.accent }} />
                  <span className="text-xs font-medium" style={{ color: CARE.text }}>Seu histórico de {instr.label.toLowerCase()}</span>
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: CARE.muted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, instr.max]} tick={{ fontSize: 10, fill: CARE.muted }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: CARE.bg, border: `1px solid ${CARE.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: CARE.muted }} />
                    <Line type="monotone" dataKey="score" stroke={CARE.accent} strokeWidth={2} dot={{ r: 3, fill: CARE.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="text-xs mb-4" style={{ color: CARE.muted }}>{DISCLAIMER}</p>

            {/* Rotas */}
            <div className="space-y-2">
              <button
                onClick={() => onVent?.()}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: CARE.accent, color: "#0D1A18" }}
              >
                <Heart size={16} /> Continuar desabafando com o Zeca
              </button>
              <button
                onClick={() => setShowHelp((s) => !s)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2"
                style={{ borderColor: CARE.border, color: CARE.text, background: CARE.surface }}
              >
                <LifeBuoy size={16} /> {showHelp ? "Fechar rotas de ajuda" : "Onde buscar ajuda profissional"}
              </button>
              {showHelp && (
                <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: CARE.border, background: CARE.bg }}>
                  {HELP_ROUTES.map((r) => (
                    <div key={r.label} className="text-xs">
                      <span className="font-medium" style={{ color: CARE.accent }}>{r.label}: </span>
                      <span style={{ color: CARE.text }}>{r.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}