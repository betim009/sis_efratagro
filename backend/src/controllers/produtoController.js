const produtoService = require("../services/produtoService");

const createProduto = async (request, response, next) => {
  try {
    const produto = await produtoService.createProduto({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Produto cadastrado com sucesso",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const listProdutos = async (request, response, next) => {
  try {
    const result = await produtoService.listProdutos(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getProdutoById = async (request, response, next) => {
  try {
    const produto = await produtoService.getProdutoById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduto = async (request, response, next) => {
  try {
    const produto = await produtoService.updateProduto({
      produtoId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Produto atualizado com sucesso",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const inactivateProduto = async (request, response, next) => {
  try {
    const produto = await produtoService.inactivateProduto({
      produtoId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Produto inativado com sucesso",
      data: produto
    });
  } catch (error) {
    return next(error);
  }
};

const listProdutosByStatus = async (request, response, next) => {
  try {
    const result = await produtoService.listProdutosByStatus(request.params.status);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listProdutosByCategoria = async (request, response, next) => {
  try {
    const result = await produtoService.listProdutosByCategoria(
      request.params.categoria
    );

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getSaldoEstoque = async (request, response, next) => {
  try {
    const saldo = await produtoService.getSaldoEstoque({
      produtoId: request.params.id,
      authenticatedUser: request.user
    });

    return response.status(200).json({
      status: "success",
      data: saldo
    });
  } catch (error) {
    return next(error);
  }
};

const getAlertasEstoqueMinimo = async (request, response, next) => {
  try {
    const result = await produtoService.getAlertasEstoqueMinimo({
      authenticatedUser: request.user
    });

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduto,
  listProdutos,
  getProdutoById,
  updateProduto,
  inactivateProduto,
  listProdutosByStatus,
  listProdutosByCategoria,
  getSaldoEstoque,
  getAlertasEstoqueMinimo
};
