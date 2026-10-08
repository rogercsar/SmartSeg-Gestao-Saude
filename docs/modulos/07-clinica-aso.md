# Módulo 7 — Clínica: agenda, atendimento e ASO

**Objetivo:** Agenda, convocação de periódicos, triagem, anamnese, exame físico, exames, ASO com aptidões especiais e prévia do S-2220.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Clinica.jsx`
- `src/pages/AtendimentoClinico.jsx`
- `src/pages/ImprimirAso.jsx`

## Lógica do servidor (referência)

- `base44/functions/clinica/entry.ts`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/clinica.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Clinica
- MembroClinica
- Agendamento
- Atendimento
- LogAcessoClinico

## Regras de negócio obrigatórias

1. Dados clínicos só pelo backend com verificação de perfil; recepção não vê ficha clínica.
2. Só médico com CRM emite ASO; ASO emitido bloqueia edição.
3. Avulso sem pagamento não libera ASO; kit desconta saldo.
4. Registro de cada acesso à ficha (LGPD).
5. Aptidões especiais (altura, confinado, eletricidade, máquinas, inflamáveis, direção) sugeridas pela matriz de treinamentos e pelos riscos.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Agendar, marcar 'Chegou', triagem, consulta, emitir ASO (bloqueia sem pagamento se avulso).
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
