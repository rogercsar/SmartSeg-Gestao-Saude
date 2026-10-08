import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Building2, ClipboardCheck, FileText, AlertTriangle, Scale,
  GraduationCap, Stethoscope, MessageSquare, Library, FileBarChart,
  Heart, Crown, ChevronDown, ChevronRight, Sparkles, ShieldCheck, ShieldX, History,
  HardHat, UsersRound, ClipboardList, CalendarClock, FileCheck2, Users, Brain, LayoutDashboard, FolderCheck, Settings, Home as HomeIcon,
} from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

function Secao({ id, titulo, icon: Icon, cor, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: cor + "22" }}>
          <Icon size={18} style={{ color: cor }} />
        </div>
        <span className="flex-1 font-semibold text-sm" style={{ color: WORK.text }}>{titulo}</span>
        {open ? <ChevronDown size={16} style={{ color: WORK.muted }} /> : <ChevronRight size={16} style={{ color: WORK.muted }} />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-2.5 text-sm" style={{ color: WORK.muted }}>{children}</div>}
    </div>
  );
}

function P({ children }) { return <p className="leading-relaxed">{children}</p>; }
function Passo({ n, children }) { return <div className="flex gap-2.5"><span className="shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: WORK.accent, color: "#FFFFFF" }}>{n}</span><span className="flex-1">{children}</span></div>; }
function Alerta({ children }) { return <div className="flex gap-2 rounded-lg border p-3" style={{ background: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.3)", color: "#8A5A00" }}><Sparkles size={15} className="shrink-0 mt-0.5" /><p className="text-xs leading-relaxed">{children}</p></div>; }
function LinkInterno({ to, children }) { return <Link to={to} className="font-medium underline" style={{ color: WORK.accent }}>{children}</Link>; }
function Telas({ itens }) {
  return <p className="text-xs"><b style={{ color: WORK.text }}>Telas relacionadas:</b> {itens.map((it, i) => <span key={i}>{i > 0 && " · "}{Array.isArray(it) ? <LinkInterno to={it[1]}>{it[0]}</LinkInterno> : it}</span>)}</p>;
}
function Box({ titulo, children }) {
  return <div className="rounded-lg border p-3" style={{ background: WORK.bg, borderColor: WORK.border }}>
    {titulo && <p className="text-xs font-semibold mb-1.5" style={{ color: WORK.accent }}>{titulo}</p>}
    <div className="space-y-1.5">{children}</div>
  </div>;
}

export default function Manual() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <BookOpen size={26} style={{ color: WORK.accent }} />
        <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Manual do SmartSeg</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: WORK.muted }}>
        Roteiro completo: o que cada tela faz, passo a passo das tarefas, como emitir cada documento e como funciona a cobrança. Toque em uma seção para expandir.
      </p>

      <Alerta>
        O SmartSeg auxilia na gestão de SST, mas <b>não substitui</b> o julgamento técnico do responsável. Documentos gerados saem como <b>rascunho</b> e exigem revisão e assinatura de profissional habilitado (eng. de segurança, médico do trabalho ou técnico de segurança).
      </Alerta>

      <div className="space-y-3 mt-5">

        <Secao id="inicio" titulo="Primeiros passos e conceitos" icon={Sparkles} cor={WORK.accent} defaultOpen>
          <P>O SmartSeg organiza o trabalho em torno de <b>empresas cliente</b>. Cada empresa tem seus próprios trabalhadores, cargos, riscos, programas e documentos. Os dados de uma empresa não aparecem na outra.</P>
          <P><b>1. Selecione a empresa ativa</b> no seletor do menu lateral (no topo, no celular) antes de qualquer tarefa. A maioria das telas filtra automaticamente pela empresa selecionada.</P>
          <P><b>2. Siga o fluxo natural:</b> cadastrar empresa → setores e cargos → levantar riscos → montar planos (PGR/PCMSO) → emitir documentos → supervisionar (EPI, inspeções, treinamentos, eSocial).</P>
          <P><b>3. Créditos de IA:</b> recursos de IA (chat NR, redação de atas, geração de DDS, sugestões, defesa prévia) consomem créditos. O saldo e os planos estão no menu. Ao esgotar, recarregue via <LinkInterno to="/planos">Planos</LinkInterno>.</P>
          <P><b>Dois espaços:</b> o módulo de <b>Trabalho</b> (gestão técnica de SST) e o <LinkInterno to="/espaco-zela">Espaço Zela</LinkInterno> (apoio emocional anônimo do trabalhador).</P>
          <Telas itens={[["Início", "/"], ["Empresas", "/empresas"], ["Planos", "/planos"]]} />
        </Secao>

        <Secao id="home" titulo="Início (painel)" icon={HomeIcon} cor={WORK.accent}>
          <P>Tela de chegada. Mostra um resumo da empresa ativa: atalhos rápidos (Ordem de Serviço, Ficha EPI, Chat NR, PGR, lançar atestado), o <b>checklist de conformidade</b> da empresa com barra de progresso, as conversas recentes no Chat NR e os últimos documentos gerados.</P>
          <P><b>Como usar:</b> use os atalhos para ações frequentes e o checklist para ver o que falta atender por NR. O checklist é gerado automaticamente a partir do CNAE ao criar a empresa.</P>
          <Telas itens={[["Empresas", "/empresas"], ["Documentos", "/documentos"], ["Programas", "/programas"], ["Chat NR", "/chat"]]} />
        </Secao>

        <Secao id="empresas" titulo="Empresas e trabalhadores" icon={Building2} cor="#3B82F6">
          <P>Comece cadastrando a empresa cliente em <LinkInterno to="/empresas">Empresas</LinkInterno>. O CNAE define o grau de risco e quais NRs se aplicam. O SmartSeg gera automaticamente um checklist de conformidade inicial ao criar.</P>
          <P>No <b>detalhe da empresa</b> você gerencia cargos, trabalhadores e o checklist. Passo a passo:</P>
          <Passo n="1">Em <LinkInterno to="/empresas">Empresas</LinkInterno>, clique em <b>Cadastrar empresa</b>, preencha razão social, CNAE, grau de risco, UF e dados da folha (para FAP/RAT). Salve.</Passo>
          <Passo n="2">Abra a empresa. Na aba <b>Cargos/funções</b>, cadastre cada cargo com atividades, CBO, riscos e EPIs obrigatórios.</Passo>
          <Passo n="3">Na aba <b>Trabalhadores</b>, cadastre os colaboradores vinculados a cargos e setores. Cada trabalhador abre uma <b>ficha 360°</b> (abaixa detalhe) com: Perfil, Saúde, Segurança, Documentos, Anexos, eSocial e Movimentações.</Passo>
          <Passo n="4">Acompanhe o <b>checklist de conformidade</b> (itens por NR gerados pelo CNAE) e marque itens como atendido/não aplicável.</Passo>
          <Alerta>Setores e cargos cadastrados aqui alimentam o PGR, o EPI, as inspeções e o eSocial. Cadastre-os antes de montar o PGR.</Alerta>
          <Telas itens={[["PGR, PCMSO e laudos", "/programas"], ["Gestão de EPI", "/epi"], ["eSocial", "/esocial"], ["Relatórios", "/indicadores"]]} />
        </Secao>

        <Secao id="programas" titulo="PGR, PCMSO e laudos" icon={ClipboardCheck} cor="#22C55E">
          <P>O coração técnico do SmartSeg. Em <LinkInterno to="/programas">Programas</LinkInterno> você monta o PGR, PCMSO, LTCAT e laudos de insalubridade/periculosidade, seguindo as abas em ordem.</P>
          <P><b>Fluxo do PGR (NR-01 — GRO, vigência 26/05/2026):</b></P>
          <Passo n="1"><b>Estrutura:</b> cadastre <b>unidades</b>, <b>setores</b> e <b>cargos</b> (grupos homogêneos de exposição). Eles já podem existir se vieram de Empresas.</Passo>
          <Passo n="2"><b>Riscos:</b> levante cada risco (tipo, agente, fonte geradora, danos, meio de propagação, exposição, intensidade, técnica de medição, severidade/probabilidade fundamentadas, data da avaliação e grupo exposto). A NR-01/2026 exige avaliação de <b>fatores psicossociais</b> — inclua riscos do tipo "psicossocial".</Passo>
          <Passo n="3"><b>Medições:</b> registre medições ambientais com equipamento e certificado de calibração.</Passo>
          <Passo n="4"><b>Matriz:</b> confira a classificação do risco (baixo/moderado/alto/crítico) calculada a partir de severidade × probabilidade.</Passo>
          <Passo n="5"><b>Medidas de controle e plano de ação:</b> defina EPC, EPI e o plano (ação, responsável, prazo, acompanhamento e aferição).</Passo>
          <Passo n="6"><b>PCMSO:</b> vincule exames aos riscos do cargo (admissional, periódico, retorno, mudança de risco, demissional).</Passo>
          <Passo n="7"><b>Laudos:</b> classifique insalubridade (NR-15) e periculosidade (NR-16) por cargo, com assistência de IA.</Passo>
          <Passo n="8"><b>Documentos:</b> anexe a versão assinada (upload) e <b>emita</b> o PGR. Ao emitir, o sistema cria um snapshot imutável do inventário (NR-01, 1.5.7.3.3.1).</Passo>
          <Alerta>O PGR só passa a "emitido" se não houver pendências da NR-01 (itens 1.5.3 e 1.5.7) e se a versão assinada estiver anexada. Caso contrário, permanece rascunho.</Alerta>
          <Telas itens={[["Empresas", "/empresas"], ["Vencimentos", "/vencimentos"], ["Histórico do inventário", "#historico"]]} />
        </Secao>

        <Secao id="catalogos" titulo="Catálogos SST (riscos, exames, aptidões)" icon={Library} cor="#0D9488">
          <P>Em <LinkInterno to="/catalogos-sst">Catálogos SST</LinkInterno> você mantém catálogos compartilhados de <b>riscos</b>, <b>exames</b> e <b>aptidões ASO</b>, já integrados às tabelas do eSocial (Tabela 24 — agentes nocivos; Tabela 27 — procedimentos diagnósticos).</P>
          <Passo n="1"><b>Catálogo de riscos:</b> cadastre agentes por tipo (físico, químico, biológico, ergonômico, acidente, psicossocial) com código eSocial, fonte geradora, danos e meio de propagação. Ao levantar um risco no PGR, basta selecioná-lo do catálogo.</Passo>
          <Passo n="2"><b>Catálogo de exames:</b> cadastre exames com código eSocial, periodicidade padrão e momentos (admissional, periódico, etc.). O PCMSO sugere exames a partir do catálogo.</Passo>
          <Passo n="3"><b>Catálogo de aptidões:</b> mantenha as aptidões ASO (altura, eletricidade, espaços confinados…) usadas na emissão do ASO.</Passo>
          <Passo n="4"><b>Geração por IA:</b> use "Gerar inventário do PGR" para criar riscos automaticamente a partir do catálogo, com base no CNAE e na estrutura de cargos.</Passo>
          <Alerta>O catálogo padrão (sem organização) é compartilhado entre todas as contas. Itens criados pela sua organização ficam isolados por conta.</Alerta>
          <Telas itens={[["Programas", "/programas"], ["Clínica (PCMSO e ASO)", "/clinica"]]} />
        </Secao>

        <Secao id="psicossocial" titulo="Riscos psicossociais (NR-01/2026)" icon={Brain} cor="#7C3AED">
          <P>Em <LinkInterno to="/psicossocial">Riscos psicossociais</LinkInterno> você aplica instrumentos de avaliação (burnout, estresse) e transforma os resultados em riscos no PGR, conforme a NR-01/2026 (GRO).</P>
          <Passo n="1"><b>Instrumento:</b> cadastre o instrumento de avaliação com escalas, itens e pesos.</Passo>
          <Passo n="2"><b>Aplicação:</b> lance uma campanha para o público (empresa, setor ou cargo) e período. Os trabalhadores respondem anonimamente.</Passo>
          <Passo n="3"><b>Resultado:</b> ao encerrar, gere os riscos psicossociais no PGR a partir dos resultados consolidados.</Passo>
          <P>Os dados individuais são tratados de forma agregada para preservar o anonimato — coerente com o <LinkInterno to="/espaco-zela">Espaço Zela</LinkInterno>.</P>
          <Telas itens={[["Programas", "/programas"], ["Espaço Zela", "/espaco-zela"]]} />
        </Secao>

        <Secao id="documentos" titulo="Documentos — como emitir cada um" icon={FileText} cor="#8B5CF6">
          <P>Em <LinkInterno to="/documentos">Documentos</LinkInterno> você gera PDFs operacionais. Passo a passo geral: selecione a empresa (e o cargo, quando exigido), preencha/gera o conteúdo, clique em <b>Gerar e baixar PDF</b>. O documento é salvo como rascunho no histórico.</P>
          <Box titulo="Roteiro por documento">
            <Passo n="OS"><b>Ordem de Serviço (NR-1):</b> Documentos → "Ordem de Serviço" → selecione empresa e cargo → "Gerar e baixar PDF". Traz atividades, riscos e EPIs do cargo.</Passo>
            <Passo n="EPI"><b>Ficha de EPI (NR-6):</b> Documentos → "Ficha de EPI" → empresa + cargo → gerar. Também acessível pela ficha individual do trabalhador (aba Documentos).</Passo>
            <Passo n="DDS"><b>DDS:</b> Documentos → "Sugestão de DDS" → informe o tema (ou peça à IA para sugerir) → a IA monta introdução, pontos-chave e perguntas de engajamento → gerar PDF.</Passo>
            <Passo n="LP"><b>Lista de presença:</b> Documentos → "Lista de Presença" → preencha evento/data → gerar PDF.</Passo>
            <Passo n="Cert"><b>Certificado de treinamento:</b> Documentos → "Certificado" → informe a NR → a IA sugere conteúdo programático → gerar PDF.</Passo>
            <Passo n="Rec"><b>Termo de recusa de EPI:</b> Documentos → "Termo de Recusa de EPI" → preencha → gerar PDF.</Passo>
            <Passo n="PGR"><b>PGR/APR (rascunho):</b> Documentos → "PGR / APR" → preencha o formulário → gerar PDF de rascunho. Para o PGR oficial, use Programas → Documentos → emitir.</Passo>
            <Passo n="PPP"><b>PPP:</b> acessível no detalhe do trabalhador (aba Documentos), com histórico de riscos do cargo.</Passo>
          </Box>
          <P>Todos os PDFs saem com marca d'água de <b>rascunho</b>. Após revisar, marque como "revisado" no histórico da tela Documentos.</P>
          <Alerta>Documentos que exigem assinatura (PGR, laudos, OS) devem ser assinados por profissional habilitado. O anexo da versão assinada é obrigatório para emissão final do PGR.</Alerta>
          <Telas itens={[["Início", "/"], ["Trabalhador (PPP, OS individual)", "/empresas"], ["Programas", "/programas"]]} />
        </Secao>

        <Secao id="epi" titulo="Gestão de EPI (NR-6)" icon={HardHat} cor="#0891B2">
          <P>Em <LinkInterno to="/epi">Gestão de EPI</LinkInterno> você controla catálogo, entregas com assinatura, validade do CA, trocas periódicas e estoque.</P>
          <Passo n="1"><b>Catálogo:</b> aba "Catálogo e estoque" → cadastre EPIs (nome, CA, validade do CA, vida útil em dias, estoque). Atalho: "Importar EPIs do PGR" puxa os EPIs já cadastrados nos riscos.</Passo>
          <Passo n="2"><b>Entrega:</b> "Registrar entrega" → escolha o colaborador → marque os EPIs (o sistema sugere os exigidos pelo PGR para o cargo) → capture a assinatura no celular → salvar. O estoque é baixado automaticamente.</Passo>
          <Passo n="3"><b>Acompanhamento:</b> a aba "Por colaborador" mostra quem está com EPI pendente (exigido no PGR e não entregue) e trocas vencidas. A ficha assinada abre em "Ficha".</Passo>
          <Alerta>EPI com CA vencido não pode ser entregue (NR-6). O sistema alerta e pede confirmação antes de registrar.</Alerta>
          <Telas itens={[["Programas (riscos)", "/programas"], ["Vencimentos", "/vencimentos"], ["Trabalhador", "/empresas"]]} />
        </Secao>

        <Secao id="cipa" titulo="CIPA (NR-5)" icon={UsersRound} cor="#7C3AED">
          <P>Em <LinkInterno to="/cipa">CIPA</LinkInterno> você gerencia mandato, membros, estabilidade, reuniões e cronograma eleitoral.</P>
          <Passo n="1"><b>Mandato:</b> "Novo mandato" → defina tipo (CIPA eleita ou designado), início, fim e grau de risco. Adicione membros (titular/suplente, empregados/empregador).</Passo>
          <Passo n="2"><b>Estabilidade:</b> após salvar, clique em "Atualizar cadastro e estabilidade" para gravar a função na CIPA e a estabilidade (até 1 ano após o mandato) no cadastro de cada representante eleito.</Passo>
          <Passo n="3"><b>Reuniões:</b> "Gerar calendário mensal" cria as 12 reuniões ordinárias. Abra cada reunião, marque presentes, escreva a pauta e use "Redigir ata com IA".</Passo>
          <Passo n="4"><b>Eleição:</b> aba "Eleição" → o sistema sugere datas a partir do fim do mandato (edital, inscrições, votação, posse). Ajuste e salve.</Passo>
          <Telas itens={[["Treinamentos (NR-5)", "/treinamentos"], ["Vencimentos", "/vencimentos"], ["Documentos (kit eleitoral)", "/documentos"]]} />
        </Secao>

        <Secao id="inspecoes" titulo="Inspeções e planos de ação" icon={ClipboardList} cor="#F97316">
          <P>Em <LinkInterno to="/inspecoes">Inspeções</LinkInterno> você faz checklists no celular, com foto, e cada não conformidade vira automaticamente uma ação com prazo e responsável.</P>
          <Passo n="1"><b>Modelos:</b> use os modelos padrão ou crie o seu (manual ou com IA — descreva o tema e o sistema gera os itens com a NR de referência).</Passo>
          <Passo n="2"><b>Nova inspeção:</b> aba "Nova inspeção" → escolha o checklist → informe setor, local e inspetor → responda cada item (conforme / não conforme / não se aplica), com foto e observação.</Passo>
          <Passo n="3"><b>Concluir:</b> "Concluir e gerar plano de ação" exige todas as respostas e observação nas não conformidades. Cada não conformidade vira uma ação no plano.</Passo>
          <Passo n="4"><b>Plano de ação:</b> aba "Planos de ação" → acompanhe, atribua responsável/prazo e registre a evidência de resolução. Gere o relatório em PDF da inspeção concluída.</Passo>
          <Telas itens={[["Vencimentos (ações atrasadas)", "/vencimentos"], ["Programas", "/programas"], ["eSocial", "/esocial"]]} />
        </Secao>

        <Secao id="atestados" titulo="Atestados e FAP" icon={Stethoscope} cor="#EC4899">
          <P>Em <LinkInterno to="/atestados">Atestados e FAP</LinkInterno> você gerencia atestados médicos, afastamentos, exames do PCMSO e simula o FAP.</P>
          <Passo n="1"><b>Lançar atestado:</b> registre trabalhador, CID, dias, início/fim e situação INSS (B31, B91, indeferido). O sistema aciona o S-2230 do eSocial quando aplicável.</Passo>
          <Passo n="2"><b>Simulador de FAP:</b> informe FAP atual, RAT, folha e vínculos → projete cenários de redução de custo → gere relatório em PDF.</Passo>
          <Passo n="3"><b>Perfil epidemiológico:</b> analise afastamentos por CID, duração e setor.</Passo>
          <Telas itens={[["eSocial", "/esocial"], ["Relatórios", "/indicadores"], ["Vencimentos", "/vencimentos"]]} />
        </Secao>

        <Secao id="clinica" titulo="Clínica (agenda e ASO)" icon={Stethoscope} cor="#EC4899">
          <P>Em <LinkInterno to="/clinica">Clínica</LinkInterno> você agenda atendimentos e emite o <b>ASO</b> (Atestado de Saúde Ocupacional, NR-7) integrado ao PCMSO e ao eSocial (S-2220).</P>
          <Passo n="1"><b>Agenda:</b> crie o atendimento (trabalhador, empresa, cargo e tipo de ASO: admissional, periódico, retorno, mudança de risco, demissional).</Passo>
          <Passo n="2"><b>Atendimento clínico:</b> registre aptidões, exames realizados e conclusão (apto / apto com restrições / inapto). As aptidões vêm do <LinkInterno to="/catalogos-sst">catálogo</LinkInterno> e os exames do PCMSO.</Passo>
          <Passo n="3"><b>ASO:</b> emita o ASO em PDF e dispare o evento S-2220 do eSocial.</Passo>
          <Telas itens={[["Atestados e FAP", "/atestados"], ["Catálogos SST", "/catalogos-sst"], ["eSocial", "/esocial"]]} />
        </Secao>

        <Secao id="acidentes" titulo="Acidentes e CAT" icon={AlertTriangle} cor="#EF4444">
          <P>Em <LinkInterno to="/acidentes">Acidentes</LinkInterno> registre ocorrências com data, local, parte do corpo, agente causador, natureza da lesão e afastamento.</P>
          <Passo n="1">Registre a ocorrência com os dados e testemunhas.</Passo>
          <Passo n="2"><b>Investigação:</b> use os 5 Porquês e diagrama de Ishikawa para identificar causa-raiz e gerar plano de ação.</Passo>
          <Passo n="3">Gere a <b>CAT</b> em PDF a partir do registro.</Passo>
          <Telas itens={[["eSocial (S-2210)", "/esocial"], ["Documentos (CAT)", "/documentos"], ["Relatórios", "/indicadores"]]} />
        </Secao>

        <Secao id="treinamentos" titulo="Treinamentos" icon={GraduationCap} cor="#06B6D4">
          <P>Em <LinkInterno to="/treinamentos">Treinamentos</LinkInterno> registre treinamentos por NR, trabalhador, data e validade. O sistema calcula vencidos, a vencer em 30 dias e em dia.</P>
          <Passo n="1"><b>Matriz:</b> cadastre os treinamentos obrigatórios por cargo/NR (manual ou com sugestão de IA).</Passo>
          <Passo n="2"><b>Realização:</b> registre a turma (trabalhadores, instrutor, data, carga horária) e, opcionalmente, anexe o certificado.</Passo>
          <Passo n="3"><b>Acompanhamento:</b> veja o status por trabalhador e envie um resumo de vencimentos por e-mail.</Passo>
          <Telas itens={[["Vencimentos", "/vencimentos"], ["CIPA (treinamento NR-5)", "/cipa"], ["Documentos (certificado)", "/documentos"]]} />
        </Secao>

        <Secao id="autos" titulo="Autos de Infração" icon={Scale} cor="#F59E0B">
          <P>Em <LinkInterno to="/autos">Autos de Infração</LinkInterno> importe o PDF do auto, extraia os dados (NR/item citado, valor da multa, prazo de defesa) e gere uma <b>minuta de defesa prévia</b> assistida por IA, com base na NR citada.</P>
          <Alerta>A defesa é gerada pela IA — revise e argumente com a fundamentação técnica antes de protocolar.</Alerta>
          <Telas itens={[["Base normativa", "/normas"], ["Chat NR", "/chat"]]} />
        </Secao>

        <Secao id="recusa" titulo="Direito de recusa (NR-01)" icon={ShieldX} cor="#EF4444">
          <P>Em <LinkInterno to="/recusas">Direito de recusa</LinkInterno> registre quando um trabalhador interrompe atividade ao constatar situação de risco (NR-01 — GRO).</P>
          <Passo n="1">Registre trabalhador, data/hora, local, situação perigosa e risco identificado.</Passo>
          <Passo n="2">Descreva as medidas de controle existentes e a providência do empregador. Anexe foto/evidência.</Passo>
          <Passo n="3">Acompanhe o status: pendente → em análise → resolvido.</Passo>
          <Telas itens={[["Acidentes", "/acidentes"], ["Programas", "/programas"]]} />
        </Secao>

        <Secao id="esocial" titulo="eSocial" icon={FileCheck2} cor="#0EA5E9">
          <P>Em <LinkInterno to="/esocial">eSocial</LinkInterno> o painel deriva automaticamente os eventos pendentes de cada trabalhador a partir dos dados de cargos, atestados e movimentações.</P>
          <P>Eventos monitorados: S-2200 (admissão), S-2205 (alteração cadastral), S-2206 (alteração de contrato), S-2210 (CAT), S-2220 (ASO), S-2230 (afastamento), S-2240 (condições ambientais), S-2298 (reintegração) e S-2299 (desligamento). O S-2230 segue as mesmas regras de prazo do módulo Atestados; o S-2240 é exigido para todo empregado, mesmo sem risco (código 09.01.001).</P>
          <Telas itens={[["Atestados (S-2230)", "/atestados"], ["Trabalhador", "/empresas"], ["Acidentes (S-2210)", "/acidentes"]]} />
        </Secao>

        <Secao id="terceiros" titulo="Gestão de Terceiros (NR-04)" icon={Users} cor="#3B82F6">
          <P>Em <LinkInterno to="/terceiros">Gestão de Terceiros</LinkInterno> você controla empresas prestadoras e a documentação, com alertas de vencimento (responsabilidade solidária, NR-04).</P>
          <Passo n="1"><b>Cadastrar terceira:</b> "Nova terceira" → razão social, CNPJ, responsável, contrato (início/fim), área de atuação e vínculo aos setores/cargos da contratante.</Passo>
          <Passo n="2"><b>Documentos:</b> na terceira, adicione contrato, ART, ASO em lote, PGR/PCMSO do terceiro, FSSP, CIPA, etc., com arquivo e validade.</Passo>
          <Passo n="3"><b>Monitoramento:</b> o painel mostra documentos vencidos, vencendo em 30d e contratos em alerta. Filtre por "só com alertas".</Passo>
          <Telas itens={[["Vencimentos", "/vencimentos"], ["Empresas", "/empresas"]]} />
        </Secao>

        <Secao id="vencimentos" titulo="Painel de vencimentos" icon={CalendarClock} cor="#F59E0B">
          <P>Em <LinkInterno to="/vencimentos">Painel de vencimentos</LinkInterno> você vê tudo o que vence ou está pendente em um só lugar: treinamentos, EPI/CA, documentos, calibrações, terceiros, CIPA, planos de ação, S-2230 e vacinas.</P>
          <Passo n="1">Selecione a empresa (ou "todas") e a janela (30/60/90 dias).</Passo>
          <Passo n="2">Filtre por categoria e clique em cada item para ir direto à tela responsável.</Passo>
          <Passo n="3">Use "Enviar resumo por e-mail" para receber a lista no seu e-mail.</Passo>
          <Telas itens={[["EPI", "/epi"], ["Treinamentos", "/treinamentos"], ["CIPA", "/cipa"], ["Terceiros", "/terceiros"], ["Atestados", "/atestados"]]} />
        </Secao>

        <Secao id="financeiro" titulo="Gestão do negócio e financeiro" icon={LayoutDashboard} cor="#0EA5E9">
          <P>Um conjunto de telas para quem gerencia o SST como serviço (clínicas e consultorias):</P>
          <Passo n="1"><LinkInterno to="/painel-negocio">Painel do negócio</LinkInterno>: visão operacional — empresas ativas, atendimentos e vencimentos.</Passo>
          <Passo n="2"><LinkInterno to="/dashboard-financeiro">Dashboard estratégico</LinkInterno>: KPIs financeiros, rentabilidade por categoria, fluxo de caixa (a receber/a pagar/aging) e carteira de clientes.</Passo>
          <Passo n="3"><LinkInterno to="/financeiro">Financeiro e margem</LinkInterno>: lançamentos a pagar/receber, contratos de cliente (mensalidade + excedente) e prestadores/parceiros.</Passo>
          <Passo n="4"><LinkInterno to="/consumo">Consumo e fatura</LinkInterno>: acompanhe o consumo de atendimentos por contrato e gere o demonstrativo.</Passo>
          <Telas itens={[["Assinaturas", "/assinaturas"], ["Planos", "/planos"]]} />
        </Secao>

        <Secao id="chat" titulo="Chat NR e base normativa" icon={MessageSquare} cor={WORK.accent}>
          <P>O <LinkInterno to="/chat">Chat NR</LinkInterno> responde dúvidas sobre as 38 NRs vigentes usando a base de conhecimento interna e pode buscar contexto da internet.</P>
          <P>Em <LinkInterno to="/normas">Base normativa</LinkInterno> você importa o texto oficial das NRs (dividido em trechos por item) e gerencia o mapeamento CNAE → NR, com sugestão de IA.</P>
          <Alerta>A base interna é um resumo. Para citações literais, importe o texto oficial na aba "Importar NR".</Alerta>
          <Telas itens={[["Textos técnicos", "/textos-tecnicos"], ["Autos de Infração", "/autos"]]} />
        </Secao>

        <Secao id="textos" titulo="Textos técnicos" icon={Library} cor="#A855F7">
          <P>Em <LinkInterno to="/textos-tecnicos">Textos técnicos</LinkInterno> você mantém uma biblioteca de textos padronizados (introduções, fundamentações, conclusões) para acelerar a redação de laudos e programas. Organize por tipo de documento (PGR, PCMSO, LTCAT…), categoria e tags.</P>
          <Telas itens={[["Programas", "/programas"], ["Documentos", "/documentos"]]} />
        </Secao>

        <Secao id="indicadores" titulo="Relatórios e indicadores" icon={FileBarChart} cor="#10B981">
          <P>Em <LinkInterno to="/indicadores">Relatórios e indicadores</LinkInterno> visualize métricas de SST da empresa ativa: convocação de exames, exames realizados, entrega de EPI, ASOs emitidos, acidentes, atestado de saúde, afastamento INSS, PGR e treinamentos, com gráficos de evolução em 6 meses.</P>
          <P>Indicadores psicossociais (Espaço Zela) são mantidos separados e anônimos, por design.</P>
          <Telas itens={[["Atestados", "/atestados"], ["Acidentes", "/acidentes"], ["EPI", "/epi"], ["Programas", "/programas"]]} />
        </Secao>

        <Secao id="relatorios" titulo="Relatórios e PDFs" icon={FileBarChart} cor="#10B981">
          <P>Em <LinkInterno to="/relatorios">Relatórios e PDFs</LinkInterno> você gera, imprime ou envia por e-mail relatórios dinâmicos de todos os módulos (empresas, colaboradores, riscos, acidentes, atestados, treinamentos, EPI, financeiro, eSocial, plano de ação…), além de atalhos para os documentos já imprimíveis (PGR, ASO, PPP, ficha de EPI, inspeção, dossiê).</P>
          <Passo n="1">Escolha o relatório e clique em <b>PDF</b> (baixar), <b>Imprimir</b> ou <b>E-mail</b>.</Passo>
          <Passo n="2">No envio por e-mail, informe o destinatário e uma mensagem; o PDF vai em anexo.</Passo>
          <Telas itens={[["Indicadores", "/indicadores"], ["Documentos", "/documentos"]]} />
        </Secao>

        <Secao id="dossie" titulo="Dossiê da fiscalização" icon={FolderCheck} cor="#F59E0B">
          <P>Em <LinkInterno to="/dossie">Dossiê</LinkInterno> o sistema consolida em um só documento os principais itens que um auditor fiscal costuma solicitar: dados da empresa, inventário de riscos, PCMSO, EPI, treinamentos, CAT, atestados, CIPA e eSocial. Útil para se preparar para uma fiscalização.</P>
          <Telas itens={[["Autos de Infração", "/autos"], ["Indicadores", "/indicadores"], ["Relatórios", "/relatorios"]]} />
        </Secao>

        <Secao id="espaco" titulo="Espaço Zela (bem-estar)" icon={Heart} cor="#EAB308">
          <P>O <LinkInterno to="/espaco-zela">Espaço Zela</LinkInterno> é um espaço anônimo onde o trabalhador conversa com o Zeca (apoio emocional) e faz autoavaliações de burnout/estresse.</P>
          <P><b>Anonimato:</b> as mensagens usam um identificador hash, sem vínculo direto à conta. O protocolo de risco detecta sinais de autolesão e oferece o Safety Kit (CVV 188, SAMU 192, ancoragem 5-4-3-2-1).</P>
          <Alerta><b>Não é terapia:</b> é apoio e escuta. Casos graves são sinalizados e encaminhados para profissionais.</Alerta>
        </Secao>

        <Secao id="planos" titulo="Planos, assentos, créditos e cobrança" icon={Crown} cor="#F59E0B">
          <P>Em <LinkInterno to="/planos">Planos e assentos</LinkInterno> você gerencia sua assinatura e a equipe. A cobrança funciona assim:</P>
          <Box titulo="Como funciona a cobrança">
            <P><b>Modelo:</b> assinatura mensal com <b>créditos de IA inclusos</b> por plano. Cada chamada de IA (chat NR, redação de ata, DDS, sugestões, defesa prévia) consome créditos. Recargas extras <b>não expiram</b>.</P>
            <P><b>Pagamento:</b> processado pelo gateway integrado (cartão, Pix ou boleto). A gestão é feita na tela de Planos.</P>
          </Box>
          <Box titulo="Planos disponíveis">
            <P><b>Grátis:</b> 30 créditos/mês · 1 empresa · chat NR, documentos básicos e Espaço Zela.</P>
            <P><b>Essencial:</b> 200 créditos/mês · empresas ilimitadas · todos os documentos, acidentes/CAT, treinamentos.</P>
            <P><b>Profissional:</b> 750 créditos/mês · tudo do Essencial + estatísticas de setor, calculadora de multas, risco de autuação.</P>
            <P><b>Equipe:</b> 2.500 créditos/mês · tudo do Profissional + assentos para o time (até 10) e painel do administrador.</P>
          </Box>
          <P><b>Assentos (Equipe):</b> convide profissionais por e-mail e atribua papel (profissional / admin da equipe). O admin gerencia quem tem assento, mas <b>nunca acessa o conteúdo do Espaço Zela</b> — o desabafo de cada profissional é privado.</P>
          <Alerta>Os créditos são compartilhados entre todos os assentos da equipe. Monitore o consumo no menu lateral (selo de créditos).</Alerta>
          <Telas itens={[["Início", "/"]]} />
        </Secao>

        <Secao id="historico" titulo="Histórico do inventário (NR-01)" icon={History} cor="#A855F7">
          <P>A NR-01 (item 1.5.7.3.3.1) exige a preservação do histórico do inventário de riscos por, no mínimo, 20 anos.</P>
          <P>O SmartSeg cria automaticamente um <b>snapshot imutável</b> do inventário (setores, cargos e riscos) toda vez que o PGR é emitido. Consulte os snapshots na aba <b>"Histórico"</b> dentro de Programas — são apenas leitura e não alteram os dados atuais.</P>
          <Telas itens={[["Programas", "/programas"]]} />
        </Secao>

        <Secao id="organizacao" titulo="Perfil de acesso (equipe)" icon={Settings} cor="#6366F1">
          <P>Em <LinkInterno to="/organizacao">Perfil de acesso</LinkInterno> o administrador da conta gerencia a organização, convida membros da equipe e define permissões por módulo (visualizar e editar) e por perfil (profissional / admin da equipe).</P>
          <P><b>Permissões por módulo</b> controlam quem vê e quem edita cada área (cadastros, programas, saúde, segurança, financeiro). O acesso é validado em tempo real pelo perfil do membro.</P>
          <Alerta>O conteúdo do <LinkInterno to="/espaco-zela">Espaço Zela</LinkInterno> é sempre privado, mesmo para o admin da equipe.</Alerta>
          <Telas itens={[["Planos e assentos", "/planos"]]} />
        </Secao>

        <Secao id="regras" titulo="Regras gerais do sistema" icon={ShieldCheck} cor="#22C55E">
          <P><b>Isolamento de dados:</b> cada usuário vê apenas suas próprias empresas e registros. Não há compartilhamento entre contas.</P>
          <P><b>Rascunho vs. revisado:</b> documentos gerados são sempre rascunho até revisão. O PGR exige assinatura anexada para emissão final.</P>
          <P><b>Base legal:</b> o SmartSeg referencia as 38 NRs vigentes (NR-2 e NR-27 revogadas). A NR-01/2026 (GRO) está em vigor desde 26/05/2026.</P>
          <P><b>Responsabilidade técnica:</b> todo documento deve ser revisado e assinado por profissional habilitado. O SmartSeg não emite documentos com validade legal por si só.</P>
          <P><b>Arquivos anexados</b> (fotos de inspeção, certificados, PDFs do PGR, evidências de recusa) são armazenados de forma privada e seguem as permissões da sua conta.</P>
        </Secao>
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: WORK.muted }}>
        SmartSeg — plataforma de gestão de SST e bem-estar do trabalhador. Atualizado em out/2026.
      </p>
    </div>
  );
}