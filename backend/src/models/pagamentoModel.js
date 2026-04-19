const { query } = require("../config/database");

const pagamentoSelect = `
  SELECT
    p.id,
    p.duplicata_id,
    p.recebido_por_usuario_id,
    p.forma_pagamento,
    p.valor,
    p.data_pagamento,
    p.referencia_externa,
    p.observacoes,
    p.criado_em AS created_at,
    u.nome AS recebido_por_nome
  FROM pagamentos p
  LEFT JOIN usuarios u ON u.id = p.recebido_por_usuario_id
`;

const createPagamento = async (payload) => {
  const result = await query(
    `
      INSERT INTO pagamentos (
        duplicata_id,
        recebido_por_usuario_id,
        forma_pagamento,
        valor,
        data_pagamento,
        referencia_externa,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, duplicata_id, recebido_por_usuario_id,
        forma_pagamento, valor, data_pagamento,
        referencia_externa, observacoes,
        criado_em AS created_at
    `,
    [
      payload.duplicataId,
      payload.recebidoPorUsuarioId,
      payload.formaPagamento,
      payload.valor,
      payload.dataPagamento,
      payload.referenciaExterna,
      payload.observacoes
    ]
  );

  return result.rows[0];
};

const listPagamentosByDuplicataId = async (duplicataId) => {
  const result = await query(
    `
      ${pagamentoSelect}
      WHERE p.duplicata_id = $1
      ORDER BY p.data_pagamento ASC, p.criado_em ASC
    `,
    [duplicataId]
  );

  return result.rows;
};

const sumPagamentosByDuplicataId = async (duplicataId) => {
  const result = await query(
    `
      SELECT
        COALESCE(SUM(valor), 0)::numeric(14,2) AS total_pago,
        COUNT(*)::integer AS total_pagamentos
      FROM pagamentos
      WHERE duplicata_id = $1
    `,
    [duplicataId]
  );

  return result.rows[0];
};

const findPagamentoById = async (pagamentoId) => {
  const result = await query(
    `
      ${pagamentoSelect}
      WHERE p.id = $1
      LIMIT 1
    `,
    [pagamentoId]
  );

  return result.rows[0] || null;
};

module.exports = {
  createPagamento,
  listPagamentosByDuplicataId,
  sumPagamentosByDuplicataId,
  findPagamentoById
};
