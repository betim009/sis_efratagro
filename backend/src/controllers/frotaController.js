const frotaService = require("../services/frotaService");

// ═══════════════════════════════════════════════════════════════════════
// VEÍCULOS
// ═══════════════════════════════════════════════════════════════════════

const createVeiculo = async (request, response, next) => {
  try {
    const veiculo = await frotaService.createVeiculo({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Veiculo cadastrado com sucesso",
      data: veiculo
    });
  } catch (error) {
    return next(error);
  }
};

const listVeiculos = async (request, response, next) => {
  try {
    const result = await frotaService.listVeiculos(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getVeiculoById = async (request, response, next) => {
  try {
    const veiculo = await frotaService.getVeiculoById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: veiculo
    });
  } catch (error) {
    return next(error);
  }
};

const updateVeiculo = async (request, response, next) => {
  try {
    const veiculo = await frotaService.updateVeiculo({
      veiculoId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Veiculo atualizado com sucesso",
      data: veiculo
    });
  } catch (error) {
    return next(error);
  }
};

const updateVeiculoStatus = async (request, response, next) => {
  try {
    const veiculo = await frotaService.updateVeiculoStatus({
      veiculoId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Status do veiculo atualizado com sucesso",
      data: veiculo
    });
  } catch (error) {
    return next(error);
  }
};

const listVeiculosByStatus = async (request, response, next) => {
  try {
    const veiculos = await frotaService.listVeiculosByStatus(request.params.status);

    return response.status(200).json({
      status: "success",
      data: veiculos
    });
  } catch (error) {
    return next(error);
  }
};

const getHistoricoVeiculo = async (request, response, next) => {
  try {
    const historico = await frotaService.getHistoricoVeiculo(request.params.id);

    return response.status(200).json({
      status: "success",
      data: historico
    });
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// MANUTENÇÕES
// ═══════════════════════════════════════════════════════════════════════

const createManutencao = async (request, response, next) => {
  try {
    const manutencao = await frotaService.createManutencao({
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(201).json({
      status: "success",
      message: "Manutencao registrada com sucesso",
      data: manutencao
    });
  } catch (error) {
    return next(error);
  }
};

const listManutencoes = async (request, response, next) => {
  try {
    const result = await frotaService.listManutencoes(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getManutencaoById = async (request, response, next) => {
  try {
    const manutencao = await frotaService.getManutencaoById(request.params.id);

    return response.status(200).json({
      status: "success",
      data: manutencao
    });
  } catch (error) {
    return next(error);
  }
};

const updateManutencao = async (request, response, next) => {
  try {
    const manutencao = await frotaService.updateManutencao({
      manutencaoId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Manutencao atualizada com sucesso",
      data: manutencao
    });
  } catch (error) {
    return next(error);
  }
};

const updateManutencaoStatus = async (request, response, next) => {
  try {
    const manutencao = await frotaService.updateManutencaoStatus({
      manutencaoId: request.params.id,
      payload: request.body,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Status da manutencao atualizado com sucesso",
      data: manutencao
    });
  } catch (error) {
    return next(error);
  }
};

const listManutencoesByVeiculo = async (request, response, next) => {
  try {
    const manutencoes = await frotaService.listManutencoesByVeiculo(request.params.id);

    return response.status(200).json({
      status: "success",
      data: manutencoes
    });
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// ALERTAS E RELATÓRIOS
// ═══════════════════════════════════════════════════════════════════════

const getAlertasManutencaoPreventiva = async (request, response, next) => {
  try {
    const result = await frotaService.getAlertasManutencaoPreventiva(request.query.dias);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getRelatorioCustosManutencao = async (request, response, next) => {
  try {
    const result = await frotaService.getRelatorioCustosManutencao(request.query);

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

const getResumoFrota = async (request, response, next) => {
  try {
    const result = await frotaService.getResumoFrota();

    return response.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// VINCULAÇÃO COM ENTREGAS
// ═══════════════════════════════════════════════════════════════════════

const vincularVeiculoAEntrega = async (request, response, next) => {
  try {
    const result = await frotaService.vincularVeiculoAEntrega({
      entregaId: request.params.entregaId,
      veiculoId: request.params.veiculoId,
      authenticatedUser: request.user,
      request
    });

    return response.status(200).json({
      status: "success",
      message: "Veiculo vinculado a entrega com sucesso",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createVeiculo,
  listVeiculos,
  getVeiculoById,
  updateVeiculo,
  updateVeiculoStatus,
  listVeiculosByStatus,
  getHistoricoVeiculo,
  createManutencao,
  listManutencoes,
  getManutencaoById,
  updateManutencao,
  updateManutencaoStatus,
  listManutencoesByVeiculo,
  getAlertasManutencaoPreventiva,
  getRelatorioCustosManutencao,
  getResumoFrota,
  vincularVeiculoAEntrega
};
