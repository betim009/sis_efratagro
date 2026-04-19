const clienteModel = require("../models/clienteModel");
const auditLogModel = require("../models/auditLogModel");
const authService = require("./authService");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseClientePayload,
  parseStatusPayload,
  parseListFilters,
  mapClienteResponse
} = require("../utils/clienteValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const assertClienteExists = async (clienteId) => {
  validateUuid(clienteId, "Cliente");

  const cliente = await clienteModel.findClienteById(clienteId);

  if (!cliente) {
    throw new AppError("Cliente nao encontrado", 404);
  }

  return cliente;
};

const ensureUniqueDocument = async (cpfCnpj, excludeId = null) => {
  const cliente = await clienteModel.findClienteByDocument(cpfCnpj, excludeId);

  if (cliente) {
    throw new AppError("Ja existe cliente cadastrado com este CPF/CNPJ", 409);
  }
};

const resolveStatusPermission = (status) => {
  if (status === "INATIVO") {
    return "clientes.inactivate";
  }

  if (status === "BLOQUEADO") {
    return "clientes.block";
  }

  return "clientes.update";
};

const createCliente = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseClientePayload(payload, { allowStatus: true });

  await ensureUniqueDocument(parsedPayload.cpfCnpj);

  const cliente = await clienteModel.createCliente(parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "clientes",
    recordId: cliente.id,
    action: "INSERT",
    newData: {
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      status: cliente.status
    },
    ...metadata
  });

  return mapClienteResponse(cliente);
};

const listClientes = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [clientes, total] = await Promise.all([
    clienteModel.listClientes(filters),
    clienteModel.countClientes(filters)
  ]);

  return {
    items: clientes.map(mapClienteResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getClienteById = async (clienteId) => {
  const cliente = await assertClienteExists(clienteId);
  return mapClienteResponse(cliente);
};

const updateCliente = async ({
  clienteId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentCliente = await assertClienteExists(clienteId);
  const parsedPayload = parseClientePayload(payload);

  await ensureUniqueDocument(parsedPayload.cpfCnpj, clienteId);

  const cliente = await clienteModel.updateCliente(clienteId, parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "clientes",
    recordId: cliente.id,
    action: "UPDATE",
    previousData: {
      nome_razao_social: currentCliente.nome_razao_social,
      cpf_cnpj: currentCliente.cpf_cnpj,
      limite_credito: currentCliente.limite_credito
    },
    newData: {
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      limite_credito: cliente.limite_credito
    },
    ...metadata
  });

  return mapClienteResponse(cliente);
};

const changeClienteStatus = async ({
  clienteId,
  payload,
  authenticatedUser,
  request
}) => {
  const currentCliente = await assertClienteExists(clienteId);
  const nextStatus = parseStatusPayload(payload);

  authService.ensurePermission(
    authenticatedUser,
    resolveStatusPermission(nextStatus)
  );

  if (currentCliente.status === nextStatus) {
    throw new AppError("Cliente ja possui o status informado", 409);
  }

  if (currentCliente.status === "INATIVO" && nextStatus === "BLOQUEADO") {
    throw new AppError(
      "Cliente inativo nao pode ser alterado diretamente para bloqueado",
      409
    );
  }

  const cliente = await clienteModel.updateClienteStatus(clienteId, nextStatus);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "clientes",
    recordId: cliente.id,
    action: "UPDATE",
    previousData: { status: currentCliente.status },
    newData: { status: cliente.status },
    ...metadata
  });

  return mapClienteResponse(cliente);
};

const inactivateCliente = async ({
  clienteId,
  authenticatedUser,
  request
}) => {
  return changeClienteStatus({
    clienteId,
    payload: { status: "INATIVO" },
    authenticatedUser,
    request
  });
};

const getHistoricoCompras = async (clienteId) => {
  const cliente = await assertClienteExists(clienteId);
  const historico = await clienteModel.getClienteHistoricoCompras(clienteId);

  return {
    cliente: {
      id: cliente.id,
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      status: cliente.status
    },
    summary: {
      total_vendas: historico.summary.total_vendas,
      valor_total_compras: historico.summary.valor_total_compras,
      ultima_compra_em: historico.summary.ultima_compra_em
    },
    historico_compras: historico.sales
  };
};

const getDebitosEmAberto = async ({
  clienteId,
  authenticatedUser
}) => {
  authService.ensurePermission(authenticatedUser, "clientes.financial.read");

  const cliente = await assertClienteExists(clienteId);
  const debitos = await clienteModel.getClienteDebitosEmAberto(clienteId);

  return {
    cliente: {
      id: cliente.id,
      nome_razao_social: cliente.nome_razao_social,
      cpf_cnpj: cliente.cpf_cnpj,
      status: cliente.status,
      limite_credito: cliente.limite_credito
    },
    summary: {
      total_duplicatas_em_aberto: debitos.summary.total_duplicatas_em_aberto,
      valor_total_em_aberto: debitos.summary.valor_total_em_aberto,
      proximo_vencimento: debitos.summary.proximo_vencimento
    },
    debitos_em_aberto: debitos.titles
  };
};

module.exports = {
  createCliente,
  listClientes,
  getClienteById,
  updateCliente,
  changeClienteStatus,
  inactivateCliente,
  getHistoricoCompras,
  getDebitosEmAberto
};
