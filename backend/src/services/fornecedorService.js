const fornecedorModel = require("../models/fornecedorModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseFornecedorPayload,
  parseListFilters,
  mapFornecedorResponse
} = require("../utils/fornecedorValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertFornecedorExists = async (fornecedorId) => {
  validateUuid(fornecedorId, "Fornecedor");

  const fornecedor = await fornecedorModel.findFornecedorById(fornecedorId);

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

  await ensureUniqueDocument(parsedPayload.cnpjCpf, fornecedorId);

  const fornecedor = await fornecedorModel.updateFornecedor(fornecedorId, parsedPayload);
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

  const fornecedor = await fornecedorModel.inactivateFornecedor(fornecedorId);
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

const getHistoricoCompras = async (fornecedorId) => {
  const fornecedor = await assertFornecedorExists(fornecedorId);
  const historico = await fornecedorModel.getFornecedorHistoricoCompras(fornecedorId);

  return {
    fornecedor: {
      id: fornecedor.id,
      razao_social: fornecedor.razao_social,
      cnpj_cpf: fornecedor.cpf_cnpj,
      status: fornecedor.status
    },
    summary: {
      total_produtos_vinculados: historico.summary.total_produtos_vinculados,
      total_produtos_ativos: historico.summary.total_produtos_ativos,
      ultimo_produto_atualizado_em:
        historico.summary.ultimo_produto_atualizado_em,
      modulo_compras_disponivel: false
    },
    historico_compras: [],
    produtos_relacionados: historico.relatedProducts,
    observacao:
      "Estrutura preparada para historico de compras. O schema atual ainda nao possui tabelas de pedidos de compra/entradas por fornecedor."
  };
};

module.exports = {
  createFornecedor,
  listFornecedores,
  getFornecedorById,
  updateFornecedor,
  inactivateFornecedor,
  getHistoricoCompras
};
