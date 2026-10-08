# Campos de cada tabela do protótipo


## AcaoSuporte

| Campo | Tipo | Descrição |
|---|---|---|
| action_key | string | Chave da ação |
| endpoint_url | string | Endpoint do webhook |
| http_method | string | Método HTTP — valores: GET, POST, PUT |
| description | string | Descrição |
| is_active | boolean | Ativa |

Regras de acesso no protótipo: `{"read": {"user_condition": {"role": "admin"}}, "create": {"user_condition": {"role": "admin"}}, "update": {"user_condition": {"role": "admin"}}, "delete": {"user_condition": {"role": "admin"}}}`

## Agendamento

| Campo | Tipo | Descrição |
|---|---|---|
| clinica_id | string | Clínica |
| company_id | string | Empresa |
| empresa_nome | string | Empresa (nome) |
| trabalhador_id | string | Colaborador |
| trabalhador_nome | string | Colaborador (nome) |
| cpf | string | CPF |
| cargo_nome | string | Cargo |
| tipo_aso | string | Tipo de ASO — valores: admissional, periodico, retorno, mudanca_risco, demissional |
| data | string (data) | Data |
| hora | string | Hora |
| duracao_min | number | Duração (min) |
| profissional_id | string | Médico |
| sala | string | Sala |
| status | string | Status — valores: agendado, confirmado, chegou, em_atendimento, concluido, faltou, cancelado |
| financeiro | object | Financeiro: {tipo: contrato/kit/avulso, valor, pago, guia_codigo, observacao} |
| origem | string | Origem — valores: manual, convocacao |
| atendimento_id | string | Atendimento |
| observacao | string | Observação |

Regras de acesso no protótipo: `{"read": false, "create": false, "update": false, "delete": false}`

## AiDiagnostico

| Campo | Tipo | Descrição |
|---|---|---|
| ticket_id | string | Ticket |
| extracted_text_ocr | string | Texto extraído (OCR) |
| extracted_ids | object | IDs / protocolos extraídos |
| error_category | string | Categoria do erro |
| confidence_score | number | Confiança |
| resolution_attempted | boolean | Resolução tentada |
| action_triggered | string | Ação disparada |
| failure_reason | string | Motivo de falha |

Regras de acesso no protótipo: `{"read": {"user_condition": {"role": "admin"}}, "create": false, "update": false, "delete": false}`

## Anexo

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| vinculo_tipo | string | Vinculado a — valores: empresa, setor, risco, medicao, equipamento, programa, trabalhador |
| vinculo_id | string | ID do vínculo |
| categoria | string | Categoria — valores: fispq, certificado_calibracao, laudo_laboratorio, ca_epi, certificado_treinamento, art_rrt, documento_assinado, foto, aso, rg_cpf, ctps, comprovante_residencia, diploma, outro |
| nome | string | Nome |
| descricao | string | Descrição |
| file_uri | string | Arquivo (privado) |
| mime | string | Tipo do arquivo |
| tamanho | number | Tamanho (bytes) |
| incluir_no_documento | boolean | Listar nos anexos do documento |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## AplicacaoPsicossocial

| Campo | Tipo | Descrição |
|---|---|---|
| org_id | string | Organização |
| company_id | string | Empresa |
| nome | string | Nome da aplicação |
| instrumento | object | Instrumento (cópia congelada) |
| setores | array | Setores/GHE oferecidos |
| token | string | Código do link |
| inicio | string (data) | Início |
| fim | string (data) | Encerramento |
| status | string | Status — valores: aberta, encerrada |
| publico_estimado | number | Nº de trabalhadores convidados |
| riscos_gerados | boolean | Riscos já gerados no PGR |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## AptidaoCatalogo

| Campo | Tipo | Descrição |
|---|---|---|
| nome | string | Aptidão |
| descricao | string | Descrição / quando aplicar |
| grupo | string | Grupo (opcional) — valores: altura, eletricidade, espaco_confinado, radiacao, quimico, biologico, fisico, maquinario, transporte, outro |
| ativo | boolean | Ativa |
| org_id | string | Organização (vazio = catálogo padrão do Zela) |

Regras de acesso no protótipo: `{"read": {}, "create": {"$or": [{"user_condition": {"role": "admin"}}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}]}, "update": {"$or": [{"user_condition": {"role": "admin"}}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}]}, "delete": {"$or`

## Assento

| Campo | Tipo | Descrição |
|---|---|---|
| plano_nome | string | Plano |
| email_convite | string | E-mail convidado |
| role | string | Papel — valores: admin, user |
| status | string | Status — valores: pendente, ativo |

Regras de acesso no protótipo: `{"read": {"created_by_id": "{{user.id}}"}, "create": {"created_by_id": "{{user.id}}"}, "update": {"created_by_id": "{{user.id}}"}, "delete": {"created_by_id": "{{user.id}}"}}`

## Assinatura

| Campo | Tipo | Descrição |
|---|---|---|
| titular_nome | string | Nome do titular |
| titular_email | string | E-mail do titular |
| empresa | string | Empresa / razão social |
| cpf_cnpj | string | CPF/CNPJ |
| telefone | string | Telefone |
| vidas_declaradas | number | Vidas declaradas |
| valor_mensal | number | Valor mensal (R$) |
| status | string | Status — valores: pendente_pagamento, ativa, inadimplente, suspensa, cancelada, lead |
| gateway | string | Gateway |
| gateway_customer_id | string | Cliente no gateway |
| gateway_subscription_id | string | Assinatura no gateway |
| link_pagamento | string | Link de pagamento |
| org_id | string | Organização |
| termos_versao | string | Versão dos termos aceitos |
| termos_aceite_em | string | Aceite em |
| ip_aceite | string | IP do aceite |
| inadimplente_desde | string (data) | Inadimplente desde |
| ultimo_pagamento_em | string | Último pagamento |
| historico | array | Histórico |
| plano | string | Plano contratado — valores: tecnico, consultoria, clinica |
| faturas_extras | array | Cobranças de uso excedente (por mês) |

Regras de acesso no protótipo: `{"read": {"$or": [{"data.titular_email": "{{user.email}}"}, {"user_condition": {"role": "admin"}}]}, "create": false, "update": false, "delete": false}`

## Atendimento

| Campo | Tipo | Descrição |
|---|---|---|
| clinica_id | string | Clínica |
| agendamento_id | string | Agendamento |
| company_id | string | Empresa |
| empresa_nome | string | Empresa |
| empresa_cnpj | string | CNPJ da empresa |
| trabalhador_id | string | Colaborador |
| trabalhador_nome | string | Colaborador |
| cpf | string | CPF |
| matricula | string | Matrícula |
| data_nascimento | string | Nascimento |
| sexo | string | Sexo |
| cargo_id | string | Cargo |
| cargo_nome | string | Cargo |
| tipo_aso | string | Tipo de ASO — valores: admissional, periodico, retorno, mudanca_risco, demissional |
| status | string | Status — valores: aberto, triagem, consulta, aguardando_resultados, finalizado, cancelado |
| tempos | object | Horários: {chegada, triagem, consulta, finalizado} |
| riscos | array | Riscos ocupacionais (do PGR) |
| triagem | object | Triagem |
| anamnese | object | Anamnese ocupacional |
| exame_fisico | object | Exame físico |
| exames | array | Exames |
| aptidoes | object | Aptidões específicas |
| conclusao | string | Conclusão — valores: apto, inapto, apto_restricao |
| restricoes | string | Restrições / observações do ASO |
| medico | object | Médico examinador: {id, nome, crm, uf} |
| aso_numero | string | Número do ASO |
| aso_data | string (data) | Data do ASO |
| financeiro | object | Financeiro (cópia do agendamento) |
| esocial_status | string | S-2220 — valores: pendente, enviado |
| origem | string | Origem — valores: atendimento, importacao |
| aso_codigo | string | Código de autenticidade do ASO |

Regras de acesso no protótipo: `{"read": false, "create": false, "update": false, "delete": false}`

## Atestado

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Colaborador |
| trabalhador_nome | string | Nome do colaborador |
| data_inicio | string (data) | Início do afastamento |
| dias | number | Dias de afastamento |
| motivo | string | Motivo — valores: doenca, trabalho, trajeto, outro |
| codigo_afastamento_esocial | string | Motivo de afastamento (Tabela 18 eSocial) |
| cid | string | CID (dado sensível) |
| mesma_doenca_manual | string | Mesma doença de atestado anterior (forçar) — valores: auto, sim, nao |
| medico_nome | string | Médico emitente |
| crm | string | CRM |
| crm_uf | string | UF do CRM |
| arquivo_uri | string | Arquivo do atestado (privado) |
| cat_id | string | CAT vinculada (OcorrenciaAcidente) |
| beneficio_inss | string | Benefício INSS — valores: aguardando, b31, b91, indeferido |
| esocial_status | string | Status no eSocial — valores: pendente, enviado |
| data_retorno | string (data) | Retorno efetivo |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_saude": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_saude": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.`

## Autenticacao

| Campo | Tipo | Descrição |
|---|---|---|
| codigo | string | Código de autenticidade |
| org_id | string | Organização |
| company_id | string | Empresa |
| empresa_nome | string | Empresa |
| documento_tipo | string | Tipo |
| documento_id | string | Documento |
| documento_nome | string | Nome do documento |
| versao | string | Versão |
| emitido_em | string | Emitido em |
| emitido_por | object | Emitido por |
| responsavel | object | Responsável técnico |
| hash | string | Hash SHA-256 |
| status | string | Situação — valores: valido, substituido, revogado |

Regras de acesso no protótipo: `{"read": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}, "create": false, "update": false, "delete": false}`

## AutoInfracao

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| numero_ai | string | Número do Auto de Infração |
| data_autuacao | string (data) | Data da autuação |
| orgao_autuador | string | Órgão autuador |
| nr_item_citado | string | NR/Item citado |
| descricao_irregularidade | string | Descrição da irregularidade |
| valor_multa | string | Valor da multa |
| prazo_defesa | string (data) | Prazo para defesa |
| pdf_url | string | PDF do auto (URL pública) |
| defesa | object | Defesa prévia (argumentos, fundamentação, conclusão) |
| status | string | Status — valores: pendente, defendido, julgado |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_documentos": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_documentos": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## CargoFuncao

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| nome_cargo | string | Nome do cargo |
| cbo | string | CBO |
| quantidade_funcionarios | number | Qtd. funcionários |
| riscos_identificados | array | Riscos identificados |
| atividades | string | Descrição das atividades |
| epis_obrigatorios | array | EPIs obrigatórios |
| procedimentos_emergencia | string | Procedimentos de emergência |
| unidade_id | string | Unidade |
| setor_id | string | Setor |
| jornada | string | Jornada de trabalho |
| ghe | string | GHE (grupo homogêneo de exposição) |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## CarteiraIA

| Campo | Tipo | Descrição |
|---|---|---|
| user_id | string | ID do usuário |
| user_email | string | E-mail do usuário |
| plano | string | Plano — valores: gratuito, essencial, profissional, equipe |
| ciclo | string | Ciclo atual (AAAA-MM) |
| usados_ciclo | number | Créditos do plano usados no mês |
| creditos_extras | number | Créditos extras (recarga, não expiram) |
| ilimitado | boolean | Sem limite (administrador) |
| dia_gratis | string | Dia do contador gratuito (AAAA-MM-DD) |
| usados_gratis_dia | number | Mensagens gratuitas usadas no dia |
| modelo_cobranca | string | Modelo de cobrança — valores: uso, vidas, plano |
| vidas_ativas | number | Vidas ativas contadas (automático) |
| vidas_contadas_em | string | Vidas contadas em |
| vidas_contratadas | number | Vidas contratadas (se preenchido, substitui a contagem) |
| limite_gasto_mensal | number | Limite de gasto mensal além da franquia (R$) |
| excedente_ciclo | number | Créditos usados além da franquia no mês |
| alertas_ciclo | array | Alertas de consumo enviados no mês |
| plano_uso | string | Plano de uso |
| historico_ciclos | array | Fechamento dos meses anteriores |

Regras de acesso no protótipo: `{"read": {"data.user_id": "{{user.id}}"}, "create": false, "update": false, "delete": false}`

## ChatConversation

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa (opcional) |
| titulo | string | Título |
| messages | array | Mensagens |

Regras de acesso no protótipo: `{"read": {"created_by_id": "{{user.id}}"}, "create": {"created_by_id": "{{user.id}}"}, "update": {"created_by_id": "{{user.id}}"}, "delete": {"created_by_id": "{{user.id}}"}}`

## Client

| Campo | Tipo | Descrição |
|---|---|---|
| name | string | Nome |
| corporateName | string | Razão Social |
| taxId | string | CNPJ/CPF |
| email | string | E-mail |
| phone | string | Telefone |
| status | string | Status — valores: ativo, inativo |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## Clinica

| Campo | Tipo | Descrição |
|---|---|---|
| nome | string | Nome da clínica |
| cnpj | string | CNPJ |
| dono_id | string | Usuário titular |
| dono_email | string | E-mail do titular |
| endereco | string | Endereço |
| telefone | string | Telefone |
| config | object | Configurações: {duracao_padrao, salas} |

Regras de acesso no protótipo: `{"read": false, "create": false, "update": false, "delete": false}`

## CnaeNrMap

| Campo | Tipo | Descrição |
|---|---|---|
| cnae | string | CNAE |
| nr_codigo | string | NR |
| observacao | string | Observação |
| origem | string | Origem — valores: manual, sugestao_ia |

Regras de acesso no protótipo: `{"read": {"created_by_id": "{{user.id}}"}, "create": {"created_by_id": "{{user.id}}"}, "update": {"created_by_id": "{{user.id}}"}, "delete": {"created_by_id": "{{user.id}}"}}`

## CodigoEsocial

| Campo | Tipo | Descrição |
|---|---|---|
| tabela | string | Tabela — valores: categoria_trabalhador, parte_corpo, agente_causador, situacao_geradora, natureza_lesao, motivo_afastamento, agente_nocivo_aposentadoria, procedimento_diagnostico |
| codigo | string | Código |
| descricao | string | Descrição |
| grupo | string | Grupo (quando aplicável) |

Regras de acesso no protótipo: `{"read": {}, "create": {"user_condition": {"role": "admin"}}, "update": {"user_condition": {"role": "admin"}}, "delete": {"user_condition": {"role": "admin"}}}`

## Company

| Campo | Tipo | Descrição |
|---|---|---|
| e_matriz | boolean | É empresa matriz (gerenciadora) |
| razao_social | string | Razão Social |
| cnpj | string | CNPJ |
| cpf | string | CPF (MEI / autônomo) |
| cei | string | CEI (Certificado de Empresa Individual) |
| cnae | string | CNAE |
| porte | string | Porte — valores: MEI, Pequeno, Médio, Grande |
| grau_de_risco | string | Grau de risco — valores: 1, 2, 3, 4 |
| uf | string | UF |
| municipio | string | Município |
| setor_descricao | string | Descrição do setor/atividade |
| fap | number | FAP vigente (0,5000 a 2,0000) |
| rat | number | Alíquota RAT (1, 2 ou 3%) |
| folha_mensal | number | Folha de salários mensal (R$) |
| vinculos_medios | number | Número médio de vínculos |
| fap_simulacao | object | Simulação do FAP salva: {atual, cenario, rat, folha_anual} |
| tipo_cliente | string | Tipo de cliente — valores: contrato, kit, avulso |
| situacao_financeira | string | Situação financeira — valores: em_dia, pendente, bloqueado |
| kit_saldo | number | Saldo do kit (atendimentos) |
| valor_avulso | number | Valor padrão do atendimento avulso (R$) |
| org_id | string | Organização |
| portal_token | string | Código do link do portal do cliente |
| portal_ativo | boolean | Portal do cliente ativo |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## ComplianceItem

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| nr_codigo | string | NR |
| item_exigido | string | Item exigido |
| status | string | Status — valores: pendente, atendido, nao_aplicavel |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_documentos": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_documentos": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## ContratoCliente

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa-cliente |
| valor_base | number | Mensalidade base (R$) |
| limite_incluido | number | Limite incluído (vidas/exames) |
| valor_excedente_unitario | number | Valor por excedente (R$) |
| unidade_excedente | string | Unidade do excedente — valores: vidas, exames |
| vigencia_inicio | string (data) | Início da vigência |
| vigencia_fim | string (data) | Fim da vigência |
| status | string | Status — valores: ativo, encerrado |
| observacao | string | Observação |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## DocumentoTerceiro

| Campo | Tipo | Descrição |
|---|---|---|
| terceira_id | string | Empresa terceira |
| company_id | string | Empresa contratante |
| tipo | string | Tipo de documento — valores: contrato, art, ppp, pgr_terceiro, pcmso_terceiro, aso_lote, fssp, certificacao_iso, cipa, nr_comprovante, treinamento_lote, outro |
| nome | string | Nome/descrição |
| file_uri | string | Arquivo (privado) |
| data_emissao | string (data) | Data de emissão |
| data_validade | string (data) | Validade (opcional) |
| observacao | string | Observação |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## EntregaEpi

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Colaborador |
| trabalhador_nome | string | Nome do colaborador |
| epi_id | string | EPI |
| epi_nome | string | Nome do EPI |
| ca | string | CA na entrega |
| quantidade | number | Quantidade |
| data_entrega | string (data) | Data da entrega |
| motivo | string | Motivo — valores: primeira_entrega, troca_periodica, desgaste, perda, outro |
| proxima_troca | string (data) | Próxima troca |
| orientado_uso | boolean | Orientado sobre uso, guarda e conservação |
| assinatura_uri | string | Assinatura do colaborador (privada) |
| assinado_em | string | Assinado em |
| devolvido_em | string (data) | Devolvido em |
| observacao | string | Observação |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## EpiItem

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| nome | string | EPI |
| tipo | string | Tipo — valores: cabeca, olhos_face, auditivo, respiratorio, tronco, maos_bracos, pernas_pes, corpo_inteiro, queda_altura, outro |
| ca | string | Número do CA |
| validade_ca | string (data) | Validade do CA |
| fabricante | string | Fabricante |
| vida_util_dias | number | Troca periódica (dias) |
| estoque_atual | number | Estoque atual |
| estoque_minimo | number | Estoque mínimo |
| unidade | string | Unidade |
| ativo | boolean | Ativo |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## Equipamento

| Campo | Tipo | Descrição |
|---|---|---|
| tipo | string | Tipo — valores: dosimetro, decibelimetro, calibrador_acustico, termometro_ibutg, termo_higrometro, anemometro, luximetro, vibracao, bomba_amostragem, detector_gases, outro |
| fabricante | string | Fabricante |
| modelo | string | Modelo |
| numero_serie | string | Número de série |
| certificado_numero | string | Nº do certificado de calibração |
| laboratorio | string | Laboratório (RBC/Inmetro) |
| data_calibracao | string (data) | Data da calibração |
| validade_calibracao | string (data) | Validade da calibração |
| certificado_uri | string | Certificado (arquivo privado) |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## EventoEsocial

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Trabalhador |
| trabalhador_nome | string | Nome do trabalhador |
| tipo_evento | string | Evento eSocial — valores: S-2200, S-2205, S-2206, S-2210, S-2220, S-2221, S-2230, S-2240, S-2298, S-2299, S-2300 |
| data_evento | string (data) | Data do evento |
| descricao | string | Descrição |
| recibo | string | Nº do recibo eSocial |
| status | string | Status — valores: rascunho, transmitido, processado, erro |
| detalhes | object | Detalhes do evento |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_esocial": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_esocial": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.d`

## EventoPagamento

| Campo | Tipo | Descrição |
|---|---|---|
| event_id | string | ID do evento no gateway |
| tipo | string | Tipo |
| assinatura_id | string | Assinatura |
| resumo | object | Resumo |

Regras de acesso no protótipo: `{"read": {"user_condition": {"role": "admin"}}, "create": false, "update": false, "delete": false}`

## ExameCatalogo

| Campo | Tipo | Descrição |
|---|---|---|
| exame | string | Exame |
| descricao | string | Descrição / indicação |
| codigo_esocial | string | Código eSocial (Tabela 27) |
| codigo_esocial_id | string | Referência ao CodigoEsocial |
| codigo_esocial_descricao | string | Descrição do código eSocial |
| periodicidade_meses | number | Periodicidade padrão (meses) |
| momentos_default | array | Momentos padrão |
| justificativa_modelo | string | Modelo de justificativa técnica |
| ativo | boolean | Ativo |
| org_id | string | Organização (vazio = catálogo padrão do Zela) |

Regras de acesso no protótipo: `{"read": {}, "create": {"$or": [{"user_condition": {"role": "admin"}}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}]}, "update": {"$or": [{"user_condition": {"role": "admin"}}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}]}, "delete": {"$or`

## ExamePcmso

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| cargo_id | string | Cargo |
| risco_ids | array | Riscos que justificam |
| exame | string | Exame |
| codigo_esocial | string | Código eSocial (Tabela 27) |
| codigo_esocial_descricao | string | Descrição do código eSocial |
| catalogo_id | string | Referência ao ExameCatalogo |
| momentos | array | Momentos |
| periodicidade_meses | number | Periodicidade (meses) |
| justificativa | string | Justificativa técnica / NR-7 |
| origem | string | Origem — valores: manual, ia |
| ativo | boolean | Ativo |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## FinancialTransaction

| Campo | Tipo | Descrição |
|---|---|---|
| serviceExecutionId | string | Execução vinculada (opcional) |
| clientId | string | Cliente (opcional) |
| providerId | string | Prestador (opcional) |
| type | string | Tipo — valores: PAYABLE, RECEIVABLE |
| amount | number | Valor (R$) |
| dueDate | string (data) | Vencimento |
| paymentDate | string (data) | Data de pagamento (opcional) |
| status | string | Status — valores: PENDING, PAID, OVERDUE, CANCELLED |
| categoryId | string | Categoria |
| description | string | Descrição |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## FolhaMensal

| Campo | Tipo | Descrição |
|---|---|---|
| mes_ano | string | Mês/ano (YYYY-MM) |
| valor_folha | number | Valor da folha (R$) |
| encargos | number | Encargos (R$) |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## GeneratedDocument

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| cargo_id | string | Cargo |
| trabalhador_id | string | Trabalhador (opcional) |
| trabalhador_nome | string | Nome do trabalhador |
| tipo_documento | string | Tipo — valores: ordem_servico, ficha_epi, lista_presenca, dds, certificado, termo_recusa_epi, pgr, ppp |
| conteudo | object | Conteúdo do documento |
| status | string | Status — valores: rascunho, revisado |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_documentos": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_documentos": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## InspecaoChecklist

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| setor_id | string | Setor |
| modelo_id | string | Modelo |
| modelo_nome | string | Checklist |
| norma | string | Norma |
| data | string (data) | Data |
| inspetor | string | Inspetor |
| local | string | Local / equipamento inspecionado |
| respostas | array | Respostas |
| status | string | Status — valores: andamento, concluida |
| conformidade_pct | number | % de conformidade |
| observacoes | string | Observações gerais |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## InstrumentoPsicossocial

| Campo | Tipo | Descrição |
|---|---|---|
| org_id | string | Organização |
| nome | string | Nome do instrumento |
| referencia | string | Referência / validação |
| validado | boolean | Instrumento validado cientificamente |
| itens | array | Itens |
| dimensoes | array | Dimensões |
| min_respostas_grupo | number | Mínimo de respostas por grupo (anonimato) |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## InventarioSnapshot

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| programa_id | string | Programa (PGR) |
| versao | string | Versão do PGR |
| data_emissao | string (data) | Data de emissão do PGR |
| data_snapshot | string | Data/hora do snapshot |
| inventario | object | Inventário completo (setores, cargos, riscos) |
| resumo | object | Resumo: {total_setores, total_cargos, total_riscos} |
| responsavel_tecnico | object | Responsável técnico: {nome, conselho, numero, uf} |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## LancamentoFinanceiro

| Campo | Tipo | Descrição |
|---|---|---|
| tipo | string | Tipo — valores: pagar, receber |
| categoria | string | Categoria |
| valor | number | Valor (R$) |
| data_vencimento | string (data) | Vencimento |
| data_pagamento | string (data) | Data de pagamento |
| recorrencia | string | Recorrência — valores: unica, mensal |
| company_id | string | Cliente (opcional) |
| prestador_id | string | Prestador (opcional) |
| contrato_id | string | Contrato (excedente) |
| quantidade | number | Quantidade realizada (excedente) |
| status | string | Status — valores: pendente, pago, cancelado |
| descricao | string | Descrição |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## Levantamento

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| setor_id | string | Setor |
| cargo_id | string | Cargo |
| token | string | Código do link |
| destinatario_nome | string | Destinatário |
| destinatario_tipo | string | Tipo — valores: colaborador, tecnico, empresa |
| status | string | Status — valores: enviado, respondido, incorporado |
| respostas | object | Respostas |
| fotos | array | Fotos (referências privadas) |
| expira_em | string | Expira em |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## LogAcessoClinico

| Campo | Tipo | Descrição |
|---|---|---|
| clinica_id | string | Clínica |
| user_id | string | Usuário |
| email | string | E-mail |
| perfil | string | Perfil |
| atendimento_id | string | Atendimento |
| acao | string | Ação |

Regras de acesso no protótipo: `{"read": false, "create": false, "update": false, "delete": false}`

## LotacaoHistorico

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Trabalhador |
| trabalhador_nome | string | Nome do trabalhador |
| cargo_id | string | Cargo |
| setor_id | string | Setor |
| unidade_id | string | Unidade |
| data_inicio | string (data) | Início |
| data_fim | string (data) | Fim |
| tipo_movimentacao | string | Tipo de movimentação — valores: admissao, transferencia_cargo, transferencia_setor, transferencia_unidade, transferencia_empresa, promocao, demissao, reativacao, inativacao |
| observacao | string | Observação |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## MandatoCipa

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| tipo | string | Tipo — valores: cipa, designado |
| inicio | string (data) | Início do mandato |
| fim | string (data) | Fim do mandato |
| grau_risco | string | Grau de risco |
| membros | array | Membros |
| eleicao | object | Cronograma eleitoral: {edital, inscricoes_inicio, inscricoes_fim, votacao, apuracao, posse} |
| status | string | Status — valores: planejado, vigente, encerrado |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## MatrizTreinamento

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| cargo_id | string | Cargo |
| nr | string | NR / código |
| titulo | string | Treinamento |
| carga_horaria | number | Carga horária (h) |
| reciclagem_meses | number | Reciclagem (meses; 0 = sem prazo fixo) |
| obrigatorio | boolean | Obrigatório |
| fundamento | string | Fundamento normativo |
| origem | string | Origem — valores: manual, ia |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## Medicao

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| setor_id | string | Setor |
| cargo_ids | array | Cargos/GHE avaliados |
| risco_id | string | Risco vinculado |
| tipo | string | Tipo — valores: ruido, ruido_impacto, calor, frio, iluminacao, vibracao, quimico, poeira |
| agente | string | Agente (para químicos) |
| data | string (data) | Data da medição |
| equipamento_id | string | Equipamento |
| metodologia | string | Metodologia / norma |
| avaliado | string | Trabalhador/posto avaliado |
| condicoes | string | Condições da avaliação (atividade, clima, produção) |
| parametros | object | Dados de entrada do cálculo |
| resultado | object | Resultado calculado |
| responsavel | string | Responsável pela medição |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## MembroClinica

| Campo | Tipo | Descrição |
|---|---|---|
| clinica_id | string | Clínica |
| user_id | string | Usuário (vinculado no 1º acesso) |
| email | string | E-mail |
| nome | string | Nome |
| perfil | string | Perfil — valores: admin, medico, enfermagem, recepcao, fono |
| crm | string | CRM / registro |
| crm_uf | string | UF do registro |
| ativo | boolean | Ativo |

Regras de acesso no protótipo: `{"read": false, "create": false, "update": false, "delete": false}`

## MembroOrganizacao

| Campo | Tipo | Descrição |
|---|---|---|
| org_id | string | Organização |
| user_id | string | Usuário (vinculado no 1º acesso) |
| email | string | E-mail |
| nome | string | Nome |
| perfil | string | Perfil — valores: admin, gestor, funcionario |
| ativo | boolean | Ativo |

Regras de acesso no protótipo: `{"read": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}, "create": false, "update": false, "delete": false}`

## ModeloChecklist

| Campo | Tipo | Descrição |
|---|---|---|
| nome | string | Nome do checklist |
| norma | string | Norma de referência |
| descricao | string | Descrição |
| itens | array | Itens |
| origem | string | Origem — valores: padrao, manual, ia |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## NormaTrecho

| Campo | Tipo | Descrição |
|---|---|---|
| nr_codigo | string | NR (ex: NR-6) |
| titulo | string | Título da seção |
| item | string | Item/subitem (ex: 6.1) |
| texto | string | Texto do trecho |

Regras de acesso no protótipo: `{"read": {"created_by_id": "{{user.id}}"}, "create": {"created_by_id": "{{user.id}}"}, "update": {"created_by_id": "{{user.id}}"}, "delete": {"created_by_id": "{{user.id}}"}}`

## OcorrenciaAcidente

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Trabalhador (opcional) |
| trabalhador_nome | string | Nome do trabalhador |
| data_hora | string | Data e hora |
| local | string | Local |
| funcao_acidentado | string | Função do acidentado |
| descricao | string | Descrição do acidente |
| parte_corpo | string | Parte do corpo atingida |
| agente_causador | string | Agente causador |
| situacao_geradora | string | Situação geradora |
| natureza_lesao | string | Natureza da lesão |
| afastamento | boolean | Houve afastamento |
| testemunhas | string | Testemunhas |
| envolve_maquina | boolean | Envolve máquina/equipamento |
| investigacao | object | Investigação (5 Porquês, Ishikawa, plano de ação) |
| status | string | Status — valores: rascunho, em_investigacao, concluida |
| org_id | string | Organização |
| cat_numero | string | Número da CAT / recibo do S-2210 |
| cat_data | string (data) | Data de registro da CAT |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## Organizacao

| Campo | Tipo | Descrição |
|---|---|---|
| nome | string | Nome |
| dono_id | string | Titular |
| dono_email | string | E-mail do titular |
| permissoes | object | Permissões por perfil: {gestor:{modulo:nivel}, funcionario:{...}} |
| assinatura_id | string | Assinatura |
| status_assinatura | string | Situação da assinatura — valores: interna, sem_assinatura, pendente_pagamento, ativa, inadimplente, suspensa, cancelada |
| plano_uso | string | Plano (cobrança por uso) — valores: tecnico, consultoria, clinica |
| canal_escuta | boolean | Canal de escuta (bem-estar) ativo |

Regras de acesso no protótipo: `{"read": {"$or": [{"data.dono_id": "{{user.id}}"}, {"id": "{{user.data.org_id}}"}]}, "create": false, "update": false, "delete": false}`

## PedidoRecarga

| Campo | Tipo | Descrição |
|---|---|---|
| user_id | string | ID do usuário |
| user_email | string | E-mail do usuário |
| creditos | number | Créditos do pacote |
| valor | number | Valor (R$) |
| status | string | Status — valores: pendente, aprovado, recusado |

Regras de acesso no protótipo: `{"read": {"data.user_id": "{{user.id}}"}, "create": false, "update": false, "delete": false}`

## Plano

| Campo | Tipo | Descrição |
|---|---|---|
| nome | string | Nome do plano — valores: Grátis, Essencial, Profissional, Equipe |
| descricao | string | Descrição |
| limite_assentos | number | Limite de assentos |
| recursos | array | Recursos |

Regras de acesso no protótipo: `{"read": {"created_by_id": "{{user.id}}"}, "create": {"created_by_id": "{{user.id}}"}, "update": {"created_by_id": "{{user.id}}"}, "delete": {"created_by_id": "{{user.id}}"}}`

## PlanoAcao

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| origem | string | Origem — valores: checklist, cipa, epi, treinamento, acidente, manual, risco_ia, programa, laudo |
| origem_id | string | ID da origem |
| origem_descricao | string | Descrição da origem |
| risco_id | string | Risco vinculado |
| risco_agente | string | Agente do risco (para exibição) |
| descricao | string | Ação |
| justificativa | string | Justificativa técnica |
| tipo_medida | string | Tipo de medida (NR-01 1.5.5.2) — valores: eliminacao, coletiva, administrativa, individual |
| estrutura | string | Metodologia — valores: nenhuma, pdca, 5w2h |
| metodologia | object | Detalhamento PDCA / 5W2H |
| escopo | object | A quem se aplica: {tipo, ids, descricao} |
| responsavel | string | Responsável |
| responsavel_email | string | E-mail do responsável |
| responsaveis_extras | array | Outros responsáveis / notificados |
| data_inicio | string (data) | Início previsto |
| prazo | string (data) | Prazo |
| prioridade | string | Prioridade — valores: baixa, media, alta |
| status | string | Status — valores: pendente, andamento, concluida, cancelada |
| pendente_aprovacao | boolean | Aguardando aprovação do elaborador |
| aprovado_por | string | Aprovado por |
| evidencia | string | Evidência / como foi resolvido |
| evidencias | array | Evidências (arquivos privados) |
| lembretes | array | Lembretes |
| notificacoes_enviadas | array | Histórico de notificações |
| concluida_em | string (data) | Concluída em |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## Prestador

| Campo | Tipo | Descrição |
|---|---|---|
| nome | string | Nome |
| cnpj | string | CNPJ |
| tipo_servico | string | Tipo de serviço — valores: laboratorio, sistema, medico, consultoria, aluguel, outro |
| valor_recorrente_mensal | number | Valor recorrente mensal (R$) |
| dia_vencimento | number | Dia de vencimento |
| status | string | Status — valores: ativo, inativo |
| observacao | string | Observação |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## ProgramaSST

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| tipo | string | Documento — valores: pgr, pcmso, ltcat, insalubridade, periculosidade |
| versao | string | Versão |
| data_emissao | string (data) | Data de emissão |
| vigencia_ate | string (data) | Vigência até |
| matriz | string | Matriz de risco — valores: 4x4, 5x5 |
| responsavel | object | Responsável técnico: {nome, cpf, conselho (CREA/CRM/MTE/outro), numero, uf, formacao} |
| medico_coordenador | object | Médico coordenador PCMSO: {nome, cpf, crm, uf} |
| textos | object | Textos técnicos (introdução, metodologia, conclusão...) |
| status | string | Status — valores: rascunho, emitido |
| assinatura | object | Assinatura: {modo: manual/imagem/certificado, file_uri, nome, data} |
| documento_assinado | object | PDF assinado digitalmente: {file_uri, nome, data, assinante} |
| org_id | string | Organização |
| autenticacao_codigo | string | Código de autenticidade (QR) |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## Provider

| Campo | Tipo | Descrição |
|---|---|---|
| name | string | Nome |
| taxId | string | CNPJ/CPF |
| serviceType | string | Tipo de serviço — valores: laboratorio, radiologia, medico, consultoria, palestras, outro |
| defaultPaymentTermDays | number | Prazo padrão de repasse (dias) |
| email | string | E-mail |
| phone | string | Telefone |
| status | string | Status — valores: ativo, inativo |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## RecusaTrabalho

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Trabalhador (opcional) |
| trabalhador_nome | string | Nome do trabalhador |
| cargo_id | string | Cargo (opcional) |
| setor_id | string | Setor (opcional) |
| data_recusa | string (data) | Data da recusa |
| hora_recusa | string | Hora (opcional) |
| local | string | Local |
| situacao_perigosa | string | Situação perigosa relatada |
| risco_identificado | string | Risco identificado |
| medida_controle_existente | string | Medidas de controle existentes |
| acao_empregador | string | Providência do empregador |
| status | string | Status — valores: pendente, em_analise, resolvido |
| anexo_uri | string | Anexo (foto/evidência, privado) |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## RelatorioSaude

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| tipo | string | Tipo — valores: epidemiologico, gestor, analitico_pcmso |
| inicio | string (data) | Início do período |
| fim | string (data) | Fim do período |
| setor_id | string | Setor (vazio = todos) |
| analise | object | Análise técnica (IA + edição): {sintese, achados, recomendacoes, conclusao} |
| responsavel | object | Responsável: {nome, registro} |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_saude": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_saude": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.`

## RespostaPsicossocial

| Campo | Tipo | Descrição |
|---|---|---|
| aplicacao_id | string | Aplicação |
| org_id | string | Organização |
| company_id | string | Empresa |
| setor_id | string | Setor/GHE |
| respostas | object | Respostas (anônimas) |

Regras de acesso no protótipo: `{"read": false, "create": false, "update": false, "delete": false}`

## ReuniaoCipa

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| mandato_id | string | Mandato |
| data | string (data) | Data |
| tipo | string | Tipo — valores: ordinaria, extraordinaria |
| pauta | string | Pauta |
| ata | string | Ata |
| presentes | array | Presentes |
| status | string | Status — valores: agendada, realizada, cancelada |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## Risco

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| setor_id | string | Setor |
| cargo_ids | array | Cargos expostos (GHE) |
| tipo | string | Tipo — valores: fisico, quimico, biologico, ergonomico, acidente, psicossocial |
| agente | string | Agente / perigo |
| codigo_esocial | string | Código eSocial (Tabela 24) |
| codigo_esocial_descricao | string | Descrição do código eSocial |
| catalogo_id | string | Referência ao RiscoCatalogo |
| aptidao_ids | array | Aptidões ASO sugeridas |
| fonte_geradora | string | Fonte geradora / circunstância |
| possiveis_danos | string | Possíveis lesões ou agravos à saúde |
| meio_propagacao | string | Meio de propagação / via de exposição |
| exposicao | string | Exposição — valores: habitual_permanente, habitual_intermitente, eventual |
| tipo_avaliacao | string | Avaliação — valores: qualitativa, quantitativa |
| intensidade | string | Intensidade/concentração medida |
| unidade_medida | string | Unidade de medida |
| limite_tolerancia | string | Limite de tolerância |
| tecnica_medicao | string | Técnica/metodologia de medição (ex.: NHO-01) |
| severidade | number | Severidade |
| probabilidade | number | Probabilidade |
| nivel_risco | string | Classificação do risco |
| criterio_avaliacao | string | Justificativa da severidade e probabilidade, considerando trabalhadores expostos, exigências da atividade e controles |
| data_avaliacao | string (data) | Data da última avaliação |
| motivo_revisao | string | Motivo da revisão (mudança, acidente, ineficácia, medida implementada ou requisito legal) |
| medidas_existentes | array | Medidas de controle existentes |
| epc | array | EPCs |
| epi | array | EPIs |
| plano_acao | array | Plano de ação |
| insalubridade | object | Insalubridade (NR-15): {caracteriza, anexo, grau, fundamentacao} |
| periculosidade | object | Periculosidade (NR-16): {caracteriza, anexo, fundamentacao} |
| aposentadoria_especial | object | LTCAT: {enquadra, codigo_anexo_iv, fundamentacao} |
| origem | string | Origem — valores: manual, ia, foto, levantamento |
| revisado | boolean | Revisado pelo responsável técnico |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## RiscoCatalogo

| Campo | Tipo | Descrição |
|---|---|---|
| tipo | string | Tipo — valores: fisico, quimico, biologico, ergonomico, acidente, psicossocial |
| agente | string | Agente / perigo |
| descricao | string | Descrição / orientação de uso |
| codigo_esocial | string | Código eSocial (Tabela 24) |
| codigo_esocial_id | string | Referência ao CodigoEsocial |
| codigo_esocial_descricao | string | Descrição do código eSocial |
| fonte_geradora | string | Fonte geradora sugerida |
| possiveis_danos | string | Possíveis lesões / agravos |
| meio_propagacao | string | Meio de propagação / via |
| exame_ids | array | Exames associados (catálogo) |
| aptidao_ids | array | Aptidões ASO associadas (catálogo) |
| ativo | boolean | Ativo |
| org_id | string | Organização (vazio = catálogo padrão do Zela) |

Regras de acesso no protótipo: `{"read": {}, "create": {"$or": [{"user_condition": {"role": "admin"}}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}]}, "update": {"$or": [{"user_condition": {"role": "admin"}}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_programas": true}}]}]}, "delete": {"$or`

## ServiceCategory

| Campo | Tipo | Descrição |
|---|---|---|
| name | string | Nome |
| slug | string | Identificador |
| description | string | Descrição |
| ordem | number | Ordem |
| ativo | boolean | Ativa |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## ServiceExecution

| Campo | Tipo | Descrição |
|---|---|---|
| date | string (data) | Data |
| clientId | string | Cliente |
| providerId | string | Prestador/Parceiro (opcional) |
| categoryId | string | Categoria |
| description | string | Descrição |
| salePrice | number | Preço de venda (R$) |
| costPrice | number | Custo do prestador (R$) |
| status | string | Status — valores: SCHEDULED, COMPLETED, NO_SHOW, CANCELLED |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_financeiro": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_financeiro": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## Setor

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| unidade_id | string | Unidade |
| nome | string | Nome do setor |
| descricao_ambiente | string | Descrição do ambiente (área, piso, iluminação, ventilação, máquinas) |
| fotos | array | Fotos do setor |
| analise_ia | object | Última análise de fotos pela IA |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## Terceira

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa contratante |
| razao_social | string | Razão Social |
| cnpj | string | CNPJ |
| responsavel | string | Responsável legal |
| telefone | string | Telefone |
| email | string | E-mail |
| contrato_numero | string | Nº do contrato |
| contrato_inicio | string (data) | Início do contrato |
| contrato_fim | string (data) | Fim do contrato |
| area_atuacao | string | Área de atuação / serviço |
| setor_ids | array | Setores onde atua |
| cargo_ids | array | Cargos/funções executados |
| responsavel_tecnico_nome | string | Responsável técnico (nome) |
| responsavel_tecnico_conselho | string | Conselho/registro — valores: CREA, CRM, MTE, outro |
| responsavel_tecnico_numero | string | Nº do registro |
| status | string | Status — valores: ativa, suspensa, inativa |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## TextoTecnico

| Campo | Tipo | Descrição |
|---|---|---|
| tipo_documento | string | Documento — valores: pgr, pcmso, ltcat, lti, ltp, ficha_epi, ordem_servico, auto_infracao, geral |
| categoria | string | Categoria — valores: caracterizacao_risco, caracterizacao_insalubridade, caracterizacao_periculosidade, fundamentacao, introducao, metodologia, conclusao, responsabilidades, revisao, medida_controle, outro |
| titulo | string | Título |
| texto | string | Texto |
| risco_tipo | string | Tipo de risco (opcional) — valores: fisico, quimico, biologico, ergonomico, acidente, psicossocial |
| agente | string | Agente (opcional) |
| tags | array | Tags |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_documentos": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_documentos": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{`

## Ticket

| Campo | Tipo | Descrição |
|---|---|---|
| protocol | string | Protocolo |
| customer_name | string | Nome do cliente |
| customer_email | string | E-mail |
| customer_phone | string | Telefone / contato |
| subject | string | Assunto |
| description | string | Descrição do problema |
| image_urls | array | Anexos (URLs públicas) |
| status | string | Status — valores: open, analyzing, resolved_ai, escalated_n2, resolved_n2 |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"user_condition": {"role": "admin"}}]}, "create": {}, "update": {"user_condition": {"role": "admin"}}, "delete": {"user_condition": {"role": "admin"}}}`

## TicketInteraction

| Campo | Tipo | Descrição |
|---|---|---|
| ticket_id | string | Ticket |
| author_type | string | Autor — valores: customer, ai, support_n2 |
| message | string | Mensagem |
| is_internal_note | boolean | Nota interna |
| ticket_owner_id | string | Dono do ticket (controle de acesso) |

Regras de acesso no protótipo: `{"read": {"$or": [{"data.ticket_owner_id": "{{user.id}}", "data.is_internal_note": false}, {"user_condition": {"role": "admin"}}]}, "create": {"$or": [{"data.ticket_owner_id": "{{user.id}}"}, {"user_condition": {"role": "admin"}}]}, "update": {"user_condition": {"role": "admin"}}, "delete": {"user_condition": {"role": "admin"}}}`

## Trabalhador

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| cargo_id | string | Cargo |
| nome | string | Nome |
| cpf | string | CPF (opcional) |
| data_admissao | string (data) | Data de admissão |
| data_demissao | string (data) | Data de demissão |
| setor_id | string | Setor |
| unidade_id | string | Unidade |
| matricula | string | Matrícula (eSocial) |
| categoria_trabalhador | string | Categoria do trabalhador (Tabela 1 eSocial) |
| data_nascimento | string (data) | Data de nascimento |
| sexo | string | Sexo — valores: M, F |
| status | string | Status — valores: ativo, inativo |
| estabilidade | object | Estabilidade: {tem, tipo, data_fim, observacao} |
| cipa_cargo | string | Cargo na CIPA — valores: presidente, vice_presidente, secretario, membro, suplente |
| brigada | boolean | Membro de brigada de emergência |
| biometria | object | Biometria: {cadastrada, tipo, arquivo_uri} |
| deficiencia | object | Deficiência (PCD): {tem, tipo, descricao, cid} |
| org_id | string | Organização |
| nit | string | NIT / PIS |
| ctps | string | CTPS (número, série, UF) |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## Treinamento

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Trabalhador |
| trabalhador_nome | string | Nome do trabalhador |
| nr | string | NR |
| data_realizacao | string (data) | Data de realização |
| validade | string (data) | Validade |
| titulo | string | Título do treinamento |
| carga_horaria | number | Carga horária (h) |
| instrutor | string | Instrutor |
| cargo_id | string | Cargo |
| certificado_uri | string | Certificado (arquivo privado) |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_seguranca": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_seguranca": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{us`

## TrilhaDocumento

| Campo | Tipo | Descrição |
|---|---|---|
| org_id | string | Organização |
| company_id | string | Empresa |
| documento_tipo | string | Tipo de documento |
| documento_id | string | Documento |
| evento | string | Evento — valores: ia_sugeriu, editado, emitido, revogado |
| usuario_email | string | Usuário |
| usuario_nome | string | Nome |
| versao | string | Versão |
| hash | string | Hash SHA-256 do conteúdo |
| detalhes | object | Detalhes (seções, % alterado, textos sugeridos) |

Regras de acesso no protótipo: `{"read": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_programas": true}}]}, "create": false, "update": false, "delete": false}`

## Unidade

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| nome | string | Nome da unidade |
| tipo_inscricao | string | Tipo de inscrição (eSocial) — valores: cnpj, cno, caepf |
| numero_inscricao | string | CNPJ/CNO/CAEPF da unidade |
| endereco | string | Endereço |
| municipio | string | Município |
| uf | string | UF |
| cnae | string | CNAE da unidade |
| grau_risco | string | Grau de risco (NR-4) — valores: 1, 2, 3, 4 |
| num_trabalhadores | number | Nº de trabalhadores |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_cadastros": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_`

## User

| Campo | Tipo | Descrição |
|---|---|---|
| role | string |  — valores: admin, user |
| tipo | string | Tipo de usuário — valores: autonomo, empresa |
| plano | string | Plano — valores: gratuito, pro |
| org_id | string | Organização |
| org_perfil | string | Perfil na organização — valores: admin, gestor, funcionario |
| org_ativo | boolean | Membro ativo |
| pv_cadastros | boolean | Pode ver: cadastros |
| pe_cadastros | boolean | Pode editar: cadastros |
| pv_programas | boolean | Pode ver: programas |
| pe_programas | boolean | Pode editar: programas |
| pv_saude | boolean | Pode ver: saude |
| pe_saude | boolean | Pode editar: saude |
| pv_seguranca | boolean | Pode ver: seguranca |
| pe_seguranca | boolean | Pode editar: seguranca |
| pv_documentos | boolean | Pode ver: documentos |
| pe_documentos | boolean | Pode editar: documentos |
| pv_esocial | boolean | Pode ver: esocial |
| pe_esocial | boolean | Pode editar: esocial |
| pv_financeiro | boolean | Pode ver: financeiro |
| pe_financeiro | boolean | Pode editar: financeiro |
| pv_clinica | boolean | Pode ver: clinica |
| pe_clinica | boolean | Pode editar: clinica |
| pv_vencimentos | boolean | Pode ver: vencimentos |
| pe_vencimentos | boolean | Pode editar: vencimentos |
| pv_consumo | boolean | Pode ver: consumo |
| pe_consumo | boolean | Pode editar: consumo |
| pv_sensiveis | boolean | Pode ver: sensiveis |
| pe_sensiveis | boolean | Pode editar: sensiveis |

Regras de acesso no protótipo: `{}`

## UsoIA

| Campo | Tipo | Descrição |
|---|---|---|
| user_id | string | ID do usuário |
| recurso | string | Recurso (chat_nr, dds, pgr_riscos...) |
| creditos | number | Créditos descontados |
| fonte | string | De onde saiu o crédito — valores: mensal, extra, excedente, misto, gratuito, ilimitado |
| provedor | string | Provedor (gemini ou base44) |
| modelo | string | Modelo |
| tokens_entrada | number | Tokens de entrada |
| tokens_saida | number | Tokens de saída |
| conta_id | string | Conta pagadora |
| user_email | string | E-mail do usuário |
| valor_excedente | number | Valor cobrado como excedente (R$) |

Regras de acesso no protótipo: `{"read": {"data.user_id": "{{user.id}}"}, "create": false, "update": false, "delete": false}`

## Vacina

| Campo | Tipo | Descrição |
|---|---|---|
| company_id | string | Empresa |
| trabalhador_id | string | Trabalhador |
| trabalhador_nome | string | Nome do trabalhador |
| vacina | string | Vacina — valores: tétano, hepatite_b, influenza, covid19, febre_amarela, sarampo, tuberculose, outra |
| dose | string | Dose — valores: 1, 2, 3, reforco, dose_unica |
| data_aplicacao | string (data) | Data de aplicação |
| proxima_dose | string (data) | Próxima dose |
| lote | string | Lote |
| observacoes | string | Observações |
| org_id | string | Organização |

Regras de acesso no protótipo: `{"read": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pv_saude": true}}]}]}, "create": {"$and": [{"data.org_id": "{{user.data.org_id}}"}, {"user_condition": {"data.org_ativo": true, "data.pe_saude": true}}]}, "update": {"$or": [{"created_by_id": "{{user.id}}"}, {"$and": [{"data.org_id": "{{user.data.`

## VentMessage

| Campo | Tipo | Descrição |
|---|---|---|
| anonymous_id | string | Identificador anônimo (hash, nunca o user_id) |
| tipo | string | Tipo — valores: texto, audio |
| conteudo | string | Conteúdo |
| nivel_estresse | number | Nível de estresse (1-5) |
| sinalizado_risco | boolean | Sinalizado risco grave |
| categoria_risco | string | Categoria de risco (IA) — valores: nenhum, autolesao, risco_fisico, terceiros |
| persona | string | Personalidade do Zeca |
| response | string | Resposta do Zeca |

Regras de acesso no protótipo: `{"read": false, "create": {}, "update": false, "delete": false}`

## WellnessAssessment

| Campo | Tipo | Descrição |
|---|---|---|
| anonymous_id | string | Identificador anônimo (hash, nunca o user_id) |
| instrument | string | Instrumento — valores: pss4, olbi8, ucla3, disconnection |
| score | number | Pontuação total |
| level | string | Faixa — valores: baixo, moderado, elevado |
| responses | array | Respostas |
| sinalizado_risco | boolean | Sinalizado risco grave |

Regras de acesso no protótipo: `{"read": false, "create": {}, "update": false, "delete": false}`