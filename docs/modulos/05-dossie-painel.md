# Módulo 5 — Dossiê da fiscalização, painel inicial e vencimentos

**Objetivo:** O que vende: conformidade por cliente, pendências críticas, renovações e o dossiê em PDF para o auditor fiscal.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Home.jsx`
- `src/pages/Dossie.jsx`
- `src/pages/Vencimentos.jsx`
- `src/pages/PainelNegocio.jsx`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/gestaoOperacional.ts (montarVencimentos, situacaoTreinamentos, situacaoEpiColaborador)`
- `dominio/sstGestao.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- ProgramaSST
- Treinamento
- MatrizTreinamento
- EntregaEpi
- PlanoAcao
- Atestado

## Regras de negócio obrigatórias

1. Conformidade do cliente: PGR e PCMSO emitidos e vigentes, ≥ 90% dos treinamentos exigidos em dia, nenhum EPI exigido pendente, nenhuma ação atrasada.
2. Prazos sempre no fuso America/Cuiaba.
3. Renovações = programas e reciclagens vencendo em 90 dias.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Empresa sem PGR aparece como Crítico; emitir PGR e ver a mudança.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
