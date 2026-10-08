import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { invokeAI, transcreverAudio } from "@/lib/ai";
import { buildZecaPrompt, PERSONAS } from "@/lib/zecaPersonas";
import { getAnonymousId, detectRisk, classifyRisk, GROUNDING_TECHNIQUE, ACCESS_TRUST } from "@/lib/ventSafety";
import SafetyKit from "@/components/zela/SafetyKit";
import CarePillars from "@/components/zela/CarePillars";
import WellnessAssessment from "@/components/zela/WellnessAssessment";
import WellnessPanel from "@/components/zela/WellnessPanel";
import {
  ArrowLeft,
  Send,
  Mic,
  Square,
  Heart,
  ShieldQuestion,
  ShieldCheck,
  Lock,
  Stethoscope,
  Activity,
} from "lucide-react";

const CARE = {
  bg: "#0D1A18",
  surface: "#142925",
  border: "#1F3D38",
  accent: "#EAB308",
  text: "#F0FDF4",
  muted: "#86EFAC",
};

export default function EspacoZela() {
  const navigate = useNavigate();
  const { persona, setPersona } = useAppState();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Oi. Eu sou o Zeca. Aqui não precisa se proteger — pode soltar o que pesa. Como está o seu coração hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showStress, setShowStress] = useState(null); // message id awaiting stress
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [showPillars, setShowPillars] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [showWellness, setShowWellness] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const scrollRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, safetyOpen]);

  const persistVent = async (data) => {
    try {
      await base44.entities.VentMessage.create({
        anonymous_id: getAnonymousId(),
        tipo: data.tipo,
        conteudo: data.conteudo,
        nivel_estresse: data.nivel_estresse || null,
        sinalizado_risco: data.sinalizado_risco || false,
        categoria_risco: data.categoria_risco || "nenhum",
        persona,
        response: data.response || "",
      });
    } catch (e) {
      // silencioso: o desabafo não depende de persistir
    }
  };

  const respond = async (userContent, tipo) => {
    setSending(true);
    const keywordRisk = detectRisk(userContent);
    if (keywordRisk) setSafetyOpen(true);

    const history = [...messages, { role: "user", content: userContent }];
    setMessages(history);

    try {
      const prompt = buildZecaPrompt(persona, history.slice(-8));
      // Resposta + classificação de risco em paralelo (chamada separada ao modelo)
      const [res, cls] = await Promise.all([
        invokeAI("zeca", { prompt }),
        classifyRisk(userContent),
      ]);
      const answer = typeof res === "string" ? res : res?.response || res?.answer || "Tô aqui contigo. Pode continuar.";
      const categoria = cls?.categoria || (keywordRisk ? "autolesao" : "nenhum");
      if (categoria !== "nenhum") setSafetyOpen(true);
      const newMsgs = [...history, { role: "assistant", content: answer }];
      setMessages(newMsgs);
      setShowStress("last");
      persistVent({ tipo, conteudo: userContent, sinalizado_risco: categoria !== "nenhum", categoria_risco: categoria, response: answer });
    } catch (e) {
      const fallback = e?.code === "LIMITE_DIARIO"
        ? e.message
        : "Não consegui responder agora, mas continuo aqui. Pode tentar de novo?";
      setMessages([...history, { role: "assistant", content: fallback }]);
      persistVent({ tipo, conteudo: userContent, sinalizado_risco: keywordRisk, categoria_risco: keywordRisk ? "autolesao" : "nenhum", response: fallback });
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    respond(content, "texto");
  };

  const offerGrounding = () => {
    setMessages((m) => [...m, { role: "assistant", content: GROUNDING_TECHNIQUE }]);
  };

  const setStress = async (level) => {
    setShowStress(null);
    try {
      const last = messages.filter((m) => m.role === "user").slice(-1)[0];
      await base44.entities.VentMessage.create({
        anonymous_id: getAnonymousId(),
        tipo: "texto",
        conteudo: last?.content || "",
        nivel_estresse: level,
        sinalizado_risco: false,
        persona,
        response: "",
      });
    } catch (e) {}
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setSending(true);
        try {
          // Áudio fica privado; a transcrição é gratuita (conta no limite diário)
          const transcript = await transcreverAudio("transcricao_zeca", blob);
          if (transcript.trim()) {
            respond(transcript.trim(), "audio");
          } else {
            setSending(false);
            alert("Não consegui entender o áudio. Tente novamente ou escreva.");
          }
        } catch (e) {
          setSending(false);
          alert(e?.code === "LIMITE_DIARIO" ? e.message : "Erro ao processar áudio. Tente escrever.");
        }
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch (e) {
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const currentPersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CARE.bg, color: CARE.text, fontFamily: "Inter" }}>
      {/* Top bar */}
      <header className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: CARE.border }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm" style={{ color: CARE.muted }}>
          <ArrowLeft size={18} /> <span className="hidden sm:inline">Voltar ao trabalho</span>
        </button>
        <div className="flex items-center gap-2">
          <Heart size={18} style={{ color: CARE.accent }} />
          <span className="font-semibold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans", color: CARE.text }}>
            Canal de escuta
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setPersonaOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
            style={{ borderColor: CARE.border, background: CARE.surface, color: CARE.text }}
          >
            <span>{currentPersona.emoji}</span>
            <span className="hidden sm:inline">Zeca {currentPersona.label}</span>
          </button>
          {personaOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border shadow-xl overflow-hidden z-30" style={{ background: CARE.surface, borderColor: CARE.border }}>
              <div className="px-3 py-2 text-xs border-b" style={{ borderColor: CARE.border, color: CARE.muted }}>
                Personalidade do Zeca
              </div>
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPersona(p.id); setPersonaOpen(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-white/5"
                  style={{ background: persona === p.id ? "rgba(234,179,8,0.1)" : "transparent" }}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: CARE.text }}>{p.label}</p>
                    <p className="text-xs" style={{ color: CARE.muted }}>{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Disclaimer strip */}
      <div className="px-4 py-2 text-center text-xs flex items-center justify-center gap-2 flex-wrap" style={{ color: CARE.muted, background: "rgba(31,61,56,0.4)" }}>
        <span>O que você escreve aqui não é exibido para sua empresa, seus clientes nem para a equipe. Não substitui atendimento psicológico.</span>
        <button onClick={() => setShowPillars(true)} className="underline inline-flex items-center gap-1" style={{ color: CARE.accent }}>
          <ShieldCheck size={12} /> Como o SmartSeg cuida
        </button>
        <span style={{ color: CARE.border }}>·</span>
        <button onClick={() => setShowWellness(true)} className="underline inline-flex items-center gap-1" style={{ color: CARE.accent }}>
          <Stethoscope size={12} /> Entender como estou
        </button>
        <span style={{ color: CARE.border }}>·</span>
        <button onClick={() => setShowPanel(true)} className="underline inline-flex items-center gap-1" style={{ color: CARE.accent }}>
          <Activity size={12} /> Minha evolução
        </button>
      </div>

      {/* Aviso de confiança: quem paga não vê o conteúdo */}
      <div className="px-4 py-2.5 text-center text-xs flex items-center justify-center gap-2" style={{ color: CARE.text, background: "rgba(234,179,8,0.10)", borderBottom: `1px solid ${CARE.border}` }}>
        <Lock size={12} className="shrink-0" style={{ color: CARE.accent }} />
        <span style={{ maxWidth: "640px" }}>{ACCESS_TRUST}</span>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className="flex" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div className="w-9 h-9 rounded-full flex items-center justify-center mr-2 shrink-0 text-lg" style={{ background: CARE.surface, border: `1px solid ${CARE.border}` }}>
                  {currentPersona.emoji}
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl"
                style={{
                  background: m.role === "user" ? CARE.accent : CARE.surface,
                  color: m.role === "user" ? "#0D1A18" : CARE.text,
                  border: m.role === "user" ? "none" : `1px solid ${CARE.border}`,
                  borderTopLeftRadius: m.role === "assistant" ? 6 : undefined,
                  borderTopRightRadius: m.role === "user" ? 6 : undefined,
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex">
              <div className="w-9 h-9 rounded-full flex items-center justify-center mr-2 shrink-0 text-lg" style={{ background: CARE.surface, border: `1px solid ${CARE.border}` }}>
                {currentPersona.emoji}
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: CARE.surface, border: `1px solid ${CARE.border}` }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: CARE.accent }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: CARE.accent, animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: CARE.accent, animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stress meter */}
        {showStress && !sending && (
          <div className="mt-6 rounded-2xl border p-4 text-center" style={{ borderColor: CARE.border, background: CARE.surface }}>
            <p className="text-sm mb-3" style={{ color: CARE.text }}>Como está seu nível de estresse essa semana?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStress(n)}
                  className="w-10 h-10 rounded-full text-sm font-medium transition-colors hover:scale-110"
                  style={{ background: "rgba(234,179,8,0.12)", color: CARE.text, border: `1px solid ${CARE.border}` }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStress(null)} className="mt-3 text-xs" style={{ color: CARE.muted }}>
              Prefiro não responder
            </button>
          </div>
        )}
      </div>

      {/* Safety Kit — 3 rotas de escalonamento (ancoragem / CVV / contato de confiança) */}
      <SafetyKit open={safetyOpen} onClose={() => setSafetyOpen(false)} onGround={offerGrounding} />

      {/* 4 pilares de segurança */}
      <CarePillars open={showPillars} onClose={() => setShowPillars(false)} />

      {/* Trilha de autoavaliação (rastreamento, não diagnóstico) */}
      <WellnessAssessment
        open={showWellness}
        onClose={() => setShowWellness(false)}
        onVent={() => setShowWellness(false)}
      />

      <WellnessPanel open={showPanel} onClose={() => setShowPanel(false)} />

      {/* Input */}
      <div className="px-4 py-4 border-t" style={{ borderColor: CARE.border, background: CARE.bg }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={sending}
            className="p-3 rounded-full border disabled:opacity-50 shrink-0"
            style={{
              borderColor: recording ? "#ef4444" : CARE.border,
              background: recording ? "rgba(239,68,68,0.15)" : CARE.surface,
              color: recording ? "#ef4444" : CARE.muted,
            }}
          >
            {recording ? <Square size={18} /> : <Mic size={18} />}
          </button>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={recording ? "Gravando áudio..." : "Escreva o que pesa... ou segure para gravar"}
            disabled={recording}
            className="flex-1 px-4 py-3 rounded-2xl border text-sm resize-none outline-none disabled:opacity-50"
            style={{ background: CARE.surface, borderColor: CARE.border, color: CARE.text }}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="p-3 rounded-full disabled:opacity-50 shrink-0"
            style={{ background: CARE.accent, color: "#0D1A18" }}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs mt-2 max-w-2xl mx-auto flex items-center justify-center gap-1" style={{ color: CARE.muted }}>
          <ShieldQuestion size={12} /> O Zeca escuta, mas não dá conselhos clínicos. Se precisar de ajuda, busque um profissional.
        </p>
      </div>
    </div>
  );
}