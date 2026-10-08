// Perfis, níveis e cálculo das permissões por módulo (origem: referencia-base44/base44/functions/organizacao/entry.ts)

export const MODULOS = ["cadastros", "programas", "saude", "seguranca", "documentos", "esocial", "financeiro", "clinica", "vencimentos", "consumo", "sensiveis"];

export const SO_VER = ["clinica", "vencimentos", "consumo", "sensiveis"];

export const NIVEIS = ["nenhum", "ver", "editar"];

export const BLOQUEIA_EDICAO = ["sem_assinatura", "pendente_pagamento", "suspensa", "cancelada"];

export const TOLERANCIA_DIAS = 15;

export const PADRAO = {
  gestor: { cadastros: "editar", programas: "editar", saude: "editar", seguranca: "editar", documentos: "editar", esocial: "editar", financeiro: "ver", clinica: "ver", vencimentos: "ver", consumo: "ver", sensiveis: "nenhum" },
  funcionario: { cadastros: "ver", programas: "ver", saude: "nenhum", seguranca: "editar", documentos: "ver", esocial: "nenhum", financeiro: "nenhum", clinica: "nenhum", vencimentos: "ver", consumo: "nenhum", sensiveis: "nenhum" },
};

export function flags(perfil, permissoes, ativo = true, status = "interna") {
  const f = { org_ativo: !!ativo };
  const leitura = BLOQUEIA_EDICAO.includes(status);
  for (const m of MODULOS) {
    const nivel = perfil === "admin" ? "editar" : (permissoes?.[perfil]?.[m] || PADRAO[perfil]?.[m] || "nenhum");
    f["pv_" + m] = !!ativo && (nivel === "ver" || nivel === "editar");
    f["pe_" + m] = !!ativo && !leitura && nivel === "editar" && !SO_VER.includes(m);
  }
  return f;
}