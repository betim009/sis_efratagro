const { query } = require("../config/database");

const manutencaoSelect = `
  SELECT
    m.id,
    m.veiculo_id,
    m.fornecedor_id,
    m.tipo_manutencao,
    m.descricao,
    m.data_manutencao,
    m.proxima_manutencao_data,
    m.proxima_manutencao_km,
    m.quilometragem_registrada,
    m.custo,
    m.status,
    m.criado_em AS created_at,
    m.atualizado_em AS updated_at,
    v.placa AS veiculo_placa,
    v.modelo AS veiculo_modelo,
    f.razao_social AS fornecedor_razao_social
  FROM manutencoes m
  INNER JOIN veiculos v ON v.id = m.veiculo_id
  LEFT JOIN fornecedores f ON f.id = m.fornecedor_id
`;

const createManutencao = async (payload) => {
  const result = await query(
    `
      INSERT INTO manutencoes (
        veiculo_id, fornecedor_id, tipo_manutencao, descricao,
        data_manutencao, proxima_manutencao_data, proxima_manutencao_km,
        quilometragem_registrada, custo, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id, veiculo_id, fornecedor_id, tipo_manutencao, descricao,
        data_manutencao, proxima_manutencao_data, proxima_manutencao_km,
        quilometragem_registrada, custo, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.veiculoId,
      payload.fornecedorId,
      payload.tipoManutencao,
      payload.descricao,
      payload.dataManutencao,
      payload.proximaManutencaoData,
      payload.proximaManutencaoKm,
      payload.quilometragemRegistrada,
      payload.custo,
      payload.status || "AGENDADA"
    ]
  );

  return result.rows[0];
};

const findManutencaoById = async (manutencaoId) => {
  const result = await query(
    `
      ${manutencaoSelect}
      WHERE m.id = $1
      LIMIT 1
    `,
    [manutencaoId]
  );

  return result.rows[0] || null;
};

const listManutencoes = async ({ veiculoId, tipoManutencao, status, dataInicio, dataFim, search, limit, offset }) => {
  const result = await query(
    `
      ${manutencaoSelect}
      WHERE ($1::uuid IS NULL OR m.veiculo_id = $1)
        AND ($2::varchar IS NULL OR m.tipo_manutencao = $2)
        AND ($3::varchar IS NULL OR m.status = $3)
        AND ($4::date IS NULL OR m.data_manutencao >= $4)
        AND ($5::date IS NULL OR m.data_manutencao <= $5)
        AND (
          $6::varchar IS NULL
          OR m.descricao ILIKE '%' || $6 || '%'
          OR v.placa ILIKE '%' || $6 || '%'
          OR v.modelo ILIKE '%' || $6 || '%'
        )
      ORDER BY m.data_manutencao DESC, m.criado_em DESC
      LIMIT $7 OFFSET $8
    `,
    [veiculoId, tipoManutencao, status, dataInicio, dataFim, search, limit, offset]
  );

  return result.rows;
};

const countManutencoes = async ({ veiculoId, tipoManutencao, status, dataInicio, dataFim, search }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM manutencoes m
      INNER JOIN veiculos v ON v.id = m.veiculo_id
      WHERE ($1::uuid IS NULL OR m.veiculo_id = $1)
        AND ($2::varchar IS NULL OR m.tipo_manutencao = $2)
        AND ($3::varchar IS NULL OR m.status = $3)
        AND ($4::date IS NULL OR m.data_manutencao >= $4)
        AND ($5::date IS NULL OR m.data_manutencao <= $5)
        AND (
          $6::varchar IS NULL
          OR m.descricao ILIKE '%' || $6 || '%'
          OR v.placa ILIKE '%' || $6 || '%'
          OR v.modelo ILIKE '%' || $6 || '%'
        )
    `,
    [veiculoId, tipoManutencao, status, dataInicio, dataFim, search]
  );

  return result.rows[0].total;
};

const updateManutencao = async (manutencaoId, payload) => {
  const result = await query(
    `
      UPDATE manutencoes
      SET
        fornecedor_id = $2,
        tipo_manutencao = $3,
        descricao = $4,
        data_manutencao = $5,
        proxima_manutencao_data = $6,
        proxima_manutencao_km = $7,
        quilometragem_registrada = $8,
        custo = $9,
        status = $10,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, veiculo_id, fornecedor_id, tipo_manutencao, descricao,
        data_manutencao, proxima_manutencao_data, proxima_manutencao_km,
        quilometragem_registrada, custo, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      manutencaoId,
      payload.fornecedorId,
      payload.tipoManutencao,
      payload.descricao,
      payload.dataManutencao,
      payload.proximaManutencaoData,
      payload.proximaManutencaoKm,
      payload.quilometragemRegistrada,
      payload.custo,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const updateManutencaoStatus = async (manutencaoId, status) => {
  const result = await query(
    `
      UPDATE manutencoes
      SET status = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, veiculo_id, fornecedor_id, tipo_manutencao, descricao,
        data_manutencao, proxima_manutencao_data, proxima_manutencao_km,
        quilometragem_registrada, custo, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [manutencaoId, status]
  );

  return result.rows[0] || null;
};

const listManutencoesByVeiculoId = async (veiculoId) => {
  const result = await query(
    `
      ${manutencaoSelect}
      WHERE m.veiculo_id = $1
      ORDER BY m.data_manutencao DESC, m.criado_em DESC
    `,
    [veiculoId]
  );

  return result.rows;
};

const findAlertasPreventivasPorData = async (dias) => {
  const result = await query(
    `
      ${manutencaoSelect}
      WHERE m.tipo_manutencao = 'PREVENTIVA'
        AND m.status IN ('AGENDADA', 'EM_EXECUCAO')
        AND m.proxima_manutencao_data IS NOT NULL
        AND m.proxima_manutencao_data <= CURRENT_DATE + ($1::integer || ' days')::interval
      ORDER BY m.proxima_manutencao_data ASC
    `,
    [dias]
  );

  return result.rows;
};

const findAlertasPreventivasPorKm = async () => {
  const result = await query(
    `
      ${manutencaoSelect}
      WHERE m.tipo_manutencao = 'PREVENTIVA'
        AND m.status IN ('AGENDADA', 'EM_EXECUCAO')
        AND m.proxima_manutencao_km IS NOT NULL
        AND v.quilometragem_atual >= m.proxima_manutencao_km
      ORDER BY v.placa ASC
    `
  );

  return result.rows;
};

const getRelatorioCustosManutencao = async ({ veiculoId, dataInicio, dataFim }) => {
  const result = await query(
    `
      SELECT
        v.id AS veiculo_id,
        v.placa,
        v.modelo,
        v.marca,
        COUNT(m.id)::integer AS total_manutencoes,
        COUNT(m.id) FILTER (WHERE m.tipo_manutencao = 'PREVENTIVA')::integer AS total_preventivas,
        COUNT(m.id) FILTER (WHERE m.tipo_manutencao = 'CORRETIVA')::integer AS total_corretivas,
        COALESCE(SUM(m.custo), 0)::numeric(14,2) AS custo_total,
        COALESCE(SUM(m.custo) FILTER (WHERE m.tipo_manutencao = 'PREVENTIVA'), 0)::numeric(14,2) AS custo_preventivas,
        COALESCE(SUM(m.custo) FILTER (WHERE m.tipo_manutencao = 'CORRETIVA'), 0)::numeric(14,2) AS custo_corretivas
      FROM veiculos v
      INNER JOIN manutencoes m ON m.veiculo_id = v.id
      WHERE m.status = 'CONCLUIDA'
        AND ($1::uuid IS NULL OR v.id = $1)
        AND ($2::date IS NULL OR m.data_manutencao >= $2)
        AND ($3::date IS NULL OR m.data_manutencao <= $3)
      GROUP BY v.id, v.placa, v.modelo, v.marca
      ORDER BY custo_total DESC
    `,
    [veiculoId, dataInicio, dataFim]
  );

  return result.rows;
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

const findEntregaById = async (entregaId) => {
  const result = await query(
    `
      SELECT
        e.id, e.venda_id, e.frete_id, e.status,
        e.responsavel_usuario_id
      FROM entregas e
      WHERE e.id = $1
      LIMIT 1
    `,
    [entregaId]
  );

  return result.rows[0] || null;
};

const findFreteByEntregaId = async (entregaId) => {
  const result = await query(
    `
      SELECT
        fr.id, fr.venda_id, fr.veiculo_id, fr.modalidade
      FROM fretes fr
      INNER JOIN entregas e ON e.frete_id = fr.id
      WHERE e.id = $1
      LIMIT 1
    `,
    [entregaId]
  );

  return result.rows[0] || null;
};

const vincularVeiculoAoFrete = async (freteId, veiculoId) => {
  const result = await query(
    `
      UPDATE fretes
      SET veiculo_id = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING id, venda_id, veiculo_id, modalidade
    `,
    [freteId, veiculoId]
  );

  return result.rows[0] || null;
};

const countManutencoesAtivasByVeiculoId = async (veiculoId) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM manutencoes
      WHERE veiculo_id = $1
        AND status IN ('AGENDADA', 'EM_EXECUCAO')
    `,
    [veiculoId]
  );

  return result.rows[0].total;
};

module.exports = {
  createManutencao,
  findManutencaoById,
  listManutencoes,
  countManutencoes,
  updateManutencao,
  updateManutencaoStatus,
  listManutencoesByVeiculoId,
  findAlertasPreventivasPorData,
  findAlertasPreventivasPorKm,
  getRelatorioCustosManutencao,
  findFornecedorById,
  findEntregaById,
  findFreteByEntregaId,
  vincularVeiculoAoFrete,
  countManutencoesAtivasByVeiculoId
};
