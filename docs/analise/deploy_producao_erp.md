# Deploy de Produção — SIS EfratAgro ERP

> Documento de referência para build, deploy e operação do sistema ERP Efrat Agro em ambiente de produção.

---

## Sumário

1. [Estratégia de Produção Adotada](#1-estratégia-de-produção-adotada)
2. [Comparação entre Opções de Deploy](#2-comparação-entre-opções-de-deploy)
3. [Estrutura Recomendada para Produção](#3-estrutura-recomendada-para-produção)
4. [Arquivos de Configuração e Código](#4-arquivos-de-configuração-e-código)
5. [Estratégia de Build do Frontend](#5-estratégia-de-build-do-frontend)
6. [Estratégia de Execução do Backend](#6-estratégia-de-execução-do-backend)
7. [Estratégia de Variáveis de Ambiente](#7-estratégia-de-variáveis-de-ambiente)
8. [Estratégia de Logs](#8-estratégia-de-logs)
9. [Estratégia de Segurança Básica](#9-estratégia-de-segurança-básica)
10. [Estratégia de Backup do Banco](#10-estratégia-de-backup-do-banco)
11. [Organização em VPS](#11-organização-em-vps)
12. [Organização com Domínio e API](#12-organização-com-domínio-e-api)
13. [Checklist Final de Publicação](#13-checklist-final-de-publicação)

---

## 1. Estratégia de Produção Adotada

A estratégia adotada é **Docker em produção com multi-stage builds**, orquestrada via Docker Compose. Essa abordagem foi escolhida por:

- **Paridade dev/prod**: o mesmo runtime (Node 20, PostgreSQL 16) roda em todos os ambientes.
- **Isolamento**: cada serviço tem seu próprio container, rede interna e limites de recurso.
- **Reprodutibilidade**: `docker compose up` sobe todo o stack em qualquer VPS ou cloud.
- **Deploy atômico**: `docker compose up -d --build` reconstrói e substitui containers sem downtime perceptível.

### Arquitetura de serviços em produção

```
                Internet
                   │
              ┌────┴────┐
              │  Nginx   │  ← Reverse proxy + TLS (Let's Encrypt)
              │ :80/:443 │
              └──┬───┬───┘
        ┌────────┘   └────────┐
        ▼                     ▼
  ┌──────────┐         ┌──────────┐
  │ Frontend │         │ Backend  │
  │  Nginx   │         │ Node.js  │
  │  :80     │         │  :3002   │
  └──────────┘         └────┬─────┘
                            │
                     ┌──────┴──────┐
                     │  PostgreSQL │
                     │    :5432    │
                     └─────────────┘
```

**5 containers** em produção: `postgres`, `backend`, `frontend`, `nginx` (reverse proxy), `certbot`.

---

## 2. Comparação entre Opções de Deploy

| Critério | Docker Compose (adotado) | VPS sem Docker | PaaS (Railway, Render) |
|---|---|---|---|
| **Setup inicial** | Médio — precisa instalar Docker | Alto — instalar Node, Nginx, PG manualmente | Baixo — quase zero-config |
| **Reprodutibilidade** | Alta — Dockerfile garante builds idênticos | Baixa — depende do estado da máquina | Alta — controlado pelo PaaS |
| **Custo** | VPS a partir de R$ 25/mês | VPS a partir de R$ 25/mês | Escala rápido (US$ 5-50/mês) |
| **Controle** | Total — rede, volumes, restart | Total | Limitado — depende do provedor |
| **Escalabilidade** | Horizontal via Docker Swarm/K8s | Manual e trabalhoso | Automática (depende do plano) |
| **TLS/HTTPS** | Certbot + Nginx (gratuito) | Certbot manual | Automático |
| **Backup** | Script com pg_dump | Script com pg_dump | Depende do provedor |
| **Indicado para** | VPS, cloud IaaS, produção real | Projetos muito pequenos | MVP, prototipação rápida |

**Justificativa da escolha**: Docker Compose oferece o melhor equilíbrio entre controle total, custo acessível e reprodutibilidade para um ERP comercial rodando em VPS.

---

## 3. Estrutura Recomendada para Produção

### Estrutura de pastas no repositório

```
sis_efratagro/
├── backend/
│   ├── Dockerfile            ← desenvolvimento
│   ├── Dockerfile.prod       ← produção (multi-stage)
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   ├── app.js
│   └── src/
│       ├── config/
│       │   ├── database.js
│       │   ├── env.js
│       │   └── logger.js     ← Winston
│       ├── controllers/
│       ├── middlewares/
│       │   ├── authMiddleware.js
│       │   ├── errorMiddleware.js  ← logs + ocultação de detalhes
│       │   ├── notFoundMiddleware.js
│       │   └── permissionMiddleware.js
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   ├── Dockerfile            ← desenvolvimento
│   ├── Dockerfile.prod       ← produção (multi-stage → Nginx)
│   ├── .dockerignore
│   ├── nginx.conf            ← SPA config para container frontend
│   ├── package.json
│   └── src/
├── nginx/
│   ├── nginx.conf            ← config principal do reverse proxy
│   └── conf.d/
│       └── default.conf      ← virtual hosts (app + api)
├── scripts/
│   ├── backup-db.sh
│   ├── deploy.sh
│   └── ssl-init.sh
├── docker-compose.yml        ← desenvolvimento
├── docker-compose.prod.yml   ← produção
├── .env                      ← local (git-ignorado)
├── .env.development          ← versionado
├── .env.staging              ← versionado (com placeholders)
├── .env.production           ← versionado (com placeholders)
└── .env.example              ← referência
```

### Estrutura no servidor (VPS)

```
/home/deploy/
└── sis_efratagro/             ← clone do repositório
    ├── backups/               ← dumps do PostgreSQL (git-ignorado)
    ├── certbot/               ← certificados Let's Encrypt (git-ignorado)
    │   ├── conf/
    │   └── www/
    ├── logs/                  ← logs do backend (gerados em runtime)
    └── ...                    ← restante do repositório
```

---

## 4. Arquivos de Configuração e Código

### 4.1 — backend/Dockerfile.prod

Multi-stage build: estágio de build instala apenas dependências de produção, estágio final usa `tini` como init process para gerenciar sinais corretamente.

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# ---------------------------------------------------------------------------

FROM node:20-alpine

RUN apk add --no-cache tini postgresql-client

WORKDIR /app

COPY --from=build /app ./

ENV NODE_ENV=production

EXPOSE 3002

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]
```

**Pontos importantes:**
- `npm ci --omit=dev` — instala apenas dependências de produção (sem devDependencies).
- `tini` — init process leve que repassa sinais (SIGTERM, SIGINT) corretamente para o Node.js, evitando processos zumbi.
- `postgresql-client` — necessário para o script de backup executar `pg_dump` dentro do container.
- `node server.js` — execução direta, sem nodemon.

### 4.2 — frontend/Dockerfile.prod

Multi-stage build: estágio de build executa `vite build`, estágio final serve os arquivos estáticos com Nginx Alpine.

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---------------------------------------------------------------------------

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Pontos importantes:**
- `npm ci` — precisa de devDependencies para o Vite funcionar no build.
- O resultado (`/app/dist`) é copiado para o Nginx. O container final não contém Node.js, apenas Nginx + HTML/JS/CSS.
- Imagem final extremamente leve (~25 MB).

### 4.3 — frontend/nginx.conf

Configuração do Nginx **dentro do container frontend** (não o reverse proxy):

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Cache de assets estáticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA — redireciona tudo para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Bloqueia acesso a arquivos ocultos
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

### 4.4 — docker-compose.prod.yml

Orquestração completa de produção com 5 serviços:

```yaml
services:
  # ---------------------------------------------------------------------------
  # PostgreSQL
  # ---------------------------------------------------------------------------
  postgres:
    image: postgres:16-alpine
    container_name: efratagro_prod_postgres
    restart: always
    ports:
      - "127.0.0.1:${DB_EXTERNAL_PORT:-5432}:5432"
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - efratagro_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ---------------------------------------------------------------------------
  # Backend — Node.js + Express
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: efratagro_prod_backend
    restart: always
    expose:
      - "${PORT:-3002}"
    env_file:
      - .env.production
    environment:
      DB_HOST: postgres
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - efratagro_net
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:${PORT:-3002}/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  # ---------------------------------------------------------------------------
  # Frontend — Nginx servindo build estático
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: efratagro_prod_frontend
    restart: always
    expose:
      - "80"
    depends_on:
      - backend
    networks:
      - efratagro_net
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

  # ---------------------------------------------------------------------------
  # Nginx — Reverse Proxy + TLS
  # ---------------------------------------------------------------------------
  nginx:
    image: nginx:1.27-alpine
    container_name: efratagro_prod_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    networks:
      - efratagro_net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  # ---------------------------------------------------------------------------
  # Certbot — Renovação automática de TLS
  # ---------------------------------------------------------------------------
  certbot:
    image: certbot/certbot
    container_name: efratagro_prod_certbot
    volumes:
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - efratagro_net

volumes:
  pgdata:
    name: efratagro_prod_pgdata
```

**Pontos importantes:**
- PostgreSQL expõe porta apenas em `127.0.0.1` (não acessível externamente).
- Backend e frontend usam `expose` (apenas rede interna Docker), sem portas no host.
- Nginx reverse proxy é o único ponto de entrada externo (portas 80 e 443).
- Certbot roda em loop renovando certificados a cada 12 horas.
- Volumes com `max-size` e `max-file` para evitar que logs encham o disco.

### 4.5 — nginx/nginx.conf (Reverse Proxy)

```nginx
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logs
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time';

    access_log /var/log/nginx/access.log main;
    error_log  /var/log/nginx/error.log warn;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Segurança — oculta versão
    server_tokens off;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # Upstreams
    upstream backend_app {
        server backend:3002;
    }

    upstream frontend_app {
        server frontend:80;
    }

    # Includes
    include /etc/nginx/conf.d/*.conf;
}
```

### 4.6 — nginx/conf.d/default.conf (Virtual Hosts)

```nginx
# ---------------------------------------------------------------
# HTTP → redireciona para HTTPS + challenge do Certbot
# ---------------------------------------------------------------
server {
    listen 80;
    server_name app.seudominio.com api.seudominio.com;

    # ACME challenge (Certbot / Let's Encrypt)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ---------------------------------------------------------------
# Frontend — app.seudominio.com (HTTPS)
# ---------------------------------------------------------------
server {
    listen 443 ssl;
    http2 on;
    server_name app.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/app.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.seudominio.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (Nginx container)
    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API — proxy para backend
    location /api/ {
        limit_req zone=api burst=40 nodelay;

        proxy_pass http://backend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth — rate limit mais restrito
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;

        proxy_pass http://backend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ---------------------------------------------------------------
# Backend — api.seudominio.com (HTTPS) — opcional / alternativo
# ---------------------------------------------------------------
server {
    listen 443 ssl;
    http2 on;
    server_name api.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        limit_req zone=api burst=40 nodelay;

        proxy_pass http://backend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;

        proxy_pass http://backend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.7 — backend/app.js (Segurança e Middlewares)

```javascript
require("./src/config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const env = require("./src/config/env");
const routes = require("./src/routes");
const notFoundMiddleware = require("./src/middlewares/notFoundMiddleware");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

const app = express();

// ---------------------------------------------------------------------------
// Segurança
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(hpp());

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  })
);

// ---------------------------------------------------------------------------
// Compressão (gzip / brotli)
// ---------------------------------------------------------------------------
if (env.nodeEnv === "production") {
  app.use(compression());
}

// ---------------------------------------------------------------------------
// Rate Limiting global
// ---------------------------------------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === "production" ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Muitas requisições. Tente novamente em alguns minutos."
  }
});
app.use(globalLimiter);

// ---------------------------------------------------------------------------
// Rate Limiting — autenticação (mais restrito)
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Muitas tentativas de autenticação. Tente novamente mais tarde."
  }
});
app.use(`${env.apiPrefix}/auth`, authLimiter);

// ---------------------------------------------------------------------------
// Proxy confiável (quando atrás de Nginx / load balancer)
// ---------------------------------------------------------------------------
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------
app.use(env.apiPrefix, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
```

**Middlewares de segurança utilizados:**

| Middleware | Função |
|---|---|
| `helmet` | Define headers HTTP de segurança (CSP, X-Frame-Options, HSTS, etc.) |
| `hpp` | Previne poluição de parâmetros HTTP (HTTP Parameter Pollution) |
| `cors` | Controla origens permitidas para requisições cross-origin |
| `compression` | Comprime respostas com gzip em produção |
| `express-rate-limit` | Limita requisições por IP (200/15min global, 20/15min auth) |

### 4.8 — backend/src/config/logger.js (Winston)

```javascript
const { createLogger, format, transports } = require("winston");
const path = require("path");

const env = require("./env");

const LOG_DIR = path.resolve(__dirname, "../../logs");

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${extra}`;
  })
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.json()
);

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------
const logger = createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  defaultMeta: { service: "efratagro-api" },
  transports: [
    // Console — sempre ativo
    new transports.Console({
      format: consoleFormat
    })
  ]
});

// Em produção/staging, adiciona arquivos de log
if (env.nodeEnv === "production" || env.nodeEnv === "staging") {
  logger.add(
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  );

  logger.add(
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    })
  );
}

module.exports = logger;
```

### 4.9 — backend/src/middlewares/errorMiddleware.js

```javascript
const logger = require("../config/logger");

const errorMiddleware = (error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Erro interno do servidor";

  logger.error(message, {
    method: request.method,
    path: request.originalUrl,
    statusCode,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack })
  });

  response.status(statusCode).json({
    status: "error",
    message: statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Erro interno do servidor"
      : message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
};

module.exports = errorMiddleware;
```

**Comportamento por ambiente:**

| Campo | development | staging | production |
|---|---|---|---|
| Mensagem de erro | Original | Original | Genérica para 500s |
| Stack trace no log | Sim | Sim | Não |
| Stack trace na resposta | Sim | Não | Não |

### 4.10 — backend/src/config/env.js

```javascript
const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET"
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
  dbConnectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 5000),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  jwtIssuer: process.env.JWT_ISSUER || "sis-efratagro-api",
  jwtAudience: process.env.JWT_AUDIENCE || "sis-efratagro-app",
  sessionIdleTimeoutMinutes: Number(
    process.env.SESSION_IDLE_TIMEOUT_MINUTES || 30
  ),
  sessionAbsoluteTimeoutHours: Number(
    process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS || 8
  ),
  passwordResetTokenTtlMinutes: Number(
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30
  ),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};
```

### 4.11 — Scripts de Operação

#### scripts/backup-db.sh

```bash
#!/usr/bin/env bash
# ===========================================================================
# scripts/backup-db.sh — Backup do PostgreSQL
# Uso: ./scripts/backup-db.sh
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"

# Carrega .env de produção se existir
ENV_FILE="${ROOT_DIR}/.env.production"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sis_efratagro}"
DB_USER="${DB_USER:-postgres}"

PGPASSWORD="${DB_PASSWORD:-postgres}"
export PGPASSWORD

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Iniciando backup de ${DB_NAME}..."

docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"

echo "==> Backup salvo em: ${BACKUP_FILE}"
echo "==> Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"

# Remove backups com mais de 30 dias
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "==> Backups antigos (>30 dias) removidos."
```

#### scripts/deploy.sh

```bash
#!/usr/bin/env bash
# ===========================================================================
# scripts/deploy.sh — Deploy de produção
# Uso: ./scripts/deploy.sh
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ROOT_DIR}/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: Arquivo .env.production não encontrado."
  exit 1
fi

echo "==> [1/5] Fazendo backup do banco de dados..."
bash "${SCRIPT_DIR}/backup-db.sh" || echo "AVISO: Backup falhou, continuando deploy..."

echo "==> [2/5] Atualizando código-fonte..."
cd "$ROOT_DIR"
git pull --ff-only

echo "==> [3/5] Construindo imagens de produção..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "==> [4/5] Subindo serviços..."
docker compose -f docker-compose.prod.yml up -d

echo "==> [5/5] Verificando saúde dos containers..."
sleep 10
docker compose -f docker-compose.prod.yml ps

echo ""
echo "==> Deploy concluído com sucesso!"
echo "==> Verifique os logs: docker compose -f docker-compose.prod.yml logs -f"
```

#### scripts/ssl-init.sh

```bash
#!/usr/bin/env bash
# ===========================================================================
# scripts/ssl-init.sh — Primeira emissão de certificado Let's Encrypt
# Uso: ./scripts/ssl-init.sh app.seudominio.com api.seudominio.com
# ===========================================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 dominio1 [dominio2 ...]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DOMAINS=("$@")
DOMAIN_ARGS=""
for d in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $d"
done

echo "==> Criando diretórios para Certbot..."
mkdir -p "${ROOT_DIR}/certbot/www" "${ROOT_DIR}/certbot/conf"

echo "==> Subindo Nginx temporário para challenge ACME..."
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" up -d nginx

echo "==> Emitindo certificado para: ${DOMAINS[*]}"
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" run --rm certbot \
  certbot certonly --webroot -w /var/www/certbot \
  $DOMAIN_ARGS \
  --email admin@${DOMAINS[0]} \
  --agree-tos \
  --no-eff-email

echo "==> Reiniciando Nginx com certificado..."
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" restart nginx

echo "==> Certificado emitido com sucesso!"
```

---

## 5. Estratégia de Build do Frontend

### Fluxo de build

```
Código-fonte (React + Vite)
        │
        ▼
   npm ci (instala dependências)
        │
        ▼
   vite build (transpila, minifica, tree-shake)
        │
        ▼
   /dist/
   ├── index.html
   └── assets/
       ├── index-XXXX.css     (< 1 KB gzip)
       └── *.js               (code-split por rota)
        │
        ▼
   Nginx serve arquivos estáticos
```

### Configurações importantes

- **URL base da API**: a variável `VITE_API_BASE_URL=/api` é injetada em build-time. O frontend faz requisições para `/api/*`, que o Nginx redireciona para o container backend.
- **Code splitting**: o Vite gera chunks separados por rota (lazy loading), resultando em ~230 KB gzip para o bundle principal.
- **Cache**: assets em `/assets/` recebem header `Cache-Control: public, immutable` com expiração de 1 ano (os nomes contêm hash, então mudanças geram novos nomes).
- **SPA routing**: `try_files $uri $uri/ /index.html` garante que rotas do React Router funcionem com refresh.

---

## 6. Estratégia de Execução do Backend

### Modo de execução

| Aspecto | Desenvolvimento | Produção |
|---|---|---|
| Comando | `nodemon server.js` | `node server.js` |
| Init process | Nenhum | `tini` |
| Restart | Automático via nodemon | `restart: always` no Docker |
| Compressão | Desativada | Ativada (gzip via compression) |
| Rate limit global | 1000 req/15min | 200 req/15min |
| Logs em arquivo | Desativados | Ativados (error.log + combined.log) |
| Stack trace na resposta | Sim | Não |

### Processo de inicialização

1. Docker inicia o container com `tini` como PID 1.
2. `tini` executa `node server.js`.
3. `server.js` carrega variáveis de ambiente (validando obrigatórias).
4. Testa conexão com o PostgreSQL.
5. Se falhar, encerra com `process.exit(1)` (Docker reinicia via `restart: always`).
6. Se sucesso, escuta na porta 3002.

### Shutdown graceful

O `server.js` captura sinais `SIGTERM` e `SIGINT`:
1. Para de aceitar novas conexões.
2. Fecha o pool de conexões do PostgreSQL.
3. Encerra o processo.

O `tini` garante que esses sinais sejam repassados corretamente para o Node.js.

### Healthcheck

O Docker executa `wget -qO- http://localhost:3002/api/health` a cada 30 segundos. O endpoint verifica:
- API rodando (status: up).
- Conexão com o banco (query de teste).

Se 3 checks consecutivos falharem, o Docker marca o container como `unhealthy`.

---

## 7. Estratégia de Variáveis de Ambiente

### Arquivos por ambiente

| Arquivo | Ambiente | Versionado? | Conteúdo |
|---|---|---|---|
| `.env` | Local (Docker Compose dev) | **Não** (git-ignorado) | Credenciais locais reais |
| `.env.development` | Desenvolvimento | Sim | Valores padrão para dev |
| `.env.staging` | Staging | Sim | Placeholders (`TROCAR_*`) |
| `.env.production` | Produção | Sim | Placeholders (`TROCAR_*`) |
| `.env.example` | Referência | Sim | Template com todos os campos |

### .env.development

```env
NODE_ENV=development
APP_NAME=SIS EfratAgro ERP
PORT=3002
API_PREFIX=/api

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sis_efratagro
DB_EXTERNAL_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sis_efratagro

# JWT / Sessão
JWT_SECRET=dev-secret-inseguro-nao-usar-em-producao
JWT_EXPIRES_IN=8h
JWT_ISSUER=sis-efratagro-api
JWT_AUDIENCE=sis-efratagro-app
SESSION_IDLE_TIMEOUT_MINUTES=30
SESSION_ABSOLUTE_TIMEOUT_HOURS=8
PASSWORD_RESET_TOKEN_TTL_MINUTES=30

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_BASE_URL=/api
```

### .env.staging

```env
NODE_ENV=staging
APP_NAME=SIS EfratAgro ERP
PORT=3002
API_PREFIX=/api

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sis_efratagro_staging
DB_USER=efratagro_staging
DB_PASSWORD=TROCAR_SENHA_STAGING
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DATABASE_URL=postgresql://efratagro_staging:TROCAR_SENHA_STAGING@postgres:5432/sis_efratagro_staging

# JWT / Sessão
JWT_SECRET=TROCAR_CHAVE_STAGING_MINIMO_64_CARACTERES
JWT_EXPIRES_IN=8h
JWT_ISSUER=sis-efratagro-api
JWT_AUDIENCE=sis-efratagro-app
SESSION_IDLE_TIMEOUT_MINUTES=30
SESSION_ABSOLUTE_TIMEOUT_HOURS=8
PASSWORD_RESET_TOKEN_TTL_MINUTES=30

# CORS
CORS_ORIGIN=https://staging.seudominio.com

# Frontend
VITE_API_BASE_URL=/api
```

### .env.production

```env
NODE_ENV=production
APP_NAME=SIS EfratAgro ERP
PORT=3002
API_PREFIX=/api

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sis_efratagro
DB_USER=efratagro_prod
DB_PASSWORD=TROCAR_SENHA_SEGURA_PRODUCAO
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DATABASE_URL=postgresql://efratagro_prod:TROCAR_SENHA_SEGURA_PRODUCAO@postgres:5432/sis_efratagro

# JWT / Sessão
JWT_SECRET=TROCAR_CHAVE_SEGURA_PRODUCAO_MINIMO_64_CARACTERES
JWT_EXPIRES_IN=8h
JWT_ISSUER=sis-efratagro-api
JWT_AUDIENCE=sis-efratagro-app
SESSION_IDLE_TIMEOUT_MINUTES=30
SESSION_ABSOLUTE_TIMEOUT_HOURS=8
PASSWORD_RESET_TOKEN_TTL_MINUTES=30

# CORS
CORS_ORIGIN=https://app.seudominio.com

# Frontend (usadas no build do Vite)
VITE_API_BASE_URL=/api
```

### Boas práticas aplicadas

- **Segredos nunca ficam hardcoded** — valores sensíveis usam placeholders `TROCAR_*`.
- **`.env` local é git-ignorado** — cada desenvolvedor mantém o seu.
- **Arquivos de staging/produção são versionados com placeholders** — na VPS, o operador substitui pelos valores reais.
- **Variáveis obrigatórias são validadas** — se `JWT_SECRET` ou `DB_PASSWORD` estiver ausente, a aplicação não sobe.
- **`DB_HOST=postgres`** — dentro do Docker, o nome do serviço resolve via DNS interno.

---

## 8. Estratégia de Logs

### Camadas de logging

| Camada | Ferramenta | Destino | Rotação |
|---|---|---|---|
| **Aplicação** (backend) | Winston | Console + arquivos (prod) | 10 MB / 5-10 arquivos |
| **Acesso HTTP** (Nginx) | access.log | Stdout do container | json-file driver (10 MB / 5 arquivos) |
| **Erros Nginx** | error.log | Stdout do container | json-file driver (10 MB / 5 arquivos) |
| **Container** (Docker) | json-file driver | `/var/lib/docker/containers/` | Configurado por serviço |

### Logs do backend (Winston)

- **Development**: apenas console, formato colorido e legível, nível `debug`.
- **Production/Staging**: console + dois arquivos:
  - `logs/error.log` — apenas nível `error` (5 arquivos × 10 MB).
  - `logs/combined.log` — todos os níveis (10 arquivos × 10 MB).
- Formato em arquivo: JSON estruturado com timestamp, para integração com ferramentas como ELK ou Loki.

### Logs dos containers (Docker)

Cada serviço no `docker-compose.prod.yml` tem limites de log configurados:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

Isso evita que logs encham o disco do servidor. Para ver logs em tempo real:

```bash
# Todos os serviços
docker compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker compose -f docker-compose.prod.yml logs -f backend

# Últimas 100 linhas
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

---

## 9. Estratégia de Segurança Básica

### Proteção em múltiplas camadas

```
Internet → Nginx (TLS + headers + rate limit)
              → Backend (helmet + cors + rate limit + hpp)
                  → PostgreSQL (rede interna Docker, sem porta externa)
```

### HTTPS / TLS

- Certificados gratuitos via **Let's Encrypt** (Certbot).
- Renovação automática a cada 12 horas.
- Protocolos: **TLS 1.2 e 1.3** apenas.
- Ciphers: `HIGH:!aNULL:!MD5`.

### Headers de segurança (Nginx + Helmet)

| Header | Valor | Proteção |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Força HTTPS por 1 ano |
| `X-Frame-Options` | `SAMEORIGIN` (frontend) / `DENY` (API) | Previne clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Filtro XSS do navegador |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla envio de referrer |
| `Content-Security-Policy` | (via helmet defaults) | Previne injeção de scripts |

### Rate Limiting (duas camadas)

**Camada 1 — Nginx (por IP):**
- API geral: 20 req/segundo, burst de 40.
- Autenticação: 5 req/segundo, burst de 10.

**Camada 2 — Express (por IP):**
- Global: 200 req/15min (produção), 1000 (dev).
- Autenticação: 20 req/15min.

### CORS

- Origem permitida configurável via variável de ambiente (`CORS_ORIGIN`).
- Em produção: apenas `https://app.seudominio.com`.
- Métodos: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Headers: Content-Type, Authorization.
- Credenciais (cookies/auth headers) permitidas.

### Banco de dados

- PostgreSQL **não expõe porta externamente** em produção (apenas `127.0.0.1`).
- Usuário dedicado por ambiente (não usar `postgres` em produção).
- Senha forte obrigatória (validada na inicialização).
- Pool de conexões configurável (20 em produção).

### Tratamento de erros

- Erros 500 em produção retornam mensagem genérica: `"Erro interno do servidor"`.
- Stack traces **nunca** aparecem na resposta em produção.
- Todos os erros são registrados via Winston com contexto (método, path, status).

---

## 10. Estratégia de Backup do Banco

### Política de backup

| Aspecto | Configuração |
|---|---|
| **Ferramenta** | `pg_dump` via Docker |
| **Formato** | SQL comprimido com gzip |
| **Frequência recomendada** | Diário (via cron) |
| **Retenção** | 30 dias (auto-limpeza) |
| **Local** | `backups/` (diretório git-ignorado) |

### Execução manual

```bash
./scripts/backup-db.sh
```

### Agendamento via cron (recomendado)

```bash
# Editar crontab do usuário deploy
crontab -e

# Backup diário às 3h da manhã
0 3 * * * /home/deploy/sis_efratagro/scripts/backup-db.sh >> /home/deploy/sis_efratagro/logs/backup.log 2>&1
```

### Restauração

```bash
# Descomprimir e restaurar
gunzip -c backups/sis_efratagro_20260419_030000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U efratagro_prod -d sis_efratagro
```

### Recomendação para produção real

Para dados críticos, considere:
- Copiar backups para armazenamento externo (S3, Google Cloud Storage).
- Testar restauração periodicamente.
- Manter pelo menos 1 backup offsite.

---

## 11. Organização em VPS

### Requisitos mínimos da VPS

| Recurso | Mínimo | Recomendado |
|---|---|---|
| **CPU** | 1 vCPU | 2 vCPUs |
| **RAM** | 1 GB | 2 GB |
| **Disco** | 20 GB SSD | 40 GB SSD |
| **SO** | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |

### Setup inicial da VPS

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Instalar Docker Compose (já incluso no Docker moderno)
docker compose version

# 4. Criar usuário de deploy (opcional, recomendado)
sudo adduser deploy
sudo usermod -aG docker deploy

# 5. Configurar firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 6. Clonar repositório
su - deploy
git clone <url-do-repositorio> ~/sis_efratagro
cd ~/sis_efratagro

# 7. Configurar variáveis de produção
# Editar .env.production com valores reais (senhas, JWT secret, domínio)

# 8. Emitir certificado TLS
./scripts/ssl-init.sh app.seudominio.com api.seudominio.com

# 9. Deploy
./scripts/deploy.sh
```

### Estrutura de diretórios no servidor

```
/home/deploy/sis_efratagro/
├── backend/              ← código-fonte do backend
├── frontend/             ← código-fonte do frontend
├── nginx/                ← configuração do reverse proxy
├── scripts/              ← scripts de operação
├── backups/              ← dumps do banco (auto-gerados)
├── certbot/              ← certificados TLS (auto-gerados)
│   ├── conf/
│   └── www/
├── docker-compose.prod.yml
├── .env.production       ← com valores reais (NUNCA commitar valores reais)
└── logs/                 ← logs do backend (auto-gerados em produção)
```

---

## 12. Organização com Domínio e API

### Estrutura de DNS

| Registro | Tipo | Valor |
|---|---|---|
| `app.seudominio.com` | A | IP da VPS |
| `api.seudominio.com` | A | IP da VPS |

### Fluxo de requisições

```
app.seudominio.com (HTTPS)
  │
  ├── /                → Nginx proxy → container frontend (Nginx + SPA)
  ├── /api/*           → Nginx proxy → container backend (Node.js :3002)
  └── /api/auth/*      → Nginx proxy → container backend (rate limit restrito)

api.seudominio.com (HTTPS) — alternativo / direto
  │
  └── /*               → Nginx proxy → container backend (Node.js :3002)
```

### Justificativa da estratégia

- **`app.seudominio.com`** serve frontend E API via `/api/`. O frontend faz requisições para `/api/*` (mesmo domínio), evitando problemas de CORS e cookies.
- **`api.seudominio.com`** é alternativo, útil para acesso direto à API (testes, integrações externas, mobile).
- Ambos passam pelo mesmo Nginx reverse proxy com TLS.

---

## 13. Checklist Final de Publicação

### Pré-deploy

- [ ] VPS provisionada com Docker instalado
- [ ] Firewall configurado (portas 22, 80, 443)
- [ ] Repositório clonado na VPS
- [ ] `.env.production` preenchido com valores reais:
  - [ ] `DB_USER` → usuário dedicado (não `postgres`)
  - [ ] `DB_PASSWORD` → senha forte (mínimo 20 caracteres)
  - [ ] `JWT_SECRET` → chave aleatória (mínimo 64 caracteres)
  - [ ] `CORS_ORIGIN` → domínio real (`https://app.seudominio.com`)
- [ ] DNS configurado (A records para `app.` e `api.`)
- [ ] Domínios propagados (verificar com `dig app.seudominio.com`)

### Deploy

- [ ] Executar `./scripts/ssl-init.sh app.seudominio.com api.seudominio.com`
- [ ] Verificar certificado emitido: `ls certbot/conf/live/`
- [ ] Executar `./scripts/deploy.sh`
- [ ] Verificar containers rodando: `docker compose -f docker-compose.prod.yml ps`
- [ ] Todos os containers com status `Up` ou `Healthy`

### Validação

- [ ] `https://app.seudominio.com` carrega o frontend
- [ ] `https://app.seudominio.com/api/health` retorna `{"status":"success"}`
- [ ] `https://api.seudominio.com/api/health` retorna `{"status":"success"}`
- [ ] Login funciona (criar usuário admin via seed ou endpoint)
- [ ] Navegação entre páginas funciona (SPA routing com refresh)
- [ ] `http://` redireciona para `https://`
- [ ] Headers de segurança presentes (verificar com `curl -I`)

### Pós-deploy

- [ ] Configurar backup automático via cron (`0 3 * * *`)
- [ ] Verificar logs: `docker compose -f docker-compose.prod.yml logs -f`
- [ ] Testar restauração de backup pelo menos uma vez
- [ ] Documentar credenciais em local seguro (gerenciador de senhas)
- [ ] Configurar monitoramento externo (UptimeRobot, Healthchecks.io — gratuitos)

### Segurança pós-deploy

- [ ] Verificar SSL: `https://www.ssllabs.com/ssltest/`
- [ ] Verificar headers: `https://securityheaders.com/`
- [ ] PostgreSQL **não acessível externamente** (testar: `telnet IP 5432` deve falhar)
- [ ] SSH com chave (desabilitar login por senha, se possível)
- [ ] Renovação automática de certificado funcionando (verificar logs do certbot)

---

## Resumo dos Arquivos Criados/Modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `backend/Dockerfile.prod` | Novo | Multi-stage build para produção |
| `frontend/Dockerfile.prod` | Novo | Multi-stage build (Vite → Nginx) |
| `frontend/nginx.conf` | Novo | Configuração SPA para container frontend |
| `docker-compose.prod.yml` | Novo | Orquestração de 5 serviços de produção |
| `nginx/nginx.conf` | Novo | Configuração principal do reverse proxy |
| `nginx/conf.d/default.conf` | Novo | Virtual hosts com TLS e rate limiting |
| `.env.development` | Novo | Variáveis de ambiente para desenvolvimento |
| `.env.staging` | Novo | Variáveis de ambiente para staging |
| `.env.production` | Novo | Variáveis de ambiente para produção |
| `scripts/backup-db.sh` | Novo | Script de backup do PostgreSQL |
| `scripts/deploy.sh` | Novo | Script de deploy automatizado |
| `scripts/ssl-init.sh` | Novo | Script de emissão de certificado TLS |
| `backend/app.js` | Modificado | Adicionado helmet, cors, hpp, compression, rate-limit |
| `backend/src/config/env.js` | Modificado | Adicionado `corsOrigin` |
| `backend/src/config/logger.js` | Novo | Logger Winston (console + arquivos) |
| `backend/server.js` | Modificado | Usa Winston em vez de console.log |
| `backend/src/middlewares/errorMiddleware.js` | Modificado | Usa Winston, oculta detalhes em produção |
| `backend/package.json` | Modificado | Novas dependências de segurança |

### Dependências adicionadas ao backend

```json
{
  "cors": "^2.8.5",
  "helmet": "^8.1.0",
  "express-rate-limit": "^7.5.0",
  "compression": "^1.8.0",
  "hpp": "^0.2.3",
  "winston": "^3.17.0"
}
```
