import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TIPOS_RISCO, EXPOSICAO } from "@/lib/sst";
import { Modal, Botao, Campo } from "@/components/programas/ui";

const MOMENTOS = {
  admissional: "Admissional",
  periodico: "Periódico",
  retorno: "Retorno ao trabalho",
  mudanca_risco: "Mudança de risco",
  demissional: "Demissional",
};

// Editor inline genérico para nós da árvore de estrutura
export default function EditarNo({ tipo, item, opcoes = {}, onClose, onSaved }) {
  const [form, setForm] = useState({ ...item });
  const [salvando, setSalvando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dados } = form; // eslint-disable-line no-unused-vars
      if (item.id) {
        await base44.entities[tipo.entidade].update(item.id, dados);
      } else {
        await base44.entities[tipo.entidade].create({ ...dados, ...tipo.defaults });
      }
      onSaved();
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";

  return (
    <Modal
      aberto
      onFechar={onClose}
      titulo={`${item.id ? "Editar" : "Novo"} — ${tipo.label}`}
      largura="max-w-2xl"
      rodape={
        <>
          <Botao onClick={onClose}>Cancelar</Botao>
          <Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tipo.campos.map((c) => (
          <Campo
            key={c.key}
            label={c.label + (c.obrigatorio ? " *" : "")}
            tipo={c.tipo}
            opcoes={typeof c.opcoes === "function" ? c.opcoes(opcoes) : c.opcoes}
            valor={form[c.key]}
            placeholder={c.placeholder}
            linhas={c.linhas}
            className={c.largo ? "md:col-span-2" : ""}
            onChange={(v) => set(c.key, v)}
          />
        ))}
      </div>
    </Modal>
  );
}

// Definições de campos por tipo de nó
export const TIPOS_NO = {
  unidade: {
    entidade: "Unidade",
    label: "unidade",
    campos: [
      { key: "nome", label: "Nome", obrigatorio: true },
      { key: "tipo_inscricao", label: "Tipo", tipo: "select", opcoes: { cnpj: "CNPJ", cno: "CNO", caepf: "CAEPF" } },
      { key: "numero_inscricao", label: "Inscrição" },
      { key: "cnae", label: "CNAE" },
      { key: "grau_risco", label: "Grau de risco", tipo: "select", opcoes: { 1: "1", 2: "2", 3: "3", 4: "4" } },
      { key: "endereco", label: "Endereço", largo: true },
      { key: "municipio", label: "Município" },
      { key: "uf", label: "UF" },
      { key: "num_trabalhadores", label: "Nº trabalhadores", tipo: "number" },
    ],
  },
  setor: {
    entidade: "Setor",
    label: "setor",
    campos: [
      { key: "nome", label: "Nome", obrigatorio: true },
      { key: "unidade_id", label: "Unidade", tipo: "select", opcoes: (ctx) => ctx.unidades || {} },
      { key: "descricao_ambiente", label: "Descrição do ambiente", tipo: "textarea", linhas: 4, largo: true },
    ],
  },
  cargo: {
    entidade: "CargoFuncao",
    label: "cargo",
    campos: [
      { key: "nome_cargo", label: "Nome do cargo", obrigatorio: true },
      { key: "cbo", label: "CBO" },
      { key: "setor_id", label: "Setor", tipo: "select", opcoes: (ctx) => ctx.setores || {}, obrigatorio: true },
      { key: "ghe", label: "GHE" },
      { key: "jornada", label: "Jornada" },
      { key: "quantidade_funcionarios", label: "Qtd. funcionários", tipo: "number" },
      { key: "atividades", label: "Atividades", tipo: "textarea", linhas: 4, largo: true },
    ],
  },
  trabalhador: {
    entidade: "Trabalhador",
    label: "colaborador",
    campos: [
      { key: "nome", label: "Nome", obrigatorio: true },
      { key: "cpf", label: "CPF" },
      { key: "matricula", label: "Matrícula" },
      { key: "cargo_id", label: "Cargo", tipo: "select", opcoes: (ctx) => ctx.cargos || {} },
      { key: "data_admissao", label: "Admissão", tipo: "date" },
      { key: "sexo", label: "Sexo", tipo: "select", opcoes: { M: "Masculino", F: "Feminino" } },
    ],
  },
  risco: {
    entidade: "Risco",
    label: "risco",
    campos: [
      { key: "tipo", label: "Tipo", tipo: "select", opcoes: Object.fromEntries(Object.entries(TIPOS_RISCO).map(([k, v]) => [k, v.label])), obrigatorio: true },
      { key: "agente", label: "Agente", obrigatorio: true, largo: true },
      { key: "fonte_geradora", label: "Fonte geradora", largo: true },
      { key: "possiveis_danos", label: "Possíveis danos", largo: true },
      { key: "exposicao", label: "Exposição", tipo: "select", opcoes: EXPOSICAO },
      { key: "severidade", label: "Severidade (1-5)", tipo: "number" },
      { key: "probabilidade", label: "Probabilidade (1-5)", tipo: "number" },
      { key: "medidas_existentes", label: "Medidas existentes", tipo: "textarea", linhas: 2, largo: true },
    ],
  },
  exame: {
    entidade: "ExamePcmso",
    label: "exame",
    campos: [
      { key: "exame", label: "Exame", obrigatorio: true, largo: true },
      { key: "periodicidade_meses", label: "Periodicidade (meses)", tipo: "number" },
      { key: "justificativa", label: "Justificativa técnica", tipo: "textarea", linhas: 2, largo: true },
    ],
  },
};