const compraService = require("../services/compraService");

const criarCompra = async (request, response, next) => {
  try {
    const compra = await compraService.criarCompra({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Compra registrada com sucesso",
      data: compra
    });
  } catch (error) {
    return next(error);
  }
};

const listarCompras = async (request, response, next) => {
  try {
    const result = await compraService.listarCompras(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const buscarCompraPorId = async (request, response, next) => {
  try {
    const compra = await compraService.buscarCompraPorId(request.params.id);

    return response.status(200).json({
      status: "success",
      data: compra
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  criarCompra,
  listarCompras,
  buscarCompraPorId
};
