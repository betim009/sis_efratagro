const { query, getClient } = require("../config/database");

const duplicataSelect = `
  SELECT
    d.id,
    d.venda_id,
    d.cliente_id,
    d.numero,
    d.parcela,
    d.valor_total,
    d.valor_aberto,
    d.vencimento,
    d.data_emissao,
    d.status,
    d.observacoes,
    d.criado_em AS created_at,
    d.atualizado_em AS updated_at,
    c.nome_razao_social AS cliente_razao_social,
    c.nome_fantasia AS cliente_nome_fantasia,
    c.cpf_cnpj AS cliente_cpf_cnpj,
    v.numero AS venda_numero,
    v.total_valor AS venda_total_valor
  FROM duplicatas d
  INNER JOIN clientes c ON c.id = d.cliente_id
  INNER JOIN vendas v ON v.id = d.venda_id
`;

const findDuplicataById = async (duplicataId) => {
  const result = await query(
    `
      ${duplicataSelect}
      WHERE d.id = $1
      LIMIT 1
    `,
    [duplicataId]
  );

  return result.rows[0] || null;
};

const findDuplicataByNumero = async (numero) => {
  const result = await query(
    `
      SELECT id, numero
      FROM duplicatas
      WHERE numero = $1
      LIMIT 1
    `,
    [numero]
  );

  return result.rows[0] || null;
};

const createDuplicata = async (payload) => {
  const result = await query(
    `
      INSERT INTO duplicatas (
        venda_id,
        cliente_id,
        numero,
        parcela,
        valor_total,
        valor_aberto,
        vencimento,
        data_emissao,
        status,
        observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id, venda_id, cliente_id, numero, parcela,
        valor_total, valor_aberto, vencimento, data_emissao,
        status, observacoes,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.vendaId,
      payload.clienteId,
      payload.numero,
      payload.parcela,
      payload.valorTotal,
      payload.valorAberto,
      payload.vencimento,
      payload.dataEmissao,
      payload.status || "EM_ABERTO",
      payload.observacoes
    ]
  );

  return result.rows[0];
};

const createDuplicatasBatch = async (duplicatas) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const results = [];

    for (const payload of duplicatas) {
      const result = await client.query(
        `
          INSERT INTO duplicatas (
            venda_id, cliente_id, numero, parcela,
            valor_total, valor_aberto, vencimento, data_emissao,
            status, observacoes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING
            id, venda_id, cliente_id, numero, parcela,
            valor_total, valor_aberto, vencimento, data_emissao,
            status, observacoes,
            criado_em AS created_at,
            atualizado_em AS updated_at
        `,
        [
          payload.vendaId,
          payload.clienteId,
          payload.numero,
          payload.parcela,
          payload.valorTotal,
          payload.valorAberto,
          payload.vencimento,
          payload.dataEmissao,
          payload.status || "EM_ABERTO",
          payload.observacoes
        ]
      );

      results.push(result.rows[0]);
    }

    await client.query("COMMIT");

    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listDuplicatas = async ({ status, clienteId, search, dataInicio, dataFim, limit, offset }) => {
  const result = await query(
    `
      ${duplicataSelect}
      WHERE ($1::varchar IS NULL OR d.status = $1)
        AND ($2::uuid IS NULL OR d.cliente_id = $2)
        AND ($3::date IS NULL OR d.vencimento >= $3)
        AND ($4::date IS NULL OR d.vencimento <= $4)
        AND (
          $5::varchar IS NULL
          OR d.numero ILIKE '%' || $5 || '%'
          OR c.nome_razao_social ILIKE '%' || $5 || '%'
          OR c.nome_fantasia ILIKE '%' || $5 || '%'
          OR c.cpf_cnpj ILIKE '%' || $5 || '%'
        )
      ORDER BY d.vencimento ASC, d.numero ASC
      LIMIT $6 OFFSET $7
    `,
    [status, clienteId, dataInicio, dataFim, search, limit, offset]
  );

  return result.rows;
};

const countDuplicatas = async ({ status, clienteId, search, dataInicio, dataFim }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM duplicatas d
      INNER JOIN clientes c ON c.id = d.cliente_id
      WHERE ($1::varchar IS NULL OR d.status = $1)
        AND ($2::uuid IS NULL OR d.cliente_id = $2)
        AND ($3::date IS NULL OR d.vencimento >= $3)
        AND ($4::date IS NULL OR d.vencimento <= $4)
        AND (
          $5::varchar IS NULL
          OR d.numero ILIKE '%' || $5 || '%'
          OR c.nome_razao_social ILIKE '%' || $5 || '%'
          OR c.nome_fantasia ILIKE '%' || $5 || '%'
          OR c.cpf_cnpj ILIKE '%' || $5 || '%'
        )
    `,
    [status, clienteId, search, dataInicio, dataFim]
  );

  return result.rows[0].total;
};

const listDuplicatasByClienteId = async (clienteId) => {
  const result = await query(
    `
      ${duplicataSelect}
      WHERE d.cliente_id = $1
      ORDER BY d.vencimento ASC, d.numero ASC
    `,
    [clienteId]
  );

  return result.rows;
};

const listDuplicatasByStatus = async (status) => {
  const result = await query(
    `
      ${duplicataSelect}
      WHERE d.status = $1
      ORDER BY d.vencimento ASC, d.numero ASC
    `,
    [status]
  );

  return result.rows;
};

const findDuplicatasVencidas = async () => {
  const result = await query(
    `
      ${duplicataSelect}
      WHERE d.vencimento < CURRENT_DATE
        AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE')
      ORDER BY d.vencimento ASC, d.numero ASC
    `
  );

  return result.rows;
};

const findDuplicatasVencendo = async (dias) => {
  const result = await query(
    `
      ${duplicataSelect}
      WHERE d.vencimento >= CURRENT_DATE
        AND d.vencimento <= CURRENT_DATE + ($1::integer || ' days')::interval
        AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE')
      ORDER BY d.vencimento ASC, d.numero ASC
    `,
    [dias]
  );

  return result.rows;
};

const updateDuplicataValoresEStatus = async (duplicataId, { valorAberto, status }) => {
  const result = await query(
    `
      UPDATE duplicatas
      SET
        valor_aberto = $2,
        status = $3,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, venda_id, cliente_id, numero, parcela,
        valor_total, valor_aberto, vencimento, data_emissao,
        status, observacoes,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [duplicataId, valorAberto, status]
  );

  return result.rows[0] || null;
};

const cancelarDuplicata = async (duplicataId) => {
  const result = await query(
    `
      UPDATE duplicatas
      SET status = 'CANCELADO', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, venda_id, cliente_id, numero, parcela,
        valor_total, valor_aberto, vencimento, data_emissao,
        status, observacoes,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [duplicataId]
  );

  return result.rows[0] || null;
};

const findVendaById = async (vendaId) => {
  const result = await query(
    `
      SELECT
        id, numero, cliente_id, tipo_venda, status,
        forma_pagamento, condicao_pagamento, total_valor
      FROM vendas
      WHERE id = $1
      LIMIT 1
    `,
    [vendaId]
  );

  return result.rows[0] || null;
};

const findClienteById = async (clienteId) => {
  const result = await query(
    `
      SELECT id, nome_razao_social, nome_fantasia, cpf_cnpj, status
      FROM clientes
      WHERE id = $1
      LIMIT 1
    `,
    [clienteId]
  );

  return result.rows[0] || null;
};

const getResumoFinanceiro = async () => {
  const result = await query(
    `
      SELECT
        COUNT(*)::integer AS total_duplicatas,
        COUNT(*) FILTER (WHERE status = 'EM_ABERTO')::integer AS total_em_aberto,
        COUNT(*) FILTER (WHERE status = 'PAGO_PARCIALMENTE')::integer AS total_pago_parcialmente,
        COUNT(*) FILTER (WHERE status = 'PAGO')::integer AS total_pago,
        COUNT(*) FILTER (WHERE status = 'VENCIDO')::integer AS total_vencido,
        COUNT(*) FILTER (WHERE status = 'CANCELADO')::integer AS total_cancelado,
        COALESCE(SUM(valor_total), 0)::numeric(14,2) AS valor_total_geral,
        COALESCE(SUM(valor_aberto) FILTER (WHERE status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO')), 0)::numeric(14,2) AS valor_total_em_aberto,
        COALESCE(SUM(valor_total - valor_aberto) FILTER (WHERE status IN ('PAGO', 'PAGO_PARCIALMENTE')), 0)::numeric(14,2) AS valor_total_recebido,
        COUNT(*) FILTER (WHERE vencimento < CURRENT_DATE AND status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE'))::integer AS total_vencidas_nao_quitadas
      FROM duplicatas
    `
  );

  return result.rows[0];
};

module.exports = {
  findDuplicataById,
  findDuplicataByNumero,
  createDuplicata,
  createDuplicatasBatch,
  listDuplicatas,
  countDuplicatas,
  listDuplicatasByClienteId,
  listDuplicatasByStatus,
  findDuplicatasVencidas,
  findDuplicatasVencendo,
  updateDuplicataValoresEStatus,
  cancelarDuplicata,
  findVendaById,
  findClienteById,
  getResumoFinanceiro
};

