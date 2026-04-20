/**
 * Helper reutilizável para registrar logs de auditoria de forma consistente.
 *
 * Estratégia: os services já chamam auditLogModel.createAuditLog() diretamente.
 * Este helper complementa isso com funções de conveniência para cenários comuns,
 * garantindo que a descrição e os dados de before/after sejam formatados de forma uniforme.
 *
 * Decisão: o helper NÃO substitui as chamadas diretas existentes — apenas oferece
 * atalhos para quem quiser adotar gradualmente. A chamada direta ao model continua válida.
 */

const auditLogModel = require("../models/auditLogModel");

/**
 * Extrai metadados da request (IP + User-Agent).
 * Reutilizável em qualquer service.
 */
const getRequestMetadata = (request) => ({
  ipAddress: request ? request.ip : null,
  userAgent: request ? request.get("user-agent") || null : null
});

/**
 * Registra log de criação (INSERT).
 */
const logCreate = async ({
  userId,
  tableName,
  recordId,
  newData,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "INSERT",
    newData,
    descricao: descricao || `Registro criado em ${tableName}`,
    ...metadata
  });
};

/**
 * Registra log de atualização (UPDATE) com before/after.
 */
const logUpdate = async ({
  userId,
  tableName,
  recordId,
  previousData,
  newData,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "UPDATE",
    previousData,
    newData,
    descricao: descricao || `Registro atualizado em ${tableName}`,
    ...metadata
  });
};

/**
 * Registra log de inativação (INACTIVATE) com before/after de status.
 */
const logInactivate = async ({
  userId,
  tableName,
  recordId,
  previousStatus,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "INACTIVATE",
    previousData: { status: previousStatus },
    newData: { status: "INATIVO" },
    descricao: descricao || `Registro inativado em ${tableName}`,
    ...metadata
  });
};

/**
 * Registra log de mudança de status (STATUS_CHANGE) com before/after.
 */
const logStatusChange = async ({
  userId,
  tableName,
  recordId,
  previousStatus,
  newStatus,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action: "STATUS_CHANGE",
    previousData: { status: previousStatus },
    newData: { status: newStatus },
    descricao: descricao || `Status alterado de ${previousStatus} para ${newStatus} em ${tableName}`,
    ...metadata
  });
};

/**
 * Registra log de ação genérica (qualquer ação válida).
 * Útil para ações específicas como PAYMENT_REGISTER, STOCK_MOVEMENT etc.
 */
const logAction = async ({
  userId,
  tableName,
  recordId,
  action,
  previousData = null,
  newData = null,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);
  return auditLogModel.createAuditLog({
    userId,
    tableName,
    recordId,
    action,
    previousData,
    newData,
    descricao,
    ...metadata
  });
};

module.exports = {
  getRequestMetadata,
  logCreate,
  logUpdate,
  logInactivate,
  logStatusChange,
  logAction
};
