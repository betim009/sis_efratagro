const { query } = require("../config/database");

const resolveExecutor = (executor) => executor || { query };

const listSaldos = async ({ search, produtoId, localId, limit, offset }) => {
  const result = await query(
    `
      SELECT
        e.id,
        e.public_id,
        e.produto_id,
        e.local_estoque_id AS local_id,
        p.public_id AS produto_public_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        l.public_id AS local_public_id,
        l.nome AS local_nome,
        l.codigo AS local_codigo,
        l.tipo_local,
        e.quantidade,
        e.reservado,
        (e.quantidade - e.reservado) AS disponivel,
        p.estoque_minimo
      FROM estoques e
      INNER JOIN produtos p ON p.id = e.produto_id
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE ($1::varchar IS NULL OR p.codigo ILIKE '%' || $1 || '%' OR p.nome ILIKE '%' || $1 || '%' OR l.nome ILIKE '%' || $1 || '%')
        AND ($2::uuid IS NULL OR e.produto_id = $2)
        AND ($3::uuid IS NULL OR e.local_estoque_id = $3)
      ORDER BY p.nome ASC, l.nome ASC
      LIMIT $4 OFFSET $5
    `,
    [search, produtoId || null, localId || null, limit, offset]
  );

  return result.rows;
};

const countSaldos = async ({ search, produtoId, localId }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM estoques e
      INNER JOIN produtos p ON p.id = e.produto_id
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE ($1::varchar IS NULL OR p.codigo ILIKE '%' || $1 || '%' OR p.nome ILIKE '%' || $1 || '%' OR l.nome ILIKE '%' || $1 || '%')
        AND ($2::uuid IS NULL OR e.produto_id = $2)
        AND ($3::uuid IS NULL OR e.local_estoque_id = $3)
    `,
    [search, produtoId || null, localId || null]
  );

  return result.rows[0].total;
};

const findSaldoByProdutoAndLocal = async (produtoId, localId, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      SELECT
        id,
        public_id,
        produto_id,
        local_estoque_id,
        quantidade,
        reservado,
        atualizado_em
      FROM estoques
      WHERE produto_id = $1 AND local_estoque_id = $2
      LIMIT 1
      FOR UPDATE
    `,
    [produtoId, localId]
  );

  return result.rows[0] || null;
};

const createSaldo = async (payload, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO estoques (
        produto_id,
        local_estoque_id,
        quantidade,
        reservado
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        public_id,
        produto_id,
        local_estoque_id,
        quantidade,
        reservado,
        atualizado_em
    `,
    [payload.produtoId, payload.localId, payload.quantidade, payload.reservado || 0]
  );

  return result.rows[0];
};

const updateSaldoQuantidade = async (saldoId, quantidade, executor = null) => {
  const db = resolveExecutor(executor);
  const result = await db.query(
    `
      UPDATE estoques
      SET quantidade = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        public_id,
        produto_id,
        local_estoque_id,
        quantidade,
        reservado,
        atualizado_em
    `,
    [saldoId, quantidade]
  );

  return result.rows[0] || null;
};

const getSaldoByProduto = async (produtoId) => {
  const result = await query(
    `
      SELECT
        e.id,
        e.public_id,
        e.produto_id,
        e.local_estoque_id AS local_id,
        l.public_id AS local_public_id,
        l.nome AS local_nome,
        l.codigo AS local_codigo,
        l.tipo_local,
        e.quantidade,
        e.reservado,
        (e.quantidade - e.reservado) AS disponivel
      FROM estoques e
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE e.produto_id = $1
      ORDER BY l.nome ASC
    `,
    [produtoId]
  );

  return result.rows;
};

const getSaldoByProdutoAndLocal = async (produtoId, localId) => {
  const result = await query(
    `
      SELECT
        e.id,
        e.public_id,
        e.produto_id,
        e.local_estoque_id AS local_id,
        l.public_id AS local_public_id,
        l.nome AS local_nome,
        l.codigo AS local_codigo,
        l.tipo_local,
        e.quantidade,
        e.reservado,
        (e.quantidade - e.reservado) AS disponivel
      FROM estoques e
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE e.produto_id = $1 AND e.local_estoque_id = $2
      LIMIT 1
    `,
    [produtoId, localId]
  );

  return result.rows[0] || null;
};

const listMovimentacoes = async ({
  search,
  produtoId,
  localId,
  tipoMovimentacao,
  limit,
  offset
}) => {
  const result = await query(
    `
      SELECT
        m.id,
        m.public_id,
        m.produto_id,
        p.public_id AS produto_public_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        m.usuario_id,
        u.public_id AS usuario_public_id,
        u.nome AS usuario_nome,
        m.local_origem_id,
        lo.public_id AS local_origem_public_id,
        lo.nome AS local_origem_nome,
        m.local_destino_id,
        ld.public_id AS local_destino_public_id,
        ld.nome AS local_destino_nome,
        m.tipo_movimentacao,
        m.quantidade,
        m.motivo,
        m.observacoes,
        m.venda_id,
        m.data_movimentacao,
        m.criado_em
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      INNER JOIN usuarios u ON u.id = m.usuario_id
      LEFT JOIN locais_estoque lo ON lo.id = m.local_origem_id
      LEFT JOIN locais_estoque ld ON ld.id = m.local_destino_id
      WHERE ($1::varchar IS NULL OR p.nome ILIKE '%' || $1 || '%' OR p.codigo ILIKE '%' || $1 || '%' OR m.motivo ILIKE '%' || $1 || '%' OR COALESCE(lo.nome, '') ILIKE '%' || $1 || '%' OR COALESCE(ld.nome, '') ILIKE '%' || $1 || '%')
        AND ($2::uuid IS NULL OR m.produto_id = $2)
        AND ($3::uuid IS NULL OR m.local_origem_id = $3 OR m.local_destino_id = $3)
        AND ($4::varchar IS NULL OR m.tipo_movimentacao = $4)
      ORDER BY m.data_movimentacao DESC, m.criado_em DESC
      LIMIT $5 OFFSET $6
    `,
    [search, produtoId || null, localId || null, tipoMovimentacao || null, limit, offset]
  );

  return result.rows;
};

const countMovimentacoes = async ({ search, produtoId, localId, tipoMovimentacao }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      LEFT JOIN locais_estoque lo ON lo.id = m.local_origem_id
      LEFT JOIN locais_estoque ld ON ld.id = m.local_destino_id
      WHERE ($1::varchar IS NULL OR p.nome ILIKE '%' || $1 || '%' OR p.codigo ILIKE '%' || $1 || '%' OR m.motivo ILIKE '%' || $1 || '%' OR COALESCE(lo.nome, '') ILIKE '%' || $1 || '%' OR COALESCE(ld.nome, '') ILIKE '%' || $1 || '%')
        AND ($2::uuid IS NULL OR m.produto_id = $2)
        AND ($3::uuid IS NULL OR m.local_origem_id = $3 OR m.local_destino_id = $3)
        AND ($4::varchar IS NULL OR m.tipo_movimentacao = $4)
    `,
    [search, produtoId || null, localId || null, tipoMovimentacao || null]
  );

  return result.rows[0].total;
};

const listAlertasBaixoEstoque = async () => {
  const result = await query(
    `
      SELECT
        p.id AS produto_id,
        p.public_id AS produto_public_id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        p.estoque_minimo,
        COALESCE(SUM(e.quantidade - e.reservado), 0) AS saldo_atual
      FROM produtos p
      LEFT JOIN estoques e ON e.produto_id = p.id
      WHERE p.status <> 'INATIVO'
      GROUP BY p.id, p.codigo, p.nome, p.estoque_minimo
      HAVING COALESCE(SUM(e.quantidade - e.reservado), 0) <= p.estoque_minimo
      ORDER BY saldo_atual ASC, p.nome ASC
    `
  );

  return result.rows;
};

module.exports = {
  listSaldos,
  countSaldos,
  findSaldoByProdutoAndLocal,
  createSaldo,
  updateSaldoQuantidade,
  getSaldoByProduto,
  getSaldoByProdutoAndLocal,
  listMovimentacoes,
  countMovimentacoes,
  listAlertasBaixoEstoque
};
