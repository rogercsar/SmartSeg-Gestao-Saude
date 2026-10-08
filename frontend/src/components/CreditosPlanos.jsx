import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getSaldoIA, acaoCreditos } from "@/lib/ai";
import { calcularPlanoVidas, brl as brlP, num, descFaixa } from "@/lib/precos";
import { Sparkles, Check, X, ShieldCheck, Loader2 } from "lucide-react";

const WORK = { bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE", accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368" };
const NOME_PLANO = { gratuito: "Grátis", essencial: "Essencial", profissional: "Profissional", equipe: "Equipe" };
const STATUS = { pendente: "Aguardando aprovação", aprovado: "Aprovado", recusado: "Recusado" };
const reais = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Saldo, recargas e (para administradores) gestão de créditos
const brl = brlP;
function Simulador() {
  const [vidas, setVidas] = useState("100");
  const p = calcularPlanoVidas(vidas);
  return (
    <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <h2 className="font-semibold mb-1" style={{ color: WORK.text }}>Simulador de preço por vidas</h2>
      <p className="text-xs mb-3" style={{ color: WORK.muted }}>Faixas progressivas: cada faixa cobra só as vidas dentro dela. Créditos de IA incluídos proporcionalmente.</p>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <label className="text-xs" style={{ color: WORK.muted }}>Vidas ativas
          <input type="number" min={0} value={vidas} onChange={(e) => setVidas(e.target.value)} className="block mt-1 px-3 py-2 rounded-lg border text-sm w-40" style={{ borderColor: WORK.border, color: WORK.text }} />
        </label>
        <div className="text-sm" style={{ color: WORK.text }}><b className="text-2xl" style={{ color: WORK.accent }}>{brl(p.valor)}</b>/mês · {brl(p.preco_medio, 4)} por vida · {num(p.creditos)} créditos de IA</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[50, 100, 300, 1000, 5000, 10000, 20000, 50000, 100000].map((v) => (
          <button key={v} onClick={() => setVidas(String(v))} className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: WORK.border, color: WORK.muted }}>{num(v)}</button>
      ))}
      </div>
      {p.faixas.length > 0 && <p className="text-xs mt-3" style={{ color: WORK.muted }}>{p.faixas.map((f) => `${descFaixa(f)}: ${brl(f.valor)}`).join(" · ")}</p>}
    </div>
);
}

export default function CreditosPlanos() {
  const [saldo, setSaldo] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [enviando, setEnviando] = useState(null);

  const carregar = useCallback(() => {
    getSaldoIA().then(setSaldo).catch(() => {});
    base44.entities.PedidoRecarga.list("-created_date", 20).then(setPedidos).catch(() => {});
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const pedir = async (pacote) => {
    if (!confirm(`Solicitar ${pacote.creditos} créditos por ${reais(pacote.valor)}? Os créditos entram após a confirmação do pagamento.`)) return;
    setEnviando(pacote.id);
    try {
      await acaoCreditos("pedir_recarga", { pacote_id: pacote.id });
      alert("Pedido enviado! Você receberá os créditos assim que o pagamento for confirmado.");
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setEnviando(null);
    }
  };

  if (!saldo) return null;

  return (
    <div className="space-y-6 mb-8">
      <Simulador />
      <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} style={{ color: WORK.accent }} />
          <h2 className="font-semibold" style={{ color: WORK.text }}>Seus créditos de IA</h2>
        </div>
        {saldo.ilimitado ? (
          <p className="text-sm" style={{ color: WORK.muted }}>Sem limite (administrador).</p>
      ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Info rotulo="Plano" valor={NOME_PLANO[saldo.plano] || saldo.plano} />
            <Info rotulo="Restam no mês" valor={`${saldo.restante_mensal}/${saldo.mensal}`} />
            <Info rotulo="Extras" valor={saldo.extras} />
          </div>
      )}
        <p className="text-xs mt-3" style={{ color: WORK.muted }}>
          Os créditos do plano renovam todo dia 1º. Recargas extras não expiram e são usadas depois dos créditos do mês.
          O Canal de escuta não consome créditos.
        </p>
      </div>

      <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <h2 className="font-semibold mb-3" style={{ color: WORK.text }}>Recarga de créditos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(saldo.pacotes || []).map((p) => (
            <div key={p.id} className="rounded-lg border p-4 flex flex-col gap-2" style={{ background: WORK.bg, borderColor: WORK.border }}>
              <span className="text-lg font-semibold" style={{ color: WORK.text }}>{p.creditos} créditos</span>
              <span className="text-sm" style={{ color: WORK.muted }}>{reais(p.valor)}</span>
              <button onClick={() => pedir(p)} disabled={!!enviando}
                className="mt-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
                style={{ background: WORK.accent, color: "#FFFFFF" }}>
                {enviando === p.id ? <Loader2 size={14} className="animate-spin" /> : null} Solicitar
              </button>
            </div>
        ))}
        </div>
        {pedidos.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium" style={{ color: WORK.muted }}>Seus pedidos</p>
            {pedidos.map((p) => (
              <p key={p.id} className="text-xs" style={{ color: WORK.text }}>
                {p.creditos} créditos · {reais(p.valor)} · <span style={{ color: WORK.muted }}>{STATUS[p.status] || p.status}</span>
              </p>
          ))}
          </div>
      )}
      </div>

      {saldo.admin && <PainelAdmin planos={saldo.planos} aoMudar={carregar} />}
    </div>
);
}

function Info({ rotulo, valor }) {
  return (
    <div className="rounded-lg p-3" style={{ background: WORK.bg }}>
      <p className="text-xs" style={{ color: WORK.muted }}>{rotulo}</p>
      <p className="text-base font-semibold" style={{ color: WORK.text }}>{valor}</p>
    </div>
);
}

function PainelAdmin({ planos, aoMudar }) {
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(() => {
    acaoCreditos("admin_painel").then(setDados).catch((e) => alert(e.message));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const executar = async (action, params, msg) => {
    if (msg && !confirm(msg)) return;
    setOcupado(true);
    try {
      await acaoCreditos(action, params);
      carregar();
      aoMudar?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const darCreditos = (c) => {
    const v = prompt(`Quantos créditos extras adicionar para ${c.user_email}? (use negativo para remover)`, "100");
    if (v === null) return;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n === 0) return;
    executar("admin_ajustar", { carteira_id: c.id, adicionar_extras: n });
  };

  if (!dados) return null;
  const lista = dados.carteiras.filter((c) => (c.user_email || "").toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.accent }}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={18} style={{ color: WORK.accent }} />
        <h2 className="font-semibold" style={{ color: WORK.text }}>Administração de créditos</h2>
      </div>

      <p className="text-xs font-medium mb-2" style={{ color: WORK.muted }}>Pedidos de recarga pendentes</p>
      {dados.pedidos.length === 0 && <p className="text-xs mb-4" style={{ color: WORK.muted }}>Nenhum pedido pendente.</p>}
      <div className="space-y-2 mb-5">
        {dados.pedidos.map((p) => (
          <div key={p.id} className="rounded-lg border p-3 flex items-center justify-between gap-2" style={{ background: WORK.bg, borderColor: WORK.border }}>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: WORK.text }}>{p.user_email}</p>
              <p className="text-xs" style={{ color: WORK.muted }}>{p.creditos} créditos · {reais(p.valor)}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button disabled={ocupado} title="Aprovar (pagamento confirmado)"
                onClick={() => executar("admin_pedido", { pedido_id: p.id, aprovar: true }, `Confirmar pagamento e liberar ${p.creditos} créditos para ${p.user_email}?`)}
                className="p-2 rounded-lg" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}><Check size={16} /></button>
              <button disabled={ocupado} title="Recusar"
                onClick={() => executar("admin_pedido", { pedido_id: p.id, aprovar: false }, "Recusar este pedido?")}
                className="p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}><X size={16} /></button>
            </div>
          </div>
      ))}
      </div>

      <p className="text-xs font-medium mb-2" style={{ color: WORK.muted }}>Usuários</p>
      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por e-mail"
        className="w-full px-3 py-2 rounded-lg border text-sm mb-3 outline-none"
        style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} />
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {lista.map((c) => (
          <div key={c.id} className="rounded-lg border p-3 flex flex-wrap items-center gap-2 justify-between" style={{ background: WORK.bg, borderColor: WORK.border }}>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: WORK.text }}>{c.user_email || "(sem e-mail)"}</p>
              <p className="text-xs" style={{ color: WORK.muted }}>
                {c.ilimitado ? "Sem limite" : `${c.restante_mensal}/${c.mensal} no mês · ${c.extras} extras`}
                {c.modelo_cobranca === "vidas" ? ` · ${num(c.vidas)} vidas · ${brl(c.valor_mensal)}/mês` : ""}{c.valor_excedente ? ` · excedente ${brl(c.valor_excedente)}` : ""}
              </p>
            </div>
            <select disabled={ocupado} value={c.modelo_cobranca || "vidas"} onChange={(e) => executar("admin_ajustar", { carteira_id: c.id, modelo_cobranca: e.target.value })}
              className="px-2 py-1.5 rounded-lg border text-xs" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
              <option value="vidas">Por vidas</option><option value="plano">Plano fixo</option>
            </select>
            <button disabled={ocupado} className="px-2.5 py-1.5 rounded-lg text-xs border" style={{ borderColor: WORK.border, color: WORK.text }}
              onClick={() => { const v = prompt(`Vidas contratadas para ${c.user_email} (0 = usar a contagem automática):`, String(c.vidas_contratadas || 0)); if (v !== null) executar("admin_ajustar", { carteira_id: c.id, vidas_contratadas: Number(v) || 0 }); }}>vidas</button>
            <select disabled={ocupado} value={c.plano}
              onChange={(e) => executar("admin_ajustar", { carteira_id: c.id, plano: e.target.value })}
              className="px-2 py-1.5 rounded-lg border text-xs"
              style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
              {Object.keys(planos || {}).map((k) => (
                <option key={k} value={k}>{NOME_PLANO[k] || k} ({planos[k]}/mês)</option>
            ))}
            </select>
            <button disabled={ocupado} onClick={() => darCreditos(c)}
              className="px-2.5 py-1.5 rounded-lg text-xs border" style={{ borderColor: WORK.border, color: WORK.text }}>
              + créditos
            </button>
          </div>
      ))}
      </div>
      <p className="text-xs mt-3" style={{ color: WORK.muted }}>
        Usuários aparecem aqui depois do primeiro acesso ao app.
      </p>
    </div>
);
}
