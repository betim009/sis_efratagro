const { getClient } = require("../config/database");
const estoqueModel = require("../models/estoqueModel");
const localEstoqueModel = require("../models/localEstoqueModel");
const movimentacaoEstoqueModel = require("../models/movimentacaoEstoqueModel");
const produtoModel = require("../models/produtoModel");
const fornecedorModel = require("../models/fornecedorModel");
const clienteModel = require("../models/clienteModel");
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

const assertFornecedorAtivo = async (fornecedorId) => {
  validateEntityIdentifier(fornecedorId, "fornecedor_id");

  const fornecedor = await fornecedorModel.findFornecedorByIdentifier(fornecedorId);

  if (!fornecedor) {
    throw new AppError("Fornecedor nao encontrado", 404);
  }

  if (fornecedor.status !== "ATIVO") {
    throw new AppError("Nao e permitido registrar compra com fornecedor inativo", 409);
  }

  return fornecedor;
};

const assertClienteExists = async (clienteId) => {
  if (!clienteId) {
    return null;
  }

  validateEntityIdentifier(clienteId, "cliente_id");

  const cliente = await clienteModel.findClienteByIdentifier(clienteId);

  if (!cliente) {
    throw new AppError("Cliente nao encontrado", 404);
  }

  return cliente;
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
  const [produto, fornecedor, local] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertFornecedorAtivo(parsedPayload.fornecedorId),
    assertLocalAtivo(parsedPayload.localDestinoId, "local_destino_id")
  ]);

  const valorTotal = Number((parsedPayload.quantidade * parsedPayload.custoUnitario).toFixed(2));
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldo = await creditSaldo({
      produtoId: produto.id,
      localId: local.id,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: produto.id,
        fornecedorId: fornecedor.id,
        localOrigemId: null,
        localDestinoId: local.id,
        usuarioId: authenticatedUser.id,
        vendaId: parsedPayload.vendaId,
        tipoMovimentacao: "ENTRADA",
        quantidade: parsedPayload.quantidade,
        custoUnitario: parsedPayload.custoUnitario,
        valorTotal,
        motivo: parsedPayload.motivo,
        observacoes: parsedPayload.observacoes
      },
      client
    );

    await client.query("COMMIT");

    await registrarAuditoria({
      authenticatedUser,
      recordId: movimentacao.id,
      newData: {
        tipo_movimentacao: "ENTRADA",
        produto_id: produto.id,
        produto_codigo: produto.codigo,
        fornecedor_id: fornecedor.id,
        fornecedor_razao_social: fornecedor.razao_social,
        local_destino_id: local.id,
        local_destino_codigo: local.codigo,
        quantidade: parsedPayload.quantidade,
        custo_unitario: parsedPayload.custoUnitario,
        valor_total: valorTotal,
        saldo_resultante: Number(saldo.quantidade)
      },
      descricao: "Entrada de estoque por compra registrada",
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

const registrarSaida = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "SAIDA");
  const [produto, local, cliente] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertLocalAtivo(parsedPayload.localOrigemId, "local_origem_id"),
    assertClienteExists(parsedPayload.clienteId)
  ]);

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldo = await debitSaldo({
      produtoId: produto.id,
      localId: local.id,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: produto.id,
        fornecedorId: null,
        localOrigemId: local.id,
        localDestinoId: null,
        usuarioId: authenticatedUser.id,
        clienteId: cliente ? cliente.id : null,
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
        cliente_id: cliente ? cliente.id : null,
        cliente_nome: cliente ? cliente.nome_razao_social : null,
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
      produtoId: produto.id,
      localId: localOrigem.id,
      quantidade: parsedPayload.quantidade,
      client
    });

    const saldoDestino = await creditSaldo({
      produtoId: produto.id,
      localId: localDestino.id,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: produto.id,
        fornecedorId: null,
        localOrigemId: localOrigem.id,
        localDestinoId: localDestino.id,
        usuarioId: authenticatedUser.id,
        clienteId: null,
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

const registrarAjuste = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "AJUSTE");
  const isDebito = Boolean(parsedPayload.localOrigemId);

  const produto = await assertProdutoAtivo(parsedPayload.produtoId);
  const local = await assertLocalAtivo(
    isDebito ? parsedPayload.localOrigemId : parsedPayload.localDestinoId,
    isDebito ? "local_origem_id" : "local_destino_id"
  );

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldo = isDebito
      ? await debitSaldo({
          produtoId: produto.id,
          localId: local.id,
          quantidade: parsedPayload.quantidade,
          client
        })
      : await creditSaldo({
          produtoId: produto.id,
          localId: local.id,
          quantidade: parsedPayload.quantidade,
          client
        });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: produto.id,
        fornecedorId: null,
        localOrigemId: isDebito ? local.id : null,
        localDestinoId: isDebito ? null : local.id,
        usuarioId: authenticatedUser.id,
        clienteId: null,
        vendaId: null,
        tipoMovimentacao: "AJUSTE",
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
        local_id: local.id,
        operacao: isDebito ? "DEBITO" : "CREDITO"
      },
      newData: {
        tipo_movimentacao: "AJUSTE",
        produto_id: produto.id,
        produto_codigo: produto.codigo,
        local_id: local.id,
        local_codigo: local.codigo,
        quantidade: parsedPayload.quantidade,
        motivo: parsedPayload.motivo,
        usuario_id: authenticatedUser.id,
        saldo_resultante: Number(saldo.quantidade)
      },
      descricao: "Ajuste de estoque registrado",
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

const registrarDevolucaoFornecedor = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "DEVOLUCAO_FORNECEDOR");
  const [produto, fornecedor, local] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertFornecedorAtivo(parsedPayload.fornecedorId),
    assertLocalAtivo(parsedPayload.localOrigemId, "local_origem_id")
  ]);

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldo = await debitSaldo({
      produtoId: produto.id,
      localId: local.id,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: produto.id,
        fornecedorId: fornecedor.id,
        localOrigemId: local.id,
        localDestinoId: null,
        usuarioId: authenticatedUser.id,
        clienteId: null,
        vendaId: null,
        tipoMovimentacao: "DEVOLUCAO_FORNECEDOR",
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
        local_origem_id: local.id,
        fornecedor_destino_id: fornecedor.id
      },
      newData: {
        tipo_movimentacao: "DEVOLUCAO_FORNECEDOR",
        produto_id: produto.id,
        produto_codigo: produto.codigo,
        fornecedor_id: fornecedor.id,
        fornecedor_razao_social: fornecedor.razao_social,
        local_origem_id: local.id,
        local_origem_codigo: local.codigo,
        quantidade: parsedPayload.quantidade,
        saldo_resultante: Number(saldo.quantidade)
      },
      descricao: "Devolucao para fornecedor registrada",
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

const registrarDevolucaoCliente = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseMovimentacaoPayload(payload, "DEVOLUCAO_CLIENTE");
  const [produto, local, cliente] = await Promise.all([
    assertProdutoAtivo(parsedPayload.produtoId),
    assertLocalAtivo(parsedPayload.localDestinoId, "local_destino_id"),
    assertClienteExists(parsedPayload.clienteId)
  ]);

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const saldo = await creditSaldo({
      produtoId: produto.id,
      localId: local.id,
      quantidade: parsedPayload.quantidade,
      client
    });

    const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
      {
        produtoId: produto.id,
        fornecedorId: null,
        localOrigemId: null,
        localDestinoId: local.id,
        usuarioId: authenticatedUser.id,
        clienteId: cliente ? cliente.id : null,
        vendaId: parsedPayload.vendaId,
        tipoMovimentacao: "DEVOLUCAO_CLIENTE",
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
      newData: {
        tipo_movimentacao: "DEVOLUCAO_CLIENTE",
        produto_id: produto.id,
        produto_codigo: produto.codigo,
        cliente_id: cliente ? cliente.id : null,
        cliente_nome: cliente ? cliente.nome_razao_social : null,
        local_destino_id: local.id,
        local_destino_codigo: local.codigo,
        quantidade: parsedPayload.quantidade,
        saldo_resultante: Number(saldo.quantidade)
      },
      descricao: "Devolucao de cliente registrada",
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
  registrarAjuste,
  registrarDevolucaoFornecedor,
  registrarDevolucaoCliente,
  listarSaldos,
  buscarSaldoPorProduto,
  buscarSaldoPorProdutoELocal,
  listarMovimentacoes,
  listarAlertasBaixoEstoque
};
