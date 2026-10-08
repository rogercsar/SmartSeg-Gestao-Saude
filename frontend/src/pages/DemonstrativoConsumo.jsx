import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { acaoCreditos, getSaldoIA } from "@/lib/ai";
import { LOGO_SMARTSEG } from "@/lib/marca";
import { brl, num, descFaixa, NOMES_RECURSO } from "@/lib/precos";
import { dataBR } from "@/lib/sstGestao";
import { agrupar } from "@/pages/Consumo";

const CSS = `
@page { size: A4; margin: 14mm 12mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; max-width: 190mm; margin: 0 auto; padding: 16px; }
.topo { display:flex; align-items:center; gap:14px; border-bottom: 3px solid #0B6FA8; padding-bottom: 8px; margin-bottom: 12px }
.topo img { height: 56px } .topo h1 { font-size: 15pt; margin: 0; color:#0B6FA8 }
h2 { font-size: 11.5pt; color: #0B6FA8; margin: 16px 0 6px }
table { width: 100%; border-collapse: collapse; font-size: 9pt } th, td { border: 1px solid #bbb; padding: 4px 6px; text-align: left } th { background: #EAF4F8 } .r { text-align: right }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px } .card { border: 1px solid #ccc; border-radius: 6px; padding: 6px 8px } .card b { display:block; font-size: 13pt } .card span { font-size: 8pt; color:#555 }
.total { background: #EAF4F8; font-weight: bold }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #fff; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra { display: none } .doc { padding: 0 } }
`;
const FONTES = { mensal: "Franquia", extra: "Recarga", excedente: "Excedente", misto: "Franquia + excedente", gratuito: "Gratuito", ilimitado: "Ilimitado" };

export default function DemonstrativoConsumo() {
  const [params] = useSearchParams();
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([getSaldoIA(), acaoCreditos("consumo", { inicio: params.get("inicio"), fim: params.get("fim") })]).then(([s, c]) => setD({ s, c })).catch(() => setD(false));
  }, [params]);
  if (d === false) return <div style={{ padding: 40 }}>Não foi possível gerar o demonstrativo.</div>;
  if (!d) return <div style={{ padding: 40, color: "#5F6368" }}>Gerando demonstrativo…</div>;
  const { s, c } = d;
  const usos = c.usos || [];
  const porUsuario = agrupar(usos, (u) => u.user_email);
  const porRecurso = agrupar(usos, (u) => NOMES_RECURSO[u.recurso] || u.recurso);
  const totalCred = usos.reduce((a, u) => a + (u.creditos || 0), 0);
  const totalExc = usos.reduce((a, u) => a + (u.valor_excedente || 0), 0);

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <div className="topo"><img src={LOGO_SMARTSEG} alt="SmartSeg" /><div><h1>Demonstrativo de consumo</h1><div>Conta: {c.conta_email} · Período: {dataBR(c.inicio)} a {dataBR(c.fim)} · Emitido em {new Date().toLocaleString("pt-BR")}</div></div></div>

        <h2>1. Resumo do mês corrente</h2>
        <div className="cards">
          <div className="card">Vidas ativas<b>{num(s.vidas)}</b><span>{s.vidas_contratadas ? "contratadas" : "contagem automática"}</span></div>
          <div className="card">Mensalidade<b>{s.modelo_cobranca === "vidas" ? brl(s.valor_mensal) : "Plano"}</b><span>{s.vidas ? `${brl(s.preco_medio, 4)}/vida (média)` : ""}</span></div>
          <div className="card">Excedente<b>{brl(s.valor_excedente)}</b><span>{num(s.excedente_usado)} créditos × {brl(s.preco_excedente)}</span></div>
          <div className="card">Fatura estimada<b>{brl(s.fatura_estimada)}</b><span>limite de gasto: {brl(s.limite_gasto_mensal)}</span></div>
        </div>
        <p style={{ fontSize: "9pt" }}>Créditos de IA: {num(s.usados_mes)} de {num(s.mensal)} da franquia usados ({s.pct_franquia}%) · recargas disponíveis: {num(s.extras)} · disponível no limite de gasto: {num(s.excedente_disponivel)}.</p>

        {s.modelo_cobranca === "vidas" && s.faixas?.length > 0 && (<>
          <h2>2. Cálculo da mensalidade (faixas progressivas)</h2>
          <table><thead><tr><th>Faixa</th><th className="r">Vidas</th><th className="r">Preço</th><th className="r">Valor</th><th className="r">Créditos incluídos</th></tr></thead>
            <tbody>
              {s.faixas.map((f) => <tr key={f.de}><td>{descFaixa(f)}</td><td className="r">{num(f.vidas)}</td><td className="r">{f.fixo !== null ? "fixo" : `${brl(f.preco)}/vida`}</td><td className="r">{brl(f.valor)}</td><td className="r">{num(f.creditos)}</td></tr>)}
              <tr className="total"><td>Total</td><td className="r">{num(s.vidas)}</td><td className="r">{brl(s.preco_medio, 4)} médio</td><td className="r">{brl(s.valor_mensal)}</td><td className="r">{num(s.mensal)}</td></tr>
            </tbody></table>
        </>)}

        <h2>3. Consumo no período — por usuário</h2>
        <table><thead><tr><th>Usuário</th><th className="r">Usos</th><th className="r">Créditos</th><th className="r">% do total</th><th className="r">Excedente</th></tr></thead>
          <tbody>
            {porUsuario.map((g) => <tr key={g.chave}><td>{g.chave}</td><td className="r">{num(g.usos)}</td><td className="r">{num(g.creditos)}</td><td className="r">{totalCred ? Math.round((g.creditos / totalCred) * 100) : 0}%</td><td className="r">{brl(g.valor)}</td></tr>)}
            <tr className="total"><td>Total</td><td className="r">{num(usos.length)}</td><td className="r">{num(totalCred)}</td><td className="r">100%</td><td className="r">{brl(totalExc)}</td></tr>
          </tbody></table>

        <h2>4. Consumo no período — por funcionalidade</h2>
        <table><thead><tr><th>Funcionalidade</th><th className="r">Usos</th><th className="r">Créditos</th><th className="r">Excedente</th></tr></thead>
          <tbody>{porRecurso.map((g) => <tr key={g.chave}><td>{g.chave}</td><td className="r">{num(g.usos)}</td><td className="r">{num(g.creditos)}</td><td className="r">{brl(g.valor)}</td></tr>)}</tbody></table>

        <h2>5. Histórico detalhado</h2>
        <table><thead><tr><th>Data e hora</th><th>Usuário</th><th>Funcionalidade</th><th className="r">Créditos</th><th>Origem</th><th className="r">Excedente</th></tr></thead>
          <tbody>
            {usos.length === 0 && <tr><td colSpan={6}>Nenhum uso no período.</td></tr>}
            {usos.map((u) => <tr key={u.id}><td>{new Date(u.data).toLocaleString("pt-BR")}</td><td>{u.user_email}</td><td>{NOMES_RECURSO[u.recurso] || u.recurso}</td><td className="r">{u.creditos}</td><td>{FONTES[u.fonte] || u.fonte}</td><td className="r">{u.valor_excedente ? brl(u.valor_excedente) : "—"}</td></tr>)}
          </tbody></table>
        <p style={{ fontSize: "8pt", color: "#555", marginTop: 10 }}>Regras: a mensalidade é calculada por faixas progressivas de vidas ativas; cada faixa inclui créditos de IA. O consumo usa primeiro a franquia do mês, depois as recargas (que não expiram) e, por fim, o excedente, cobrado a {brl(s.preco_excedente)} por crédito e limitado ao limite de gasto definido pelo titular. Recursos de acolhimento (Canal de escuta) não consomem créditos.</p>
      </div>
    </div>
);
}
