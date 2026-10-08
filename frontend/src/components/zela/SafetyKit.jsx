import React, { useState } from "react";
import { X, Wind, Phone, UserRound, Anchor } from "lucide-react";
import { CVV_INFO, SAFETY_ROUTES, EMERGENCY_NUMBERS } from "@/lib/ventSafety";

const CARE = {
  surface: "#142925",
  border: "#1F3D38",
  accent: "#EAB308",
  text: "#F0FDF4",
  muted: "#86EFAC",
};

// Safety Kit inspirado no modelo da Elomia: 3 rotas de escalonamento,
// não uma só. (a) ancoragem imediata na conversa, (b) linha de crise,
// (c) lembrete de contato de confiança — sem guardar nada.
export default function SafetyKit({ open, onClose, onGround }) {
  const [route, setRoute] = useState(null);
  if (!open) return null;

  const pick = (r) => {
    if (r.id === "ground") {
      onGround();
      onClose();
    } else {
      setRoute(r.id);
    }
  };

  return (
    <div className="mx-4 mb-2 max-w-2xl w-full lg:mx-auto rounded-2xl border p-4" style={{ background: "rgba(234,179,8,0.12)", borderColor: CARE.accent }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Anchor size={18} style={{ color: CARE.accent }} />
          <p className="text-sm font-semibold" style={{ color: CARE.text }}>Vamos cuidar deste momento juntos</p>
        </div>
        <button onClick={onClose} style={{ color: CARE.muted }}><X size={16} /></button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b" style={{ borderColor: CARE.border }}>
        {EMERGENCY_NUMBERS.map((n) => (
          <div key={n.numero} className="flex-1 text-center px-2 py-1.5 rounded-lg" style={{ background: CARE.surface }}>
            <p className="text-sm font-bold" style={{ color: CARE.accent }}>{n.numero}</p>
            <p className="text-[10px]" style={{ color: CARE.muted }}>{n.label}</p>
          </div>
        ))}
      </div>

      {!route && (
        <div className="grid gap-2">
          {SAFETY_ROUTES.map((r) => {
            const Icon = r.id === "ground" ? Wind : r.id === "cvv" ? Phone : UserRound;
            return (
              <button
                key={r.id}
                onClick={() => pick(r)}
                className="text-left p-3 rounded-xl border flex items-start gap-3 hover:bg-white/5"
                style={{ borderColor: CARE.border, background: CARE.surface }}
              >
                <Icon size={18} className="shrink-0 mt-0.5" style={{ color: CARE.accent }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: CARE.text }}>{r.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: CARE.muted }}>{r.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {route === "cvv" && (
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: CARE.text }}>{CVV_INFO.label} — {CVV_INFO.phone}</p>
          <p className="text-sm leading-relaxed" style={{ color: CARE.text }}>{CVV_INFO.message}</p>
          <button onClick={() => setRoute(null)} className="mt-3 text-xs underline" style={{ color: CARE.muted }}>Ver as outras opções</button>
        </div>
      )}

      {route === "contato" && (
        <div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: CARE.text }}>
            Pense agora em alguém em quem você confia — uma pessoa, só isso. Quer que eu te lembre de ligar pra essa pessoa agora? Nada é guardado: é só entre você e ela.
          </p>
          <p className="text-xs" style={{ color: CARE.muted }}>Se quiser, pegue o telefone e faça a ligação. Eu continuo aqui quando você voltar.</p>
          <button onClick={() => setRoute(null)} className="mt-3 text-xs underline" style={{ color: CARE.muted }}>Ver as outras opções</button>
        </div>
      )}
    </div>
  );
}