# Módulo 3 — Riscos psicossociais (NR-1)

**Objetivo:** Pesquisa anônima por link, resultados agregados por dimensão e setor e inclusão dos riscos no inventário do PGR (obrigatório desde 26/05/2026).

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Psicossocial.jsx`

## Lógica do servidor (referência)

- `base44/functions/pesquisa-psicossocial/entry.ts`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/psicossocial.ts`
- `dominio/servidor/psicossocialPontuacao.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- InstrumentoPsicossocial
- AplicacaoPsicossocial
- RespostaPsicossocial

## Regras de negócio obrigatórias

1. Resposta anônima: sem nome, CPF, e-mail ou IP gravado.
2. Grupos com menos de 5 respostas não são exibidos.
3. Instrumento importável (ex.: COPSOQ II BR) com escala invertida, pontuação binária, soma/média e pontos de corte por dimensão; o roteiro de triagem embutido é marcado 'não validado'.
4. Dimensão de 'risco' (maior = pior) × 'recurso' (maior = melhor).
5. Nível do grupo: alto ≥ 50% desfavoráveis; moderado 25–49%.
6. Inclusão no PGR: probabilidade pela % desfavorável, severidade 3 (4 para violência/assédio), plano de ação sugerido, marcado como não revisado.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Criar pesquisa; responder 5 vezes; ver resultado; incluir no PGR.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
