import React from "react";
import { X, Stethoscope, ShieldCheck, Lock, AlertTriangle } from "lucide-react";
import { ACCESS_TRUST } from "@/lib/ventSafety";

const CARE = { surface: "#142925", border: "#1F3D38", accent: "#EAB308", text: "#F0FDF4", muted: "#86EFAC" };

// 4 pilares de segurança — transparência pública (inspirado no diagrama da Amy).
const PILLARS = [
  { icon: Stethoscope, title: "Profissionais de saúde envolvidos", text: "A escuta do Zeca foi desenhada com orientação de profissionais de saúde mental." },
  { icon: ShieldCheck, title: "Testes rigorosos", text: "Passamos por testes de segurança e de linguagem de crise antes de chegar a você." },
  { icon: Lock, title: "Privacidade", text: "O que você escreve aqui não é exibido para sua empresa, seus clientes nem para a equipe. Ninguém tem acesso ao conteúdo dos seus desabafos." },
  { icon: AlertTriangle, title: "Detecção de linguagem de crise", text: "Se aparecerem sinais de risco grave, o sistema oferece ancoragem imediata e o CVV (188)." },
];

export default function CarePillars({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-md w-full rounded-2xl border p-5" style={{ background: CARE.surface, borderColor: CARE.border }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: CARE.text, fontFamily: "Plus Jakarta Sans" }}>Como o SmartSeg protege você</h3>
          <button onClick={onClose} style={{ color: CARE.muted }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(234,179,8,0.12)" }}>
                  <Icon size={18} style={{ color: CARE.accent }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: CARE.text }}>{p.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: CARE.muted }}>{p.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(234,179,8,0.10)", border: `1px solid ${CARE.accent}` }}>
          <Lock size={16} className="shrink-0 mt-0.5" style={{ color: CARE.accent }} />
          <p className="text-xs leading-relaxed" style={{ color: CARE.text }}>{ACCESS_TRUST}</p>
        </div>
        <p className="text-center text-sm mt-4 pt-4 border-t" style={{ borderColor: CARE.border, color: CARE.text, fontFamily: "Plus Jakarta Sans" }}>
          O Zela é feito por quem entende o peso do seu trabalho.
        </p>
      </div>
    </div>
  );
}