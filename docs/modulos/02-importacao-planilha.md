# Módulo 2 — Importação por planilha

**Objetivo:** Entrada em massa de colaboradores e do histórico de ASOs (migração do sistema anterior), com prévia e validação antes de gravar.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Importacao.jsx`

## Lógica do servidor (referência)

- `base44/functions/clinica/entry.ts` — (ação importar_asos)

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/gestaoOperacional.ts (cpfValido, data, formatarCpf)`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Trabalhador
- Setor
- CargoFuncao
- Atendimento

## Regras de negócio obrigatórias

1. Empresa identificada pelo CNPJ; setores e cargos inexistentes são criados.
2. CPF existente na empresa = atualização (nunca duplicar).
3. CPF validado por dígito verificador; datas dd/mm/aaaa, ISO e número do Excel.
4. Nada é gravado antes da conferência; linhas com erro são ignoradas e listadas.
5. ASOs importados entram como finalizados (origem=importacao), sem duplicar mesmo colaborador+data.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Planilha com 3 linhas, uma com CPF inválido: 2 importadas, 1 rejeitada com motivo.
- [ ] Reimportar a mesma planilha: nenhum duplicado.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
