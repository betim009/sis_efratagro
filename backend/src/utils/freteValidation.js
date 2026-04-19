const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_TIPOS_CALCULO = ["POR_REGIAO", "POR_PESO", "POR_DISTANCIA", "HIBRIDO"];
const VALID_STATUS_TABELA = ["ATIVA", "INATIVA"];
const VALID_MODALIDADES = ["PROPRIO", "TERCEIRO"];
const VALID_STATUS_FRETE = ["CALCULADO", "VINCULADO", "EM_TRANSITO", "CONCLUIDO", "CANCELADO"];
const VALID_TIPOS_CALCULO_FRETE = [...VALID_TIPOS_CALCULO, "MANUAL"];

// ─── Helpers ────────────────────────────────────────────────────────

const sanitizeString = (value) => {
  if (value === undefined || value === null) return null;
  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

const sanitizeNumber = (value, fieldName, { allowNull = false, min = 0 } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (allowNull) return null;
    return 0;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < min) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
  return parsed;
};

const validateUuid = (value, fieldName = "id") => {
  if (!UUID_PATTERN.test(String(value || ""))) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
  return value;
};

const validateEnum = (value, validValues, fieldName) => {
  const upper = String(value).toUpperCase();
  if (!validValues.includes(upper)) {
    throw new AppError(
      `${fieldName} invalido. Use: ${validValues.join(", ")}`,
      400
    );
  }
  return upper;
};

const validateDate = (value, fieldName) => {
  if (!DATE_PATTERN.test(value)) {
    throw new AppError(`${fieldName} invalida. Use o formato YYYY-MM-DD`, 400);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} invalida`, 400);
  }
  return value;
};

// ─── Parse Tabela de Frete ──────────────────────────────────────────

const parseTabelaFretePayload = (payload) => {
  const nome = sanitizeString(payload.nome);
  if (!nome) {
    throw new AppError("Nome da tabela de frete obrigatorio", 400);
  }

  const tipoCalculo = validateEnum(
    payload.tipo_calculo,
    VALID_TIPOS_CALCULO,
    "Tipo de calculo"
  );

  const regiao = sanitizeString(payload.regiao);
  const pesoMinimo = sanitizeNumber(payload.peso_minimo, "Peso minimo");
  const pesoMaximo = sanitizeNumber(payload.peso_maximo, "Peso maximo");
  const distanciaMinima = sanitizeNumber(payload.distancia_minima, "Distancia minima");
  const distanciaMaxima = sanitizeNumber(payload.distancia_maxima, "Distancia maxima");
  const valorBase = sanitizeNumber(payload.valor_base, "Valor base");
  const valorPorKg = sanitizeNumber(payload.valor_por_kg, "Valor por kg");
  const valorPorKm = sanitizeNumber(payload.valor_por_km, "Valor por km");
  const valorFixo = sanitizeNumber(payload.valor_fixo, "Valor fixo");
  const observacao = sanitizeString(payload.observacao);

  if (pesoMaximo > 0 && pesoMinimo > pesoMaximo) {
    throw new AppError("Peso minimo nao pode ser maior que peso maximo", 400);
  }

  if (distanciaMaxima > 0 && distanciaMinima > distanciaMaxima) {
    throw new AppError("Distancia minima nao pode ser maior que distancia maxima", 400);
  }

  if (tipoCalculo === "POR_PESO" && valorPorKg <= 0 && valorFixo <= 0 && valorBase <= 0) {
    throw new AppError("Tabela POR_PESO exige valor_por_kg, valor_fixo ou valor_base maior que zero", 400);
  }

  if (tipoCalculo === "POR_DISTANCIA" && valorPorKm <= 0 && valorFixo <= 0 && valorBase <= 0) {
    throw new AppError("Tabela POR_DISTANCIA exige valor_por_km, valor_fixo ou valor_base maior que zero", 400);
  }

  if (tipoCalculo === "POR_REGIAO" && !regiao) {
    throw new AppError("Tabela POR_REGIAO exige campo regiao preenchido", 400);
  }

  return {
    nome,
    tipoCalculo,
    regiao,
    pesoMinimo,
    pesoMaximo,
    distanciaMinima,
    distanciaMaxima,
    valorBase,
    valorPorKg,
    valorPorKm,
    valorFixo,
    observacao
  };
};

// ─── Parse Cálculo de Frete ────────────────────────────────────────

const parseCalculoPayload = (payload) => {
  if (!payload.venda_id) {
    throw new AppError("venda_id obrigatorio para calculo de frete", 400);
  }
  validateUuid(payload.venda_id, "venda_id");

  const modalidade = validateEnum(
    payload.modalidade || "PROPRIO",
    VALID_MODALIDADES,
    "Modalidade"
  );

  const regiaoDestino = sanitizeString(payload.regiao_destino);
  const pesoTotalKg = sanitizeNumber(payload.peso_total_kg, "Peso total");
  const distanciaKm = sanitizeNumber(payload.distancia_km, "Distancia");
  const observacoes = sanitizeString(payload.observacoes);

  let tabelaFreteId = null;
  if (payload.tabela_frete_id) {
    tabelaFreteId = validateUuid(payload.tabela_frete_id, "tabela_frete_id");
  }

  let transportadoraFornecedorId = null;
  if (payload.transportadora_fornecedor_id) {
    transportadoraFornecedorId = validateUuid(
      payload.transportadora_fornecedor_id,
      "transportadora_fornecedor_id"
    );
  }

  if (modalidade === "TERCEIRO" && !transportadoraFornecedorId) {
    throw new AppError("Modalidade TERCEIRO exige transportadora_fornecedor_id", 400);
  }

  return {
    vendaId: payload.venda_id,
    modalidade,
    regiaoDestino,
    pesoTotalKg,
    distanciaKm,
    tabelaFreteId,
    transportadoraFornecedorId,
    observacoes
  };
};

// ─── Parse Custo Real ──────────────────────────────────────────────

const parseCustoRealPayload = (payload) => {
  if (payload.custo_real === undefined || payload.custo_real === null) {
    throw new AppError("custo_real obrigatorio", 400);
  }

  const custoReal = sanitizeNumber(payload.custo_real, "Custo real");
  const observacoes = sanitizeString(payload.observacoes);

  return { custoReal, observacoes };
};

// ─── Parse Filtros de Listagem ─────────────────────────────────────

const parseFreteListFilters = (queryParams) => {
  const filters = {};

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_FRETE, "Status do frete");
  }

  if (queryParams.modalidade) {
    filters.modalidade = validateEnum(queryParams.modalidade, VALID_MODALIDADES, "Modalidade");
  }

  if (queryParams.dataInicio) {
    filters.dataInicio = validateDate(queryParams.dataInicio, "dataInicio");
  }

  if (queryParams.dataFim) {
    filters.dataFim = validateDate(queryParams.dataFim, "dataFim");
  }

  if (filters.dataInicio && filters.dataFim) {
    if (new Date(filters.dataInicio) > new Date(filters.dataFim)) {
      throw new AppError("dataInicio nao pode ser posterior a dataFim", 400);
    }
  }

  const page = Number(queryParams.page);
  const limit = Number(queryParams.limit);

  filters.page = (!Number.isNaN(page) && page >= 1) ? Math.floor(page) : 1;
  filters.limit = (!Number.isNaN(limit) && limit >= 1 && limit <= 100) ? Math.floor(limit) : 20;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

// ─── Parse Filtros de Tabelas ──────────────────────────────────────

const parseTabelaListFilters = (queryParams) => {
  const filters = {};

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_TABELA, "Status da tabela");
  }

  if (queryParams.tipo_calculo) {
    filters.tipoCalculo = validateEnum(queryParams.tipo_calculo, VALID_TIPOS_CALCULO, "Tipo de calculo");
  }

  if (queryParams.regiao) {
    filters.regiao = sanitizeString(queryParams.regiao);
  }

  if (queryParams.search) {
    filters.search = sanitizeString(queryParams.search);
  }

  const page = Number(queryParams.page);
  const limit = Number(queryParams.limit);

  filters.page = (!Number.isNaN(page) && page >= 1) ? Math.floor(page) : 1;
  filters.limit = (!Number.isNaN(limit) && limit >= 1 && limit <= 100) ? Math.floor(limit) : 20;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

// ─── Parse Filtros de Período ──────────────────────────────────────

const parsePeriodoFilters = (queryParams) => {
  const filters = parseFreteListFilters(queryParams);

  if (!filters.dataInicio || !filters.dataFim) {
    throw new AppError("dataInicio e dataFim sao obrigatorios para consulta por periodo", 400);
  }

  return filters;
};

module.exports = {
  VALID_TIPOS_CALCULO,
  VALID_STATUS_TABELA,
  VALID_MODALIDADES,
  VALID_STATUS_FRETE,
  VALID_TIPOS_CALCULO_FRETE,
  validateUuid,
  validateEnum,
  sanitizeString,
  sanitizeNumber,
  parseTabelaFretePayload,
  parseCalculoPayload,
  parseCustoRealPayload,
  parseFreteListFilters,
  parseTabelaListFilters,
  parsePeriodoFilters
};
