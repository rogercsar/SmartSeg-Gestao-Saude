import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { linkTemporario } from "@/lib/privateFiles";
import { LOGO_SMARTSEG } from "@/lib/marca";
import { MOTIVOS_ENTREGA, dataBR } from "@/lib/sstGestao";

const CSS = `
@page { size: A4; margin: 14mm 12mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; max-width: 190mm; margin: 0 auto; padding: 16px; }
.topo { display:flex; align-items:center; gap:14px; border-bottom: 3px solid #0B6FA8; padding-bottom: 8px; margin-bottom: 10px }
.topo img { height: 56px } .topo h1 { font-size: 15pt; margin: 0; color:#0B6FA8 }
table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 6px 0 } th, td { border: 1px solid #999; padding: 4px 5px; text-align: left; vertical-align: middle } th { background: #EAF4F8 }
.termo { font-size: 8.8pt; text-align: justify; border: 1px solid #ccc; padding: 8px; margin: 8px 0 } .ass { height: 34px; max-width: 120px; object-fit: contain }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #fff; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra { display: none } .doc { padding: 0 } }
`;

export default function FichaEpi() {
  const [params] = useSearchParams();
  const id = params.get("trabalhador");
  const [d, setD] = useState(null);
  const [imgs, setImgs] = useState({});

  useEffect(() => {
    (async () => {
      const t = await base44.entities.Trabalhador.get(id);
      const [empresa, cargo, entregas] = await Promise.all([
        base44.entities.Company.get(t.company_id).catch(() => null),
        t.cargo_id ? base44.entities.CargoFuncao.get(t.cargo_id).catch(() => null) : null,
        base44.entities.EntregaEpi.filter({ trabalhador_id: id }, "data_entrega").catch(() => []),
      ]);
      setD({ t, empresa, cargo, entregas });
      const uris = [...new Set(entregas.map((e) => e.assinatura_uri).filter(Boolean))];
      const pares = await Promise.all(uris.map(async (u) => [u, await linkTemporario(u, 3600).catch(() => null)]));
      setImgs(Object.fromEntries(pares));
    })().catch(() => setD(false));
  }, [id]);

  if (d === false) return <div style={{ padding: 40 }}>Colaborador não encontrado.</div>;
  if (!d) return <div style={{ padding: 40, color: "#5F6368" }}>Gerando ficha…</div>;
  const { t, empresa, cargo, entregas } = d;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <div className="topo">
          <img src={LOGO_SMARTSEG} alt="SmartSeg" />
          <div><h1>Ficha de Controle de Entrega de EPI</h1><div>NR-6 — Equipamento de Proteção Individual</div></div>
        </div>
        <table><tbody>
          <tr><th>Empresa</th><td>{empresa?.razao_social}</td><th>CNPJ</th><td>{empresa?.cnpj || "—"}</td></tr>
          <tr><th>Colaborador</th><td>{t.nome}</td><th>Matrícula</th><td>{t.matricula || "—"}</td></tr>
          <tr><th>Cargo</th><td>{cargo?.nome_cargo || "—"}</td><th>CPF</th><td>{t.cpf || "—"}</td></tr>
          <tr><th>Admissão</th><td>{dataBR(t.data_admissao)}</td><th>Setor</th><td>{cargo?.ghe || "—"}</td></tr>
        </tbody></table>

        <div className="termo">
          <b>Termo de responsabilidade.</b> Declaro ter recebido gratuitamente os Equipamentos de Proteção Individual abaixo relacionados, em perfeito estado,
          e ter sido orientado(a) e treinado(a) sobre o uso adequado, a guarda, a conservação e a higienização. Comprometo-me a: usá-los apenas para a finalidade a que
          se destinam; responsabilizar-me pela guarda e conservação; comunicar ao empregador qualquer alteração que os torne impróprios para uso; e cumprir as
          determinações sobre o uso adequado. Estou ciente de que a recusa injustificada ao uso do EPI fornecido constitui ato faltoso (NR-1 e art. 158 da CLT).
        </div>

        <table>
          <thead><tr><th>Data</th><th>EPI</th><th>CA</th><th>Qtd</th><th>Motivo</th><th>Devolução</th><th>Assinatura do colaborador</th></tr></thead>
          <tbody>
            {entregas.length === 0 && <tr><td colSpan={7}>Nenhuma entrega registrada.</td></tr>}
            {entregas.map((e) => (
              <tr key={e.id}>
                <td>{dataBR(e.data_entrega)}</td><td>{e.epi_nome}</td><td>{e.ca || "—"}</td><td>{e.quantidade}</td>
                <td>{MOTIVOS_ENTREGA[e.motivo] || e.motivo}</td><td>{e.devolvido_em ? dataBR(e.devolvido_em) : ""}</td>
                <td>{e.assinatura_uri && imgs[e.assinatura_uri] ? <img className="ass" src={imgs[e.assinatura_uri]} alt="assinatura" /> : ""}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 8 - entregas.length) }).map((_, i) => <tr key={"v" + i}><td>&nbsp;</td><td /><td /><td /><td /><td /><td /></tr>)}
          </tbody>
        </table>
        <p style={{ fontSize: "8pt", color: "#555" }}>Assinaturas eletrônicas simples coletadas no sistema na data de cada entrega (Lei 14.063/2020). Linhas em branco para registros manuais.</p>
        <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
          <div style={{ flex: 1, borderTop: "1px solid #111", textAlign: "center", paddingTop: 4 }}>{t.nome}<br />Colaborador</div>
          <div style={{ flex: 1, borderTop: "1px solid #111", textAlign: "center", paddingTop: 4 }}>Responsável pela entrega</div>
        </div>
      </div>
    </div>
  );
}
