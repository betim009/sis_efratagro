const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  isValidUuid,
  parseLogFilters
} = require("../utils/auditoriaValidation");

// ─── Consultas de Logs ─────────────────────────────────────────────

const getLogById = async (id) => {
  if (!isValidUuid(id)) {
    throw new AppError("ID de log invalido", 400);
  }

  const log = await auditLogModel.findById(id);
  if (!log) {
    throw new AppError("Log de auditoria nao encontrado", 404);
  }

  return log;
};

const listLogs = async (queryParams) => {
  const filters = parseLogFilters(queryParams);
  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByUsuario = async (usuarioId, queryParams) => {
  if (!isValidUuid(usuarioId)) {
    throw new AppError("usuarioId invalido", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.usuarioId = usuarioId;

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByModulo = async (modulo, queryParams) => {
  if (!modulo || !modulo.trim()) {
    throw new AppError("Modulo obrigatorio", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.modulo = modulo.trim().toLowerCase();

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByEntidade = async (entidade, entidadeId, queryParams) => {
  if (!entidade || !entidade.trim()) {
    throw new AppError("Entidade obrigatoria", 400);
  }

  if (!isValidUuid(entidadeId)) {
    throw new AppError("entidadeId invalido", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.entidade = entidade.trim().toLowerCase();
  filters.entidadeId = entidadeId;

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const listLogsByAcao = async (acao, queryParams) => {
  if (!acao || !acao.trim()) {
    throw new AppError("Acao obrigatoria", 400);
  }

  const filters = parseLogFilters(queryParams);
  filters.acao = acao.trim().toUpperCase();

  const result = await auditLogModel.listLogs(filters);

  return {
    logs: result.logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

const getMetricas = async (queryParams) => {
  const filters = parseLogFilters(queryParams);
  return auditLogModel.getMetricas(filters);
};

module.exports = {
  getLogById,
  listLogs,
  listLogsByUsuario,
  listLogsByModulo,
  listLogsByEntidade,
  listLogsByAcao,
  getMetricas
};
