const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_STATUS_VENDA = ["PENDENTE", "CONFIRMADA", "FATURADA", "CANCELADA"];
const VALID_TIPOS_VENDA = ["NORMAL", "FUTURA", "DIRETA"];
const VALID_FORMAS_PAGAMENTO_VENDA = ["A_VISTA", "A_PRAZO", "PIX", "CARTAO", "BOLETO", "DINHEIRO"];
const VALID_STATUS_DUPLICATA = ["EM_ABERTO", "PAGO_PARCIALMENTE", "PAGO", "VENCIDO", "CANCELADO"];
const VALID_FORMAS_PAGAMENTO = ["PIX", "BOLETO", "CARTAO", "DINHEIRO", "TRANSFERENCIA"];
const VALID_STATUS_ENTREGA = ["AGUARDANDO_DESPACHO", "EM_TRANSITO", "ENTREGUE", "NAO_REALIZADA"];
const VALID_STATUS_MANUTENCAO = ["AGENDADA", "EM_EXECUCAO", "CONCLUIDA", "CANCELADA"];
const VALID_TIPOS_MANUTENCAO = ["PREVENTIVA", "CORRETIVA"];
const VALID_TIPOS_MOVIMENTACAO = ["ENTRADA", "SAIDA", "TRANSFERENCIA", "AJUSTE"];
const VALID_AGRUPAMENTOS = ["DIA", "SEMANA", "MES"];

// ─── Helpers ────────────────────────────────────────────────────────

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isValidUuid = (value) => UUID_PATTERN.test(String(value || ""));

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

const validateUuidParam = (value, fieldName) => {
  if (!isValidUuid(value)) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
  return value;
};

const validateDateParam = (value, fieldName) => {
  if (!isValidDate(value)) {
    throw new AppError(`${fieldName} invalida. Use o formato YYYY-MM-DD`, 400);
  }
  return value;
};

// ─── Parse de filtros base (período + paginação) ────────────────────

const parseBaseFilters = (queryParams) => {
  const filters = {};

  if (queryParams.dataInicio) {
    filters.dataInicio = validateDateParam(queryParams.dataInicio, "dataInicio");
  }

  if (queryParams.dataFim) {
    filters.dataFim = validateDateParam(queryParams.dataFim, "dataFim");
  }

  if (filters.dataInicio && filters.dataFim) {
    if (new Date(filters.dataInicio) > new Date(filters.dataFim)) {
      throw new AppError("dataInicio nao pode ser posterior a dataFim", 400);
    }
  }

  const page = Number(queryParams.page);
  const limit = Number(queryParams.limit);

  filters.page = (!Number.isNaN(page) && page >= 1) ? Math.floor(page) : 1;
  filters.limit = (!Number.isNaN(limit) && limit >= 1 && limit <= 500) ? Math.floor(limit) : 50;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

// ─── Filtros de Vendas ──────────────────────────────────────────────

const parseVendasFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.clienteId) {
    filters.clienteId = validateUuidParam(queryParams.clienteId, "clienteId");
  }

  if (queryParams.vendedorId) {
    filters.vendedorId = validateUuidParam(queryParams.vendedorId, "vendedorId");
  }

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_VENDA, "Status de venda");
  }

  if (queryParams.tipoVenda) {
    filters.tipoVenda = validateEnum(queryParams.tipoVenda, VALID_TIPOS_VENDA, "Tipo de venda");
  }

  if (queryParams.agrupamento) {
    filters.agrupamento = validateEnum(queryParams.agrupamento, VALID_AGRUPAMENTOS, "Agrupamento");
  }

  return filters;
};

// ─── Filtros de Estoque ─────────────────────────────────────────────

const parseEstoqueFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.localId) {
    filters.localId = validateUuidParam(queryParams.localId, "localId");
  }

  if (queryParams.produtoId) {
    filters.produtoId = validateUuidParam(queryParams.produtoId, "produtoId");
  }

  if (queryParams.apenasAbaixoMinimo === "true") {
    filters.apenasAbaixoMinimo = true;
  }

  return filters;
};

// ─── Filtros de Movimentações ───────────────────────────────────────

const parseMovimentacoesFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.produtoId) {
    filters.produtoId = validateUuidParam(queryParams.produtoId, "produtoId");
  }

  if (queryParams.localId) {
    filters.localId = validateUuidParam(queryParams.localId, "localId");
  }

  if (queryParams.vendedorId) {
    filters.responsavelId = validateUuidParam(queryParams.vendedorId, "vendedorId");
  }

  if (queryParams.tipoMovimentacao) {
    filters.tipoMovimentacao = validateEnum(
      queryParams.tipoMovimentacao,
      VALID_TIPOS_MOVIMENTACAO,
      "Tipo de movimentacao"
    );
  }

  return filters;
};

// ─── Filtros de Duplicatas ──────────────────────────────────────────

const parseDuplicatasFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.clienteId) {
    filters.clienteId = validateUuidParam(queryParams.clienteId, "clienteId");
  }

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_DUPLICATA, "Status de duplicata");
  }

  return filters;
};

// ─── Filtros de Pagamentos ──────────────────────────────────────────

const parsePagamentosFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.formaPagamento) {
    filters.formaPagamento = validateEnum(
      queryParams.formaPagamento,
      VALID_FORMAS_PAGAMENTO,
      "Forma de pagamento"
    );
  }

  return filters;
};

// ─── Filtros de Entregas ────────────────────────────────────────────

const parseEntregasFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_ENTREGA, "Status de entrega");
  }

  if (queryParams.veiculoId) {
    filters.veiculoId = validateUuidParam(queryParams.veiculoId, "veiculoId");
  }

  if (queryParams.vendedorId) {
    filters.vendedorId = validateUuidParam(queryParams.vendedorId, "vendedorId");
  }

  return filters;
};

// ─── Filtros de Frota ───────────────────────────────────────────────

const parseFrotaFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.veiculoId) {
    filters.veiculoId = validateUuidParam(queryParams.veiculoId, "veiculoId");
  }

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_MANUTENCAO, "Status de manutencao");
  }

  if (queryParams.tipoManutencao) {
    filters.tipoManutencao = validateEnum(
      queryParams.tipoManutencao,
      VALID_TIPOS_MANUTENCAO,
      "Tipo de manutencao"
    );
  }

  return filters;
};

// ─── Filtros de Vendas Futuras ──────────────────────────────────────

const parseVendasFuturasFilters = (queryParams) => {
  const filters = parseBaseFilters(queryParams);

  if (queryParams.clienteId) {
    filters.clienteId = validateUuidParam(queryParams.clienteId, "clienteId");
  }

  if (queryParams.status) {
    filters.status = validateEnum(queryParams.status, VALID_STATUS_VENDA, "Status de venda");
  }

  return filters;
};

module.exports = {
  parseVendasFilters,
  parseEstoqueFilters,
  parseMovimentacoesFilters,
  parseDuplicatasFilters,
  parsePagamentosFilters,
  parseEntregasFilters,
  parseFrotaFilters,
  parseVendasFuturasFilters
};
