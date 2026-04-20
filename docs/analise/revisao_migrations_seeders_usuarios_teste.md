# Revisao Completa de `migrations.sql` e `seeders.sql` com Usuarios de Teste por Perfil

## Escopo da revisao

Esta revisao considerou:

- o SRS em [docs/srs_v2.md](/Users/alberto/sis_efratagro/docs/srs_v2.md)
- a modelagem atual em [backend/src/database/migrations.sql](/Users/alberto/sis_efratagro/backend/src/database/migrations.sql)
- a carga atual em [backend/src/database/seeders.sql](/Users/alberto/sis_efratagro/backend/src/database/seeders.sql)
- o fluxo real de autenticacao em [backend/src/models/authModel.js](/Users/alberto/sis_efratagro/backend/src/models/authModel.js), [backend/src/services/authService.js](/Users/alberto/sis_efratagro/backend/src/services/authService.js) e [backend/src/utils/password.js](/Users/alberto/sis_efratagro/backend/src/utils/password.js)

## Analise critica do `migrations.sql` atual

O `migrations.sql` estava bem encaminhado na modelagem principal do ERP, com separacao coerente entre usuarios, perfis, estoque, vendas, financeiro, fretes, frota e auditoria. A base relacional faz sentido para o dominio descrito no SRS.

Os principais problemas encontrados foram:

1. A tabela `notificacoes` usava `uuid_generate_v4()` sem garantir a extensao `uuid-ossp`. Como a migration habilitava apenas `pgcrypto`, a criacao da tabela poderia falhar.
2. A tabela `estoques` nao impedia `reservado > quantidade`, permitindo estado inconsistente.
3. A tabela `duplicatas` nao impedia `valor_aberto > valor_total` e nao restringia repeticao de parcela por venda.
4. A tabela `usuarios` tinha `UNIQUE(email)`, mas o login consulta por `LOWER(email)`. Isso permitia duplicidade por diferenca de caixa, por exemplo `Admin@...` e `admin@...`.
5. A tabela `fretes` nao impedia combinacoes invalidas entre `modalidade`, `veiculo_id` e `transportadora_fornecedor_id`.
6. A migration evoluida de fretes exige `POR_REGIAO/POR_PESO/POR_DISTANCIA/HIBRIDO`, mas o seed antigo ainda usava `REGIAO` e `DISTANCIA`.

## Analise critica do `seeders.sql` atual

O `seeders.sql` anterior nao estava pronto para uso real de homologacao.

Problemas identificados:

1. Nao havia usuario de teste para todos os perfis do SRS.
2. O perfil `Motorista / Logística` nao existia no seed.
3. O perfil `Gerente` existia, mas nao tinha usuario funcional.
4. Veiculos e entregas estavam vinculados a usuarios errados para o contexto operacional.
5. O seed usava varios identificadores com formato de UUID invalido, como prefixos `p`, `v`, `l`, `m`, `nt`, `lg`. PostgreSQL rejeita isso.
6. O seed inseria `fretes.tipo_calculo` com valores incompatíveis com a migration revisada.
7. O conjunto de permissoes nao refletia os modulos efetivamente usados pelas rotas do backend.
8. As credenciais nao estavam claramente documentadas para uso em teste.
9. O seed nao deixava o ambiente pronto para validar login por todos os perfis obrigatorios.

## Lista consolidada de problemas encontrados

- Falha potencial de migration por uso de `uuid_generate_v4()` sem `uuid-ossp`.
- Falta de validacoes de integridade em estoque e duplicatas.
- Falta de unicidade case-insensitive para email.
- Falta de coerencia entre modalidade de frete e referencia operacional.
- Seed incompleto em relacao aos perfis do SRS.
- Seed com UUIDs invalidos.
- Seed desalinhado com a evolucao estrutural de `fretes`.
- Vinculos operacionais incorretos em frota e entrega.
- Permissoes seeded insuficientes para os modulos reais da API.

## Melhorias aplicadas

- padronizacao do gerador de UUID para `gen_random_uuid()`
- adicao de `uq_usuarios_email_lower`
- adicao de `CHECK (reservado <= quantidade)` em `estoques`
- adicao de `UNIQUE (venda_id, parcela)` e `CHECK (valor_aberto <= valor_total)` em `duplicatas`
- adicao de regra de consistencia entre `modalidade` e referencias de frete
- inclusao dos 6 perfis obrigatorios do SRS
- inclusao de 6 usuarios ativos, um por perfil
- substituicao de hashes ambiguos por hashes bcrypt validos e documentados
- correcoes de IDs UUID invalidos
- ampliacao do seed com dados minimos coerentes de fornecedores, clientes, produtos, estoque, frota, vendas, entregas, financeiro, notificacoes e auditoria

## Observacao estrutural importante fora do escopo SQL

A camada atual de autorizacao do backend suporta bem permissoes no formato `modulo.acao` com acoes CRUD (`create`, `read`, `update`, `delete`, `inactivate`, `block`), mas ha rotas que usam padroes como:

- `fretes.calculate`
- `relatorios.export`
- `notificacoes.read.all`
- `auditoria.read.by_user`
- `auditoria.read.by_module`

Essas permissoes nao sao integralmente suportadas pela implementacao atual de [backend/src/utils/permissions.js](/Users/alberto/sis_efratagro/backend/src/utils/permissions.js). O SQL revisado deixa perfis, usuarios e permissoes base coerentes, mas essas acoes customizadas exigem ajuste adicional na regra de autorizacao do backend para cobertura total dessas rotas.

## Validacao executada

Validado em `PostgreSQL 16` via Docker em `2026-04-20`, com execucao sequencial de migration e seed em banco limpo.

Resultado:

- `migrations.sql`: executou com sucesso
- `seeders.sql`: executou com sucesso

## Versao revisada do `migrations.sql`

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
  CONSTRAINT estoques_reservado_check CHECK (reservado >= 0),
  CONSTRAINT estoques_reservado_lte_quantidade_check CHECK (reservado <= quantidade)
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
  CONSTRAINT uq_duplicatas_venda_parcela UNIQUE (venda_id, parcela),
  CONSTRAINT duplicatas_status_check CHECK (status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'PAGO', 'VENCIDO', 'CANCELADO')),
  CONSTRAINT duplicatas_parcela_check CHECK (parcela > 0),
  CONSTRAINT duplicatas_valor_total_check CHECK (valor_total >= 0),
  CONSTRAINT duplicatas_valor_aberto_check CHECK (valor_aberto >= 0),
  CONSTRAINT duplicatas_valor_aberto_lte_total_check CHECK (valor_aberto <= valor_total)
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
  CONSTRAINT fretes_valor_real_check CHECK (valor_real IS NULL OR valor_real >= 0),
  CONSTRAINT fretes_modalidade_referencia_check CHECK (
    (modalidade = 'PROPRIO' AND veiculo_id IS NOT NULL AND transportadora_fornecedor_id IS NULL)
    OR
    (modalidade = 'TERCEIRO' AND transportadora_fornecedor_id IS NOT NULL AND veiculo_id IS NULL)
  )
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
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email_lower ON usuarios ((LOWER(email)));

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

-- ═══════════════════════════════════════════════════════════════════════
-- MÓDULO DE FRETES — TABELAS DE CONFIGURAÇÃO E EVOLUÇÃO
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tabelas_frete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(120) NOT NULL,
  tipo_calculo VARCHAR(20) NOT NULL,
  regiao VARCHAR(120),
  peso_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0,
  peso_maximo NUMERIC(12, 3) NOT NULL DEFAULT 0,
  distancia_minima NUMERIC(12, 2) NOT NULL DEFAULT 0,
  distancia_maxima NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_base NUMERIC(14, 2) NOT NULL DEFAULT 0,
  valor_por_kg NUMERIC(14, 4) NOT NULL DEFAULT 0,
  valor_por_km NUMERIC(14, 4) NOT NULL DEFAULT 0,
  valor_fixo NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tabelas_frete_tipo_calculo_check CHECK (tipo_calculo IN ('POR_REGIAO', 'POR_PESO', 'POR_DISTANCIA', 'HIBRIDO')),
  CONSTRAINT tabelas_frete_status_check CHECK (status IN ('ATIVA', 'INATIVA')),
  CONSTRAINT tabelas_frete_peso_minimo_check CHECK (peso_minimo >= 0),
  CONSTRAINT tabelas_frete_peso_maximo_check CHECK (peso_maximo >= 0),
  CONSTRAINT tabelas_frete_distancia_minima_check CHECK (distancia_minima >= 0),
  CONSTRAINT tabelas_frete_distancia_maxima_check CHECK (distancia_maxima >= 0),
  CONSTRAINT tabelas_frete_valor_base_check CHECK (valor_base >= 0),
  CONSTRAINT tabelas_frete_valor_por_kg_check CHECK (valor_por_kg >= 0),
  CONSTRAINT tabelas_frete_valor_por_km_check CHECK (valor_por_km >= 0),
  CONSTRAINT tabelas_frete_valor_fixo_check CHECK (valor_fixo >= 0)
);

ALTER TABLE fretes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'CALCULADO';
ALTER TABLE fretes ADD COLUMN IF NOT EXISTS tabela_frete_id UUID REFERENCES tabelas_frete(id);
ALTER TABLE fretes DROP CONSTRAINT IF EXISTS fretes_status_check;
ALTER TABLE fretes ADD CONSTRAINT fretes_status_check CHECK (status IN ('CALCULADO', 'VINCULADO', 'EM_TRANSITO', 'CONCLUIDO', 'CANCELADO'));
ALTER TABLE fretes DROP CONSTRAINT IF EXISTS fretes_tipo_calculo_check;
ALTER TABLE fretes ADD CONSTRAINT fretes_tipo_calculo_check CHECK (tipo_calculo IN ('POR_REGIAO', 'POR_PESO', 'POR_DISTANCIA', 'HIBRIDO', 'MANUAL'));

CREATE INDEX IF NOT EXISTS idx_tabelas_frete_tipo_calculo ON tabelas_frete (tipo_calculo);
CREATE INDEX IF NOT EXISTS idx_tabelas_frete_status ON tabelas_frete (status);
CREATE INDEX IF NOT EXISTS idx_tabelas_frete_regiao ON tabelas_frete (regiao);
CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes (status);
CREATE INDEX IF NOT EXISTS idx_fretes_tabela_frete_id ON fretes (tabela_frete_id);
CREATE INDEX IF NOT EXISTS idx_fretes_regiao_destino ON fretes (regiao_destino);
CREATE INDEX IF NOT EXISTS idx_fretes_criado_em ON fretes (criado_em);

ALTER TABLE logs_auditoria ADD COLUMN IF NOT EXISTS descricao TEXT;

ALTER TABLE logs_auditoria DROP CONSTRAINT IF EXISTS logs_auditoria_acao_check;
ALTER TABLE logs_auditoria ADD CONSTRAINT logs_auditoria_acao_check CHECK (
  acao IN (
    'INSERT', 'UPDATE', 'DELETE',
    'INACTIVATE', 'STATUS_CHANGE',
    'LOGIN', 'LOGOUT',
    'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM',
    'PAYMENT_REGISTER', 'STOCK_MOVEMENT',
    'SALE_CONFIRM', 'DELIVERY_STATUS_CHANGE',
    'FREIGHT_REAL_COST_UPDATE',
    'FREIGHT_LINK_DELIVERY', 'FREIGHT_LINK_VEHICLE',
    'MAINTENANCE_STATUS_CHANGE', 'VEHICLE_STATUS_CHANGE'
  )
);

ALTER TABLE logs_auditoria ALTER COLUMN acao TYPE VARCHAR(40);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_tabela_registro ON logs_auditoria (tabela_nome, registro_id);

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(40) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  prioridade VARCHAR(10) NOT NULL DEFAULT 'MEDIA',
  status VARCHAR(15) NOT NULL DEFAULT 'NAO_LIDA',
  entidade VARCHAR(100),
  entidade_id UUID,
  metadata JSONB,
  lida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notificacoes_tipo_check CHECK (tipo IN (
    'ESTOQUE_BAIXO',
    'VENDA_FUTURA_PROXIMA',
    'DUPLICATA_VENCIDA',
    'DUPLICATA_VENCENDO',
    'MANUTENCAO_PENDENTE',
    'ENTREGA_NAO_CONCLUIDA',
    'ENTREGA_CONCLUIDA',
    'STATUS_ENTREGA_ALTERADO',
    'FRETE_DIVERGENTE',
    'ALERTA_GERAL'
  )),
  CONSTRAINT notificacoes_prioridade_check CHECK (prioridade IN (
    'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'
  )),
  CONSTRAINT notificacoes_status_check CHECK (status IN (
    'NAO_LIDA', 'LIDA', 'ARQUIVADA'
  ))
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_status ON notificacoes (usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_prioridade ON notificacoes (prioridade);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON notificacoes (criado_em);
CREATE INDEX IF NOT EXISTS idx_notificacoes_entidade ON notificacoes (entidade, entidade_id);

COMMIT;
```

## Versao revisada do `seeders.sql`

```sql
BEGIN;

INSERT INTO perfis_acesso (id, nome, descricao, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Acesso total ao sistema, configuracoes, auditoria e administracao de usuarios.', 'ATIVO'),
  ('22222222-2222-2222-2222-222222222222', 'Vendedor', 'Operacao comercial com foco em clientes, produtos, vendas e acompanhamento de entregas.', 'ATIVO'),
  ('33333333-3333-3333-3333-333333333333', 'Estoquista', 'Controle operacional de estoque, saldos, movimentacoes e apoio a expedicao.', 'ATIVO'),
  ('44444444-4444-4444-4444-444444444444', 'Motorista / Logística', 'Acompanhamento de fretes, entregas e frota operacional.', 'ATIVO'),
  ('55555555-5555-5555-5555-555555555555', 'Financeiro', 'Controle de duplicatas, pagamentos, cobrancas e visao financeira.', 'ATIVO'),
  ('66666666-6666-6666-6666-666666666666', 'Gerente', 'Visao consolidada do negocio, dashboards e relatorios gerenciais.', 'ATIVO')
ON CONFLICT (id) DO UPDATE
SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  status = EXCLUDED.status,
  atualizado_em = NOW();

INSERT INTO perfil_permissoes (perfil_id, modulo, pode_criar, pode_ler, pode_atualizar, pode_excluir)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'auditoria', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'clientes', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'clientes.financial', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'dashboard', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'dashboard.alerts', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'dashboard.finance', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'dashboard.fleet', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'dashboard.sales', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'dashboard.stock', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'estoque', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'financeiro', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'fornecedores', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'fretes', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'fretes.reports', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'fretes.tables', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'frota', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'notificacoes', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'produtos', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'produtos.stock', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'relatorios', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'relatorios.delivery', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'relatorios.finance', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'relatorios.fleet', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'relatorios.sales', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'relatorios.stock', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'usuarios', TRUE, TRUE, TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'vendas', TRUE, TRUE, TRUE, TRUE),

  ('22222222-2222-2222-2222-222222222222', 'clientes', TRUE, TRUE, TRUE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'dashboard', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'dashboard.sales', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'fretes', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'notificacoes', FALSE, TRUE, TRUE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'produtos.stock', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'relatorios.sales', FALSE, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 'vendas', TRUE, TRUE, TRUE, FALSE),

  ('33333333-3333-3333-3333-333333333333', 'dashboard', FALSE, TRUE, FALSE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'dashboard.stock', FALSE, TRUE, FALSE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'estoque', TRUE, TRUE, TRUE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'fretes', FALSE, TRUE, FALSE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'notificacoes', FALSE, TRUE, TRUE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'produtos.stock', FALSE, TRUE, FALSE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'relatorios.stock', FALSE, TRUE, FALSE, FALSE),

  ('44444444-4444-4444-4444-444444444444', 'dashboard', FALSE, TRUE, FALSE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'dashboard.alerts', FALSE, TRUE, FALSE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'dashboard.fleet', FALSE, TRUE, FALSE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'fretes', FALSE, TRUE, TRUE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'fretes.reports', FALSE, TRUE, FALSE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'frota', FALSE, TRUE, TRUE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'notificacoes', FALSE, TRUE, TRUE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'relatorios.delivery', FALSE, TRUE, FALSE, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'relatorios.fleet', FALSE, TRUE, FALSE, FALSE),

  ('55555555-5555-5555-5555-555555555555', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'clientes.financial', FALSE, TRUE, FALSE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'dashboard', FALSE, TRUE, FALSE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'dashboard.alerts', FALSE, TRUE, FALSE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'dashboard.finance', FALSE, TRUE, FALSE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'financeiro', TRUE, TRUE, TRUE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'notificacoes', FALSE, TRUE, TRUE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'relatorios.finance', FALSE, TRUE, FALSE, FALSE),

  ('66666666-6666-6666-6666-666666666666', 'auditoria', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'clientes', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'clientes.financial', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'dashboard', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'dashboard.alerts', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'dashboard.finance', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'dashboard.fleet', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'dashboard.sales', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'dashboard.stock', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'estoque', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'financeiro', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'fretes', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'fretes.reports', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'frota', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'notificacoes', FALSE, TRUE, TRUE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'produtos', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'produtos.stock', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'relatorios', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'relatorios.delivery', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'relatorios.finance', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'relatorios.fleet', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'relatorios.sales', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'relatorios.stock', FALSE, TRUE, FALSE, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'vendas', FALSE, TRUE, FALSE, FALSE)
ON CONFLICT (perfil_id, modulo) DO UPDATE
SET
  pode_criar = EXCLUDED.pode_criar,
  pode_ler = EXCLUDED.pode_ler,
  pode_atualizar = EXCLUDED.pode_atualizar,
  pode_excluir = EXCLUDED.pode_excluir,
  atualizado_em = NOW();

INSERT INTO usuarios (
  id, perfil_id, nome, email, senha_hash, telefone, status, ultimo_login_em
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Administrador do Sistema',
    'admin@sisefratagro.local',
    '$2b$10$ivkri9UpNrBrAP72Zy2mduVzg4F0BlXZT26Dmq3NiXOv352hlNR1q',
    '62999990001',
    'ATIVO',
    NOW() - INTERVAL '2 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Carlos Vendas',
    'vendedor@sisefratagro.local',
    '$2b$10$I7JLhpY39ZYwkoEWBybd9OiQb3oov.OV1g56gKTM.RgclJBYsZE/e',
    '62999990002',
    'ATIVO',
    NOW() - INTERVAL '1 day'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'Marcio Estoque',
    'estoquista@sisefratagro.local',
    '$2b$10$WHvb9EK.y93YYUto2akMp.36j4LGPgazXu8w3POm8eOHmDjO/fUv6',
    '62999990003',
    'ATIVO',
    NOW() - INTERVAL '1 day'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'Mateus Logistica',
    'logistica@sisefratagro.local',
    '$2b$10$AIaQM.HIqOY/.XN1kCrhr.d8q4OCdQNmfZBUlSKlCXzTG4qu3yL6S',
    '62999990004',
    'ATIVO',
    NOW() - INTERVAL '12 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '55555555-5555-5555-5555-555555555555',
    'Fernanda Financeiro',
    'financeiro@sisefratagro.local',
    '$2b$10$FHxGRUdMP5h5oJ4MAP4EhOka3hz7.xMFSCGJCUKBIE9K8HqQOPclK',
    '62999990005',
    'ATIVO',
    NOW() - INTERVAL '6 hours'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '66666666-6666-6666-6666-666666666666',
    'Gabriela Gerencia',
    'gerente@sisefratagro.local',
    '$2b$10$4pamwBox/KWaoBXGOOdswuIAASkAspCJtSTd3FvnnfkH2EW0m3IGm',
    '62999990006',
    'ATIVO',
    NOW() - INTERVAL '3 hours'
  )
ON CONFLICT (email) DO UPDATE
SET
  perfil_id = EXCLUDED.perfil_id,
  nome = EXCLUDED.nome,
  senha_hash = EXCLUDED.senha_hash,
  telefone = EXCLUDED.telefone,
  status = EXCLUDED.status,
  ultimo_login_em = EXCLUDED.ultimo_login_em,
  atualizado_em = NOW();

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
    'Fornecedor padrao de sementes e defensivos.', 'ATIVO'
  ),
  (
    'f0000000-0000-0000-0000-000000000002', 'PJ', 'Transportes Cerrado LTDA', 'Cerrado Log',
    '12345678000102', '564738291', 'operacao@cerradolog.local', '6233010002', 'Roberta Lima',
    '74000001', 'Rua do Transporte', '455', NULL, 'Setor Norte', 'Anapolis', 'GO',
    'Transportadora homologada para entregas terceirizadas.', 'ATIVO'
  ),
  (
    'f0000000-0000-0000-0000-000000000003', 'PJ', 'Oficina Campo Forte LTDA', 'Campo Forte Oficina',
    '12345678000103', '111222333', 'servicos@campoforte.local', '6233010003', 'Joao Batista',
    '74000002', 'Rodovia GO-020', '900', NULL, 'Zona Rural', 'Senador Canedo', 'GO',
    'Prestador de servicos de manutencao de frota.', 'ATIVO'
  )
ON CONFLICT (id) DO UPDATE
SET
  tipo_pessoa = EXCLUDED.tipo_pessoa,
  razao_social = EXCLUDED.razao_social,
  nome_fantasia = EXCLUDED.nome_fantasia,
  cpf_cnpj = EXCLUDED.cpf_cnpj,
  inscricao_estadual = EXCLUDED.inscricao_estadual,
  email = EXCLUDED.email,
  telefone = EXCLUDED.telefone,
  contato_responsavel = EXCLUDED.contato_responsavel,
  cep = EXCLUDED.cep,
  logradouro = EXCLUDED.logradouro,
  numero = EXCLUDED.numero,
  complemento = EXCLUDED.complemento,
  bairro = EXCLUDED.bairro,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado,
  observacoes = EXCLUDED.observacoes,
  status = EXCLUDED.status,
  atualizado_em = NOW();

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
    'Cliente com compras em volume e a prazo.', 'ATIVO'
  ),
  (
    'c0000000-0000-0000-0000-000000000003', 'PF', 'Marcos Antonio Pereira', NULL,
    '12345678901', NULL, 'marcos.pereira@cliente.local', '6234010003', '75600000',
    'Rua das Palmeiras', '85', NULL, 'Setor Sul', 'Mineiros', 'GO', 8000.00,
    'Cliente de pronta entrega.', 'ATIVO'
  )
ON CONFLICT (id) DO UPDATE
SET
  tipo_pessoa = EXCLUDED.tipo_pessoa,
  nome_razao_social = EXCLUDED.nome_razao_social,
  nome_fantasia = EXCLUDED.nome_fantasia,
  cpf_cnpj = EXCLUDED.cpf_cnpj,
  inscricao_estadual = EXCLUDED.inscricao_estadual,
  email = EXCLUDED.email,
  telefone = EXCLUDED.telefone,
  cep = EXCLUDED.cep,
  logradouro = EXCLUDED.logradouro,
  numero = EXCLUDED.numero,
  complemento = EXCLUDED.complemento,
  bairro = EXCLUDED.bairro,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado,
  limite_credito = EXCLUDED.limite_credito,
  observacoes = EXCLUDED.observacoes,
  status = EXCLUDED.status,
  atualizado_em = NOW();

INSERT INTO produtos (
  id, fornecedor_padrao_id, codigo, codigo_barras, referencia_interna, nome, descricao, unidade_medida,
  categoria, preco_custo, preco_venda, peso_kg, estoque_minimo, ponto_reposicao, permite_venda_sem_estoque, status
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0001', '7891000000011', 'SEMENTE-MILHO-20KG', 'Semente de Milho Hibrido 20kg',
    'Semente de milho hibrido para alta produtividade.', 'SACA', 'SEMENTES',
    210.00, 285.00, 20.000, 15.000, 30.000, FALSE, 'ATIVO'
  ),
  (
    '10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0002', '7891000000012', 'FERT-NPK-50KG', 'Fertilizante NPK 04-14-08 50kg',
    'Fertilizante granulado para preparo de solo.', 'SACA', 'FERTILIZANTES',
    145.00, 198.00, 50.000, 20.000, 40.000, FALSE, 'ATIVO'
  ),
  (
    '10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
    'PROD-0003', '7891000000013', 'HERB-GLI-20L', 'Herbicida Glifosato 20L',
    'Herbicida sistemico para controle pos-emergente.', 'UN', 'DEFENSIVOS',
    320.00, 429.90, 22.000, 10.000, 25.000, FALSE, 'ATIVO'
  )
ON CONFLICT (id) DO UPDATE
SET
  fornecedor_padrao_id = EXCLUDED.fornecedor_padrao_id,
  codigo = EXCLUDED.codigo,
  codigo_barras = EXCLUDED.codigo_barras,
  referencia_interna = EXCLUDED.referencia_interna,
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  unidade_medida = EXCLUDED.unidade_medida,
  categoria = EXCLUDED.categoria,
  preco_custo = EXCLUDED.preco_custo,
  preco_venda = EXCLUDED.preco_venda,
  peso_kg = EXCLUDED.peso_kg,
  estoque_minimo = EXCLUDED.estoque_minimo,
  ponto_reposicao = EXCLUDED.ponto_reposicao,
  permite_venda_sem_estoque = EXCLUDED.permite_venda_sem_estoque,
  status = EXCLUDED.status,
  atualizado_em = NOW();

INSERT INTO locais_estoque (
  id, nome, codigo, descricao, tipo_local, endereco_referencia, status
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001', 'Deposito Central', 'DEP-CENTRAL',
    'Armazenamento principal de mercadorias.', 'DEPOSITO', 'Matriz - Goiania', 'ATIVO'
  ),
  (
    '20000000-0000-0000-0000-000000000002', 'Filial Rio Verde', 'FIL-RIOVERDE',
    'Estoque da unidade de Rio Verde.', 'FILIAL', 'Unidade Rio Verde', 'ATIVO'
  ),
  (
    '20000000-0000-0000-0000-000000000003', 'Prateleira A1', 'PRAT-A1',
    'Area de picking de itens leves.', 'PRATELEIRA', 'Deposito Central - Corredor A', 'ATIVO'
  )
ON CONFLICT (id) DO UPDATE
SET
  nome = EXCLUDED.nome,
  codigo = EXCLUDED.codigo,
  descricao = EXCLUDED.descricao,
  tipo_local = EXCLUDED.tipo_local,
  endereco_referencia = EXCLUDED.endereco_referencia,
  status = EXCLUDED.status,
  atualizado_em = NOW();

INSERT INTO estoques (
  id, produto_id, local_estoque_id, quantidade, reservado
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', 80.000, 5.000
  ),
  (
    '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001', 60.000, 0.000
  ),
  (
    '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002', 25.000, 2.000
  )
ON CONFLICT (id) DO UPDATE
SET
  produto_id = EXCLUDED.produto_id,
  local_estoque_id = EXCLUDED.local_estoque_id,
  quantidade = EXCLUDED.quantidade,
  reservado = EXCLUDED.reservado,
  atualizado_em = NOW();

INSERT INTO veiculos (
  id, placa, modelo, marca, ano_fabricacao, tipo_veiculo, capacidade_carga_kg,
  quilometragem_atual, responsavel_usuario_id, status
)
VALUES
  (
    '40000000-0000-0000-0000-000000000001', 'ABC1D23', 'Delivery 9.170', 'Volkswagen',
    2022, 'CAMINHAO', 5000.000, 45200.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ATIVO'
  ),
  (
    '40000000-0000-0000-0000-000000000002', 'EFG4H56', 'Master Furgao', 'Renault',
    2021, 'VAN', 1600.000, 37850.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ATIVO'
  )
ON CONFLICT (id) DO UPDATE
SET
  placa = EXCLUDED.placa,
  modelo = EXCLUDED.modelo,
  marca = EXCLUDED.marca,
  ano_fabricacao = EXCLUDED.ano_fabricacao,
  tipo_veiculo = EXCLUDED.tipo_veiculo,
  capacidade_carga_kg = EXCLUDED.capacidade_carga_kg,
  quilometragem_atual = EXCLUDED.quilometragem_atual,
  responsavel_usuario_id = EXCLUDED.responsavel_usuario_id,
  status = EXCLUDED.status,
  atualizado_em = NOW();

INSERT INTO manutencoes (
  id, veiculo_id, fornecedor_id, tipo_manutencao, descricao, data_manutencao,
  proxima_manutencao_data, proxima_manutencao_km, quilometragem_registrada, custo, status
)
VALUES
  (
    '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000003', 'PREVENTIVA', 'Troca de oleo, filtros e revisao geral.',
    CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '160 days', 50000.0, 44800.0, 1450.00, 'CONCLUIDA'
  )
ON CONFLICT (id) DO UPDATE
SET
  veiculo_id = EXCLUDED.veiculo_id,
  fornecedor_id = EXCLUDED.fornecedor_id,
  tipo_manutencao = EXCLUDED.tipo_manutencao,
  descricao = EXCLUDED.descricao,
  data_manutencao = EXCLUDED.data_manutencao,
  proxima_manutencao_data = EXCLUDED.proxima_manutencao_data,
  proxima_manutencao_km = EXCLUDED.proxima_manutencao_km,
  quilometragem_registrada = EXCLUDED.quilometragem_registrada,
  custo = EXCLUDED.custo,
  status = EXCLUDED.status,
  atualizado_em = NOW();

INSERT INTO tabelas_frete (
  id, nome, tipo_calculo, regiao, peso_minimo, peso_maximo, distancia_minima,
  distancia_maxima, valor_base, valor_por_kg, valor_por_km, valor_fixo, status, observacao
)
VALUES
  (
    '60000000-0000-0000-0000-000000000001', 'Tabela Centro-Sul', 'POR_REGIAO', 'Rio Verde/GO',
    0.000, 5000.000, 0.00, 300.00, 120.00, 0.0000, 0.4500, 0.00, 'ATIVA',
    'Tabela principal para rotas de entrega propria na regiao Centro-Sul.'
  ),
  (
    '60000000-0000-0000-0000-000000000002', 'Tabela Jatai Terceirizada', 'POR_DISTANCIA', 'Jatai/GO',
    0.000, 10000.000, 0.00, 500.00, 0.00, 0.0000, 0.0000, 340.00, 'ATIVA',
    'Tabela utilizada para operacoes terceirizadas com valor fixo de referencia.'
  )
ON CONFLICT (id) DO UPDATE
SET
  nome = EXCLUDED.nome,
  tipo_calculo = EXCLUDED.tipo_calculo,
  regiao = EXCLUDED.regiao,
  peso_minimo = EXCLUDED.peso_minimo,
  peso_maximo = EXCLUDED.peso_maximo,
  distancia_minima = EXCLUDED.distancia_minima,
  distancia_maxima = EXCLUDED.distancia_maxima,
  valor_base = EXCLUDED.valor_base,
  valor_por_kg = EXCLUDED.valor_por_kg,
  valor_por_km = EXCLUDED.valor_por_km,
  valor_fixo = EXCLUDED.valor_fixo,
  status = EXCLUDED.status,
  observacao = EXCLUDED.observacao,
  atualizado_em = NOW();

INSERT INTO vendas (
  id, numero, cliente_id, vendedor_id, tipo_venda, status, forma_pagamento, condicao_pagamento,
  data_venda, data_faturamento, data_entrega_prevista, subtotal, desconto_valor, frete_valor, total_valor, observacoes
)
VALUES
  (
    '70000000-0000-0000-0000-000000000001', 'VEN-2026-0001', 'c0000000-0000-0000-0000-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'NORMAL', 'CONFIRMADA', 'A_PRAZO', '30/60 dias',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', CURRENT_DATE + INTERVAL '2 days',
    2850.00, 150.00, 220.00, 2920.00, 'Venda com entrega agendada.'
  ),
  (
    '70000000-0000-0000-0000-000000000002', 'VEN-2026-0002', 'c0000000-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DIRETA', 'FATURADA', 'PIX', 'Pagamento imediato',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', CURRENT_DATE,
    429.90, 0.00, 0.00, 429.90, 'Venda de balcao.'
  ),
  (
    '70000000-0000-0000-0000-000000000003', 'VEN-2026-0003', 'c0000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'FUTURA', 'PENDENTE', 'A_PRAZO', '45 dias',
    NOW(), NULL, CURRENT_DATE + INTERVAL '15 days',
    3960.00, 160.00, 340.00, 4140.00, 'Venda futura para entrega programada.'
  )
ON CONFLICT (id) DO UPDATE
SET
  numero = EXCLUDED.numero,
  cliente_id = EXCLUDED.cliente_id,
  vendedor_id = EXCLUDED.vendedor_id,
  tipo_venda = EXCLUDED.tipo_venda,
  status = EXCLUDED.status,
  forma_pagamento = EXCLUDED.forma_pagamento,
  condicao_pagamento = EXCLUDED.condicao_pagamento,
  data_venda = EXCLUDED.data_venda,
  data_faturamento = EXCLUDED.data_faturamento,
  data_entrega_prevista = EXCLUDED.data_entrega_prevista,
  subtotal = EXCLUDED.subtotal,
  desconto_valor = EXCLUDED.desconto_valor,
  frete_valor = EXCLUDED.frete_valor,
  total_valor = EXCLUDED.total_valor,
  observacoes = EXCLUDED.observacoes,
  atualizado_em = NOW();

INSERT INTO itens_venda (
  id, venda_id, produto_id, local_estoque_id, sequencia, quantidade, preco_unitario, desconto_valor, total_valor
)
VALUES
  (
    '80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
    1, 10.000, 285.00, 150.00, 2700.00
  ),
  (
    '80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
    2, 1.000, 150.00, 0.00, 150.00
  ),
  (
    '80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002',
    1, 1.000, 429.90, 0.00, 429.90
  ),
  (
    '80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
    1, 20.000, 198.00, 160.00, 3800.00
  )
ON CONFLICT (id) DO UPDATE
SET
  venda_id = EXCLUDED.venda_id,
  produto_id = EXCLUDED.produto_id,
  local_estoque_id = EXCLUDED.local_estoque_id,
  sequencia = EXCLUDED.sequencia,
  quantidade = EXCLUDED.quantidade,
  preco_unitario = EXCLUDED.preco_unitario,
  desconto_valor = EXCLUDED.desconto_valor,
  total_valor = EXCLUDED.total_valor,
  atualizado_em = NOW();

INSERT INTO fretes (
  id, venda_id, modalidade, tipo_calculo, regiao_destino, peso_total_kg, distancia_km,
  valor_estimado, valor_real, veiculo_id, transportadora_fornecedor_id, observacoes, status, tabela_frete_id
)
VALUES
  (
    '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001',
    'PROPRIO', 'POR_DISTANCIA', 'Rio Verde/GO', 250.000, 230.00,
    220.00, NULL, '40000000-0000-0000-0000-000000000001', NULL, 'Entrega com frota propria.',
    'VINCULADO', '60000000-0000-0000-0000-000000000001'
  ),
  (
    '90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003',
    'TERCEIRO', 'POR_REGIAO', 'Jatai/GO', 1000.000, 320.00,
    340.00, NULL, NULL, 'f0000000-0000-0000-0000-000000000002', 'Entrega futura via transportadora.',
    'CALCULADO', '60000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO UPDATE
SET
  venda_id = EXCLUDED.venda_id,
  modalidade = EXCLUDED.modalidade,
  tipo_calculo = EXCLUDED.tipo_calculo,
  regiao_destino = EXCLUDED.regiao_destino,
  peso_total_kg = EXCLUDED.peso_total_kg,
  distancia_km = EXCLUDED.distancia_km,
  valor_estimado = EXCLUDED.valor_estimado,
  valor_real = EXCLUDED.valor_real,
  veiculo_id = EXCLUDED.veiculo_id,
  transportadora_fornecedor_id = EXCLUDED.transportadora_fornecedor_id,
  observacoes = EXCLUDED.observacoes,
  status = EXCLUDED.status,
  tabela_frete_id = EXCLUDED.tabela_frete_id,
  atualizado_em = NOW();

INSERT INTO entregas (
  id, venda_id, frete_id, responsavel_usuario_id, status, data_saida,
  data_entrega_realizada, tentativa_atual, comprovante_recebimento, observacoes
)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'EM_TRANSITO',
    NOW() - INTERVAL '1 day', NULL, 1, NULL, 'Motorista em rota de entrega.'
  ),
  (
    'a1000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000002', NULL, 'AGUARDANDO_DESPACHO',
    NULL, NULL, 0, NULL, 'Separacao aguardando data de expedicao.'
  )
ON CONFLICT (id) DO UPDATE
SET
  venda_id = EXCLUDED.venda_id,
  frete_id = EXCLUDED.frete_id,
  responsavel_usuario_id = EXCLUDED.responsavel_usuario_id,
  status = EXCLUDED.status,
  data_saida = EXCLUDED.data_saida,
  data_entrega_realizada = EXCLUDED.data_entrega_realizada,
  tentativa_atual = EXCLUDED.tentativa_atual,
  comprovante_recebimento = EXCLUDED.comprovante_recebimento,
  observacoes = EXCLUDED.observacoes,
  atualizado_em = NOW();

INSERT INTO historico_entregas (
  id, entrega_id, status, data_evento, observacao, usuario_id
)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
    'AGUARDANDO_DESPACHO', NOW() - INTERVAL '2 days', 'Pedido separado e aguardando liberacao.', 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ),
  (
    'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
    'EM_TRANSITO', NOW() - INTERVAL '1 day', 'Carga expedida para o cliente.', 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ),
  (
    'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
    'AGUARDANDO_DESPACHO', NOW(), 'Venda futura registrada e entrega ainda nao liberada.', 'ffffffff-ffff-ffff-ffff-ffffffffffff'
  )
ON CONFLICT (id) DO UPDATE
SET
  entrega_id = EXCLUDED.entrega_id,
  status = EXCLUDED.status,
  data_evento = EXCLUDED.data_evento,
  observacao = EXCLUDED.observacao,
  usuario_id = EXCLUDED.usuario_id;

INSERT INTO duplicatas (
  id, venda_id, cliente_id, numero, parcela, valor_total, valor_aberto, vencimento, data_emissao, status, observacoes
)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', 'DUP-2026-0001-01', 1, 1460.00, 0.00,
    CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days', 'PAGO',
    'Primeira parcela da venda VEN-2026-0001.'
  ),
  (
    'c1000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001', 'DUP-2026-0001-02', 2, 1460.00, 1460.00,
    CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE - INTERVAL '10 days', 'EM_ABERTO',
    'Segunda parcela da venda VEN-2026-0001.'
  ),
  (
    'c1000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002', 'DUP-2026-0003-01', 1, 4140.00, 4140.00,
    CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE, 'EM_ABERTO',
    'Duplicata gerada para venda futura.'
  )
ON CONFLICT (id) DO UPDATE
SET
  venda_id = EXCLUDED.venda_id,
  cliente_id = EXCLUDED.cliente_id,
  numero = EXCLUDED.numero,
  parcela = EXCLUDED.parcela,
  valor_total = EXCLUDED.valor_total,
  valor_aberto = EXCLUDED.valor_aberto,
  vencimento = EXCLUDED.vencimento,
  data_emissao = EXCLUDED.data_emissao,
  status = EXCLUDED.status,
  observacoes = EXCLUDED.observacoes,
  atualizado_em = NOW();

INSERT INTO pagamentos (
  id, duplicata_id, recebido_por_usuario_id, forma_pagamento, valor, data_pagamento, referencia_externa, observacoes
)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'PIX', 1460.00, NOW() - INTERVAL '5 days',
    'PIX-E2E-0001', 'Pagamento integral recebido via PIX.'
  )
ON CONFLICT (id) DO UPDATE
SET
  duplicata_id = EXCLUDED.duplicata_id,
  recebido_por_usuario_id = EXCLUDED.recebido_por_usuario_id,
  forma_pagamento = EXCLUDED.forma_pagamento,
  valor = EXCLUDED.valor,
  data_pagamento = EXCLUDED.data_pagamento,
  referencia_externa = EXCLUDED.referencia_externa,
  observacoes = EXCLUDED.observacoes;

INSERT INTO movimentacoes_estoque (
  id, produto_id, local_origem_id, local_destino_id, usuario_id, venda_id,
  tipo_movimentacao, quantidade, motivo, observacoes, data_movimentacao
)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
    NULL, '20000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL,
    'ENTRADA', 80.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '30 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
    NULL, '20000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL,
    'ENTRADA', 60.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '28 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
    NULL, '20000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL,
    'ENTRADA', 25.000, 'COMPRA', 'Entrada inicial para composicao de estoque.', NOW() - INTERVAL '25 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '70000000-0000-0000-0000-000000000001',
    'SAIDA', 10.000, 'VENDA', 'Baixa referente a VEN-2026-0001.', NOW() - INTERVAL '9 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002', NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '70000000-0000-0000-0000-000000000002',
    'SAIDA', 1.000, 'VENDA', 'Baixa referente a VEN-2026-0002.', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE
SET
  produto_id = EXCLUDED.produto_id,
  local_origem_id = EXCLUDED.local_origem_id,
  local_destino_id = EXCLUDED.local_destino_id,
  usuario_id = EXCLUDED.usuario_id,
  venda_id = EXCLUDED.venda_id,
  tipo_movimentacao = EXCLUDED.tipo_movimentacao,
  quantidade = EXCLUDED.quantidade,
  motivo = EXCLUDED.motivo,
  observacoes = EXCLUDED.observacoes,
  data_movimentacao = EXCLUDED.data_movimentacao;

INSERT INTO notificacoes (
  id, usuario_id, tipo, titulo, mensagem, prioridade, status, entidade, entidade_id, metadata, lida_em
)
VALUES
  (
    'f1000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ENTREGA_CONCLUIDA', 'Entrega em andamento', 'A venda VEN-2026-0001 esta em transito para o cliente.',
    'MEDIA', 'NAO_LIDA', 'entregas', 'a1000000-0000-0000-0000-000000000001',
    '{"vendaNumero":"VEN-2026-0001","statusEntrega":"EM_TRANSITO"}'::jsonb, NULL
  ),
  (
    'f1000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'ESTOQUE_BAIXO', 'Alerta de estoque minimo', 'O produto HERB-GLI-20L esta proximo do estoque minimo.',
    'ALTA', 'NAO_LIDA', 'produtos', '10000000-0000-0000-0000-000000000003',
    '{"produtoCodigo":"PROD-0003","saldoAtual":25.000,"estoqueMinimo":10.000}'::jsonb, NULL
  ),
  (
    'f1000000-0000-0000-0000-000000000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'DUPLICATA_VENCENDO', 'Duplicata proxima do vencimento', 'A duplicata DUP-2026-0001-02 vence em 50 dias.',
    'MEDIA', 'NAO_LIDA', 'duplicatas', 'c1000000-0000-0000-0000-000000000002',
    '{"duplicataNumero":"DUP-2026-0001-02","valorAberto":1460.00}'::jsonb, NULL
  ),
  (
    'f1000000-0000-0000-0000-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'VENDA_FUTURA_PROXIMA', 'Venda futura acompanhada', 'A venda VEN-2026-0003 permanece pendente e requer acompanhamento.',
    'MEDIA', 'LIDA', 'vendas', '70000000-0000-0000-0000-000000000003',
    '{"vendaNumero":"VEN-2026-0003","tipoVenda":"FUTURA"}'::jsonb, NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO UPDATE
SET
  usuario_id = EXCLUDED.usuario_id,
  tipo = EXCLUDED.tipo,
  titulo = EXCLUDED.titulo,
  mensagem = EXCLUDED.mensagem,
  prioridade = EXCLUDED.prioridade,
  status = EXCLUDED.status,
  entidade = EXCLUDED.entidade,
  entidade_id = EXCLUDED.entidade_id,
  metadata = EXCLUDED.metadata,
  lida_em = EXCLUDED.lida_em,
  atualizado_em = NOW();

INSERT INTO logs_auditoria (
  id, usuario_id, tabela_nome, registro_id, acao, descricao, dados_anteriores, dados_novos, ip_origem, user_agent, criado_em
)
VALUES
  (
    '01000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'usuarios',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'LOGIN', 'Login administrativo realizado durante a carga de ambiente.',
    NULL, '{"status":"ATIVO","evento":"login"}'::jsonb, '127.0.0.1', 'seed-script', NOW() - INTERVAL '1 day'
  ),
  (
    '01000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vendas',
    '70000000-0000-0000-0000-000000000003', 'INSERT', 'Registro inicial de venda futura para homologacao.',
    NULL, '{"numero":"VEN-2026-0003","tipo_venda":"FUTURA","status":"PENDENTE"}'::jsonb, '127.0.0.1', 'seed-script', NOW()
  ),
  (
    '01000000-0000-0000-0000-000000000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pagamentos',
    'd1000000-0000-0000-0000-000000000001', 'PAYMENT_REGISTER', 'Pagamento seed registrado para testes financeiros.',
    NULL, '{"duplicata":"DUP-2026-0001-01","valor":1460.00,"forma_pagamento":"PIX"}'::jsonb, '127.0.0.1', 'seed-script', NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO UPDATE
SET
  usuario_id = EXCLUDED.usuario_id,
  tabela_nome = EXCLUDED.tabela_nome,
  registro_id = EXCLUDED.registro_id,
  acao = EXCLUDED.acao,
  descricao = EXCLUDED.descricao,
  dados_anteriores = EXCLUDED.dados_anteriores,
  dados_novos = EXCLUDED.dados_novos,
  ip_origem = EXCLUDED.ip_origem,
  user_agent = EXCLUDED.user_agent,
  criado_em = EXCLUDED.criado_em;

COMMIT;
```

## Compatibilidade com login JWT + bcrypt

- O backend valida login por `email` e `bcrypt.compare(password, senha_hash)`.
- As senhas do seed foram armazenadas como hash bcrypt valido com custo `10`.
- Os hashes gravados usam prefixo `$2b$`, compativel com a biblioteca `bcrypt` do Node.js usada pelo projeto.
- Os usuarios de teste foram semeados com `status = 'ATIVO'`, requisito necessario para autenticacao bem-sucedida.
- O JWT sera emitido normalmente apos login, porque a autenticacao depende apenas de usuario ativo, email localizado e senha compatível com bcrypt.

## Credenciais de acesso para teste

- Administrador
  - email: `admin@sisefratagro.local`
  - senha: `Adm@12345`
  - observacao: armazenada no banco como hash bcrypt
- Vendedor
  - email: `vendedor@sisefratagro.local`
  - senha: `Vend@12345`
  - observacao: armazenada no banco como hash bcrypt
- Estoquista
  - email: `estoquista@sisefratagro.local`
  - senha: `Estq@12345`
  - observacao: armazenada no banco como hash bcrypt
- Motorista / Logística
  - email: `logistica@sisefratagro.local`
  - senha: `Log@12345`
  - observacao: armazenada no banco como hash bcrypt
- Financeiro
  - email: `financeiro@sisefratagro.local`
  - senha: `Fin@12345`
  - observacao: armazenada no banco como hash bcrypt
- Gerente
  - email: `gerente@sisefratagro.local`
  - senha: `Ger@12345`
  - observacao: armazenada no banco como hash bcrypt

## Fechamento

O ambiente revisado agora atende os requisitos centrais deste prompt:

- `migrations.sql` revisado com correcoes estruturais relevantes
- `seeders.sql` revisado e executavel
- 1 usuario funcional por perfil do SRS
- credenciais de acesso claras
- compatibilidade com login real por `JWT + bcrypt`
- consolidacao final em um unico documento markdown
