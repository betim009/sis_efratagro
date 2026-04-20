# Iniciando

## Requisitos

- Node.js 20+
- Docker

## Rodando pela primeira vez

### 1. Criar o arquivo `.env`

Na raiz do projeto:

```bash
cp .env.example .env
```

### 2. Instalar as dependências

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 3. Subir o banco de dados

```bash
cd backend
docker compose up -d db
```

### 4. Rodar migrations e seed

Com o container do banco ligado:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 5. Iniciar o backend

```bash
cd backend
npm run dev
```

### 6. Iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

## Rodando depois que o ambiente ja foi criado

### 1. Subir o banco

```bash
cd backend
docker compose up -d db
```

### 2. Iniciar o backend

```bash
cd backend
npm run dev
```

### 3. Iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

## Quando rodar novamente migrate e seed

Rode estes comandos apenas se:

- o banco foi recriado
- o volume do PostgreSQL foi apagado
- voce quer recarregar os dados iniciais

```bash
cd backend
npm run db:migrate
npm run db:seed
```

## Enderecos

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API: `http://localhost:3001/api`

## Login de teste

- [acesso.txt](/Users/alberto/sis_efratagro/docs/acesso.txt)
- [revisao_migrations_seeders_usuarios_teste.md](/Users/alberto/sis_efratagro/revisao_migrations_seeders_usuarios_teste.md)

## Observacao

Os comandos `npm run db:migrate` e `npm run db:seed` agora funcionam sem `psql` instalado na maquina, mas o container `db` precisa estar rodando antes.

No ambiente atual, o frontend usa `/api` e o Vite encaminha as chamadas para `http://localhost:3001`.
