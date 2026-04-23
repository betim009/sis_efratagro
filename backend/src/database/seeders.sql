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
  ('11111111-1111-1111-1111-111111111111', 'compras', TRUE, TRUE, TRUE, TRUE),
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
  ('33333333-3333-3333-3333-333333333333', 'compras', TRUE, TRUE, FALSE, FALSE),
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
  ('55555555-5555-5555-5555-555555555555', 'compras', FALSE, TRUE, FALSE, FALSE),
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
  ('66666666-6666-6666-6666-666666666666', 'compras', FALSE, TRUE, FALSE, FALSE),
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
