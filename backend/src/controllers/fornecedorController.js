const fornecedorService = require("../services/fornecedorService");

const createFornecedor = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.createFornecedor({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Fornecedor cadastrado com sucesso",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const listFornecedores = async (request, response, next) => {
  try {
    const result = await fornecedorService.listFornecedores(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getFornecedorById = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.getFornecedorById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const updateFornecedor = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.updateFornecedor({
      fornecedorId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Fornecedor atualizado com sucesso",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const inactivateFornecedor = async (request, response, next) => {
  try {
    const fornecedor = await fornecedorService.inactivateFornecedor({
      fornecedorId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Fornecedor inativado com sucesso",
      data: fornecedor
    });
  } catch (error) {
    return next(error);
  }
};

const getHistoricoCompras = async (request, response, next) => {
  try {
    const historico = await fornecedorService.getHistoricoCompras(request.params.id);

    return response.status(200).json({
      status: "success",
      data: historico
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFornecedor,
  listFornecedores,
  getFornecedorById,
  updateFornecedor,
  inactivateFornecedor,
  getHistoricoCompras
};
