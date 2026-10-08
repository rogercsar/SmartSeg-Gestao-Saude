# SmartSeg — Backend API (Node.js & Express & PostgreSQL)

Servidor de API completo para o **SmartSeg**, projetado para rodar em servidor próprio e se conectar diretamente ao banco de dados PostgreSQL gerado pelo script `database/criacao_completa.sql`.

---

## 🚀 Como Iniciar o Backend

### 1. Instalar as dependências
```bash
cd backend
npm install
```

### 2. Configurar o arquivo `.env`
Edite o arquivo `.env` para apontar para o seu banco de dados PostgreSQL:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/smartseg
JWT_SECRET=sua_chave_secreta_jwt
CORS_ORIGIN=http://localhost:5173
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
*(Utiliza o modo `--watch` nativo do Node.js, reiniciando automaticamente a cada alteração).*

### 4. Rodar em Modo de Produção
```bash
npm start
```

---

## 📡 Endpoints da API

A API já fornece todos os endpoints que o frontend consome automaticamente:

### Autenticação (`/api/auth`)
- `POST /api/auth/login` — Autenticação por e-mail e senha (retorna token JWT).
- `POST /api/auth/register` — Cadastro de usuário.
- `GET /api/auth/me` — Dados do usuário logado (requer Bearer token).

### Entidades & CRUD de Tabelas (`/api/entities/:entity`)
Suporta dinamicamente **todas as 64 tabelas** do PostgreSQL:
- `GET /api/entities/:entity` — Lista registros (com suporte a `?order=-created_at&limit=100`).
- `POST /api/entities/:entity/filter` — Filtra registros por campos com suporte a `$in`.
- `POST /api/entities/:entity/count` — Retorna contagem total de registros filtrados.
- `GET /api/entities/:entity/:id` — Busca registro por ID.
- `POST /api/entities/:entity` — Cria novo registro.
- `POST /api/entities/:entity/bulk` — Inserção em lote.
- `PUT /api/entities/:entity/:id` — Atualiza registro existente por ID.
- `DELETE /api/entities/:entity/:id` — Exclui registro por ID.

### Funções de Negócio (`/api/functions/:name`)
- `POST /api/functions/organizacao` — Inicialização e contexto do tenant/organização.
- `POST /api/functions/assinar` — Assinatura eletrônica de documentos SST.
- `POST /api/functions/autenticidade` — Validação de autenticidade e QR Code.

### Status e Saúde
- `GET /api/health` — Verifica status do servidor e conexão com o PostgreSQL.
- `GET /api/app/public-settings` — Metadados públicos exigidos pelo frontend.
