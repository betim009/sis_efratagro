const { query } = require("../config/database");

const listByProduto = async (produtoId) => {
  const result = await query(
    `
      SELECT
        pf.id,
        pf.public_id,
        pf.produto_id,
        pf.fornecedor_id,
        f.razao_social AS fornecedor_razao_social,
        f.cpf_cnpj AS fornecedor_cpf_cnpj,
        f.status AS fornecedor_status,
        pf.principal,
        pf.status,
        pf.criado_em AS created_at,
        pf.atualizado_em AS updated_at
      FROM produtos_fornecedores pf
      INNER JOIN fornecedores f ON f.id = pf.fornecedor_id
      WHERE pf.produto_id = $1
      ORDER BY pf.principal DESC, f.razao_social ASC
    `,
    [produtoId]
  );

  return result.rows;
};

const listByFornecedor = async (fornecedorId) => {
  const result = await query(
    `
      SELECT
        pf.id,
        pf.public_id,
        pf.produto_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        p.status AS produto_status,
        pf.fornecedor_id,
        pf.principal,
        pf.status,
        pf.criado_em AS created_at,
        pf.atualizado_em AS updated_at
      FROM produtos_fornecedores pf
      INNER JOIN produtos p ON p.id = pf.produto_id
      WHERE pf.fornecedor_id = $1
      ORDER BY pf.principal DESC, p.nome ASC
    `,
    [fornecedorId]
  );

  return result.rows;
};

const getFornecedorPrincipalByProduto = async (produtoId) => {
  const result = await query(
    `
      SELECT
        p.id AS produto_id,
        p.public_id AS produto_public_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        f.id AS fornecedor_id,
        f.public_id AS fornecedor_public_id,
        f.razao_social AS fornecedor_razao_social,
        f.cpf_cnpj AS fornecedor_cpf_cnpj,
        f.status AS fornecedor_status
      FROM produtos p
      LEFT JOIN fornecedores f ON f.id = p.fornecedor_padrao_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [produtoId]
  );

  return result.rows[0] || null;
};

module.exports = {
  listByProduto,
  listByFornecedor,
  getFornecedorPrincipalByProduto
};
