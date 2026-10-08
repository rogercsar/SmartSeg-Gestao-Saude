# Módulo 6 — Cobrança pelo uso (planos + créditos + ASO)

**Objetivo:** Planos Técnico, Consultoria e Clínica com créditos de IA incluídos, excedente com limite de gasto e valor por ASO emitido.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Consumo.jsx`
- `src/pages/Assinaturas.jsx`
- `src/components/FechamentoUso.jsx`
- `src/components/ViabilidadeUso.jsx`

## Lógica do servidor (referência)

- `base44/functions/ai-invoke/entry.ts`
- `base44/functions/faturamento/entry.ts`
- `base44/functions/assinar/entry.ts`
- `base44/functions/pagamento-webhook/entry.ts`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/precos.ts`
- `dominio/servidor/creditos.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- CarteiraIA
- UsoIA
- Assinatura
- EventoPagamento

## Regras de negócio obrigatórias

1. Toda IA passa pelo backend; crédito descontado só depois da resposta da IA.
2. Ordem: franquia do mês → recargas → excedente até o limite de gasto (limite 0 = pausa).
3. Custos por recurso em CUSTOS (1 a 3 créditos); Espaço/Canal de escuta e transcrições gratuitos.
4. Fechamento mensal: uma cobrança por cliente/mês (idempotente); abaixo do mínimo do gateway não cobra.
5. Webhook de pagamento validado por token e processado uma única vez; cartão nunca passa pelo sistema.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Consumir até a franquia; definir limite R$ 2; consumir mais; ver bloqueio; fechamento gera uma cobrança.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
