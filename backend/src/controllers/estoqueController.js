const estoqueService = require("../services/estoqueService");

const listarSaldos = async (request, response, next) => {
  try {
    const result = await estoqueService.listarSaldos(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listarMovimentacoes = async (request, response, next) => {
  try {
    const result = await estoqueService.listarMovimentacoes(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listarAlertasBaixoEstoque = async (request, response, next) => {
  try {
    const result = await estoqueService.listarAlertasBaixoEstoque();

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listarSaldos,
  listarMovimentacoes,
  listarAlertasBaixoEstoque
};
