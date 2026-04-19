const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_GRANULARIDADES = ["DIA", "SEMANA", "MES"];

// ─── Helpers ────────────────────────────────────────────────────────

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isValidUuid = (value) => UUID_PATTERN.test(String(value || ""));

// ─── Parse dos filtros de período ───────────────────────────────────

const parsePeriodoFilters = (query) => {
  const filters = {};

  if (query.dataInicio) {
    if (!isValidDate(query.dataInicio)) {
      throw new AppError("dataInicio invalida. Use o formato YYYY-MM-DD", 400);
    }

    filters.dataInicio = query.dataInicio;
  }

  if (query.dataFim) {
    if (!isValidDate(query.dataFim)) {
      throw new AppError("dataFim invalida. Use o formato YYYY-MM-DD", 400);
    }

    filters.dataFim = query.dataFim;
  }

  if (filters.dataInicio && filters.dataFim) {
    if (new Date(filters.dataInicio) > new Date(filters.dataFim)) {
      throw new AppError("dataInicio nao pode ser posterior a dataFim", 400);
    }
  }

  if (query.localId) {
    if (!isValidUuid(query.localId)) {
      throw new AppError("localId invalido", 400);
    }

    filters.localId = query.localId;
  }

  if (query.unidadeId) {
    if (!isValidUuid(query.unidadeId)) {
      throw new AppError("unidadeId invalido", 400);
    }

    filters.unidadeId = query.unidadeId;
  }

  return filters;
};

// ─── Parse dos filtros de série temporal ────────────────────────────

const parseSerieTemporalFilters = (query) => {
  const filters = parsePeriodoFilters(query);

  const granularidade = (query.granularidade || "DIA").toUpperCase();

  if (!VALID_GRANULARIDADES.includes(granularidade)) {
    throw new AppError(
      `Granularidade invalida. Use: ${VALID_GRANULARIDADES.join(", ")}`,
      400
    );
  }

  filters.granularidade = granularidade;

  // Padrão: últimos 30 dias se não informados
  if (!filters.dataInicio) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filters.dataInicio = thirtyDaysAgo.toISOString().split("T")[0];
  }

  if (!filters.dataFim) {
    filters.dataFim = new Date().toISOString().split("T")[0];
  }

  return filters;
};

// ─── Parse dos filtros de alertas ───────────────────────────────────

const parseAlertasFilters = (query) => {
  const filters = {};

  const dias = Number(query.dias);

  if (query.dias !== undefined) {
    if (Number.isNaN(dias) || dias < 1 || !Number.isInteger(dias)) {
      throw new AppError("Parametro 'dias' deve ser um inteiro positivo", 400);
    }
  }

  filters.dias = dias || 7;

  return filters;
};

// ─── Parse dos filtros financeiros ──────────────────────────────────

const parseFinanceiroFilters = (query) => {
  const filters = parsePeriodoFilters(query);

  const dias = Number(query.dias);

  if (query.dias !== undefined) {
    if (Number.isNaN(dias) || dias < 1 || !Number.isInteger(dias)) {
      throw new AppError("Parametro 'dias' deve ser um inteiro positivo", 400);
    }
  }

  filters.dias = dias || 7;

  return filters;
};

// ─── Parse dos filtros de estoque ───────────────────────────────────

const parseEstoqueFilters = (query) => {
  const filters = parsePeriodoFilters(query);

  const limit = Number(query.limit);

  if (query.limit !== undefined) {
    if (Number.isNaN(limit) || limit < 1 || !Number.isInteger(limit)) {
      throw new AppError("Parametro 'limit' deve ser um inteiro positivo", 400);
    }
  }

  filters.limit = limit || 10;

  return filters;
};

module.exports = {
  parsePeriodoFilters,
  parseSerieTemporalFilters,
  parseAlertasFilters,
  parseFinanceiroFilters,
  parseEstoqueFilters,
  VALID_GRANULARIDADES
};
