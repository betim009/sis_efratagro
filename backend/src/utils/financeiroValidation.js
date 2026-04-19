const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_STATUS_DUPLICATA = [
  "EM_ABERTO",
  "PAGO_PARCIALMENTE",
  "PAGO",
  "VENCIDO",
  "CANCELADO"
];

const VALID_FORMAS_PAGAMENTO = [
  "PIX",
  "BOLETO",
  "CARTAO",
  "DINHEIRO",
  "TRANSFERENCIA"
];

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

const parseGerarDuplicataPayload = (payload) => {
  const vendaId = sanitizeString(payload.venda_id);
  const clienteId = sanitizeString(payload.cliente_id);
  const numero = sanitizeString(payload.numero);
  const valorTotal = sanitizeNumber(payload.valor_total, "Valor total");
  const vencimento = sanitizeString(payload.vencimento);
  const parcela = Number(payload.parcela || 1);
  const dataEmissao = sanitizeString(payload.data_emissao);
  const observacoes = sanitizeString(payload.observacoes);

  if (!vendaId) {
    throw new AppError("venda_id obrigatorio", 400);
  }

  validateUuid(vendaId, "venda_id");

  if (!clienteId) {
    throw new AppError("cliente_id obrigatorio", 400);
  }

  validateUuid(clienteId, "cliente_id");

  if (!numero) {
    throw new AppError("numero da duplicata obrigatorio", 400);
  }

  if (valorTotal === null || valorTotal <= 0) {
    throw new AppError("valor_total deve ser maior que zero", 400);
  }

  if (!vencimento) {
    throw new AppError("vencimento obrigatorio", 400);
  }

  if (Number.isNaN(Date.parse(vencimento))) {
    throw new AppError("vencimento invalido", 400);
  }

  if (!Number.isInteger(parcela) || parcela < 1) {
    throw new AppError("parcela deve ser um inteiro maior que zero", 400);
  }

  return {
    vendaId,
    clienteId,
    numero,
    valorTotal,
    valorAberto: valorTotal,
    vencimento,
    parcela,
    dataEmissao: dataEmissao || new Date().toISOString().split("T")[0],
    status: "EM_ABERTO",
    observacoes
  };
};

const parseGerarParcelasPayload = (payload) => {
  const vendaId = sanitizeString(payload.venda_id);
  const clienteId = sanitizeString(payload.cliente_id);
  const valorTotal = sanitizeNumber(payload.valor_total, "Valor total");
  const totalParcelas = Number(payload.total_parcelas);
  const primeiroVencimento = sanitizeString(payload.primeiro_vencimento);
  const intervaloDias = Number(payload.intervalo_dias || 30);
  const prefixoNumero = sanitizeString(payload.prefixo_numero);
  const observacoes = sanitizeString(payload.observacoes);

  if (!vendaId) {
    throw new AppError("venda_id obrigatorio", 400);
  }

  validateUuid(vendaId, "venda_id");

  if (!clienteId) {
    throw new AppError("cliente_id obrigatorio", 400);
  }

  validateUuid(clienteId, "cliente_id");

  if (valorTotal === null || valorTotal <= 0) {
    throw new AppError("valor_total deve ser maior que zero", 400);
  }

  if (!Number.isInteger(totalParcelas) || totalParcelas < 1 || totalParcelas > 120) {
    throw new AppError("total_parcelas deve ser um inteiro entre 1 e 120", 400);
  }

  if (!primeiroVencimento) {
    throw new AppError("primeiro_vencimento obrigatorio", 400);
  }

  if (Number.isNaN(Date.parse(primeiroVencimento))) {
    throw new AppError("primeiro_vencimento invalido", 400);
  }

  if (!Number.isInteger(intervaloDias) || intervaloDias < 1) {
    throw new AppError("intervalo_dias deve ser um inteiro maior que zero", 400);
  }

  if (!prefixoNumero) {
    throw new AppError("prefixo_numero obrigatorio", 400);
  }

  return {
    vendaId,
    clienteId,
    valorTotal,
    totalParcelas,
    primeiroVencimento,
    intervaloDias,
    prefixoNumero,
    observacoes
  };
};

const parsePagamentoPayload = (payload) => {
  const formaPagamento = sanitizeString(payload.forma_pagamento);
  const valor = sanitizeNumber(payload.valor, "Valor do pagamento");
  const dataPagamento = sanitizeString(payload.data_pagamento);
  const referenciaExterna = sanitizeString(payload.referencia_externa);
  const observacoes = sanitizeString(payload.observacoes);

  if (valor === null || valor <= 0) {
    throw new AppError("valor do pagamento deve ser maior que zero", 400);
  }

  if (!formaPagamento) {
    throw new AppError("forma_pagamento obrigatoria", 400);
  }

  if (!VALID_FORMAS_PAGAMENTO.includes(formaPagamento)) {
    throw new AppError(
      `forma_pagamento invalida. Valores aceitos: ${VALID_FORMAS_PAGAMENTO.join(", ")}`,
      400
    );
  }

  return {
    formaPagamento,
    valor,
    dataPagamento: dataPagamento || new Date().toISOString(),
    referenciaExterna,
    observacoes
  };
};

const parseListDuplicatasFilters = (queryParams) => {
  const status = sanitizeString(queryParams.status);
  const clienteId = sanitizeString(queryParams.cliente_id);
  const search = sanitizeString(queryParams.search);
  const dataInicio = sanitizeString(queryParams.data_inicio);
  const dataFim = sanitizeString(queryParams.data_fim);
  const page = Number(queryParams.page || 1);
  const limit = Number(queryParams.limit || 10);

  if (status && !VALID_STATUS_DUPLICATA.includes(status)) {
    throw new AppError(
      `Filtro de status invalido. Valores aceitos: ${VALID_STATUS_DUPLICATA.join(", ")}`,
      400
    );
  }

  if (clienteId) {
    validateUuid(clienteId, "cliente_id");
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
    status,
    clienteId,
    search,
    dataInicio,
    dataFim,
    page,
    limit,
    offset: (page - 1) * limit
  };
};

const mapDuplicataResponse = (duplicata) => ({
  id: duplicata.id,
  venda_id: duplicata.venda_id,
  cliente_id: duplicata.cliente_id,
  numero: duplicata.numero,
  parcela: duplicata.parcela,
  valor_total: duplicata.valor_total,
  valor_pago: Number(
    (Number(duplicata.valor_total) - Number(duplicata.valor_aberto)).toFixed(2)
  ),
  valor_aberto: duplicata.valor_aberto,
  vencimento: duplicata.vencimento,
  data_emissao: duplicata.data_emissao,
  status: duplicata.status,
  observacoes: duplicata.observacoes,
  cliente: duplicata.cliente_razao_social
    ? {
        id: duplicata.cliente_id,
        razao_social: duplicata.cliente_razao_social,
        nome_fantasia: duplicata.cliente_nome_fantasia,
        cpf_cnpj: duplicata.cliente_cpf_cnpj
      }
    : null,
  venda: duplicata.venda_numero
    ? {
        id: duplicata.venda_id,
        numero: duplicata.venda_numero,
        total_valor: duplicata.venda_total_valor
      }
    : null,
  created_at: duplicata.created_at,
  updated_at: duplicata.updated_at
});

const mapPagamentoResponse = (pagamento) => ({
  id: pagamento.id,
  duplicata_id: pagamento.duplicata_id,
  recebido_por_usuario_id: pagamento.recebido_por_usuario_id,
  recebido_por_nome: pagamento.recebido_por_nome || null,
  forma_pagamento: pagamento.forma_pagamento,
  valor: pagamento.valor,
  data_pagamento: pagamento.data_pagamento,
  referencia_externa: pagamento.referencia_externa,
  observacoes: pagamento.observacoes,
  created_at: pagamento.created_at
});

module.exports = {
  VALID_STATUS_DUPLICATA,
  VALID_FORMAS_PAGAMENTO,
  validateUuid,
  parseGerarDuplicataPayload,
  parseGerarParcelasPayload,
  parsePagamentoPayload,
  parseListDuplicatasFilters,
  mapDuplicataResponse,
  mapPagamentoResponse
};
