# Modelagem Inicial PostgreSQL

## 1. Explicacao da Modelagem Escolhida

A modelagem foi desenhada para um ERP comercial com foco em rastreabilidade, consistencia relacional e crescimento modular. O desenho prioriza normalizacao onde ela agrega valor operacional e evita duplicacao desnecessaria de dados.

### Decisoes principais

- `clientes` nao armazena historico de compras nem saldo em aberto de forma redundante.
Esses dados sao derivados de `vendas`, `duplicatas` e `pagamentos`, reduzindo inconsistencias.

- `produtos` possui `fornecedor_padrao_id`, `estoque_minimo` e `ponto_reposicao`.
Isso atende o SRS e prepara alertas de ressuprimento.

- `estoques` guarda saldo por `produto + local`.
Ja `movimentacoes_estoque` guarda a trilha operacional com data, usuario, motivo e vinculo opcional com venda.

- `vendas` foi separada de `itens_venda`, `fretes`, `entregas` e `duplicatas`.
Isso desacopla venda comercial, expedicao e financeiro.

- Para suportar permissao granular por perfil, foi adicionada a tabela `perfil_permissoes`.
Ela complementa `perfis_acesso` sem quebrar o requisito minimo.

- Para suportar historico operacional da entrega, foi adicionada a tabela `historico_entregas`.
Isso evita sobrecarregar `entregas` com eventos repetidos.

- `logs_auditoria` usa `JSONB` para antes/depois.
Essa abordagem e flexivel para auditoria de alteracoes em multiplas tabelas.

---

## 2. Lista de Tabelas e Responsabilidades

- `perfis_acesso`: perfis funcionais do sistema, como Administrador, Vendedor e Financeiro.
- `perfil_permissoes`: permissoes granulares por modulo e operacao CRUD para cada perfil.
- `usuarios`: usuarios autenticados do sistema e seu perfil principal.
- `fornecedores`: fornecedores de mercadorias, transportadoras terceirizadas e prestadores de servico.
- `clientes`: cadastro comercial e financeiro do cliente, incluindo limite de credito.
- `produtos`: catalogo de produtos com fornecedor padrao, estoque minimo e ponto de reposicao.
- `locais_estoque`: locais fisicos ou logicos de armazenagem.
- `estoques`: saldo atual por produto e por local.
- `movimentacoes_estoque`: trilha das entradas, saidas, ajustes e transferencias.
- `vendas`: cabecalho da venda, incluindo tipo, status e forma de pagamento.
- `itens_venda`: itens da venda, quantidades, precos e descontos.
- `fretes`: custo e configuracao logistica do transporte ligado a uma venda.
- `entregas`: execucao operacional da entrega da venda.
- `historico_entregas`: mudancas de status e ocorrencias da entrega.
- `duplicatas`: titulos financeiros gerados a partir das vendas a prazo.
- `pagamentos`: recebimentos vinculados a duplicatas.
- `veiculos`: frota propria utilizada nas entregas.
- `manutencoes`: manutencoes preventivas e corretivas da frota.
- `logs_auditoria`: registro de alteracoes, login e eventos sensiveis.

---

## 3. Relacionamentos Entre Tabelas

- `perfis_acesso 1:N usuarios`
- `perfis_acesso 1:N perfil_permissoes`
- `fornecedores 1:N produtos`
- `fornecedores 1:N manutencoes`
- `fornecedores 1:N fretes` com uso opcional como transportadora terceirizada
- `clientes 1:N vendas`
- `clientes 1:N duplicatas`
- `usuarios 1:N vendas` como vendedor
- `usuarios 1:N movimentacoes_estoque`
- `usuarios 1:N entregas`
- `usuarios 1:N pagamentos`
- `usuarios 1:N veiculos` como responsavel
- `usuarios 1:N logs_auditoria`
- `produtos 1:N estoques`
- `locais_estoque 1:N estoques`
- `produtos 1:N movimentacoes_estoque`
- `locais_estoque 1:N movimentacoes_estoque` como origem e destino
- `vendas 1:N itens_venda`
- `vendas 1:1 fretes`
- `vendas 1:1 entregas`
- `vendas 1:N duplicatas`
- `vendas 1:N movimentacoes_estoque` de forma opcional
- `entregas 1:N historico_entregas`
- `duplicatas 1:N pagamentos`
- `veiculos 1:N manutencoes`
- `veiculos 1:N fretes`

### Observacao curta

- O historico de compras do cliente e derivado de `vendas` e `itens_venda`.
- Os debitos em aberto do cliente sao derivados de `duplicatas` e `pagamentos`.

---

## 4. Arquivo `migrations.sql` Completo

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
  CONSTRAINT logs_auditoria_acao_check CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'))
);

CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_perfil_id ON perfil_permissoes (perfil_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_id ON usuarios (perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios (status);

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

---

## 5. Arquivo `seeders.sql` Inicial Completo

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
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cadastros', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'vendas', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'estoque', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'financeiro', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'frota', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'relatorios', TRUE, TRUE, TRUE, TRUE),
  ('10000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'vendas', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'cadastros', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', 'financeiro', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000010', '44444444-4444-4444-4444-444444444444', 'estoque', TRUE, TRUE, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000011', '55555555-5555-5555-5555-555555555555', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000012', '55555555-5555-5555-5555-555555555555', 'dashboard', FALSE, TRUE, FALSE, FALSE)
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

---

## 6. Sugestao de Indices Importantes para Performance

- `usuarios(perfil_id, status)` para autenticacao e listagens administrativas.
- `clientes(status, nome_razao_social)` para busca operacional.
- `produtos(status, categoria, nome)` para catalogo e consultas comerciais.
- `estoques(produto_id, local_estoque_id)` para saldo por local.
- `vendas(cliente_id, vendedor_id, status, data_venda)` para consultas comerciais e relatorios.
- `duplicatas(cliente_id, status, vencimento)` para contas a receber e cobranca.
- `pagamentos(duplicata_id, data_pagamento)` para conciliacao financeira.
- `entregas(status, responsavel_usuario_id)` para fila operacional.
- `historico_entregas(entrega_id, data_evento)` para timeline de entrega.
- `movimentacoes_estoque(produto_id, local_origem_id, local_destino_id, data_movimentacao)` para rastreabilidade.
- `logs_auditoria(usuario_id, tabela_nome, acao, criado_em)` para auditoria e investigacao.

---

## 7. Observacoes Curtas Sobre Decisoes de Modelagem

- `perfil_permissoes` foi adicionada porque apenas `perfis_acesso` nao cobre permissao granular por modulo e CRUD.
- `historico_entregas` foi adicionada porque o SRS exige historico operacional da entrega.
- `fretes` ficou separado de `entregas` porque custo de frete e execucao da entrega sao responsabilidades diferentes.
- `movimentacoes_estoque` usa local de origem e destino para suportar transferencia entre locais sem duplicar estrutura.
- `fornecedores` foi reutilizada para manutencao e transportadora terceirizada, evitando criar entidades fora do escopo necessario.
- `logs_auditoria` usa `JSONB` para permitir registrar alteracoes heterogeneas sem schema paralelo por tabela.
- `valor_aberto` em `duplicatas` facilita consulta operacional rapida, enquanto a consistencia continua sendo fechada pelos `pagamentos`.

---

## 8. Arquivos Atualizados no Projeto

- `backend/src/database/migrations.sql`
- `backend/src/database/seeders.sql`

