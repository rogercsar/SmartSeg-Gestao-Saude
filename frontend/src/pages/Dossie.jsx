import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LOGO_SMARTSEG } from "@/lib/marca";
import { hojeLocal, dataBR, addDias } from "@/lib/sstGestao";
import { situacaoTreinamentos } from "@/pages/Treinamentos";
import { situacaoEpiColaborador } from "@/pages/Epi";
import { 
  Building2, 
  Printer, 
  ArrowLeft, 
  FileCheck2, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert,
  ChevronRight,
  Plus
} from "lucide-react";

const S = {
  ok: { label: "Conforme", icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  at: { label: "Atenção", icon: AlertTriangle, cls: "text-amber-700 bg-amber-50 border-amber-200" },
  no: { label: "Pendente", icon: XCircle, cls: "text-rose-700 bg-rose-50 border-rose-200" },
};

const DOCS = {
  pgr: "PGR (NR-1)",
  pcmso: "PCMSO (NR-7)",
  ltcat: "LTCAT",
  insalubridade: "Laudo de Insalubridade (NR-15)",
  periculosidade: "Laudo de Periculosidade (NR-16)",
};

export default function Dossie() {
  const [params, setParams] = useSearchParams();
  const [empresas, setEmpresas] = useState([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(true);
  const [carregandoDossie, setCarregandoDossie] = useState(false);
  const [d, setD] = useState(null);
  
  const id = params.get("empresa") || "";

  useEffect(() => {
    setCarregandoEmpresas(true);
    base44.entities.Company.list("razao_social", 1000)
      .then((l) => {
        const lista = Array.isArray(l) ? l : (l?.items || []);
        setEmpresas(lista);
        if (!id && lista[0]) {
          setParams({ empresa: lista[0].id });
        }
      })
      .catch((err) => {
        console.warn("Falha ao listar empresas:", err);
        setEmpresas([]);
      })
      .finally(() => {
        setCarregandoEmpresas(false);
      });
  }, []);

  useEffect(() => {
    if (!id) {
      setD(null);
      return;
    }
    
    setCarregandoDossie(true);
    (async () => {
      try {
        const f = (e, o) => base44.entities[e].filter({ company_id: id }, o, 5000).catch(() => []);
        const [emp, trabs, riscos, programas, medicoes, matriz, treinos, entregas, mandatos, reunioes, inspecoes, acoes, psico] = await Promise.all([
          base44.entities.Company.get(id).catch(() => null),
          f("Trabalhador"),
          f("Risco"),
          f("ProgramaSST"),
          f("Medicao"),
          f("MatrizTreinamento"),
          f("Treinamento"),
          f("EntregaEpi"),
          f("MandatoCipa", "-inicio"),
          f("ReuniaoCipa"),
          f("InspecaoChecklist", "-data"),
          f("PlanoAcao"),
          f("AplicacaoPsicossocial", "-created_date"),
        ]);
        
        const trabsValidos = Array.isArray(trabs) ? trabs : (trabs?.items || []);
        const riscosValidos = Array.isArray(riscos) ? riscos : (riscos?.items || []);
        const progValidos = Array.isArray(programas) ? programas : (programas?.items || []);
        const medValidos = Array.isArray(medicoes) ? medicoes : (medicoes?.items || []);
        const matrizValida = Array.isArray(matriz) ? matriz : (matriz?.items || []);
        const treinosValidos = Array.isArray(treinos) ? treinos : (treinos?.items || []);
        const entregasValidas = Array.isArray(entregas) ? entregas : (entregas?.items || []);
        const mandatosValidos = Array.isArray(mandatos) ? mandatos : (mandatos?.items || []);
        const reunioesValidas = Array.isArray(reunioes) ? reunioes : (reunioes?.items || []);
        const inspValidas = Array.isArray(inspecoes) ? inspecoes : (inspecoes?.items || []);
        const acoesValidas = Array.isArray(acoes) ? acoes : (acoes?.items || []);
        const psicoValidos = Array.isArray(psico) ? psico : (psico?.items || []);

        const asos = await base44.functions.invoke("organizacao", { action: "dossie_asos", company_id: id })
          .then((r) => r.data)
          .catch(() => null);

        setD({
          emp: emp || { id, razao_social: "Empresa Selecionada", cnpj: "" },
          trabs: trabsValidos.filter((t) => t.status !== "inativo"),
          riscos: riscosValidos,
          programas: progValidos,
          medicoes: medValidos,
          matriz: matrizValida,
          treinos: treinosValidos,
          entregas: entregasValidas,
          mandatos: mandatosValidos,
          reunioes: reunioesValidas,
          inspecoes: inspValidas,
          acoes: acoesValidas,
          psico: psicoValidos,
          asos,
        });
      } catch (err) {
        console.error("Erro ao montar dossiê:", err);
      } finally {
        setCarregandoDossie(false);
      }
    })();
  }, [id]);

  const h = hojeLocal();

  // Estado vazio: Sem empresas cadastradas
  if (!carregandoEmpresas && empresas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 bg-blue-50 text-[#0B6FA8] rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
          <Building2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma empresa encontrada</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          Para emitir o Dossiê de Fiscalização e Conformidade em SST, é necessário que pelo menos uma empresa esteja cadastrada.
        </p>
        <Link
          to="/empresas"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B6FA8] text-white font-medium text-sm rounded-xl hover:bg-[#095783] transition-all shadow-sm"
        >
          <Plus size={18} />
          Cadastrar Empresa
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Barra de Ações Superior (Oculta na impressão) */}
      <header className="print:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/empresas"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Voltar para Empresas"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileCheck2 size={18} className="text-[#0B6FA8]" />
                Dossiê da Fiscalização (Auditoria SST)
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Visão consolidada do cumprimento das NRs para apresentação à inspeção do trabalho
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={id}
                onChange={(e) => setParams({ empresa: e.target.value })}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-[#0B6FA8] focus:border-[#0B6FA8] outline-none transition-all cursor-pointer"
              >
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.razao_social}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              disabled={!d || carregandoDossie}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B6FA8] hover:bg-[#095783] disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
              <span className="sm:hidden">Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-[210mm] w-full mx-auto p-4 sm:p-6 print:p-0">
        {carregandoDossie || !d ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm my-8 flex flex-col items-center justify-center">
            <Loader2 size={36} className="text-[#0B6FA8] animate-spin mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Montando o Dossiê de Fiscalização...</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Consolidando dados de programas, atestados, treinamentos, EPIs e planos de ação da empresa.
            </p>
          </div>
        ) : (
          <DocumentoDossie d={d} h={h} />
        )}
      </main>
    </div>
  );
}

function DocumentoDossie({ d, h }) {
  const prog = (t) => d.programas.find((p) => p.tipo === t);
  const docSit = (p) => (!p ? "no" : p.status !== "emitido" ? "at" : p.vigencia_ate && p.vigencia_ate < h ? "no" : p.vigencia_ate && p.vigencia_ate < addDias(h, 30) ? "at" : "ok");
  const revisados = d.riscos.filter((r) => r.revisado).length;
  const psicoRiscos = d.riscos.filter((r) => r.tipo === "psicossocial").length;
  const abertas = d.acoes.filter((a) => a.status !== "concluida");
  const atrasadas = abertas.filter((a) => a.prazo && a.prazo < h);
  const acoesRisco = d.riscos.flatMap((r) => r.plano_acao || []);
  const sitTrein = situacaoTreinamentos(d.trabs, d.matriz, d.treinos);
  const exig = sitTrein.reduce((n, s) => n + s.itens.length, 0);
  const emDia = sitTrein.reduce((n, s) => n + s.itens.filter((i) => i.sit.k === "ok" || i.sit.k === "vence").length, 0);
  const epi = d.trabs.map((t) => situacaoEpiColaborador(t, d.riscos, d.entregas));
  const epiPend = epi.filter((x) => x.pendentes.length).length;
  const assinadas = d.entregas.filter((e) => e.assinatura_uri).length;
  const mandato = d.mandatos.find((m) => m.status === "vigente");
  const reunRealizadas = mandato ? d.reunioes.filter((r) => r.mandato_id === mandato.id && r.status === "realizada") : [];
  const semAta = reunRealizadas.filter((r) => !r.ata).length;
  const insp = d.inspecoes.filter((i) => i.status === "concluida");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  const pctTrein = pct(emDia, exig);

  const itens = [
    docSit(prog("pgr")),
    revisados === d.riscos.length && d.riscos.length ? "ok" : "at",
    psicoRiscos || d.psico.length ? "ok" : "no",
    atrasadas.length ? "no" : "ok",
    docSit(prog("pcmso")),
    d.asos ? (d.asos.pct_em_dia >= 95 ? "ok" : d.asos.pct_em_dia >= 80 ? "at" : "no") : "at",
    pctTrein === null ? "at" : pctTrein >= 95 ? "ok" : pctTrein >= 80 ? "at" : "no",
    epiPend ? "no" : "ok",
  ];
  const conformes = itens.filter((x) => x === "ok").length;

  return (
    <article className="bg-white rounded-xl print:rounded-none shadow-md print:shadow-none border border-slate-200 print:border-none p-6 sm:p-10 font-sans text-slate-800 text-[10pt] leading-relaxed">
      {/* Cabeçalho do Dossiê */}
      <div className="flex items-center gap-4 border-b-2 border-[#0B6FA8] pb-4 mb-5">
        <img src={LOGO_SMARTSEG} alt="SmartSeg" className="h-14 object-contain" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#0B6FA8] m-0">Dossiê de Conformidade em SST</h2>
          <div className="text-xs text-slate-600 font-medium mt-0.5">
            {d.emp.razao_social} · CNPJ: {d.emp.cnpj || "—"} · CNAE: {d.emp.cnae || "—"} · Grau de Risco: {d.emp.grau_de_risco || "—"}
          </div>
          <div className="text-[11px] text-slate-500">
            Emitido em {dataBR(h)} · {d.trabs.length} colaborador(es) ativo(s)
          </div>
        </div>
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
          <div className={`text-2xl font-bold ${conformes === itens.length ? "text-emerald-700" : conformes >= itens.length - 2 ? "text-amber-700" : "text-rose-700"}`}>
            {conformes}/{itens.length}
          </div>
          <div className="text-[11px] text-slate-600 font-medium">Itens-chave conformes</div>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
          <div className={`text-2xl font-bold ${atrasadas.length ? "text-rose-700" : "text-emerald-700"}`}>
            {atrasadas.length}
          </div>
          <div className="text-[11px] text-slate-600 font-medium">Ações atrasadas</div>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
          <div className="text-2xl font-bold text-slate-800">
            {pctTrein === null ? "—" : `${pctTrein}%`}
          </div>
          <div className="text-[11px] text-slate-600 font-medium">Treinamentos em dia</div>
        </div>
      </div>

      {/* 1. GRO / PGR */}
      <SecaoTitulo numero="1" titulo="Gerenciamento de Riscos Ocupacionais — NR-1 (GRO/PGR)" />
      <TabelaSecao>
        <LinhaSecao
          rotulo="PGR"
          sit={docSit(prog("pgr"))}
          texto={prog("pgr") ? `${prog("pgr").status === "emitido" ? "Emitido" : "Em rascunho"}${prog("pgr").data_emissao ? " em " + dataBR(prog("pgr").data_emissao) : ""}${prog("pgr").vigencia_ate ? ", revisão até " + dataBR(prog("pgr").vigencia_ate) : ""}${prog("pgr").autenticacao_codigo ? " · autenticação " + prog("pgr").autenticacao_codigo : ""}` : "Não elaborado"}
        />
        <LinhaSecao
          rotulo="Inventário de Riscos"
          sit={d.riscos.length && revisados === d.riscos.length ? "ok" : "at"}
          texto={`${d.riscos.length} riscos identificados, ${revisados} revisados por profissional habilitado`}
        />
        <LinhaSecao
          rotulo="Riscos Psicossociais (NR-1)"
          sit={psicoRiscos || d.psico.length ? "ok" : "no"}
          texto={d.psico.length ? `${d.psico.length} pesquisa(s) aplicada(s); ${psicoRiscos} risco(s) no inventário` : psicoRiscos ? `${psicoRiscos} risco(s) psicossocial(is) no inventário` : "Não avaliados"}
        />
        <LinhaSecao
          rotulo="Plano de Ação (5W2H)"
          sit={atrasadas.length ? "no" : abertas.length ? "at" : "ok"}
          texto={`${acoesRisco.length} ações no inventário; ${abertas.length} abertas, ${atrasadas.length} com prazo vencido`}
        />
        <LinhaSecao
          rotulo="Avaliações Quantitativas (NR-9)"
          sit={d.medicoes.length ? "ok" : "at"}
          texto={`${d.medicoes.length} medição(ões) registrada(s) com equipamento e critério normativo (NR × NHO)`}
        />
      </TabelaSecao>

      {/* 2. PCMSO */}
      <SecaoTitulo numero="2" titulo="Saúde Ocupacional — NR-7 (PCMSO)" />
      <TabelaSecao>
        <LinhaSecao
          rotulo="PCMSO"
          sit={docSit(prog("pcmso"))}
          texto={prog("pcmso") ? `${prog("pcmso").status === "emitido" ? "Emitido" : "Em rascunho"}${prog("pcmso").medico_coordenador?.nome ? " · coordenador " + prog("pcmso").medico_coordenador.nome : ""}${prog("pcmso").vigencia_ate ? " · vigência até " + dataBR(prog("pcmso").vigencia_ate) : ""}` : "Não elaborado"}
        />
        <LinhaSecao
          rotulo="ASOs em Dia"
          sit={d.asos ? (d.asos.pct_em_dia >= 95 ? "ok" : d.asos.pct_em_dia >= 80 ? "at" : "no") : "at"}
          texto={d.asos ? `${d.asos.em_dia} de ${d.asos.total} colaboradores com exame periódico em dia (${d.asos.pct_em_dia}%); ${d.asos.sem_aso} sem ASO registrado` : "Aguardando dados clínicos"}
        />
      </TabelaSecao>

      {/* 3. EPI, Capacitação e CIPA */}
      <SecaoTitulo numero="3" titulo="Capacitação, EPI e CIPA" />
      <TabelaSecao>
        <LinhaSecao
          rotulo="Treinamentos por Cargo"
          sit={pctTrein === null ? "at" : pctTrein >= 95 ? "ok" : pctTrein >= 80 ? "at" : "no"}
          texto={exig ? `${emDia} de ${exig} exigências em dia (${pctTrein}%)` : "Matriz de treinamentos não definida"}
        />
        <LinhaSecao
          rotulo="EPI (NR-6)"
          sit={epiPend ? "no" : "ok"}
          texto={`${epiPend} colaborador(es) com EPI exigido pendente de entrega; ${assinadas} recibos com assinatura confirmada`}
        />
        <LinhaSecao
          rotulo="CIPA / Designado (NR-5)"
          sit={mandato ? (semAta ? "at" : "ok") : "no"}
          texto={mandato ? `${mandato.tipo === "designado" ? "Designado" : "CIPA"} com mandato até ${dataBR(mandato.fim)}; ${reunRealizadas.length} reunião(ões) realizada(s)` : "Sem mandato vigente registrado"}
        />
        <LinhaSecao
          rotulo="Inspeções de Segurança"
          sit={insp.length ? "ok" : "at"}
          texto={insp.length ? `${insp.length} inspeção(ões) realizada(s); última em ${dataBR(insp[0].data)} (${insp[0].conformidade_pct ?? "—"}% conformidade)` : "Nenhuma inspeção registrada"}
        />
      </TabelaSecao>

      {/* 4. Laudos Ambientais */}
      <SecaoTitulo numero="4" titulo="Laudos Técnicos e Previdenciários" />
      <TabelaSecao>
        {["ltcat", "insalubridade", "periculosidade"].map((t) => (
          <LinhaSecao
            key={t}
            rotulo={DOCS[t]}
            sit={prog(t) ? docSit(prog(t)) : "at"}
            texto={prog(t) ? `${prog(t).status === "emitido" ? "Emitido" : "Em rascunho"}${prog(t).data_emissao ? " em " + dataBR(prog(t).data_emissao) : ""}${prog(t).autenticacao_codigo ? " · autenticação " + prog(t).autenticacao_codigo : ""}` : "Não elaborado (avaliar aplicabilidade)"}
          />
        ))}
      </TabelaSecao>

      {/* Rodapé Legal */}
      <footer className="mt-6 pt-4 border-t border-slate-200 text-[8pt] text-slate-500 leading-normal">
        Este dossiê consolida as informações registradas na plataforma SmartSeg até a data de emissão. Os documentos que possuem código de autenticidade podem ser verificados através da leitura do QR Code presente no respectivo arquivo original.
      </footer>
    </article>
  );
}

function SecaoTitulo({ numero, titulo }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B6FA8] bg-sky-50/70 border-l-4 border-[#0B6FA8] px-2.5 py-1.5 mt-5 mb-2 rounded-r">
      {numero}. {titulo}
    </h3>
  );
}

function TabelaSecao({ children }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
      <table className="w-full border-collapse text-left text-xs">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function LinhaSecao({ rotulo, sit, texto }) {
  const cfg = S[sit] || S.at;
  const Icon = cfg.icon;

  return (
    <tr className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/50">
      <th className="py-2 px-3 font-semibold text-slate-700 w-2/5 sm:w-1/3 bg-slate-50/80 border-r border-slate-100">
        {rotulo}
      </th>
      <td className="py-2 px-3 text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
            <Icon size={12} />
            {cfg.label}
          </span>
          <span className="text-slate-700">{texto}</span>
        </div>
      </td>
    </tr>
  );
}
