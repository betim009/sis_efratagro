const { query } = require("../config/database");

const supplierSelect = `
  SELECT
    id,
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

const getFornecedorHistoricoCompras = async (fornecedorId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_produtos_vinculados,
        COUNT(*) FILTER (WHERE status = 'ATIVO')::integer AS total_produtos_ativos,
        MAX(atualizado_em) AS ultimo_produto_atualizado_em
      FROM produtos
      WHERE fornecedor_padrao_id = $1
    `,
    [fornecedorId]
  );

  const relatedProductsResult = await query(
    `
      SELECT
        id,
        codigo,
        nome,
        categoria,
        preco_custo,
        preco_venda,
        status,
        atualizado_em AS updated_at
      FROM produtos
      WHERE fornecedor_padrao_id = $1
      ORDER BY nome ASC
      LIMIT 20
    `,
    [fornecedorId]
  );

  return {
    summary: summaryResult.rows[0],
    relatedProducts: relatedProductsResult.rows
  };
};

module.exports = {
  createFornecedor,
  findFornecedorById,
  findFornecedorByDocument,
  listFornecedores,
  countFornecedores,
  updateFornecedor,
  inactivateFornecedor,
  getFornecedorHistoricoCompras
};
