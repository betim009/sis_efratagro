const clienteService = require("../services/clienteService");

const createCliente = async (request, response, next) => {
  try {
    const cliente = await clienteService.createCliente({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Cliente cadastrado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const listClientes = async (request, response, next) => {
  try {
    const result = await clienteService.listClientes(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getClienteById = async (request, response, next) => {
  try {
    const cliente = await clienteService.getClienteById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const updateCliente = async (request, response, next) => {
  try {
    const cliente = await clienteService.updateCliente({
      clienteId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Cliente atualizado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const changeClienteStatus = async (request, response, next) => {
  try {
    const cliente = await clienteService.changeClienteStatus({
      clienteId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Status do cliente atualizado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const inactivateCliente = async (request, response, next) => {
  try {
    const cliente = await clienteService.inactivateCliente({
      clienteId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Cliente inativado com sucesso",
      data: cliente
    });
  } catch (error) {
    return next(error);
  }
};

const getHistoricoCompras = async (request, response, next) => {
  try {
    const historico = await clienteService.getHistoricoCompras(request.params.id);

    return response.status(200).json({
      status: "success",
      data: historico
    });
  } catch (error) {
    return next(error);
  }
};

const getDebitosEmAberto = async (request, response, next) => {
  try {
    const debitos = await clienteService.getDebitosEmAberto({
      clienteId: request.params.id,
      authenticatedUser: request.user
    });

    return response.status(200).json({
      status: "success",
      data: debitos
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCliente,
  listClientes,
  getClienteById,
  updateCliente,
  changeClienteStatus,
  inactivateCliente,
  getHistoricoCompras,
  getDebitosEmAberto
};
