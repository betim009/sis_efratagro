const notificacaoService = require("../services/notificacaoService");

const listarNotificacoes = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarMinhas(
      request.user.id,
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

const listarTodasNotificacoes = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarTodas(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const buscarPorId = async (request, response, next) => {
  try {
    const notificacao = await notificacaoService.buscarPorId(
      request.params.id,
      request.user
    );

    return response.status(200).json({
      status: "success",
      data: notificacao
    });
  } catch (error) {
    return next(error);
  }
};

const contarNaoLidas = async (request, response, next) => {
  try {
    const result = await notificacaoService.contarNaoLidas(request.user.id);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const marcarComoLida = async (request, response, next) => {
  try {
    const notificacao = await notificacaoService.marcarComoLida(
      request.params.id,
      request.user
    );

    return response.status(200).json({
      status: "success",
      data: notificacao
    });
  } catch (error) {
    return next(error);
  }
};

const marcarTodasComoLidas = async (request, response, next) => {
  try {
    const result = await notificacaoService.marcarTodasComoLidas(
      request.user.id
    );

    return response.status(200).json({
      status: "success",
      message: `${result.atualizadas} notificacao(oes) marcada(s) como lida(s)`,
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const arquivar = async (request, response, next) => {
  try {
    const notificacao = await notificacaoService.arquivarNotificacao(
      request.params.id,
      request.user
    );

    return response.status(200).json({
      status: "success",
      data: notificacao
    });
  } catch (error) {
    return next(error);
  }
};

const listarPorTipo = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarPorTipo(
      request.params.tipo,
      request.user.id,
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

const listarPorStatus = async (request, response, next) => {
  try {
    const result = await notificacaoService.listarPorStatus(
      request.params.status,
      request.user.id,
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

module.exports = {
  listarNotificacoes,
  listarTodasNotificacoes,
  buscarPorId,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  arquivar,
  listarPorTipo,
  listarPorStatus
};
