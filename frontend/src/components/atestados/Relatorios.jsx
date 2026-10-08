import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Printer, Pencil, Trash2, Sparkles } from "lucide-react";
import { WORK } from "@/lib/sst";
import { perfilEpidemiologico, periodoPadrao } from "@/lib/epidemiologia";
import { dataBR } from "@/lib/afastamentos";
import { invokeAI } from "@/lib/ai";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";

export const TIPOS_RELATORIO = {
  epidemiologico: { label: "Perfil epidemiológico e absenteísmo (técnico)", desc: "Completo, com CID e reincidentes. Uso do SESMT / médico do trabalho." },
  gestor: { label: "Relatório de absenteísmo para a gestão", desc: "Sem CID e sem nomes; grupos pequenos são agregados (LGPD)." },
  analitico_pcmso: { label: "Relatório analítico do PCMSO (NR-7)", desc: "Dados epidemiológicos e exames do PCMSO para discussão anual." },
};

// Resumo sem identificação pessoal para enviar à IA
export function resumoParaIA(perfil, empresa) {
  const tira = (l) => l.slice(0, 8).map(({ chave, atestados, dias, pessoas }) => ({ grupo: chave, atestados, dias, pessoas }));
  return {
    empresa: { cnae: empresa.cnae, atividade: empresa.setor_descricao, grau_risco: empresa.grau_de_risco },
    periodo: { inicio: perfil.inicio, fim: perfil.fim, dias: perfil.dias_periodo }, efetivo: perfil.efetivo, setor: perfil.setor,
    indicadores: perfil.indicadores, capitulos: tira(perfil.por_capitulo), cids: tira(perfil.por_cid), setores: tira(perfil.por_setor),
    cargos: tira(perfil.por_cargo), sexo: tira(perfil.por_sexo), faixa: tira(perfil.por_faixa), natureza: tira(perfil.por_motivo),
    duracao: tira(perfil.por_duracao), meses: perfil.meses.map((m) => ({ mes: m.mes, dias: m.dias })), reincidentes: perfil.reincidentes.length,
    alertas: perfil.alertas,
  };
}

function Editor({ rel, setRel, d, onFechar, recarregar }) {
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const set = (k, v) => setRel((r) => ({ ...r, [k]: v }));
  const an = rel.analise || {};
  const setAn = (k, v) => set("analise", { ...an, [k]: v });

  const ia = async () => {
    setGerando(true);
    try {
      const perfil = perfilEpidemiologico({ ...d, inicio: rel.inicio, fim: rel.fim, setorId: rel.setor_id || "" });
      const r = await invokeAI("relatorio_saude", {
        prompt: `Você é médico do trabalho no Brasil. Analise os dados agregados de absenteísmo e morbidade abaixo (${TIPOS_RELATORIO[rel.tipo].label}) e redija uma análise técnica objetiva, em português formal.
Relacione os achados com os riscos ocupacionais prováveis da atividade (NR-1/GRO, NR-7, NR-17), aponte grupos e setores prioritários, tendência mensal e possíveis nexos com o trabalho, sem afirmar nexo causal individual.
Não cite médias nacionais nem números que não estejam nos dados. ${rel.tipo === "gestor" ? "O público é a gestão da empresa: NÃO mencione códigos CID nem diagnósticos específicos; fale de grupos amplos e ações de gestão." : ""}
Dados: ${JSON.stringify(rel.tipo === "gestor" ? { ...resumoParaIA(perfil, d.empresa), cids: undefined } : resumoParaIA(perfil, d.empresa))}`,
        response_json_schema: {
          type: "object",
          properties: { sintese: { type: "string" }, achados: { type: "array", items: { type: "string" } }, recomendacoes: { type: "array", items: { type: "string" } }, conclusao: { type: "string" } },
        },
      });
      set("analise", { sintese: r?.sintese || "", achados: (r?.achados || []).join("\n"), recomendacoes: (r?.recomendacoes || []).join("\n"), conclusao: r?.conclusao || "" });
    } catch (e) { erroMsg(e); } finally { setGerando(false); }
  };

  const salvar = async () => {
    if (!rel.inicio || !rel.fim || rel.fim < rel.inicio) return alert("Período inválido.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dd } = rel; // eslint-disable-line no-unused-vars
      if (id) await base44.entities.RelatorioSaude.update(id, dd);
      else { const n = await base44.entities.RelatorioSaude.create({ ...dd, company_id: d.empresa.id }); setRel(n); }
      recarregar();
      onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };

  return (
    <Modal aberto onFechar={onFechar} titulo={rel.id ? "Editar relatório" : "Novo relatório"} largura="max-w-3xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="space-y-3">
        <Campo label="Tipo" tipo="select" opcoes={Object.fromEntries(Object.entries(TIPOS_RELATORIO).map(([k, v]) => [k, v.label]))} valor={rel.tipo} onChange={(v) => set("tipo", v || "epidemiologico")} />
        <p className="text-xs -mt-2" style={{ color: WORK.muted }}>{TIPOS_RELATORIO[rel.tipo]?.desc}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Campo label="De" tipo="date" valor={rel.inicio} onChange={(v) => set("inicio", v)} />
          <Campo label="Até" tipo="date" valor={rel.fim} onChange={(v) => set("fim", v)} />
          <Campo label="Setor" tipo="select" opcoes={Object.fromEntries(d.setores.map((s) => [s.id, s.nome]))} valor={rel.setor_id} onChange={(v) => set("setor_id", v)} />
          <Campo label="Responsável" valor={rel.responsavel?.nome} onChange={(v) => set("responsavel", { ...(rel.responsavel || {}), nome: v })} className="md:col-span-2" />
          <Campo label="Registro (CRM/CREA/MTE)" valor={rel.responsavel?.registro} onChange={(v) => set("responsavel", { ...(rel.responsavel || {}), registro: v })} />
        </div>
        <div className="border-t pt-3" style={{ borderColor: WORK.border }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: WORK.text }}>Análise técnica</span>
            <Botao onClick={ia} carregando={gerando} title="3 créditos — a IA recebe só dados agregados, sem nomes"><Sparkles size={14} /> Redigir com IA</Botao>
          </div>
          <div className="space-y-2">
            <Campo label="Síntese" tipo="textarea" linhas={3} valor={an.sintese} onChange={(v) => setAn("sintese", v)} />
            <Campo label="Principais achados (um por linha)" tipo="textarea" linhas={4} valor={an.achados} onChange={(v) => setAn("achados", v)} />
            <Campo label="Recomendações (uma por linha)" tipo="textarea" linhas={4} valor={an.recomendacoes} onChange={(v) => setAn("recomendacoes", v)} />
            <Campo label="Conclusão" tipo="textarea" linhas={3} valor={an.conclusao} onChange={(v) => setAn("conclusao", v)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function Relatorios({ d }) {
  const [lista, setLista] = useState([]);
  const [edit, setEdit] = useState(null);
  const carregar = useCallback(() => {
    base44.entities.RelatorioSaude.filter({ company_id: d.empresa.id }, "-created_date", 100).then(setLista).catch(() => setLista([]));
  }, [d.empresa.id]);
  useEffect(() => { carregar(); }, [carregar]);

  const novo = (tipo) => setEdit({ tipo, ...periodoPadrao(tipo === "analitico_pcmso" ? "ano_anterior" : "12m"), setor_id: "", analise: {} });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {Object.entries(TIPOS_RELATORIO).map(([k, v]) => (
          <button key={k} onClick={() => novo(k)} className="rounded-lg border p-4 text-left" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: WORK.text }}><Plus size={14} style={{ color: WORK.accent }} /> {v.label}</p>
            <p className="text-xs mt-1" style={{ color: WORK.muted }}>{v.desc}</p>
          </button>
        ))}
      </div>
      <Cartao titulo={`Relatórios salvos (${lista.length})`}>
        {lista.length === 0 && <Vazio>Nenhum relatório. Escolha um tipo acima.</Vazio>}
        <div className="space-y-2">
          {lista.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
              <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                <b>{TIPOS_RELATORIO[r.tipo]?.label}</b>
                <span style={{ color: WORK.muted }}> · {dataBR(r.inicio)} a {dataBR(r.fim)}{r.setor_id ? ` · ${d.setores.find((s) => s.id === r.setor_id)?.nome || ""}` : ""}</span>
              </div>
              {r.analise?.sintese ? <Etiqueta cor="#22C55E">com análise</Etiqueta> : <Etiqueta cor="#94A3B8">sem análise</Etiqueta>}
              <Link to={`/atestados/relatorio?id=${r.id}`} target="_blank"><Botao><Printer size={14} /> PDF</Botao></Link>
              <button onClick={() => setEdit({ ...r })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
              <button onClick={async () => { if (confirm("Excluir relatório?")) { await base44.entities.RelatorioSaude.delete(r.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </Cartao>
      {edit && <Editor rel={edit} setRel={setEdit} d={d} onFechar={() => setEdit(null)} recarregar={carregar} />}
    </div>
  );
}
