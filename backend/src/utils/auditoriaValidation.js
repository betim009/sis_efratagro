const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_ACOES = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "INACTIVATE",
  "STATUS_CHANGE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_RESET_REQUEST",
  "PASSWORD_RESET_CONFIRM",
  "PAYMENT_REGISTER",
  "STOCK_MOVEMENT",
  "SALE_CONFIRM",
  "DELIVERY_STATUS_CHANGE",
  "FREIGHT_REAL_COST_UPDATE",
  "FREIGHT_LINK_DELIVERY",
  "FREIGHT_LINK_VEHICLE",
  "MAINTENANCE_STATUS_CHANGE",
  "VEHICLE_STATUS_CHANGE"
];

const VALID_MODULOS = [
  "usuarios",
  "fornecedores",
  "clientes",
  "produtos",
  "locais_estoque",
  "estoques",
  "vendas",
  "itens_venda",
  "duplicatas",
  "pagamentos",
  "veiculos",
  "manutencoes",
  "fretes",
  "tabelas_frete",
  "entregas",
  "historico_entregas",
  "movimentacoes_estoque",
  "sessoes_usuario",
  "tokens_reset_senha",
  "perfis_acesso",
  "perfil_permissoes"
];

// ─── Helpers ────────────────────────────────────────────────────────

const isValidUuid = (value) => UUID_PATTERN.test(String(value || ""));

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const sanitizeString = (value) => {
  if (value === undefined || value === null) return null;
  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

// ─── Parse Filtros de Consulta ─────────────────────────────────────

const parseLogFilters = (queryParams) => {
  const filters = {};

  if (queryParams.usuarioId) {
    if (!isValidUuid(queryParams.usuarioId)) {
      throw new AppError("usuarioId invalido", 400);
    }
    filters.usuarioId = queryParams.usuarioId;
  }

  if (queryParams.modulo) {
    const modulo = sanitizeString(queryParams.modulo);
    if (modulo && !VALID_MODULOS.includes(modulo.toLowerCase())) {
      throw new AppError(
        `Modulo invalido. Use: ${VALID_MODULOS.join(", ")}`,
        400
      );
    }
    filters.modulo = modulo ? modulo.toLowerCase() : null;
  }

  if (queryParams.entidade) {
    filters.entidade = sanitizeString(queryParams.entidade);
  }

  if (queryParams.entidadeId) {
    if (!isValidUuid(queryParams.entidadeId)) {
      throw new AppError("entidadeId invalido", 400);
    }
    filters.entidadeId = queryParams.entidadeId;
  }

  if (queryParams.acao) {
    const acao = String(queryParams.acao).toUpperCase();
    if (!VALID_ACOES.includes(acao)) {
      throw new AppError(
        `Acao invalida. Use: ${VALID_ACOES.join(", ")}`,
        400
      );
    }
    filters.acao = acao;
  }

  if (queryParams.dataInicio) {
    if (!isValidDate(queryParams.dataInicio)) {
      throw new AppError("dataInicio invalida. Use formato YYYY-MM-DD", 400);
    }
    filters.dataInicio = queryParams.dataInicio;
  }

  if (queryParams.dataFim) {
    if (!isValidDate(queryParams.dataFim)) {
      throw new AppError("dataFim invalida. Use formato YYYY-MM-DD", 400);
    }
    filters.dataFim = queryParams.dataFim;
  }

  if (filters.dataInicio && filters.dataFim) {
    if (new Date(filters.dataInicio) > new Date(filters.dataFim)) {
      throw new AppError("dataInicio nao pode ser posterior a dataFim", 400);
    }
  }

  const page = Number(queryParams.page);
  const limit = Number(queryParams.limit);

  filters.page = (!Number.isNaN(page) && page >= 1) ? Math.floor(page) : 1;
  filters.limit = (!Number.isNaN(limit) && limit >= 1 && limit <= 200) ? Math.floor(limit) : 50;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

module.exports = {
  VALID_ACOES,
  VALID_MODULOS,
  isValidUuid,
  sanitizeString,
  parseLogFilters
};
