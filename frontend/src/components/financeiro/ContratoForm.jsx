import React, { useState } from "react";
import { Modal, Campo, Botao } from "@/components/programas/ui";
import { base44 } from "@/api/base44Client";

export default function ContratoForm({ onClose, onSaved, editando, companies }) {
  const [form, setForm] = useState(editando || {
    company_id: "", valor_base: "", limite_incluido: 0, valor_excedente_unitario: 0,
    unidade_excedente: "vidas", vigencia_inicio: "", vigencia_fim: "", status: "ativo", observacao: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.valor_base) { alert("Informe empresa e mensalidade base."); return; }
    setSaving(true);
    try {
      if (editando?.id) await base44.entities.ContratoCliente.update(editando.id, form);
      else await base44.entities.ContratoCliente.create(form);
      onSaved();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const opcoesEmpresa = Object.fromEntries((companies || []).map((c) => [c.id, c.razao_social]));

  return (
    <Modal titulo={editando ? "Editar contrato" : "Novo contrato"} aberto onFechar={onClose}
      rodape={<><Botao onClick={onClose}>Cancelar</Botao><Botao tipo="primario" onClick={submit} carregando={saving}>Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Empresa-cliente *" tipo="select" opcoes={opcoesEmpresa} valor={form.company_id} onChange={(v) => set("company_id", v)} />
        <Campo label="Mensalidade base (R$) *" tipo="number" valor={form.valor_base} onChange={(v) => set("valor_base", v)} />
        <Campo label="Limite incluído" tipo="number" valor={form.limite_incluido} onChange={(v) => set("limite_incluido", v)} />
        <Campo label="Valor por excedente (R$)" tipo="number" valor={form.valor_excedente_unitario} onChange={(v) => set("valor_excedente_unitario", v)} />
        <Campo label="Unidade do excedente" tipo="select" opcoes={{ vidas: "Vidas", exames: "Exames" }} valor={form.unidade_excedente} onChange={(v) => set("unidade_excedente", v)} />
        <Campo label="Status" tipo="select" opcoes={{ ativo: "Ativo", encerrado: "Encerrado" }} valor={form.status} onChange={(v) => set("status", v)} />
        <Campo label="Início vigência" tipo="date" valor={form.vigencia_inicio} onChange={(v) => set("vigencia_inicio", v)} />
        <Campo label="Fim vigência" tipo="date" valor={form.vigencia_fim} onChange={(v) => set("vigencia_fim", v)} />
        <div className="md:col-span-2"><Campo label="Observação" tipo="textarea" valor={form.observacao} onChange={(v) => set("observacao", v)} /></div>
      </div>
    </Modal>
  );
}