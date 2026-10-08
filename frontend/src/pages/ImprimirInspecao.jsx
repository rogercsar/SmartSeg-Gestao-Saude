import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { linkTemporario } from "@/lib/privateFiles";
import { LOGO_SMARTSEG } from "@/lib/marca";
import { dataBR } from "@/lib/sstGestao";

const CSS = `
@page { size: A4; margin: 14mm 12mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; max-width: 190mm; margin: 0 auto; padding: 16px; }
.topo { display:flex; align-items:center; gap:14px; border-bottom: 3px solid #0B6FA8; padding-bottom: 8px; margin-bottom: 10px }
.topo img { height: 56px } .topo h1 { font-size: 15pt; margin: 0; color:#0B6FA8 }
table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 6px 0 } th, td { border: 1px solid #999; padding: 4px 5px; text-align: left; vertical-align: top } th { background: #EAF4F8 }
.nc { background: #FDE8E8 } .foto { height: 70px; max-width: 110px; object-fit: cover }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #fff; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra { display: none } .doc { padding: 0 } }
`;
const R = { conforme: "Conforme", nao_conforme: "NÃO CONFORME", na: "N/A" };

export default function ImprimirInspecao() {
  const [params] = useSearchParams();
  const [d, setD] = useState(null);
  const [fotos, setFotos] = useState({});
  useEffect(() => {
    (async () => {
      const i = await base44.entities.InspecaoChecklist.get(params.get("id"));
      const [empresa, setor, acoes] = await Promise.all([
        base44.entities.Company.get(i.company_id).catch(() => null),
        i.setor_id ? base44.entities.Setor.get(i.setor_id).catch(() => null) : null,
        base44.entities.PlanoAcao.filter({ origem_id: i.id }).catch(() => []),
      ]);
      setD({ i, empresa, setor, acoes });
      const pares = await Promise.all((i.respostas || []).filter((r) => r.foto_uri).map(async (r) => [r.foto_uri, await linkTemporario(r.foto_uri, 3600).catch(() => null)]));
      setFotos(Object.fromEntries(pares));
    })().catch(() => setD(false));
  }, [params]);
  if (d === false) return <div style={{ padding: 40 }}>Inspeção não encontrada.</div>;
  if (!d) return <div style={{ padding: 40, color: "#5F6368" }}>Gerando relatório…</div>;
  const { i, empresa, setor, acoes } = d;
  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <div className="topo"><img src={LOGO_SMARTSEG} alt="SmartSeg" /><div><h1>Relatório de Inspeção de Segurança</h1><div>{i.modelo_nome} — {i.norma}</div></div></div>
        <table><tbody>
          <tr><th>Empresa</th><td>{empresa?.razao_social}</td><th>Data</th><td>{dataBR(i.data)}</td></tr>
          <tr><th>Setor / local</th><td>{setor?.nome || "—"}{i.local ? " / " + i.local : ""}</td><th>Inspetor</th><td>{i.inspetor || "—"}</td></tr>
          <tr><th>Conformidade</th><td colSpan={3}><b>{i.conformidade_pct ?? "—"}%</b> dos itens aplicáveis</td></tr>
        </tbody></table>
        <table>
          <thead><tr><th>#</th><th>Item verificado</th><th>Resultado</th><th>Observação</th><th>Foto</th></tr></thead>
          <tbody>
            {(i.respostas || []).map((r, k) => (
              <tr key={k} className={r.resposta === "nao_conforme" ? "nc" : ""}>
                <td>{k + 1}</td><td>{r.texto}{r.referencia ? <div style={{ fontSize: "8pt", color: "#555" }}>{r.referencia}</div> : null}</td>
                <td><b>{R[r.resposta] || "—"}</b></td><td>{r.observacao}</td>
                <td>{r.foto_uri && fotos[r.foto_uri] ? <img className="foto" src={fotos[r.foto_uri]} alt="" /> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {acoes.length > 0 && (<>
          <h3 style={{ color: "#0B6FA8" }}>Plano de ação</h3>
          <table><thead><tr><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead>
            <tbody>{acoes.map((a) => <tr key={a.id}><td>{a.descricao}</td><td>{a.responsavel || "—"}</td><td>{dataBR(a.prazo)}</td><td>{{ pendente: "Pendente", andamento: "Em andamento", concluida: "Concluída" }[a.status]}</td></tr>)}</tbody>
          </table>
        </>)}
        {i.observacoes && <p><b>Observações:</b> {i.observacoes}</p>}
        <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
          <div style={{ flex: 1, borderTop: "1px solid #111", textAlign: "center", paddingTop: 4 }}>{i.inspetor || "Inspetor"}</div>
          <div style={{ flex: 1, borderTop: "1px solid #111", textAlign: "center", paddingTop: 4 }}>Responsável pela área</div>
        </div>
      </div>
    </div>
  );
}
