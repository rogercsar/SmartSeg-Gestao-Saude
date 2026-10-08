import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { WORK } from "@/lib/sst";
import { brl } from "@/lib/precos";
import { Botao, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";

const mesAnterior = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };

// Fechamento mensal da cobrança por uso: prévia e emissão das cobranças de créditos extras + ASOs
export default function FechamentoUso() {
  const [ciclo, setCiclo] = useState(mesAnterior());
  const [res, setRes] = useState(null);
  const [rodando, setRodando] = useState(false);
  const chamar = async (action) => {
    setRodando(true);
    try { const r = await base44.functions.invoke("faturamento", { action, ciclo }); setRes(r.data); }
    catch (e) { alert(e?.data?.mensagem || e.message); } finally { setRodando(false); }
  };
  return (
    <Cartao titulo="Fechamento do mês — cobrança pelo uso" className="mt-4">
      <p className="text-xs mb-3" style={{ color: WORK.muted }}>Calcula, para cada assinatura ativa, os créditos de IA usados além do plano e os ASOs emitidos no mês, e gera uma cobrança avulsa no gateway (vencimento em 5 dias). Cada mês é cobrado uma única vez. Faça primeiro a prévia.</p>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <label className="text-xs" style={{ color: WORK.muted }}>Mês<input type="month" value={ciclo} onChange={(e) => setCiclo(e.target.value)} className="block px-2 py-1.5 rounded border text-sm" style={{ borderColor: WORK.border }} /></label>
        <Botao onClick={() => chamar("previa")} carregando={rodando}>Prévia</Botao>
        <Botao tipo="primario" onClick={() => { if (confirm(`Gerar as cobranças de uso de ${ciclo.split("-").reverse().join("/")}?`)) chamar("cobrar"); }} carregando={rodando} disabled={!res}>Gerar cobranças</Botao>
      </div>
      {!res && <Vazio>Escolha o mês e clique em Prévia.</Vazio>}
      {res && (
        <>
          {!res.gateway_configurado && <p className="text-xs mb-2" style={{ color: "#8A5A00" }}>Gateway não configurado: as cobranças ficam só registradas para emissão manual.</p>}
          <p className="text-sm mb-2" style={{ color: WORK.text }}>Total do mês: <b>{brl(res.total)}</b></p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: WORK.text }}>
              <thead><tr style={{ color: WORK.muted }}><th className="text-left p-2">Cliente</th><th className="p-2">Plano</th><th className="p-2 text-right">Créditos extras</th><th className="p-2 text-right">ASOs</th><th className="p-2 text-right">Total</th><th className="p-2 text-left">Situação</th></tr></thead>
              <tbody>
                {res.linhas.map((l) => (
                  <tr key={l.assinatura_id} className="border-t" style={{ borderColor: WORK.border }}>
                    <td className="p-2">{l.empresa}<span className="block" style={{ color: WORK.muted }}>{l.email}</span></td><td className="p-2 text-center">{l.plano || "—"}</td>
                    <td className="p-2 text-right">{l.creditos_excedentes} · {brl(l.valor_excedente)}</td><td className="p-2 text-right">{l.asos} · {brl(l.valor_asos)}</td>
                    <td className="p-2 text-right"><b>{brl(l.total)}</b></td><td className="p-2"><Etiqueta cor={/cobrado/.test(l.situacao) ? "#146C43" : /erro/.test(l.situacao) ? "#B42318" : "#5F6368"}>{l.situacao}</Etiqueta></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Cartao>
  );
}
