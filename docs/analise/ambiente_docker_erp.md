# Ambiente Docker — SIS EfratAgro ERP

## 1. Estratégia Adotada

O ambiente de desenvolvimento utiliza **Docker Compose** para orquestrar três serviços isolados — **PostgreSQL**, **Backend (Node.js + Express)** e **Frontend (React + Vite)** — dentro de uma rede Docker dedicada (`efratagro_net`).

Princípios seguidos:

| Princípio | Como foi aplicado |
|-----------|-------------------|
| **Um comando** | `docker compose up -d` sobe tudo |
| **Hot reload** | Bind mounts + nodemon (backend) + Vite dev server (frontend) |
| **Persistência** | Named volume `efratagro_pgdata` para dados do PostgreSQL |
| **Isolamento** | Named volumes para `node_modules` evitam conflito host ↔ container |
| **Variáveis de ambiente** | Arquivo `.env` na raiz, lido por backend e compose |
| **Comunicação interna** | Containers se comunicam pelo nome do serviço na rede Docker |
| **Migrations padronizadas** | Script `scripts/db-init.sh` executa migrations e seeders |

---

## 2. Estrutura dos Arquivos Docker

```
/sis_efratagro
├── docker-compose.yml          ← Orquestração dos 3 serviços
├── .env                        ← Variáveis de ambiente (não versionado)
├── .env.example                ← Template para novos desenvolvedores
├── scripts/
│   └── db-init.sh              ← Executa migrations e seeders
├── backend/
│   ├── Dockerfile              ← Imagem do backend
│   └── .dockerignore           ← Ignora node_modules, .env
└── frontend/
    ├── Dockerfile              ← Imagem do frontend
    └── .dockerignore           ← Ignora node_modules, dist, .env
```

---

## 3. Dockerfiles

### 3.1 Backend — `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]
```

**Detalhes:**

- **`node:20-alpine`** — Imagem leve (~180 MB).
- **`postgresql-client`** — Necessário para o script `db-init.sh` executar `psql` de dentro do container.
- **`WORKDIR /app`** — Diretório padrão de trabalho.
- **`npm run dev`** — Executa `nodemon server.js` para hot reload.

### 3.2 Frontend — `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Detalhes:**

- **`--host 0.0.0.0`** — Permite acesso externo ao container (necessário para que o host acesse `localhost:5173`).
- **`EXPOSE 5173`** — Porta padrão do Vite.

### 3.3 `.dockerignore` — Backend (`backend/.dockerignore`)

```
node_modules
npm-debug.log*
.env
```

### 3.4 `.dockerignore` — Frontend (`frontend/.dockerignore`)

```
node_modules
npm-debug.log*
dist
.env
.env.local
```

---

## 4. Docker Compose — `docker-compose.yml`

```yaml
services:
  # ---------------------------------------------------------------------------
  # PostgreSQL
  # ---------------------------------------------------------------------------
  postgres:
    image: postgres:16-alpine
    container_name: efratagro_postgres
    restart: unless-stopped
    ports:
      - "${DB_EXTERNAL_PORT:-5433}:5432"
    environment:
      POSTGRES_DB: ${DB_NAME:-sis_efratagro}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - efratagro_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-sis_efratagro}"]
      interval: 5s
      timeout: 5s
      retries: 10

  # ---------------------------------------------------------------------------
  # Backend — Node.js + Express
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./backend
    container_name: efratagro_backend
    restart: unless-stopped
    ports:
      - "${PORT:-3002}:${PORT:-3002}"
    env_file:
      - .env
    environment:
      DB_HOST: postgres
    volumes:
      - ./backend:/app
      - backend_node_modules:/app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - efratagro_net

  # ---------------------------------------------------------------------------
  # Frontend — React + Vite
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
    container_name: efratagro_frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: /api
      VITE_API_PROXY_TARGET: http://backend:${PORT:-3002}
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    depends_on:
      - backend
    networks:
      - efratagro_net

volumes:
  pgdata:
    name: efratagro_pgdata
  backend_node_modules:
    name: efratagro_backend_node_modules
  frontend_node_modules:
    name: efratagro_frontend_node_modules

networks:
  efratagro_net:
    name: efratagro_net
    driver: bridge
```

### Fluxo de dependências

```
postgres (healthy) → backend (started) → frontend (started)
```

O backend só inicia quando o PostgreSQL estiver aceitando conexões (`service_healthy`). O frontend só inicia após o backend.

---

## 5. Variáveis de Ambiente — `.env.example`

```env
# ===========================================================================
# ERP Efrat Agro — Variáveis de Ambiente
# Copie este arquivo para .env e ajuste os valores
# ===========================================================================

# ---------------------------------------------------------------------------
# Geral
# ---------------------------------------------------------------------------
NODE_ENV=development
APP_NAME=SIS EfratAgro ERP
PORT=3002
API_PREFIX=/api

# ---------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sis_efratagro

# Porta externa do PostgreSQL no host (evita conflito se já houver outro PG rodando)
DB_EXTERNAL_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sis_efratagro

# ---------------------------------------------------------------------------
# JWT / Sessão
# ---------------------------------------------------------------------------
JWT_SECRET=troque-esta-chave-em-producao
JWT_EXPIRES_IN=8h
JWT_ISSUER=sis-efratagro-api
JWT_AUDIENCE=sis-efratagro-app

SESSION_IDLE_TIMEOUT_MINUTES=30
SESSION_ABSOLUTE_TIMEOUT_HOURS=8
PASSWORD_RESET_TOKEN_TTL_MINUTES=30

# ---------------------------------------------------------------------------
# Frontend (lidas pelo Vite com prefixo VITE_)
# ---------------------------------------------------------------------------
VITE_API_BASE_URL=/api
# VITE_API_PROXY_TARGET=http://backend:3002
```

**Observação sobre `DB_HOST`:** No Docker Compose, o valor é `postgres` (nome do serviço). Para rodar o backend fora do Docker (diretamente no host), altere para `localhost`.

**Observação sobre `DB_EXTERNAL_PORT`:** Valor padrão `5433` para evitar conflito quando o host já possui outro PostgreSQL na porta `5432`.

---

## 6. Estratégia de Volumes

### 6.1 Volumes nomeados (Named Volumes)

| Volume | Finalidade |
|--------|-----------|
| `efratagro_pgdata` | Persiste os dados do PostgreSQL entre reinicializações |
| `efratagro_backend_node_modules` | Isola `node_modules` do backend (container ≠ host) |
| `efratagro_frontend_node_modules` | Isola `node_modules` do frontend (container ≠ host) |

### 6.2 Bind mounts (código fonte)

| Bind mount | Finalidade |
|------------|-----------|
| `./backend:/app` | Sincroniza código-fonte do backend com o container |
| `./frontend:/app` | Sincroniza código-fonte do frontend com o container |

### Por que isolar `node_modules`?

Se o bind mount `./backend:/app` fosse montado sem o volume nomeado para `/app/node_modules`, o `node_modules` do host sobrescreveria o do container (e vice-versa). Isso causaria problemas quando host e container possuem binários nativos diferentes (ex.: `bcrypt`, `esbuild`). O volume nomeado garante que cada ambiente mantém seus próprios módulos compilados.

---

## 7. Estratégia de Hot Reload

### 7.1 Backend — Nodemon

O `package.json` do backend define o script `dev`:

```json
"scripts": {
  "dev": "nodemon server.js"
}
```

O **nodemon** monitora alterações em arquivos `.js`, `.mjs`, `.cjs` e `.json`. Quando qualquer arquivo no bind mount `./backend:/app` é alterado no editor, o container detecta a mudança e reinicia o servidor automaticamente.

### 7.2 Frontend — Vite Dev Server

O Vite possui HMR (Hot Module Replacement) nativo. O `vite.config.js` foi configurado com:

```js
server: {
  port: 5173,
  host: true,  // escuta em 0.0.0.0 (necessário dentro do container)
  proxy: {
    "/api": {
      target: process.env.VITE_API_PROXY_TARGET || "http://localhost:3002",
      changeOrigin: true,
    },
  },
},
```

- **`host: true`** — Necessário para que o Vite escute em todas as interfaces de rede do container.
- **Proxy `/api`** — Redireciona chamadas `/api/*` do frontend para o backend, evitando problemas de CORS em desenvolvimento.
- **`VITE_API_PROXY_TARGET`** — No Docker Compose, o valor é `http://backend:3002` (nome do serviço). Fora do Docker, o fallback é `http://localhost:3002`.

---

## 8. Estratégia para Persistência do PostgreSQL

Os dados do PostgreSQL são armazenados no volume nomeado `efratagro_pgdata`, mapeado para `/var/lib/postgresql/data` dentro do container.

**Comportamento:**

| Ação | Dados do banco |
|------|---------------|
| `docker compose down` | ✅ Preservados |
| `docker compose down -v` | ❌ **Removidos** (apaga volumes) |
| `docker compose restart postgres` | ✅ Preservados |
| `docker compose up --build` | ✅ Preservados |

Para **resetar completamente** o banco:

```bash
docker compose down -v
docker compose up -d
```

---

## 9. Estratégia para Migrations e Seeders

### 9.1 Script `scripts/db-init.sh`

```bash
#!/usr/bin/env bash
# ===========================================================================
# scripts/db-init.sh — Executa migrations e seeders no PostgreSQL
# Uso: ./scripts/db-init.sh [--seed]
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Carrega .env da raiz se existir
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sis_efratagro}"
DB_USER="${DB_USER:-postgres}"

PGPASSWORD="${DB_PASSWORD:-postgres}"
export PGPASSWORD

echo "==> Aguardando PostgreSQL em ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q 2>/dev/null; do
  sleep 1
done
echo "==> PostgreSQL disponível."

echo "==> Executando migrations..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f "$ROOT_DIR/backend/src/database/migrations.sql"
echo "==> Migrations aplicadas com sucesso."

if [[ "${1:-}" == "--seed" ]]; then
  echo "==> Executando seeders..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$ROOT_DIR/backend/src/database/seeders.sql"
  echo "==> Seeders aplicados com sucesso."
fi

echo "==> Banco de dados inicializado."
```

### 9.2 Como executar

**De dentro do container backend** (recomendado):

```bash
docker compose exec backend sh -c "cd /app && sh ../scripts/db-init.sh --seed"
```

Ou, como o backend já possui `postgresql-client` instalado:

```bash
# Apenas migrations
docker compose exec backend psql -h postgres -U postgres -d sis_efratagro -f /app/src/database/migrations.sql

# Migrations + seeders
docker compose exec backend psql -h postgres -U postgres -d sis_efratagro -f /app/src/database/migrations.sql
docker compose exec backend psql -h postgres -U postgres -d sis_efratagro -f /app/src/database/seeders.sql
```

**Direto do host** (requer `psql` instalado):

```bash
./scripts/db-init.sh --seed
```

> **Nota:** Ao rodar do host, `DB_HOST` precisa ser `localhost` e a porta de conexão é `5433` (porta externa mapeada).

---

## 10. Passo a Passo para Subir o Ambiente

### Primeira vez

```bash
# 1. Clonar o repositório
git clone <url-do-repo>
cd sis_efratagro

# 2. Criar arquivo .env a partir do template
cp .env.example .env

# 3. Subir todos os serviços
docker compose up -d

# 4. Verificar se tudo subiu
docker compose ps

# 5. Executar migrations e seeders
docker compose exec backend psql -h postgres -U postgres -d sis_efratagro -f /app/src/database/migrations.sql
docker compose exec backend psql -h postgres -U postgres -d sis_efratagro -f /app/src/database/seeders.sql

# 6. Acessar
# Frontend:  http://localhost:5173
# Backend:   http://localhost:3002/api
# Postgres:  localhost:5433
```

### Dias seguintes

```bash
# Subir ambiente
docker compose up -d

# Parar ambiente
docker compose down

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
```

---

## 11. Dicas para Desenvolvimento Diário

| Situação | Comando |
|----------|---------|
| Ver status dos containers | `docker compose ps` |
| Ver logs em tempo real | `docker compose logs -f` |
| Reiniciar apenas o backend | `docker compose restart backend` |
| Acessar terminal do backend | `docker compose exec backend sh` |
| Acessar terminal do postgres | `docker compose exec postgres psql -U postgres -d sis_efratagro` |
| Reinstalar dependências do backend | `docker compose exec backend npm install` |
| Reinstalar dependências do frontend | `docker compose exec frontend npm install` |
| Reconstruir imagens após alterar Dockerfile | `docker compose up -d --build` |
| Resetar banco de dados | `docker compose down -v && docker compose up -d` |
| Ver portas em uso | `docker compose ps --format "table {{.Name}}\t{{.Ports}}"` |

### Portas padrão do projeto

| Serviço | Porta host | Porta container |
|---------|-----------|----------------|
| Frontend (Vite) | 5173 | 5173 |
| Backend (Express) | 3002 | 3002 |
| PostgreSQL | 5433 | 5432 |

### Comunicação entre containers

Dentro da rede Docker, os serviços se comunicam pelo **nome do serviço**:

- Frontend → Backend: `http://backend:3002` (via proxy Vite)
- Backend → PostgreSQL: `postgres:5432` (definido em `DB_HOST`)

### Conflito de portas

Se alguma porta já estiver em uso no host, ajuste no `.env`:

```env
# Trocar porta do backend
PORT=3005

# Trocar porta externa do PostgreSQL
DB_EXTERNAL_PORT=5434
```

Depois, reinicie:

```bash
docker compose down && docker compose up -d
```

---

## Resumo de Arquivos Criados / Modificados

| Arquivo | Ação |
|---------|------|
| `docker-compose.yml` | Criado na raiz |
| `.env.example` | Criado na raiz |
| `backend/Dockerfile` | Reescrito |
| `frontend/Dockerfile` | Criado |
| `frontend/.dockerignore` | Criado |
| `backend/.dockerignore` | Já existia (mantido) |
| `scripts/db-init.sh` | Criado |
| `frontend/vite.config.js` | Atualizado (host, proxy dinâmico) |
