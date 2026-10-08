-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "company_id" TEXT,
    "empresa_nome" TEXT,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT NOT NULL,
    "cpf" TEXT,
    "cargo_nome" TEXT,
    "tipo_aso" TEXT,
    "data" DATE NOT NULL,
    "hora" TEXT,
    "duracao_min" DOUBLE PRECISION,
    "profissional_id" TEXT,
    "sala" TEXT,
    "status" TEXT,
    "financeiro" JSONB,
    "origem" TEXT,
    "atendimento_id" TEXT,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "vinculo_tipo" TEXT,
    "vinculo_id" TEXT,
    "categoria" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "file_uri" TEXT NOT NULL,
    "mime" TEXT,
    "tamanho" DOUBLE PRECISION,
    "incluir_no_documento" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacaoPsicossocial" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "company_id" TEXT NOT NULL,
    "nome" TEXT,
    "instrumento" JSONB,
    "setores" JSONB,
    "token" TEXT NOT NULL,
    "inicio" DATE,
    "fim" DATE,
    "status" TEXT,
    "publico_estimado" DOUBLE PRECISION,
    "riscos_gerados" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "AplicacaoPsicossocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptidaoCatalogo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "grupo" TEXT,
    "ativo" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "AptidaoCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "titular_nome" TEXT,
    "titular_email" TEXT NOT NULL,
    "empresa" TEXT,
    "cpf_cnpj" TEXT,
    "telefone" TEXT,
    "vidas_declaradas" DOUBLE PRECISION,
    "valor_mensal" DOUBLE PRECISION,
    "status" TEXT,
    "gateway" TEXT,
    "gateway_customer_id" TEXT,
    "gateway_subscription_id" TEXT,
    "link_pagamento" TEXT,
    "org_id" TEXT,
    "termos_versao" TEXT,
    "termos_aceite_em" TEXT,
    "ip_aceite" TEXT,
    "inadimplente_desde" DATE,
    "ultimo_pagamento_em" TEXT,
    "historico" JSONB,
    "plano" TEXT,
    "faturas_extras" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "agendamento_id" TEXT,
    "company_id" TEXT,
    "empresa_nome" TEXT,
    "empresa_cnpj" TEXT,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT NOT NULL,
    "cpf" TEXT,
    "matricula" TEXT,
    "data_nascimento" TEXT,
    "sexo" TEXT,
    "cargo_id" TEXT,
    "cargo_nome" TEXT,
    "tipo_aso" TEXT,
    "status" TEXT,
    "tempos" JSONB,
    "riscos" JSONB,
    "triagem" JSONB,
    "anamnese" JSONB,
    "exame_fisico" JSONB,
    "exames" JSONB,
    "aptidoes" JSONB,
    "conclusao" TEXT,
    "restricoes" TEXT,
    "medico" JSONB,
    "aso_numero" TEXT,
    "aso_data" DATE,
    "financeiro" JSONB,
    "esocial_status" TEXT,
    "origem" TEXT,
    "aso_codigo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atestado" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT NOT NULL,
    "data_inicio" DATE NOT NULL,
    "dias" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "codigo_afastamento_esocial" TEXT,
    "cid" TEXT,
    "mesma_doenca_manual" TEXT,
    "medico_nome" TEXT,
    "crm" TEXT,
    "crm_uf" TEXT,
    "arquivo_uri" TEXT,
    "cat_id" TEXT,
    "beneficio_inss" TEXT,
    "esocial_status" TEXT,
    "data_retorno" DATE,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Atestado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Autenticacao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "org_id" TEXT,
    "company_id" TEXT,
    "empresa_nome" TEXT,
    "documento_tipo" TEXT,
    "documento_id" TEXT NOT NULL,
    "documento_nome" TEXT,
    "versao" TEXT,
    "emitido_em" TEXT,
    "emitido_por" JSONB,
    "responsavel" JSONB,
    "hash" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Autenticacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoInfracao" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "numero_ai" TEXT NOT NULL,
    "data_autuacao" DATE,
    "orgao_autuador" TEXT,
    "nr_item_citado" TEXT,
    "descricao_irregularidade" TEXT,
    "valor_multa" TEXT,
    "prazo_defesa" DATE,
    "pdf_url" TEXT,
    "defesa" JSONB,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "AutoInfracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoFuncao" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nome_cargo" TEXT NOT NULL,
    "cbo" TEXT,
    "quantidade_funcionarios" DOUBLE PRECISION,
    "riscos_identificados" JSONB,
    "atividades" TEXT,
    "epis_obrigatorios" JSONB,
    "procedimentos_emergencia" TEXT,
    "unidade_id" TEXT,
    "setor_id" TEXT,
    "jornada" TEXT,
    "ghe" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "CargoFuncao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "corporateName" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinica" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "dono_id" TEXT NOT NULL,
    "dono_email" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CnaeNrMap" (
    "id" TEXT NOT NULL,
    "cnae" TEXT NOT NULL,
    "nr_codigo" TEXT NOT NULL,
    "observacao" TEXT,
    "origem" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "CnaeNrMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoEsocial" (
    "id" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "grupo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "CodigoEsocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "e_matriz" BOOLEAN,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT,
    "cpf" TEXT,
    "cei" TEXT,
    "cnae" TEXT NOT NULL,
    "porte" TEXT,
    "grau_de_risco" TEXT,
    "uf" TEXT NOT NULL,
    "municipio" TEXT,
    "setor_descricao" TEXT,
    "fap" DOUBLE PRECISION,
    "rat" DOUBLE PRECISION,
    "folha_mensal" DOUBLE PRECISION,
    "vinculos_medios" DOUBLE PRECISION,
    "fap_simulacao" JSONB,
    "tipo_cliente" TEXT,
    "situacao_financeira" TEXT,
    "kit_saldo" DOUBLE PRECISION,
    "valor_avulso" DOUBLE PRECISION,
    "org_id" TEXT,
    "portal_token" TEXT,
    "portal_ativo" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceItem" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nr_codigo" TEXT NOT NULL,
    "item_exigido" TEXT NOT NULL,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ComplianceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoCliente" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "valor_base" DOUBLE PRECISION NOT NULL,
    "limite_incluido" DOUBLE PRECISION,
    "valor_excedente_unitario" DOUBLE PRECISION,
    "unidade_excedente" TEXT,
    "vigencia_inicio" DATE,
    "vigencia_fim" DATE,
    "status" TEXT,
    "observacao" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ContratoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoTerceiro" (
    "id" TEXT NOT NULL,
    "terceira_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "file_uri" TEXT,
    "data_emissao" DATE,
    "data_validade" DATE,
    "observacao" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "DocumentoTerceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaEpi" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT NOT NULL,
    "epi_id" TEXT,
    "epi_nome" TEXT NOT NULL,
    "ca" TEXT,
    "quantidade" DOUBLE PRECISION,
    "data_entrega" DATE NOT NULL,
    "motivo" TEXT,
    "proxima_troca" DATE,
    "orientado_uso" BOOLEAN,
    "assinatura_uri" TEXT,
    "assinado_em" TEXT,
    "devolvido_em" DATE,
    "observacao" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "EntregaEpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiItem" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "ca" TEXT,
    "validade_ca" DATE,
    "fabricante" TEXT,
    "vida_util_dias" DOUBLE PRECISION,
    "estoque_atual" DOUBLE PRECISION,
    "estoque_minimo" DOUBLE PRECISION,
    "unidade" TEXT,
    "ativo" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "EpiItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fabricante" TEXT,
    "modelo" TEXT NOT NULL,
    "numero_serie" TEXT,
    "certificado_numero" TEXT,
    "laboratorio" TEXT,
    "data_calibracao" DATE,
    "validade_calibracao" DATE,
    "certificado_uri" TEXT,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoEsocial" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT NOT NULL,
    "trabalhador_nome" TEXT NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "data_evento" DATE NOT NULL,
    "descricao" TEXT,
    "recibo" TEXT,
    "status" TEXT,
    "detalhes" JSONB,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "EventoEsocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoPagamento" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "tipo" TEXT,
    "assinatura_id" TEXT,
    "resumo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "EventoPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExameCatalogo" (
    "id" TEXT NOT NULL,
    "exame" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo_esocial" TEXT,
    "codigo_esocial_id" TEXT,
    "codigo_esocial_descricao" TEXT,
    "periodicidade_meses" DOUBLE PRECISION,
    "momentos_default" JSONB,
    "justificativa_modelo" TEXT,
    "ativo" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ExameCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamePcmso" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "cargo_id" TEXT NOT NULL,
    "risco_ids" JSONB,
    "exame" TEXT NOT NULL,
    "codigo_esocial" TEXT,
    "codigo_esocial_descricao" TEXT,
    "catalogo_id" TEXT,
    "momentos" JSONB,
    "periodicidade_meses" DOUBLE PRECISION,
    "justificativa" TEXT,
    "origem" TEXT,
    "ativo" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ExamePcmso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "serviceExecutionId" TEXT,
    "clientId" TEXT,
    "providerId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" DATE NOT NULL,
    "paymentDate" DATE,
    "status" TEXT,
    "categoryId" TEXT,
    "description" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolhaMensal" (
    "id" TEXT NOT NULL,
    "mes_ano" TEXT NOT NULL,
    "valor_folha" DOUBLE PRECISION NOT NULL,
    "encargos" DOUBLE PRECISION,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "FolhaMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "cargo_id" TEXT,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT,
    "tipo_documento" TEXT NOT NULL,
    "conteudo" JSONB,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspecaoChecklist" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "setor_id" TEXT,
    "modelo_id" TEXT,
    "modelo_nome" TEXT NOT NULL,
    "norma" TEXT,
    "data" DATE,
    "inspetor" TEXT,
    "local" TEXT,
    "respostas" JSONB,
    "status" TEXT,
    "conformidade_pct" DOUBLE PRECISION,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "InspecaoChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentoPsicossocial" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "nome" TEXT NOT NULL,
    "referencia" TEXT,
    "validado" BOOLEAN,
    "itens" JSONB,
    "dimensoes" JSONB,
    "min_respostas_grupo" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "InstrumentoPsicossocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioSnapshot" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "programa_id" TEXT,
    "versao" TEXT,
    "data_emissao" DATE,
    "data_snapshot" TEXT NOT NULL,
    "inventario" JSONB NOT NULL,
    "resumo" JSONB,
    "responsavel_tecnico" JSONB,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "InventarioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data_vencimento" DATE NOT NULL,
    "data_pagamento" DATE,
    "recorrencia" TEXT,
    "company_id" TEXT,
    "prestador_id" TEXT,
    "contrato_id" TEXT,
    "quantidade" DOUBLE PRECISION,
    "status" TEXT,
    "descricao" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Levantamento" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "setor_id" TEXT,
    "cargo_id" TEXT,
    "token" TEXT NOT NULL,
    "destinatario_nome" TEXT,
    "destinatario_tipo" TEXT,
    "status" TEXT,
    "respostas" JSONB,
    "fotos" JSONB,
    "expira_em" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Levantamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAcessoClinico" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT,
    "perfil" TEXT,
    "atendimento_id" TEXT,
    "acao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "LogAcessoClinico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotacaoHistorico" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT NOT NULL,
    "trabalhador_nome" TEXT NOT NULL,
    "cargo_id" TEXT,
    "setor_id" TEXT,
    "unidade_id" TEXT,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "tipo_movimentacao" TEXT NOT NULL,
    "observacao" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "LotacaoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandatoCipa" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "tipo" TEXT,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,
    "grau_risco" TEXT,
    "membros" JSONB,
    "eleicao" JSONB,
    "status" TEXT,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "MandatoCipa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatrizTreinamento" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "cargo_id" TEXT NOT NULL,
    "nr" TEXT NOT NULL,
    "titulo" TEXT,
    "carga_horaria" DOUBLE PRECISION,
    "reciclagem_meses" DOUBLE PRECISION,
    "obrigatorio" BOOLEAN,
    "fundamento" TEXT,
    "origem" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "MatrizTreinamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicao" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "setor_id" TEXT,
    "cargo_ids" JSONB,
    "risco_id" TEXT,
    "tipo" TEXT NOT NULL,
    "agente" TEXT,
    "data" DATE,
    "equipamento_id" TEXT,
    "metodologia" TEXT,
    "avaliado" TEXT,
    "condicoes" TEXT,
    "parametros" JSONB,
    "resultado" JSONB,
    "responsavel" TEXT,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Medicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroClinica" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "perfil" TEXT NOT NULL,
    "crm" TEXT,
    "crm_uf" TEXT,
    "ativo" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "MembroClinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroOrganizacao" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "perfil" TEXT NOT NULL,
    "ativo" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "MembroOrganizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloChecklist" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "norma" TEXT,
    "descricao" TEXT,
    "itens" JSONB,
    "origem" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ModeloChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormaTrecho" (
    "id" TEXT NOT NULL,
    "nr_codigo" TEXT NOT NULL,
    "titulo" TEXT,
    "item" TEXT,
    "texto" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "NormaTrecho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcorrenciaAcidente" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT,
    "data_hora" TEXT,
    "local" TEXT,
    "funcao_acidentado" TEXT,
    "descricao" TEXT NOT NULL,
    "parte_corpo" TEXT,
    "agente_causador" TEXT,
    "situacao_geradora" TEXT,
    "natureza_lesao" TEXT,
    "afastamento" BOOLEAN,
    "testemunhas" TEXT,
    "envolve_maquina" BOOLEAN,
    "investigacao" JSONB,
    "status" TEXT,
    "org_id" TEXT,
    "cat_numero" TEXT,
    "cat_data" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "OcorrenciaAcidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organizacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dono_id" TEXT NOT NULL,
    "dono_email" TEXT,
    "permissoes" JSONB,
    "assinatura_id" TEXT,
    "status_assinatura" TEXT,
    "plano_uso" TEXT,
    "canal_escuta" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoAcao" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "origem" TEXT,
    "origem_id" TEXT,
    "origem_descricao" TEXT,
    "risco_id" TEXT,
    "risco_agente" TEXT,
    "descricao" TEXT NOT NULL,
    "justificativa" TEXT,
    "tipo_medida" TEXT,
    "estrutura" TEXT,
    "metodologia" JSONB,
    "escopo" JSONB,
    "responsavel" TEXT,
    "responsavel_email" TEXT,
    "responsaveis_extras" JSONB,
    "data_inicio" DATE,
    "prazo" DATE,
    "prioridade" TEXT,
    "status" TEXT,
    "pendente_aprovacao" BOOLEAN,
    "aprovado_por" TEXT,
    "evidencia" TEXT,
    "evidencias" JSONB,
    "lembretes" JSONB,
    "notificacoes_enviadas" JSONB,
    "concluida_em" DATE,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "PlanoAcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "tipo_servico" TEXT,
    "valor_recorrente_mensal" DOUBLE PRECISION NOT NULL,
    "dia_vencimento" DOUBLE PRECISION,
    "status" TEXT,
    "observacao" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Prestador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramaSST" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "versao" TEXT,
    "data_emissao" DATE,
    "vigencia_ate" DATE,
    "matriz" TEXT,
    "responsavel" JSONB,
    "medico_coordenador" JSONB,
    "textos" JSONB,
    "status" TEXT,
    "assinatura" JSONB,
    "documento_assinado" JSONB,
    "org_id" TEXT,
    "autenticacao_codigo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ProgramaSST_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "serviceType" TEXT,
    "defaultPaymentTermDays" DOUBLE PRECISION,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecusaTrabalho" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT NOT NULL,
    "cargo_id" TEXT,
    "setor_id" TEXT,
    "data_recusa" DATE NOT NULL,
    "hora_recusa" TEXT,
    "local" TEXT,
    "situacao_perigosa" TEXT NOT NULL,
    "risco_identificado" TEXT,
    "medida_controle_existente" TEXT,
    "acao_empregador" TEXT,
    "status" TEXT,
    "anexo_uri" TEXT,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "RecusaTrabalho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatorioSaude" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,
    "setor_id" TEXT,
    "analise" JSONB,
    "responsavel" JSONB,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "RelatorioSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPsicossocial" (
    "id" TEXT NOT NULL,
    "aplicacao_id" TEXT NOT NULL,
    "org_id" TEXT,
    "company_id" TEXT,
    "setor_id" TEXT,
    "respostas" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "RespostaPsicossocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReuniaoCipa" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "mandato_id" TEXT,
    "data" DATE NOT NULL,
    "tipo" TEXT,
    "pauta" TEXT,
    "ata" TEXT,
    "presentes" JSONB,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ReuniaoCipa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risco" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "setor_id" TEXT,
    "cargo_ids" JSONB,
    "tipo" TEXT NOT NULL,
    "agente" TEXT NOT NULL,
    "codigo_esocial" TEXT,
    "codigo_esocial_descricao" TEXT,
    "catalogo_id" TEXT,
    "aptidao_ids" JSONB,
    "fonte_geradora" TEXT,
    "possiveis_danos" TEXT,
    "meio_propagacao" TEXT,
    "exposicao" TEXT,
    "tipo_avaliacao" TEXT,
    "intensidade" TEXT,
    "unidade_medida" TEXT,
    "limite_tolerancia" TEXT,
    "tecnica_medicao" TEXT,
    "severidade" DOUBLE PRECISION,
    "probabilidade" DOUBLE PRECISION,
    "nivel_risco" TEXT,
    "criterio_avaliacao" TEXT,
    "data_avaliacao" DATE,
    "motivo_revisao" TEXT,
    "medidas_existentes" JSONB,
    "epc" JSONB,
    "epi" JSONB,
    "plano_acao" JSONB,
    "insalubridade" JSONB,
    "periculosidade" JSONB,
    "aposentadoria_especial" JSONB,
    "origem" TEXT,
    "revisado" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiscoCatalogo" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "agente" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo_esocial" TEXT,
    "codigo_esocial_id" TEXT,
    "codigo_esocial_descricao" TEXT,
    "fonte_geradora" TEXT,
    "possiveis_danos" TEXT,
    "meio_propagacao" TEXT,
    "exame_ids" JSONB,
    "aptidao_ids" JSONB,
    "ativo" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "RiscoCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "ordem" DOUBLE PRECISION,
    "ativo" BOOLEAN,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceExecution" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "status" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "ServiceExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "unidade_id" TEXT,
    "nome" TEXT NOT NULL,
    "descricao_ambiente" TEXT,
    "fotos" JSONB,
    "analise_ia" JSONB,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Terceira" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT,
    "responsavel" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "contrato_numero" TEXT,
    "contrato_inicio" DATE,
    "contrato_fim" DATE,
    "area_atuacao" TEXT,
    "setor_ids" JSONB,
    "cargo_ids" JSONB,
    "responsavel_tecnico_nome" TEXT,
    "responsavel_tecnico_conselho" TEXT,
    "responsavel_tecnico_numero" TEXT,
    "status" TEXT,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Terceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextoTecnico" (
    "id" TEXT NOT NULL,
    "tipo_documento" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "risco_tipo" TEXT,
    "agente" TEXT,
    "tags" JSONB,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "TextoTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trabalhador" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "cargo_id" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "data_admissao" DATE,
    "data_demissao" DATE,
    "setor_id" TEXT,
    "unidade_id" TEXT,
    "matricula" TEXT,
    "categoria_trabalhador" TEXT,
    "data_nascimento" DATE,
    "sexo" TEXT,
    "status" TEXT,
    "estabilidade" JSONB,
    "cipa_cargo" TEXT,
    "brigada" BOOLEAN,
    "biometria" JSONB,
    "deficiencia" JSONB,
    "org_id" TEXT,
    "nit" TEXT,
    "ctps" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Trabalhador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treinamento" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT,
    "trabalhador_nome" TEXT NOT NULL,
    "nr" TEXT NOT NULL,
    "data_realizacao" DATE NOT NULL,
    "validade" DATE,
    "titulo" TEXT,
    "carga_horaria" DOUBLE PRECISION,
    "instrutor" TEXT,
    "cargo_id" TEXT,
    "certificado_uri" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Treinamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrilhaDocumento" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "company_id" TEXT,
    "documento_tipo" TEXT,
    "documento_id" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "usuario_email" TEXT,
    "usuario_nome" TEXT,
    "versao" TEXT,
    "hash" TEXT,
    "detalhes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "TrilhaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_inscricao" TEXT,
    "numero_inscricao" TEXT,
    "endereco" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "cnae" TEXT,
    "grau_risco" TEXT,
    "num_trabalhadores" DOUBLE PRECISION,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacina" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "trabalhador_id" TEXT NOT NULL,
    "trabalhador_nome" TEXT NOT NULL,
    "vacina" TEXT NOT NULL,
    "dose" TEXT,
    "data_aplicacao" DATE NOT NULL,
    "proxima_dose" DATE,
    "lote" TEXT,
    "observacoes" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "Vacina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Agendamento_company_id_idx" ON "Agendamento"("company_id");

-- CreateIndex
CREATE INDEX "Agendamento_trabalhador_id_idx" ON "Agendamento"("trabalhador_id");

-- CreateIndex
CREATE INDEX "Anexo_org_id_idx" ON "Anexo"("org_id");

-- CreateIndex
CREATE INDEX "Anexo_company_id_idx" ON "Anexo"("company_id");

-- CreateIndex
CREATE INDEX "AplicacaoPsicossocial_org_id_idx" ON "AplicacaoPsicossocial"("org_id");

-- CreateIndex
CREATE INDEX "AplicacaoPsicossocial_company_id_idx" ON "AplicacaoPsicossocial"("company_id");

-- CreateIndex
CREATE INDEX "AptidaoCatalogo_org_id_idx" ON "AptidaoCatalogo"("org_id");

-- CreateIndex
CREATE INDEX "Assinatura_org_id_idx" ON "Assinatura"("org_id");

-- CreateIndex
CREATE INDEX "Atendimento_company_id_idx" ON "Atendimento"("company_id");

-- CreateIndex
CREATE INDEX "Atendimento_trabalhador_id_idx" ON "Atendimento"("trabalhador_id");

-- CreateIndex
CREATE INDEX "Atestado_org_id_idx" ON "Atestado"("org_id");

-- CreateIndex
CREATE INDEX "Atestado_company_id_idx" ON "Atestado"("company_id");

-- CreateIndex
CREATE INDEX "Atestado_trabalhador_id_idx" ON "Atestado"("trabalhador_id");

-- CreateIndex
CREATE INDEX "Autenticacao_org_id_idx" ON "Autenticacao"("org_id");

-- CreateIndex
CREATE INDEX "Autenticacao_company_id_idx" ON "Autenticacao"("company_id");

-- CreateIndex
CREATE INDEX "AutoInfracao_org_id_idx" ON "AutoInfracao"("org_id");

-- CreateIndex
CREATE INDEX "AutoInfracao_company_id_idx" ON "AutoInfracao"("company_id");

-- CreateIndex
CREATE INDEX "CargoFuncao_org_id_idx" ON "CargoFuncao"("org_id");

-- CreateIndex
CREATE INDEX "CargoFuncao_company_id_idx" ON "CargoFuncao"("company_id");

-- CreateIndex
CREATE INDEX "Client_org_id_idx" ON "Client"("org_id");

-- CreateIndex
CREATE INDEX "Company_org_id_idx" ON "Company"("org_id");

-- CreateIndex
CREATE INDEX "ComplianceItem_org_id_idx" ON "ComplianceItem"("org_id");

-- CreateIndex
CREATE INDEX "ComplianceItem_company_id_idx" ON "ComplianceItem"("company_id");

-- CreateIndex
CREATE INDEX "ContratoCliente_org_id_idx" ON "ContratoCliente"("org_id");

-- CreateIndex
CREATE INDEX "ContratoCliente_company_id_idx" ON "ContratoCliente"("company_id");

-- CreateIndex
CREATE INDEX "DocumentoTerceiro_org_id_idx" ON "DocumentoTerceiro"("org_id");

-- CreateIndex
CREATE INDEX "DocumentoTerceiro_company_id_idx" ON "DocumentoTerceiro"("company_id");

-- CreateIndex
CREATE INDEX "EntregaEpi_org_id_idx" ON "EntregaEpi"("org_id");

-- CreateIndex
CREATE INDEX "EntregaEpi_company_id_idx" ON "EntregaEpi"("company_id");

-- CreateIndex
CREATE INDEX "EntregaEpi_trabalhador_id_idx" ON "EntregaEpi"("trabalhador_id");

-- CreateIndex
CREATE INDEX "EpiItem_org_id_idx" ON "EpiItem"("org_id");

-- CreateIndex
CREATE INDEX "EpiItem_company_id_idx" ON "EpiItem"("company_id");

-- CreateIndex
CREATE INDEX "Equipamento_org_id_idx" ON "Equipamento"("org_id");

-- CreateIndex
CREATE INDEX "EventoEsocial_org_id_idx" ON "EventoEsocial"("org_id");

-- CreateIndex
CREATE INDEX "EventoEsocial_company_id_idx" ON "EventoEsocial"("company_id");

-- CreateIndex
CREATE INDEX "EventoEsocial_trabalhador_id_idx" ON "EventoEsocial"("trabalhador_id");

-- CreateIndex
CREATE INDEX "ExameCatalogo_org_id_idx" ON "ExameCatalogo"("org_id");

-- CreateIndex
CREATE INDEX "ExamePcmso_org_id_idx" ON "ExamePcmso"("org_id");

-- CreateIndex
CREATE INDEX "ExamePcmso_company_id_idx" ON "ExamePcmso"("company_id");

-- CreateIndex
CREATE INDEX "FinancialTransaction_org_id_idx" ON "FinancialTransaction"("org_id");

-- CreateIndex
CREATE INDEX "FolhaMensal_org_id_idx" ON "FolhaMensal"("org_id");

-- CreateIndex
CREATE INDEX "GeneratedDocument_org_id_idx" ON "GeneratedDocument"("org_id");

-- CreateIndex
CREATE INDEX "GeneratedDocument_company_id_idx" ON "GeneratedDocument"("company_id");

-- CreateIndex
CREATE INDEX "GeneratedDocument_trabalhador_id_idx" ON "GeneratedDocument"("trabalhador_id");

-- CreateIndex
CREATE INDEX "InspecaoChecklist_org_id_idx" ON "InspecaoChecklist"("org_id");

-- CreateIndex
CREATE INDEX "InspecaoChecklist_company_id_idx" ON "InspecaoChecklist"("company_id");

-- CreateIndex
CREATE INDEX "InstrumentoPsicossocial_org_id_idx" ON "InstrumentoPsicossocial"("org_id");

-- CreateIndex
CREATE INDEX "InventarioSnapshot_org_id_idx" ON "InventarioSnapshot"("org_id");

-- CreateIndex
CREATE INDEX "InventarioSnapshot_company_id_idx" ON "InventarioSnapshot"("company_id");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_org_id_idx" ON "LancamentoFinanceiro"("org_id");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_company_id_idx" ON "LancamentoFinanceiro"("company_id");

-- CreateIndex
CREATE INDEX "Levantamento_org_id_idx" ON "Levantamento"("org_id");

-- CreateIndex
CREATE INDEX "Levantamento_company_id_idx" ON "Levantamento"("company_id");

-- CreateIndex
CREATE INDEX "LotacaoHistorico_org_id_idx" ON "LotacaoHistorico"("org_id");

-- CreateIndex
CREATE INDEX "LotacaoHistorico_company_id_idx" ON "LotacaoHistorico"("company_id");

-- CreateIndex
CREATE INDEX "LotacaoHistorico_trabalhador_id_idx" ON "LotacaoHistorico"("trabalhador_id");

-- CreateIndex
CREATE INDEX "MandatoCipa_org_id_idx" ON "MandatoCipa"("org_id");

-- CreateIndex
CREATE INDEX "MandatoCipa_company_id_idx" ON "MandatoCipa"("company_id");

-- CreateIndex
CREATE INDEX "MatrizTreinamento_org_id_idx" ON "MatrizTreinamento"("org_id");

-- CreateIndex
CREATE INDEX "MatrizTreinamento_company_id_idx" ON "MatrizTreinamento"("company_id");

-- CreateIndex
CREATE INDEX "Medicao_org_id_idx" ON "Medicao"("org_id");

-- CreateIndex
CREATE INDEX "Medicao_company_id_idx" ON "Medicao"("company_id");

-- CreateIndex
CREATE INDEX "MembroOrganizacao_org_id_idx" ON "MembroOrganizacao"("org_id");

-- CreateIndex
CREATE INDEX "ModeloChecklist_org_id_idx" ON "ModeloChecklist"("org_id");

-- CreateIndex
CREATE INDEX "OcorrenciaAcidente_org_id_idx" ON "OcorrenciaAcidente"("org_id");

-- CreateIndex
CREATE INDEX "OcorrenciaAcidente_company_id_idx" ON "OcorrenciaAcidente"("company_id");

-- CreateIndex
CREATE INDEX "OcorrenciaAcidente_trabalhador_id_idx" ON "OcorrenciaAcidente"("trabalhador_id");

-- CreateIndex
CREATE INDEX "PlanoAcao_org_id_idx" ON "PlanoAcao"("org_id");

-- CreateIndex
CREATE INDEX "PlanoAcao_company_id_idx" ON "PlanoAcao"("company_id");

-- CreateIndex
CREATE INDEX "Prestador_org_id_idx" ON "Prestador"("org_id");

-- CreateIndex
CREATE INDEX "ProgramaSST_org_id_idx" ON "ProgramaSST"("org_id");

-- CreateIndex
CREATE INDEX "ProgramaSST_company_id_idx" ON "ProgramaSST"("company_id");

-- CreateIndex
CREATE INDEX "Provider_org_id_idx" ON "Provider"("org_id");

-- CreateIndex
CREATE INDEX "RecusaTrabalho_org_id_idx" ON "RecusaTrabalho"("org_id");

-- CreateIndex
CREATE INDEX "RecusaTrabalho_company_id_idx" ON "RecusaTrabalho"("company_id");

-- CreateIndex
CREATE INDEX "RecusaTrabalho_trabalhador_id_idx" ON "RecusaTrabalho"("trabalhador_id");

-- CreateIndex
CREATE INDEX "RelatorioSaude_org_id_idx" ON "RelatorioSaude"("org_id");

-- CreateIndex
CREATE INDEX "RelatorioSaude_company_id_idx" ON "RelatorioSaude"("company_id");

-- CreateIndex
CREATE INDEX "RespostaPsicossocial_org_id_idx" ON "RespostaPsicossocial"("org_id");

-- CreateIndex
CREATE INDEX "RespostaPsicossocial_company_id_idx" ON "RespostaPsicossocial"("company_id");

-- CreateIndex
CREATE INDEX "ReuniaoCipa_org_id_idx" ON "ReuniaoCipa"("org_id");

-- CreateIndex
CREATE INDEX "ReuniaoCipa_company_id_idx" ON "ReuniaoCipa"("company_id");

-- CreateIndex
CREATE INDEX "Risco_org_id_idx" ON "Risco"("org_id");

-- CreateIndex
CREATE INDEX "Risco_company_id_idx" ON "Risco"("company_id");

-- CreateIndex
CREATE INDEX "RiscoCatalogo_org_id_idx" ON "RiscoCatalogo"("org_id");

-- CreateIndex
CREATE INDEX "ServiceCategory_org_id_idx" ON "ServiceCategory"("org_id");

-- CreateIndex
CREATE INDEX "ServiceExecution_org_id_idx" ON "ServiceExecution"("org_id");

-- CreateIndex
CREATE INDEX "Setor_org_id_idx" ON "Setor"("org_id");

-- CreateIndex
CREATE INDEX "Setor_company_id_idx" ON "Setor"("company_id");

-- CreateIndex
CREATE INDEX "Terceira_org_id_idx" ON "Terceira"("org_id");

-- CreateIndex
CREATE INDEX "Terceira_company_id_idx" ON "Terceira"("company_id");

-- CreateIndex
CREATE INDEX "TextoTecnico_org_id_idx" ON "TextoTecnico"("org_id");

-- CreateIndex
CREATE INDEX "Trabalhador_org_id_idx" ON "Trabalhador"("org_id");

-- CreateIndex
CREATE INDEX "Trabalhador_company_id_idx" ON "Trabalhador"("company_id");

-- CreateIndex
CREATE INDEX "Treinamento_org_id_idx" ON "Treinamento"("org_id");

-- CreateIndex
CREATE INDEX "Treinamento_company_id_idx" ON "Treinamento"("company_id");

-- CreateIndex
CREATE INDEX "Treinamento_trabalhador_id_idx" ON "Treinamento"("trabalhador_id");

-- CreateIndex
CREATE INDEX "TrilhaDocumento_org_id_idx" ON "TrilhaDocumento"("org_id");

-- CreateIndex
CREATE INDEX "TrilhaDocumento_company_id_idx" ON "TrilhaDocumento"("company_id");

-- CreateIndex
CREATE INDEX "Unidade_org_id_idx" ON "Unidade"("org_id");

-- CreateIndex
CREATE INDEX "Unidade_company_id_idx" ON "Unidade"("company_id");

-- CreateIndex
CREATE INDEX "Vacina_org_id_idx" ON "Vacina"("org_id");

-- CreateIndex
CREATE INDEX "Vacina_company_id_idx" ON "Vacina"("company_id");

-- CreateIndex
CREATE INDEX "Vacina_trabalhador_id_idx" ON "Vacina"("trabalhador_id");

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT DEFAULT 'user',
    "tipo" TEXT DEFAULT 'autonomo',
    "plano" TEXT DEFAULT 'gratuito',
    "org_id" TEXT DEFAULT 'org_default',
    "org_perfil" TEXT DEFAULT 'admin',
    "org_ativo" BOOLEAN DEFAULT true,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_org_id_idx" ON "User"("org_id");
