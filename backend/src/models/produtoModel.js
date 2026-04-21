const { query } = require("../config/database");

const productSelect = `
  SELECT
    p.id,
    p.public_id,
    p.fornecedor_padrao_id,
    p.codigo,
    p.codigo_barras,
    p.referencia_interna,
    p.nome,
    p.descricao,
    p.unidade_medida,
    p.categoria,
    p.preco_custo,
    p.preco_venda,
    p.peso_kg,
    p.estoque_minimo,
    p.ponto_reposicao,
    p.permite_venda_sem_estoque,
    p.status,
    p.criado_em AS created_at,
    p.atualizado_em AS updated_at,
    f.razao_social AS fornecedor_padrao_razao_social
  FROM produtos p
  LEFT JOIN fornecedores f ON f.id = p.fornecedor_padrao_id
`;

const createProduto = async (payload) => {
  const result = await query(
    `
      INSERT INTO produtos (
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING
        id,
        public_id,
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.fornecedorPadraoId,
      payload.codigo,
      payload.codigoBarras,
      payload.referenciaInterna,
      payload.nome,
      payload.descricao,
      payload.unidadeMedida,
      payload.categoria,
      payload.precoCusto,
      payload.precoVenda,
      payload.peso,
      payload.estoqueMinimo,
      payload.pontoReposicao,
      payload.permiteVendaSemEstoque,
      payload.status
    ]
  );

  return result.rows[0];
};

const findProdutoById = async (produtoId) => {
  const result = await query(
    `
      ${productSelect}
      WHERE p.id = $1
      LIMIT 1
    `,
    [produtoId]
  );

  return result.rows[0] || null;
};

const findProdutoByPublicId = async (publicId) => {
  const result = await query(
    `
      ${productSelect}
      WHERE p.public_id = $1
      LIMIT 1
    `,
    [publicId]
  );

  return result.rows[0] || null;
};

const findProdutoByIdentifier = async (identifier) => {
  if (identifier === undefined || identifier === null || identifier === "") {
    return null;
  }

  const raw = String(identifier).trim();

  if (/^\d+$/.test(raw)) {
    return findProdutoByPublicId(Number(raw));
  }

  return findProdutoById(raw);
};

const findProdutoByCodigo = async (codigo, excludeId = null) => {
  const result = await query(
    `
      SELECT id, codigo
      FROM produtos
      WHERE codigo = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [codigo, excludeId]
  );

  return result.rows[0] || null;
};

const findProdutoByCodigoBarras = async (codigoBarras, excludeId = null) => {
  if (!codigoBarras) {
    return null;
  }

  const result = await query(
    `
      SELECT id, codigo_barras
      FROM produtos
      WHERE codigo_barras = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [codigoBarras, excludeId]
  );

  return result.rows[0] || null;
};

const findFornecedorById = async (fornecedorId) => {
  if (!fornecedorId) {
    return null;
  }

  const result = await query(
    `
      SELECT id, razao_social, status
      FROM fornecedores
      WHERE id = $1
      LIMIT 1
    `,
    [fornecedorId]
  );

  return result.rows[0] || null;
};

const listProdutos = async ({
  status,
  categoria,
  search,
  limit,
  offset,
  includeInactive
}) => {
  const result = await query(
    `
      ${productSelect}
      WHERE (
        (
          $1::varchar IS NOT NULL AND p.status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $5::boolean = TRUE
            OR p.status <> 'INATIVO'
          )
        )
      )
      AND ($2::varchar IS NULL OR p.categoria = $2)
      AND (
        $3::varchar IS NULL
        OR p.nome ILIKE '%' || $3 || '%'
        OR p.codigo ILIKE '%' || $3 || '%'
        OR COALESCE(p.codigo_barras, '') ILIKE '%' || $3 || '%'
        OR COALESCE(p.referencia_interna, '') ILIKE '%' || $3 || '%'
      )
      ORDER BY p.nome ASC
      LIMIT $4 OFFSET $6
    `,
    [status, categoria, search, limit, includeInactive, offset]
  );

  return result.rows;
};

const countProdutos = async ({
  status,
  categoria,
  search,
  includeInactive
}) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM produtos p
      WHERE (
        (
          $1::varchar IS NOT NULL AND p.status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $4::boolean = TRUE
            OR p.status <> 'INATIVO'
          )
        )
      )
      AND ($2::varchar IS NULL OR p.categoria = $2)
      AND (
        $3::varchar IS NULL
        OR p.nome ILIKE '%' || $3 || '%'
        OR p.codigo ILIKE '%' || $3 || '%'
        OR COALESCE(p.codigo_barras, '') ILIKE '%' || $3 || '%'
        OR COALESCE(p.referencia_interna, '') ILIKE '%' || $3 || '%'
      )
    `,
    [status, categoria, search, includeInactive]
  );

  return result.rows[0].total;
};

const updateProduto = async (produtoId, payload) => {
  const result = await query(
    `
      UPDATE produtos
      SET
        fornecedor_padrao_id = $2,
        codigo = $3,
        codigo_barras = $4,
        referencia_interna = $5,
        nome = $6,
        descricao = $7,
        unidade_medida = $8,
        categoria = $9,
        preco_custo = $10,
        preco_venda = $11,
        peso_kg = $12,
        estoque_minimo = $13,
        ponto_reposicao = $14,
        permite_venda_sem_estoque = $15,
        status = $16,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      produtoId,
      payload.fornecedorPadraoId,
      payload.codigo,
      payload.codigoBarras,
      payload.referenciaInterna,
      payload.nome,
      payload.descricao,
      payload.unidadeMedida,
      payload.categoria,
      payload.precoCusto,
      payload.precoVenda,
      payload.peso,
      payload.estoqueMinimo,
      payload.pontoReposicao,
      payload.permiteVendaSemEstoque,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const inactivateProduto = async (produtoId) => {
  const result = await query(
    `
      UPDATE produtos
      SET status = 'INATIVO', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        fornecedor_padrao_id,
        codigo,
        codigo_barras,
        referencia_interna,
        nome,
        descricao,
        unidade_medida,
        categoria,
        preco_custo,
        preco_venda,
        peso_kg,
        estoque_minimo,
        ponto_reposicao,
        permite_venda_sem_estoque,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [produtoId]
  );

  return result.rows[0] || null;
};

const getSaldoEstoqueByProdutoId = async (produtoId) => {
  const summaryResult = await query(
    `
      SELECT
        COALESCE(SUM(quantidade), 0)::numeric(14,3) AS saldo_total,
        COALESCE(SUM(reservado), 0)::numeric(14,3) AS reservado_total,
        COALESCE(SUM(quantidade - reservado), 0)::numeric(14,3) AS disponivel_total
      FROM estoques
      WHERE produto_id = $1
    `,
    [produtoId]
  );

  const stockByLocationResult = await query(
    `
      SELECT
        e.id,
        e.local_estoque_id,
        l.codigo AS local_codigo,
        l.nome AS local_nome,
        e.quantidade,
        e.reservado,
        (e.quantidade - e.reservado)::numeric(14,3) AS disponivel
      FROM estoques e
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE e.produto_id = $1
      ORDER BY l.nome ASC
    `,
    [produtoId]
  );

  return {
    summary: summaryResult.rows[0],
    stockByLocation: stockByLocationResult.rows
  };
};

const getProdutosAlertaEstoqueMinimo = async () => {
  const result = await query(
    `
      SELECT
        p.id,
        p.codigo,
        p.nome,
        p.categoria,
        p.unidade_medida,
        p.status,
        p.estoque_minimo,
        p.ponto_reposicao,
        COALESCE(SUM(e.quantidade), 0)::numeric(14,3) AS saldo_total,
        COALESCE(SUM(e.reservado), 0)::numeric(14,3) AS reservado_total,
        COALESCE(SUM(e.quantidade - e.reservado), 0)::numeric(14,3) AS disponivel_total,
        CASE
          WHEN COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.estoque_minimo THEN 'ESTOQUE_MINIMO'
          WHEN COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.ponto_reposicao THEN 'PONTO_REPOSICAO'
          ELSE NULL
        END AS tipo_alerta
      FROM produtos p
      LEFT JOIN estoques e ON e.produto_id = p.id
      WHERE p.status = 'ATIVO'
      GROUP BY
        p.id,
        p.codigo,
        p.nome,
        p.categoria,
        p.unidade_medida,
        p.status,
        p.estoque_minimo,
        p.ponto_reposicao
      HAVING
        COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.ponto_reposicao
        OR COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.estoque_minimo
      ORDER BY disponivel_total ASC, p.nome ASC
    `
  );

  return result.rows;
};

module.exports = {
  createProduto,
  findProdutoById,
  findProdutoByPublicId,
  findProdutoByIdentifier,
  findProdutoByCodigo,
  findProdutoByCodigoBarras,
  findFornecedorById,
  listProdutos,
  countProdutos,
  updateProduto,
  inactivateProduto,
  getSaldoEstoqueByProdutoId,
  getProdutosAlertaEstoqueMinimo
};
