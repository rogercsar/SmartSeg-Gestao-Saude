// Base de conhecimento das Normas Regulamentadoras (NR) brasileiras.
// Fonte oficial: https://www.gov.br/trabalho-e-emprego/.../normas-regulamentadoras-vigentes
// Atualizado conforme site oficial do MTE (set/2026).
// Usada como contexto para o chat de NR, geração de checklists por CNAE e base legal do PGR.

export const NR_KNOWLEDGE = {
  "NR-1": {
    titulo: "Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
    vigencia: "Cap. 1.5 (GRO) em vigor desde 26/05/2026 (Portaria MTE 1.419/2024)",
    resumo:
      "Norma geral. Estabelece o GRO (Gerenciamento de Riscos Ocupacionais) formalizado pelo PGR (inventário de riscos + plano de ação), direito de recusa do trabalhador, ordem de serviço, capacitação e treinamento, medidas de prevenção ao assédio e violência (para empregadores com CIPA). Aplica-se a todos os empregadores, incluindo MEI.",
    pontos: [
      "Elaborar e implementar o PGR (inventário de riscos + plano de ação)",
      "Identificar perigos e avaliar riscos, incluindo fatores psicossociais",
      "Garantir participação dos trabalhadores no GRO",
      "Emitir Ordem de Serviço sobre prevenção",
      "Garantir capacitação e treinamento admissional, periódico e de retorno ao trabalho",
      "Assegurar o direito de recusa diante de risco grave e iminente",
      "Implementar medidas de prevenção e combate ao assédio e à violência (Lei 14.457/2022)",
      "Manter registro de treinamentos e histórico do inventário por 20 anos",
    ],
  },
  "NR-2": {
    titulo: "Inspeção Prévia (REVOGADA)",
    vigencia: "Revogada",
    resumo: "Revogada. A inspeção prévia foi substituída por outros instrumentos de fiscalização.",
    pontos: ["Norma revogada — sem exigências vigentes."],
  },
  "NR-3": {
    titulo: "Embargo e Interdição",
    resumo:
      "Disciplina o embargo e a interdição de estabelecimentos, setores, máquinas ou equipamentos que ofereçam risco grave e iminente à saúde e à integridade física dos trabalhadores.",
    pontos: [
      "Atender a embargos e interdições determinados pela fiscalização",
      "Interditar imediatamente situação de risco grave e iminente",
      "Comunicar e registrar interdições",
    ],
  },
  "NR-4": {
    titulo: "Serviços Especializados em Segurança e em Medicina do Trabalho (SESMT)",
    resumo:
      "Dimensiona o SESMT conforme grau de risco e número de empregados. Obrigatório conforme quadro da NR-4. Define atribuições dos profissionais do SESMT.",
    pontos: [
      "Dimensionar SESMT conforme quadro da NR-4 (grau de risco x nº de empregados)",
      "Designar e registrar profissionais do SESMT (engenheiro/tecnico de segurança, médico/enfermeiro do trabalho)",
      "Garantir atuação integrada do SESMT com o PGR e o PCMSO",
    ],
  },
  "NR-5": {
    titulo: "Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA)",
    vigencia: "Lei 14.457/2022 — inclui prevenção ao assédio",
    resumo:
      "Estabelece a CIPA (agora também de Assédio), eleição, treinamento e atribuições. Obrigatória conforme quadro conforme número de empregados e CNAE. Inclui medidas de prevenção e combate ao assédio sexual e demais formas de violência.",
    pontos: [
      "Constituir CIPA quando aplicável (quadro NR-5)",
      "Realizar eleição, posse e treinamento dos membros",
      "Elaborar plano de trabalho e promover prevenção de acidentes e assédio",
      "Investigar e registrar incidentes e denúncias de assédio/violência",
      "Realizar campanhas de prevenção",
    ],
  },
  "NR-6": {
    titulo: "Equipamento de Proteção Individual (EPI)",
    resumo:
      "Define EPI, obrigatoriedade do empregador em fornecer EPI adequado, gratuito e com Certificado de Aprovação (CA), treinamento, guarda, conservação e ficha de entrega e recebimento. Inclui EPI para motociclista.",
    pontos: [
      "Fornecer EPI adequado ao risco e certificado (CA válido)",
      "Fornecer gratuitamente em perfeito estado",
      "Realizar treinamento de uso, guarda e conservação",
      "Manter ficha de entrega e recebimento assinada",
      "Substituir EPI danificado ou extraviado",
      "Comunicar ao MTE EPI com defeito",
    ],
  },
  "NR-7": {
    titulo: "Programa de Controle Médico de Saúde Ocupacional (PCMSO)",
    resumo:
      "Estabelece o PCMSO com exames médicos (admissional, periódico, retorno ao trabalho, mudança de função, demissional) e ASO. Aplica-se a todos os empregadores. Inclui indicadores epidemiológicos e monitorização de trabalhadores expostos a riscos especiais.",
    pontos: [
      "Elaborar e manter PCMSO (planejar, programar, executar)",
      "Realizar exames médicos obrigatórios conforme risco",
      "Emitir ASO (Atestado de Saúde Ocupacional) em vias",
      "Manter perfil profissiográfico e prontuário clínico",
      "Registrar e analisar indicadores de saúde",
      "Notificar doenças ocupacionais (CAT)",
    ],
  },
  "NR-8": {
    titulo: "Edificações",
    resumo:
      "Condições de segurança e conforto nas edificações: piso, paredes, cobertura, iluminação, instalações sanitárias, vestiários, refeitórios, cozinhas, dormitórios e locais de descanso.",
    pontos: [
      "Garantir condições de edificação (piso, iluminação, sanitários)",
      "Manter instalações sanitárias e vestiários adequados",
      "Garantir conforto térmico e acústico",
    ],
  },
  "NR-9": {
    titulo: "Avaliação e Controle das Exposições Ocupacionis a Agentes Físicos, Químicos e Biológicos",
    resumo:
      "Estabelece avaliação e controle de agentes ambientais (ruído, vibração, químicos, biológicos, calor/frio, umidade, radiações). Integra o PGR. Define metodologias de avaliação e limites de exposição.",
    pontos: [
      "Avaliar exposição a agentes ambientais com metodologia reconhecida",
      "Implementar medidas de controle (na fonte, coletiva e EPI)",
      "Registrar avaliações no PGR",
      "Monitorar periodicamente a eficácia das medidas",
    ],
  },
  "NR-10": {
    titulo: "Segurança em Instalações e Serviços em Eletricidade",
    resumo:
      "Segurança em eletricidade (alta e baixa tensão). PRAE (Programa de Prevenção de Riscos Elétricos), desenergização, bloqueio, EPI, treinamento NR-10 (Básico e SEP). Inclui trabalhos com eletricidade em áreas classificadas.",
    pontos: [
      "Elaborar e manter o PRAE",
      "Desenergizar, bloquear e etiquetar (LOTO) antes de intervenções",
      "Garantir treinamento NR-10 (Básico e SEP) com reciclagem",
      "Fornecer EPI para risco elétrico",
      "Sinalizar e isolar áreas de risco elétrico",
    ],
  },
  "NR-11": {
    titulo: "Transporte, Movimentação, Armazenagem e Manuseio de Materiais",
    resumo:
      "Estabelece requisitos para transporte, movimentação manual e mecanizada, armazenagem e manuseio de materiais. Inclui equipamentos de transporte, empilhamento e empilhadeiras.",
    pontos: [
      "Garantir transporte e movimentação segura de materiais",
      "Treinar operadores de empilhadeiras e equipamentos",
      "Armazenar materiais de forma estável e segura",
      "Respeitar limites de peso para movimentação manual",
    ],
  },
  "NR-12": {
    titulo: "Segurança no Trabalho em Máquinas e Equipamentos",
    resumo:
      "Requisitos de segurança em máquinas e equipamentos: proteções, dispositivos de parada de emergência, bloqueio (LOTO), manutenção segura, validação. Inclui Anexos para máquinas específicas e importadas/usadas.",
    pontos: [
      "Garantir proteções e dispositivos de segurança em máquinas",
      "Implementar bloqueio e etiquetagem (LOTO)",
      "Dispor de manual e treinamento de operação/segurança",
      "Realizar avaliação de conformidade e validação de segurança",
      "Manter registro de inspeções e manutenções",
    ],
  },
  "NR-13": {
    titulo: "Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento",
    resumo:
      "Estabelece requisitos para inspeção, operação e manutenção de caldeiras, vasos de pressão, tubulações e tanques metálicos. Inclui PRV (Programa de Prevenção de Riscos) e responsável técnico.",
    pontos: [
      "Manter Prontuário e registro de inspeções de segurança",
      "Designar responsável técnico habilitado",
      "Operar conforme procedimentos e treinamento específico",
      "Realizar inspeções de segurança periódicas",
    ],
  },
  "NR-14": {
    titulo: "Fornos",
    resumo:
      "Estabelece requisitos de segurança para fornos industriais, incluindo revestimento, dispositivos de segurança, operação e manutenção.",
    pontos: [
      "Garantir revestimento e isolamento térmico adequados",
      "Dispor de dispositivos de segurança e controle",
      "Treinar operadores de fornos",
    ],
  },
  "NR-15": {
    titulo: "Atividades e Operações Insalubres",
    resumo:
      "Define limites de tolerância e graus de insalubridade (mínimo 10%, médio 20%, máximo 40%) para ruído, agentes químicos, biológicos, radiações, calor, frio, vibrações, umidade. Adicional de insalubridade sobre o salário mínimo.",
    pontos: [
      "Identificar agentes insalubres e grau (NR-15 anexos)",
      "Pagar adicional de insalubridade quando aplicável",
      "Implementar controle na fonte, no meio e no trabalhador",
      "Elaborar laudo técnico de insalubridade",
    ],
  },
  "NR-16": {
    titulo: "Atividades e Operações Perigosas",
    resumo:
      "Define operações perigosas (eletricidade, explosivos, inflamáveis, radiações ionizantes, motocicleta, segurança pessoal/patrimonial) e adicional de periculosidade (30% sobre salário-base).",
    pontos: [
      "Identificar atividades perigosas (NR-16 anexos)",
      "Pagar adicional de periculosidade (30%) quando aplicável",
      "Elaborar laudo técnico de periculosidade",
    ],
  },
  "NR-17": {
    titulo: "Ergonomia",
    resumo:
      "Estabelece parâmetros de ergonomia: levantamento de peso, postura, mobiliário, ritmo, trabalho em computadores (pausas), organização do trabalho. Inclui avaliação ergonômica e prevenção de LER/DORT.",
    pontos: [
      "Adequar mobiliário e postos de trabalho à ergonomia",
      "Atender limites de levantamento manual de peso",
      "Garantir pausas para trabalho em computador",
      "Avaliar e prevenir LER/DORT",
      "Organizar o trabalho para reduzir carga cognitiva e postural",
    ],
  },
  "NR-18": {
    titulo: "Segurança e Saúde no Trabalho na Indústria da Construção",
    resumo:
      "Aplica-se a obras de construção. PCMAT (Programa de Condições e Meio Ambiente de Trabalho na Indústria da Construção), proteções contra quedas, escavações, andaimes, escadas, demolições, instalações provisórias.",
    pontos: [
      "Elaborar e implementar o PCMAT",
      "Garantir proteções contra quedas (andaimes, periferia, cobertura)",
      "Sinalização de segurança na obra",
      "Dispor de instalações sanitárias provisórias adequadas",
      "Treinar trabalhadores da construção",
    ],
  },
  "NR-19": {
    titulo: "Explosivos",
    resumo:
      "Estabelece requisitos para manipulação, armazenagem, transporte e uso de explosivos. Inclui depósitos, transporte e detonação.",
    pontos: [
      "Armazenar explosivos em depósitos licenciados",
      "Treinar e habilitar operadores de explosivos",
      "Controlar detonações e áreas de risco",
    ],
  },
  "NR-20": {
    titulo: "Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis",
    resumo:
      "Manipulação e armazenamento de inflamáveis e combustíveis. PGR específico, placard, classificação de áreas, treinamento, inspeções de segurança.",
    pontos: [
      "Elaborar PGR específico de inflamáveis",
      "Classificar áreas e sinalizar placard",
      "Realizar inspeções de segurança periódicas",
      "Treinar trabalhadores (NR-20 básico, intermediário, avançado)",
    ],
  },
  "NR-21": {
    titulo: "Trabalho a Céu Aberto",
    resumo:
      "Condições de trabalho a céu aberto: proteção contra intempéries, insolação, fornecimento de água potável, abrigos, pausas para descanso em locais sombreados.",
    pontos: [
      "Proteger trabalhadores contra sol, chuva e intempéries",
      "Fornecer água potável e filtrada em quantidade suficiente",
      "Disponibilizar abrigos de descanso sombreados",
    ],
  },
  "NR-22": {
    titulo: "Segurança e Saúde Ocupacional na Mineração",
    resumo:
      "Aplica-se a mineração (extração, beneficiamento). PGR específico, licenciamento, inspeções, gestão de barragens de rejeitos, plano de fechamento.",
    pontos: [
      "Elaborar PGR específico de mineração",
      "Garantir licenciamento e inspeções regulatórias",
      "Gerir barragens de rejeitos (PMBR)",
      "Plano de fechamento de mina",
    ],
  },
  "NR-23": {
    titulo: "Proteção Contra Incêndios",
    resumo:
      "Estabelece requisitos de proteção contra incêndios: saídas de emergência, extintores, alarmes, brigada de incêndio, plano de emergência.",
    pontos: [
      "Dispor de saídas de emergência desobstruídas e sinalizadas",
      "Manter extintores e sistemas de combate a incêndio",
      "Constituir e treinar brigada de incêndio",
      "Elaborar e exercitar plano de emergência",
    ],
  },
  "NR-24": {
    titulo: "Condições Sanitárias e de Conforto nos Locais de Trabalho",
    resumo:
      "Estabelece condições sanitárias: instalações sanitárias, vestiários, refeitórios, cozinhas, lavanderias, dormitórios, locais de descanso, abastecimento de água.",
    pontos: [
      "Garantir instalações sanitárias e vestiários adequados",
      "Disponibilizar refeitórios e locais de descanso",
      "Fornecer água potável e filtrada",
      "Manter condições de higiene e conforto",
    ],
  },
  "NR-25": {
    titulo: "Resíduos Industriais",
    resumo:
      "Estabelece requisitos para identificação, segregação, armazenamento, transporte, tratamento e disposição final de resíduos industriais.",
    pontos: [
      "Identificar e classificar resíduos industriais",
      "Segregar e armazenar resíduos adequadamente",
      "Garantir transporte e disposição final conforme legislação",
    ],
  },
  "NR-26": {
    titulo: "Sinalização de Segurança",
    resumo:
      "Estabelece padrões de sinalização de segurança: cores, símbolos, cartazes, identificação de tubulações, placas de advertência, proibição e obrigação.",
    pontos: [
      "Sinalizar riscos com cores e símbolos padronizados",
      "Identificar tubulações por cor e identificação",
      "Dispor de placas de advertência e proibição",
    ],
  },
  "NR-27": {
    titulo: "Registro Profissional do Técnico de Segurança do Trabalho (REVOGADA)",
    vigencia: "Revogada",
    resumo: "Revogada. O registro profissional passou a ser regulamentado pelo Conselho Federal de TST.",
    pontos: ["Norma revogada — sem exigências vigentes."],
  },
  "NR-28": {
    titulo: "Fiscalização e Penalidades",
    resumo:
      "Disciplina a fiscalização e as penalidades por descumprimento das NRs: multas, graduação conforme naturese e gravidade, fator de agravamento, reincidência.",
    pontos: [
      "Cumprir exigências para evitar autuações e multas",
      "Conhecer graduação de multas (NR-28)",
      "Recorrer de autos de infração no prazo legal",
    ],
  },
  "NR-29": {
    titulo: "Segurança e Saúde no Trabalho Portuário",
    resumo:
      "Aplica-se a portos organizados e instalações portuárias. PGR específico, operações de carga/descarga, equipamentos, trabalho em espaço confinado e altura no porto.",
    pontos: [
      "Elaborar PGR específico portuário",
      "Garantir segurança em operações de carga/descarga",
      "Treinar trabalhadores portuários",
    ],
  },
  "NR-30": {
    titulo: "Segurança e Saúde no Trabalho Aquaviário",
    resumo:
      "Aplica-se a trabalho aquaviário (embarcações). PGR específico, equipamentos de salvatagem, trabalho em espaços confinados e altura em embarcações.",
    pontos: [
      "Elaborar PGR específico aquaviário",
      "Garantir equipamentos de salvatagem e EPI",
      "Treinar trabalhadores aquaviários",
    ],
  },
  "NR-31": {
    titulo: "Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura",
    resumo:
      "Aplica-se a atividades rurais. PGR específico, máquinas agrícolas, agrotóxicos, trabalho com animais, instalações rurais.",
    pontos: [
      "Elaborar PGR específico rural",
      "Garantir segurança em máquinas e implementos agrícolas",
      "Controlar uso de agrotóxicos (NR-31 + receituário)",
      "Proteger contra animais peçonhentos",
    ],
  },
  "NR-32": {
    titulo: "Segurança e Saúde no Trabalho em Serviços de Saúde",
    resumo:
      "Aplica-se a estabelecimentos de saúde (hospitais, laboratórios, consultórios). Riscos biológicos, químicos, ergonômicos, físicos. PGR, vacinação, EPI, gerenciamento de resíduos de serviço de saúde.",
    pontos: [
      "Elaborar PGR específico de serviços de saúde",
      "Controlar riscos biológicos e químicos",
      "Vacinar trabalhadores conforme protocolos",
      "Gerir resíduos de serviço de saúde (RSS)",
    ],
  },
  "NR-33": {
    titulo: "Segurança e Saúde nos Trabalhos em Espaços Confinados",
    resumo:
      "Define espaços confinados, permissão de entrada e trabalho (PET), monitoração de atmosfera, treinamento específico, equipamentos de proteção e resgate.",
    pontos: [
      "Identificar e sinalizar espaços confinados",
      "Emitir Permissão de Entrada e Trabalho (PET)",
      "Monitorar atmosfera antes e durante a entrada",
      "Garantir treinamento específico e equipe de resgate",
    ],
  },
  "NR-34": {
    titulo: "Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval",
    resumo:
      "Aplica-se à construção, reparação e desmonte naval. PGR específico, trabalho em altura, espaços confinados, soldagem, pintura.",
    pontos: [
      "Elaborar PGR específico da construção naval",
      "Garantir segurança em altura e espaços confinados",
      "Controlar soldagem, pintura e operações de risco",
    ],
  },
  "NR-35": {
    titulo: "Trabalho em Altura",
    resumo:
      "Trabalho acima de 2 metros. Análise de risco, permissão de trabalho, proteção contra quedas (sistema de cinto tipo paraquedista), treinamento, ancoragem, resgate planejado.",
    pontos: [
      "Realizar análise de risco e emitir permissão de trabalho em altura",
      "Usar sistema de proteção contra quedas (cinto paraquedista + ancoragem)",
      "Garantir treinamento de trabalho em altura com reciclagem",
      "Planejar e dispor de equipe de resgate",
    ],
  },
  "NR-36": {
    titulo: "Segurança e Saúde no Trabalho em Empresas de Limpeza Urbana e Manejo de Resíduos",
    resumo:
      "Aplica-se a coleta, triagem, reciclagem, tratamento e disposição de resíduos sólidos urbanos. Riscos biológicos, cortes, perfurantes, ergonômicos, químicos.",
    pontos: [
      "Elaborar PGR específico de limpeza urbana",
      "Fornecer EPI para risco biológico, cortes e perfurantes",
      "Vacinar e realizar exames dos trabalhadores",
      "Controlar ergonomia na coleta e triagem",
    ],
  },
  "NR-37": {
    titulo: "Segurança e Saúde em Plataformas de Petróleo",
    resumo:
      "Aplica-se a plataformas de petróleo. PGR específico, heliporto, evacuação, controle de emergências, instalações offshore.",
    pontos: [
      "Elaborar PGR específico de plataformas",
      "Garantir segurança em heliportos e evacuação",
      "Controlar emergências offshore",
    ],
  },
  "NR-38": {
    titulo: "Segurança e Saúde no Trabalho em Siderúrgicas, Ferro-Ligas e Metalurgia",
    resumo:
      "Aplica-se a siderúrgicas, ferro-ligas e metalurgia. PGR específico, fornos, metal líquido, equipamentos, riscos térmicos e químicos.",
    pontos: [
      "Elaborar PGR específico de siderurgia/metalurgia",
      "Controlar fornos e metal líquido",
      "Proteger contra riscos térmicos e químicos",
    ],
  },
};

// Mapeamento de palavras-chave de setor/CNAE -> NRs potencialmente aplicáveis.
const CNAE_RULES = [
  { match: ["constr", "obra", "engenharia civil", "pavimenta", "reforma"], nrs: ["NR-1", "NR-6", "NR-7", "NR-9", "NR-18", "NR-35", "NR-8", "NR-23"] },
  { match: ["altura", "telhado", "cobertura", "antena", "torre"], nrs: ["NR-35", "NR-6", "NR-1", "NR-8"] },
  { match: ["eletric", "energia", "transmissão", "subestação", "instalação elétrica"], nrs: ["NR-10", "NR-6", "NR-1", "NR-16"] },
  { match: ["máquina", "metalúrgica", "metal", "usinagem", "indústria", "fábrica", "manufatura", "transformação", "siderurg", "metalurg"], nrs: ["NR-12", "NR-6", "NR-7", "NR-9", "NR-1", "NR-15", "NR-38"] },
  { match: ["química", "inflamável", "combustível", "posto", "derivado de petróleo", "solvente", "pintura", "plataforma"], nrs: ["NR-20", "NR-16", "NR-6", "NR-9", "NR-15", "NR-1", "NR-37"] },
  { match: ["saúde", "hospital", "clínica", "laboratório", "odontolog", "consultório"], nrs: ["NR-32", "NR-6", "NR-7", "NR-9", "NR-1", "NR-23"] },
  { match: ["limpeza", "coleta", "resíduo", "reciclagem", "lixo", "varrição"], nrs: ["NR-36", "NR-6", "NR-7", "NR-9", "NR-1"] },
  { match: ["espaço confinado", "tanque", "silos", "esgoto", "boca de lobo", "biodigestor"], nrs: ["NR-33", "NR-6", "NR-9", "NR-1"] },
  { match: ["agricultura", "agropecuária", "fazenda", "rural", "ceu aberto", "campo", "silvicult", "florestal", "aquicult"], nrs: ["NR-31", "NR-21", "NR-6", "NR-7", "NR-15", "NR-1"] },
  { match: ["madeira", "marcenaria", "serraria", "móveis"], nrs: ["NR-12", "NR-6", "NR-9", "NR-15", "NR-1"] },
  { match: ["aliment", "panific", "abate", "frigoríf", "restaurante", "cozinha", "laticínio"], nrs: ["NR-12", "NR-6", "NR-7", "NR-9", "NR-17", "NR-1", "NR-25"] },
  { match: ["transporte", "logística", "carga", "motorista", "rodoviário", "depósito", "armazém", "portuário", "porto"], nrs: ["NR-17", "NR-6", "NR-7", "NR-11", "NR-1", "NR-29"] },
  { match: ["aquaviário", "embarcação", "navio", "marinha", "construção naval"], nrs: ["NR-30", "NR-34", "NR-6", "NR-1"] },
  { match: ["comércio", "varejo", "loja", "supermerc", "atacarejo"], nrs: ["NR-1", "NR-6", "NR-7", "NR-17", "NR-8", "NR-24"] },
  { match: ["escritório", "administrativo", "serviço", "consultoria", "ti", "tecnologia", "call center", "telemarketing"], nrs: ["NR-1", "NR-7", "NR-17", "NR-8", "NR-24"] },
  { match: ["minera", "mineração", "pedreira", "britagem", "extração mineral"], nrs: ["NR-22", "NR-6", "NR-7", "NR-9", "NR-15", "NR-1"] },
  { match: ["explosivo", "detonação", "desmonte"], nrs: ["NR-19", "NR-6", "NR-1", "NR-16"] },
  { match: ["caldeira", "vaso de pressão", "compressor", "tanque pressurizado"], nrs: ["NR-13", "NR-6", "NR-1"] },
  { match: ["forno", "fundi", "estufa"], nrs: ["NR-14", "NR-6", "NR-9", "NR-15", "NR-1"] },
  { match: ["sinalização", "placa", "tubulação"], nrs: ["NR-26", "NR-1"] },
];

const BASE_NRS = ["NR-1", "NR-6", "NR-7", "NR-8", "NR-9", "NR-17"];

export function nrsForCnae(cnae, descricao = "") {
  const text = `${cnae} ${descricao}`.toLowerCase();
  const found = new Set(BASE_NRS);
  for (const rule of CNAE_RULES) {
    if (rule.match.some((m) => text.includes(m))) {
      rule.nrs.forEach((nr) => found.add(nr));
    }
  }
  // Remover NRs revogadas das recomendações
  return Array.from(found).filter((nr) => !["NR-2", "NR-27"].includes(nr));
}

export function buildChecklistItems(cnae, descricao = "") {
  const nrs = nrsForCnae(cnae, descricao);
  const items = [];
  for (const nr of nrs) {
    const info = NR_KNOWLEDGE[nr];
    if (!info) continue;
    for (const ponto of info.pontos) {
      items.push({
        nr_codigo: nr,
        item_exigido: `${nr} — ${info.titulo}: ${ponto}`,
        status: "pendente",
      });
    }
  }
  return items;
}

export function nrContextForPrompt() {
  const lines = Object.entries(NR_KNOWLEDGE)
    .filter(([codigo]) => !["NR-2", "NR-27"].includes(codigo))
    .map(
      ([codigo, v]) =>
        `${codigo} — ${v.titulo}${v.vigencia ? ` (vigência: ${v.vigencia})` : ""}: ${v.resumo} Pontos principais: ${v.pontos.join("; ")}.`
    );
  return lines.join("\n");
}

// Lista de NRs revogadas (para exibição informativa)
export const NRS_REVOGADAS = ["NR-2", "NR-27"];