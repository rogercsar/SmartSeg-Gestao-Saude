import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Printer, RefreshCw, Save, ShieldCheck, Info } from "lucide-react";
import { WORK } from "@/lib/sst";
import { acaoCreditos, getSaldoIA } from "@/lib/ai";
import { brl, num, descFaixa, NOMES_RECURSO } from "@/lib/precos";
import { hojeLocal, dataBR } from "@/lib/sstGestao";
import { Botao, Campo, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";

const FONTES = { mensal: "Franquia do mês", extra: "Recarga", excedente: "Excedente", misto: "Franquia + excedente", gratuito: "Gratuito", ilimitado: "Ilimitado" };
const mesAnterior = () => { const h = hojeLocal(); const d = new Date(h.slice(0, 7) + "-01T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() - 1); const ini = d.toISOString().slice(0, 10); const f = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10); return { inicio: ini, fim: f }; };
const periodos = { atual: () => ({ inicio: hojeLocal().slice(0, 7) + "-01", fim: hojeLocal() }), anterior: mesAnterior };

export function agrupar(usos, chave) {
  const m = {};
  usos.forEach((u) => {
    const k = chave(u) || "—";
    m[k] ||= { chave: k, usos: 0, creditos: 0, valor: 0 };
    m[k].usos++; m[k].creditos += u.creditos || 0; m[k].valor += u.valor_excedente || 0;
  });
  return Object.values(m).sort((a, b) => b.creditos - a.creditos || b.usos - a.usos);
}

export function exportarCsv(usos, nome) {
  const linhas = [["Data e hora", "Usuário", "Funcionalidade", "Créditos", "Origem", "Valor excedente (R$)"]]
    .concat(usos.map((u) => [new Date(u.data).toLocaleString("pt-BR"), u.user_email, NOMES_RECURSO[u.recurso] || u.recurso, u.creditos, FONTES[u.fonte] || u.fonte, (u.valor_excedente || 0).toFixed(2).replace(".", ",")]));
  const csv = "\uFEFF" + linhas.map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Barra({ usado, total, cor = WORK.accent }) {
  const pct = total ? Math.min(100, (usado / total) * 100) : 0;
  return <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E3E8EE" }}><div className="h-full" style={{ width: `${pct}%`, background: pct >= 100 ? "#DC2626" : pct >= 80 ? "#E3A008" : cor }} /></div>;
}

export default function Consumo() {
  const [saldo, setSaldo] = useState(null);
  const [dados, setDados] = useState(null);
  const [periodo, setPeriodo] = useState("atual");
  const [livre, setLivre] = useState(periodos.atual());
  const [aba, setAba] = useState("usuarios");
  const [limite, setLimite] = useState("");
  const [salvando, setSalvando] = useState(false);
  const p = periodo === "livre" ? livre : periodos[periodo]();

  const carregar = useCallback(async (recontar = false) => {
    const [s, c] = await Promise.all([
      recontar ? acaoCreditos("saldo", { recontar: true }) : getSaldoIA(),
      acaoCreditos("consumo", { inicio: p.inicio, fim: p.fim }),
    ]);
    setSaldo(s); setDados(c);
    setLimite((l) => (l === "" ? String(s?.limite_gasto_mensal ?? 0) : l));
  }, [p.inicio, p.fim]);

  useEffect(() => { carregar().catch(() => {}); }, [carregar]);
  // Atualização instantânea: cada uso de IA dispara o evento com o saldo novo
  useEffect(() => {
    const on = () => carregar().catch(() => {});
    window.addEventListener("zela:saldo", on);
    const t = setInterval(on, 60000);
    return () => { window.removeEventListener("zela:saldo", on); clearInterval(t); };
  }, [carregar]);

  const usos = dados?.usos || [];
  const porUsuario = useMemo(() => agrupar(usos, (u) => u.user_email), [usos]);
  const porRecurso = useMemo(() => agrupar(usos, (u) => NOMES_RECURSO[u.recurso] || u.recurso), [usos]);
  const porDia = useMemo(() => agrupar(usos, (u) => new Date(new Date(u.data).getTime() - 4 * 3600000).toISOString().slice(0, 10)).sort((a, b) => a.chave.localeCompare(b.chave)), [usos]);
  const totalCred = usos.reduce((s, u) => s + (u.creditos || 0), 0);
  const totalExc = usos.reduce((s, u) => s + (u.valor_excedente || 0), 0);

  const salvarLimite = async () => {
    setSalvando(true);
    try { await acaoCreditos("config_limite", { limite_gasto_mensal: Number(String(limite).replace(",", ".")) || 0 }); await carregar(); }
    catch (e) { alert(e.message); } finally { setSalvando(false); }
  };

  if (!saldo) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="Consumo e fatura" /><Cartao><Vazio>Carregando…</Vazio></Cartao></div>;
  const porVidas = saldo.modelo_cobranca === "vidas";
  const maxDia = Math.max(1, ...porDia.map((d) => d.creditos));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Consumo e fatura" subtitulo="Transparência total: quanto você paga, por quê, e quem usou cada crédito de IA — atualizado a cada uso.">
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: WORK.border }}>
          <option value="atual">Mês atual</option><option value="anterior">Mês anterior</option><option value="livre">Período livre</option>
        </select>
        {periodo === "livre" && <>
          <Campo tipo="date" valor={livre.inicio} onChange={(v) => setLivre((x) => ({ ...x, inicio: v }))} />
          <Campo tipo="date" valor={livre.fim} onChange={(v) => setLivre((x) => ({ ...x, fim: v }))} />
        </>}
        <Botao onClick={() => carregar(true)}><RefreshCw size={14} /> Atualizar e recontar vidas</Botao>
        <Botao onClick={() => exportarCsv(usos, `consumo_${p.inicio}_${p.fim}.csv`)} disabled={!usos.length}><Download size={14} /> Planilha (CSV)</Botao>
        <Link to={`/consumo/demonstrativo?inicio=${p.inicio}&fim=${p.fim}`} target="_blank"><Botao tipo="primario"><Printer size={14} /> Demonstrativo (PDF)</Botao></Link>
      </Cabecalho>

      {saldo.ilimitado && <Cartao className="mb-4"><p className="text-sm" style={{ color: WORK.text }}><ShieldCheck size={14} className="inline mr-1" style={{ color: "#146C43" }} />Conta de administrador: uso sem limite. Os valores abaixo mostram como seria a cobrança.</p></Cartao>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Indicador rotulo={saldo.modelo_cobranca === "uso" ? "ASOs emitidos no mês" : "Vidas ativas"} valor={saldo.modelo_cobranca === "uso" ? num(saldo.asos_mes) : num(saldo.vidas)} detalhe={saldo.vidas_contratadas ? "vidas contratadas" : `contagem automática${saldo.vidas_contadas_em ? " · " + new Date(saldo.vidas_contadas_em).toLocaleString("pt-BR") : ""}`} />
        {saldo.modelo_cobranca === "uso"
          ? <Indicador rotulo={`Plano ${saldo.plano_uso_nome || ""}`} valor={brl(saldo.valor_mensal)} detalhe={`${num(saldo.mensal)} créditos/mês${saldo.limites?.usuarios ? ` · ${saldo.limites.usuarios} usuário(s)` : ""}`} />
          : <Indicador rotulo="Mensalidade" valor={porVidas ? brl(saldo.valor_mensal) : "Plano"} detalhe={porVidas && saldo.vidas ? `${brl(saldo.preco_medio, 4)} por vida em média` : saldo.plano} />}
        <Indicador rotulo="Excedente no mês" valor={brl(saldo.valor_excedente)} cor={saldo.valor_excedente ? "#8A5A00" : undefined} detalhe={`${num(saldo.excedente_usado)} créditos × ${brl(saldo.preco_excedente)}`} />
        <Indicador rotulo="Fatura estimada do mês" valor={brl(saldo.fatura_estimada)} cor={WORK.accent} detalhe={saldo.modelo_cobranca === "uso" ? `plano + créditos extras + ${num(saldo.asos_mes)} ASO(s) × ${brl(saldo.preco_aso)}` : "mensalidade + excedente"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Cartao titulo="Créditos de IA do mês">
          <div className="flex justify-between text-sm mb-1" style={{ color: WORK.text }}><span>Franquia</span><b>{num(saldo.usados_mes)} de {num(saldo.mensal)} ({saldo.pct_franquia}%)</b></div>
          <Barra usado={saldo.usados_mes} total={saldo.mensal} />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><p className="text-xs" style={{ color: WORK.muted }}>Restam do mês</p><p className="text-lg font-bold" style={{ color: WORK.text }}>{num(saldo.restante_mensal)}</p></div>
            <div><p className="text-xs" style={{ color: WORK.muted }}>Recargas</p><p className="text-lg font-bold" style={{ color: WORK.text }}>{num(saldo.extras)}</p></div>
            <div><p className="text-xs" style={{ color: WORK.muted }}>No limite de gasto</p><p className="text-lg font-bold" style={{ color: WORK.text }}>{num(saldo.excedente_disponivel)}</p></div>
          </div>
          <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Ordem de uso: franquia do mês → recargas (não expiram) → excedente, até o limite de gasto. Alertas por e-mail em 50%, 80% e 100% da franquia.</p>
        </Cartao>

        <Cartao titulo="Limite de gasto (excedente)">
          {saldo.dono ? (
            <>
              <p className="text-sm mb-3" style={{ color: WORK.text }}>Quanto você autoriza gastar por mês <b>além da franquia</b>, a {brl(saldo.preco_excedente)} por crédito. Com R$ 0, a IA pausa quando a franquia e as recargas acabam.</p>
              <div className="flex items-end gap-2">
                <Campo label="Limite mensal (R$)" valor={limite} onChange={setLimite} className="flex-1" />
                <Botao tipo="primario" onClick={salvarLimite} carregando={salvando}><Save size={14} /> Salvar</Botao>
              </div>
              {saldo.limite_gasto_mensal > 0 && <>
                <div className="flex justify-between text-sm mt-3 mb-1" style={{ color: WORK.text }}><span>Usado do limite</span><b>{brl(saldo.valor_excedente)} de {brl(saldo.limite_gasto_mensal)}</b></div>
                <Barra usado={saldo.valor_excedente} total={saldo.limite_gasto_mensal} cor="#E3A008" />
              </>}
              <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>Com {brl(Number(String(limite).replace(",", ".")) || 0)} o excedente permite até {num(Math.floor((Number(String(limite).replace(",", ".")) || 0) / saldo.preco_excedente))} créditos por mês. Alertas por e-mail em 80% e 100% do limite.</p>
            </>
          ) : <p className="text-sm" style={{ color: WORK.muted }}><Info size={14} className="inline mr-1" />Você usa a conta de {dados?.conta_email}. O limite de gasto é definido pelo titular.</p>}
        </Cartao>
      </div>

      {porVidas && saldo.faixas?.length > 0 && (
        <Cartao titulo="Como a mensalidade é calculada" className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: WORK.text }}>
              <thead><tr style={{ color: WORK.muted }} className="text-xs"><th className="text-left p-2">Faixa</th><th className="text-right p-2">Vidas</th><th className="text-right p-2">Preço</th><th className="text-right p-2">Valor</th><th className="text-right p-2">Créditos</th></tr></thead>
              <tbody>
                {saldo.faixas.map((f) => (
                  <tr key={f.de} className="border-t" style={{ borderColor: WORK.border }}>
                    <td className="p-2">{descFaixa(f)}</td><td className="p-2 text-right">{num(f.vidas)}</td>
                    <td className="p-2 text-right">{f.fixo !== null ? "fixo" : `${brl(f.preco)}/vida`}</td><td className="p-2 text-right">{brl(f.valor)}</td><td className="p-2 text-right">{num(f.creditos)}</td>
                  </tr>
                ))}
                <tr className="border-t font-bold" style={{ borderColor: WORK.border }}><td className="p-2">Total</td><td className="p-2 text-right">{num(saldo.vidas)}</td><td className="p-2 text-right">{brl(saldo.preco_medio, 4)} médio</td><td className="p-2 text-right">{brl(saldo.valor_mensal)}</td><td className="p-2 text-right">{num(saldo.mensal)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>Cada faixa cobra apenas as vidas dentro dela (soma progressiva): quanto mais vidas, menor o preço médio, sem saltos entre faixas.</p>
        </Cartao>
      )}

      <Cartao titulo={`Uso de IA no período (${dataBR(p.inicio)} a ${dataBR(p.fim)})`}>
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div><p className="text-xs" style={{ color: WORK.muted }}>Usos</p><p className="text-xl font-bold" style={{ color: WORK.text }}>{num(usos.length)}</p></div>
          <div><p className="text-xs" style={{ color: WORK.muted }}>Créditos</p><p className="text-xl font-bold" style={{ color: WORK.text }}>{num(totalCred)}</p></div>
          <div><p className="text-xs" style={{ color: WORK.muted }}>Excedente</p><p className="text-xl font-bold" style={{ color: WORK.text }}>{brl(totalExc)}</p></div>
        </div>
        {porDia.length > 0 && (
          <div className="flex items-end gap-1 h-24 mb-4 overflow-x-auto">
            {porDia.map((d) => (
              <div key={d.chave} className="flex flex-col items-center justify-end h-full min-w-[22px] flex-1" title={`${dataBR(d.chave)}: ${d.creditos} créditos em ${d.usos} usos`}>
                <div className="w-full rounded-t" style={{ height: `${(d.creditos / maxDia) * 100}%`, minHeight: 2, background: WORK.accent }} />
                <span className="text-[9px] mt-1" style={{ color: WORK.muted }}>{d.chave.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
        <Abas abas={[["usuarios", "Por usuário"], ["recursos", "Por funcionalidade"], ["historico", "Histórico detalhado"]]} aba={aba} setAba={setAba} />
        {usos.length === 0 && <Vazio>Nenhum uso de IA no período.</Vazio>}
        {usos.length > 0 && aba !== "historico" && (
          <table className="w-full text-sm" style={{ color: WORK.text }}>
            <thead><tr className="text-xs" style={{ color: WORK.muted }}><th className="text-left p-2">{aba === "usuarios" ? "Usuário" : "Funcionalidade"}</th><th className="text-right p-2">Usos</th><th className="text-right p-2">Créditos</th><th className="text-right p-2">% do total</th><th className="text-right p-2">Excedente</th></tr></thead>
            <tbody>
              {(aba === "usuarios" ? porUsuario : porRecurso).map((g) => (
                <tr key={g.chave} className="border-t" style={{ borderColor: WORK.border }}>
                  <td className="p-2">{g.chave}</td><td className="p-2 text-right">{num(g.usos)}</td><td className="p-2 text-right">{num(g.creditos)}</td>
                  <td className="p-2 text-right">{totalCred ? Math.round((g.creditos / totalCred) * 100) : 0}%</td><td className="p-2 text-right">{brl(g.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {usos.length > 0 && aba === "historico" && (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-xs" style={{ color: WORK.text }}>
              <thead className="sticky top-0 bg-white"><tr style={{ color: WORK.muted }}><th className="text-left p-2">Data e hora</th><th className="text-left p-2">Usuário</th><th className="text-left p-2">Funcionalidade</th><th className="text-right p-2">Créditos</th><th className="text-left p-2">Origem</th><th className="text-right p-2">Excedente</th></tr></thead>
              <tbody>
                {usos.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: WORK.border }}>
                    <td className="p-2 whitespace-nowrap">{new Date(u.data).toLocaleString("pt-BR")}</td><td className="p-2">{u.user_email}</td><td className="p-2">{NOMES_RECURSO[u.recurso] || u.recurso}</td>
                    <td className="p-2 text-right">{u.creditos}</td><td className="p-2"><Etiqueta cor={u.fonte === "excedente" || u.fonte === "misto" ? "#8A5A00" : "#5F6368"}>{FONTES[u.fonte] || u.fonte}</Etiqueta></td>
                    <td className="p-2 text-right">{u.valor_excedente ? brl(u.valor_excedente) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!dados?.dono && <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>Você vê apenas o seu próprio consumo. O titular da conta vê o consumo de toda a equipe.</p>}
      </Cartao>
    </div>
  );
}
