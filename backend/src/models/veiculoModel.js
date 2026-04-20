const { query } = require("../config/database");

const veiculoSelect = `
  SELECT
    v.id,
    v.placa,
    v.modelo,
    v.marca,
    v.ano_fabricacao,
    v.tipo_veiculo,
    v.capacidade_carga_kg,
    v.quilometragem_atual,
    v.responsavel_usuario_id,
    v.status,
    v.criado_em AS created_at,
    v.atualizado_em AS updated_at,
    u.nome AS responsavel_nome
  FROM veiculos v
  LEFT JOIN usuarios u ON u.id = v.responsavel_usuario_id
`;

const createVeiculo = async (payload) => {
  const result = await query(
    `
      INSERT INTO veiculos (
        placa, modelo, marca, ano_fabricacao, tipo_veiculo,
        capacidade_carga_kg, quilometragem_atual,
        responsavel_usuario_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id, placa, modelo, marca, ano_fabricacao, tipo_veiculo,
        capacidade_carga_kg, quilometragem_atual,
        responsavel_usuario_id, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      payload.placa,
      payload.modelo,
      payload.marca,
      payload.anoFabricacao,
      payload.tipoVeiculo,
      payload.capacidadeCargaKg,
      payload.quilometragemAtual,
      payload.responsavelUsuarioId,
      payload.status || "ATIVO"
    ]
  );

  return result.rows[0];
};

const findVeiculoById = async (veiculoId) => {
  const result = await query(
    `
      ${veiculoSelect}
      WHERE v.id = $1
      LIMIT 1
    `,
    [veiculoId]
  );

  return result.rows[0] || null;
};

const findVeiculoByPlaca = async (placa, excludeId = null) => {
  const result = await query(
    `
      SELECT id, placa
      FROM veiculos
      WHERE placa = $1
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [placa, excludeId]
  );

  return result.rows[0] || null;
};

const listVeiculos = async ({ status, tipoVeiculo, search, limit, offset }) => {
  const result = await query(
    `
      ${veiculoSelect}
      WHERE ($1::varchar IS NULL OR v.status = $1)
        AND ($2::varchar IS NULL OR v.tipo_veiculo = $2)
        AND (
          $3::varchar IS NULL
          OR v.placa ILIKE '%' || $3 || '%'
          OR v.modelo ILIKE '%' || $3 || '%'
          OR COALESCE(v.marca, '') ILIKE '%' || $3 || '%'
        )
      ORDER BY v.placa ASC
      LIMIT $4 OFFSET $5
    `,
    [status, tipoVeiculo, search, limit, offset]
  );

  return result.rows;
};

const countVeiculos = async ({ status, tipoVeiculo, search }) => {
  const result = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM veiculos v
      WHERE ($1::varchar IS NULL OR v.status = $1)
        AND ($2::varchar IS NULL OR v.tipo_veiculo = $2)
        AND (
          $3::varchar IS NULL
          OR v.placa ILIKE '%' || $3 || '%'
          OR v.modelo ILIKE '%' || $3 || '%'
          OR COALESCE(v.marca, '') ILIKE '%' || $3 || '%'
        )
    `,
    [status, tipoVeiculo, search]
  );

  return result.rows[0].total;
};

const listVeiculosByStatus = async (status) => {
  const result = await query(
    `
      ${veiculoSelect}
      WHERE v.status = $1
      ORDER BY v.placa ASC
    `,
    [status]
  );

  return result.rows;
};

const updateVeiculo = async (veiculoId, payload) => {
  const result = await query(
    `
      UPDATE veiculos
      SET
        placa = $2,
        modelo = $3,
        marca = $4,
        ano_fabricacao = $5,
        tipo_veiculo = $6,
        capacidade_carga_kg = $7,
        quilometragem_atual = $8,
        responsavel_usuario_id = $9,
        status = $10,
        atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, placa, modelo, marca, ano_fabricacao, tipo_veiculo,
        capacidade_carga_kg, quilometragem_atual,
        responsavel_usuario_id, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [
      veiculoId,
      payload.placa,
      payload.modelo,
      payload.marca,
      payload.anoFabricacao,
      payload.tipoVeiculo,
      payload.capacidadeCargaKg,
      payload.quilometragemAtual,
      payload.responsavelUsuarioId,
      payload.status
    ]
  );

  return result.rows[0] || null;
};

const updateVeiculoStatus = async (veiculoId, status) => {
  const result = await query(
    `
      UPDATE veiculos
      SET status = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING
        id, placa, modelo, marca, ano_fabricacao, tipo_veiculo,
        capacidade_carga_kg, quilometragem_atual,
        responsavel_usuario_id, status,
        criado_em AS created_at,
        atualizado_em AS updated_at
    `,
    [veiculoId, status]
  );

  return result.rows[0] || null;
};

const updateVeiculoQuilometragem = async (veiculoId, quilometragem) => {
  const result = await query(
    `
      UPDATE veiculos
      SET quilometragem_atual = $2, atualizado_em = NOW()
      WHERE id = $1
      RETURNING id, quilometragem_atual
    `,
    [veiculoId, quilometragem]
  );

  return result.rows[0] || null;
};

const findUsuarioById = async (usuarioId) => {
  const result = await query(
    `
      SELECT id, nome, status FROM usuarios WHERE id = $1 LIMIT 1
    `,
    [usuarioId]
  );

  return result.rows[0] || null;
};

const getHistoricoVeiculo = async (veiculoId) => {
  const manutencoes = await query(
    `
      SELECT
        m.id, m.tipo_manutencao, m.descricao, m.data_manutencao,
        m.quilometragem_registrada, m.custo, m.status,
        m.proxima_manutencao_data, m.proxima_manutencao_km,
        m.criado_em AS created_at,
        f.razao_social AS fornecedor_razao_social
      FROM manutencoes m
      LEFT JOIN fornecedores f ON f.id = m.fornecedor_id
      WHERE m.veiculo_id = $1
      ORDER BY m.data_manutencao DESC, m.criado_em DESC
    `,
    [veiculoId]
  );

  const entregas = await query(
    `
      SELECT
        e.id AS entrega_id,
        e.venda_id,
        e.status AS entrega_status,
        e.data_saida,
        e.data_entrega_realizada,
        fr.id AS frete_id,
        fr.modalidade,
        fr.distancia_km,
        fr.valor_real,
        v.numero AS venda_numero
      FROM fretes fr
      INNER JOIN entregas e ON e.frete_id = fr.id
      INNER JOIN vendas v ON v.id = e.venda_id
      WHERE fr.veiculo_id = $1
      ORDER BY e.data_saida DESC NULLS LAST, e.criado_em DESC
    `,
    [veiculoId]
  );

  return {
    manutencoes: manutencoes.rows,
    entregas: entregas.rows
  };
};

const getResumoFrota = async () => {
  const result = await query(
    `
      SELECT
        COUNT(*)::integer AS total_veiculos,
        COUNT(*) FILTER (WHERE status = 'ATIVO')::integer AS total_ativos,
        COUNT(*) FILTER (WHERE status = 'MANUTENCAO')::integer AS total_em_manutencao,
        COUNT(*) FILTER (WHERE status = 'INATIVO')::integer AS total_inativos
      FROM veiculos
    `
  );

  return result.rows[0];
};

module.exports = {
  createVeiculo,
  findVeiculoById,
  findVeiculoByPlaca,
  listVeiculos,
  countVeiculos,
  listVeiculosByStatus,
  updateVeiculo,
  updateVeiculoStatus,
  updateVeiculoQuilometragem,
  findUsuarioById,
  getHistoricoVeiculo,
  getResumoFrota
};
