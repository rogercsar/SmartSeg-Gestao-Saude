import React, { useState } from "react";
import { X, ShieldCheck } from "lucide-react";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
  red: "#B91C1C",
};

const DOC_TEXTOS = {
  termos: {
    titulo: "Termos de Uso",
    paragrafos: [
      "O SmartSeg é uma plataforma de gestão de Segurança e Saúde do Trabalho (SST). Ao se cadastrar, você declara ser responsável legal pela empresa informada e autorizar o uso da plataforma para fins profissionais de SST.",
      "A responsabilidade técnica sobre os programas (PGR, PCMSO, laudos) permanece com o profissional habilitado. O SmartSeg é uma ferramenta de apoio e não substitui a análise de um profissional legalmente habilitado.",
      "É vedado compartilhar sua conta. O uso indeuso, fraudulento ou em desacordo com a legislação pode resultar em suspensão sem reembolso.",
      "Os valores são cobrados mensalmente conforme o plano contratado, com reajuste apenas por alteração de faixa de vidas ou custo de excedente de créditos de IA.",
    ],
  },
  privacidade: {
    titulo: "Política de Privacidade",
    paragrafos: [
      "O SmartSeg coleta dados de identificação do titular, da empresa e de trabalhadores (incluindo dados ocupacionais e de saúde, como CID em atestados) estritamente para a gestão de SST, conforme a LGPD (Lei 13.709/2018) e a NR-1.",
      "Os dados são tratados com finalidade específica, armazenados de forma segura e compartilhados apenas com profissionais autorizados da sua organização, conforme os perfis e permissões configurados pelo administrador.",
      "Você pode exercer, a qualquer momento, os direitos de acesso, correção, anonimização e exclusão dos dados, solicitando ao administrador da sua organização ou à equipe de privacidade do SmartSeg.",
      "Dados de saúde são classificados como sensíveis (LGPD art. 11) e têm acesso restrito a perfis autorizados.",
    ],
  },
  tratamento: {
    titulo: "Contrato de Tratamento de Dados",
    paragrafos: [
      "O SmartSeg atua como operador de dados pessoais e sensíveis em nome da sua organização (controladora), tratando os dados exclusivamente para a execução das rotinas de SST.",
      "A organização mantém a titularidade dos dados e é responsável pelas bases legais e pela legitimidade do tratamento. O SmartSeg adota medidas técnicas e organizacionais de segurança (criptografia, controle de acesso por perfil, segregação por organização).",
      "Em caso de encerramento da assinatura, os dados podem ser exportados pela ferramenta e serão retidos conforme obrigação legal de SST ou eliminados mediante solicitação após o prazo de guarda.",
      "Subcontratados (ex.: gateway de pagamento) tratam apenas os dados necessários à sua função, sob as mesmas obrigações de confidencialidade e segurança.",
    ],
  },
};

export default function AceiteJuridico({ valores, onChange }) {
  const [doc, setDoc] = useState(null);
  const abrir = (k) => setDoc(k);

  const itens = [
    { key: "aceite_termos", label: "Termos de Uso", doc: "termos" },
    { key: "aceite_privacidade", label: "Política de Privacidade", doc: "privacidade" },
    { key: "aceite_tratamento", label: "Contrato de Tratamento de Dados", doc: "tratamento" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-1.5 text-xs rounded-lg p-2.5" style={{ background: "#FEF3C7", color: "#92400E" }}>
        <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
        <span>Textos-base (LGPD). Exigem <strong>revisão jurídica</strong> antes da abertura ao público.</span>
      </div>
      {itens.map((it) => (
        <label key={it.key} className="flex items-start gap-2.5 text-sm cursor-pointer" style={{ color: WORK.text }}>
          <input
            type="checkbox"
            checked={!!valores[it.key]}
            onChange={(e) => onChange({ ...valores, [it.key]: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded"
            style={{ accentColor: WORK.accent }}
          />
          <span className="flex-1">
            Li e aceito os{" "}
            <button type="button" onClick={() => abrir(it.doc)} className="font-medium underline" style={{ color: WORK.accent }}>
              {it.label}
            </button>
            .
          </span>
        </label>
      ))}

      {doc && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 md:p-6 overflow-y-auto" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setDoc(null)}>
          <div className="w-full max-w-2xl rounded-xl border my-4" style={{ background: WORK.surface, borderColor: WORK.border }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: WORK.border }}>
              <h3 className="font-semibold" style={{ color: WORK.text }}>{DOC_TEXTOS[doc].titulo}</h3>
              <button onClick={() => setDoc(null)} style={{ color: WORK.muted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {DOC_TEXTOS[doc].paragrafos.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed" style={{ color: WORK.text }}>{p}</p>
              ))}
            </div>
            <div className="px-5 py-4 border-t flex justify-end" style={{ borderColor: WORK.border }}>
              <button onClick={() => setDoc(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: WORK.accent, color: "#FFFFFF" }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}