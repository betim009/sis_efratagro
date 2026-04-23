const fornecedorModel = require("../models/fornecedorModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateEntityIdentifier,
  parseFornecedorPayload,
  parseListFilters,
  mapFornecedorResponse
} = require("../utils/fornecedorValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertFornecedorExists = async (fornecedorId) => {
  validateEntityIdentifier(fornecedorId, "Fornecedor");

  const fornecedor = await fornecedorModel.findFornecedorByIdentifier(fornecedorId);

  if (!fornecedor) {
    throw new AppError("Fornecedor nao encontrado", 404);
  }

  return fornecedor;
};

const ensureUniqueDocument = async (cnpjCpf, excludeId = null) => {
  const fornecedor = await fornecedorModel.findFornecedorByDocument(cnpjCpf, excludeId);

  if (fornecedor) {
    throw new AppError("Ja existe fornecedor cadastrado com este CNPJ/CPF", 409);
  }
};

const createFornecedor = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseFornecedorPayload(payload);

  await ensureUniqueDocument(parsedPayload.cnpjCpf);

  const fornecedor = await fornecedorModel.createFornecedor(parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: fornecedor.id,
    action: "INSERT",
    newData: {
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    ...metadata
  });

  return mapFornecedorResponse(fornecedor);
};

const listFornecedores = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [fornecedores, total] = await Promise.all([
    fornecedorModel.listFornecedores(filters),
    fornecedorModel.countFornecedores(filters)
  ]);

  return {
    items: fornecedores.map(mapFornecedorResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getFornecedorById = async (fornecedorId) => {
  const fornecedor = await assertFornecedorExists(fornecedorId);
  return mapFornecedorResponse(fornecedor);
};

const updateFornecedor = async ({
  fornecedorId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentFornecedor = await assertFornecedorExists(fornecedorId);
  const parsedPayload = parseFornecedorPayload(payload);

  await ensureUniqueDocument(parsedPayload.cnpjCpf, currentFornecedor.id);

  const fornecedor = await fornecedorModel.updateFornecedor(currentFornecedor.id, parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: fornecedor.id,
    action: "UPDATE",
    previousData: {
      razao_social: currentFornecedor.razao_social,
      cnpj_cpf: currentFornecedor.cpf_cnpj,
      status: currentFornecedor.status
    },
    newData: {
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    ...metadata
  });

  return mapFornecedorResponse(fornecedor);
};

const inactivateFornecedor = async ({
  fornecedorId,
  authenticatedUser,
  request
}) => {
  const currentFornecedor = await assertFornecedorExists(fornecedorId);

  if (currentFornecedor.status === "INATIVO") {
    throw new AppError("Fornecedor ja esta inativo", 409);
  }

  const fornecedor = await fornecedorModel.inactivateFornecedor(currentFornecedor.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: fornecedor.id,
    action: "UPDATE",
    previousData: { status: currentFornecedor.status },
    newData: { status: fornecedor.status },
    ...metadata
  });

  return mapFornecedorResponse(fornecedor);
};

const deleteFornecedor = async ({ fornecedorId, authenticatedUser, request }) => {
  const currentFornecedor = await assertFornecedorExists(fornecedorId);
  const hasHistory = await fornecedorModel.hasFornecedorHistorico(currentFornecedor.id);

  if (hasHistory) {
    throw new AppError("Nao e permitido excluir fornecedor com historico", 409);
  }

  const fornecedor = await fornecedorModel.deleteFornecedor(currentFornecedor.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fornecedores",
    recordId: currentFornecedor.id,
    action: "DELETE",
    previousData: {
      razao_social: currentFornecedor.razao_social,
      cnpj_cpf: currentFornecedor.cpf_cnpj,
      status: currentFornecedor.status
    },
    ...metadata
  });

  return fornecedor;
};

const getHistoricoCompras = async (fornecedorId) => {
  const fornecedor = await assertFornecedorExists(fornecedorId);
  const historico = await fornecedorModel.getFornecedorHistoricoCompras(fornecedor.id);

  return {
    fornecedor: {
      id: fornecedor.id,
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    summary: {
      total_compras: historico.summary.total_compras,
      quantidade_total_comprada: historico.summary.quantidade_total_comprada,
      valor_total_compras: historico.summary.valor_total_compras,
      ultima_compra_em: historico.summary.ultima_compra_em,
      pronto_para_financeiro: true
    },
    historico_compras: historico.purchases,
    produtos_relacionados: historico.relatedProducts
  };
};

const getProdutosByFornecedor = async (fornecedorId) => {
  const fornecedor = await assertFornecedorExists(fornecedorId);
  const produtos = await fornecedorModel.getProdutosByFornecedor(fornecedor.id);

  return {
    fornecedor: {
      id: fornecedor.id,
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    items: produtos
  };
};

module.exports = {
  createFornecedor,
  listFornecedores,
  getFornecedorById,
  updateFornecedor,
  inactivateFornecedor,
  deleteFornecedor,
  getHistoricoCompras,
  getProdutosByFornecedor
};
