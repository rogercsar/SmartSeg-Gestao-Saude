// Buscas externas: dados de empresa por CNPJ e autocomplete de CBO.

// Lista de ocupações comuns (CBO) relevantes para SST. Código no formato "XXXX-X(X)".
export const CBO_LIST = [
  { codigo: "7242-10", titulo: "Soldador" },
  { codigo: "7242-15", titulo: "Soldador (estrutura metálica)" },
  { codigo: "7150-10", titulo: "Eletricista de instalações" },
  { codigo: "7150-25", titulo: "Eletricista de rede" },
  { codigo: "7150-15", titulo: "Eletricista de manutenção" },
  { codigo: "7823-10", titulo: "Pedreiro" },
  { codigo: "7823-15", titulo: "Servente de obras" },
  { codigo: "7822-10", titulo: "Armador de construção" },
  { codigo: "7156-10", titulo: "Pintor de obras" },
  { codigo: "7832-10", titulo: "Montador de andaimes" },
  { codigo: "7165-10", titulo: "Operador de máquinas de construção" },
  { codigo: "8483-10", titulo: "Operador de empilhadeira" },
  { codigo: "8482-10", titulo: "Operador de máquinas de usinagem" },
  { codigo: "8485-10", titulo: "Operador de máquinas de fabricação" },
  { codigo: "7823-20", titulo: "Mestre de obras" },
  { codigo: "7842-10", titulo: "Motorista de caminhão" },
  { codigo: "7843-10", titulo: "Motorista de furgão" },
  { codigo: "8483-15", titulo: "Operador de máquinas pesadas" },
  { codigo: "8615-10", titulo: "Mecânico de manutenção" },
  { codigo: "8615-20", titulo: "Mecânico de veículos" },
  { codigo: "7166-10", titulo: "Encanador" },
  { codigo: "7166-20", titulo: "Instalador de hidráulica" },
  { codigo: "9511-05", titulo: "Mecânico de manutenção de automóveis" },
  { codigo: "8621-10", titulo: "Soldador e cortador" },
  { codigo: "8402-10", titulo: "Operador de caldeira" },
  { codigo: "8403-10", titulo: "Operador de processo químico" },
  { codigo: "8481-10", titulo: "Operador de produção química" },
  { codigo: "8612-10", titulo: "Torneiro mecânico" },
  { codigo: "8611-10", titulo: "Ferramenteiro" },
  { codigo: "8484-10", titulo: "Operador de máquinas de impressão" },
  { codigo: "8412-10", titulo: "Operador de máquinas de usinagem e fabricação" },
  { codigo: "7831-10", titulo: "Ajudante de obras" },
  { codigo: "7165-20", titulo: "Operador de máquinas pesadas" },
  { codigo: "5198-10", titulo: "Auxiliar de logística" },
  { codigo: "7833-10", titulo: "Montador de estruturas" },
  { codigo: "9511-10", titulo: "Eletricista de manutenção de automóveis" },
  { codigo: "7170-10", titulo: "Instalador de sistemas de segurança" },
  { codigo: "8401-10", titulo: "Operador de instalação de processamento" },
  { codigo: "7842-15", titulo: "Motorista de veículos de carga" },
  { codigo: "8622-10", titulo: "Caldeireiro" },
  { codigo: "7241-10", titulo: "Metalúrgico" },
  { codigo: "8482-15", titulo: "Operador de centro de usinagem" },
  { codigo: "7822-15", titulo: "Concretador" },
  { codigo: "7832-15", titulo: "Andaimeiro" },
  { codigo: "7165-15", titulo: "Operador de escavadeira" },
  { codigo: "4110-10", titulo: "Auxiliar administrativo" },
  { codigo: "4121-10", titulo: "Recepcionista" },
  { codigo: "5143-10", titulo: "Faxineiro / Auxiliar de limpeza" },
  { codigo: "5211-10", titulo: "Vendedor" },
  { codigo: "8483-20", titulo: "Operador de máquinas de embalagem" },
  { codigo: "8485-15", titulo: "Operador de máquinas de produção" },
];

export function searchCbo(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return CBO_LIST.filter(
    (c) => c.titulo.toLowerCase().includes(q) || c.codigo.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
  ).slice(0, 6);
}

// Remove máscara do CNPJ.
export function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

// Busca dados de empresa por CNPJ via receitaws (API pública, sem chave).
// Retorna null em caso de erro. Mapeia para os campos do nosso formulário.
export async function lookupCnpj(cnpj) {
  const clean = onlyDigits(cnpj);
  if (clean.length !== 14) return null;
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status && data.status !== "OK") return null;
    const porteMap = { ME: "Pequeno", EPP: "Pequeno", "MEI": "MEI", DEMAIS: "Médio" };
    return {
      razao_social: data.nome || "",
      cnpj: data.cnpj ? data.cnpj.replace(/[^\d]/g, "") : clean,
      cnae: data.atividade_principal?.[0]?.code || "",
      setor_descricao: data.atividade_principal?.[0]?.text || "",
      uf: data.uf || "",
      municipio: data.municipio ? data.municipio.toLowerCase().replace(/(?:^|\s)\S/g, (l) => l.toUpperCase()) : "",
      porte: porteMap[data.porte] || "Pequeno",
    };
  } catch (e) {
    return null;
  }
}