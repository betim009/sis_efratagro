const produtoModel = require("../models/produtoModel");
const produtoFornecedorModel = require("../models/produtoFornecedorModel");
const auditLogModel = require("../models/auditLogModel");
const authService = require("./authService");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseProdutoPayload,
  parseListFilters,
  mapProdutoResponse
} = require("../utils/produtoValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertProdutoExists = async (produtoId) => {
  validateUuid(produtoId, "Produto");

  const produto = await produtoModel.findProdutoById(produtoId);

  if (!produto) {
    throw new AppError("Produto nao encontrado", 404);
  }

  return produto;
};

const ensureUniqueCodigo = async (codigo, excludeId = null) => {
  const produto = await produtoModel.findProdutoByCodigo(codigo, excludeId);

  if (produto) {
    throw new AppError("Ja existe produto cadastrado com este codigo", 409);
  }
};

const ensureUniqueCodigoBarras = async (codigoBarras, excludeId = null) => {
  if (!codigoBarras) {
    return;
  }

  const produto = await produtoModel.findProdutoByCodigoBarras(
    codigoBarras,
    excludeId
  );

  if (produto) {
    throw new AppError("Ja existe produto cadastrado com este codigo de barras", 409);
  }
};

const validateFornecedorPadrao = async (fornecedorPadraoId) => {
  if (!fornecedorPadraoId) {
    return null;
  }

  const fornecedor = await produtoModel.findFornecedorById(fornecedorPadraoId);

  if (!fornecedor) {
    throw new AppError("Fornecedor padrao nao encontrado", 404);
  }

  return fornecedor;
};

const createProduto = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseProdutoPayload(payload);

  await Promise.all([
    ensureUniqueCodigo(parsedPayload.codigo),
    ensureUniqueCodigoBarras(parsedPayload.codigoBarras),
    validateFornecedorPadrao(parsedPayload.fornecedorPadraoId)
  ]);

  const produto = await produtoModel.createProduto(parsedPayload);
  const produtoCompleto = await produtoModel.findProdutoById(produto.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "produtos",
    recordId: produto.id,
    action: "INSERT",
    newData: {
      codigo: produto.codigo,
      nome: produto.nome,
      status: produto.status
    },
    ...metadata
  });

  return mapProdutoResponse(produtoCompleto);
};

const listProdutos = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [produtos, total] = await Promise.all([
    produtoModel.listProdutos(filters),
    produtoModel.countProdutos(filters)
  ]);

  return {
    items: produtos.map(mapProdutoResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getProdutoById = async (produtoId) => {
  const produto = await assertProdutoExists(produtoId);
  return mapProdutoResponse(produto);
};

const getFornecedoresDoProduto = async (produtoId) => {
  const produto = await assertProdutoExists(produtoId);
  const fornecedores = await produtoFornecedorModel.listByProduto(produto.id);

  return {
    produto: mapProdutoResponse(produto),
    fornecedor_principal: produto.fornecedor_padrao_id
      ? {
          id: produto.fornecedor_padrao_id,
          razao_social: produto.fornecedor_padrao_razao_social
        }
      : null,
    fornecedores_secundarios: fornecedores.filter(
      (item) => item.fornecedor_id !== produto.fornecedor_padrao_id
    ),
    vinculos: fornecedores
  };
};

const getFornecedorPrincipal = async (produtoId) => {
  const produto = await assertProdutoExists(produtoId);
  const fornecedorPrincipal =
    await produtoFornecedorModel.getFornecedorPrincipalByProduto(produto.id);

  return fornecedorPrincipal;
};

const updateProduto = async ({
  produtoId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentProduto = await assertProdutoExists(produtoId);
  const parsedPayload = parseProdutoPayload(payload);

  await Promise.all([
    ensureUniqueCodigo(parsedPayload.codigo, produtoId),
    ensureUniqueCodigoBarras(parsedPayload.codigoBarras, produtoId),
    validateFornecedorPadrao(parsedPayload.fornecedorPadraoId)
  ]);

  const produto = await produtoModel.updateProduto(produtoId, parsedPayload);
  const produtoCompleto = await produtoModel.findProdutoById(produto.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "produtos",
    recordId: produto.id,
    action: "UPDATE",
    previousData: {
      codigo: currentProduto.codigo,
      nome: currentProduto.nome,
      status: currentProduto.status
    },
    newData: {
      codigo: produto.codigo,
      nome: produto.nome,
      status: produto.status
    },
    ...metadata
  });

  return mapProdutoResponse(produtoCompleto);
};

const inactivateProduto = async ({
  produtoId,
  authenticatedUser,
  request
}) => {
  const currentProduto = await assertProdutoExists(produtoId);

  if (currentProduto.status === "INATIVO") {
    throw new AppError("Produto ja esta inativo", 409);
  }

  const produto = await produtoModel.inactivateProduto(produtoId);
  const produtoCompleto = await produtoModel.findProdutoById(produto.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "produtos",
    recordId: produto.id,
    action: "UPDATE",
    previousData: { status: currentProduto.status },
    newData: { status: produto.status },
    ...metadata
  });

  return mapProdutoResponse(produtoCompleto);
};

const listProdutosByStatus = async (status) =>
  listProdutos({ status, page: 1, limit: 100, include_inativos: "true" });

const listProdutosByCategoria = async (categoria) =>
  listProdutos({ categoria, page: 1, limit: 100 });

const getSaldoEstoque = async ({ produtoId, authenticatedUser }) => {
  authService.ensurePermission(authenticatedUser, "produtos.stock.read");

  const produto = await assertProdutoExists(produtoId);
  const saldo = await produtoModel.getSaldoEstoqueByProdutoId(produtoId);

  return {
    produto: {
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      status: produto.status,
      estoque_minimo: produto.estoque_minimo,
      ponto_reposicao: produto.ponto_reposicao
    },
    saldo_consolidado: saldo.summary,
    saldos_por_local: saldo.stockByLocation
  };
};

const getAlertasEstoqueMinimo = async ({ authenticatedUser }) => {
  authService.ensurePermission(authenticatedUser, "produtos.stock.read");

  const produtos = await produtoModel.getProdutosAlertaEstoqueMinimo();

  return {
    total_alertas: produtos.length,
    alertas: produtos
  };
};

module.exports = {
  createProduto,
  listProdutos,
  getProdutoById,
  getFornecedoresDoProduto,
  getFornecedorPrincipal,
  updateProduto,
  inactivateProduto,
  listProdutosByStatus,
  listProdutosByCategoria,
  getSaldoEstoque,
  getAlertasEstoqueMinimo
};
