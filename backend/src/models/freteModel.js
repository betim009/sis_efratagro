const { query } = require("../config/database");

const freteSelect = `
  SELECT
    f.id,
    f.venda_id,
    f.tabela_frete_id,
    f.modalidade,
    f.tipo_calculo,
    f.regiao_destino,
    f.peso_total_kg,
    f.distancia_km,
    f.valor_estimado,
    f.valor_real,
    f.veiculo_id,
    f.transportadora_fornecedor_id,
    f.status,
    f.observacoes,
    f.criado_em AS created_at,
    f.atualizado_em AS updated_at,
    v.numero AS venda_numero,
    c.nome_razao_social AS cliente_nome,
    c.cidade AS cliente_cidade,
    c.estado AS cliente_estado,
    ve.placa AS veiculo_placa,
    ve.modelo AS veiculo_modelo,
    fo.razao_social AS transportadora_nome,
    e.id AS entrega_id,
    e.status AS entrega_status,
    tf.nome AS tabela_frete_nome
  FROM fretes f
  LEFT JOIN vendas v ON v.id = f.venda_id
  LEFT JOIN clientes c ON c.id = v.cliente_id
  LEFT JOIN veiculos ve ON ve.id = f.veiculo_id
  LEFT JOIN fornecedores fo ON fo.id = f.transportadora_fornecedor_id
  LEFT JOIN entregas e ON e.frete_id = f.id
  LEFT JOIN tabelas_frete tf ON tf.id = f.tabela_frete_id
`;

// ─── CREATE ─────────────────────────────────────────────────────────

const createFrete = async (payload) => {
  const result = await query(
    `
      INSERT INTO fretes (
        venda_id, tabela_frete_id, modalidade, tipo_calculo,
        regiao_destino, peso_total_kg, distancia_km,
        valor_estimado, valor_real,
        veiculo_id, transportadora_fornecedor_id,
        status, observacoes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `,
    [
      payload.vendaId,
      payload.tabelaFreteId,
      payload.modalidade,
      payload.tipoCalculo,
      payload.regiaoDestino,
      payload.pesoTotalKg,
      payload.distanciaKm,
      payload.valorEstimado,
      payload.valorReal || null,
      payload.veiculoId || null,
      payload.transportadoraFornecedorId || null,
      payload.status || "CALCULADO",
      payload.observacoes
    ]
  );

  return findById(result.rows[0].id);
};

// ─── FIND BY ID ─────────────────────────────────────────────────────

const findById = async (id) => {
  const result = await query(`${freteSelect} WHERE f.id = $1`, [id]);
  return result.rows[0] || null;
};

// ─── FIND BY VENDA ──────────────────────────────────────────────────

const findByVendaId = async (vendaId) => {
  const result = await query(`${freteSelect} WHERE f.venda_id = $1`, [vendaId]);
  return result.rows[0] || null;
};

// ─── CHECK VENDA EXISTS ─────────────────────────────────────────────

const vendaExists = async (vendaId) => {
  const result = await query("SELECT id FROM vendas WHERE id = $1", [vendaId]);
  return result.rows.length > 0;
};

// ─── CHECK VEICULO EXISTS ───────────────────────────────────────────

const veiculoExists = async (veiculoId) => {
  const result = await query(
    "SELECT id FROM veiculos WHERE id = $1 AND status = 'ATIVO'",
    [veiculoId]
  );
  return result.rows.length > 0;
};

// ─── CHECK ENTREGA EXISTS ───────────────────────────────────────────

const entregaExists = async (entregaId) => {
  const result = await query("SELECT id, frete_id FROM entregas WHERE id = $1", [entregaId]);
  return result.rows[0] || null;
};

// ─── CHECK TRANSPORTADORA EXISTS ────────────────────────────────────

const transportadoraExists = async (fornecedorId) => {
  const result = await query(
    "SELECT id FROM fornecedores WHERE id = $1 AND status = 'ATIVO'",
    [fornecedorId]
  );
  return result.rows.length > 0;
};

// ─── LIST ───────────────────────────────────────────────────────────

const listFretes = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`f.status = $${idx++}`);
    params.push(filters.status);
  }

  if (filters.modalidade) {
    conditions.push(`f.modalidade = $${idx++}`);
    params.push(filters.modalidade);
  }

  if (filters.dataInicio) {
    conditions.push(`f.criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`f.criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  if (filters.regiaoDestino) {
    conditions.push(`LOWER(f.regiao_destino) = LOWER($${idx++})`);
    params.push(filters.regiaoDestino);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    ${freteSelect}
    ${where}
    ORDER BY f.criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `
    SELECT COUNT(*) AS total FROM fretes f
    LEFT JOIN vendas v ON v.id = f.venda_id
    ${where}
  `;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return {
    fretes: dataResult.rows,
    total: Number(countResult.rows[0].total)
  };
};

// ─── VINCULAR ENTREGA ───────────────────────────────────────────────

const vincularEntrega = async (freteId, entregaId) => {
  await query(
    "UPDATE entregas SET frete_id = $1, atualizado_em = NOW() WHERE id = $2",
    [freteId, entregaId]
  );

  await query(
    "UPDATE fretes SET status = 'VINCULADO', atualizado_em = NOW() WHERE id = $1 AND status = 'CALCULADO'",
    [freteId]
  );

  return findById(freteId);
};

// ─── VINCULAR VEÍCULO ──────────────────────────────────────────────

const vincularVeiculo = async (freteId, veiculoId) => {
  const result = await query(
    `
      UPDATE fretes
      SET veiculo_id = $1, atualizado_em = NOW()
      WHERE id = $2
      RETURNING *
    `,
    [veiculoId, freteId]
  );

  if (!result.rows[0]) return null;
  return findById(freteId);
};

// ─── REGISTRAR CUSTO REAL ──────────────────────────────────────────

const registrarCustoReal = async (freteId, custoReal, observacoes) => {
  const sets = ["valor_real = $1", "atualizado_em = NOW()"];
  const params = [custoReal];
  let idx = 2;

  if (observacoes !== undefined && observacoes !== null) {
    sets.push(`observacoes = $${idx++}`);
    params.push(observacoes);
  }

  params.push(freteId);

  const result = await query(
    `UPDATE fretes SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );

  if (!result.rows[0]) return null;
  return findById(freteId);
};

// ─── ATUALIZAR STATUS ──────────────────────────────────────────────

const updateStatus = async (freteId, status) => {
  const result = await query(
    "UPDATE fretes SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *",
    [status, freteId]
  );
  return result.rows[0] || null;
};

// ─── BUSCAR POR REGIÃO ─────────────────────────────────────────────

const listByRegiao = async (regiao, filters) => {
  filters.regiaoDestino = regiao;
  return listFretes(filters);
};

// ─── MÉTRICAS PARA DASHBOARD/RELATÓRIOS ────────────────────────────

const getMetricasFrete = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `
      SELECT
        COUNT(*) AS total_fretes,
        COALESCE(SUM(valor_estimado), 0) AS total_estimado,
        COALESCE(SUM(valor_real), 0) AS total_real,
        COALESCE(AVG(valor_estimado), 0) AS media_estimado,
        COALESCE(AVG(valor_real), 0) AS media_real,
        COUNT(*) FILTER (WHERE modalidade = 'PROPRIO') AS total_proprio,
        COUNT(*) FILTER (WHERE modalidade = 'TERCEIRO') AS total_terceiro,
        COUNT(*) FILTER (WHERE valor_real IS NOT NULL) AS total_com_custo_real,
        COALESCE(SUM(valor_real) - SUM(valor_estimado), 0) FILTER (WHERE valor_real IS NOT NULL) AS diferenca_total
      FROM fretes
      ${where}
    `,
    params
  );

  return result.rows[0];
};

module.exports = {
  createFrete,
  findById,
  findByVendaId,
  vendaExists,
  veiculoExists,
  entregaExists,
  transportadoraExists,
  listFretes,
  vincularEntrega,
  vincularVeiculo,
  registrarCustoReal,
  updateStatus,
  listByRegiao,
  getMetricasFrete
};
