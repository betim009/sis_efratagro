const { query } = require("../config/database");

const vendaSelect = `
  SELECT
    v.id,
    v.numero,
    v.data_venda,
    v.tipo_venda,
    v.status,
    v.forma_pagamento,
    v.total_valor,
    c.nome_razao_social AS cliente_nome
  FROM vendas v
  INNER JOIN clientes c ON c.id = v.cliente_id
`;

const listVendas = async ({ search, tipoVenda, status, limit, offset }) => {
  const result = await query(
    `
      ${vendaSelect}
      WHERE ($1::varchar IS NULL OR v.tipo_venda = $1)
        AND ($2::varchar IS NULL OR v.status = $2)
        AND (
          $3::varchar IS NULL
          OR v.numero ILIKE '%' || $3 || '%'
          OR c.nome_razao_social ILIKE '%' || $3 || '%'
          OR c.nome_fantasia ILIKE '%' || $3 || '%'
        )
      ORDER BY v.data_venda DESC, v.numero DESC
      LIMIT $4 OFFSET $5
    `,
    [tipoVenda, status, search, limit, offset]
  );

  return result.rows;
};

const countVendas = async ({ search, tipoVenda, status }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM vendas v
      INNER JOIN clientes c ON c.id = v.cliente_id
      WHERE ($1::varchar IS NULL OR v.tipo_venda = $1)
        AND ($2::varchar IS NULL OR v.status = $2)
        AND (
          $3::varchar IS NULL
          OR v.numero ILIKE '%' || $3 || '%'
          OR c.nome_razao_social ILIKE '%' || $3 || '%'
          OR c.nome_fantasia ILIKE '%' || $3 || '%'
        )
    `,
    [tipoVenda, status, search]
  );

  return result.rows[0].total;
};

module.exports = {
  listVendas,
  countVendas
};
