const estoqueService = require("../services/estoqueService");

const listarLocais = async (request, response, next) => {
  try {
    const result = await estoqueService.listarLocais(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const criarLocal = async (request, response, next) => {
  try {
    const local = await estoqueService.criarLocal({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Local de estoque cadastrado com sucesso",
      data: local
    });
  } catch (error) {
    return next(error);
  }
};

const atualizarLocal = async (request, response, next) => {
  try {
    const local = await estoqueService.atualizarLocal({
      localId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Local de estoque atualizado com sucesso",
      data: local
    });
  } catch (error) {
    return next(error);
  }
};

const inativarLocal = async (request, response, next) => {
  try {
    const local = await estoqueService.inativarLocal({
      localId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Local de estoque inativado com sucesso",
      data: local
    });
  } catch (error) {
    return next(error);
  }
};

const registrarEntrada = async (request, response, next) => {
  try {
    const result = await estoqueService.registrarEntrada({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Entrada de estoque registrada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const registrarSaida = async (request, response, next) => {
  try {
    const result = await estoqueService.registrarSaida({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Saida de estoque registrada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const registrarTransferencia = async (request, response, next) => {
  try {
    const result = await estoqueService.registrarTransferencia({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Transferencia de estoque registrada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const registrarAjuste = async (request, response, next) => {
  try {
    const result = await estoqueService.registrarAjuste({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Ajuste de estoque registrado com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const registrarDevolucaoFornecedor = async (request, response, next) => {
  try {
    const result = await estoqueService.registrarDevolucaoFornecedor({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Devolucao para fornecedor registrada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const registrarDevolucaoCliente = async (request, response, next) => {
  try {
    const result = await estoqueService.registrarDevolucaoCliente({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Devolucao de cliente registrada com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

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

const buscarSaldoPorProduto = async (request, response, next) => {
  try {
    const result = await estoqueService.buscarSaldoPorProduto(request.params.produtoId);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const buscarSaldoPorProdutoELocal = async (request, response, next) => {
  try {
    const result = await estoqueService.buscarSaldoPorProdutoELocal(
      request.params.produtoId,
      request.params.localId
    );

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
  listarLocais,
  criarLocal,
  atualizarLocal,
  inativarLocal,
  registrarEntrada,
  registrarSaida,
  registrarTransferencia,
  registrarAjuste,
  registrarDevolucaoFornecedor,
  registrarDevolucaoCliente,
  listarSaldos,
  buscarSaldoPorProduto,
  buscarSaldoPorProdutoELocal,
  listarMovimentacoes,
  listarAlertasBaixoEstoque
};
