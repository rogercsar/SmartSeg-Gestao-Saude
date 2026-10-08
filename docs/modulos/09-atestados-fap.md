# Módulo 9 — Atestados, S-2230, absenteísmo e FAP

**Objetivo:** Lançamento (inclusive leitura por foto com IA), regras do S-2230, alertas de INSS, perfil epidemiológico e simulação do FAP.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Atestados.jsx`
- `src/components/atestados/`

## Lógica do servidor (referência)

- `base44/functions/ai-invoke/entry.ts` — (atestado_leitura)

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/afastamentos.ts`
- `dominio/epidemiologia.ts`
- `dominio/fap.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Atestado
- RelatorioSaude

## Regras de negócio obrigatórias

1. S-2230: < 3 dias não obriga (salvo soma); 3–15 dias até o dia 7 do mês seguinte (escolha conservadora); > 15 dias até o 16º dia; mesma doença (3 caracteres do CID) somada em 60 dias.
2. CID é dado sensível: visível só com permissão.
3. FAP: IC = (0,50·gravidade + 0,35·frequência + 0,15·custo) × 0,02; travas de morte/invalidez e rotatividade > 75%.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Atestado de 2 dias não gera S-2230; de 20 dias gera com prazo no 16º dia.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
