import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Sparkles, ChevronDown } from "lucide-react";
import { WORK } from "@/lib/sst";
import { MOTIVOS, fimAfastamento, dataBR, addDias } from "@/lib/afastamentos";
import { uploadPrivado } from "@/lib/privateFiles";
import { invokeAIArquivo } from "@/lib/ai";
import { Botao, Campo, Modal, erroMsg } from "@/components/programas/ui";
import ComboboxCodigoEsocial from "@/components/esocial/ComboboxCodigoEsocial";

const hoje = () => new Date().toISOString().slice(0, 10);
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Cadastro rápido: foto do atestado -> IA preenche -> confere -> salva
export default function NovoAtestado({ inicial, empresa, trabalhadores, cats, onFechar, aoSalvar }) {
  const [a, setA] = useState(inicial || { data_inicio: hoje(), dias: 1, motivo: "doenca", mesma_doenca_manual: "auto" });
  const [lendo, setLendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [detalhes, setDetalhes] = useState(!!inicial?.id);
  const set = (k, v) => setA((x) => ({ ...x, [k]: v }));

  const escolherTrab = (nome) => {
    const t = trabalhadores.find((x) => norm(x.nome) === norm(nome));
    setA((x) => ({ ...x, trabalhador_nome: nome, trabalhador_id: t?.id || "" }));
  };

  const lerArquivo = async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setLendo(true);
    try {
      const { file_uri } = await uploadPrivado(f);
      set("arquivo_uri", file_uri);
      const r = await invokeAIArquivo("atestado_leitura", file_uri, f.type, {
        prompt: "Leia este atestado médico brasileiro e extraia os dados. Datas no formato AAAA-MM-DD. 'dias' = quantidade de dias de afastamento concedidos (se o atestado indicar horas ou apenas comparecimento, dias = 0). Se um campo não estiver legível ou não existir, deixe vazio. Não invente CID.",
        response_json_schema: {
          type: "object",
          properties: {
            paciente: { type: "string" }, data_inicio: { type: "string" }, dias: { type: "number" }, cid: { type: "string" },
            medico_nome: { type: "string" }, crm: { type: "string" }, crm_uf: { type: "string" }, comparecimento: { type: "boolean" },
          },
        },
      });
      if (r) {
        const t = r.paciente ? trabalhadores.find((x) => norm(x.nome) === norm(r.paciente)) || trabalhadores.find((x) => norm(x.nome).includes(norm(r.paciente).split(" ")[0]) && norm(x.nome).split(" ").pop() === norm(r.paciente).split(" ").pop()) : null;
        setA((x) => ({
          ...x,
          trabalhador_nome: t?.nome || r.paciente || x.trabalhador_nome,
          trabalhador_id: t?.id || x.trabalhador_id || "",
          data_inicio: /^\d{4}-\d{2}-\d{2}$/.test(r.data_inicio || "") ? r.data_inicio : x.data_inicio,
          dias: r.dias > 0 ? r.dias : x.dias,
          cid: r.cid || x.cid,
          medico_nome: r.medico_nome || x.medico_nome,
          crm: r.crm || x.crm,
          crm_uf: r.crm_uf || x.crm_uf,
        }));
        if (r.comparecimento || r.dias === 0) alert("Parece ser declaração de comparecimento (horas), não afastamento em dias. Confira antes de salvar.");
      }
    } catch (e) { erroMsg(e); } finally { setLendo(false); ev.target.value = ""; }
  };

  const salvar = async () => {
    if (!a.trabalhador_nome?.trim()) return alert("Informe o colaborador.");
    if (!a.data_inicio || !(Number(a.dias) > 0)) return alert("Informe a data de início e os dias.");
    setSalvando(true);
    try {
      let trabalhador_id = a.trabalhador_id;
      if (!trabalhador_id) {
        const t = await base44.entities.Trabalhador.create({ company_id: empresa.id, nome: a.trabalhador_nome.trim() });
        trabalhador_id = t.id;
      }
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = { ...a, trabalhador_id, dias: Number(a.dias), cid: (a.cid || "").toUpperCase().trim() }; // eslint-disable-line no-unused-vars
      if (id) await base44.entities.Atestado.update(id, d);
      else await base44.entities.Atestado.create({ ...d, company_id: empresa.id, esocial_status: "pendente" });
      aoSalvar();
      onFechar();
    } catch (e) { alert("Erro ao salvar: " + (e?.message || "")); } finally { setSalvando(false); }
  };

  return (
    <Modal aberto onFechar={onFechar} titulo={a.id ? "Editar atestado" : "Novo atestado"} largura="max-w-xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="space-y-3">
        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed cursor-pointer text-sm"
          style={{ borderColor: WORK.accent, color: WORK.accent }}>
          {lendo ? <><Sparkles size={16} className="animate-pulse" /> Lendo o atestado…</> : <><Camera size={16} /> {a.arquivo_uri ? "Trocar foto/PDF do atestado" : "Foto ou PDF do atestado — a IA preenche (1 crédito)"}</>}
          <input type="file" accept="image/*,application/pdf" hidden onChange={lerArquivo} disabled={lendo} />
        </label>

        <label className="block">
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Colaborador *</span>
          <input list="lista-trab" value={a.trabalhador_nome || ""} onChange={(e) => escolherTrab(e.target.value)} placeholder="Digite o nome"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} />
          <datalist id="lista-trab">{trabalhadores.map((t) => <option key={t.id} value={t.nome} />)}</datalist>
          {a.trabalhador_nome && !a.trabalhador_id && <span className="text-[11px]" style={{ color: WORK.muted }}>Novo colaborador — será cadastrado automaticamente.</span>}
        </label>

        <div className="grid grid-cols-3 gap-2">
          <Campo label="Início *" tipo="date" valor={a.data_inicio} onChange={(v) => set("data_inicio", v)} className="col-span-2" />
          <Campo label="Dias *" tipo="number" valor={a.dias} onChange={(v) => set("dias", v)} />
        </div>
        {a.data_inicio && Number(a.dias) > 0 && <p className="text-[11px] -mt-2" style={{ color: WORK.muted }}>Retorno previsto: {dataBR(addDias(fimAfastamento(a), 1))}</p>}

        <div className="flex flex-wrap gap-2">
          {Object.entries(MOTIVOS).map(([k, v]) => (
            <button key={k} onClick={() => set("motivo", k)} className="px-3 py-1.5 rounded-full text-xs border"
              style={{ borderColor: a.motivo === k ? WORK.accent : WORK.border, color: a.motivo === k ? WORK.accent : WORK.muted }}>{v.label}</button>
          ))}
        </div>

        <div>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Motivo de afastamento (Tabela 18 eSocial)</span>
          <ComboboxCodigoEsocial tabela="motivo_afastamento" value={a.codigo_afastamento_esocial || ""} onChange={(v) => set("codigo_afastamento_esocial", v)} placeholder="Selecionar motivo de afastamento..." />
        </div>

        <Campo label="CID (opcional, mas necessário para somar atestados da mesma doença)" valor={a.cid} onChange={(v) => set("cid", v)} placeholder="ex.: M54.5" />

        <button onClick={() => setDetalhes(!detalhes)} className="flex items-center gap-1 text-xs" style={{ color: WORK.muted }}>
          <ChevronDown size={14} style={{ transform: detalhes ? "rotate(180deg)" : "none" }} /> Mais detalhes (médico, CAT, INSS)
        </button>
        {detalhes && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Campo label="Médico" valor={a.medico_nome} onChange={(v) => set("medico_nome", v)} className="md:col-span-3" />
            <Campo label="CRM" valor={a.crm} onChange={(v) => set("crm", v)} />
            <Campo label="UF" valor={a.crm_uf} onChange={(v) => set("crm_uf", v)} />
            <Campo label="Benefício INSS" tipo="select" opcoes={{ aguardando: "Aguardando perícia", b31: "B31 (previdenciário)", b91: "B91 (acidentário)", indeferido: "Indeferido" }} valor={a.beneficio_inss} onChange={(v) => set("beneficio_inss", v)} />
            {["trabalho", "trajeto"].includes(a.motivo) && (
              <Campo label="CAT vinculada" tipo="select" className="md:col-span-3"
                opcoes={Object.fromEntries(cats.map((c) => [c.id, `${(c.data_hora || "").slice(0, 10)} — ${(c.descricao || "").slice(0, 50)}`]))} valor={a.cat_id} onChange={(v) => set("cat_id", v)} />
            )}
            <Campo label="Mesma doença de atestado anterior" tipo="select" className="md:col-span-2" opcoes={{ auto: "Automático (pelo CID)", sim: "Sim, forçar", nao: "Não" }} valor={a.mesma_doenca_manual || "auto"} onChange={(v) => set("mesma_doenca_manual", v || "auto")} />
            <Campo label="Retorno efetivo" tipo="date" valor={a.data_retorno} onChange={(v) => set("data_retorno", v)} />
            <Campo label="Observações" tipo="textarea" linhas={2} valor={a.observacoes} onChange={(v) => set("observacoes", v)} className="md:col-span-3" />
          </div>
        )}
      </div>
    </Modal>
  );
}