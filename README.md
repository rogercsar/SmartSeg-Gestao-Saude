# SmartSeg — Projeto Standalone (Desvinculado do Base44)

Este diretório contém a estrutura **100% desvinculada do Base44**, pronta para ser hospedada em seu servidor próprio e conectada ao seu próprio banco de dados PostgreSQL.

---

## 📁 Estrutura de Pastas

```
smartseg-standalone/
├── backend/                   # Servidor de API (Node.js, Express, PostgreSQL)
│   ├── src/                   # Rotas de Auth, CRUD dinâmico das 64 tabelas e funções
│   ├── package.json
│   └── .env
├── database/
│   ├── criacao_completa.sql   # Script SQL com as 64 tabelas completas para PostgreSQL
│   └── schema.rascunho.prisma # Esquema Prisma correspondente
├── docs/
│   ├── CAMPOS_TABELAS.md      # Dicionário de campos e tipos
│   ├── MAPA_TABELAS.md        # Mapeamento de tabelas e entidades
│   ├── PROMPTS_CLAUDE_CODE.md # Roteiros de migração assistida
│   └── modulos/               # 12 especificações de módulos de negócio (01 ao 12)
├── dominio/                   # Lógica e cálculos de SST puros em TypeScript (NR-15, NR-09, Atestados, etc.)
└── frontend/                  # Aplicação Web React + Vite + Tailwind (240+ telas)
    ├── src/
    │   ├── api/base44Client.js# Cliente REST genérico independente (conecta ao seu backend)
    │   ├── components/        # Componentes de interface (Radix UI, Lucide)
    │   ├── pages/             # Todas as páginas do sistema
    │   ├── lib/               # Autenticação e utilitários
    │   └── ...
    ├── index.html
    ├── package.json           # Dependências limpas (sem @base44/sdk)
    ├── vite.config.js         # Configuração padrão do Vite
    ├── tailwind.config.js     # Design System e temas
    └── .env                   # Configurações de API (VITE_API_URL)
```

---

## 🗄️ 1. Banco de Dados (PostgreSQL)

O arquivo `database/criacao_completa.sql` contém a criação de **64 tabelas** completas com chaves primárias, índices e tipos de dados otimizados (`JSONB`, `DATE`, `TIMESTAMP`, etc.).

### Como importar no seu PostgreSQL:

```bash
# 1. Crie o banco de dados
createdb -U postgres smartseg

# 2. Execute o script de criação
psql -U postgres -d smartseg -f database/criacao_completa.sql
```

Ou abra o arquivo `database/criacao_completa.sql` no seu gerenciador de banco preferido (**DBeaver**, **pgAdmin**, **TablePlus**, **Supabase SQL Editor**) e execute o script.

---

## 💻 2. Frontend (React + Vite)

O frontend foi desacoplado de bibliotecas proprietárias da Base44. Agora ele utiliza um cliente HTTP REST genérico em `src/api/base44Client.js` que aponta para a variável `VITE_API_URL`.

### Como rodar localmente:

1. Acesse a pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. O frontend estará disponível em:
   ```
   http://localhost:5173
   ```

### Configuração da API (`.env`):
Edite o arquivo `frontend/.env` para apontar para o seu backend:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🔌 3. Como seu Backend Próprio se Conecta ao Frontend

O cliente em `src/api/base44Client.js` já traduz automaticamente todas as chamadas feitas pelas 240+ páginas do sistema para rotas REST padrão com cabeçalho `Authorization: Bearer <token>`:

| Método chamado no Front | Requisição HTTP para seu Backend |
| :--- | :--- |
| `base44.entities.<Tabela>.list(order, limit)` | `GET /api/entities/<Tabela>?order=<order>&limit=<limit>` |
| `base44.entities.<Tabela>.filter(filtro, options)` | `POST /api/entities/<Tabela>/filter` |
| `base44.entities.<Tabela>.get(id)` | `GET /api/entities/<Tabela>/<id>` |
| `base44.entities.<Tabela>.create(dados)` | `POST /api/entities/<Tabela>` |
| `base44.entities.<Tabela>.update(id, dados)` | `PUT /api/entities/<Tabela>/<id>` |
| `base44.entities.<Tabela>.delete(id)` | `DELETE /api/entities/<Tabela>/<id>` |
| `base44.entities.<Tabela>.count(filtro)` | `POST /api/entities/<Tabela>/count` |
| `base44.functions.invoke(nome, payload)` | `POST /api/functions/<nome>` |
| `base44.auth.login(credenciais)` | `POST /api/auth/login` |
| `base44.auth.me()` | `GET /api/auth/me` |

*(Você pode usar Node/Express, NestJS, Fastify, Go, Python/FastAPI, C#/ASP.NET ou qualquer backend de sua preferência).*

---

## 📐 4. Regras de Domínio (`dominio/`)

Na pasta `dominio/` estão os arquivos TypeScript com as fórmulas oficiais de cálculo e regras da legislação brasileira (já testadas e validadas):
- `calculos.ts`: Higiene ocupacional (calor NR-09/NR-15, ruído, poeira sílica, iluminância NHO 11, ACGIH).
- `afastamentos.ts`: Regras de atestados médicos, prazos para o evento eSocial S-2230 e fuso horário.
- `psicossocial.ts`: Questionários e avaliação de riscos psicossociais (NR-1).
- `fap.ts` e `finance.ts`: Absenteísmo, Fator Acidentário de Prevenção e finanças.
- `esocialDerivacao.ts`: Regras para eventos S-2210, S-2220 e S-2240.
