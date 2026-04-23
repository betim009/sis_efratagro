const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIMPLE_ID_PATTERN = /^\d+$/;

const VALID_STATUS_LOCAL = ["ATIVO", "INATIVO"];
const VALID_TIPOS_LOCAL = ["DEPOSITO", "FILIAL", "PRATELEIRA", "TRANSITO"];
const VALID_TIPOS_MOVIMENTACAO = [
  "ENTRADA",
  "SAIDA",
  "TRANSFERENCIA",
  "AJUSTE",
  "DEVOLUCAO_FORNECEDOR",
  "DEVOLUCAO_CLIENTE"
];
const VALID_MOTIVOS_AJUSTE = ["CORRECAO", "CORRECAO_ERRO", "ERRO", "PERDA", "INVENTARIO"];

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

const parseLocalPayload = (payload) => {
  const nome = sanitizeString(payload.nome);
  const codigo = sanitizeString(payload.codigo);
  const tipoLocal = sanitizeString(payload.tipo_local) || "DEPOSITO";
  const status = sanitizeString(payload.status) || "ATIVO";

  if (!nome) {
    throw new AppError("Nome do local obrigatorio", 400);
  }

  if (!codigo) {
    throw new AppError("Codigo do local obrigatorio", 400);
  }

  if (!VALID_TIPOS_LOCAL.includes(tipoLocal)) {
    throw new AppError(
      `Tipo de local invalido. Use: ${VALID_TIPOS_LOCAL.join(", ")}`,
      400
    );
  }

  if (!VALID_STATUS_LOCAL.includes(status)) {
    throw new AppError(
      `Status do local invalido. Use: ${VALID_STATUS_LOCAL.join(", ")}`,
      400
    );
  }

  return {
    nome,
    codigo,
    descricao: sanitizeString(payload.descricao),
    tipoLocal,
    enderecoReferencia: sanitizeString(payload.endereco_referencia),
    status
  };
};

const parseMovimentacaoPayload = (payload, tipoEsperado) => {
  const tipoMovimentacao = sanitizeString(payload.tipo_movimentacao) || tipoEsperado;
  const produtoId = sanitizeString(payload.produto_id);
  const fornecedorId = sanitizeString(payload.fornecedor_id);
  const clienteId = sanitizeString(payload.cliente_id);
  const localOrigemId = sanitizeString(payload.local_origem_id);
  const localDestinoId = sanitizeString(payload.local_destino_id);
  const motivo = sanitizeString(payload.motivo);
  const observacoes = sanitizeString(payload.observacoes || payload.observacao);
  const vendaId = sanitizeString(payload.venda_id);
  const quantidade = sanitizeNumber(payload.quantidade, "Quantidade");
  const custoUnitario = sanitizeNumber(payload.custo_unitario, "custo_unitario");

  if (!VALID_TIPOS_MOVIMENTACAO.includes(tipoMovimentacao)) {
    throw new AppError(
      `Tipo de movimentacao invalido. Use: ${VALID_TIPOS_MOVIMENTACAO.join(", ")}`,
      400
    );
  }

  if (!produtoId) {
    throw new AppError("produto_id obrigatorio", 400);
  }

  validateEntityIdentifier(produtoId, "produto_id");

  if (vendaId) {
    validateEntityIdentifier(vendaId, "venda_id");
  }

  if (fornecedorId) {
    validateEntityIdentifier(fornecedorId, "fornecedor_id");
  }

  if (clienteId) {
    validateEntityIdentifier(clienteId, "cliente_id");
  }

  if (quantidade === null || quantidade <= 0) {
    throw new AppError("quantidade deve ser maior que zero", 400);
  }

  if (!motivo) {
    throw new AppError("motivo obrigatorio", 400);
  }

  if (tipoEsperado === "ENTRADA") {
    if (!fornecedorId) {
      throw new AppError("fornecedor_id obrigatorio para entrada por compra", 400);
    }

    if (!localDestinoId) {
      throw new AppError("local_destino_id obrigatorio para entrada", 400);
    }

    if (custoUnitario === null || custoUnitario <= 0) {
      throw new AppError("custo_unitario obrigatorio e deve ser maior que zero", 400);
    }

    validateEntityIdentifier(localDestinoId, "local_destino_id");
  }

  if (tipoEsperado === "SAIDA") {
    if (!localOrigemId) {
      throw new AppError("local_origem_id obrigatorio para saida", 400);
    }

    validateEntityIdentifier(localOrigemId, "local_origem_id");
  }

  if (tipoEsperado === "TRANSFERENCIA") {
    if (!localOrigemId) {
      throw new AppError("local_origem_id obrigatorio para transferencia", 400);
    }

    if (!localDestinoId) {
      throw new AppError("local_destino_id obrigatorio para transferencia", 400);
    }

    validateEntityIdentifier(localOrigemId, "local_origem_id");
    validateEntityIdentifier(localDestinoId, "local_destino_id");

    if (localOrigemId === localDestinoId) {
      throw new AppError("Nao e permitido transferir para o mesmo local", 400);
    }
  }

  if (tipoEsperado === "AJUSTE") {
    if (!VALID_MOTIVOS_AJUSTE.includes(motivo)) {
      throw new AppError(
        `Motivo de ajuste invalido. Use: ${VALID_MOTIVOS_AJUSTE.join(", ")}`,
        400
      );
    }

    if (!localOrigemId && !localDestinoId) {
      throw new AppError("Ajuste exige local_origem_id para debito ou local_destino_id para credito", 400);
    }

    if (localOrigemId && localDestinoId) {
      throw new AppError("Ajuste deve informar apenas origem ou destino", 400);
    }

    if (localOrigemId) {
      validateEntityIdentifier(localOrigemId, "local_origem_id");
    }

    if (localDestinoId) {
      validateEntityIdentifier(localDestinoId, "local_destino_id");
    }
  }

  if (tipoEsperado === "DEVOLUCAO_FORNECEDOR") {
    if (!fornecedorId) {
      throw new AppError("fornecedor_id obrigatorio para devolucao ao fornecedor", 400);
    }

    if (!localOrigemId) {
      throw new AppError("local_origem_id obrigatorio para devolucao ao fornecedor", 400);
    }

    validateEntityIdentifier(localOrigemId, "local_origem_id");
  }

  if (tipoEsperado === "DEVOLUCAO_CLIENTE") {
    if (fornecedorId) {
      throw new AppError("Devolucao de cliente nao deve informar fornecedor", 400);
    }

    if (!localDestinoId) {
      throw new AppError("local_destino_id obrigatorio para devolucao de cliente", 400);
    }

    validateEntityIdentifier(localDestinoId, "local_destino_id");
  }

  return {
    tipoMovimentacao,
    produtoId,
    fornecedorId,
    clienteId,
    localOrigemId,
    localDestinoId,
    quantidade,
    custoUnitario,
    motivo,
    observacoes,
    vendaId
  };
};

const parseListFilters = (queryParams = {}) => {
  const page = Number(queryParams.page || 1);
  const limit = Number(queryParams.limit || 25);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new AppError("Parametro limit invalido", 400);
  }

  return {
    status: sanitizeString(queryParams.status),
    search: sanitizeString(queryParams.search),
    produtoId: sanitizeString(queryParams.produto_id || queryParams.produtoId),
    localId: sanitizeString(queryParams.local_id || queryParams.localId),
    tipoMovimentacao: sanitizeString(
      queryParams.tipo_movimentacao || queryParams.tipoMovimentacao
    ),
    includeInactive:
      String(queryParams.include_inativos || "false").toLowerCase() === "true",
    page,
    limit,
    offset: (page - 1) * limit
  };
};

module.exports = {
  VALID_STATUS_LOCAL,
  VALID_TIPOS_LOCAL,
  VALID_TIPOS_MOVIMENTACAO,
  VALID_MOTIVOS_AJUSTE,
  validateUuid,
  validateEntityIdentifier,
  parseLocalPayload,
  parseMovimentacaoPayload,
  parseListFilters
};
