const vendaService = require("../services/vendaService");

const listVendas = async (request, response, next) => {
  try {
    const result = await vendaService.listVendas(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listVendas
};
