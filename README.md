# sis_efratagro

ERP comercial com:

- backend em Node.js + Express
- frontend em React + Vite
- banco PostgreSQL
- ambiente local via Docker

## Requisitos

- Docker
- Docker Compose
- Node.js

## Comandos principais

Na raiz do projeto:

```bash
npm run setup
npm run dev
npm run reset
npm run stop
```

## O que cada comando faz

### `npm run setup`

Prepara o ambiente local completo:

- cria `.env` da raiz, se necessario
- sobe `postgres`, `backend` e `frontend`
- roda `migrations`
- roda `seed`

### `npm run dev`

Sobe o ambiente local com Docker.

### `npm run reset`

Remove o volume do PostgreSQL, recria o banco e reaplica `migrations` e `seed`.

### `npm run stop`

Para os containers do ambiente local.

## Fluxo recomendado

Primeira vez:

```bash
npm run setup
```

Uso diario:

```bash
npm run dev
```

Parar ambiente:

```bash
npm run stop
```

Recriar banco:

```bash
npm run reset
```

## Enderecos locais

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3002`
- API: `http://localhost:3002/api`
- PostgreSQL: `localhost:5433`

## Credenciais de teste

Veja:

- [docs/acesso.txt](/Users/alberto/sis_efratagro/docs/acesso.txt)
- [docs/iniciando.md](/Users/alberto/sis_efratagro/docs/iniciando.md)

## Observacao

Se alguma porta do ambiente ja estiver ocupada, a CLI interrompe a execucao e informa o conflito antes de subir os containers.
