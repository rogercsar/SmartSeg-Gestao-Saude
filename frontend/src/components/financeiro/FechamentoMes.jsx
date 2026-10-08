import React, { useState, useEffect } from "react";
import { Modal, Botao, Campo } from "@/components/programas/ui";
import { base44 } from "@/api/base44Client";
import { WORK, num, formatBRL, salvarFolha, registrarExcedente, ultimoDiaMes } from "@/lib/finance";

export default function FechamentoMes({ mesAno, onClose, onSaved }) {
  const [contratos, setContratos] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [qtds, setQtds] = useState({});
  const [folha, setFolha] = useState("");
  const [encargos, setEncargos] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.ContratoCliente.filter({ status: "ativo" }).catch(() => []),
      base44.entities.Company.list("-created_date", 200).catch(() => []),
      base44.entities.FolhaMensal.filter({ mes_ano: mesAno }).catch(() => []),
    ]).then(([c, cmp, f]) => {
      setContratos(c);
      setCompanies(cmp);
      const init = {};
      c.forEach((ct) => { init[ct.id] = 0; });
      base44.entities.LancamentoFinanceiro.filter({ categoria: "excedente", data_vencimento: ultimoDiaMes(mesAno) }).catch(() => []).then((lancs) => {
        const q = { ...init };
        (lancs || []).forEach((l) => { if (l.contrato_id) q[l.contrato_id] = num(l.quantidade); });
        setQtds(q);
      });
      if (f[0]) { setFolha(String(f[0].valor_folha ?? "")); setEncargos(String(f[0].encargos ?? "")); }
    });
  }, [mesAno]);

  const nomeEmp = (id) => companies.find((c) => c.id === id)?.razao_social || "—";

  const salvar = async () => {
    setSaving(true);
    try {
      await salvarFolha(base44, mesAno, folha, encargos);
      await registrarExcedente(base44, mesAno, contratos.map((c) => ({
        contrato_id: c.id, company_id: c.company_id, quantidade: qtds[c.id] || 0,
        limite_incluido: c.limite_incluido, valor_excedente_unitario: c.valor_excedente_unitario, unidade_excedente: c.unidade_excedente,
      })));
      onSaved();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const totalExcedente = contratos.reduce((s, c) => {
    const ex = Math.max(0, num(qtds[c.id]) - num(c.limite_incluido));
    return s + ex * num(c.valor_excedente_unitario);
  }, 0);

  return (
    <Modal titulo={`Fechamento — ${mesAno}`} aberto onFechar={onClose} largura="max-w-4xl"
      rodape={<><Botao onClick={onClose}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={saving}>Salvar fechamento</Botao></>}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Campo label="Folha de pagamento (R$)" tipo="number" valor={folha} onChange={setFolha} />
        <Campo label="Encargos (R$)" tipo="number" valor={encargos} onChange={setEncargos} />
      </div>
      <h4 className="text-sm font-semibold mb-2" style={{ color: WORK.text }}>Excedente realizado por contrato</h4>
      {contratos.length === 0 && <p className="text-sm" style={{ color: WORK.muted }}>Nenhum contrato ativo.</p>}
      <div className="space-y-2">
        {contratos.map((c) => {
          const q = num(qtds[c.id]);
          const ex = Math.max(0, q - num(c.limite_incluido));
          const val = ex * num(c.valor_excedente_unitario);
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-2 rounded-md border" style={{ borderColor: WORK.border }}>
              <span className="flex-1 text-sm min-w-[160px]" style={{ color: WORK.text }}>{nomeEmp(c.company_id)}</span>
              <span className="text-xs" style={{ color: WORK.muted }}>Limite {c.limite_incluido} {c.unidade_excedente}</span>
              <input type="number" value={qtds[c.id] ?? 0} onChange={(e) => setQtds((q) => ({ ...q, [c.id]: e.target.value }))}
                className="w-24 px-2 py-1.5 rounded border text-sm" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} />
              <span className="text-xs" style={{ color: WORK.muted }}>{c.unidade_excedente}</span>
              <span className="text-sm font-medium w-28 text-right" style={{ color: val > 0 ? WORK.pos : WORK.muted }}>{formatBRL(val)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-sm" style={{ color: WORK.text }}>
        <span>Total excedente previsto</span>
        <span className="font-semibold">{formatBRL(totalExcedente)}</span>
      </div>
    </Modal>
  );
}