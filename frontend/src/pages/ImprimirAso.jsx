import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LOGO_SMARTSEG } from "@/lib/marca";
import QrAutenticidade from "@/components/QrAutenticidade";
import { cl, TIPOS_ASO, CONCLUSOES, TP_EXAME_ESOCIAL, soNum } from "@/lib/clinica";
import { dataBR } from "@/lib/sstGestao";
import { TIPOS_RISCO } from "@/lib/sst";

const CSS = `
@page { size: A4; margin: 12mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; max-width: 190mm; margin: 0 auto; padding: 14px; }
.topo { display:flex; align-items:center; gap:14px; border-bottom: 3px solid #0B6FA8; padding-bottom: 8px; margin-bottom: 10px }
.topo img { height: 60px } .topo h1 { font-size: 14pt; margin: 0; color:#0B6FA8 }
h2 { font-size: 10.5pt; background: #EAF4F8; padding: 4px 6px; margin: 10px 0 4px }
table { width: 100%; border-collapse: collapse; font-size: 9pt } th, td { border: 1px solid #bbb; padding: 4px 6px; text-align: left; vertical-align: top } th { background: #f6f9fb; width: 22% }
.concl { font-size: 14pt; font-weight: bold; padding: 8px; border: 2px solid; text-align: center; margin: 8px 0 }
.ass { display: flex; gap: 30px; margin-top: 36px } .ass div { flex: 1; border-top: 1px solid #111; text-align: center; padding-top: 4px; font-size: 9pt }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; gap: 8px; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #fff; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
.barra button.sec { background: #fff; color: #0B6FA8; border: 1px solid #0B6FA8 }
@media print { .barra { display: none } .doc { padding: 0 } }
`;

// Prévia do evento S-2220 (o módulo eSocial gera o XML, assina e transmite)
function previaS2220(a) {
  return {
    evento: "S-2220",
    cpfTrab: soNum(a.cpf), matricula: a.matricula || "",
    exMedOcup: {
      tpExameOcup: TP_EXAME_ESOCIAL[a.tipo_aso],
      aso: {
        dtAso: a.aso_data,
        resAso: a.conclusao === "inapto" ? 2 : 1,
        exame: (a.exames || []).map((e) => ({ dtExm: e.data || a.aso_data, procRealizado: e.codigo_esocial || "", obsProc: e.exame })),
        medico: { nmMed: a.medico?.nome, nrCRM: a.medico?.crm, ufCRM: a.medico?.uf },
      },
    },
  };
}

export default function ImprimirAso() {
  const [params] = useSearchParams();
  const [d, setD] = useState(null);
  useEffect(() => { cl("aso", { id: params.get("id") }).then(setD).catch((e) => setD({ erro: e.message })); }, [params]);
  if (!d) return <div style={{ padding: 40, color: "#5F6368" }}>Gerando ASO…</div>;
  if (d.erro) return <div style={{ padding: 40 }}>{d.erro}</div>;
  const { clinica, atendimento: a, aptidoes_nomes } = d;
  const [cl_, cor] = CONCLUSOES[a.conclusao] || ["—", "#111"];
  const apts = Object.entries(a.aptidoes || {}).filter(([, v]) => v?.resultado);
  const baixar = () => {
    const blob = new Blob([JSON.stringify(previaS2220(a), null, 2)], { type: "application/json" });
    const el = document.createElement("a"); el.href = URL.createObjectURL(blob); el.download = `S-2220_${soNum(a.cpf)}_${a.aso_data}.json`; el.click(); URL.revokeObjectURL(el.href);
  };

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button><button className="sec" onClick={baixar}>Prévia S-2220 (JSON)</button></div>
      <div className="doc">
        <div className="topo">
          <img src={LOGO_SMARTSEG} alt="SmartSeg" />
          <div><h1>Atestado de Saúde Ocupacional — ASO</h1><div>{clinica.nome}{clinica.cnpj ? ` · CNPJ ${clinica.cnpj}` : ""}{clinica.telefone ? ` · ${clinica.telefone}` : ""}</div><div>Nº {a.aso_numero} · NR-7</div></div>
        </div>

        <h2>Empresa</h2>
        <table><tbody><tr><th>Razão social</th><td>{a.empresa_nome}</td><th>CNPJ</th><td>{a.empresa_cnpj || "—"}</td></tr></tbody></table>

        <h2>Trabalhador</h2>
        <table><tbody>
          <tr><th>Nome</th><td colSpan={3}>{a.trabalhador_nome}</td></tr>
          <tr><th>CPF</th><td>{a.cpf || "—"}</td><th>Matrícula</th><td>{a.matricula || "—"}</td></tr>
          <tr><th>Nascimento</th><td>{dataBR(a.data_nascimento)}</td><th>Cargo / função</th><td>{a.cargo_nome || "—"}</td></tr>
        </tbody></table>

        <h2>Tipo de exame</h2>
        <p style={{ margin: "4px 0" }}><b>{TIPOS_ASO[a.tipo_aso]}</b></p>

        <h2>Riscos ocupacionais</h2>
        <p style={{ margin: "4px 0" }}>{(a.riscos || []).length ? (a.riscos || []).map((r) => `${r.agente} (${TIPOS_RISCO[r.tipo]?.label || r.tipo})`).join("; ") : "Ausência de risco ocupacional específico."}</p>

        <h2>Procedimentos médicos realizados</h2>
        <table><thead><tr><th style={{ width: "65%" }}>Exame</th><th>Data</th></tr></thead>
          <tbody>{(a.exames || []).map((e, i) => <tr key={i}><td>{e.exame}</td><td>{dataBR(e.data || a.aso_data)}</td></tr>)}</tbody></table>

        {apts.length > 0 && (<>
          <h2>Aptidões específicas</h2>
          <table><tbody>{apts.map(([k, v]) => <tr key={k}><th style={{ width: "60%" }}>{aptidoes_nomes[k] || k}</th><td><b>{v.resultado === "apto" ? "APTO" : "INAPTO"}</b></td></tr>)}</tbody></table>
        </>)}

        <h2>Conclusão</h2>
        <div className="concl" style={{ borderColor: cor, color: cor }}>{cl_.toUpperCase()} para a função{a.cargo_nome ? ` de ${a.cargo_nome}` : ""}</div>
        {a.restricoes && <p><b>Observações / restrições:</b> {a.restricoes}</p>}

        <p style={{ fontSize: "9pt" }}>Médico(a) responsável pelo exame: <b>{a.medico?.nome}</b> — CRM {a.medico?.crm}/{a.medico?.uf}. Data do ASO: <b>{dataBR(a.aso_data)}</b>.</p>
        <QrAutenticidade codigo={d.aso_codigo} />
        <div className="ass">
          <div>{a.medico?.nome}<br />CRM {a.medico?.crm}/{a.medico?.uf}</div>
          <div>{a.trabalhador_nome}<br />Declaro ter recebido cópia deste ASO</div>
        </div>
      </div>
    </div>
  );
}
