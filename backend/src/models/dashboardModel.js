const { query } = require("../config/database");

// ═══════════════════════════════════════════════════════════════════════
// RESUMO GERAL
// ═══════════════════════════════════════════════════════════════════════

/**
 * Consulta agregada única para vendas do dia, semana e mês.
 * Usa DATE_TRUNC no PostgreSQL para agrupar sem múltiplos round-trips.
 */
const getResumoVendas = async () => {
  const sql = `
    SELECT
      COALESCE(SUM(CASE WHEN data_venda::date = CURRENT_DATE THEN total_valor ELSE 0 END), 0) AS total_vendas_dia,
      COALESCE(SUM(CASE WHEN data_venda >= DATE_TRUNC('week', CURRENT_DATE) THEN total_valor ELSE 0 END), 0) AS total_vendas_semana,
      COALESCE(SUM(CASE WHEN data_venda >= DATE_TRUNC('month', CURRENT_DATE) THEN total_valor ELSE 0 END), 0) AS total_vendas_mes,
      COUNT(CASE WHEN data_venda::date = CURRENT_DATE THEN 1 END) AS quantidade_vendas_dia,
      COUNT(CASE WHEN data_venda >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) AS quantidade_vendas_semana,
      COUNT(CASE WHEN data_venda >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) AS quantidade_vendas_mes
    FROM vendas
    WHERE status NOT IN ('CANCELADA')
  `;

  const result = await query(sql);
  return result.rows[0];
};

const getContadoresGerais = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM clientes WHERE status = 'ATIVO') AS clientes_ativos,
      (SELECT COUNT(*) FROM produtos WHERE status = 'ATIVO') AS produtos_ativos,
      (SELECT COUNT(*) FROM entregas WHERE status IN ('AGUARDANDO_DESPACHO', 'EM_TRANSITO')) AS entregas_pendentes,
      (SELECT COUNT(*) FROM veiculos WHERE status = 'MANUTENCAO') AS veiculos_em_manutencao
  `;

  const result = await query(sql);
  return result.rows[0];
};

// ═══════════════════════════════════════════════════════════════════════
// VENDAS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Métricas de vendas com filtro de período.
 * Filtro por data_venda para incluir apenas vendas do intervalo.
 */
const getMetricasVendas = async (filters) => {
  const conditions = ["v.status NOT IN ('CANCELADA')"];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`v.data_venda >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`v.data_venda <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      COUNT(*) AS total_pedidos,
      COALESCE(SUM(v.total_valor), 0) AS valor_total,
      COALESCE(AVG(v.total_valor), 0) AS ticket_medio,
      COALESCE(SUM(v.desconto_valor), 0) AS total_descontos,
      COALESCE(SUM(v.frete_valor), 0) AS total_frete,
      COUNT(CASE WHEN v.tipo_venda = 'NORMAL' THEN 1 END) AS vendas_normais,
      COUNT(CASE WHEN v.tipo_venda = 'FUTURA' THEN 1 END) AS vendas_futuras,
      COUNT(CASE WHEN v.tipo_venda = 'DIRETA' THEN 1 END) AS vendas_diretas,
      COUNT(CASE WHEN v.status = 'PENDENTE' THEN 1 END) AS vendas_pendentes,
      COUNT(CASE WHEN v.status = 'CONFIRMADA' THEN 1 END) AS vendas_confirmadas,
      COUNT(CASE WHEN v.status = 'FATURADA' THEN 1 END) AS vendas_faturadas
    FROM vendas v
    ${where}
  `;

  const result = await query(sql, params);
  return result.rows[0];
};

/**
 * Top vendedores no período — ordenado por valor total vendido.
 */
const getTopVendedores = async (filters, limit = 5) => {
  const conditions = ["v.status NOT IN ('CANCELADA')"];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`v.data_venda >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`v.data_venda <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit);

  const sql = `
    SELECT
      u.id AS vendedor_id,
      u.nome AS vendedor_nome,
      COUNT(v.id) AS total_pedidos,
      COALESCE(SUM(v.total_valor), 0) AS valor_total
    FROM vendas v
    INNER JOIN usuarios u ON u.id = v.vendedor_id
    ${where}
    GROUP BY u.id, u.nome
    ORDER BY valor_total DESC
    LIMIT $${idx}
  `;

  const result = await query(sql, params);
  return result.rows;
};

// ═══════════════════════════════════════════════════════════════════════
// FINANCEIRO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Agrega duplicatas por status.
 * EM_ABERTO, PAGO_PARCIALMENTE = "em aberto"; vencimento < CURRENT_DATE e status != PAGO/CANCELADO = vencida.
 */
const getMetricasFinanceiro = async (filters) => {
  const sql = `
    SELECT
      COUNT(CASE WHEN d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE') THEN 1 END) AS total_em_aberto,
      COALESCE(SUM(CASE WHEN d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE') THEN d.valor_aberto ELSE 0 END), 0) AS valor_total_em_aberto,
      COUNT(CASE WHEN d.vencimento < CURRENT_DATE AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO') THEN 1 END) AS total_vencidas,
      COALESCE(SUM(CASE WHEN d.vencimento < CURRENT_DATE AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO') THEN d.valor_aberto ELSE 0 END), 0) AS valor_total_vencido,
      COUNT(CASE
        WHEN d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE')
             AND d.vencimento >= CURRENT_DATE
             AND d.vencimento <= (CURRENT_DATE + ($1::int || ' days')::INTERVAL)
        THEN 1
      END) AS vencendo_em_x_dias
    FROM duplicatas d
  `;

  const result = await query(sql, [filters.dias || 7]);
  return result.rows[0];
};

// ═══════════════════════════════════════════════════════════════════════
// ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Produtos abaixo do estoque mínimo: compara soma de estoques com estoque_minimo do produto.
 * Agrupado por produto para permitir múltiplos locais de estoque.
 */
const getMetricasEstoque = async (filters) => {
  const conditions = ["p.status = 'ATIVO'"];
  const params = [];
  let idx = 1;

  if (filters.localId) {
    conditions.push(`e.local_estoque_id = $${idx}`);
    params.push(filters.localId);
    idx++;
  }

  const where = conditions.join(" AND ");

  const sqlResumo = `
    SELECT
      COUNT(*) AS total_produtos_abaixo_minimo
    FROM (
      SELECT
        p.id,
        p.estoque_minimo,
        COALESCE(SUM(e.quantidade), 0) AS saldo_total
      FROM produtos p
      LEFT JOIN estoques e ON e.produto_id = p.id
        ${filters.localId ? `AND e.local_estoque_id = $1` : ""}
      WHERE p.status = 'ATIVO'
      GROUP BY p.id
      HAVING COALESCE(SUM(e.quantidade), 0) < p.estoque_minimo
    ) sub
  `;

  const resumoResult = await query(sqlResumo, filters.localId ? [filters.localId] : []);

  return resumoResult.rows[0];
};

/**
 * Top produtos com necessidade de reposição — maior diferença entre estoque_minimo e saldo atual.
 */
const getTopReposicao = async (filters, limit = 10) => {
  const params = [];
  let idx = 1;
  let localFilter = "";

  if (filters.localId) {
    localFilter = `AND e.local_estoque_id = $${idx}`;
    params.push(filters.localId);
    idx++;
  }

  params.push(limit);

  const sql = `
    SELECT
      p.id,
      p.codigo,
      p.nome,
      p.unidade_medida,
      p.estoque_minimo,
      p.ponto_reposicao,
      COALESCE(SUM(e.quantidade), 0) AS saldo_atual,
      COALESCE(SUM(e.reservado), 0) AS reservado,
      (p.estoque_minimo - COALESCE(SUM(e.quantidade), 0)) AS deficit
    FROM produtos p
    LEFT JOIN estoques e ON e.produto_id = p.id ${localFilter}
    WHERE p.status = 'ATIVO'
    GROUP BY p.id
    HAVING COALESCE(SUM(e.quantidade), 0) < p.estoque_minimo
    ORDER BY deficit DESC
    LIMIT $${idx}
  `;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Saldo consolidado por local de estoque.
 */
const getSaldoPorLocal = async (filters) => {
  const params = [];
  let localFilter = "";

  if (filters.localId) {
    localFilter = "AND e.local_estoque_id = $1";
    params.push(filters.localId);
  }

  const sql = `
    SELECT
      le.id AS local_id,
      le.nome AS local_nome,
      le.codigo AS local_codigo,
      le.tipo_local,
      COUNT(DISTINCT e.produto_id) AS total_produtos,
      COALESCE(SUM(e.quantidade), 0) AS saldo_total,
      COALESCE(SUM(e.reservado), 0) AS total_reservado
    FROM locais_estoque le
    LEFT JOIN estoques e ON e.local_estoque_id = le.id ${localFilter}
    WHERE le.status = 'ATIVO'
    GROUP BY le.id, le.nome, le.codigo, le.tipo_local
    ORDER BY le.nome
  `;

  const result = await query(sql, params);
  return result.rows;
};

// ═══════════════════════════════════════════════════════════════════════
// VENDAS FUTURAS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Vendas do tipo FUTURA que ainda estão pendentes/confirmadas.
 * "prazo próximo" = data_entrega_prevista dentro dos próximos X dias.
 */
const getMetricasVendasFuturas = async (filters) => {
  const dias = filters.dias || 7;

  const sql = `
    SELECT
      COUNT(*) AS total_pedidos_futuros,
      COALESCE(SUM(total_valor), 0) AS valor_total_previsto,
      COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) AS pendentes,
      COUNT(CASE WHEN status = 'CONFIRMADA' THEN 1 END) AS confirmados,
      COUNT(CASE
        WHEN data_entrega_prevista IS NOT NULL
             AND data_entrega_prevista <= (CURRENT_DATE + ($1::int || ' days')::INTERVAL)
             AND data_entrega_prevista >= CURRENT_DATE
        THEN 1
      END) AS prazo_proximo
    FROM vendas
    WHERE tipo_venda = 'FUTURA'
      AND status NOT IN ('CANCELADA', 'FATURADA')
  `;

  const result = await query(sql, [dias]);
  return result.rows[0];
};

// ═══════════════════════════════════════════════════════════════════════
// FROTA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Métricas de frota: veículos em manutenção, custos e contagem por tipo.
 * Filtra manutenções concluídas para cálculo de custo.
 */
const getMetricasFrota = async (filters) => {
  const conditions = ["m.status = 'CONCLUIDA'"];
  const params = [];
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`m.data_manutencao >= $${idx}::date`);
    params.push(filters.dataInicio);
    idx++;
  }

  if (filters.dataFim) {
    conditions.push(`m.data_manutencao <= $${idx}::date`);
    params.push(filters.dataFim);
    idx++;
  }

  const custoWhere = conditions.join(" AND ");

  const sql = `
    SELECT
      (SELECT COUNT(*) FROM veiculos WHERE status = 'MANUTENCAO') AS veiculos_em_manutencao,
      (SELECT COUNT(*) FROM veiculos WHERE status = 'ATIVO') AS veiculos_ativos,
      (SELECT COUNT(*) FROM veiculos WHERE status = 'INATIVO') AS veiculos_inativos,
      (SELECT COUNT(*) FROM veiculos) AS total_veiculos,
      (SELECT COALESCE(SUM(m.custo), 0) FROM manutencoes m WHERE ${custoWhere}) AS total_gasto_manutencao,
      (SELECT COUNT(*) FROM manutencoes WHERE tipo_manutencao = 'PREVENTIVA' AND status NOT IN ('CANCELADA')) AS total_preventivas,
      (SELECT COUNT(*) FROM manutencoes WHERE tipo_manutencao = 'CORRETIVA' AND status NOT IN ('CANCELADA')) AS total_corretivas,
      (SELECT COUNT(*) FROM manutencoes WHERE status IN ('AGENDADA', 'EM_EXECUCAO')) AS manutencoes_ativas
  `;

  const result = await query(sql, params);
  return result.rows[0];
};

// ═══════════════════════════════════════════════════════════════════════
// SÉRIE TEMPORAL DE VENDAS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Série temporal com granularidade configurável.
 * Usa DATE_TRUNC para agrupar por DIA, SEMANA ou MES.
 * generate_series garante períodos sem vendas apareçam com valor zero.
 */
const getSerieTemporalVendas = async (filters) => {
  const granularidadeMap = {
    DIA: "day",
    SEMANA: "week",
    MES: "month"
  };

  const pgInterval = granularidadeMap[filters.granularidade];

  const sql = `
    WITH series AS (
      SELECT DATE_TRUNC($1, gs)::date AS periodo
      FROM generate_series($2::date, $3::date, ('1 ' || $1)::INTERVAL) gs
    ),
    vendas_agrupadas AS (
      SELECT
        DATE_TRUNC($1, data_venda)::date AS periodo,
        COUNT(*) AS quantidade_pedidos,
        COALESCE(SUM(total_valor), 0) AS valor_total
      FROM vendas
      WHERE status NOT IN ('CANCELADA')
        AND data_venda >= $2::date
        AND data_venda < ($3::date + INTERVAL '1 day')
      GROUP BY DATE_TRUNC($1, data_venda)::date
    )
    SELECT
      s.periodo,
      COALESCE(va.quantidade_pedidos, 0) AS quantidade_pedidos,
      COALESCE(va.valor_total, 0) AS valor_total
    FROM series s
    LEFT JOIN vendas_agrupadas va ON va.periodo = s.periodo
    ORDER BY s.periodo
  `;

  const result = await query(sql, [pgInterval, filters.dataInicio, filters.dataFim]);
  return result.rows;
};

// ═══════════════════════════════════════════════════════════════════════
// ALERTAS CONSOLIDADOS
// ═══════════════════════════════════════════════════════════════════════

const getAlertasEstoqueBaixo = async (limit = 10) => {
  const sql = `
    SELECT
      p.id,
      p.codigo,
      p.nome,
      p.estoque_minimo,
      COALESCE(SUM(e.quantidade), 0) AS saldo_atual
    FROM produtos p
    LEFT JOIN estoques e ON e.produto_id = p.id
    WHERE p.status = 'ATIVO'
    GROUP BY p.id
    HAVING COALESCE(SUM(e.quantidade), 0) < p.estoque_minimo
    ORDER BY (p.estoque_minimo - COALESCE(SUM(e.quantidade), 0)) DESC
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
};

const getAlertasDuplicatasVencidas = async (limit = 10) => {
  const sql = `
    SELECT
      d.id,
      d.numero,
      d.parcela,
      d.valor_total,
      d.valor_aberto,
      d.vencimento,
      d.status,
      c.nome_razao_social AS cliente_nome
    FROM duplicatas d
    INNER JOIN clientes c ON c.id = d.cliente_id
    WHERE d.vencimento < CURRENT_DATE
      AND d.status IN ('EM_ABERTO', 'PAGO_PARCIALMENTE', 'VENCIDO')
    ORDER BY d.vencimento ASC
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
};

const getAlertasVendasFuturasProximas = async (dias = 7, limit = 10) => {
  const sql = `
    SELECT
      v.id,
      v.numero,
      v.total_valor,
      v.data_entrega_prevista,
      v.status,
      c.nome_razao_social AS cliente_nome
    FROM vendas v
    INNER JOIN clientes c ON c.id = v.cliente_id
    WHERE v.tipo_venda = 'FUTURA'
      AND v.status NOT IN ('CANCELADA', 'FATURADA')
      AND v.data_entrega_prevista IS NOT NULL
      AND v.data_entrega_prevista >= CURRENT_DATE
      AND v.data_entrega_prevista <= (CURRENT_DATE + ($1::int || ' days')::INTERVAL)
    ORDER BY v.data_entrega_prevista ASC
    LIMIT $2
  `;

  const result = await query(sql, [dias, limit]);
  return result.rows;
};

const getAlertasManutencaoPreventiva = async (limit = 10) => {
  const sql = `
    SELECT
      m.id,
      m.descricao,
      m.proxima_manutencao_data,
      m.proxima_manutencao_km,
      v.id AS veiculo_id,
      v.placa,
      v.modelo,
      v.quilometragem_atual
    FROM manutencoes m
    INNER JOIN veiculos v ON v.id = m.veiculo_id
    WHERE m.status = 'CONCLUIDA'
      AND v.status != 'INATIVO'
      AND (
        (m.proxima_manutencao_data IS NOT NULL AND m.proxima_manutencao_data <= (CURRENT_DATE + INTERVAL '30 days'))
        OR
        (m.proxima_manutencao_km IS NOT NULL AND v.quilometragem_atual >= m.proxima_manutencao_km)
      )
    ORDER BY m.proxima_manutencao_data ASC NULLS LAST
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
};

const getAlertasEntregasPendentes = async (limit = 10) => {
  const sql = `
    SELECT
      e.id,
      e.status,
      e.data_saida,
      e.tentativa_atual,
      v.numero AS venda_numero,
      v.data_entrega_prevista,
      c.nome_razao_social AS cliente_nome
    FROM entregas e
    INNER JOIN vendas v ON v.id = e.venda_id
    INNER JOIN clientes c ON c.id = v.cliente_id
    WHERE e.status IN ('AGUARDANDO_DESPACHO', 'EM_TRANSITO')
    ORDER BY v.data_entrega_prevista ASC NULLS LAST
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
};

module.exports = {
  getResumoVendas,
  getContadoresGerais,
  getMetricasVendas,
  getTopVendedores,
  getMetricasFinanceiro,
  getMetricasEstoque,
  getTopReposicao,
  getSaldoPorLocal,
  getMetricasVendasFuturas,
  getMetricasFrota,
  getSerieTemporalVendas,
  getAlertasEstoqueBaixo,
  getAlertasDuplicatasVencidas,
  getAlertasVendasFuturasProximas,
  getAlertasManutencaoPreventiva,
  getAlertasEntregasPendentes
};
