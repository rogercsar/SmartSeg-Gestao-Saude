# Módulo 4 — Trilha de autoria e QR Code de autenticidade

**Objetivo:** Segurança jurídica: registrar o que a IA sugeriu, o que o profissional alterou e quem emitiu; QR Code público para conferir se o documento é original.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/components/programas/DocumentosProgramas.jsx`
- `src/components/QrAutenticidade.jsx`
- `src/pages/ImprimirPrograma.jsx`
- `src/pages/ImprimirAso.jsx`

## Lógica do servidor (referência)

- `base44/functions/autenticidade/entry.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Autenticacao
- TrilhaDocumento

## Regras de negócio obrigatórias

1. Trilha só gravada pelo servidor, sem edição nem exclusão (append-only).
2. Na emissão: hash SHA-256 do conteúdo canônico + código único; versões anteriores ficam 'substituídas'.
3. Página pública de verificação mostra só metadados (tipo, empresa, data, responsável) e recalcula o hash para detectar alteração.
4. Percentual de alteração entre a sugestão da IA e o texto final registrado por seção.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Gerar texto com IA, editar, emitir; escanear o QR; alterar o documento e verificar que a página acusa alteração.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
