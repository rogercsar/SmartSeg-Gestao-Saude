import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { WORK } from "@/lib/sst";
import { cl } from "@/lib/clinica";
import { Botao, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { Cabecalho, Abas } from "@/components/sst/useEmpresa";

// ===== Validações =====
export function cpfValido(cpf) {
  const d = String(cpf || "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}
export const formatarCpf = (c) => String(c || "").replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
// aceita dd/mm/aaaa, aaaa-mm-dd e número de série do Excel
export function data(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) { const a = m[3].length === 2 ? (Number(m[3]) > 40 ? "19" : "20") + m[3] : m[3]; return `${a}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  if (/^\d{4,6}$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000); return d.toISOString().slice(0, 10); }
  return null;
}
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const MODELOS = {
  colaboradores: ["cnpj_empresa", "nome", "cpf", "matricula", "data_nascimento", "sexo (M/F)", "data_admissao", "setor", "cargo", "cbo", "status (ativo/inativo)"],
  asos: ["cpf", "data_aso", "tipo (admissional/periodico/retorno/mudanca_risco/demissional)", "conclusao (apto/inapto/apto_restricao)", "medico", "crm", "uf_crm"],
};
const EXEMPLO = {
  colaboradores: ["00.000.000/0001-00", "Maria Exemplo", "123.456.789-09", "1001", "15/04/1990", "F", "02/01/2024", "Produção", "Operadora de máquinas", "7842-05", "ativo"],
  asos: ["123.456.789-09", "10/03/2026", "periodico", "apto", "Dr. Exemplo", "1234", "MT"],
};

async function lerPlanilha(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: "" });
  return linhas.slice(1).filter((l) => l.some((c) => String(c).trim()));
}

export default function Importacao() {
  const [aba, setAba] = useState("colaboradores");
  const [empresas, setEmpresas] = useState([]);
  const [previa, setPrevia] = useState(null);
  const [rodando, setRodando] = useState(false);
  const [progresso, setProgresso] = useState("");
  useEffect(() => { base44.entities.Company.list("razao_social", 1000).then(setEmpresas).catch(() => {}); }, []);

  const baixarModelo = () => {
    const csv = "\uFEFF" + [MODELOS[aba], EXEMPLO[aba]].map((l) => l.map((c) => `"${c}"`).join(";")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `modelo_${aba}.csv`; a.click();
  };

  const analisar = async (file) => {
    if (!file) return;
    try {
      const linhas = await lerPlanilha(file);
      const porCnpj = Object.fromEntries(empresas.map((e) => [String(e.cnpj || "").replace(/\D/g, ""), e]));
      const vistos = new Set();
      const itens = linhas.map((l, i) => {
        const erros = [];
        if (aba === "colaboradores") {
          const [cnpj, nome, cpf, matricula, nasc, sexo, adm, setor, cargo, cbo, status] = l.map((c) => String(c ?? "").trim());
          const emp = porCnpj[cnpj.replace(/\D/g, "")];
          if (!emp) erros.push("empresa (CNPJ) não cadastrada");
          if (!nome) erros.push("nome vazio");
          if (cpf && !cpfValido(cpf)) erros.push("CPF inválido");
          if (cpf && vistos.has(cpf.replace(/\D/g, ""))) erros.push("CPF repetido na planilha");
          if (cpf) vistos.add(cpf.replace(/\D/g, ""));
          const dn = data(nasc), da = data(adm);
          if (dn === null) erros.push("data de nascimento inválida");
          if (da === null) erros.push("data de admissão inválida");
          if (sexo && !/^[mf]/i.test(sexo)) erros.push("sexo deve ser M ou F");
          return { linha: i + 2, erros, dados: { emp, nome, cpf: cpf ? formatarCpf(cpf) : "", matricula, data_nascimento: dn || "", sexo: sexo ? sexo[0].toUpperCase() : "", data_admissao: da || "", setor, cargo, cbo, status: /inat|deslig/i.test(status) ? "inativo" : "ativo" } };
        }
        const [cpf, dt, tipo, concl, medico, crm, uf] = l.map((c) => String(c ?? "").trim());
        if (!cpfValido(cpf)) erros.push("CPF inválido");
        const d = data(dt); if (!d) erros.push("data do ASO inválida");
        const t = norm(tipo).replace(/ /g, "_"); if (!["admissional", "periodico", "retorno", "mudanca_risco", "demissional"].includes(t)) erros.push("tipo inválido");
        const c = norm(concl).replace(/ /g, "_"); if (!["apto", "inapto", "apto_restricao"].includes(c)) erros.push("conclusão inválida");
        return { linha: i + 2, erros, dados: { cpf: formatarCpf(cpf), aso_data: d, tipo_aso: t, conclusao: c, medico, crm, uf: uf.toUpperCase() } };
      });
      setPrevia({ itens, ok: itens.filter((x) => !x.erros.length).length });
    } catch (e) { alert("Não foi possível ler a planilha: " + e.message); }
  };

  const importarColaboradores = async () => {
    setRodando(true);
    try {
      const validos = previa.itens.filter((x) => !x.erros.length).map((x) => x.dados);
      let criados = 0, atualizados = 0;
      for (const emp of [...new Set(validos.map((v) => v.emp.id))].map((id) => validos.find((v) => v.emp.id === id).emp)) {
        setProgresso(`Preparando ${emp.razao_social}…`);
        const [setores, cargos, existentes] = await Promise.all([
          base44.entities.Setor.filter({ company_id: emp.id }), base44.entities.CargoFuncao.filter({ company_id: emp.id }), base44.entities.Trabalhador.filter({ company_id: emp.id }, undefined, 5000),
        ]);
        const doEmp = validos.filter((v) => v.emp.id === emp.id);
        // cria setores e cargos que ainda não existem
        for (const nome of [...new Set(doEmp.map((v) => v.setor).filter(Boolean))]) if (!setores.some((s) => norm(s.nome) === norm(nome))) setores.push(await base44.entities.Setor.create({ company_id: emp.id, nome }));
        for (const v of doEmp) {
          if (!v.cargo || cargos.some((c) => norm(c.nome_cargo) === norm(v.cargo))) continue;
          cargos.push(await base44.entities.CargoFuncao.create({ company_id: emp.id, nome_cargo: v.cargo, cbo: v.cbo || "", setor_id: setores.find((s) => norm(s.nome) === norm(v.setor))?.id || "" }));
        }
        const porCpf = Object.fromEntries(existentes.filter((t) => t.cpf).map((t) => [String(t.cpf).replace(/\D/g, ""), t]));
        const novos = [];
        for (const v of doEmp) {
          const reg = { company_id: emp.id, nome: v.nome, cpf: v.cpf, matricula: v.matricula, data_nascimento: v.data_nascimento, sexo: v.sexo, data_admissao: v.data_admissao, status: v.status,
            setor_id: setores.find((s) => norm(s.nome) === norm(v.setor))?.id || "", cargo_id: cargos.find((c) => norm(c.nome_cargo) === norm(v.cargo))?.id || "" };
          Object.keys(reg).forEach((k) => reg[k] === "" && delete reg[k]);
          const ex = v.cpf && porCpf[v.cpf.replace(/\D/g, "")];
          if (ex) { await base44.entities.Trabalhador.update(ex.id, reg); atualizados++; } else novos.push(reg);
        }
        for (let i = 0; i < novos.length; i += 100) { setProgresso(`${emp.razao_social}: gravando ${Math.min(i + 100, novos.length)} de ${novos.length}…`); await base44.entities.Trabalhador.bulkCreate(novos.slice(i, i + 100)); criados += Math.min(100, novos.length - i); }
      }
      alert(`Importação concluída: ${criados} colaborador(es) criados e ${atualizados} atualizados (mesmo CPF).`);
      setPrevia(null);
    } catch (e) { alert("Erro na importação: " + e.message); } finally { setRodando(false); setProgresso(""); }
  };

  const importarAsos = async () => {
    setRodando(true);
    try {
      const linhas = previa.itens.filter((x) => !x.erros.length).map((x) => x.dados);
      let total = 0, semCadastro = [];
      for (let i = 0; i < linhas.length; i += 200) {
        setProgresso(`Gravando ${Math.min(i + 200, linhas.length)} de ${linhas.length}…`);
        const r = await cl("importar_asos", { linhas: linhas.slice(i, i + 200) });
        total += r.importados || 0; semCadastro = semCadastro.concat(r.sem_cadastro || []);
      }
      alert(`${total} ASO(s) importado(s).${semCadastro.length ? ` ${semCadastro.length} CPF(s) sem colaborador cadastrado foram ignorados.` : ""}`);
      setPrevia(null);
    } catch (e) { alert("Erro: " + e.message); } finally { setRodando(false); setProgresso(""); }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Cabecalho titulo="Importação por planilha" subtitulo="Traga colaboradores e o histórico de ASOs do sistema anterior (CSV ou XLSX). Nada é gravado antes da conferência." />
      <Abas abas={[["colaboradores", "Colaboradores"], ["asos", "Histórico de ASOs"]]} aba={aba} setAba={(a) => { setAba(a); setPrevia(null); }} />
      <Cartao acoes={<>
        <Botao onClick={baixarModelo}><Download size={14} /> Modelo</Botao>
        <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ background: WORK.accent, color: "#fff" }}><Upload size={14} /> Escolher planilha<input type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => { analisar(e.target.files?.[0]); e.target.value = ""; }} /></label>
      </>}>
        {aba === "colaboradores"
          ? <p className="text-sm" style={{ color: WORK.muted }}>A empresa é identificada pelo CNPJ (cadastre-a antes). Setores e cargos que não existirem são criados. Colaborador com CPF já cadastrado na empresa é <b>atualizado</b>, não duplicado. CPFs são conferidos pelo dígito verificador.</p>
          : <p className="text-sm" style={{ color: WORK.muted }}>Cada linha vira um ASO emitido no histórico da clínica, vinculado ao colaborador pelo CPF. É o que permite a convocação calcular corretamente os próximos periódicos. Exige ter a clínica configurada.</p>}
        {!previa && <Vazio>Baixe o modelo, preencha (ou exporte do sistema anterior nas mesmas colunas) e escolha o arquivo.</Vazio>}
        {previa && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Etiqueta cor="#146C43"><CheckCircle2 size={11} className="inline mr-1" />{previa.ok} linha(s) válida(s)</Etiqueta>
              {previa.itens.length - previa.ok > 0 && <Etiqueta cor="#B42318"><AlertTriangle size={11} className="inline mr-1" />{previa.itens.length - previa.ok} com erro (serão ignoradas)</Etiqueta>}
              <span className="ml-auto" />
              <Botao tipo="primario" disabled={!previa.ok} carregando={rodando} onClick={aba === "colaboradores" ? importarColaboradores : importarAsos}>Importar {previa.ok} linha(s)</Botao>
            </div>
            {progresso && <p className="text-xs mb-2" style={{ color: WORK.accent }}>{progresso}</p>}
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-xs" style={{ color: WORK.text }}>
                <thead className="sticky top-0 bg-white"><tr style={{ color: WORK.muted }}><th className="p-1.5 text-left">Linha</th><th className="p-1.5 text-left">{aba === "colaboradores" ? "Colaborador" : "CPF"}</th><th className="p-1.5 text-left">Situação</th></tr></thead>
                <tbody>
                  {previa.itens.map((x) => (
                    <tr key={x.linha} className="border-t" style={{ borderColor: WORK.border }}>
                      <td className="p-1.5">{x.linha}</td>
                      <td className="p-1.5">{aba === "colaboradores" ? `${x.dados.nome} ${x.dados.cpf ? "· " + x.dados.cpf : ""}${x.dados.emp ? " · " + x.dados.emp.razao_social : ""}` : `${x.dados.cpf} · ${x.dados.aso_data || "?"} · ${x.dados.tipo_aso}`}</td>
                      <td className="p-1.5" style={{ color: x.erros.length ? "#B42318" : "#146C43" }}>{x.erros.length ? x.erros.join("; ") : "ok"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Cartao>
    </div>
  );
}
