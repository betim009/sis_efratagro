const { query } = require("../config/database");

const baseSelect = `
  SELECT
    le.id,
    le.public_id,
    le.nome,
    le.codigo,
    le.descricao,
    le.tipo_local,
    le.endereco_referencia,
    le.status,
    le.criado_em AS created_at,
    le.atualizado_em AS updated_at
  FROM locais_estoque le
`;

const createLocal = async (payload) => {
  const result = await query(
    `
      INSERT INTO locais_estoque (
        nome,
        codigo,
        descricao,
        tipo_local,
        endereco_referencia,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        public_id,
        nome,
        codigo,
        descricao,
        tipo_local,
        endereco_referencia,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.nome,
      payload.codigo,
      payload.descricao,
      payload.tipoLocal,
      payload.enderecoReferencia,
      payload.status
    ]
  );

  return result.rows[0];
};

const updateLocal = async (localId, payload) => {
  const result = await query(
    `
      UPDATE locais_estoque
      SET
        nome = $2,
        codigo = $3,
        descricao = $4,
        tipo_local = $5,
        endereco_referencia = $6,
        status = $7,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        public_id,
        nome,
        codigo,
        descricao,
        tipo_local,
        endereco_referencia,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      localId,
      payload.nome,
      payload.codigo,
      payload.descricao,
      payload.tipoLocal,
      payload.enderecoReferencia,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const inactivateLocal = async (localId) => {
  const result = await query(
    `
      UPDATE locais_estoque
      SET status = 'INATIVO', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id,
        public_id,
        nome,
        codigo,
        descricao,
        tipo_local,
        endereco_referencia,
        status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [localId]
  );

  return result.rows[0] || null;
};

const findLocalById = async (localId) => {
  const result = await query(
    `
      ${baseSelect}
      WHERE le.id = $1
      LIMIT 1
    `,
    [localId]
  );

  return result.rows[0] || null;
};

const findLocalByPublicId = async (publicId) => {
  const result = await query(
    `
      ${baseSelect}
      WHERE le.public_id = $1
      LIMIT 1
    `,
    [publicId]
  );

  return result.rows[0] || null;
};

const findLocalByIdentifier = async (identifier) => {
  if (identifier === undefined || identifier === null || identifier === "") {
    return null;
  }

  const raw = String(identifier).trim();

  if (/^\d+$/.test(raw)) {
    return findLocalByPublicId(Number(raw));
  }

  return findLocalById(raw);
};

const findLocalByCodigo = async (codigo, excludeId = null) => {
  const result = await query(
    `
      SELECT id, codigo
      FROM locais_estoque
      WHERE codigo = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [codigo, excludeId]
  );

  return result.rows[0] || null;
};

const listLocais = async ({ status, search, limit, offset, includeInactive }) => {
  const result = await query(
    `
      ${baseSelect}
      WHERE (
        ($1::varchar IS NOT NULL AND le.status = $1)
        OR (
          $1::varchar IS NULL
          AND ($4::boolean = TRUE OR le.status <> 'INATIVO')
        )
      )
      AND (
        $2::varchar IS NULL
        OR le.nome ILIKE '%' || $2 || '%'
        OR le.codigo ILIKE '%' || $2 || '%'
        OR COALESCE(le.descricao, '') ILIKE '%' || $2 || '%'
        OR COALESCE(le.endereco_referencia, '') ILIKE '%' || $2 || '%'
      )
      ORDER BY le.nome ASC
      LIMIT $3 OFFSET $5
    `,
    [status, search, limit, includeInactive, offset]
  );

  return result.rows;
};

const countLocais = async ({ status, search, includeInactive }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM locais_estoque le
      WHERE (
        ($1::varchar IS NOT NULL AND le.status = $1)
        OR (
          $1::varchar IS NULL
          AND ($3::boolean = TRUE OR le.status <> 'INATIVO')
        )
      )
      AND (
        $2::varchar IS NULL
        OR le.nome ILIKE '%' || $2 || '%'
        OR le.codigo ILIKE '%' || $2 || '%'
        OR COALESCE(le.descricao, '') ILIKE '%' || $2 || '%'
        OR COALESCE(le.endereco_referencia, '') ILIKE '%' || $2 || '%'
      )
    `,
    [status, search, includeInactive]
  );

  return result.rows[0].total;
};

module.exports = {
  createLocal,
  updateLocal,
  inactivateLocal,
  findLocalById,
  findLocalByPublicId,
  findLocalByIdentifier,
  findLocalByCodigo,
  listLocais,
  countLocais
};
