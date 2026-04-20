# Iniciando

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

Prepara o ambiente local pela primeira vez:

- cria o `.env` da raiz a partir do `.env.example`, se necessario
- sobe `postgres`, `backend` e `frontend` com Docker
- roda `migrations`
- roda `seed`

Use quando estiver iniciando o projeto pela primeira vez ou quando quiser preparar tudo do zero.

### `npm run dev`

Sobe todo o ambiente local com Docker:

- `postgres`
- `backend`
- `frontend`

Use no dia a dia, depois que o ambiente ja foi preparado.

### `npm run reset`

Limpa e recria o banco:

- para os containers
- remove o volume do PostgreSQL
- sobe o ambiente novamente
- roda `migrations`
- roda `seed`

Use quando quiser recriar o banco completamente.

### `npm run stop`

Para os containers do ambiente local.

## Fluxo recomendado

### Primeira vez

```bash
npm run setup
```

### Depois, no dia a dia

```bash
npm run dev
```

### Quando quiser parar tudo

```bash
npm run stop
```

### Quando quiser recriar o banco

```bash
npm run reset
```

## Enderecos

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3002`
- API: `http://localhost:3002/api`
- PostgreSQL: `localhost:5433`

## Login de teste

- [acesso.txt](/Users/alberto/sis_efratagro/docs/acesso.txt)
- [revisao_migrations_seeders_usuarios_teste.md](/Users/alberto/sis_efratagro/revisao_migrations_seeders_usuarios_teste.md)

## Observacoes

- Os comandos da raiz usam o `docker-compose.yml` principal do projeto.
- `setup`, `dev` e `reset` verificam se as portas do ambiente estao livres antes de subir os containers.
- Se a porta `5173`, `3002` ou `5433` estiver ocupada por outro processo, a CLI interrompe a execucao e informa o conflito.
