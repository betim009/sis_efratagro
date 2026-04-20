const duplicataModel = require("../models/duplicataModel");
const pagamentoModel = require("../models/pagamentoModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  parseGerarDuplicataPayload,
  parseGerarParcelasPayload,
  parsePagamentoPayload,
  parseListDuplicatasFilters,
  mapDuplicataResponse,
  mapPagamentoResponse,
  VALID_STATUS_DUPLICATA
} = require("../utils/financeiroValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

// ─── Helpers internos ────────────────────────────────────────────────

const assertDuplicataExists = async (duplicataId) => {
  validateUuid(duplicataId, "Duplicata");

  const duplicata = await duplicataModel.findDuplicataById(duplicataId);

  if (!duplicata) {
    throw new AppError("Duplicata nao encontrada", 404);
  }

  return duplicata;
};

const assertVendaExists = async (vendaId) => {
  const venda = await duplicataModel.findVendaById(vendaId);

  if (!venda) {
    throw new AppError("Venda nao encontrada", 404);
  }

  return venda;
};

const assertClienteExists = async (clienteId) => {
  const cliente = await duplicataModel.findClienteById(clienteId);

  if (!cliente) {
    throw new AppError("Cliente nao encontrado", 404);
  }

  if (cliente.status === "INATIVO") {
    throw new AppError("Cliente inativo nao pode receber duplicatas", 400);
  }

  return cliente;
};

const ensureUniqueNumero = async (numero) => {
  const existing = await duplicataModel.findDuplicataByNumero(numero);

  if (existing) {
    throw new AppError("Ja existe duplicata com este numero", 409);
  }
};

const recalcularStatusDuplicata = async (duplicataId) => {
  const duplicata = await duplicataModel.findDuplicataById(duplicataId);

  if (!duplicata) {
    return null;
  }

  const { total_pago } = await pagamentoModel.sumPagamentosByDuplicataId(duplicataId);

  const valorTotal = Number(duplicata.valor_total);
  const totalPago = Number(total_pago);
  const valorAberto = Number((valorTotal - totalPago).toFixed(2));

  let novoStatus;

  if (valorAberto <= 0) {
    novoStatus = "PAGO";
  } else if (totalPago > 0) {
    novoStatus = "PAGO_PARCIALMENTE";
  } else if (
    new Date(duplicata.vencimento) < new Date(new Date().toISOString().split("T")[0])
  ) {
    novoStatus = "VENCIDO";
  } else {
    novoStatus = "EM_ABERTO";
  }

  const updated = await duplicataModel.updateDuplicataValoresEStatus(duplicataId, {
    valorAberto: Math.max(valorAberto, 0),
    status: novoStatus
  });

  return updated;
};

// ─── Gerar duplicata única ───────────────────────────────────────────

const gerarDuplicata = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseGerarDuplicataPayload(payload);

  await Promise.all([
    assertVendaExists(parsedPayload.vendaId),
    assertClienteExists(parsedPayload.clienteId),
    ensureUniqueNumero(parsedPayload.numero)
  ]);

  const duplicata = await duplicataModel.createDuplicata(parsedPayload);
  const duplicataCompleta = await duplicataModel.findDuplicataById(duplicata.id);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "duplicatas",
    recordId: duplicata.id,
    action: "INSERT",
    newData: {
      numero: duplicata.numero,
      valor_total: duplicata.valor_total,
      vencimento: duplicata.vencimento,
      status: duplicata.status
    },
    ...metadata
  });

  return mapDuplicataResponse(duplicataCompleta);
};

// ─── Gerar parcelas ─────────────────────────────────────────────────

const gerarParcelas = async ({ payload, authenticatedUser, request }) => {
  const parsed = parseGerarParcelasPayload(payload);

  await Promise.all([
    assertVendaExists(parsed.vendaId),
    assertClienteExists(parsed.clienteId)
  ]);

  const valorParcela = Number(
    (parsed.valorTotal / parsed.totalParcelas).toFixed(2)
  );

  const diferenca = Number(
    (parsed.valorTotal - valorParcela * parsed.totalParcelas).toFixed(2)
  );

  const duplicatasPayload = [];
  const baseDate = new Date(parsed.primeiroVencimento);

  for (let i = 0; i < parsed.totalParcelas; i++) {
    const vencimento = new Date(baseDate);
    vencimento.setDate(vencimento.getDate() + i * parsed.intervaloDias);

    const valorParcela_ = i === 0 ? valorParcela + diferenca : valorParcela;
    const numero = `${parsed.prefixoNumero}-${String(i + 1).padStart(2, "0")}/${parsed.totalParcelas}`;

    await ensureUniqueNumero(numero);

    duplicatasPayload.push({
      vendaId: parsed.vendaId,
      clienteId: parsed.clienteId,
      numero,
      parcela: i + 1,
      valorTotal: valorParcela_,
      valorAberto: valorParcela_,
      vencimento: vencimento.toISOString().split("T")[0],
      dataEmissao: new Date().toISOString().split("T")[0],
      status: "EM_ABERTO",
      observacoes: parsed.observacoes
    });
  }

  const duplicatas = await duplicataModel.createDuplicatasBatch(duplicatasPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "duplicatas",
    recordId: null,
    action: "INSERT",
    newData: {
      venda_id: parsed.vendaId,
      total_parcelas: parsed.totalParcelas,
      valor_total: parsed.valorTotal,
      duplicatas_geradas: duplicatas.map((d) => d.numero)
    },
    ...metadata
  });

  const duplicatasCompletas = await Promise.all(
    duplicatas.map((d) => duplicataModel.findDuplicataById(d.id))
  );

  return duplicatasCompletas.map(mapDuplicataResponse);
};

// ─── Listar duplicatas ──────────────────────────────────────────────

const listDuplicatas = async (queryParams) => {
  const filters = parseListDuplicatasFilters(queryParams);
  const [duplicatas, total] = await Promise.all([
    duplicataModel.listDuplicatas(filters),
    duplicataModel.countDuplicatas(filters)
  ]);

  return {
    items: duplicatas.map(mapDuplicataResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit) || 1
    }
  };
};

// ─── Buscar duplicata por ID ────────────────────────────────────────

const getDuplicataById = async (duplicataId) => {
  const duplicata = await assertDuplicataExists(duplicataId);
  return mapDuplicataResponse(duplicata);
};

// ─── Listar por status ──────────────────────────────────────────────

const listDuplicatasByStatus = async (status) => {
  const statusUpper = String(status || "").toUpperCase();

  if (!VALID_STATUS_DUPLICATA.includes(statusUpper)) {
    throw new AppError(
      `Status invalido. Valores aceitos: ${VALID_STATUS_DUPLICATA.join(", ")}`,
      400
    );
  }

  const duplicatas = await duplicataModel.listDuplicatasByStatus(statusUpper);
  return duplicatas.map(mapDuplicataResponse);
};

// ─── Listar por cliente ─────────────────────────────────────────────

const listDuplicatasByCliente = async (clienteId) => {
  validateUuid(clienteId, "cliente_id");
  await assertClienteExists(clienteId);

  const duplicatas = await duplicataModel.listDuplicatasByClienteId(clienteId);
  return duplicatas.map(mapDuplicataResponse);
};

// ─── Registrar pagamento ────────────────────────────────────────────

const registrarPagamento = async ({ duplicataId, payload, authenticatedUser, request }) => {
  const duplicata = await assertDuplicataExists(duplicataId);

  if (duplicata.status === "CANCELADO") {
    throw new AppError("Nao e possivel registrar pagamento em duplicata cancelada", 400);
  }

  if (duplicata.status === "PAGO") {
    throw new AppError("Duplicata ja esta totalmente paga", 400);
  }

  const parsedPayload = parsePagamentoPayload(payload);

  const valorAberto = Number(duplicata.valor_aberto);

  if (parsedPayload.valor > valorAberto) {
    throw new AppError(
      `Valor do pagamento (${parsedPayload.valor}) excede o saldo em aberto (${valorAberto})`,
      400
    );
  }

  const pagamento = await pagamentoModel.createPagamento({
    duplicataId,
    recebidoPorUsuarioId: authenticatedUser.id,
    formaPagamento: parsedPayload.formaPagamento,
    valor: parsedPayload.valor,
    dataPagamento: parsedPayload.dataPagamento,
    referenciaExterna: parsedPayload.referenciaExterna,
    observacoes: parsedPayload.observacoes
  });

  const duplicataAtualizada = await recalcularStatusDuplicata(duplicataId);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "pagamentos",
    recordId: pagamento.id,
    action: "INSERT",
    newData: {
      duplicata_id: duplicataId,
      duplicata_numero: duplicata.numero,
      valor: parsedPayload.valor,
      forma_pagamento: parsedPayload.formaPagamento,
      novo_status: duplicataAtualizada.status,
      novo_valor_aberto: duplicataAtualizada.valor_aberto
    },
    ...metadata
  });

  const pagamentoCompleto = await pagamentoModel.findPagamentoById(pagamento.id);
  const duplicataCompleta = await duplicataModel.findDuplicataById(duplicataId);

  return {
    pagamento: mapPagamentoResponse(pagamentoCompleto),
    duplicata: mapDuplicataResponse(duplicataCompleta)
  };
};

// ─── Listar pagamentos de uma duplicata ─────────────────────────────

const listPagamentosByDuplicata = async (duplicataId) => {
  await assertDuplicataExists(duplicataId);

  const pagamentos = await pagamentoModel.listPagamentosByDuplicataId(duplicataId);
  return pagamentos.map(mapPagamentoResponse);
};

// ─── Alertas: vencidas ──────────────────────────────────────────────

const getAlertasVencidas = async () => {
  const duplicatas = await duplicataModel.findDuplicatasVencidas();

  return {
    total: duplicatas.length,
    duplicatas: duplicatas.map(mapDuplicataResponse)
  };
};

// ─── Alertas: vencendo ──────────────────────────────────────────────

const getAlertasVencendo = async (dias) => {
  const diasInt = Number(dias || 7);

  if (!Number.isInteger(diasInt) || diasInt < 1) {
    throw new AppError("Parametro dias deve ser um inteiro maior que zero", 400);
  }

  const duplicatas = await duplicataModel.findDuplicatasVencendo(diasInt);

  return {
    dias: diasInt,
    total: duplicatas.length,
    duplicatas: duplicatas.map(mapDuplicataResponse)
  };
};

// ─── Resumo financeiro (para dashboard) ─────────────────────────────

const getResumoFinanceiro = async () => {
  const resumo = await duplicataModel.getResumoFinanceiro();
  return resumo;
};

module.exports = {
  gerarDuplicata,
  gerarParcelas,
  listDuplicatas,
  getDuplicataById,
  listDuplicatasByStatus,
  listDuplicatasByCliente,
  registrarPagamento,
  listPagamentosByDuplicata,
  getAlertasVencidas,
  getAlertasVencendo,
  getResumoFinanceiro
};
