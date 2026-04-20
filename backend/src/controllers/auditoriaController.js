const auditoriaService = require("../services/auditoriaService");

const listLogs = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogs(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getLogById = async (request, response, next) => {
  try {
    const log = await auditoriaService.getLogById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: log
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByUsuario = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByUsuario(
      request.params.usuarioId,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByModulo = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByModulo(
      request.params.modulo,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByEntidade = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByEntidade(
      request.params.entidade,
      request.params.entidadeId,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listLogsByAcao = async (request, response, next) => {
  try {
    const result = await auditoriaService.listLogsByAcao(
      request.params.acao,
      request.query
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getMetricas = async (request, response, next) => {
  try {
    const result = await auditoriaService.getMetricas(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listLogs,
  getLogById,
  listLogsByUsuario,
  listLogsByModulo,
  listLogsByEntidade,
  listLogsByAcao,
  getMetricas
};
