# Módulo 1 — Organização, perfis e permissões

**Objetivo:** Dados pertencem à organização (cliente do SaaS), não à pessoa. Três perfis: Administrador, Gestor e Funcionário. O titular define, por módulo, Sem acesso / Ver / Ver e editar.

## Arquivos de referência no protótipo (`referencia-base44/`)

- `src/pages/Organizacao.jsx`
- `src/components/SidebarNav.jsx`
- `src/components/Layout.jsx`

## Lógica do servidor (referência)

- `base44/functions/organizacao/entry.ts`

## Regras já extraídas em TypeScript (`dominio/`)

- `dominio/permissoes.ts`
- `dominio/servidor/permissoesFlags.ts`

## Tabelas envolvidas

Ver campos em `docs/CAMPOS_TABELAS.md` e a situação (nova × mapear) em `docs/MAPA_TABELAS.md`.

- Organizacao
- MembroOrganizacao

## Regras de negócio obrigatórias

1. Administrador sempre edita tudo; Gestor e Funcionário seguem a matriz definida pelo titular (padrões em PADRAO).
2. Módulos só de leitura: clínica (menu), vencimentos, consumo e 'sensíveis' (CID).
3. CID dos atestados só para quem tem 'Dados sensíveis' (LGPD art. 11).
4. Assinatura suspensa/cancelada/sem pagamento = somente leitura para todos (BLOQUEIA_EDICAO); 15 dias de tolerância na inadimplência.
5. Permissão verificada NO BACKEND em toda operação; o menu apenas esconde o que o usuário não acessa.
6. Convite por e-mail; no 1º acesso o usuário entra na organização; desativar corta o acesso sem apagar dados.

## Roteiro de validação (você testa antes de enviar ao desenvolvedor)

- [ ] Convidar um Funcionário; ele vê as empresas, mas não Atestados/Financeiro.
- [ ] Liberar 'Ver' em Saúde: ele vê atestados SEM o CID.
- [ ] Desativar o membro: acesso cortado na hora.
- [ ] Assinatura suspensa: tudo vira leitura.
- [ ] Testes automáticos passando
- [ ] Revisado pelo desenvolvedor e testado em homologação
