import React, { useState } from "react";
import { MessageSquare, Library, BookOpen } from "lucide-react";
import ChatNR from "@/pages/ChatNR";
import TextosTecnicos from "@/pages/TextosTecnicos";
import Normas from "@/pages/Normas";

const WORK = {
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
};

const ABAS = [
  { key: "chat", label: "Chat NR", icon: MessageSquare, Comp: ChatNR },
  { key: "textos", label: "Textos técnicos", icon: Library, Comp: TextosTecnicos },
  { key: "normas", label: "Base normativa", icon: BookOpen, Comp: Normas },
];

export default function AssistenteIA() {
  const [aba, setAba] = useState("chat");
  const ativa = ABAS.find((a) => a.key === aba) || ABAS[0];
  const Comp = ativa.Comp;

  return (
    <div>
      <div className="px-4 md:px-8 pt-4 md:pt-6">
        <div className="flex items-center gap-1 border-b" style={{ borderColor: WORK.border }}>
          {ABAS.map((a) => {
            const Icon = a.icon;
            const active = aba === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setAba(a.key)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
                style={{
                  borderColor: active ? WORK.accent : "transparent",
                  color: active ? WORK.accent : WORK.muted,
                }}
              >
                <Icon size={16} /> {a.label}
              </button>
          );
          })}
        </div>
      </div>
      <div>
        <Comp />
      </div>
    </div>
);
}