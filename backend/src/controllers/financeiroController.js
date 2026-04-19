const financeiroService = require("../services/financeiroService");

const gerarDuplicata = async (request, response, next) => {
  try {
    const duplicata = await financeiroService.gerarDuplicata({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Duplicata gerada com sucesso",
      data: duplicata
    });
  } catch (error) {
    return next(error);
  }
};

const gerarParcelas = async (request, response, next) => {
  try {
    const duplicatas = await financeiroService.gerarParcelas({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: `${duplicatas.length} duplicata(s) parcelada(s) gerada(s) com sucesso`,
      data: duplicatas
    });
  } catch (error) {
    return next(error);
  }
};

const listDuplicatas = async (request, response, next) => {
  try {
    const result = await financeiroService.listDuplicatas(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getDuplicataById = async (request, response, next) => {
  try {
    const duplicata = await financeiroService.getDuplicataById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: duplicata
    });
  } catch (error) {
    return next(error);
  }
};

const listDuplicatasByStatus = async (request, response, next) => {
  try {
    const duplicatas = await financeiroService.listDuplicatasByStatus(
      request.params.status
    );

    return response.status(200).json({
      status: "success",
      data: duplicatas
    });
  } catch (error) {
    return next(error);
  }
};

const listDuplicatasByCliente = async (request, response, next) => {
  try {
    const duplicatas = await financeiroService.listDuplicatasByCliente(
      request.params.clienteId
    );

    return response.status(200).json({
      status: "success",
      data: duplicatas
    });
  } catch (error) {
    return next(error);
  }
};

const registrarPagamento = async (request, response, next) => {
  try {
    const result = await financeiroService.registrarPagamento({
      duplicataId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Pagamento registrado com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listPagamentosByDuplicata = async (request, response, next) => {
  try {
    const pagamentos = await financeiroService.listPagamentosByDuplicata(
      request.params.id
    );

    return response.status(200).json({
      status: "success",
      data: pagamentos
    });
  } catch (error) {
    return next(error);
  }
};

const getAlertasVencidas = async (request, response, next) => {
  try {
    const result = await financeiroService.getAlertasVencidas();

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getAlertasVencendo = async (request, response, next) => {
  try {
    const result = await financeiroService.getAlertasVencendo(request.query.dias);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getResumoFinanceiro = async (request, response, next) => {
  try {
    const result = await financeiroService.getResumoFinanceiro();

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  gerarDuplicata,
  gerarParcelas,
  listDuplicatas,
  getDuplicataById,
  listDuplicatasByStatus,
  listDuplicatasByCliente,
  registrarPagamento,
  listPagamentosByDuplicata,
  getAlertasVencidas,
  getAlertasVencendo,
  getResumoFinanceiro
};
