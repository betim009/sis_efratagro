# Autenticacao e Autorizacao

## 1. Estrategia de Autenticacao Escolhida

Foi adotado `JWT` assinado com `sessionId` embutido no payload e validado contra a tabela `sessoes_usuario`.

### Decisoes tecnicas principais

- `bcrypt` para hash de senha. Motivo: padrao consolidado para credenciais em Node.js.
- `JWT` para transporte de identidade. Motivo: integracao simples com APIs e middlewares.
- Sessao persistida em banco. Motivo: permitir logout, multiplas sessoes, revogacao e timeout por inatividade.
- Permissoes estruturadas por modulo e acao em `perfil_permissoes`. Motivo: evitar autorizacao baseada em string solta sem modelo relacional.
- Reset de senha com token aleatorio + hash SHA-256 no banco. Motivo: nao armazenar token bruto.
- Auditoria em `logs_auditoria` para login, logout e reset de senha.

---

## 2. Estrutura dos Arquivos Envolvidos

```txt
/backend
  /src
    /controllers
      authController.js
    /services
      authService.js
    /models
      authModel.js
      auditLogModel.js
    /middlewares
      authMiddleware.js
      permissionMiddleware.js
    /routes
      authRoutes.js
      index.js
    /utils
      jwt.js
      password.js
      permissions.js
    /database
      migrations.sql
      seeders.sql
  /.env.example
  /package.json
```

---

## 3. Estrutura de Permissoes Definida

As permissoes sao armazenadas na tabela `perfil_permissoes` por modulo, com quatro colunas booleanas:

- `pode_criar`
- `pode_ler`
- `pode_atualizar`
- `pode_excluir`

A API converte isso para o formato consumido no backend:

```js
{
  clientes: { create: true, read: true, update: true, delete: false },
  produtos: { create: false, read: true, update: false, delete: false },
  vendas: { create: true, read: true, update: true, delete: false },
  estoque: { create: false, read: true, update: false, delete: false },
  financeiro: { create: false, read: true, update: false, delete: false },
  frota: { create: false, read: true, update: true, delete: false }
}
```

Exemplos de validacao suportados:

- `clientes.create`
- `clientes.read`
- `clientes.update`
- `clientes.delete`
- `produtos.create`
- `vendas.create`
- `estoque.read`
- `financeiro.read`
- `frota.update`

---

## 4. Exemplo de Payload do Token JWT

```json
{
  "sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "sid": "6aa74fc1-9cd4-4dbd-a9d3-f1dd39dd4c0e",
  "profileId": "11111111-1111-1111-1111-111111111111",
  "jti": "3c4fd983-a132-4d3e-b0fd-96e387f8379a",
  "iat": 1770000000,
  "exp": 1770028800,
  "iss": "sis-efratagro-api",
  "aud": "sis-efratagro-app"
}
```

---

## 5. Rotas de Autenticacao Entregues

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `POST /api/auth/logout`
- `GET /api/auth/permissions-example`

---

## 6. Codigo Completo dos Arquivos Necessarios

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
    "bcrypt": "^5.1.1",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
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

JWT_SECRET=troque-esta-chave-em-producao
JWT_EXPIRES_IN=8h
JWT_ISSUER=sis-efratagro-api
JWT_AUDIENCE=sis-efratagro-app

SESSION_IDLE_TIMEOUT_MINUTES=30
SESSION_ABSOLUTE_TIMEOUT_HOURS=8
PASSWORD_RESET_TOKEN_TTL_MINUTES=30

```

### `backend/src/database/migrations.sql`

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS perfis_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT perfis_acesso_status_check CHECK (status IN ('ATIVO', 'INATIVO'))
);

CREATE TABLE IF NOT EXISTS perfil_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES perfis_acesso(id) ON DELETE CASCADE,
  modulo VARCHAR(80) NOT NULL,
  pode_criar BOOLEAN NOT NULL DEFAULT FALSE,
  pode_ler BOOLEAN NOT NULL DEFAULT TRUE,
  pode_atualizar BOOLEAN NOT NULL DEFAULT FALSE,
  pode_excluir BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_perfil_permissoes UNIQUE (perfil_id, modulo)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES perfis_acesso(id),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  ultimo_login_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_status_check CHECK (status IN ('ATIVO', 'INATIVO', 'BLOQUEADO'))
);

CREATE TABLE IF NOT EXISTS sessoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_jti UUID NOT NULL UNIQUE,
  ip_origem INET,
  user_agent TEXT,
  ultimo_acesso_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em TIMESTAMPTZ NOT NULL,
  revogada_em TIMESTAMPTZ,
  motivo_revogacao VARCHAR(120),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tokens_reset_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  utilizado_em TIMESTAMPTZ,
  ip_origem INET,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa VARCHAR(2) NOT NULL DEFAULT 'PJ',
  razao_social VARCHAR(160) NOT NULL,
  nome_fantasia VARCHAR(160),
  cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
  inscricao_estadual VARCHAR(30),
  email VARCHAR(150),
  telefone VARCHAR(20),
  contato_responsavel VARCHAR(120),
  cep VARCHAR(10),
  logradouro VARCHAR(150),
  numero VARCHAR(20),
  complemento VARCHAR(120),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado CHAR(2),
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fornecedores_tipo_pessoa_check CHECK (tipo_pessoa IN ('PF', 'PJ')),
  CONSTRAINT fornecedores_status_check CHECK (status IN ('ATIVO', 'INATIVO'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa VARCHAR(2) NOT NULL DEFAULT 'PJ',
  nome_razao_social VARCHAR(160) NOT NULL,
  nome_fantasia VARCHAR(160),
  cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
  inscricao_estadual VARCHAR(30),
  email VARCHAR(150),
  telefone VARCHAR(20),
  cep VARCHAR(10),
  logradouro VARCHAR(150),
  numero VARCHAR(20),
  complemento VARCHAR(120),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado CHAR(2),
  limite_credito NUMERIC(14, 2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clientes_tipo_pessoa_check CHECK (tipo_pessoa IN ('PF', 'PJ')),
  CONSTRAINT clientes_status_check CHECK (status IN ('ATIVO', 'BLOQUEADO', 'INATIVO')),
  CONSTRAINT clientes_limite_credito_check CHECK (limite_credito >= 0)
);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_padrao_id UUID REFERENCES fornecedores(id),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  codigo_barras VARCHAR(50),
  referencia_interna VARCHAR(50),
  nome VARCHAR(160) NOT NULL,
  descricao TEXT,
  unidade_medida VARCHAR(20) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  preco_custo NUMERIC(14, 2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(14, 2) NOT NULL DEFAULT 0,
  peso_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(14, 3) NOT NULL DEFAULT 0,
  ponto_reposicao NUMERIC(14, 3) NOT NULL DEFAULT 0,
  permite_venda_sem_estoque BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT produtos_status_check CHECK (status IN ('ATIVO', 'INATIVO')),
  CONSTRAINT produtos_preco_custo_check CHECK (preco_custo >= 0),
  CONSTRAINT produtos_preco_venda_check CHECK (preco_venda >= 0),
  CONSTRAINT produtos_peso_kg_check CHECK (peso_kg >= 0),
  CONSTRAINT produtos_estoque_minimo_check CHECK (estoque_minimo >= 0),
  CONSTRAINT produtos_ponto_reposicao_check CHECK (ponto_reposicao >= 0)
);

CREATE TABLE IF NOT EXISTS locais_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(120) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  descricao TEXT,
  tipo_local VARCHAR(30) NOT NULL DEFAULT 'DEPOSITO',
  endereco_referencia VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT locais_estoque_status_check CHECK (status IN ('ATIVO', 'INATIVO')),
  CONSTRAINT locais_estoque_tipo_local_check CHECK (tipo_local IN ('DEPOSITO', 'FILIAL', 'PRATELEIRA', 'TRANSITO'))
);

CREATE TABLE IF NOT EXISTS estoques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  local_estoque_id UUID NOT NULL REFERENCES locais_estoque(id) ON DELETE CASCADE,
  quantidade NUMERIC(14, 3) NOT NULL DEFAULT 0,
  reservado NUMERIC(14, 3) NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_estoques_produto_local UNIQUE (produto_id, local_estoque_id),
  CONSTRAINT estoques_quantidade_check CHECK (quantidade >= 0),
  CONSTRAINT estoques_reservado_check CHECK (reservado >= 0)
);

CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(30) NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  vendedor_id UUID NOT NULL REFERENCES usuarios(id),
  tipo_venda VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  forma_pagamento VARCHAR(20) NOT NULL,
  condicao_pagamento VARCHAR(120),
  data_venda TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_faturamento TIMESTAMPTZ,
  data_entrega_prevista DATE,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  desconto_valor NUMERIC(14, 2) NOT NULL DEFAULT 0,
  frete_valor NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_valor NUMERIC(14, 2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendas_tipo_venda_check CHECK (tipo_venda IN ('NORMAL', 'FUTURA', 'DIRETA')),
  CONSTRAINT vendas_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADA', 'FATURADA', 'CANCELADA')),
  CONSTRAINT vendas_forma_pagamento_check CHECK (forma_pagamento IN ('A_VISTA', 'A_PRAZO', 'PIX', 'CARTAO', 'BOLETO', 'DINHEIRO')),
  CONSTRAINT vendas_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT vendas_desconto_valor_check CHECK (desconto_valor >= 0),
  CONSTRAINT vendas_frete_valor_check CHECK (frete_valor >= 0),
  CONSTRAINT vendas_total_valor_check CHECK (total_valor >= 0)
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  local_estoque_id UUID REFERENCES locais_estoque(id),
  sequencia SMALLINT NOT NULL,
  quantidade NUMERIC(14, 3) NOT NULL,
  preco_unitario NUMERIC(14, 2) NOT NULL,
  desconto_valor NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_valor NUMERIC(14, 2) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_itens_venda_sequencia UNIQUE (venda_id, sequencia),
  CONSTRAINT itens_venda_quantidade_check CHECK (quantidade > 0),
  CONSTRAINT itens_venda_preco_unitario_check CHECK (preco_unitario >= 0),
  CONSTRAINT itens_venda_desconto_valor_check CHECK (desconto_valor >= 0),
  CONSTRAINT itens_venda_total_valor_check CHECK (total_valor >= 0)
);

CREATE TABLE IF NOT EXISTS duplicatas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  numero VARCHAR(40) NOT NULL UNIQUE,
  parcela SMALLINT NOT NULL DEFAULT 1,
  valor_total NUMERIC(14, 2) NOT NULL,
  valor_aberto NUMERIC(14, 2) NOT NULL,
  vencimento DATE NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'EM_ABERTO',
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT duplicatas_status_check CHECK (status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'PAGO', 'VENCIDO', 'CANCELADO')),
  CONSTRAINT duplicatas_parcela_check CHECK (parcela > 0),
  CONSTRAINT duplicatas_valor_total_check CHECK (valor_total >= 0),
  CONSTRAINT duplicatas_valor_aberto_check CHECK (valor_aberto >= 0)
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duplicata_id UUID NOT NULL REFERENCES duplicatas(id) ON DELETE CASCADE,
  recebido_por_usuario_id UUID REFERENCES usuarios(id),
  forma_pagamento VARCHAR(20) NOT NULL,
  valor NUMERIC(14, 2) NOT NULL,
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referencia_externa VARCHAR(80),
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pagamentos_forma_pagamento_check CHECK (
    forma_pagamento IN ('PIX', 'BOLETO', 'CARTAO', 'DINHEIRO', 'TRANSFERENCIA')
  ),
  CONSTRAINT pagamentos_valor_check CHECK (valor > 0)
);

CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa VARCHAR(10) NOT NULL UNIQUE,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(80),
  ano_fabricacao SMALLINT,
  tipo_veiculo VARCHAR(30) NOT NULL,
  capacidade_carga_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
  quilometragem_atual NUMERIC(12, 1) NOT NULL DEFAULT 0,
  responsavel_usuario_id UUID REFERENCES usuarios(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT veiculos_tipo_veiculo_check CHECK (tipo_veiculo IN ('CAMINHAO', 'VAN', 'UTILITARIO', 'MOTO', 'CARRO')),
  CONSTRAINT veiculos_status_check CHECK (status IN ('ATIVO', 'MANUTENCAO', 'INATIVO')),
  CONSTRAINT veiculos_capacidade_carga_kg_check CHECK (capacidade_carga_kg >= 0),
  CONSTRAINT veiculos_quilometragem_atual_check CHECK (quilometragem_atual >= 0)
);

CREATE TABLE IF NOT EXISTS manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES fornecedores(id),
  tipo_manutencao VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  data_manutencao DATE NOT NULL,
  proxima_manutencao_data DATE,
  proxima_manutencao_km NUMERIC(12, 1),
  quilometragem_registrada NUMERIC(12, 1),
  custo NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'CONCLUIDA',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT manutencoes_tipo_manutencao_check CHECK (tipo_manutencao IN ('PREVENTIVA', 'CORRETIVA')),
  CONSTRAINT manutencoes_status_check CHECK (status IN ('AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA')),
  CONSTRAINT manutencoes_custo_check CHECK (custo >= 0),
  CONSTRAINT manutencoes_quilometragem_registrada_check CHECK (
    quilometragem_registrada IS NULL OR quilometragem_registrada >= 0
  ),
  CONSTRAINT manutencoes_proxima_manutencao_km_check CHECK (
    proxima_manutencao_km IS NULL OR proxima_manutencao_km >= 0
  )
);

CREATE TABLE IF NOT EXISTS fretes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL UNIQUE REFERENCES vendas(id) ON DELETE CASCADE,
  modalidade VARCHAR(20) NOT NULL,
  tipo_calculo VARCHAR(20) NOT NULL,
  regiao_destino VARCHAR(120),
  peso_total_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
  distancia_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_estimado NUMERIC(14, 2) NOT NULL DEFAULT 0,
  valor_real NUMERIC(14, 2),
  veiculo_id UUID REFERENCES veiculos(id),
  transportadora_fornecedor_id UUID REFERENCES fornecedores(id),
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fretes_modalidade_check CHECK (modalidade IN ('PROPRIO', 'TERCEIRO')),
  CONSTRAINT fretes_tipo_calculo_check CHECK (tipo_calculo IN ('REGIAO', 'PESO', 'DISTANCIA', 'MANUAL')),
  CONSTRAINT fretes_peso_total_kg_check CHECK (peso_total_kg >= 0),
  CONSTRAINT fretes_distancia_km_check CHECK (distancia_km >= 0),
  CONSTRAINT fretes_valor_estimado_check CHECK (valor_estimado >= 0),
  CONSTRAINT fretes_valor_real_check CHECK (valor_real IS NULL OR valor_real >= 0)
);

CREATE TABLE IF NOT EXISTS entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL UNIQUE REFERENCES vendas(id) ON DELETE CASCADE,
  frete_id UUID UNIQUE REFERENCES fretes(id) ON DELETE SET NULL,
  responsavel_usuario_id UUID REFERENCES usuarios(id),
  status VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_DESPACHO',
  data_saida TIMESTAMPTZ,
  data_entrega_realizada TIMESTAMPTZ,
  tentativa_atual SMALLINT NOT NULL DEFAULT 0,
  comprovante_recebimento VARCHAR(255),
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT entregas_status_check CHECK (
    status IN ('AGUARDANDO_DESPACHO', 'EM_TRANSITO', 'ENTREGUE', 'NAO_REALIZADA')
  ),
  CONSTRAINT entregas_tentativa_atual_check CHECK (tentativa_atual >= 0)
);

CREATE TABLE IF NOT EXISTS historico_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacao TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  CONSTRAINT historico_entregas_status_check CHECK (
    status IN ('AGUARDANDO_DESPACHO', 'EM_TRANSITO', 'ENTREGUE', 'NAO_REALIZADA')
  )
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  local_origem_id UUID REFERENCES locais_estoque(id),
  local_destino_id UUID REFERENCES locais_estoque(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  venda_id UUID REFERENCES vendas(id) ON DELETE SET NULL,
  tipo_movimentacao VARCHAR(20) NOT NULL,
  quantidade NUMERIC(14, 3) NOT NULL,
  motivo VARCHAR(120) NOT NULL,
  observacoes TEXT,
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT movimentacoes_estoque_tipo_movimentacao_check CHECK (
    tipo_movimentacao IN ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE')
  ),
  CONSTRAINT movimentacoes_estoque_quantidade_check CHECK (quantidade > 0),
  CONSTRAINT movimentacoes_estoque_locais_diferentes_check CHECK (
    local_origem_id IS NULL OR local_destino_id IS NULL OR local_origem_id <> local_destino_id
  )
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  tabela_nome VARCHAR(100) NOT NULL,
  registro_id UUID,
  acao VARCHAR(20) NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_origem INET,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT logs_auditoria_acao_check CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM'))
);

CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_perfil_id ON perfil_permissoes (perfil_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_id ON usuarios (perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios (status);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_usuario_id ON sessoes_usuario (usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_token_jti ON sessoes_usuario (token_jti);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_expira_em ON sessoes_usuario (expira_em);

CREATE INDEX IF NOT EXISTS idx_tokens_reset_senha_usuario_id ON tokens_reset_senha (usuario_id);
CREATE INDEX IF NOT EXISTS idx_tokens_reset_senha_expira_em ON tokens_reset_senha (expira_em);

CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores (status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_razao_social ON fornecedores (razao_social);

CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes (status);
CREATE INDEX IF NOT EXISTS idx_clientes_nome_razao_social ON clientes (nome_razao_social);

CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor_padrao_id ON produtos (fornecedor_padrao_id);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos (status);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos (nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);

CREATE INDEX IF NOT EXISTS idx_locais_estoque_status ON locais_estoque (status);

CREATE INDEX IF NOT EXISTS idx_estoques_produto_id ON estoques (produto_id);
CREATE INDEX IF NOT EXISTS idx_estoques_local_estoque_id ON estoques (local_estoque_id);

CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor_id ON vendas (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_tipo_venda ON vendas (tipo_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas (status);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas (data_venda);

CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id ON itens_venda (venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON itens_venda (produto_id);

CREATE INDEX IF NOT EXISTS idx_fretes_veiculo_id ON fretes (veiculo_id);
CREATE INDEX IF NOT EXISTS idx_fretes_transportadora_fornecedor_id ON fretes (transportadora_fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas (status);
CREATE INDEX IF NOT EXISTS idx_entregas_responsavel_usuario_id ON entregas (responsavel_usuario_id);

CREATE INDEX IF NOT EXISTS idx_historico_entregas_entrega_id ON historico_entregas (entrega_id);
CREATE INDEX IF NOT EXISTS idx_historico_entregas_data_evento ON historico_entregas (data_evento);

CREATE INDEX IF NOT EXISTS idx_duplicatas_venda_id ON duplicatas (venda_id);
CREATE INDEX IF NOT EXISTS idx_duplicatas_cliente_id ON duplicatas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_duplicatas_status ON duplicatas (status);
CREATE INDEX IF NOT EXISTS idx_duplicatas_vencimento ON duplicatas (vencimento);

CREATE INDEX IF NOT EXISTS idx_pagamentos_duplicata_id ON pagamentos (duplicata_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON pagamentos (data_pagamento);

CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos (status);
CREATE INDEX IF NOT EXISTS idx_veiculos_responsavel_usuario_id ON veiculos (responsavel_usuario_id);

CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_id ON manutencoes (veiculo_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_data_manutencao ON manutencoes (data_manutencao);
CREATE INDEX IF NOT EXISTS idx_manutencoes_status ON manutencoes (status);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto_id ON movimentacoes_estoque (produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_local_origem_id ON movimentacoes_estoque (local_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_local_destino_id ON movimentacoes_estoque (local_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_usuario_id ON movimentacoes_estoque (usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_venda_id ON movimentacoes_estoque (venda_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_data_movimentacao ON movimentacoes_estoque (data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_tipo_movimentacao ON movimentacoes_estoque (tipo_movimentacao);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario_id ON logs_auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_tabela_nome ON logs_auditoria (tabela_nome);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_acao ON logs_auditoria (acao);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_criado_em ON logs_auditoria (criado_em);

COMMIT;

```

### `backend/src/database/seeders.sql`

```sql
BEGIN;

INSERT INTO perfis_acesso (id, nome, descricao, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Acesso total ao sistema', 'ATIVO'),
  ('22222222-2222-2222-2222-222222222222', 'Vendedor', 'Operacao comercial e consulta de clientes e produtos', 'ATIVO'),
  ('33333333-3333-3333-3333-333333333333', 'Financeiro', 'Gestao de duplicatas, pagamentos e relatorios financeiros', 'ATIVO'),
  ('44444444-4444-4444-4444-444444444444', 'Estoquista', 'Controle de estoque e movimentacoes', 'ATIVO'),
  ('55555555-5555-5555-5555-555555555555', 'Gerente', 'Visao gerencial e acompanhamento operacional', 'ATIVO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO perfil_permissoes (id, perfil_id, modulo, pode_criar, pode_ler, pode_atualizar, pode_excluir)
VALUES
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'clientes', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'fornecedores', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'produtos', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'vendas', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'estoque', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'financeiro', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'frota', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'relatorios', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'usuarios', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'clientes', FALSE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'vendas', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000013', '22222222-2222-2222-2222-222222222222', 'estoque', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000014', '33333333-3333-3333-3333-333333333333', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000015', '33333333-3333-3333-3333-333333333333', 'financeiro', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000016', '44444444-4444-4444-4444-444444444444', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000017', '44444444-4444-4444-4444-444444444444', 'estoque', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000018', '55555555-5555-5555-5555-555555555555', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000019', '55555555-5555-5555-5555-555555555555', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000020', '55555555-5555-5555-5555-555555555555', 'vendas', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000021', '55555555-5555-5555-5555-555555555555', 'estoque', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000022', '55555555-5555-5555-5555-555555555555', 'financeiro', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000023', '55555555-5555-5555-5555-555555555555', 'frota', FALSE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000024', '55555555-5555-5555-5555-555555555555', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000025', '55555555-5555-5555-5555-555555555555', 'dashboard', FALSE, TRUE, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, perfil_id, nome, email, senha_hash, telefone, status)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Administrador do Sistema',
    'admin@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990001',
    'ATIVO'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Carlos Vendas',
    'carlos.vendas@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990002',
    'ATIVO'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'Fernanda Financeiro',
    'fernanda.financeiro@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990003',
    'ATIVO'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'Marcio Estoque',
    'marcio.estoque@sisefratagro.local',
    '$2b$10$7EqJtq98hPqEX7fNZaFWoO5m6Q6DqJzi10BGSAdoo6gWQBaIj++Im',
    '62999990004',
    'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO fornecedores (
  id, tipo_pessoa, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual, email,
  telefone, contato_responsavel, cep, logradouro, numero, complemento, bairro, cidade, estado,
  observacoes, status
)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001', 'PJ', 'Agro Insumos Brasil LTDA', 'Agro Insumos Brasil',
    '12345678000101', '102938475', 'contato@agroinsumos.local', '6233010001', 'Paulo Mendes',
    '74000000', 'Avenida das Sementes', '1200', 'Galpao A', 'Distrito Industrial', 'Goiania', 'GO',
    'Fornecedor padrao de defensivos e sementes.', 'ATIVO'
  ),
  (
    'f0000000-0000-0000-0000-000000000002', 'PJ', 'Transportes Cerrado LTDA', 'Cerrado Log',
    '12345678000102', '564738291', 'operacao@cerradolog.local', '6233010002', 'Roberta Lima',
    '74000001', 'Rua do Transporte', '455', NULL, 'Setor Norte', 'Anapolis', 'GO',
    'Fornecedor utilizado como transportadora terceirizada.', 'ATIVO'
  ),
  (
    'f0000000-0000-0000-0000-000000000003', 'PJ', 'Oficina Mecanica Campo Forte LTDA', 'Campo Forte Oficina',
    '12345678000103', '111222333', 'servicos@campoforte.local', '6233010003', 'Joao Batista',
    '74000002', 'Rodovia GO-020', '900', NULL, 'Zona Rural', 'Senador Canedo', 'GO',
    'Prestador de servicos de manutencao de frota.', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO clientes (
  id, tipo_pessoa, nome_razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual, email,
  telefone, cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito, observacoes, status
)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001', 'PJ', 'Fazenda Boa Esperanca LTDA', 'Fazenda Boa Esperanca',
    '98765432000101', '998877665', 'compras@boaesperanca.local', '6234010001', '75900000',
    'Estrada Vicinal Km 12', 'S/N', NULL, 'Zona Rural', 'Rio Verde', 'GO', 50000.00,
    'Cliente recorrente com compras sazonais.', 'ATIVO'
  ),
  (
    'c0000000-0000-0000-0000-000000000002', 'PJ', 'Cooperativa Agro Vale', 'Coop Agro Vale',
    '98765432000102', '887766554', 'financeiro@agrovale.local', '6234010002', '75800000',
    'Avenida Central', '220', 'Sala 4', 'Centro', 'Jatai', 'GO', 120000.00,
    'Cliente com compras em volume e prazo.', 'ATIVO'
  ),
  (
    'c0000000-0000-0000-0000-000000000003', 'PF', 'Marcos Antonio Pereira', NULL,
    '12345678901', NULL, 'marcos.pereira@cliente.local', '6234010003', '75600000',
    'Rua das Palmeiras', '85', NULL, 'Setor Sul', 'Mineiros', 'GO', 8000.00,
    'Cliente de pronta entrega.', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO produtos (
  id, fornecedor_padrao_id, codigo, codigo_barras, referencia_interna, nome, descricao, unidade_medida,
  categoria, preco_custo, preco_venda, peso_kg, estoque_minimo, ponto_reposicao, permite_venda_sem_estoque, status
)
VALUES
  (
    'p0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0001', '7891000000011', 'SEMENTE-MILHO-20KG', 'Semente de Milho Hibrido 20kg',
    'Semente de milho hibrido para alta produtividade.', 'SACA', 'SEMENTES',
    210.00, 285.00, 20.000, 15.000, 30.000, FALSE, 'ATIVO'
  ),
  (
    'p0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0002', '7891000000012', 'FERT-NPK-50KG', 'Fertilizante NPK 04-14-08 50kg',
    'Fertilizante granulado para preparo de solo.', 'SACA', 'FERTILIZANTES',
    145.00, 198.00, 50.000, 20.000, 40.000, FALSE, 'ATIVO'
  ),
  (
    'p0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0003', '7891000000013', 'HERB-GLI-20L', 'Herbicida Glifosato 20L',
    'Herbicida sistemico para controle pos-emergente.', 'UN', 'DEFENSIVOS',
    320.00, 429.90, 22.000, 10.000, 25.000, FALSE, 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO locais_estoque (
  id, nome, codigo, descricao, tipo_local, endereco_referencia, status
)
VALUES
  (
    'l0000000-0000-0000-0000-000000000001', 'Deposito Central', 'DEP-CENTRAL',
    'Armazenamento principal de mercadorias.', 'DEPOSITO', 'Matriz - Goiania', 'ATIVO'
  ),
  (
    'l0000000-0000-0000-0000-000000000002', 'Filial Rio Verde', 'FIL-RIOVERDE',
    'Estoque da unidade de Rio Verde.', 'FILIAL', 'Unidade Rio Verde', 'ATIVO'
  ),
  (
    'l0000000-0000-0000-0000-000000000003', 'Prateleira A1', 'PRAT-A1',
    'Area de picking de itens leves.', 'PRATELEIRA', 'Deposito Central - Corredor A', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO estoques (
  id, produto_id, local_estoque_id, quantidade, reservado
)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000001', 80.000, 5.000
  ),
  (
    'e0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002',
    'l0000000-0000-0000-0000-000000000001', 60.000, 0.000
  ),
  (
    'e0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003',
    'l0000000-0000-0000-0000-000000000002', 25.000, 2.000
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO veiculos (
  id, placa, modelo, marca, ano_fabricacao, tipo_veiculo, capacidade_carga_kg,
  quilometragem_atual, responsavel_usuario_id, status
)
VALUES
  (
    'v0000000-0000-0000-0000-000000000001', 'ABC1D23', 'Delivery 9.170', 'Volkswagen',
    2022, 'CAMINHAO', 5000.000, 45200.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ATIVO'
  ),
  (
    'v0000000-0000-0000-0000-000000000002', 'EFG4H56', 'Master Furgao', 'Renault',
    2021, 'VAN', 1600.000, 37850.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ATIVO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO manutencoes (
  id, veiculo_id, fornecedor_id, tipo_manutencao, descricao, data_manutencao,
  proxima_manutencao_data, proxima_manutencao_km, quilometragem_registrada, custo, status
)
VALUES
  (
    'm0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000003', 'PREVENTIVA', 'Troca de oleo, filtros e revisao geral.',
    CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '160 days', 50000.0, 44800.0, 1450.00, 'CONCLUIDA'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendas (
  id, numero, cliente_id, vendedor_id, tipo_venda, status, forma_pagamento, condicao_pagamento,
  data_venda, data_faturamento, data_entrega_prevista, subtotal, desconto_valor, frete_valor, total_valor, observacoes
)
VALUES
  (
    'vd000000-0000-0000-0000-000000000001', 'VEN-2026-0001', 'c0000000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'NORMAL', 'CONFIRMADA', 'A_PRAZO', '30/60 dias',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', CURRENT_DATE + INTERVAL '2 days',
    2850.00, 150.00, 220.00, 2920.00, 'Venda com entrega agendada.'
  ),
  (
    'vd000000-0000-0000-0000-000000000002', 'VEN-2026-0002', 'c0000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DIRETA', 'FATURADA', 'PIX', 'Pagamento imediato',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', CURRENT_DATE,
    429.90, 0.00, 0.00, 429.90, 'Venda de balcão.'
  ),
  (
    'vd000000-0000-0000-0000-000000000003', 'VEN-2026-0003', 'c0000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'FUTURA', 'PENDENTE', 'A_PRAZO', '45 dias',
    NOW(), NULL, CURRENT_DATE + INTERVAL '15 days',
    3960.00, 160.00, 340.00, 4140.00, 'Venda futura para entrega programada.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO itens_venda (
  id, venda_id, produto_id, local_estoque_id, sequencia, quantidade, preco_unitario, desconto_valor, total_valor
)
VALUES
  (
    'iv000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001', 'l0000000-0000-0000-0000-000000000001',
    1, 10.000, 285.00, 150.00, 2700.00
  ),
  (
    'iv000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001',
    2, 1.000, 150.00, 0.00, 150.00
  ),
  (
    'iv000000-0000-0000-0000-000000000003', 'vd000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000003', 'l0000000-0000-0000-0000-000000000002',
    1, 1.000, 429.90, 0.00, 429.90
  ),
  (
    'iv000000-0000-0000-0000-000000000004', 'vd000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000002', 'l0000000-0000-0000-0000-000000000001',
    1, 20.000, 198.00, 160.00, 3800.00
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO fretes (
  id, venda_id, modalidade, tipo_calculo, regiao_destino, peso_total_kg, distancia_km,
  valor_estimado, valor_real, veiculo_id, transportadora_fornecedor_id, observacoes
)
VALUES
  (
    'fr000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'PROPRIO', 'DISTANCIA', 'Rio Verde/GO', 250.000, 230.00,
    220.00, NULL, 'v0000000-0000-0000-0000-000000000001', NULL, 'Entrega com frota propria.'
  ),
  (
    'fr000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000003',
    'TERCEIRO', 'REGIAO', 'Jatai/GO', 1000.000, 320.00,
    340.00, NULL, NULL, 'f0000000-0000-0000-0000-000000000002', 'Entrega futura via transportadora.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO entregas (
  id, venda_id, frete_id, responsavel_usuario_id, status, data_saida,
  data_entrega_realizada, tentativa_atual, comprovante_recebimento, observacoes
)
VALUES
  (
    'en000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'fr000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'EM_TRANSITO',
    NOW() - INTERVAL '1 day', NULL, 1, NULL, 'Motorista em rota de entrega.'
  ),
  (
    'en000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000003',
    'fr000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AGUARDANDO_DESPACHO',
    NULL, NULL, 0, NULL, 'Separacao aguardando data de expedicao.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO historico_entregas (
  id, entrega_id, status, data_evento, observacao, usuario_id
)
VALUES
  (
    'he000000-0000-0000-0000-000000000001', 'en000000-0000-0000-0000-000000000001',
    'AGUARDANDO_DESPACHO', NOW() - INTERVAL '2 days', 'Pedido separado e aguardando liberacao.', 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ),
  (
    'he000000-0000-0000-0000-000000000002', 'en000000-0000-0000-0000-000000000001',
    'EM_TRANSITO', NOW() - INTERVAL '1 day', 'Carga expedida para o cliente.', 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ),
  (
    'he000000-0000-0000-0000-000000000003', 'en000000-0000-0000-0000-000000000002',
    'AGUARDANDO_DESPACHO', NOW(), 'Venda futura registrada e entrega ainda nao liberada.', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO duplicatas (
  id, venda_id, cliente_id, numero, parcela, valor_total, valor_aberto, vencimento, data_emissao, status, observacoes
)
VALUES
  (
    'dp000000-0000-0000-0000-000000000001', 'vd000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', 'DUP-2026-0001-01', 1, 1460.00, 0.00,
    CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days', 'PAGO',
    'Primeira parcela da venda VEN-2026-0001.'
  ),
  (
    'dp000000-0000-0000-0000-000000000002', 'vd000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', 'DUP-2026-0001-02', 2, 1460.00, 1460.00,
    CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE - INTERVAL '10 days', 'EM_ABERTO',
    'Segunda parcela da venda VEN-2026-0001.'
  ),
  (
    'dp000000-0000-0000-0000-000000000003', 'vd000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002', 'DUP-2026-0003-01', 1, 4140.00, 4140.00,
    CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE, 'EM_ABERTO',
    'Duplicata gerada para venda futura.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO pagamentos (
  id, duplicata_id, recebido_por_usuario_id, forma_pagamento, valor, data_pagamento, referencia_externa, observacoes
)
VALUES
  (
    'pg000000-0000-0000-0000-000000000001', 'dp000000-0000-0000-0000-000000000001',
    'cccccccc-cccc-cccc-cccc-cccccccccccc', 'PIX', 1460.00, NOW() - INTERVAL '5 days',
    'PIX-E2E-0001', 'Pagamento integral recebido via PIX.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO movimentacoes_estoque (
  id, produto_id, local_origem_id, local_destino_id, usuario_id, venda_id,
  tipo_movimentacao, quantidade, motivo, observacoes, data_movimentacao
)
VALUES
  (
    'mv000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001',
    NULL, 'l0000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL,
    'ENTRADA', 80.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '30 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002',
    NULL, 'l0000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL,
    'ENTRADA', 60.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '28 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003',
    NULL, 'l0000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL,
    'ENTRADA', 25.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '25 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001',
    'l0000000-0000-0000-0000-000000000001', NULL, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'vd000000-0000-0000-0000-000000000001',
    'SAIDA', 10.000, 'VENDA', 'Baixa referente a VEN-2026-0001.', NOW() - INTERVAL '9 days'
  ),
  (
    'mv000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000003',
    'l0000000-0000-0000-0000-000000000002', NULL, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'vd000000-0000-0000-0000-000000000002',
    'SAIDA', 1.000, 'VENDA', 'Baixa referente a VEN-2026-0002.', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO logs_auditoria (
  id, usuario_id, tabela_nome, registro_id, acao, dados_anteriores, dados_novos, ip_origem, user_agent, criado_em
)
VALUES
  (
    'lg000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'usuarios',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'LOGIN', NULL,
    '{"status":"ATIVO","evento":"login"}'::jsonb, '127.0.0.1', 'seed-script', NOW() - INTERVAL '1 day'
  ),
  (
    'lg000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vendas',
    'vd000000-0000-0000-0000-000000000003', 'INSERT', NULL,
    '{"numero":"VEN-2026-0003","tipo_venda":"FUTURA","status":"PENDENTE"}'::jsonb, '127.0.0.1', 'seed-script', NOW()
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

```

### `backend/src/controllers/authController.js`

```javascript
const authService = require("../services/authService");

const login = async (request, response, next) => {
  try {
    const result = await authService.login({
      email: request.body.email,
      password: request.body.password,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Autenticacao realizada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (request, response, next) => {
  try {
    const result = await authService.getAuthenticatedProfile(request.user);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const requestPasswordReset = async (request, response, next) => {
  try {
    const result = await authService.requestPasswordReset({
      email: request.body.email,
      request
    });

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const confirmPasswordReset = async (request, response, next) => {
  try {
    const result = await authService.confirmPasswordReset({
      token: request.body.token,
      newPassword: request.body.newPassword,
      request
    });

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (request, response, next) => {
  try {
    const result = await authService.logout(request.user, request);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  getMe,
  requestPasswordReset,
  confirmPasswordReset,
  logout
};

```

### `backend/src/services/authService.js`

```javascript
const crypto = require("crypto");

const authModel = require("../models/authModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const env = require("../config/env");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  signAccessToken,
  verifyAccessToken,
  generateJti,
  calculateExpirationDate
} = require("../utils/jwt");
const {
  mapPermissions,
  hasPermission
} = require("../utils/permissions");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const ensureEmail = (email) => {
  if (!email || typeof email !== "string") {
    throw new AppError("E-mail obrigatorio", 400);
  }
};

const ensurePassword = (password) => {
  if (!password || typeof password !== "string") {
    throw new AppError("Senha obrigatoria", 400);
  }
};

const ensureStrongEnoughPassword = (password) => {
  ensurePassword(password);

  if (password.length < 8) {
    throw new AppError("A nova senha deve ter pelo menos 8 caracteres", 400);
  }
};

const getSessionExpiry = () =>
  calculateExpirationDate(env.sessionAbsoluteTimeoutHours, "hours");

const getResetExpiry = () =>
  calculateExpirationDate(env.passwordResetTokenTtlMinutes, "minutes");

const buildAuthenticatedUser = async (userId, sessionId) => {
  const user = await authModel.findUserProfileById(userId);

  if (!user) {
    throw new AppError("Usuario autenticado nao encontrado", 401);
  }

  const permissionRows = await authModel.findPermissionsByProfileId(user.perfil_id);
  const permissions = mapPermissions(permissionRows);

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    phone: user.telefone,
    status: user.status,
    profile: {
      id: user.perfil_id,
      name: user.perfil_nome
    },
    session: {
      id: sessionId
    },
    permissions
  };
};

const login = async ({ email, password, request }) => {
  ensureEmail(email);
  ensurePassword(password);

  const user = await authModel.findUserForAuthByEmail(email);
  const metadata = getRequestMetadata(request);

  if (!user) {
    await auditLogModel.createAuditLog({
      tableName: "usuarios",
      action: "LOGIN",
      newData: { email, status: "FAILED_USER_NOT_FOUND" },
      ...metadata
    });

    throw new AppError("Credenciais invalidas", 401);
  }

  if (user.status !== "ATIVO") {
    await auditLogModel.createAuditLog({
      userId: user.id,
      tableName: "usuarios",
      recordId: user.id,
      action: "LOGIN",
      newData: { email: user.email, status: "FAILED_USER_INACTIVE" },
      ...metadata
    });

    throw new AppError("Usuario sem acesso ativo", 403);
  }

  const passwordMatches = await comparePassword(password, user.senha_hash);

  if (!passwordMatches) {
    await auditLogModel.createAuditLog({
      userId: user.id,
      tableName: "usuarios",
      recordId: user.id,
      action: "LOGIN",
      newData: { email: user.email, status: "FAILED_INVALID_PASSWORD" },
      ...metadata
    });

    throw new AppError("Credenciais invalidas", 401);
  }

  const tokenJti = generateJti();
  const session = await authModel.createSession({
    userId: user.id,
    tokenJti,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    expiresAt: getSessionExpiry()
  });

  await authModel.updateLastLogin(user.id);

  const token = signAccessToken({
    subject: user.id,
    sessionId: session.id,
    tokenJti,
    profileId: user.perfil_id
  });

  const authenticatedUser = await buildAuthenticatedUser(user.id, session.id);

  await auditLogModel.createAuditLog({
    userId: user.id,
    tableName: "usuarios",
    recordId: user.id,
    action: "LOGIN",
    newData: { sessionId: session.id, profile: user.perfil_nome, status: "SUCCESS" },
    ...metadata
  });

  return {
    token,
    tokenType: "Bearer",
    expiresIn: env.jwtExpiresIn,
    user: authenticatedUser
  };
};

const getAuthenticatedProfile = async (authenticatedUser) =>
  buildAuthenticatedUser(authenticatedUser.id, authenticatedUser.sessionId);

const requestPasswordReset = async ({ email, request }) => {
  ensureEmail(email);

  const user = await authModel.findUserForAuthByEmail(email);
  const metadata = getRequestMetadata(request);

  if (!user) {
    await auditLogModel.createAuditLog({
      tableName: "usuarios",
      action: "PASSWORD_RESET_REQUEST",
      newData: { email, status: "IGNORED_USER_NOT_FOUND" },
      ...metadata
    });

    return {
      message:
        "Se o e-mail estiver cadastrado, um token de redefinicao sera disponibilizado."
    };
  }

  await authModel.invalidateOpenPasswordResetTokens(user.id);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const resetToken = await authModel.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt: getResetExpiry(),
    ipAddress: metadata.ipAddress
  });

  await auditLogModel.createAuditLog({
    userId: user.id,
    tableName: "usuarios",
    recordId: user.id,
    action: "PASSWORD_RESET_REQUEST",
    newData: { resetTokenId: resetToken.id, status: "CREATED" },
    ...metadata
  });

  return {
    message:
      "Solicitacao de redefinicao registrada. Integre o envio por e-mail na camada de notificacao.",
    reset: {
      token: rawToken,
      expiresAt: resetToken.expira_em
    }
  };
};

const confirmPasswordReset = async ({ token, newPassword, request }) => {
  if (!token || typeof token !== "string") {
    throw new AppError("Token de redefinicao obrigatorio", 400);
  }

  ensureStrongEnoughPassword(newPassword);

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetToken = await authModel.findActivePasswordResetToken(tokenHash);
  const metadata = getRequestMetadata(request);

  if (!resetToken || resetToken.utilizado_em) {
    throw new AppError("Token de redefinicao invalido", 400);
  }

  if (resetToken.status !== "ATIVO") {
    throw new AppError("Usuario sem acesso ativo", 403);
  }

  if (new Date(resetToken.expira_em) < new Date()) {
    throw new AppError("Token de redefinicao expirado", 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await authModel.updatePasswordHash(resetToken.usuario_id, passwordHash);
  await authModel.markPasswordResetTokenAsUsed(resetToken.id);
  await authModel.invalidateOpenPasswordResetTokens(resetToken.usuario_id);
  await authModel.revokeAllUserSessions(resetToken.usuario_id);

  await auditLogModel.createAuditLog({
    userId: resetToken.usuario_id,
    tableName: "usuarios",
    recordId: resetToken.usuario_id,
    action: "PASSWORD_RESET_CONFIRM",
    newData: { resetTokenId: resetToken.id, status: "SUCCESS" },
    ...metadata
  });

  return {
    message: "Senha redefinida com sucesso. Faça login novamente."
  };
};

const logout = async (authenticatedUser, request) => {
  const metadata = getRequestMetadata(request);

  await authModel.revokeSession(authenticatedUser.sessionId, "LOGOUT");

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "usuarios",
    recordId: authenticatedUser.id,
    action: "LOGOUT",
    newData: { sessionId: authenticatedUser.sessionId, status: "SUCCESS" },
    ...metadata
  });

  return {
    message: "Sessao encerrada com sucesso."
  };
};

const validateAuthenticatedRequest = async (token) => {
  const payload = verifyAccessToken(token);
  const session = await authModel.findSessionById(payload.sessionId);

  if (!session) {
    throw new AppError("Sessao nao encontrada", 401);
  }

  if (session.revogada_em) {
    throw new AppError("Sessao revogada", 401);
  }

  if (session.status !== "ATIVO") {
    throw new AppError("Usuario sem acesso ativo", 403);
  }

  if (session.token_jti !== payload.jti) {
    throw new AppError("Token invalido para a sessao", 401);
  }

  if (new Date(session.expira_em) < new Date()) {
    await authModel.revokeSession(session.id, "ABSOLUTE_TIMEOUT");
    throw new AppError("Sessao expirada", 401);
  }

  const lastAccessTime = new Date(session.ultimo_acesso_em).getTime();
  const idleWindowMs = env.sessionIdleTimeoutMinutes * 60 * 1000;

  if (Date.now() - lastAccessTime > idleWindowMs) {
    await authModel.revokeSession(session.id, "IDLE_TIMEOUT");
    throw new AppError("Sessao expirada por inatividade", 401);
  }

  await authModel.touchSession(session.id);

  const permissionRows = await authModel.findPermissionsByProfileId(session.perfil_id);
  const permissions = mapPermissions(permissionRows);

  return {
    id: session.usuario_id,
    sessionId: session.id,
    email: session.email,
    name: session.nome,
    status: session.status,
    profile: {
      id: session.perfil_id,
      name: session.perfil_nome
    },
    permissions,
    tokenPayload: payload
  };
};

const ensurePermission = (authenticatedUser, permission) => {
  if (!hasPermission(authenticatedUser.permissions, permission)) {
    throw new AppError("Usuario sem permissao para executar esta acao", 403);
  }
};

module.exports = {
  login,
  getAuthenticatedProfile,
  requestPasswordReset,
  confirmPasswordReset,
  logout,
  validateAuthenticatedRequest,
  ensurePermission
};

```

### `backend/src/models/authModel.js`

```javascript
const { query } = require("../config/database");

const findUserForAuthByEmail = async (email) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.perfil_id,
        u.nome,
        u.email,
        u.senha_hash,
        u.status,
        u.ultimo_login_em,
        p.nome AS perfil_nome
      FROM usuarios u
      INNER JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
};

const findUserProfileById = async (userId) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.perfil_id,
        u.nome,
        u.email,
        u.telefone,
        u.status,
        u.ultimo_login_em,
        u.criado_em,
        p.nome AS perfil_nome
      FROM usuarios u
      INNER JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
};

const findPermissionsByProfileId = async (profileId) => {
  const result = await query(
    `
      SELECT modulo, pode_criar, pode_ler, pode_atualizar, pode_excluir
      FROM perfil_permissoes
      WHERE perfil_id = $1
      ORDER BY modulo ASC
    `,
    [profileId]
  );

  return result.rows;
};

const updateLastLogin = async (userId) => {
  await query(
    `
      UPDATE usuarios
      SET ultimo_login_em = NOW(), atualizado_em = NOW()
      WHERE id = $1
    `,
    [userId]
  );
};

const createSession = async ({
  userId,
  tokenJti,
  ipAddress,
  userAgent,
  expiresAt
}) => {
  const result = await query(
    `
      INSERT INTO sessoes_usuario (
        usuario_id,
        token_jti,
        ip_origem,
        user_agent,
        ultimo_acesso_em,
        expira_em
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING id, usuario_id, token_jti, ultimo_acesso_em, expira_em, revogada_em
    `,
    [userId, tokenJti, ipAddress, userAgent, expiresAt]
  );

  return result.rows[0];
};

const findSessionById = async (sessionId) => {
  const result = await query(
    `
      SELECT
        s.id,
        s.usuario_id,
        s.token_jti,
        s.ip_origem,
        s.user_agent,
        s.ultimo_acesso_em,
        s.expira_em,
        s.revogada_em,
        u.perfil_id,
        u.nome,
        u.email,
        u.status,
        p.nome AS perfil_nome
      FROM sessoes_usuario s
      INNER JOIN usuarios u ON u.id = s.usuario_id
      INNER JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
};

const touchSession = async (sessionId) => {
  await query(
    `
      UPDATE sessoes_usuario
      SET ultimo_acesso_em = NOW()
      WHERE id = $1
    `,
    [sessionId]
  );
};

const revokeSession = async (sessionId, reason = "LOGOUT") => {
  await query(
    `
      UPDATE sessoes_usuario
      SET revogada_em = NOW(), motivo_revogacao = $2
      WHERE id = $1 AND revogada_em IS NULL
    `,
    [sessionId, reason]
  );
};

const revokeAllUserSessions = async (userId, reason = "PASSWORD_RESET") => {
  await query(
    `
      UPDATE sessoes_usuario
      SET revogada_em = NOW(), motivo_revogacao = $2
      WHERE usuario_id = $1 AND revogada_em IS NULL
    `,
    [userId, reason]
  );
};

const createPasswordResetToken = async ({
  userId,
  tokenHash,
  expiresAt,
  ipAddress
}) => {
  const result = await query(
    `
      INSERT INTO tokens_reset_senha (
        usuario_id,
        token_hash,
        expira_em,
        ip_origem
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, usuario_id, expira_em, criado_em
    `,
    [userId, tokenHash, expiresAt, ipAddress]
  );

  return result.rows[0];
};

const findActivePasswordResetToken = async (tokenHash) => {
  const result = await query(
    `
      SELECT
        t.id,
        t.usuario_id,
        t.expira_em,
        t.utilizado_em,
        u.status,
        u.email,
        u.nome
      FROM tokens_reset_senha t
      INNER JOIN usuarios u ON u.id = t.usuario_id
      WHERE t.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
};

const markPasswordResetTokenAsUsed = async (tokenId) => {
  await query(
    `
      UPDATE tokens_reset_senha
      SET utilizado_em = NOW()
      WHERE id = $1 AND utilizado_em IS NULL
    `,
    [tokenId]
  );
};

const invalidateOpenPasswordResetTokens = async (userId) => {
  await query(
    `
      UPDATE tokens_reset_senha
      SET utilizado_em = NOW()
      WHERE usuario_id = $1 AND utilizado_em IS NULL
    `,
    [userId]
  );
};

const updatePasswordHash = async (userId, passwordHash) => {
  await query(
    `
      UPDATE usuarios
      SET senha_hash = $2, atualizado_em = NOW()
      WHERE id = $1
    `,
    [userId, passwordHash]
  );
};

module.exports = {
  findUserForAuthByEmail,
  findUserProfileById,
  findPermissionsByProfileId,
  updateLastLogin,
  createSession,
  findSessionById,
  touchSession,
  revokeSession,
  revokeAllUserSessions,
  createPasswordResetToken,
  findActivePasswordResetToken,
  markPasswordResetTokenAsUsed,
  invalidateOpenPasswordResetTokens,
  updatePasswordHash
};

```

### `backend/src/models/auditLogModel.js`

```javascript
const { query } = require("../config/database");

const createAuditLog = async ({
  userId = null,
  tableName,
  recordId = null,
  action,
  previousData = null,
  newData = null,
  ipAddress = null,
  userAgent = null
}) => {
  await query(
    `
      INSERT INTO logs_auditoria (
        usuario_id,
        tabela_nome,
        registro_id,
        acao,
        dados_anteriores,
        dados_novos,
        ip_origem,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      userId,
      tableName,
      recordId,
      action,
      previousData ? JSON.stringify(previousData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress,
      userAgent
    ]
  );
};

module.exports = {
  createAuditLog
};

```

### `backend/src/middlewares/authMiddleware.js`

```javascript
const AppError = require("../utils/AppError");
const authService = require("../services/authService");

const authMiddleware = async (request, response, next) => {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError("Token de acesso nao informado", 401);
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Formato do token invalido", 401);
    }

    request.user = await authService.validateAuthenticatedRequest(token);

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authMiddleware;

```

### `backend/src/middlewares/permissionMiddleware.js`

```javascript
const authService = require("../services/authService");
const AppError = require("../utils/AppError");

const permissionMiddleware = (...requiredPermissions) => {
  return (request, response, next) => {
    try {
      if (!request.user) {
        throw new AppError("Usuario autenticado nao encontrado no contexto", 500);
      }

      requiredPermissions.forEach((permission) => {
        authService.ensurePermission(request.user, permission);
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = permissionMiddleware;

```

### `backend/src/routes/authRoutes.js`

```javascript
const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/password-reset/request", authController.requestPasswordReset);
router.post("/password-reset/confirm", authController.confirmPasswordReset);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.getMe);

router.get(
  "/permissions-example",
  authMiddleware,
  permissionMiddleware("clientes.read", "estoque.read"),
  (request, response) => {
    response.status(200).json({
      status: "success",
      message: "Usuario autenticado e autorizado para o exemplo de permissao",
      data: {
        userId: request.user.id,
        permissions: request.user.permissions
      }
    });
  }
);

module.exports = router;

```

### `backend/src/routes/index.js`

```javascript
const express = require("express");

const healthController = require("../controllers/healthController");
const authRoutes = require("./authRoutes");

const router = express.Router();

router.get("/", (request, response) => {
  response.status(200).json({
    status: "success",
    message: "API base do ERP operacional"
  });
});

router.get("/health", healthController.getHealthStatus);
router.use("/auth", authRoutes);

module.exports = router;

```

### `backend/src/utils/jwt.js`

```javascript
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const AppError = require("./AppError");

const generateJti = () => crypto.randomUUID();

const signAccessToken = ({ subject, sessionId, tokenJti, profileId }) =>
  jwt.sign(
    {
      sid: sessionId,
      profileId
    },
    env.jwtSecret,
    {
      jwtid: tokenJti,
      subject,
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    }
  );

const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    });

    return {
      sub: payload.sub,
      jti: payload.jti,
      sessionId: payload.sid,
      profileId: payload.profileId,
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    throw new AppError("Token invalido ou expirado", 401);
  }
};

const calculateExpirationDate = (value, unit) => {
  const expiresAt = new Date();

  if (unit === "hours") {
    expiresAt.setHours(expiresAt.getHours() + value);
    return expiresAt;
  }

  expiresAt.setMinutes(expiresAt.getMinutes() + value);
  return expiresAt;
};

module.exports = {
  generateJti,
  signAccessToken,
  verifyAccessToken,
  calculateExpirationDate
};

```

### `backend/src/utils/password.js`

```javascript
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const comparePassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);

module.exports = {
  hashPassword,
  comparePassword
};

```

### `backend/src/utils/permissions.js`

```javascript
const ACTION_TO_COLUMN = {
  create: "pode_criar",
  read: "pode_ler",
  update: "pode_atualizar",
  delete: "pode_excluir"
};

const normalizePermission = (permission) => {
  const [module, action] = permission.split(".");

  return {
    module,
    action,
    column: ACTION_TO_COLUMN[action]
  };
};

const mapPermissions = (permissionRows) =>
  permissionRows.reduce((accumulator, row) => {
    accumulator[row.modulo] = {
      create: row.pode_criar,
      read: row.pode_ler,
      update: row.pode_atualizar,
      delete: row.pode_excluir
    };

    return accumulator;
  }, {});

const hasPermission = (permissions, permission) => {
  const normalized = normalizePermission(permission);

  if (!normalized.module || !normalized.action || !normalized.column) {
    return false;
  }

  return Boolean(
    permissions[normalized.module] &&
      permissions[normalized.module][normalized.action]
  );
};

module.exports = {
  ACTION_TO_COLUMN,
  normalizePermission,
  mapPermissions,
  hasPermission
};

```

### `backend/src/config/env.js`

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
  )
};

```

### `backend/src/config/database.js`

```javascript
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

const getClient = () => pool.connect();

const testConnection = async () => {
  await query("SELECT 1");
};

const closePool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};

```

---

## 7. Como Ler Permissoes e Proteger Rotas

Fluxo aplicado:

1. O login valida credenciais com `bcrypt.compare`.
2. O service cria uma linha em `sessoes_usuario`.
3. O JWT recebe `sub`, `sid`, `profileId` e `jti`.
4. O `authMiddleware` valida assinatura, sessao, revogacao e timeout por inatividade.
5. As permissoes do perfil sao carregadas da tabela `perfil_permissoes`.
6. O `permissionMiddleware` exige permissoes como `clientes.read` ou `vendas.create`.

Exemplo de protecao de rota:

```js
router.get(
  "/clientes",
  authMiddleware,
  permissionMiddleware("clientes.read"),
  clientesController.list
);
```

---

## 8. Registro de Auditoria das Acoes de Autenticacao

Eventos registrados em `logs_auditoria`:

- tentativa de login com usuario inexistente
- tentativa de login com usuario inativo
- tentativa de login com senha invalida
- login bem-sucedido
- logout
- solicitacao de reset de senha
- confirmacao de reset de senha

Campos utilizados na auditoria:

- `usuario_id`
- `tabela_nome`
- `registro_id`
- `acao`
- `dados_anteriores`
- `dados_novos`
- `ip_origem`
- `user_agent`

---

## 9. Base para Reset de Senha e Timeout de Sessao

### Reset de senha

- o usuario solicita reset por e-mail;
- o backend cria um token aleatorio bruto;
- apenas o hash SHA-256 do token vai para `tokens_reset_senha`;
- o token possui expiracao;
- ao confirmar o reset, a senha e rehashada com `bcrypt`;
- todas as sessoes ativas do usuario sao revogadas.

### Timeout de sessao

- timeout absoluto controlado por `SESSION_ABSOLUTE_TIMEOUT_HOURS`;
- timeout por inatividade controlado por `SESSION_IDLE_TIMEOUT_MINUTES`;
- cada request autenticada atualiza `ultimo_acesso_em`;
- se o limite for excedido, a sessao e revogada e o acesso e negado.

---

## 10. Orientacao Curta de Integracao com o Restante do Sistema

- aplique `authMiddleware` em todas as rotas privadas do ERP;
- aplique `permissionMiddleware("modulo.acao")` por endpoint;
- use os modulos da tabela `perfil_permissoes` seguindo o nome funcional do dominio, como `clientes`, `produtos`, `vendas`, `estoque`, `financeiro` e `frota`;
- ao criar usuarios por modulo administrativo, sempre gere `senha_hash` com `hashPassword`;
- quando o sistema de e-mail for implementado, substitua o retorno do token bruto de reset por envio seguro ao usuario;
- para controllers futuros, use `request.user` como fonte do usuario autenticado e da sessao corrente.
