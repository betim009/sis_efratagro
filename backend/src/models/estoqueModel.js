const { query } = require("../config/database");

const listSaldos = async ({ search, limit, offset }) => {
  const result = await query(
    `
      SELECT
        e.id,
        p.codigo AS produto_codigo,
        p.nome AS produto_nome,
        l.nome AS local_nome,
        e.quantidade,
        e.reservado,
        p.estoque_minimo
      FROM estoques e
      INNER JOIN produtos p ON p.id = e.produto_id
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE (
        $1::varchar IS NULL
        OR p.codigo ILIKE '%' || $1 || '%'
        OR p.nome ILIKE '%' || $1 || '%'
        OR l.nome ILIKE '%' || $1 || '%'
      )
      ORDER BY p.nome ASC, l.nome ASC
      LIMIT $2 OFFSET $3
    `,
    [search, limit, offset]
  );

  return result.rows;
};

const countSaldos = async ({ search }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM estoques e
      INNER JOIN produtos p ON p.id = e.produto_id
      INNER JOIN locais_estoque l ON l.id = e.local_estoque_id
      WHERE (
        $1::varchar IS NULL
        OR p.codigo ILIKE '%' || $1 || '%'
        OR p.nome ILIKE '%' || $1 || '%'
        OR l.nome ILIKE '%' || $1 || '%'
      )
    `,
    [search]
  );

  return result.rows[0].total;
};

const listMovimentacoes = async ({ search, limit, offset }) => {
  const result = await query(
    `
      SELECT
        m.id,
        m.data_movimentacao,
        m.tipo_movimentacao,
        m.quantidade,
        m.motivo,
        p.nome AS produto_nome,
        lo.nome AS local_origem_nome,
        ld.nome AS local_destino_nome
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      LEFT JOIN locais_estoque lo ON lo.id = m.local_origem_id
      LEFT JOIN locais_estoque ld ON ld.id = m.local_destino_id
      WHERE (
        $1::varchar IS NULL
        OR p.nome ILIKE '%' || $1 || '%'
        OR m.motivo ILIKE '%' || $1 || '%'
        OR COALESCE(lo.nome, '') ILIKE '%' || $1 || '%'
        OR COALESCE(ld.nome, '') ILIKE '%' || $1 || '%'
      )
      ORDER BY m.data_movimentacao DESC
      LIMIT $2 OFFSET $3
    `,
    [search, limit, offset]
  );

  return result.rows;
};

const countMovimentacoes = async ({ search }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM movimentacoes_estoque m
      INNER JOIN produtos p ON p.id = m.produto_id
      LEFT JOIN locais_estoque lo ON lo.id = m.local_origem_id
      LEFT JOIN locais_estoque ld ON ld.id = m.local_destino_id
      WHERE (
        $1::varchar IS NULL
        OR p.nome ILIKE '%' || $1 || '%'
        OR m.motivo ILIKE '%' || $1 || '%'
        OR COALESCE(lo.nome, '') ILIKE '%' || $1 || '%'
        OR COALESCE(ld.nome, '') ILIKE '%' || $1 || '%'
      )
    `,
    [search]
  );

  return result.rows[0].total;
};

const listAlertasBaixoEstoque = async () => {
  const result = await query(
    `
      SELECT
        p.nome AS produto_nome,
        p.estoque_minimo,
        SUM(e.quantidade - e.reservado) AS saldo_atual
      FROM estoques e
      INNER JOIN produtos p ON p.id = e.produto_id
      GROUP BY p.id, p.nome, p.estoque_minimo
      HAVING SUM(e.quantidade - e.reservado) <= p.estoque_minimo
      ORDER BY saldo_atual ASC, p.nome ASC
    `
  );

  return result.rows;
};

module.exports = {
  listSaldos,
  countSaldos,
  listMovimentacoes,
  countMovimentacoes,
  listAlertasBaixoEstoque
};
