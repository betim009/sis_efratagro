const { query } = require("../config/database");

const resolveExecutor = (executor) => executor || { query };

const baseSelect = `
  SELECT
    c.id,
    c.public_id,
    c.fornecedor_id,
    f.public_id AS fornecedor_public_id,
    f.razao_social AS fornecedor_razao_social,
    f.cpf_cnpj AS fornecedor_cpf_cnpj,
    c.usuario_id,
    u.public_id AS usuario_public_id,
    u.nome AS usuario_nome,
    c.numero,
    c.status,
    c.data_compra,
    c.subtotal,
    c.desconto_valor,
    c.frete_valor,
    c.total_valor,
    c.financeiro_status,
    c.observacoes,
    c.criado_em AS created_at,
    c.atualizado_em AS updated_at
  FROM compras c
  INNER JOIN fornecedores f ON f.id = c.fornecedor_id
  INNER JOIN usuarios u ON u.id = c.usuario_id
`;

const createCompra = async (payload, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO compras (
        fornecedor_id,
        usuario_id,
        numero,
        status,
        subtotal,
        desconto_valor,
        frete_valor,
        total_valor,
        financeiro_status,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id,
        public_id,
        fornecedor_id,
        usuario_id,
        numero,
        status,
        data_compra,
        subtotal,
        desconto_valor,
        frete_valor,
        total_valor,
        financeiro_status,
        observacoes,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.fornecedorId,
      payload.usuarioId,
      payload.numero,
      payload.status || "CONFIRMADA",
      payload.subtotal,
      payload.descontoValor || 0,
      payload.freteValor || 0,
      payload.totalValor,
      payload.financeiroStatus || "NAO_GERADO",
      payload.observacoes
    ]
  );

  return result.rows[0];
};

const updateFinanceiroStatus = async (compraId, financeiroStatus, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      UPDATE compras
      SET financeiro_status = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING id, financeiro_status
    `,
    [compraId, financeiroStatus]
  );

  return result.rows[0] || null;
};

const listCompras = async ({ search, fornecedorId, status, limit, offset }) => {
  const result = await query(
    `
      ${baseSelect}
      WHERE ($1::varchar IS NULL OR c.numero ILIKE '%' || $1 || '%' OR f.razao_social ILIKE '%' || $1 || '%' OR COALESCE(c.observacoes, '') ILIKE '%' || $1 || '%')
        AND ($2::uuid IS NULL OR c.fornecedor_id = $2)
        AND ($3::varchar IS NULL OR c.status = $3)
      ORDER BY c.data_compra DESC, c.criado_em DESC
      LIMIT $4 OFFSET $5
    `,
    [search, fornecedorId || null, status || null, limit, offset]
  );

  return result.rows;
};

const countCompras = async ({ search, fornecedorId, status }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM compras c
      INNER JOIN fornecedores f ON f.id = c.fornecedor_id
      WHERE ($1::varchar IS NULL OR c.numero ILIKE '%' || $1 || '%' OR f.razao_social ILIKE '%' || $1 || '%' OR COALESCE(c.observacoes, '') ILIKE '%' || $1 || '%')
        AND ($2::uuid IS NULL OR c.fornecedor_id = $2)
        AND ($3::varchar IS NULL OR c.status = $3)
    `,
    [search, fornecedorId || null, status || null]
  );

  return result.rows[0].total;
};

const findCompraById = async (compraId) => {
  const result = await query(
    `
      ${baseSelect}
      WHERE c.id = $1
      LIMIT 1
    `,
    [compraId]
  );

  return result.rows[0] || null;
};

const findCompraByPublicId = async (publicId) => {
  const result = await query(
    `
      ${baseSelect}
      WHERE c.public_id = $1
      LIMIT 1
    `,
    [publicId]
  );

  return result.rows[0] || null;
};

const findCompraByIdentifier = async (identifier) => {
  if (identifier === undefined || identifier === null || identifier === "") {
    return null;
  }

  const raw = String(identifier).trim();

  if (/^\d+$/.test(raw)) {
    return findCompraByPublicId(Number(raw));
  }

  return findCompraById(raw);
};

module.exports = {
  createCompra,
  updateFinanceiroStatus,
  listCompras,
  countCompras,
  findCompraById,
  findCompraByPublicId,
  findCompraByIdentifier
};
