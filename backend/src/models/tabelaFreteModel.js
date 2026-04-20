const { query } = require("../config/database");

const tabelaSelect = `
  SELECT
    id,
    nome,
    tipo_calculo,
    regiao,
    peso_minimo,
    peso_maximo,
    distancia_minima,
    distancia_maxima,
    valor_base,
    valor_por_kg,
    valor_por_km,
    valor_fixo,
    status,
    observacao,
    criado_em AS created_at,
    atualizado_em AS updated_at
  FROM tabelas_frete
`;

// ─── CREATE ─────────────────────────────────────────────────────────

const createTabela = async (payload) => {
  const result = await query(
    `
      INSERT INTO tabelas_frete (
        nome, tipo_calculo, regiao,
        peso_minimo, peso_maximo,
        distancia_minima, distancia_maxima,
        valor_base, valor_por_kg, valor_por_km, valor_fixo,
        observacao
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING
        id, nome, tipo_calculo, regiao,
        peso_minimo, peso_maximo,
        distancia_minima, distancia_maxima,
        valor_base, valor_por_kg, valor_por_km, valor_fixo,
        status, observacao,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.nome,
      payload.tipoCalculo,
      payload.regiao,
      payload.pesoMinimo,
      payload.pesoMaximo,
      payload.distanciaMinima,
      payload.distanciaMaxima,
      payload.valorBase,
      payload.valorPorKg,
      payload.valorPorKm,
      payload.valorFixo,
      payload.observacao
    ]
  );

  return result.rows[0];
};

// ─── FIND BY ID ─────────────────────────────────────────────────────

const findById = async (id) => {
  const result = await query(`${tabelaSelect} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

// ─── LIST ───────────────────────────────────────────────────────────

const listTabelas = async (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }

  if (filters.tipoCalculo) {
    conditions.push(`tipo_calculo = $${idx++}`);
    params.push(filters.tipoCalculo);
  }

  if (filters.regiao) {
    conditions.push(`LOWER(regiao) LIKE $${idx++}`);
    params.push(`%${filters.regiao.toLowerCase()}%`);
  }

  if (filters.search) {
    conditions.push(`LOWER(nome) LIKE $${idx++}`);
    params.push(`%${filters.search.toLowerCase()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    ${tabelaSelect}
    ${where}
    ORDER BY criado_em DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(filters.limit, filters.offset);

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM tabelas_frete ${where}`;

  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams)
  ]);

  return {
    tabelas: dataResult.rows,
    total: Number(countResult.rows[0].total)
  };
};

// ─── UPDATE ─────────────────────────────────────────────────────────

const updateTabela = async (id, payload) => {
  const result = await query(
    `
      UPDATE tabelas_frete
      SET
        nome = $1,
        tipo_calculo = $2,
        regiao = $3,
        peso_minimo = $4,
        peso_maximo = $5,
        distancia_minima = $6,
        distancia_maxima = $7,
        valor_base = $8,
        valor_por_kg = $9,
        valor_por_km = $10,
        valor_fixo = $11,
        observacao = $12,
        atualizado_em = NOW()
      WHERE id = $13
      RETURNING
        id, nome, tipo_calculo, regiao,
        peso_minimo, peso_maximo,
        distancia_minima, distancia_maxima,
        valor_base, valor_por_kg, valor_por_km, valor_fixo,
        status, observacao,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.nome,
      payload.tipoCalculo,
      payload.regiao,
      payload.pesoMinimo,
      payload.pesoMaximo,
      payload.distanciaMinima,
      payload.distanciaMaxima,
      payload.valorBase,
      payload.valorPorKg,
      payload.valorPorKm,
      payload.valorFixo,
      payload.observacao,
      id
    ]
  );

  return result.rows[0] || null;
};

// ─── INATIVAR ───────────────────────────────────────────────────────

const inativarTabela = async (id) => {
  const result = await query(
    `
      UPDATE tabelas_frete
      SET status = 'INATIVA', atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, nome, tipo_calculo, regiao, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [id]
  );

  return result.rows[0] || null;
};

// ─── BUSCAR TABELA ATIVA POR REGIÃO ────────────────────────────────

const findAtivaPorRegiao = async (regiao) => {
  const result = await query(
    `${tabelaSelect} WHERE status = 'ATIVA' AND LOWER(regiao) = LOWER($1) ORDER BY criado_em DESC LIMIT 1`,
    [regiao]
  );
  return result.rows[0] || null;
};

// ─── BUSCAR MELHOR TABELA ATIVA POR TIPO ───────────────────────────

const findAtivaByTipoCalculo = async (tipoCalculo) => {
  const result = await query(
    `${tabelaSelect} WHERE status = 'ATIVA' AND tipo_calculo = $1 ORDER BY criado_em DESC LIMIT 1`,
    [tipoCalculo]
  );
  return result.rows[0] || null;
};

module.exports = {
  createTabela,
  findById,
  listTabelas,
  updateTabela,
  inativarTabela,
  findAtivaPorRegiao,
  findAtivaByTipoCalculo
};
