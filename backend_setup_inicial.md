# Backend Setup Inicial

## 1. Visao Geral

Este setup inicial cria uma base profissional para o backend do ERP comercial usando `Node.js`, `Express` e `PostgreSQL`, seguindo o padrao `MSC (Models, Services, Controllers)`.

### Decisao tecnica principal

- Foi utilizada a biblioteca `pg` com `Pool`.
Motivo: oferece controle direto sobre SQL, reduz acoplamento inicial e combina bem com um ERP que tende a crescer em regras de negocio e performance.

---

## 2. Estrutura de Pastas

```txt
/backend
  /.dockerignore
  /.env.example
  /.gitignore
  /Dockerfile
  /docker-compose.yml
  /package.json
  /app.js
  /server.js
  /src
    /controllers
      healthController.js
    /services
      healthService.js
    /models
      healthModel.js
    /middlewares
      errorMiddleware.js
      notFoundMiddleware.js
    /routes
      index.js
    /database
      migrations.sql
      seeders.sql
    /config
      database.js
      env.js
    /utils
      AppError.js
```

### Responsabilidade de cada pasta

- `controllers`: recebe a requisicao HTTP e devolve a resposta.
- `services`: concentra regras de negocio e orquestracao.
- `models`: encapsula acesso ao banco.
- `middlewares`: trata fluxo transversal, como erro global e rota inexistente.
- `routes`: organiza endpoints por dominio.
- `database`: armazena `migrations.sql` e `seeders.sql`.
- `config`: centraliza configuracoes de ambiente e banco.
- `utils`: utilitarios reutilizaveis, como erro padronizado.

---

## 3. Arquivos Base do Projeto

### `backend/package.json`

```json
{
  "name": "sis-efratagro-backend",
  "version": "1.0.0",
  "description": "Backend base do ERP comercial com Node.js, Express e PostgreSQL",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "db:migrate": "psql \"$DATABASE_URL\" -f src/database/migrations.sql",
    "db:seed": "psql \"$DATABASE_URL\" -f src/database/seeders.sql",
    "docker:up": "docker compose up --build",
    "docker:down": "docker compose down"
  },
  "keywords": [
    "erp",
    "nodejs",
    "express",
    "postgresql",
    "msc"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

### `backend/.env.example`

```env
NODE_ENV=development
APP_NAME=SIS EfratAgro ERP
PORT=3001
API_PREFIX=/api

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sis_efratagro
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sis_efratagro
```

### `backend/.gitignore`

```gitignore
node_modules
.env
npm-debug.log*
```

### `backend/.dockerignore`

```gitignore
node_modules
npm-debug.log*
.env
```

---

## 4. Bootstrap da Aplicacao

### `backend/app.js`

```js
require("./src/config/env");

const express = require("express");

const env = require("./src/config/env");
const routes = require("./src/routes");
const notFoundMiddleware = require("./src/middlewares/notFoundMiddleware");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(env.apiPrefix, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
```

### `backend/server.js`

```js
require("./src/config/env");

const app = require("./app");
const env = require("./src/config/env");
const { testConnection, closePool } = require("./src/config/database");

let server;

const startServer = async () => {
  await testConnection();

  server = app.listen(env.port, () => {
    console.log(`[server] ${env.appName} rodando na porta ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("[server] Falha ao conectar no PostgreSQL:", error.message);
  process.exit(1);
});

const shutdown = async (signal) => {
  if (!server) {
    await closePool();
    process.exit(0);
  }

  try {
    console.log(`[server] Encerrando aplicacao por ${signal}`);

    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  } catch (error) {
    console.error("[server] Erro ao encerrar:", error);
    await closePool();
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", async (reason) => {
  console.error("[server] unhandledRejection:", reason);
  if (server) {
    server.close(async () => {
      await closePool();
      process.exit(1);
    });
    return;
  }

  await closePool();
  process.exit(1);
});

process.on("uncaughtException", async (error) => {
  console.error("[server] uncaughtException:", error);
  await closePool();
  process.exit(1);
});
```

### Observacao curta

- `app.js` monta a aplicacao.
- `server.js` sobe o processo HTTP e valida a conexao com o banco no startup.

---

## 5. Configuracao de Ambiente e Banco

### `backend/src/config/env.js`

```js
const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD"
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${envVar}`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "SIS EfratAgro ERP",
  port: Number(process.env.PORT || 3001),
  apiPrefix: process.env.API_PREFIX || "/api",
  databaseUrl: process.env.DATABASE_URL || "",
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT || 5432),
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbPoolMax: Number(process.env.DB_POOL_MAX || 10),
  dbIdleTimeout: Number(process.env.DB_IDLE_TIMEOUT || 30000),
  dbConnectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 5000)
};
```

### `backend/src/config/database.js`

```js
const { Pool } = require("pg");

const env = require("./env");

const poolConfig = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      max: env.dbPoolMax,
      idleTimeoutMillis: env.dbIdleTimeout,
      connectionTimeoutMillis: env.dbConnectionTimeout
    }
  : {
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
      max: env.dbPoolMax,
      idleTimeoutMillis: env.dbIdleTimeout,
      connectionTimeoutMillis: env.dbConnectionTimeout
    };

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("[database] Erro inesperado no pool:", error);
});

const query = (text, params = []) => pool.query(text, params);

const testConnection = async () => {
  await query("SELECT 1");
};

const closePool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  testConnection,
  closePool
};
```

### Observacao curta

- A conexao usa `Pool` para suportar concorrencia real de API sem abrir conexoes manuais por request.

---

## 6. Middleware Global de Erro

### `backend/src/middlewares/notFoundMiddleware.js`

```js
const AppError = require("../utils/AppError");

const notFoundMiddleware = (request, response, next) => {
  next(new AppError(`Rota nao encontrada: ${request.originalUrl}`, 404));
};

module.exports = notFoundMiddleware;
```

### `backend/src/middlewares/errorMiddleware.js`

```js
const errorMiddleware = (error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Erro interno do servidor";

  if (process.env.NODE_ENV !== "test") {
    console.error("[error]", {
      method: request.method,
      path: request.originalUrl,
      statusCode,
      message
    });
  }

  response.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
};

module.exports = errorMiddleware;
```

### `backend/src/utils/AppError.js`

```js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
```

### Observacao curta

- O tratamento centralizado evita repeticao de resposta de erro e prepara a API para evoluir com validacoes, autenticacao e logs.

---

## 7. Setup Basico de Rotas

### `backend/src/routes/index.js`

```js
const express = require("express");

const healthController = require("../controllers/healthController");

const router = express.Router();

router.get("/", (request, response) => {
  response.status(200).json({
    status: "success",
    message: "API base do ERP operacional"
  });
});

router.get("/health", healthController.getHealthStatus);

module.exports = router;
```

### `backend/src/controllers/healthController.js`

```js
const healthService = require("../services/healthService");

const getHealthStatus = async (request, response, next) => {
  try {
    const status = await healthService.getSystemHealth();
    return response.status(200).json(status);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getHealthStatus
};
```

### `backend/src/services/healthService.js`

```js
const healthModel = require("../models/healthModel");

const getSystemHealth = async () => {
  const databaseStatus = await healthModel.checkDatabase();

  return {
    status: "success",
    message: "API operacional",
    data: {
      api: {
        status: "up",
        timestamp: new Date().toISOString()
      },
      database: databaseStatus
    }
  };
};

module.exports = {
  getSystemHealth
};
```

### `backend/src/models/healthModel.js`

```js
const { query } = require("../config/database");

const checkDatabase = async () => {
  const result = await query(
    "SELECT current_database() AS database_name, NOW() AS server_time"
  );

  return {
    status: "up",
    databaseName: result.rows[0].database_name,
    serverTime: result.rows[0].server_time
  };
};

module.exports = {
  checkDatabase
};
```

### Observacao curta

- Mesmo no endpoint de healthcheck, a separacao em `controller -> service -> model` ja deixa o projeto consistente para crescimento dos modulos do ERP.

---

## 8. Banco de Dados Inicial

### `backend/src/database/migrations.sql`

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS perfis_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES perfis_acesso(id),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  ultimo_login_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_status_check CHECK (status IN ('ATIVO', 'INATIVO', 'BLOQUEADO'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_id ON usuarios (perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios (status);

COMMIT;
```

### `backend/src/database/seeders.sql`

```sql
BEGIN;

INSERT INTO perfis_acesso (id, nome, descricao)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Acesso total ao sistema'),
  ('22222222-2222-2222-2222-222222222222', 'Vendedor', 'Acesso comercial'),
  ('33333333-3333-3333-3333-333333333333', 'Financeiro', 'Acesso ao modulo financeiro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, perfil_id, nome, email, senha_hash, status)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Administrador do Sistema',
    'admin@sisefratagro.local',
    '$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv',
    'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

### Observacao curta

- A migration inicial cria apenas a base necessaria para subir autenticacao e controle de acesso sem misturar a modelagem completa dos demais modulos, que pode crescer nas proximas entregas.

---

## 9. Docker Base

### `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
```

### `backend/docker-compose.yml`

```yaml
services:
  api:
    build:
      context: .
    container_name: sis_efratagro_api
    ports:
      - "3001:3001"
    env_file:
      - .env
    depends_on:
      - db
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    command: npm run dev

  db:
    image: postgres:16-alpine
    container_name: sis_efratagro_db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: sis_efratagro
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Observacao curta

- O `docker-compose.yml` acelera o bootstrap local e reduz dependencia manual de ambiente para a equipe.

---

## 10. Como Rodar o Projeto

### Opcao 1: local

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Opcao 2: com Docker

```bash
cd backend
cp .env.example .env
docker compose up --build
```

### Rodar migration e seed

```bash
cd backend
npm run db:migrate
npm run db:seed
```

### Testar endpoint base

```bash
GET http://localhost:3001/api
GET http://localhost:3001/api/health
```

---

## 11. Resultado Final

Com esse setup, o backend fica pronto para:

- subir com `Express`;
- conectar no `PostgreSQL`;
- organizar modulos por `MSC`;
- tratar erros globalmente;
- crescer com autenticacao, autorizacao, validacoes e modulos do ERP sem refatoracao estrutural imediata.
