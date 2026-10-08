import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/ai";
import { nrContextForPrompt } from "@/lib/nrKnowledge";
import { searchNormaTrechos, formatTrechos } from "@/lib/nrRetrieval";
import { Send, Plus, MessageSquare, ShieldAlert, Trash2, Globe } from "lucide-react";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
};

const DISCLAIM =
  "Esta é uma orientação geral com base nas Normas Regulamentadoras e não substitui a análise de um profissional habilitado para casos específicos.";

function extractNrs(text) {
  const matches = (text || "").match(/NR-?\s?\d{1,2}/gi) || [];
  return Array.from(new Set(matches.map((m) => m.replace(/\s/g, "").replace(/NR/i, "NR-").replace(/NR--/, "NR-"))));
}

export default function ChatNR() {
  const { activeCompanyId } = useAppState();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.entities.ChatConversation.list("-created_date", 50).then((c) => {
      setConversations(c);
      if (c.length > 0 && !activeId) {
        setActiveId(c[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeId) { setActive(null); return; }
    base44.entities.ChatConversation.get(activeId).then(setActive).catch(() => setActive(null));
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages?.length, sending]);

  const newConversation = () => {
    base44.entities.ChatConversation.create({
      titulo: "Nova conversa",
      company_id: activeCompanyId || null,
      messages: [],
    }).then((c) => {
      setConversations((list) => [c, ...list]);
      setActiveId(c.id);
    });
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    let conv = active;
    if (!conv) {
      conv = await base44.entities.ChatConversation.create({
        titulo: input.slice(0, 40),
        company_id: activeCompanyId || null,
        messages: [],
      });
      setConversations((list) => [conv, ...list]);
      setActiveId(conv.id);
    }
    const userMsg = { role: "user", content: input.trim(), normas_citadas: [] };
    const updatedMessages = [...(conv.messages || []), userMsg];
    setActive({ ...conv, messages: updatedMessages });
    setInput("");
    setSending(true);

    try {
      const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      const trechos = await searchNormaTrechos(userMsg.content);
      const trechoCtx = formatTrechos(trechos);
      const hasBase = trechoCtx.length > 0;
      const baseSection = hasBase
        ? `TRECHOS OFICIAIS IMPORTADOS (referência autoritativa — cite a NR e o ITEM exato):\n${trechoCtx}`
        : `BASE DE CONHECIMENTO GERAL (NRs):\n${nrContextForPrompt()}`;
      const baseNote = hasBase
        ? "Você tem trechos oficiais importados. Cite a NR e o item exato (ex: 'NR-6, item 6.1'). Se a pergunta for ambígua, faça UMA pergunta de esclarecimento antes de responder."
        : "Não há trechos oficiais importados para este tema. Diga 'não encontrei na base importada' e oriente a conferir na fonte oficial.";
      const prompt = `Você é um assistente especialista em Segurança e Saúde do Trabalho (SST) no Brasil, com domínio das Normas Regulamentadoras (NR) do Ministério do Trabalho. Responda em português brasileiro, de forma clara e prática, para um profissional de SST.

Data de hoje: ${today}.

${baseSection}

${baseNote}

Além disso, use a busca em tempo real para verificar atualizações normativas recentes, novas portarias, reformulações de NRs ou jurisprudência (TST, TRTs). Quando usar informação da busca, indique a fonte e a data. Nunca invente número de item, texto de norma ou valor de multa — se não souber, diga que não encontrou na base.

PERGUNTA DO PROFISSIONAL: ${userMsg.content}

Ao final, inclua sempre esta observação: "${DISCLAIM}"`;

      const res = await invokeAI("chat_nr", { prompt, add_context_from_internet: true });
      const answer = typeof res === "string" ? res : res?.response || res?.answer || JSON.stringify(res);
      const normas = extractNrs(answer);
      const assistantMsg = { role: "assistant", content: answer, normas_citadas: normas };
      const finalMessages = [...updatedMessages, assistantMsg];
      const titulo = conv.titulo === "Nova conversa" ? userMsg.content.slice(0, 40) : conv.titulo;
      await base44.entities.ChatConversation.update(conv.id, { messages: finalMessages, titulo });
      setActive({ ...conv, titulo, messages: finalMessages });
      setConversations((list) =>
        list.map((c) => (c.id === conv.id ? { ...c, titulo, messages: finalMessages } : c))
      );
    } catch (err) {
      const errMsg = "Não consegui processar sua pergunta agora. Tente novamente em instantes.";
      const finalMessages = [...updatedMessages, { role: "assistant", content: errMsg, normas_citadas: [] }];
      setActive({ ...conv, messages: finalMessages });
    } finally {
      setSending(false);
    }
  };

  const removeConv = async (c) => {
    if (!confirm("Remover esta conversa?")) return;
    await base44.entities.ChatConversation.delete(c.id);
    setConversations((list) => list.filter((x) => x.id !== c.id));
    if (activeId === c.id) setActiveId(null);
  };

  return (
    <div className="flex h-[calc(100dvh-12.5rem)] md:h-[calc(100vh-65px)]" style={{ background: WORK.bg }}>
      {/* Conversation list */}
      <aside className="hidden md:flex flex-col w-72 border-r" style={{ borderColor: WORK.border }}>
        <div className="p-3 border-b" style={{ borderColor: WORK.border }}>
          <button onClick={newConversation} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ background: WORK.accent, color: "#FFFFFF" }}>
            <Plus size={16} /> Nova conversa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: WORK.muted }}>Nenhuma conversa ainda.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 group"
              style={{ background: activeId === c.id ? WORK.surface : "transparent" }}
            >
              <MessageSquare size={15} style={{ color: activeId === c.id ? WORK.accent : WORK.muted }} />
              <span className="text-sm truncate flex-1" style={{ color: activeId === c.id ? WORK.text : WORK.muted }}>{c.titulo}</span>
              <span onClick={(e) => { e.stopPropagation(); removeConv(c); }} className="opacity-0 group-hover:opacity-100" style={{ color: WORK.muted }}>
                <Trash2 size={13} />
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: WORK.border }}>
          <div>
            <h1 className="font-semibold flex items-center gap-2" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>
              Chat de Normas Regulamentadoras
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
                <Globe size={10} /> busca em tempo real
              </span>
            </h1>
            <p className="text-xs" style={{ color: WORK.muted }}>Respostas com base nas NRs · {DISCLAIM}</p>
          </div>
          <button onClick={newConversation} className="md:hidden flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
            <Plus size={14} /> Nova
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {!active && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <ShieldAlert size={36} className="mb-3" style={{ color: WORK.accent }} />
              <h2 className="text-lg font-semibold mb-1" style={{ color: WORK.text }}>Tire suas dúvidas sobre NRs</h2>
              <p className="text-sm mb-4 max-w-md" style={{ color: WORK.muted }}>
                Pergunte em linguagem natural, como "quais EPIs são obrigatórios para trabalho em altura?" e receba respostas citando a norma correspondente.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {["Quais EPIs são obrigatórios para trabalho em altura?", "O que deve conter uma Ordem de Serviço (NR-1)?", "Quando o PCMSO é obrigatório?"].map((s) => (
                  <button key={s} onClick={() => { setInput(s); }} className="text-left text-sm px-3 py-2.5 rounded-lg border hover:border-orange-500/40" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {active?.messages?.map((m, i) => (
            <div key={i} className="flex" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div className="max-w-[85%] rounded-2xl px-4 py-3" style={{
                background: m.role === "user" ? WORK.accent : WORK.surface,
                color: m.role === "user" ? "#FFFFFF" : WORK.text,
                border: m.role === "user" ? "none" : `1px solid ${WORK.border}`,
              }}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                {m.normas_citadas?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.normas_citadas.map((n, j) => (
                      <span key={j} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.15)", color: m.role === "user" ? "#FFFFFF" : WORK.accent }}>{n}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 border" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: WORK.accent }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: WORK.accent, animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: WORK.accent, animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t" style={{ borderColor: WORK.border }}>
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Pergunte sobre uma NR..."
              className="flex-1 px-4 py-3 rounded-xl border text-sm resize-none outline-none focus:border-orange-500"
              style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
            />
            <button onClick={send} disabled={sending || !input.trim()} className="p-3 rounded-xl disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}