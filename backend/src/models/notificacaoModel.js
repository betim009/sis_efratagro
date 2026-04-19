const { query } = require("../config/database");

// ─── SELECT base ────────────────────────────────────────────────────

const notificacaoSelect = `
  SELECT
    n.id,
    n.usuario_id,
    u.nome AS usuario_nome,
    n.tipo,
    n.titulo,
    n.mensagem,
    n.prioridade,
    n.status,
    n.entidade,
    n.entidade_id,
    n.metadata,
    n.lida_em,
    n.criado_em AS created_at,
    n.atualizado_em AS updated_at
  FROM notificacoes n
  LEFT JOIN usuarios u ON u.id = n.usuario_id
`;

// ─── CREATE ─────────────────────────────────────────────────────────

const create = async ({
  usuarioId,
  tipo,
  titulo,
  mensagem,
  prioridade,
  entidade,
  entidadeId,
  metadata
}) => {
  const result = await query(
    `
      INSERT INTO notificacoes (
        usuario_id, tipo, titulo, mensagem, prioridade,
        entidade, entidade_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id, usuario_id, tipo, titulo, mensagem, prioridade,
        status, entidade, entidade_id, metadata, lida_em,
        criado_em AS created_at, atualizado_em AS updated_at
    `,
    [
      usuarioId,
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade,
      entidadeId,
      metadata ? JSON.stringify(metadata) : null
    ]
  );

  return result.rows[0];
};

// ─── FIND BY ID ─────────────────────────────────────────────────────

const findById = async (id) => {
  const result = await query(`${notificacaoSelect} WHERE n.id = $1`, [id]);
  return result.rows[0] || null;
};

// ─── LIST COM FILTROS DINÂMICOS ─────────────────────────────────────

const listByUsuario = async (usuarioId, filters) => {
  const conditions = ["n.usuario_id = $1"];
  const params = [usuarioId];
  let idx = 2;

  if (filters.tipo) {
    conditions.push(`n.tipo = $${idx++}`);
    params.push(filters.tipo);
  }

  if (filters.status) {
    conditions.push(`n.status = $${idx++}`);
    params.push(filters.status);
  }

  if (filters.prioridade) {
    conditions.push(`n.prioridade = $${idx++}`);
    params.push(filters.prioridade);
  }

  if (filters.dataInicio) {
    conditions.push(`n.criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`n.criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const dataQuery = `
    ${notificacaoSelect}
    ${where}
    ORDER BY
      CASE n.prioridade
        WHEN 'CRITICA' THEN 1
        WHEN 'ALTA' THEN 2
        WHEN 'MEDIA' THEN 3
        WHEN 'BAIXA' THEN 4
      END,
      n.criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM notificacoes n ${where}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return {
    notificacoes: dataResult.rows,
    total: Number(countResult.rows[0].total)
  };
};

// ─── LIST ALL (admin) ───────────────────────────────────────────────

const listAll = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.tipo) {
    conditions.push(`n.tipo = $${idx++}`);
    params.push(filters.tipo);
  }

  if (filters.status) {
    conditions.push(`n.status = $${idx++}`);
    params.push(filters.status);
  }

  if (filters.prioridade) {
    conditions.push(`n.prioridade = $${idx++}`);
    params.push(filters.prioridade);
  }

  if (filters.dataInicio) {
    conditions.push(`n.criado_em >= $${idx++}`);
    params.push(filters.dataInicio);
  }

  if (filters.dataFim) {
    conditions.push(`n.criado_em <= ($${idx++}::date + INTERVAL '1 day')`);
    params.push(filters.dataFim);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    ${notificacaoSelect}
    ${where}
    ORDER BY n.criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM notificacoes n ${where}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return {
    notificacoes: dataResult.rows,
    total: Number(countResult.rows[0].total)
  };
};

// ─── CONTAGEM DE NÃO LIDAS ─────────────────────────────────────────

const countNaoLidas = async (usuarioId) => {
  const result = await query(
    `SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = $1 AND status = 'NAO_LIDA'`,
    [usuarioId]
  );
  return Number(result.rows[0].total);
};

// ─── MARCAR COMO LIDA ──────────────────────────────────────────────

const marcarLida = async (id) => {
  const result = await query(
    `
      UPDATE notificacoes
      SET status = 'LIDA', lida_em = NOW(), atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, usuario_id, tipo, titulo, mensagem, prioridade,
        status, entidade, entidade_id, metadata, lida_em,
        criado_em AS created_at, atualizado_em AS updated_at
    `,
    [id]
  );
  return result.rows[0] || null;
};

// ─── MARCAR TODAS COMO LIDAS ────────────────────────────────────────

const marcarTodasLidas = async (usuarioId) => {
  const result = await query(
    `
      UPDATE notificacoes
      SET status = 'LIDA', lida_em = NOW(), atualizado_em = NOW()
      WHERE usuario_id = $1 AND status = 'NAO_LIDA'
    `,
    [usuarioId]
  );
  return result.rowCount;
};

// ─── ARQUIVAR ───────────────────────────────────────────────────────
// Decisão: suportar status ARQUIVADA permite ao usuário limpar a inbox
// sem perder histórico. Notificações arquivadas não contam no badge
// e ficam disponíveis para auditoria/consulta administrativa.

const arquivar = async (id) => {
  const result = await query(
    `
      UPDATE notificacoes
      SET status = 'ARQUIVADA', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, usuario_id, tipo, titulo, mensagem, prioridade,
        status, entidade, entidade_id, metadata, lida_em,
        criado_em AS created_at, atualizado_em AS updated_at
    `,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  create,
  findById,
  listByUsuario,
  listAll,
  countNaoLidas,
  marcarLida,
  marcarTodasLidas,
  arquivar
};
