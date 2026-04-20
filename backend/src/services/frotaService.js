const veiculoModel = require("../models/veiculoModel");
const manutencaoModel = require("../models/manutencaoModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseVeiculoPayload,
  parseVeiculoStatusPayload,
  parseManutencaoPayload,
  parseManutencaoUpdatePayload,
  parseManutencaoStatusPayload,
  parseListVeiculosFilters,
  parseListManutencoesFilters,
  mapVeiculoResponse,
  mapManutencaoResponse,
  VALID_STATUS_VEICULO,
  VALID_STATUS_MANUTENCAO
} = require("../utils/frotaValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

// ─── Helpers internos ────────────────────────────────────────────────

const assertVeiculoExists = async (veiculoId) => {
  validateUuid(veiculoId, "Veiculo");

  const veiculo = await veiculoModel.findVeiculoById(veiculoId);

  if (!veiculo) {
    throw new AppError("Veiculo nao encontrado", 404);
  }

  return veiculo;
};

const assertManutencaoExists = async (manutencaoId) => {
  validateUuid(manutencaoId, "Manutencao");

  const manutencao = await manutencaoModel.findManutencaoById(manutencaoId);

  if (!manutencao) {
    throw new AppError("Manutencao nao encontrada", 404);
  }

  return manutencao;
};

const ensureUniquePlaca = async (placa, excludeId = null) => {
  const veiculo = await veiculoModel.findVeiculoByPlaca(placa, excludeId);

  if (veiculo) {
    throw new AppError("Ja existe veiculo cadastrado com esta placa", 409);
  }
};

const validateResponsavel = async (responsavelUsuarioId) => {
  if (!responsavelUsuarioId) {
    return null;
  }

  const usuario = await veiculoModel.findUsuarioById(responsavelUsuarioId);

  if (!usuario) {
    throw new AppError("Usuario responsavel nao encontrado", 404);
  }

  return usuario;
};

const validateFornecedor = async (fornecedorId) => {
  if (!fornecedorId) {
    return null;
  }

  const fornecedor = await manutencaoModel.findFornecedorById(fornecedorId);

  if (!fornecedor) {
    throw new AppError("Fornecedor nao encontrado", 404);
  }

  return fornecedor;
};

// ═══════════════════════════════════════════════════════════════════════
// VEÍCULOS
// ═══════════════════════════════════════════════════════════════════════

const createVeiculo = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseVeiculoPayload(payload);

  await Promise.all([
    ensureUniquePlaca(parsedPayload.placa),
    validateResponsavel(parsedPayload.responsavelUsuarioId)
  ]);

  const veiculo = await veiculoModel.createVeiculo(parsedPayload);
  const veiculoCompleto = await veiculoModel.findVeiculoById(veiculo.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "veiculos",
    recordId: veiculo.id,
    action: "INSERT",
    newData: {
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      tipo_veiculo: veiculo.tipo_veiculo,
      status: veiculo.status
    },
    ...metadata
  });

  return mapVeiculoResponse(veiculoCompleto);
};

const listVeiculos = async (queryParams) => {
  const filters = parseListVeiculosFilters(queryParams);
  const [veiculos, total] = await Promise.all([
    veiculoModel.listVeiculos(filters),
    veiculoModel.countVeiculos(filters)
  ]);

  return {
    items: veiculos.map(mapVeiculoResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getVeiculoById = async (veiculoId) => {
  const veiculo = await assertVeiculoExists(veiculoId);
  return mapVeiculoResponse(veiculo);
};

const updateVeiculo = async ({ veiculoId, payload, authenticatedUser, request }) => {
  const currentVeiculo = await assertVeiculoExists(veiculoId);
  const parsedPayload = parseVeiculoPayload(payload);

  await Promise.all([
    ensureUniquePlaca(parsedPayload.placa, veiculoId),
    validateResponsavel(parsedPayload.responsavelUsuarioId)
  ]);

  const veiculo = await veiculoModel.updateVeiculo(veiculoId, parsedPayload);
  const veiculoCompleto = await veiculoModel.findVeiculoById(veiculo.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "veiculos",
    recordId: veiculo.id,
    action: "UPDATE",
    previousData: {
      placa: currentVeiculo.placa,
      modelo: currentVeiculo.modelo,
      status: currentVeiculo.status
    },
    newData: {
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      status: veiculo.status
    },
    ...metadata
  });

  return mapVeiculoResponse(veiculoCompleto);
};

const updateVeiculoStatus = async ({ veiculoId, payload, authenticatedUser, request }) => {
  const currentVeiculo = await assertVeiculoExists(veiculoId);
  const { status } = parseVeiculoStatusPayload(payload);

  if (currentVeiculo.status === status) {
    throw new AppError(`Veiculo ja esta com status ${status}`, 409);
  }

  const veiculo = await veiculoModel.updateVeiculoStatus(veiculoId, status);
  const veiculoCompleto = await veiculoModel.findVeiculoById(veiculo.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "veiculos",
    recordId: veiculo.id,
    action: "UPDATE",
    previousData: { status: currentVeiculo.status },
    newData: { status: veiculo.status },
    ...metadata
  });

  return mapVeiculoResponse(veiculoCompleto);
};

const listVeiculosByStatus = async (status) => {
  const statusUpper = String(status || "").toUpperCase();

  if (!VALID_STATUS_VEICULO.includes(statusUpper)) {
    throw new AppError(
      `Status invalido. Valores aceitos: ${VALID_STATUS_VEICULO.join(", ")}`,
      400
    );
  }

  const veiculos = await veiculoModel.listVeiculosByStatus(statusUpper);
  return veiculos.map(mapVeiculoResponse);
};

const getHistoricoVeiculo = async (veiculoId) => {
  const veiculo = await assertVeiculoExists(veiculoId);
  const historico = await veiculoModel.getHistoricoVeiculo(veiculoId);

  return {
    veiculo: mapVeiculoResponse(veiculo),
    manutencoes: historico.manutencoes,
    entregas: historico.entregas
  };
};

// ═══════════════════════════════════════════════════════════════════════
// MANUTENÇÕES
// ═══════════════════════════════════════════════════════════════════════

const createManutencao = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseManutencaoPayload(payload);

  const veiculo = await assertVeiculoExists(parsedPayload.veiculoId);

  await validateFornecedor(parsedPayload.fornecedorId);

  const manutencao = await manutencaoModel.createManutencao(parsedPayload);

  // Se a manutenção for criada como EM_EXECUCAO, atualizar status do veículo
  if (parsedPayload.status === "EM_EXECUCAO" && veiculo.status === "ATIVO") {
    await veiculoModel.updateVeiculoStatus(parsedPayload.veiculoId, "MANUTENCAO");
  }

  // Se quilometragem registrada for maior que a atual do veículo, atualizar
  if (
    parsedPayload.quilometragemRegistrada &&
    parsedPayload.quilometragemRegistrada > Number(veiculo.quilometragem_atual)
  ) {
    await veiculoModel.updateVeiculoQuilometragem(
      parsedPayload.veiculoId,
      parsedPayload.quilometragemRegistrada
    );
  }

  const manutencaoCompleta = await manutencaoModel.findManutencaoById(manutencao.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "manutencoes",
    recordId: manutencao.id,
    action: "INSERT",
    newData: {
      veiculo_id: manutencao.veiculo_id,
      tipo_manutencao: manutencao.tipo_manutencao,
      descricao: manutencao.descricao,
      custo: manutencao.custo,
      status: manutencao.status
    },
    ...metadata
  });

  return mapManutencaoResponse(manutencaoCompleta);
};

const listManutencoes = async (queryParams) => {
  const filters = parseListManutencoesFilters(queryParams);
  const [manutencoes, total] = await Promise.all([
    manutencaoModel.listManutencoes(filters),
    manutencaoModel.countManutencoes(filters)
  ]);

  return {
    items: manutencoes.map(mapManutencaoResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

const getManutencaoById = async (manutencaoId) => {
  const manutencao = await assertManutencaoExists(manutencaoId);
  return mapManutencaoResponse(manutencao);
};

const updateManutencao = async ({ manutencaoId, payload, authenticatedUser, request }) => {
  const currentManutencao = await assertManutencaoExists(manutencaoId);
  const parsedPayload = parseManutencaoUpdatePayload(payload);

  await validateFornecedor(parsedPayload.fornecedorId);

  const manutencao = await manutencaoModel.updateManutencao(manutencaoId, parsedPayload);
  const manutencaoCompleta = await manutencaoModel.findManutencaoById(manutencao.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "manutencoes",
    recordId: manutencao.id,
    action: "UPDATE",
    previousData: {
      tipo_manutencao: currentManutencao.tipo_manutencao,
      custo: currentManutencao.custo,
      status: currentManutencao.status
    },
    newData: {
      tipo_manutencao: manutencao.tipo_manutencao,
      custo: manutencao.custo,
      status: manutencao.status
    },
    ...metadata
  });

  return mapManutencaoResponse(manutencaoCompleta);
};

const updateManutencaoStatus = async ({ manutencaoId, payload, authenticatedUser, request }) => {
  const currentManutencao = await assertManutencaoExists(manutencaoId);
  const { status } = parseManutencaoStatusPayload(payload);

  if (currentManutencao.status === status) {
    throw new AppError(`Manutencao ja esta com status ${status}`, 409);
  }

  if (currentManutencao.status === "CANCELADA") {
    throw new AppError("Manutencao cancelada nao pode ter status alterado", 400);
  }

  if (currentManutencao.status === "CONCLUIDA" && status !== "CANCELADA") {
    throw new AppError("Manutencao concluida so pode ser cancelada", 400);
  }

  const manutencao = await manutencaoModel.updateManutencaoStatus(manutencaoId, status);
  const veiculoId = currentManutencao.veiculo_id;

  // Ao colocar EM_EXECUCAO, mudar veículo para MANUTENCAO
  if (status === "EM_EXECUCAO") {
    const veiculo = await veiculoModel.findVeiculoById(veiculoId);

    if (veiculo && veiculo.status === "ATIVO") {
      await veiculoModel.updateVeiculoStatus(veiculoId, "MANUTENCAO");
    }
  }

  // Ao concluir/cancelar, verificar se pode voltar para ATIVO
  if (status === "CONCLUIDA" || status === "CANCELADA") {
    const totalAtivas = await manutencaoModel.countManutencoesAtivasByVeiculoId(veiculoId);

    if (totalAtivas === 0) {
      const veiculo = await veiculoModel.findVeiculoById(veiculoId);

      if (veiculo && veiculo.status === "MANUTENCAO") {
        await veiculoModel.updateVeiculoStatus(veiculoId, "ATIVO");
      }
    }
  }

  const manutencaoCompleta = await manutencaoModel.findManutencaoById(manutencao.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "manutencoes",
    recordId: manutencao.id,
    action: "UPDATE",
    previousData: { status: currentManutencao.status },
    newData: { status: manutencao.status },
    ...metadata
  });

  return mapManutencaoResponse(manutencaoCompleta);
};

const listManutencoesByVeiculo = async (veiculoId) => {
  await assertVeiculoExists(veiculoId);

  const manutencoes = await manutencaoModel.listManutencoesByVeiculoId(veiculoId);
  return manutencoes.map(mapManutencaoResponse);
};

// ═══════════════════════════════════════════════════════════════════════
// ALERTAS E RELATÓRIOS
// ═══════════════════════════════════════════════════════════════════════

const getAlertasManutencaoPreventiva = async (dias) => {
  const diasInt = Number(dias || 30);

  if (!Number.isInteger(diasInt) || diasInt < 1) {
    throw new AppError("Parametro dias deve ser um inteiro maior que zero", 400);
  }

  const [alertasPorData, alertasPorKm] = await Promise.all([
    manutencaoModel.findAlertasPreventivasPorData(diasInt),
    manutencaoModel.findAlertasPreventivasPorKm()
  ]);

  return {
    dias: diasInt,
    por_data: {
      total: alertasPorData.length,
      items: alertasPorData.map(mapManutencaoResponse)
    },
    por_quilometragem: {
      total: alertasPorKm.length,
      items: alertasPorKm.map(mapManutencaoResponse)
    }
  };
};

const getRelatorioCustosManutencao = async (queryParams) => {
  const veiculoId = queryParams.veiculo_id || null;
  const dataInicio = queryParams.data_inicio || null;
  const dataFim = queryParams.data_fim || null;

  if (veiculoId) {
    validateUuid(veiculoId, "veiculo_id");
  }

  if (dataInicio && Number.isNaN(Date.parse(dataInicio))) {
    throw new AppError("data_inicio invalida", 400);
  }

  if (dataFim && Number.isNaN(Date.parse(dataFim))) {
    throw new AppError("data_fim invalida", 400);
  }

  const dados = await manutencaoModel.getRelatorioCustosManutencao({
    veiculoId,
    dataInicio,
    dataFim
  });

  const custoTotalGeral = dados.reduce(
    (acc, row) => acc + Number(row.custo_total),
    0
  );

  return {
    filtros: { veiculo_id: veiculoId, data_inicio: dataInicio, data_fim: dataFim },
    custo_total_geral: Number(custoTotalGeral.toFixed(2)),
    total_veiculos: dados.length,
    veiculos: dados
  };
};

const getResumoFrota = async () => {
  const resumo = await veiculoModel.getResumoFrota();
  return resumo;
};

// ═══════════════════════════════════════════════════════════════════════
// VINCULAÇÃO COM ENTREGAS
// ═══════════════════════════════════════════════════════════════════════

const vincularVeiculoAEntrega = async ({ entregaId, veiculoId, authenticatedUser, request }) => {
  validateUuid(entregaId, "entrega_id");
  validateUuid(veiculoId, "veiculo_id");

  const veiculo = await assertVeiculoExists(veiculoId);

  if (veiculo.status === "INATIVO") {
    throw new AppError("Veiculo inativo nao pode ser vinculado a entregas", 400);
  }

  const entrega = await manutencaoModel.findEntregaById(entregaId);

  if (!entrega) {
    throw new AppError("Entrega nao encontrada", 404);
  }

  const frete = await manutencaoModel.findFreteByEntregaId(entregaId);

  if (!frete) {
    throw new AppError("Frete nao encontrado para esta entrega", 404);
  }

  const freteAtualizado = await manutencaoModel.vincularVeiculoAoFrete(frete.id, veiculoId);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fretes",
    recordId: frete.id,
    action: "UPDATE",
    previousData: { veiculo_id: frete.veiculo_id },
    newData: { veiculo_id: veiculoId },
    ...metadata
  });

  return {
    frete_id: freteAtualizado.id,
    veiculo_id: freteAtualizado.veiculo_id,
    entrega_id: entregaId,
    veiculo: {
      id: veiculo.id,
      placa: veiculo.placa,
      modelo: veiculo.modelo
    }
  };
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
