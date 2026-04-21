const { getClient } = require("../config/database");
const estoqueModel = require("../models/estoqueModel");
const localEstoqueModel = require("../models/localEstoqueModel");
const movimentacaoEstoqueModel = require("../models/movimentacaoEstoqueModel");
const produtoModel = require("../models/produtoModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateUuid,
  validateEntityIdentifier,
  parseLocalPayload,
  parseMovimentacaoPayload,
  parseListFilters
} = require("../utils/estoqueValidation");

const getRequestMetadata = (request) => ({
  ipAddress: request ? request.ip : null,
  userAgent: request ? request.get("user-agent") || null : null
});

const buildPagination = (filters, total) => ({
  page: filters.page,
  limit: filters.limit,
  total,
  total_pages: Math.ceil(total / filters.limit) || 1
});

const assertProdutoAtivo = async (produtoId) => {
  validateEntityIdentifier(produtoId, "produto_id");

  const produto = await produtoModel.findProdutoByIdentifier(produtoId);

  if (!produto) {
    throw new AppError("Produto nao encontrado", 404);
  }

  if (produto.status === "INATIVO") {
    throw new AppError("Nao e permitido movimentar produto inativo", 409);
  }

  return produto;
};

const assertLocalAtivo = async (localId, fieldName) => {
  validateEntityIdentifier(localId, fieldName);

  const local = await localEstoqueModel.findLocalByIdentifier(localId);

  if (!local) {
    throw new AppError("Local de estoque nao encontrado", 404);
  }

  if (local.status !== "ATIVO") {
    throw new AppError("Nao e permitido movimentar local inativo", 409);
  }

  return local;
};

const ensureUniqueCodigoLocal = async (codigo, excludeId = null) => {
  const existing = await localEstoqueModel.findLocalByCodigo(codigo, excludeId);

  if (existing) {
    throw new AppError("Ja existe local de estoque com este codigo", 409);
  }
};

const getSaldoDisponivel = (saldo) =>
  Number(saldo.quantidade) - Number(saldo.reservado);

const lockAndEnsureSaldo = async ({ produtoId, localId, quantidade, client }) => {
  const saldo = await estoqueModel.findSaldoByProdutoAndLocal(produtoId, localId, client);

  if (!saldo) {
    throw new AppError("Saldo de estoque nao encontrado para o local informado", 409);
  }

  const disponivel = getSaldoDisponivel(saldo);

  if (disponivel < quantidade) {
    throw new AppError("Saldo insuficiente para realizar a movimentacao", 409);
  }

  return saldo;
};

const creditSaldo = async ({ produtoId, localId, quantidade, client }) => {
  const saldo = await estoqueModel.findSaldoByProdutoAndLocal(produtoId, localId, client);

  if (!saldo) {
    return estoqueModel.createSaldo(
      {
        produtoId,
        localId,
        quantidade,
        reservado: 0
      },
      client
    );
  }

  return estoqueModel.updateSaldoQuantidade(
    saldo.id,
    Number(saldo.quantidade) + quantidade,
    client
  );
};

const debitSaldo = async ({ produtoId, localId, quantidade, client }) => {
  const saldo = await lockAndEnsureSaldo({ produtoId, localId, quantidade, client });

  return estoqueModel.updateSaldoQuantidade(
    saldo.id,
    Number(saldo.quantidade) - quantidade,
    client
  );
};

const registrarAuditoria = async ({
  authenticatedUser,
  recordId,
  previousData = null,
  newData = null,
  descricao,
  request
}) => {
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "movimentacoes_estoque",
    recordId,
    action: "STOCK_MOVEMENT",
    previousData,
    newData,
    descricao,
    ...metadata
  });
};

const listarLocais = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [items, total] = await Promise.all([
    localEstoqueModel.listLocais(filters),
    localEstoqueModel.countLocais(filters)
  ]);

  return {
    items,
    pagination: buildPagination(filters, total)
  };
};

const criarLocal = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseLocalPayload(payload);

  await ensureUniqueCodigoLocal(parsedPayload.codigo);

  const local = await localEstoqueModel.createLocal(parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "locais_estoque",
    recordId: local.id,
    action: "INSERT",
    newData: {
      nome: local.nome,
      codigo: local.codigo,
      tipo_local: local.tipo_local,
      status: local.status
    },
    ...metadata
  });

  return local;
};

const atualizarLocal = async ({ localId, payload, authenticatedUser, request }) => {
  validateUuid(localId, "local_id");

  const currentLocal = await localEstoqueModel.findLocalById(localId);

  if (!currentLocal) {
    throw new AppError("Local de estoque nao encontrado", 404);
  }

  const parsedPayload = parseLocalPayload(payload);
  await ensureUniqueCodigoLocal(parsedPayload.codigo, localId);

  const local = await localEstoqueModel.updateLocal(localId, parsedPayload);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "locais_estoque",
    recordId: local.id,
    action: "UPDATE",
    previousData: currentLocal,
    newData: local,
    ...metadata
  });

  return local;
};

const inativarLocal = async ({ localId, authenticatedUser, request }) => {
  validateUuid(localId, "local_id");

  const currentLocal = await localEstoqueModel.findLocalById(localId);

  if (!currentLocal) {
    throw new AppError("Local de estoque nao encontrado", 404);
  }

  if (currentLocal.status === "INATIVO") {
    throw new AppError("Local de estoque ja esta inativo", 409);
  }

  const local = await localEstoqueModel.inactivateLocal(localId);
  const metadata = getRequestMetadata(request);

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "locais_estoque",
    recordId: local.id,
    action: "INACTIVATE",
    previousData: { status: currentLocal.status },
    newData: { status: local.status },
    ...metadata
  });

  return local;
};

const registrarEntrada = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "ENTRADA");
  const [produto, local] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertLocalAtivo(parsedPayload.localDestinoId, "local_destino_id")
  ]);

  const movimentacao = await movimentacaoEstoqueModel.createMovimentacao({
    produtoId: parsedPayload.produtoId,
    localOrigemId: null,
    localDestinoId: parsedPayload.localDestinoId,
    usuarioId: authenticatedUser.id,
    vendaId: parsedPayload.vendaId,
    tipoMovimentacao: "ENTRADA",
    quantidade: parsedPayload.quantidade,
    motivo: parsedPayload.motivo,
    observacoes: parsedPayload.observacoes
  });

  const saldo = await creditSaldo({
    produtoId: parsedPayload.produtoId,
    localId: parsedPayload.localDestinoId,
    quantidade: parsedPayload.quantidade,
    client: null
  });

  await registrarAuditoria({
    authenticatedUser,
    recordId: movimentacao.id,
    newData: {
      tipo_movimentacao: "ENTRADA",
      produto_id: produto.id,
      produto_codigo: produto.codigo,
      local_destino_id: local.id,
      local_destino_codigo: local.codigo,
      quantidade: parsedPayload.quantidade,
      saldo_resultante: Number(saldo.quantidade)
    },
    descricao: "Entrada de estoque registrada",
    request
  });

  return {
    movimentacao,
    saldo
  };
};

const registrarSaida = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "SAIDA");
  const [produto, local] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertLocalAtivo(parsedPayload.localOrigemId, "local_origem_id")
  ]);

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldo = await debitSaldo({
      produtoId: parsedPayload.produtoId,
      localId: parsedPayload.localOrigemId,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: parsedPayload.produtoId,
        localOrigemId: parsedPayload.localOrigemId,
        localDestinoId: null,
        usuarioId: authenticatedUser.id,
        vendaId: parsedPayload.vendaId,
        tipoMovimentacao: "SAIDA",
        quantidade: parsedPayload.quantidade,
        motivo: parsedPayload.motivo,
        observacoes: parsedPayload.observacoes
      },
      client
    );

    await client.query("COMMIT");

    await registrarAuditoria({
      authenticatedUser,
      recordId: movimentacao.id,
      previousData: {
        local_origem_id: local.id
      },
      newData: {
        tipo_movimentacao: "SAIDA",
        produto_id: produto.id,
        produto_codigo: produto.codigo,
        local_origem_id: local.id,
        local_origem_codigo: local.codigo,
        quantidade: parsedPayload.quantidade,
        saldo_resultante: Number(saldo.quantidade)
      },
      descricao: "Saida de estoque registrada",
      request
    });

    return {
      movimentacao,
      saldo
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const registrarTransferencia = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "TRANSFERENCIA");
  const [produto, localOrigem, localDestino] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertLocalAtivo(parsedPayload.localOrigemId, "local_origem_id"),
    assertLocalAtivo(parsedPayload.localDestinoId, "local_destino_id")
  ]);

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldoOrigem = await debitSaldo({
      produtoId: parsedPayload.produtoId,
      localId: parsedPayload.localOrigemId,
      quantidade: parsedPayload.quantidade,
      client
    });

    const saldoDestino = await creditSaldo({
      produtoId: parsedPayload.produtoId,
      localId: parsedPayload.localDestinoId,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: parsedPayload.produtoId,
        localOrigemId: parsedPayload.localOrigemId,
        localDestinoId: parsedPayload.localDestinoId,
        usuarioId: authenticatedUser.id,
        vendaId: parsedPayload.vendaId,
        tipoMovimentacao: "TRANSFERENCIA",
        quantidade: parsedPayload.quantidade,
        motivo: parsedPayload.motivo,
        observacoes: parsedPayload.observacoes
      },
      client
    );

    await client.query("COMMIT");

    await registrarAuditoria({
      authenticatedUser,
      recordId: movimentacao.id,
      previousData: {
        local_origem_id: localOrigem.id,
        saldo_origem_apos: Number(saldoOrigem.quantidade)
      },
      newData: {
        tipo_movimentacao: "TRANSFERENCIA",
        produto_id: produto.id,
        produto_codigo: produto.codigo,
        local_origem_id: localOrigem.id,
        local_origem_codigo: localOrigem.codigo,
        local_destino_id: localDestino.id,
        local_destino_codigo: localDestino.codigo,
        quantidade: parsedPayload.quantidade,
        saldo_origem_resultante: Number(saldoOrigem.quantidade),
        saldo_destino_resultante: Number(saldoDestino.quantidade)
      },
      descricao: "Transferencia de estoque registrada",
      request
    });

    return {
      movimentacao,
      saldo_origem: saldoOrigem,
      saldo_destino: saldoDestino
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listarSaldos = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [items, total] = await Promise.all([
    estoqueModel.listSaldos(filters),
    estoqueModel.countSaldos(filters)
  ]);

  return {
    items,
    pagination: buildPagination(filters, total)
  };
};

const buscarSaldoPorProduto = async (produtoId) => {
  const produto = await assertProdutoAtivo(produtoId);
  const saldos = await estoqueModel.getSaldoByProduto(produto.id);

  return {
    produto: {
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      estoque_minimo: produto.estoque_minimo
    },
    items: saldos
  };
};

const buscarSaldoPorProdutoELocal = async (produtoId, localId) => {
  const [produto, local] = await Promise.all([
    assertProdutoAtivo(produtoId),
    assertLocalAtivo(localId, "local_id")
  ]);

  const saldo = await estoqueModel.getSaldoByProdutoAndLocal(produto.id, local.id);

  return {
    produto: {
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome
    },
    local,
    saldo:
      saldo || {
        produto_id: produto.id,
        local_id: local.id,
        local_nome: local.nome,
        local_codigo: local.codigo,
        tipo_local: local.tipo_local,
        quantidade: 0,
        reservado: 0,
        disponivel: 0
      }
  };
};

const listarMovimentacoes = async (queryParams) => {
  const filters = parseListFilters(queryParams);
  const [items, total] = await Promise.all([
    estoqueModel.listMovimentacoes(filters),
    estoqueModel.countMovimentacoes(filters)
  ]);

  return {
    items,
    pagination: buildPagination(filters, total)
  };
};

const listarAlertasBaixoEstoque = async () => estoqueModel.listAlertasBaixoEstoque();

module.exports = {
  listarLocais,
  criarLocal,
  atualizarLocal,
  inativarLocal,
  registrarEntrada,
  registrarSaida,
  registrarTransferencia,
  listarSaldos,
  buscarSaldoPorProduto,
  buscarSaldoPorProdutoELocal,
  listarMovimentacoes,
  listarAlertasBaixoEstoque
};
