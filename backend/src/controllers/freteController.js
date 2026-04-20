const freteService = require("../services/freteService");

// ═══════════════════════════════════════════════════════════════════════
// TABELAS DE FRETE
// ═══════════════════════════════════════════════════════════════════════

const createTabela = async (request, response, next) => {
  try {
    const tabela = await freteService.createTabela({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Tabela de frete criada com sucesso",
      data: tabela
    });
  } catch (error) {
    return next(error);
  }
};

const listTabelas = async (request, response, next) => {
  try {
    const result = await freteService.listTabelas(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getTabelaById = async (request, response, next) => {
  try {
    const tabela = await freteService.getTabelaById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: tabela
    });
  } catch (error) {
    return next(error);
  }
};

const updateTabela = async (request, response, next) => {
  try {
    const tabela = await freteService.updateTabela({
      tabelaId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Tabela de frete atualizada com sucesso",
      data: tabela
    });
  } catch (error) {
    return next(error);
  }
};

const inativarTabela = async (request, response, next) => {
  try {
    const tabela = await freteService.inativarTabela({
      tabelaId: request.params.id,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Tabela de frete inativada com sucesso",
      data: tabela
    });
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// FRETES OPERACIONAIS
// ═══════════════════════════════════════════════════════════════════════

const calcularFrete = async (request, response, next) => {
  try {
    const frete = await freteService.calcularERegistrar({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Frete calculado e registrado com sucesso",
      data: frete
    });
  } catch (error) {
    return next(error);
  }
};

const listFretes = async (request, response, next) => {
  try {
    const result = await freteService.listFretes(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getFreteById = async (request, response, next) => {
  try {
    const frete = await freteService.getFreteById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: frete
    });
  } catch (error) {
    return next(error);
  }
};

const getFreteByVendaId = async (request, response, next) => {
  try {
    const frete = await freteService.getFreteByVendaId(request.params.vendaId);

    return response.status(200).json({
      status: "success",
      data: frete
    });
  } catch (error) {
    return next(error);
  }
};

const vincularEntrega = async (request, response, next) => {
  try {
    const frete = await freteService.vincularEntrega({
      freteId: request.params.id,
      entregaId: request.params.entregaId,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Entrega vinculada ao frete com sucesso",
      data: frete
    });
  } catch (error) {
    return next(error);
  }
};

const vincularVeiculo = async (request, response, next) => {
  try {
    const frete = await freteService.vincularVeiculo({
      freteId: request.params.id,
      veiculoId: request.params.veiculoId,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Veiculo vinculado ao frete com sucesso",
      data: frete
    });
  } catch (error) {
    return next(error);
  }
};

const registrarCustoReal = async (request, response, next) => {
  try {
    const frete = await freteService.registrarCustoReal({
      freteId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Custo real registrado com sucesso",
      data: frete
    });
  } catch (error) {
    return next(error);
  }
};

const listFretesPorPeriodo = async (request, response, next) => {
  try {
    const result = await freteService.listFretesPorPeriodo(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const listFretesPorRegiao = async (request, response, next) => {
  try {
    const result = await freteService.listFretesPorRegiao(
      request.params.regiao,
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
  createTabela,
  listTabelas,
  getTabelaById,
  updateTabela,
  inativarTabela,
  calcularFrete,
  listFretes,
  getFreteById,
  getFreteByVendaId,
  vincularEntrega,
  vincularVeiculo,
  registrarCustoReal,
  listFretesPorPeriodo,
  listFretesPorRegiao
};
