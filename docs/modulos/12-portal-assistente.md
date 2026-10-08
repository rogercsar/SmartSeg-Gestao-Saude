# Módulo 12 — Portal do cliente e Assistente de IA

**Objetivo:** Portal somente leitura por link para o RH do cliente (sem dado clínico) e assistente de IA com chat de normas, textos técnicos e base normativa.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/AssistenteIA.jsx`
- `src/pages/ChatNR.jsx`
- `src/pages/Organizacao.jsx (aba Portal)`

## Lógica do servidor (referência)

- `base44/functions/portal-cliente/entry.ts`
- `base44/functions/ai-invoke/entry.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Company (portal_token, portal_ativo)
- ChatConversation
- TextoTecnico

## Regras de negócio obrigatórias

1. Link do portal com token de 48 caracteres, revogável; nunca exibir CID ou ficha clínica.
2. IA nunca recebe nome ou CPF; só dados agregados ou anonimizados.
3. Toda resposta da IA é rascunho para revisão do profissional.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Ativar portal, abrir em aba anônima, desativar e confirmar que o link morreu.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
