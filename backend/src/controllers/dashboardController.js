const dashboardService = require("../services/dashboardService");

const getResumo = async (request, response, next) => {
  try {
    const data = await dashboardService.getResumo();

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getVendas = async (request, response, next) => {
  try {
    const data = await dashboardService.getVendas(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getFinanceiro = async (request, response, next) => {
  try {
    const data = await dashboardService.getFinanceiro(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getEstoque = async (request, response, next) => {
  try {
    const data = await dashboardService.getEstoque(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getVendasFuturas = async (request, response, next) => {
  try {
    const data = await dashboardService.getVendasFuturas(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getFrota = async (request, response, next) => {
  try {
    const data = await dashboardService.getFrota(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getSeriesVendas = async (request, response, next) => {
  try {
    const data = await dashboardService.getSeriesVendas(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getAlertas = async (request, response, next) => {
  try {
    const data = await dashboardService.getAlertas(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

const getCompleto = async (request, response, next) => {
  try {
    const data = await dashboardService.getCompleto(request.query);

    return response.status(200).json({
      status: "success",
      data
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getResumo,
  getVendas,
  getFinanceiro,
  getEstoque,
  getVendasFuturas,
  getFrota,
  getSeriesVendas,
  getAlertas,
  getCompleto
};
