# Módulo 8 — PGR, PCMSO, LTCAT, laudos e medições

**Objetivo:** Inventário de riscos (com IA), matriz, medições com critério NR × NHO, PCMSO, laudos e documentos.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Programas.jsx`
- `src/components/programas/`

## Lógica do servidor (referência)

- `base44/functions/levantamento-publico/entry.ts`
- `base44/functions/ai-invoke/entry.ts`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/calculos.ts`
- `dominio/sst.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Risco
- Medicao
- Equipamento
- ExamePcmso
- ProgramaSST
- Anexo
- Levantamento

## Regras de negócio obrigatórias

1. Severidade e probabilidade sempre gravadas em 1–5 (a matriz 4x4 só converte na tela).
2. Calor: NR-09 Anexo III (Portaria MTE 105/2026) — aclimatizado × não aclimatizado, vestimenta (Quadro 4), taxa metabólica (Quadro 3); insalubridade só pelo NR-15 Anexo 3 e nunca a céu aberto sem fonte artificial.
3. Ruído: NR-15 (q=5) para insalubridade; NHO-01 (q=3) para prevenção e aposentadoria especial.
4. Iluminação: NHO 11 (E com 10% de tolerância, ≥ 70% da média, 200 lux contínua, razão ≤ 5:1).
5. Sílica: NR-15 Anexo 12 pelo % de quartzo; ACGIH só prevenção.
6. Recalcular resultados no servidor; nunca confiar no resultado enviado pela tela.
7. Laudo de insalubridade com a declaração do item 15.4.1.3 da NR-15.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Rodar os testes de ouro (testes/dominio.test.ts) no sistema real: devem passar iguais.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
