const { query } = require("../config/database");

const supplierSelect = `
  SELECT
    id,
    public_id,
    tipo_pessoa,
    razao_social,
    nome_fantasia,
    cpf_cnpj,
    inscricao_estadual,
    email,
    telefone,
    contato_responsavel,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    observacoes,
    status,
    criado_em AS created_at,
    atualizado_em AS updated_at
  FROM fornecedores
`;

const createFornecedor = async (payload) => {
  const result = await query(
    `
      INSERT INTO fornecedores (
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING
        id,
        public_id,
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.tipoPessoa,
      payload.razaoSocial,
      payload.nomeFantasia,
      payload.cnpjCpf,
      payload.inscricaoEstadual,
      payload.email,
      payload.telefone,
      payload.contatoResponsavel,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.observacoes,
      payload.status
    ]
  );

  return result.rows[0];
};

const findFornecedorById = async (fornecedorId) => {
  const result = await query(
    `
      ${supplierSelect}
      WHERE id = $1
      LIMIT 1
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const findFornecedorByPublicId = async (publicId) => {
  const result = await query(
    `
      ${supplierSelect}
      WHERE public_id = $1
      LIMIT 1
    `,
    [publicId]
  );

  return result.rows[0] || null;
};

const findFornecedorByIdentifier = async (identifier) => {
  if (identifier === undefined || identifier === null || identifier === "") {
    return null;
  }

  const raw = String(identifier).trim();

  if (/^\d+$/.test(raw)) {
    return findFornecedorByPublicId(Number(raw));
  }

  return findFornecedorById(raw);
};

const findFornecedorByDocument = async (cnpjCpf, excludeId = null) => {
  const result = await query(
    `
      SELECT id, cpf_cnpj
      FROM fornecedores
      WHERE cpf_cnpj = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [cnpjCpf, excludeId]
  );

  return result.rows[0] || null;
};

const listFornecedores = async ({ status, search, limit, offset }) => {
  const result = await query(
    `
      ${supplierSelect}
      WHERE ($1::varchar IS NULL OR status = $1)
        AND (
          $2::varchar IS NULL
          OR razao_social ILIKE '%' || $2 || '%'
          OR COALESCE(nome_fantasia, '') ILIKE '%' || $2 || '%'
          OR cpf_cnpj ILIKE '%' || $2 || '%'
        )
      ORDER BY razao_social ASC
      LIMIT $3 OFFSET $4
    `,
    [status, search, limit, offset]
  );

  return result.rows;
};

const countFornecedores = async ({ status, search }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM fornecedores
      WHERE ($1::varchar IS NULL OR status = $1)
        AND (
          $2::varchar IS NULL
          OR razao_social ILIKE '%' || $2 || '%'
          OR COALESCE(nome_fantasia, '') ILIKE '%' || $2 || '%'
          OR cpf_cnpj ILIKE '%' || $2 || '%'
        )
    `,
    [status, search]
  );

  return result.rows[0].total;
};

const updateFornecedor = async (fornecedorId, payload) => {
  const result = await query(
    `
      UPDATE fornecedores
      SET
        tipo_pessoa = $2,
        razao_social = $3,
        nome_fantasia = $4,
        cpf_cnpj = $5,
        inscricao_estadual = $6,
        email = $7,
        telefone = $8,
        contato_responsavel = $9,
        cep = $10,
        logradouro = $11,
        numero = $12,
        complemento = $13,
        bairro = $14,
        cidade = $15,
        estado = $16,
        observacoes = $17,
        status = $18,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        public_id,
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      fornecedorId,
      payload.tipoPessoa,
      payload.razaoSocial,
      payload.nomeFantasia,
      payload.cnpjCpf,
      payload.inscricaoEstadual,
      payload.email,
      payload.telefone,
      payload.contatoResponsavel,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.observacoes,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const inactivateFornecedor = async (fornecedorId) => {
  const result = await query(
    `
      UPDATE fornecedores
      SET status = 'INATIVO', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        public_id,
        tipo_pessoa,
        razao_social,
        nome_fantasia,
        cpf_cnpj,
        inscricao_estadual,
        email,
        telefone,
        contato_responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const deleteFornecedor = async (fornecedorId) => {
  const result = await query(
    `
      DELETE FROM fornecedores
      WHERE id = $1
      RETURNING id, public_id, razao_social, cpf_cnpj, status
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const getFornecedorHistoricoCompras = async (fornecedorId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_compras,
        COALESCE(SUM(valor_total), 0)::numeric AS valor_total_compras,
        COALESCE(SUM(quantidade), 0)::numeric AS quantidade_total_comprada,
        MAX(data_movimentacao) AS ultima_compra_em
      FROM movimentacoes_estoque
      WHERE fornecedor_id = $1
        AND tipo_movimentacao = 'ENTRADA'
    `,
    [fornecedorId]
  );

  const purchasesResult = await query(
    `
      SELECT
        m.id,
        m.public_id,
        m.produto_id,
        p.public_id AS produto_public_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        m.local_destino_id,
        l.public_id AS local_destino_public_id,
        l.nome AS local_destino_nome,
        m.quantidade,
        m.custo_unitario,
        m.valor_total,
        m.motivo,
        m.observacoes,
        m.usuario_id,
        u.nome AS usuario_nome,
        m.data_movimentacao
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      INNER JOIN locais_estoque l ON l.id = m.local_destino_id
      INNER JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.fornecedor_id = $1
        AND m.tipo_movimentacao = 'ENTRADA'
      ORDER BY m.data_movimentacao DESC
      LIMIT 100
    `,
    [fornecedorId]
  );

  const relatedProductsResult = await query(
    `
      SELECT DISTINCT
        p.id,
        p.public_id,
        p.codigo,
        p.nome,
        p.categoria,
        p.preco_custo,
        p.preco_venda,
        p.status,
        p.fornecedor_padrao_id = $1 AS fornecedor_principal,
        p.atualizado_em AS updated_at
      FROM produtos p
      LEFT JOIN produtos_fornecedores pf ON pf.produto_id = p.id
      LEFT JOIN movimentacoes_estoque m ON m.produto_id = p.id
      WHERE p.fornecedor_padrao_id = $1
         OR pf.fornecedor_id = $1
         OR m.fornecedor_id = $1
      ORDER BY nome ASC
      LIMIT 100
    `,
    [fornecedorId]
  );

  return {
    summary: summaryResult.rows[0],
    purchases: purchasesResult.rows,
    relatedProducts: relatedProductsResult.rows
  };
};

const getProdutosByFornecedor = async (fornecedorId) => {
  const result = await query(
    `
      SELECT DISTINCT
        p.id,
        p.public_id,
        p.codigo,
        p.nome,
        p.categoria,
        p.preco_custo,
        p.preco_venda,
        p.status,
        CASE
          WHEN p.fornecedor_padrao_id = $1 THEN TRUE
          ELSE COALESCE(pf.principal, FALSE)
        END AS fornecedor_principal,
        COALESCE(pf.status, p.status) AS vinculo_status
      FROM produtos p
      LEFT JOIN produtos_fornecedores pf
        ON pf.produto_id = p.id
       AND pf.fornecedor_id = $1
      WHERE p.fornecedor_padrao_id = $1
         OR pf.fornecedor_id = $1
      ORDER BY p.nome ASC
    `,
    [fornecedorId]
  );

  return result.rows;
};

const hasFornecedorHistorico = async (fornecedorId) => {
  const result = await query(
    `
      SELECT EXISTS (
        SELECT 1 FROM movimentacoes_estoque WHERE fornecedor_id = $1
        UNION
        SELECT 1 FROM produtos WHERE fornecedor_padrao_id = $1
        UNION
        SELECT 1 FROM produtos_fornecedores WHERE fornecedor_id = $1
      ) AS has_history
    `,
    [fornecedorId]
  );

  return result.rows[0].has_history;
};

module.exports = {
  createFornecedor,
  findFornecedorById,
  findFornecedorByPublicId,
  findFornecedorByIdentifier,
  findFornecedorByDocument,
  listFornecedores,
  countFornecedores,
  updateFornecedor,
  inactivateFornecedor,
  deleteFornecedor,
  getFornecedorHistoricoCompras,
  getProdutosByFornecedor,
  hasFornecedorHistorico
};
