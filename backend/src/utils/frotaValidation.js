const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_TIPOS_VEICULO = ["CAMINHAO", "VAN", "UTILITARIO", "MOTO", "CARRO"];
const VALID_STATUS_VEICULO = ["ATIVO", "MANUTENCAO", "INATIVO"];
const VALID_TIPOS_MANUTENCAO = ["PREVENTIVA", "CORRETIVA"];
const VALID_STATUS_MANUTENCAO = ["AGENDADA", "EM_EXECUCAO", "CONCLUIDA", "CANCELADA"];

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

const sanitizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new AppError(`${fieldName} invalido`, 400);
  }

  return parsed;
};

const validateUuid = (value, fieldName = "id") => {
  if (!UUID_PATTERN.test(String(value || ""))) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
};

// ─── Veículo ────────────────────────────────────────────────────────

const parseVeiculoPayload = (payload) => {
  const placa = sanitizeString(payload.placa);
  const modelo = sanitizeString(payload.modelo);
  const marca = sanitizeString(payload.marca);
  const anoFabricacao = sanitizeNumber(payload.ano_fabricacao, "Ano de fabricacao");
  const tipoVeiculo = sanitizeString(payload.tipo_veiculo);
  const capacidadeCargaKg = sanitizeNumber(payload.capacidade_carga_kg, "Capacidade de carga");
  const quilometragemAtual = sanitizeNumber(payload.quilometragem_atual, "Quilometragem atual");
  const responsavelUsuarioId = sanitizeString(payload.responsavel_usuario_id);
  const status = sanitizeString(payload.status);

  if (!placa) {
    throw new AppError("Placa obrigatoria", 400);
  }

  if (!modelo) {
    throw new AppError("Modelo obrigatorio", 400);
  }

  if (!tipoVeiculo) {
    throw new AppError("Tipo do veiculo obrigatorio", 400);
  }

  if (!VALID_TIPOS_VEICULO.includes(tipoVeiculo)) {
    throw new AppError(
      `Tipo de veiculo invalido. Valores aceitos: ${VALID_TIPOS_VEICULO.join(", ")}`,
      400
    );
  }

  if (anoFabricacao !== null) {
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(anoFabricacao) || anoFabricacao < 1900 || anoFabricacao > currentYear + 1) {
      throw new AppError("Ano de fabricacao invalido", 400);
    }
  }

  if (capacidadeCargaKg !== null && capacidadeCargaKg < 0) {
    throw new AppError("Capacidade de carga deve ser maior ou igual a zero", 400);
  }

  if (quilometragemAtual !== null && quilometragemAtual < 0) {
    throw new AppError("Quilometragem atual deve ser maior ou igual a zero", 400);
  }

  if (responsavelUsuarioId) {
    validateUuid(responsavelUsuarioId, "responsavel_usuario_id");
  }

  if (status && !VALID_STATUS_VEICULO.includes(status)) {
    throw new AppError(
      `Status de veiculo invalido. Valores aceitos: ${VALID_STATUS_VEICULO.join(", ")}`,
      400
    );
  }

  return {
    placa: placa.toUpperCase(),
    modelo,
    marca,
    anoFabricacao,
    tipoVeiculo,
    capacidadeCargaKg: capacidadeCargaKg || 0,
    quilometragemAtual: quilometragemAtual || 0,
    responsavelUsuarioId,
    status: status || "ATIVO"
  };
};

const parseVeiculoStatusPayload = (payload) => {
  const status = sanitizeString(payload.status);

  if (!status) {
    throw new AppError("Status obrigatorio", 400);
  }

  if (!VALID_STATUS_VEICULO.includes(status)) {
    throw new AppError(
      `Status de veiculo invalido. Valores aceitos: ${VALID_STATUS_VEICULO.join(", ")}`,
      400
    );
  }

  return { status };
};

// ─── Manutenção ─────────────────────────────────────────────────────

const parseManutencaoPayload = (payload) => {
  const veiculoId = sanitizeString(payload.veiculo_id);
  const fornecedorId = sanitizeString(payload.fornecedor_id);
  const tipoManutencao = sanitizeString(payload.tipo_manutencao);
  const descricao = sanitizeString(payload.descricao);
  const dataManutencao = sanitizeString(payload.data_manutencao);
  const proximaManutencaoData = sanitizeString(payload.proxima_manutencao_data);
  const proximaManutencaoKm = sanitizeNumber(payload.proxima_manutencao_km, "Proxima manutencao km");
  const quilometragemRegistrada = sanitizeNumber(payload.quilometragem_registrada, "Quilometragem registrada");
  const custo = sanitizeNumber(payload.custo, "Custo");
  const status = sanitizeString(payload.status);

  if (!veiculoId) {
    throw new AppError("veiculo_id obrigatorio", 400);
  }

  validateUuid(veiculoId, "veiculo_id");

  if (!tipoManutencao) {
    throw new AppError("tipo_manutencao obrigatorio", 400);
  }

  if (!VALID_TIPOS_MANUTENCAO.includes(tipoManutencao)) {
    throw new AppError(
      `Tipo de manutencao invalido. Valores aceitos: ${VALID_TIPOS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  if (!descricao) {
    throw new AppError("Descricao obrigatoria", 400);
  }

  if (!dataManutencao) {
    throw new AppError("data_manutencao obrigatoria", 400);
  }

  if (Number.isNaN(Date.parse(dataManutencao))) {
    throw new AppError("data_manutencao invalida", 400);
  }

  if (proximaManutencaoData && Number.isNaN(Date.parse(proximaManutencaoData))) {
    throw new AppError("proxima_manutencao_data invalida", 400);
  }

  if (proximaManutencaoKm !== null && proximaManutencaoKm < 0) {
    throw new AppError("proxima_manutencao_km deve ser maior ou igual a zero", 400);
  }

  if (quilometragemRegistrada !== null && quilometragemRegistrada < 0) {
    throw new AppError("quilometragem_registrada deve ser maior ou igual a zero", 400);
  }

  if (custo !== null && custo < 0) {
    throw new AppError("Custo deve ser maior ou igual a zero", 400);
  }

  if (fornecedorId) {
    validateUuid(fornecedorId, "fornecedor_id");
  }

  if (status && !VALID_STATUS_MANUTENCAO.includes(status)) {
    throw new AppError(
      `Status de manutencao invalido. Valores aceitos: ${VALID_STATUS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  return {
    veiculoId,
    fornecedorId,
    tipoManutencao,
    descricao,
    dataManutencao,
    proximaManutencaoData,
    proximaManutencaoKm,
    quilometragemRegistrada,
    custo: custo || 0,
    status: status || "AGENDADA"
  };
};

const parseManutencaoUpdatePayload = (payload) => {
  const fornecedorId = sanitizeString(payload.fornecedor_id);
  const tipoManutencao = sanitizeString(payload.tipo_manutencao);
  const descricao = sanitizeString(payload.descricao);
  const dataManutencao = sanitizeString(payload.data_manutencao);
  const proximaManutencaoData = sanitizeString(payload.proxima_manutencao_data);
  const proximaManutencaoKm = sanitizeNumber(payload.proxima_manutencao_km, "Proxima manutencao km");
  const quilometragemRegistrada = sanitizeNumber(payload.quilometragem_registrada, "Quilometragem registrada");
  const custo = sanitizeNumber(payload.custo, "Custo");
  const status = sanitizeString(payload.status);

  if (!tipoManutencao) {
    throw new AppError("tipo_manutencao obrigatorio", 400);
  }

  if (!VALID_TIPOS_MANUTENCAO.includes(tipoManutencao)) {
    throw new AppError(
      `Tipo de manutencao invalido. Valores aceitos: ${VALID_TIPOS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  if (!descricao) {
    throw new AppError("Descricao obrigatoria", 400);
  }

  if (!dataManutencao) {
    throw new AppError("data_manutencao obrigatoria", 400);
  }

  if (Number.isNaN(Date.parse(dataManutencao))) {
    throw new AppError("data_manutencao invalida", 400);
  }

  if (proximaManutencaoData && Number.isNaN(Date.parse(proximaManutencaoData))) {
    throw new AppError("proxima_manutencao_data invalida", 400);
  }

  if (proximaManutencaoKm !== null && proximaManutencaoKm < 0) {
    throw new AppError("proxima_manutencao_km deve ser maior ou igual a zero", 400);
  }

  if (quilometragemRegistrada !== null && quilometragemRegistrada < 0) {
    throw new AppError("quilometragem_registrada deve ser maior ou igual a zero", 400);
  }

  if (custo !== null && custo < 0) {
    throw new AppError("Custo deve ser maior ou igual a zero", 400);
  }

  if (fornecedorId) {
    validateUuid(fornecedorId, "fornecedor_id");
  }

  if (status && !VALID_STATUS_MANUTENCAO.includes(status)) {
    throw new AppError(
      `Status de manutencao invalido. Valores aceitos: ${VALID_STATUS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  return {
    fornecedorId,
    tipoManutencao,
    descricao,
    dataManutencao,
    proximaManutencaoData,
    proximaManutencaoKm,
    quilometragemRegistrada,
    custo: custo || 0,
    status: status || "AGENDADA"
  };
};

const parseManutencaoStatusPayload = (payload) => {
  const status = sanitizeString(payload.status);

  if (!status) {
    throw new AppError("Status obrigatorio", 400);
  }

  if (!VALID_STATUS_MANUTENCAO.includes(status)) {
    throw new AppError(
      `Status de manutencao invalido. Valores aceitos: ${VALID_STATUS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  return { status };
};

// ─── Filtros de listagem ────────────────────────────────────────────

const parseListVeiculosFilters = (queryParams) => {
  const status = sanitizeString(queryParams.status);
  const tipoVeiculo = sanitizeString(queryParams.tipo_veiculo);
  const search = sanitizeString(queryParams.search);
  const page = Number(queryParams.page || 1);
  const limit = Number(queryParams.limit || 10);

  if (status && !VALID_STATUS_VEICULO.includes(status)) {
    throw new AppError(
      `Filtro de status invalido. Valores aceitos: ${VALID_STATUS_VEICULO.join(", ")}`,
      400
    );
  }

  if (tipoVeiculo && !VALID_TIPOS_VEICULO.includes(tipoVeiculo)) {
    throw new AppError(
      `Filtro de tipo invalido. Valores aceitos: ${VALID_TIPOS_VEICULO.join(", ")}`,
      400
    );
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Parametro limit invalido", 400);
  }

  return {
    status,
    tipoVeiculo,
    search,
    page,
    limit,
    offset: (page - 1) * limit
  };
};

const parseListManutencoesFilters = (queryParams) => {
  const veiculoId = sanitizeString(queryParams.veiculo_id);
  const tipoManutencao = sanitizeString(queryParams.tipo_manutencao);
  const status = sanitizeString(queryParams.status);
  const dataInicio = sanitizeString(queryParams.data_inicio);
  const dataFim = sanitizeString(queryParams.data_fim);
  const search = sanitizeString(queryParams.search);
  const page = Number(queryParams.page || 1);
  const limit = Number(queryParams.limit || 10);

  if (veiculoId) {
    validateUuid(veiculoId, "veiculo_id");
  }

  if (tipoManutencao && !VALID_TIPOS_MANUTENCAO.includes(tipoManutencao)) {
    throw new AppError(
      `Filtro de tipo invalido. Valores aceitos: ${VALID_TIPOS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  if (status && !VALID_STATUS_MANUTENCAO.includes(status)) {
    throw new AppError(
      `Filtro de status invalido. Valores aceitos: ${VALID_STATUS_MANUTENCAO.join(", ")}`,
      400
    );
  }

  if (dataInicio && Number.isNaN(Date.parse(dataInicio))) {
    throw new AppError("data_inicio invalida", 400);
  }

  if (dataFim && Number.isNaN(Date.parse(dataFim))) {
    throw new AppError("data_fim invalida", 400);
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Parametro limit invalido", 400);
  }

  return {
    veiculoId,
    tipoManutencao,
    status,
    dataInicio,
    dataFim,
    search,
    page,
    limit,
    offset: (page - 1) * limit
  };
};

// ─── Mappers de resposta ────────────────────────────────────────────

const mapVeiculoResponse = (veiculo) => ({
  id: veiculo.id,
  placa: veiculo.placa,
  modelo: veiculo.modelo,
  marca: veiculo.marca,
  ano_fabricacao: veiculo.ano_fabricacao,
  tipo_veiculo: veiculo.tipo_veiculo,
  capacidade_carga_kg: veiculo.capacidade_carga_kg,
  quilometragem_atual: veiculo.quilometragem_atual,
  responsavel_usuario_id: veiculo.responsavel_usuario_id,
  responsavel: veiculo.responsavel_nome
    ? {
        id: veiculo.responsavel_usuario_id,
        nome: veiculo.responsavel_nome
      }
    : null,
  status: veiculo.status,
  created_at: veiculo.created_at,
  updated_at: veiculo.updated_at
});

const mapManutencaoResponse = (manutencao) => ({
  id: manutencao.id,
  veiculo_id: manutencao.veiculo_id,
  fornecedor_id: manutencao.fornecedor_id,
  tipo_manutencao: manutencao.tipo_manutencao,
  descricao: manutencao.descricao,
  data_manutencao: manutencao.data_manutencao,
  proxima_manutencao_data: manutencao.proxima_manutencao_data,
  proxima_manutencao_km: manutencao.proxima_manutencao_km,
  quilometragem_registrada: manutencao.quilometragem_registrada,
  custo: manutencao.custo,
  status: manutencao.status,
  veiculo: manutencao.veiculo_placa
    ? {
        id: manutencao.veiculo_id,
        placa: manutencao.veiculo_placa,
        modelo: manutencao.veiculo_modelo
      }
    : null,
  fornecedor: manutencao.fornecedor_razao_social
    ? {
        id: manutencao.fornecedor_id,
        razao_social: manutencao.fornecedor_razao_social
      }
    : null,
  created_at: manutencao.created_at,
  updated_at: manutencao.updated_at
});

module.exports = {
  VALID_TIPOS_VEICULO,
  VALID_STATUS_VEICULO,
  VALID_TIPOS_MANUTENCAO,
  VALID_STATUS_MANUTENCAO,
  validateUuid,
  parseVeiculoPayload,
  parseVeiculoStatusPayload,
  parseManutencaoPayload,
  parseManutencaoUpdatePayload,
  parseManutencaoStatusPayload,
  parseListVeiculosFilters,
  parseListManutencoesFilters,
  mapVeiculoResponse,
  mapManutencaoResponse
};
