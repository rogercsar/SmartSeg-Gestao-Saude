import React, { useState } from "react";
import { Modal, Campo, Botao } from "@/components/programas/ui";
import { base44 } from "@/api/base44Client";
import { hoje } from "@/lib/finance";

const CATS = {
  pagar: { salarios: "Salários", encargos: "Encargos", laboratorio: "Laboratório", sistema: "Sistema", aluguel: "Aluguel", deslocamento: "Deslocamento", impostos: "Impostos", materiais: "Materiais", outros: "Outro" },
  receber: { mensalidade: "Mensalidade", excedente: "Excedente", consultoria: "Consultoria", avulso: "Serviço avulso", outros: "Outro" },
};

export default function LancamentoForm({ onClose, onSaved, editando, companies, prestadores }) {
  const [form, setForm] = useState(editando || {
    tipo: "pagar", categoria: "", valor: "", data_vencimento: hoje(), data_pagamento: "",
    recorrencia: "unica", company_id: "", prestador_id: "", status: "pendente", descricao: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.categoria || !form.valor || !form.data_vencimento) { alert("Preencha categoria, valor e vencimento."); return; }
    setSaving(true);
    const payload = { ...form };
    if (form.status !== "pago") payload.data_pagamento = "";
    try {
      if (editando?.id) await base44.entities.LancamentoFinanceiro.update(editando.id, payload);
      else await base44.entities.LancamentoFinanceiro.create(payload);
      onSaved();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const opcoesEmpresa = Object.fromEntries((companies || []).map((c) => [c.id, c.razao_social]));
  const opcoesPrest = Object.fromEntries((prestadores || []).map((p) => [p.id, p.nome]));

  return (
    <Modal titulo={editando ? "Editar lançamento" : "Novo lançamento"} aberto onFechar={onClose}
      rodape={<><Botao onClick={onClose}>Cancelar</Botao><Botao tipo="primario" onClick={submit} carregando={saving}>Salvar</Botao></>}>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tipo *" tipo="select" opcoes={{ pagar: "Pagar", receber: "Receber" }} valor={form.tipo} onChange={(v) => set("tipo", v)} />
        <Campo label="Categoria *" tipo="select" opcoes={CATS[form.tipo] || {}} valor={form.categoria} onChange={(v) => set("categoria", v)} />
        <Campo label="Valor (R$) *" tipo="number" valor={form.valor} onChange={(v) => set("valor", v)} />
        <Campo label="Vencimento *" tipo="date" valor={form.data_vencimento} onChange={(v) => set("data_vencimento", v)} />
        <Campo label="Recorrência" tipo="select" opcoes={{ unica: "Única", mensal: "Mensal" }} valor={form.recorrencia} onChange={(v) => set("recorrencia", v)} />
        <Campo label="Status" tipo="select" opcoes={{ pendente: "Pendente", pago: "Pago", cancelado: "Cancelado" }} valor={form.status} onChange={(v) => set("status", v)} />
        <Campo label="Cliente (opcional)" tipo="select" opcoes={opcoesEmpresa} valor={form.company_id} onChange={(v) => set("company_id", v)} />
        <Campo label="Prestador (opcional)" tipo="select" opcoes={opcoesPrest} valor={form.prestador_id} onChange={(v) => set("prestador_id", v)} />
        <div className="col-span-2"><Campo label="Descrição" tipo="textarea" valor={form.descricao} onChange={(v) => set("descricao", v)} /></div>
      </div>
    </Modal>
  );
}