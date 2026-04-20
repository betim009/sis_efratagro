const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUS = ["ATIVO", "INATIVO"];

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

const sanitizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} invalido`, 400);
  }

  return parsed;
};

const validateUuid = (value, fieldName = "id") => {
  if (!UUID_PATTERN.test(String(value || ""))) {
    throw new AppError(`${fieldName} invalido`, 400);
  }
};

const parseProdutoPayload = (payload, { allowStatus = true } = {}) => {
  const codigo = sanitizeString(payload.codigo);
  const nome = sanitizeString(payload.nome);
  const status = sanitizeString(payload.status) || null;

  if (!codigo) {
    throw new AppError("Codigo obrigatorio", 400);
  }

  if (!nome) {
    throw new AppError("Nome obrigatorio", 400);
  }

  if (status && !allowStatus) {
    throw new AppError("Status nao pode ser alterado neste endpoint", 400);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Status invalido para produto", 400);
  }

  const fornecedorPadraoId = sanitizeString(payload.fornecedor_padrao_id);

  if (fornecedorPadraoId) {
    validateUuid(fornecedorPadraoId, "Fornecedor padrao");
  }

  return {
    codigo,
    nome,
    descricao: sanitizeString(payload.descricao),
    unidadeMedida: sanitizeString(payload.unidade_medida),
    categoria: sanitizeString(payload.categoria),
    precoCusto: sanitizeNumber(payload.preco_custo, "Preco de custo"),
    precoVenda: sanitizeNumber(payload.preco_venda, "Preco de venda"),
    peso: sanitizeNumber(payload.peso, "Peso"),
    codigoBarras: sanitizeString(payload.codigo_barras),
    referenciaInterna: sanitizeString(payload.referencia_interna),
    fornecedorPadraoId,
    estoqueMinimo: sanitizeNumber(payload.estoque_minimo, "Estoque minimo"),
    pontoReposicao: sanitizeNumber(
      payload.ponto_reposicao,
      "Ponto de reposicao"
    ),
    permiteVendaSemEstoque: Boolean(payload.permite_venda_sem_estoque),
    status: status || "ATIVO"
  };
};

const parseListFilters = (query) => {
  const status = sanitizeString(query.status);
  const categoria = sanitizeString(query.categoria);
  const search = sanitizeString(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const includeInactive =
    String(query.include_inativos || "false").toLowerCase() === "true";

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Filtro de status invalido", 400);
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Parametro page invalido", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Parametro limit invalido", 400);
  }

  return {
    status,
    categoria,
    search,
    page,
    limit,
    offset: (page - 1) * limit,
    includeInactive
  };
};

const mapProdutoResponse = (produto) => ({
  id: produto.id,
  codigo: produto.codigo,
  nome: produto.nome,
  descricao: produto.descricao,
  unidade_medida: produto.unidade_medida,
  categoria: produto.categoria,
  preco_custo: produto.preco_custo,
  preco_venda: produto.preco_venda,
  peso: produto.peso_kg,
  codigo_barras: produto.codigo_barras,
  referencia_interna: produto.referencia_interna,
  fornecedor_padrao_id: produto.fornecedor_padrao_id,
  fornecedor_padrao: produto.fornecedor_padrao_id
    ? {
        id: produto.fornecedor_padrao_id,
        razao_social: produto.fornecedor_padrao_razao_social || null
      }
    : null,
  estoque_minimo: produto.estoque_minimo,
  ponto_reposicao: produto.ponto_reposicao,
  permite_venda_sem_estoque: produto.permite_venda_sem_estoque,
  status: produto.status,
  created_at: produto.created_at,
  updated_at: produto.updated_at
});

module.exports = {
  VALID_STATUS,
  validateUuid,
  parseProdutoPayload,
  parseListFilters,
  mapProdutoResponse
};
