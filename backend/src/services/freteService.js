const tabelaFreteModel = require("../models/tabelaFreteModel");
const freteModel = require("../models/freteModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const { calcularFrete } = require("../utils/freteCalculator");
const {
  validateUuid,
  parseTabelaFretePayload,
  parseCalculoPayload,
  parseCustoRealPayload,
  parseFreteListFilters,
  parseTabelaListFilters,
  parsePeriodoFilters
} = require("../utils/freteValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

// ═══════════════════════════════════════════════════════════════════════
// TABELAS DE FRETE
// ═══════════════════════════════════════════════════════════════════════

const assertTabelaExists = async (id) => {
  validateUuid(id, "Tabela de frete");
  const tabela = await tabelaFreteModel.findById(id);
  if (!tabela) {
    throw new AppError("Tabela de frete nao encontrada", 404);
  }
  return tabela;
};

const createTabela = async ({ payload, authenticatedUser, request }) => {
  const parsed = parseTabelaFretePayload(payload);
  const tabela = await tabelaFreteModel.createTabela(parsed);

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "tabelas_frete",
    recordId: tabela.id,
    action: "INSERT",
    newData: { nome: tabela.nome, tipo_calculo: tabela.tipo_calculo },
    ...metadata
  });

  return tabela;
};

const listTabelas = async (queryParams) => {
  const filters = parseTabelaListFilters(queryParams);
  return tabelaFreteModel.listTabelas(filters);
};

const getTabelaById = async (id) => {
  return assertTabelaExists(id);
};

const updateTabela = async ({ tabelaId, payload, authenticatedUser, request }) => {
  const existing = await assertTabelaExists(tabelaId);
  const parsed = parseTabelaFretePayload(payload);
  const tabela = await tabelaFreteModel.updateTabela(tabelaId, parsed);

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "tabelas_frete",
    recordId: tabelaId,
    action: "UPDATE",
    oldData: { nome: existing.nome, tipo_calculo: existing.tipo_calculo },
    newData: { nome: tabela.nome, tipo_calculo: tabela.tipo_calculo },
    ...metadata
  });

  return tabela;
};

const inativarTabela = async ({ tabelaId, authenticatedUser, request }) => {
  const existing = await assertTabelaExists(tabelaId);

  if (existing.status === "INATIVA") {
    throw new AppError("Tabela ja esta inativa", 409);
  }

  const tabela = await tabelaFreteModel.inativarTabela(tabelaId);

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "tabelas_frete",
    recordId: tabelaId,
    action: "UPDATE",
    oldData: { status: existing.status },
    newData: { status: "INATIVA" },
    ...metadata
  });

  return tabela;
};

// ═══════════════════════════════════════════════════════════════════════
// FRETES OPERACIONAIS
// ═══════════════════════════════════════════════════════════════════════

const assertFreteExists = async (id) => {
  validateUuid(id, "Frete");
  const frete = await freteModel.findById(id);
  if (!frete) {
    throw new AppError("Frete nao encontrado", 404);
  }
  return frete;
};

/**
 * Calcula e registra o frete para uma venda.
 *
 * Fluxo:
 *   1. Valida payload
 *   2. Verifica se venda existe
 *   3. Verifica se já tem frete (1:1 via UNIQUE)
 *   4. Resolve tabela de frete (informada ou por região/tipo)
 *   5. Calcula valor usando freteCalculator
 *   6. Persiste o registro
 */
const calcularERegistrar = async ({ payload, authenticatedUser, request }) => {
  const parsed = parseCalculoPayload(payload);

  const vendaExiste = await freteModel.vendaExists(parsed.vendaId);
  if (!vendaExiste) {
    throw new AppError("Venda nao encontrada", 404);
  }

  const freteExistente = await freteModel.findByVendaId(parsed.vendaId);
  if (freteExistente) {
    throw new AppError("Ja existe frete calculado para esta venda", 409);
  }

  if (parsed.transportadoraFornecedorId) {
    const transpExiste = await freteModel.transportadoraExists(parsed.transportadoraFornecedorId);
    if (!transpExiste) {
      throw new AppError("Transportadora (fornecedor) nao encontrada ou inativa", 404);
    }
  }

  let tabela = null;
  let tipoCalculo = "MANUAL";
  let valorEstimado = 0;

  if (parsed.tabelaFreteId) {
    tabela = await tabelaFreteModel.findById(parsed.tabelaFreteId);
    if (!tabela) {
      throw new AppError("Tabela de frete nao encontrada", 404);
    }
    if (tabela.status !== "ATIVA") {
      throw new AppError("Tabela de frete inativa", 400);
    }
  } else if (parsed.regiaoDestino) {
    tabela = await tabelaFreteModel.findAtivaPorRegiao(parsed.regiaoDestino);
  }

  if (tabela) {
    const resultado = calcularFrete(tabela, {
      pesoTotalKg: parsed.pesoTotalKg,
      distanciaKm: parsed.distanciaKm
    });
    tipoCalculo = resultado.tipoCalculo;
    valorEstimado = resultado.valorEstimado;
  }

  const frete = await freteModel.createFrete({
    vendaId: parsed.vendaId,
    tabelaFreteId: tabela ? tabela.id : null,
    modalidade: parsed.modalidade,
    tipoCalculo,
    regiaoDestino: parsed.regiaoDestino,
    pesoTotalKg: parsed.pesoTotalKg,
    distanciaKm: parsed.distanciaKm,
    valorEstimado,
    valorReal: null,
    veiculoId: null,
    transportadoraFornecedorId: parsed.transportadoraFornecedorId,
    status: "CALCULADO",
    observacoes: parsed.observacoes
  });

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fretes",
    recordId: frete.id,
    action: "INSERT",
    newData: {
      venda_id: parsed.vendaId,
      tipo_calculo: tipoCalculo,
      valor_estimado: valorEstimado,
      modalidade: parsed.modalidade
    },
    ...metadata
  });

  return frete;
};

const listFretes = async (queryParams) => {
  const filters = parseFreteListFilters(queryParams);
  return freteModel.listFretes(filters);
};

const getFreteById = async (id) => {
  return assertFreteExists(id);
};

const getFreteByVendaId = async (vendaId) => {
  validateUuid(vendaId, "Venda");
  const frete = await freteModel.findByVendaId(vendaId);
  if (!frete) {
    throw new AppError("Frete nao encontrado para esta venda", 404);
  }
  return frete;
};

const vincularEntrega = async ({ freteId, entregaId, authenticatedUser, request }) => {
  validateUuid(entregaId, "Entrega");
  const frete = await assertFreteExists(freteId);

  const entrega = await freteModel.entregaExists(entregaId);
  if (!entrega) {
    throw new AppError("Entrega nao encontrada", 404);
  }

  if (entrega.frete_id && entrega.frete_id !== freteId) {
    throw new AppError("Entrega ja vinculada a outro frete", 409);
  }

  const freteAtualizado = await freteModel.vincularEntrega(freteId, entregaId);

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fretes",
    recordId: freteId,
    action: "UPDATE",
    oldData: { status: frete.status, entrega_id: null },
    newData: { status: "VINCULADO", entrega_id: entregaId },
    ...metadata
  });

  return freteAtualizado;
};

const vincularVeiculo = async ({ freteId, veiculoId, authenticatedUser, request }) => {
  validateUuid(veiculoId, "Veiculo");
  const frete = await assertFreteExists(freteId);

  if (frete.status === "CANCELADO") {
    throw new AppError("Nao e possivel vincular veiculo a frete cancelado", 400);
  }

  const veiculoAtivo = await freteModel.veiculoExists(veiculoId);
  if (!veiculoAtivo) {
    throw new AppError("Veiculo nao encontrado ou inativo", 404);
  }

  const freteAtualizado = await freteModel.vincularVeiculo(freteId, veiculoId);

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fretes",
    recordId: freteId,
    action: "UPDATE",
    oldData: { veiculo_id: frete.veiculo_id },
    newData: { veiculo_id: veiculoId },
    ...metadata
  });

  return freteAtualizado;
};

const registrarCustoReal = async ({ freteId, payload, authenticatedUser, request }) => {
  const frete = await assertFreteExists(freteId);

  if (frete.status === "CANCELADO") {
    throw new AppError("Nao e possivel registrar custo real em frete cancelado", 400);
  }

  const parsed = parseCustoRealPayload(payload);
  const freteAtualizado = await freteModel.registrarCustoReal(
    freteId,
    parsed.custoReal,
    parsed.observacoes
  );

  const metadata = getRequestMetadata(request);
  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "fretes",
    recordId: freteId,
    action: "UPDATE",
    oldData: { valor_real: frete.valor_real },
    newData: { valor_real: parsed.custoReal },
    ...metadata
  });

  return freteAtualizado;
};

const listFretesPorPeriodo = async (queryParams) => {
  const filters = parsePeriodoFilters(queryParams);
  const [listResult, metricas] = await Promise.all([
    freteModel.listFretes(filters),
    freteModel.getMetricasFrete(filters)
  ]);

  return {
    fretes: listResult.fretes,
    total: listResult.total,
    metricas: {
      total_fretes: Number(metricas.total_fretes),
      total_estimado: Number(metricas.total_estimado),
      total_real: Number(metricas.total_real),
      media_estimado: Math.round(Number(metricas.media_estimado) * 100) / 100,
      media_real: Math.round(Number(metricas.media_real) * 100) / 100,
      total_proprio: Number(metricas.total_proprio),
      total_terceiro: Number(metricas.total_terceiro),
      total_com_custo_real: Number(metricas.total_com_custo_real),
      diferenca_total: Number(metricas.diferenca_total)
    }
  };
};

const listFretesPorRegiao = async (regiao, queryParams) => {
  if (!regiao || !regiao.trim()) {
    throw new AppError("Regiao obrigatoria", 400);
  }

  const filters = parseFreteListFilters(queryParams);
  return freteModel.listByRegiao(regiao.trim(), filters);
};

module.exports = {
  createTabela,
  listTabelas,
  getTabelaById,
  updateTabela,
  inativarTabela,
  calcularERegistrar,
  listFretes,
  getFreteById,
  getFreteByVendaId,
  vincularEntrega,
  vincularVeiculo,
  registrarCustoReal,
  listFretesPorPeriodo,
  listFretesPorRegiao
};
