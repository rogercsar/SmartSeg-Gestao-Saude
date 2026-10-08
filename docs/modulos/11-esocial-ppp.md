# Módulo 11 — eSocial e PPP

**Objetivo:** Eventos esperados por colaborador e PPP para períodos anteriores ao PPP eletrônico, conferência e processos.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Esocial.jsx`
- `src/pages/ImprimirPpp.jsx`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/esocialDerivacao.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- EventoEsocial
- CodigoEsocial
- LotacaoHistorico
- OcorrenciaAcidente

## Regras de negócio obrigatórias

1. Eventos de SST: S-2210 (CAT), S-2220 (ASO), S-2221 (toxicológico de motorista — CBO 7823/7824/7825), S-2240 (todo empregado; sem risco = 09.01.001).
2. S-2245 e S-2250 foram extintos; CIPA não tem evento.
3. PPP: GFIP 04 quando há enquadramento para aposentadoria especial; nota do STF (Tema 555) para ruído.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Colaborador com atestado de 20 dias e acidente: aparecem S-2230 e S-2210.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
