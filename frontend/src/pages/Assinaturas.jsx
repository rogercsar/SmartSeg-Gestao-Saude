import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ExternalLink, Copy } from "lucide-react";
import { WORK } from "@/lib/sst";
import { brl } from "@/lib/precos";
import { Botao, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { Cabecalho, Indicador } from "@/components/sst/useEmpresa";
import FechamentoUso from "@/components/FechamentoUso";
import ViabilidadeUso from "@/components/ViabilidadeUso";

const STATUS = {
  lead: ["Cadastro (sem pagamento online)", "#5F6368"], pendente_pagamento: ["Aguardando pagamento", "#8A5A00"], ativa: ["Ativa", "#146C43"],
  inadimplente: ["Inadimplente", "#B42318"], suspensa: ["Suspensa (somente leitura)", "#B42318"], cancelada: ["Cancelada", "#5F6368"],
};
const LINK_CONTRATACAO = "https://zela-work-care.base44.app/api/apps/6ab51b5efe53d6829e11b8bc/functions/assinar";

// Painel do dono do produto: todas as assinaturas do SmartSeg
export default function Assinaturas() {
  const { user } = useAuth();
  const [lista, setLista] = useState(null);
  const [eventos, setEventos] = useState([]);
  useEffect(() => {
    base44.entities.Assinatura.list("-created_date", 1000).then(setLista).catch(() => setLista([]));
    base44.entities.EventoPagamento.list("-created_date", 50).then(setEventos).catch(() => {});
  }, []);
  if (user?.role !== "admin") return <div className="p-8"><Vazio>Área restrita ao administrador do SmartSeg.</Vazio></div>;
  if (!lista) return <div className="p-8"><Vazio>Carregando…</Vazio></div>;
  const ativas = lista.filter((a) => a.status === "ativa");
  const mrr = ativas.reduce((s, a) => s + (a.valor_mensal || 0), 0);
  const inad = lista.filter((a) => ["inadimplente", "suspensa"].includes(a.status));
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Assinaturas do SmartSeg" subtitulo="Clientes que contrataram pelo site, situação de pagamento e eventos recebidos do gateway.">
        <Botao onClick={() => { navigator.clipboard.writeText(LINK_CONTRATACAO); alert("Link da página de contratação copiado."); }}><Copy size={14} /> Link de contratação</Botao>
        <a href={LINK_CONTRATACAO} target="_blank" rel="noreferrer"><Botao><ExternalLink size={14} /> Abrir página</Botao></a>
      </Cabecalho>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Indicador rotulo="Assinaturas ativas" valor={ativas.length} cor="#146C43" />
        <Indicador rotulo="Receita mensal recorrente" valor={brl(mrr)} />
        <Indicador rotulo="Inadimplentes / suspensas" valor={inad.length} cor={inad.length ? "#B42318" : "#146C43"} />
        <Indicador rotulo="Aguardando pagamento" valor={lista.filter((a) => ["pendente_pagamento", "lead"].includes(a.status)).length} />
      </div>
      <Cartao titulo={`Assinaturas (${lista.length})`}>
        {lista.length === 0 && <Vazio>Nenhuma contratação ainda.</Vazio>}
        <div className="overflow-x-auto">
          {lista.length > 0 && (
            <table className="w-full text-xs" style={{ color: WORK.text }}>
              <thead><tr style={{ color: WORK.muted }}><th className="p-2 text-left">Cliente</th><th className="p-2 text-left">Contato</th><th className="p-2 text-right">Vidas</th><th className="p-2 text-right">Mensal</th><th className="p-2 text-left">Situação</th><th className="p-2 text-left">Último pagamento</th><th className="p-2 text-left">Organização</th></tr></thead>
              <tbody>
                {lista.map((a) => (
                  <tr key={a.id} className="border-t" style={{ borderColor: WORK.border }}>
                    <td className="p-2"><b>{a.empresa}</b><span className="block" style={{ color: WORK.muted }}>{a.titular_nome}</span></td>
                    <td className="p-2">{a.titular_email}<span className="block" style={{ color: WORK.muted }}>{a.telefone}</span></td>
                    <td className="p-2 text-right">{a.vidas_declaradas}</td><td className="p-2 text-right">{brl(a.valor_mensal)}</td>
                    <td className="p-2"><Etiqueta cor={STATUS[a.status]?.[1]}>{STATUS[a.status]?.[0] || a.status}</Etiqueta>{a.inadimplente_desde && <span className="block" style={{ color: "#B42318" }}>desde {a.inadimplente_desde.split("-").reverse().join("/")}</span>}</td>
                    <td className="p-2">{a.ultimo_pagamento_em ? new Date(a.ultimo_pagamento_em).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="p-2">{a.org_id ? "vinculada" : "aguardando 1º acesso"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Cartao>
      <Cartao titulo="Últimos eventos do gateway">
        {eventos.length === 0 && <Vazio>Nenhum evento recebido.</Vazio>}
        {eventos.map((e) => <p key={e.id} className="text-xs" style={{ color: WORK.text }}>{new Date(e.created_date).toLocaleString("pt-BR")} · <b>{e.tipo}</b> · {e.resumo?.valor != null ? brl(e.resumo.valor) : ""} {e.assinatura_id ? "" : "· sem assinatura vinculada"}</p>)}
      </Cartao>
      <FechamentoUso />
      <ViabilidadeUso />
    </div>
  );
}