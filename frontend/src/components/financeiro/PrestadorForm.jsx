import React, { useState } from "react";
import { Modal, Campo, Botao } from "@/components/programas/ui";
import { base44 } from "@/api/base44Client";

export default function PrestadorForm({ onClose, onSaved, editando }) {
  const [form, setForm] = useState(editando || {
    nome: "", cnpj: "", tipo_servico: "outro", valor_recorrente_mensal: "", dia_vencimento: 5, status: "ativo", observacao: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.valor_recorrente_mensal) { alert("Informe nome e valor mensal."); return; }
    setSaving(true);
    try {
      if (editando?.id) await base44.entities.Prestador.update(editando.id, form);
      else await base44.entities.Prestador.create(form);
      onSaved();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  return (
    <Modal titulo={editando ? "Editar prestador" : "Novo prestador"} aberto onFechar={onClose}
      rodape={<><Botao onClick={onClose}>Cancelar</Botao><Botao tipo="primario" onClick={submit} carregando={saving}>Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Nome *" valor={form.nome} onChange={(v) => set("nome", v)} />
        <Campo label="CNPJ" valor={form.cnpj} onChange={(v) => set("cnpj", v)} />
        <Campo label="Tipo de serviço" tipo="select" opcoes={{ laboratorio: "Laboratório", sistema: "Sistema", medico: "Médico", consultoria: "Consultoria", aluguel: "Aluguel", outro: "Outro" }} valor={form.tipo_servico} onChange={(v) => set("tipo_servico", v)} />
        <Campo label="Valor mensal (R$) *" tipo="number" valor={form.valor_recorrente_mensal} onChange={(v) => set("valor_recorrente_mensal", v)} />
        <Campo label="Dia de vencimento" tipo="number" valor={form.dia_vencimento} onChange={(v) => set("dia_vencimento", v)} />
        <Campo label="Status" tipo="select" opcoes={{ ativo: "Ativo", inativo: "Inativo" }} valor={form.status} onChange={(v) => set("status", v)} />
        <div className="md:col-span-2"><Campo label="Observação" tipo="textarea" valor={form.observacao} onChange={(v) => set("observacao", v)} /></div>
      </div>
    </Modal>
  );
}