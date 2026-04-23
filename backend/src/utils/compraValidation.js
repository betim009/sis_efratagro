const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIMPLE_ID_PATTERN = /^\d+$/;
const VALID_STATUS_COMPRA = ["CONFIRMADA", "CANCELADA"];

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

const validateEntityIdentifier = (value, fieldName = "id") => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    throw new AppError(`${fieldName} invalido`, 400);
  }

  if (SIMPLE_ID_PATTERN.test(normalized) || UUID_PATTERN.test(normalized)) {
    return normalized;
  }

  throw new AppError(`${fieldName} invalido`, 400);
};

const normalizeItems = (payload) => {
  if (Array.isArray(payload.itens) && payload.itens.length) {
    return payload.itens;
  }

  return [
    {
      produto_id: payload.produto_id,
      quantidade: payload.quantidade,
      custo_unitario: payload.custo_unitario,
      local_destino_id: payload.local_destino_id
    }
  ];
};

const parseCompraPayload = (payload = {}) => {
  const fornecedorId = sanitizeString(payload.fornecedor_id);
  const observacoes = sanitizeString(payload.observacoes || payload.observacao);
  const numero = sanitizeString(payload.numero);
  const status = sanitizeString(payload.status) || "CONFIRMADA";
  const descontoValor = sanitizeNumber(payload.desconto_valor || 0, "desconto_valor") || 0;
  const freteValor = sanitizeNumber(payload.frete_valor || 0, "frete_valor") || 0;
  const gerarContaPagar = Boolean(payload.gerar_conta_pagar);
  const vencimentoContaPagar = sanitizeString(payload.vencimento_conta_pagar);

  if (!fornecedorId) {
    throw new AppError("fornecedor_id obrigatorio", 400);
  }

  validateEntityIdentifier(fornecedorId, "fornecedor_id");

  if (!VALID_STATUS_COMPRA.includes(status)) {
    throw new AppError(`Status de compra invalido. Use: ${VALID_STATUS_COMPRA.join(", ")}`, 400);
  }

  if (descontoValor < 0 || freteValor < 0) {
    throw new AppError("desconto_valor e frete_valor devem ser maiores ou iguais a zero", 400);
  }

  if (gerarContaPagar && !vencimentoContaPagar) {
    throw new AppError("vencimento_conta_pagar obrigatorio para gerar conta a pagar", 400);
  }

  const itens = normalizeItems(payload).map((item, index) => {
    const produtoId = sanitizeString(item.produto_id);
    const localDestinoId = sanitizeString(item.local_destino_id);
    const quantidade = sanitizeNumber(item.quantidade, `quantidade do item ${index + 1}`);
    const custoUnitario = sanitizeNumber(item.custo_unitario, `custo_unitario do item ${index + 1}`);

    if (!produtoId) {
      throw new AppError(`produto_id obrigatorio no item ${index + 1}`, 400);
    }

    if (!localDestinoId) {
      throw new AppError(`local_destino_id obrigatorio no item ${index + 1}`, 400);
    }

    validateEntityIdentifier(produtoId, `produto_id do item ${index + 1}`);
    validateEntityIdentifier(localDestinoId, `local_destino_id do item ${index + 1}`);

    if (quantidade === null || quantidade <= 0) {
      throw new AppError(`quantidade do item ${index + 1} deve ser maior que zero`, 400);
    }

    if (custoUnitario === null || custoUnitario <= 0) {
      throw new AppError(`custo_unitario do item ${index + 1} deve ser maior que zero`, 400);
    }

    return {
      sequencia: index + 1,
      produtoId,
      localDestinoId,
      quantidade,
      custoUnitario,
      totalValor: Number((quantidade * custoUnitario).toFixed(2))
    };
  });

  const subtotal = Number(
    itens.reduce((total, item) => total + item.totalValor, 0).toFixed(2)
  );
  const totalValor = Number((subtotal - descontoValor + freteValor).toFixed(2));

  if (totalValor < 0) {
    throw new AppError("total da compra nao pode ser negativo", 400);
  }

  return {
    fornecedorId,
    numero,
    status,
    observacoes,
    descontoValor,
    freteValor,
    subtotal,
    totalValor,
    gerarContaPagar,
    vencimentoContaPagar,
    itens
  };
};

const parseListFilters = (queryParams = {}) => {
  const page = Number(queryParams.page || 1);
  const limit = Number(queryParams.limit || 25);
  const fornecedorId = sanitizeString(queryParams.fornecedor_id || queryParams.fornecedorId);
  const status = sanitizeString(queryParams.status);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new AppError("Parametro limit invalido", 400);
  }

  if (fornecedorId) {
    validateEntityIdentifier(fornecedorId, "fornecedor_id");
  }

  if (status && !VALID_STATUS_COMPRA.includes(status)) {
    throw new AppError(`Status de compra invalido. Use: ${VALID_STATUS_COMPRA.join(", ")}`, 400);
  }

  return {
    search: sanitizeString(queryParams.search),
    fornecedorId,
    status,
    page,
    limit,
    offset: (page - 1) * limit
  };
};

module.exports = {
  VALID_STATUS_COMPRA,
  validateEntityIdentifier,
  parseCompraPayload,
  parseListFilters
};
