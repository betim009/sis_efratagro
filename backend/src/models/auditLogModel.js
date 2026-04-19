const { query } = require("../config/database");

// ─── SELECT base para consultas ────────────────────────────────────

const logSelect = `
  SELECT
    la.id,
    la.usuario_id,
    u.nome AS usuario_nome,
    u.email AS usuario_email,
    la.tabela_nome,
    la.registro_id,
    la.acao,
    la.dados_anteriores,
    la.dados_novos,
    la.descricao,
    la.ip_origem,
    la.user_agent,
    la.criado_em AS created_at
  FROM logs_auditoria la
  LEFT JOIN usuarios u ON u.id = la.usuario_id
`;

// ─── CREATE (compatível com todos os services existentes) ──────────
// Decisão: manter a assinatura original { userId, tableName, recordId, action, previousData, newData, ipAddress, userAgent }
// e adicionar campo opcional "descricao" para contexto legível.
// Se o log falhar, o erro é logado no console mas NÃO quebra o fluxo principal.

const createAuditLog = async ({
  userId = null,
  tableName,
  recordId = null,
  action,
  previousData = null,
  newData = null,
  ipAddress = null,
  userAgent = null,
  descricao = null
}) => {
  try {
    const result = await query(
      `
        INSERT INTO logs_auditoria (
          usuario_id,
          tabela_nome,
          registro_id,
          acao,
          dados_anteriores,
          dados_novos,
          descricao,
          ip_origem,
          user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, criado_em AS created_at
      `,
      [
        userId,
        tableName,
        recordId,
        action,
        previousData ? JSON.stringify(previousData) : null,
        newData ? JSON.stringify(newData) : null,
        descricao,
        ipAddress,
        userAgent
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("[auditoria] Falha ao registrar log:", error.message);
    return null;
  }
};

// ─── FIND BY ID ────────────────────────────────────────────────────

const findById = async (id) => {
  const result = await query(`${logSelect} WHERE la.id = $1`, [id]);
  return result.rows[0] || null;
};

// ─── LIST COM FILTROS DINÂMICOS ────────────────────────────────────

const listLogs = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.usuarioId) {
    conditions.push(`la.usuario_id = $${idx++}`);
    params.push(filters.usuarioId);
  }

  if (filters.modulo) {
    conditions.push(`la.tabela_nome = $${idx++}`);
    params.push(filters.modulo);
  }

  if (filters.entidade) {
    conditions.push(`la.tabela_nome = $${idx++}`);
    params.push(filters.entidade);
  }

  if (filters.entidadeId) {
    conditions.push(`la.registro_id = $${idx++}`);
    params.push(filters.entidadeId);
  }

  if (filters.acao) {
    conditions.push(`la.acao = $${idx++}`);
    params.push(filters.acao);
  }

  if (filters.dataInicio) {
    conditions.push(`la.criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`la.criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    ${logSelect}
    ${where}
    ORDER BY la.criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM logs_auditoria la ${where}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return {
    logs: dataResult.rows,
    total: Number(countResult.rows[0].total)
  };
};

// ─── MÉTRICAS PARA RELATÓRIOS ──────────────────────────────────────

const getMetricas = async (filters) => {
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
        COUNT(*) AS total_logs,
        COUNT(DISTINCT usuario_id) AS usuarios_distintos,
        COUNT(DISTINCT tabela_nome) AS modulos_distintos
      FROM logs_auditoria
      ${where}
    `,
    params
  );

  const porAcao = await query(
    `
      SELECT acao, COUNT(*) AS total
      FROM logs_auditoria
      ${where}
      GROUP BY acao
      ORDER BY total DESC
    `,
    params
  );

  const porModulo = await query(
    `
      SELECT tabela_nome AS modulo, COUNT(*) AS total
      FROM logs_auditoria
      ${where}
      GROUP BY tabela_nome
      ORDER BY total DESC
      LIMIT 20
    `,
    params
  );

  return {
    resumo: result.rows[0],
    por_acao: porAcao.rows,
    por_modulo: porModulo.rows
  };
};

module.exports = {
  createAuditLog,
  findById,
  listLogs,
  getMetricas
};
