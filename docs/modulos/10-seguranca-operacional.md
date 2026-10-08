# Módulo 10 — EPI, treinamentos, inspeções, planos de ação e CIPA

**Objetivo:** Entregas de EPI com assinatura e ficha NR-6, matriz de treinamentos por cargo, checklists no celular com plano de ação e gestão da CIPA.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Epi.jsx`
- `src/pages/FichaEpi.jsx`
- `src/pages/Treinamentos.jsx`
- `src/pages/Inspecoes.jsx`
- `src/pages/Cipa.jsx`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/sstGestao.ts`
- `dominio/gestaoOperacional.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- EpiItem
- EntregaEpi
- MatrizTreinamento
- Treinamento
- ModeloChecklist
- InspecaoChecklist
- PlanoAcao
- MandatoCipa
- ReuniaoCipa

## Regras de negócio obrigatórias

1. CA vencido bloqueia a entrega (com confirmação explícita registrada).
2. EPI exigido = EPIs dos riscos do cargo no PGR.
3. Não conformidade de inspeção exige descrição e vira ação com prazo.
4. NR-5: edital 60 dias antes do fim do mandato, inscrições 15 dias, votação 30 dias antes; estabilidade dos eleitos até 1 ano após o mandato; treinamento 8/12/16/20 h por grau de risco.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Entregar EPI com assinatura e gerar a ficha; concluir inspeção com não conformidade e ver a ação criada.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
