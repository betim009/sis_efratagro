const { query } = require("../config/database");

const customerSelect = `
  SELECT
    id,
    tipo_pessoa,
    nome_razao_social,
    cpf_cnpj,
    email,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    limite_credito,
    observacoes,
    status,
    criado_em AS created_at,
    atualizado_em AS updated_at
  FROM clientes
`;

const createCliente = async (payload) => {
  const result = await query(
    `
      INSERT INTO clientes (
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING
        id,
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.tipoCliente,
      payload.nomeRazaoSocial,
      payload.cpfCnpj,
      payload.email,
      payload.telefone,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.limiteCredito,
      payload.observacoes,
      payload.status
    ]
  );

  return result.rows[0];
};

const findClienteById = async (clienteId) => {
  const result = await query(
    `
      ${customerSelect}
      WHERE id = $1
      LIMIT 1
    `,
    [clienteId]
  );

  return result.rows[0] || null;
};

const findClienteByDocument = async (cpfCnpj, excludeId = null) => {
  const result = await query(
    `
      SELECT id, cpf_cnpj
      FROM clientes
      WHERE cpf_cnpj = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [cpfCnpj, excludeId]
  );

  return result.rows[0] || null;
};

const listClientes = async ({
  status,
  search,
  limit,
  offset,
  includeInactive
}) => {
  const result = await query(
    `
      ${customerSelect}
      WHERE (
        (
          $1::varchar IS NOT NULL AND status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $5::boolean = TRUE
            OR status <> 'INATIVO'
          )
        )
      )
      AND (
        $2::varchar IS NULL
        OR nome_razao_social ILIKE '%' || $2 || '%'
        OR cpf_cnpj ILIKE '%' || $2 || '%'
        OR COALESCE(email, '') ILIKE '%' || $2 || '%'
      )
      ORDER BY nome_razao_social ASC
      LIMIT $3 OFFSET $4
    `,
    [status, search, limit, offset, includeInactive]
  );

  return result.rows;
};

const countClientes = async ({ status, search, includeInactive }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM clientes
      WHERE (
        (
          $1::varchar IS NOT NULL AND status = $1
        ) OR (
          $1::varchar IS NULL
          AND (
            $3::boolean = TRUE
            OR status <> 'INATIVO'
          )
        )
      )
      AND (
        $2::varchar IS NULL
        OR nome_razao_social ILIKE '%' || $2 || '%'
        OR cpf_cnpj ILIKE '%' || $2 || '%'
        OR COALESCE(email, '') ILIKE '%' || $2 || '%'
      )
    `,
    [status, search, includeInactive]
  );

  return result.rows[0].total;
};

const updateCliente = async (clienteId, payload) => {
  const result = await query(
    `
      UPDATE clientes
      SET
        tipo_pessoa = $2,
        nome_razao_social = $3,
        cpf_cnpj = $4,
        email = $5,
        telefone = $6,
        cep = $7,
        logradouro = $8,
        numero = $9,
        complemento = $10,
        bairro = $11,
        cidade = $12,
        estado = $13,
        limite_credito = $14,
        observacoes = $15,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      clienteId,
      payload.tipoCliente,
      payload.nomeRazaoSocial,
      payload.cpfCnpj,
      payload.email,
      payload.telefone,
      payload.cep,
      payload.logradouro,
      payload.numero,
      payload.complemento,
      payload.bairro,
      payload.cidade,
      payload.estado,
      payload.limiteCredito,
      payload.observacoes
    ]
  );

  return result.rows[0] || null;
};

const updateClienteStatus = async (clienteId, status) => {
  const result = await query(
    `
      UPDATE clientes
      SET status = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        tipo_pessoa,
        nome_razao_social,
        cpf_cnpj,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        limite_credito,
        observacoes,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [clienteId, status]
  );

  return result.rows[0] || null;
};

const getClienteHistoricoCompras = async (clienteId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_vendas,
        COALESCE(SUM(total_valor), 0)::numeric(14,2) AS valor_total_compras,
        MAX(data_venda) AS ultima_compra_em
      FROM vendas
      WHERE cliente_id = $1
        AND status IN ('CONFIRMADA', 'FATURADA')
    `,
    [clienteId]
  );

  const salesResult = await query(
    `
      SELECT
        v.id,
        v.numero,
        v.tipo_venda,
        v.status,
        v.forma_pagamento,
        v.data_venda,
        v.total_valor,
        COALESCE(
          json_agg(
            json_build_object(
              'produto_id', iv.produto_id,
              'quantidade', iv.quantidade,
              'preco_unitario', iv.preco_unitario,
              'total_valor', iv.total_valor
            )
            ORDER BY iv.sequencia
          ) FILTER (WHERE iv.id IS NOT NULL),
          '[]'::json
        ) AS itens
      FROM vendas v
      LEFT JOIN itens_venda iv ON iv.venda_id = v.id
      WHERE v.cliente_id = $1
      GROUP BY v.id
      ORDER BY v.data_venda DESC
      LIMIT 20
    `,
    [clienteId]
  );

  return {
    summary: summaryResult.rows[0],
    sales: salesResult.rows
  };
};

const getClienteDebitosEmAberto = async (clienteId) => {
  const summaryResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total_duplicatas_em_aberto,
        COALESCE(SUM(valor_aberto), 0)::numeric(14,2) AS valor_total_em_aberto,
        MIN(vencimento) AS proximo_vencimento
      FROM duplicatas
      WHERE cliente_id = $1
        AND status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO')
        AND valor_aberto > 0
    `,
    [clienteId]
  );

  const titlesResult = await query(
    `
      SELECT
        id,
        venda_id,
        numero,
        parcela,
        valor_total,
        valor_aberto,
        vencimento,
        data_emissao,
        status
      FROM duplicatas
      WHERE cliente_id = $1
        AND status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO')
        AND valor_aberto > 0
      ORDER BY vencimento ASC, numero ASC
      LIMIT 50
    `,
    [clienteId]
  );

  return {
    summary: summaryResult.rows[0],
    titles: titlesResult.rows
  };
};

module.exports = {
  createCliente,
  findClienteById,
  findClienteByDocument,
  listClientes,
  countClientes,
  updateCliente,
  updateClienteStatus,
  getClienteHistoricoCompras,
  getClienteDebitosEmAberto
};
