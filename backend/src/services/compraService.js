const { getClient } = require("../config/database");
const compraModel = require("../models/compraModel");
const itemCompraModel = require("../models/itemCompraModel");
const contaPagarModel = require("../models/contaPagarModel");
const estoqueModel = require("../models/estoqueModel");
const movimentacaoEstoqueModel = require("../models/movimentacaoEstoqueModel");
const fornecedorModel = require("../models/fornecedorModel");
const produtoModel = require("../models/produtoModel");
const localEstoqueModel = require("../models/localEstoqueModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const {
  validateEntityIdentifier,
  parseCompraPayload,
  parseListFilters
} = require("../utils/compraValidation");

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

const generateNumeroCompra = () => {
  const now = new Date();
  const compactDate = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `COMP-${compactDate}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
};

const assertFornecedorAtivo = async (fornecedorId) => {
  validateEntityIdentifier(fornecedorId, "fornecedor_id");

  const fornecedor = await fornecedorModel.findFornecedorByIdentifier(fornecedorId);

  if (!fornecedor) {
    throw new AppError("Fornecedor nao encontrado", 404);
  }

  if (fornecedor.status !== "ATIVO") {
    throw new AppError("Fornecedor inativo nao pode ser usado em compras", 409);
  }

  return fornecedor;
};

const assertProdutoAtivo = async (produtoId) => {
  validateEntityIdentifier(produtoId, "produto_id");

  const produto = await produtoModel.findProdutoByIdentifier(produtoId);

  if (!produto) {
    throw new AppError("Produto nao encontrado", 404);
  }

  if (produto.status === "INATIVO") {
    throw new AppError("Produto inativo nao pode ser comprado", 409);
  }

  return produto;
};

const assertLocalAtivo = async (localId) => {
  validateEntityIdentifier(localId, "local_destino_id");

  const local = await localEstoqueModel.findLocalByIdentifier(localId);

  if (!local) {
    throw new AppError("Local de estoque nao encontrado", 404);
  }

  if (local.status !== "ATIVO") {
    throw new AppError("Local de estoque inativo nao pode receber compras", 409);
  }

  return local;
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

const mapCompraCompleta = async (compra) => {
  const itens = await itemCompraModel.listItensByCompraId(compra.id);

  return {
    ...compra,
    itens
  };
};

const criarCompra = async ({ payload, authenticatedUser, request }) => {
  const parsedPayload = parseCompraPayload(payload);
  const fornecedor = await assertFornecedorAtivo(parsedPayload.fornecedorId);

  const resolvedItems = [];

  for (const item of parsedPayload.itens) {
    const [produto, local] = await Promise.all([
      assertProdutoAtivo(item.produtoId),
      assertLocalAtivo(item.localDestinoId)
    ]);

    resolvedItems.push({
      ...item,
      produto,
      local
    });
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const compra = await compraModel.createCompra(
      {
        fornecedorId: fornecedor.id,
        usuarioId: authenticatedUser.id,
        numero: parsedPayload.numero || generateNumeroCompra(),
        status: parsedPayload.status,
        subtotal: parsedPayload.subtotal,
        descontoValor: parsedPayload.descontoValor,
        freteValor: parsedPayload.freteValor,
        totalValor: parsedPayload.totalValor,
        financeiroStatus: parsedPayload.gerarContaPagar ? "GERADO" : "NAO_GERADO",
        observacoes: parsedPayload.observacoes
      },
      client
    );

    const itens = [];
    const saldos = [];

    for (const item of resolvedItems) {
      const saldo = await creditSaldo({
        produtoId: item.produto.id,
        localId: item.local.id,
        quantidade: item.quantidade,
        client
      });

      const movimentacao = await movimentacaoEstoqueModel.createMovimentacao(
        {
          produtoId: item.produto.id,
          fornecedorId: fornecedor.id,
          localOrigemId: null,
          localDestinoId: item.local.id,
          usuarioId: authenticatedUser.id,
          clienteId: null,
          vendaId: null,
          tipoMovimentacao: "ENTRADA",
          quantidade: item.quantidade,
          custoUnitario: item.custoUnitario,
          valorTotal: item.totalValor,
          motivo: "COMPRA",
          observacoes: parsedPayload.observacoes
        },
        client
      );

      const itemCompra = await itemCompraModel.createItemCompra(
        {
          compraId: compra.id,
          produtoId: item.produto.id,
          localDestinoId: item.local.id,
          movimentacaoEstoqueId: movimentacao.id,
          sequencia: item.sequencia,
          quantidade: item.quantidade,
          custoUnitario: item.custoUnitario,
          totalValor: item.totalValor
        },
        client
      );

      itens.push(itemCompra);
      saldos.push(saldo);
    }

    let contaPagar = null;

    if (parsedPayload.gerarContaPagar) {
      contaPagar = await contaPagarModel.createContaPagar(
        {
          compraId: compra.id,
          fornecedorId: fornecedor.id,
          numero: `${compra.numero}-CP-01`,
          parcela: 1,
          valorTotal: compra.total_valor,
          vencimento: parsedPayload.vencimentoContaPagar,
          observacoes: parsedPayload.observacoes
        },
        client
      );

      await compraModel.updateFinanceiroStatus(compra.id, "GERADO", client);
    }

    await client.query("COMMIT");

    const metadata = getRequestMetadata(request);

    await auditLogModel.createAuditLog({
      userId: authenticatedUser.id,
      tableName: "compras",
      recordId: compra.id,
      action: "INSERT",
      newData: {
        numero: compra.numero,
        fornecedor_id: fornecedor.id,
        total_valor: compra.total_valor,
        itens: itens.length,
        financeiro_status: parsedPayload.gerarContaPagar ? "GERADO" : "NAO_GERADO"
      },
      ...metadata
    });

    return {
      ...compra,
      fornecedor: {
        id: fornecedor.id,
        public_id: fornecedor.public_id,
        razao_social: fornecedor.razao_social,
        cpf_cnpj: fornecedor.cpf_cnpj
      },
      itens,
      saldos,
      conta_pagar: contaPagar
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listarCompras = async (queryParams) => {
  const filters = parseListFilters(queryParams);

  if (filters.fornecedorId) {
    const fornecedor = await fornecedorModel.findFornecedorByIdentifier(filters.fornecedorId);
    filters.fornecedorId = fornecedor ? fornecedor.id : "00000000-0000-0000-0000-000000000000";
  }

  const [items, total] = await Promise.all([
    compraModel.listCompras(filters),
    compraModel.countCompras(filters)
  ]);

  return {
    items,
    pagination: buildPagination(filters, total)
  };
};

const buscarCompraPorId = async (compraId) => {
  validateEntityIdentifier(compraId, "compra_id");

  const compra = await compraModel.findCompraByIdentifier(compraId);

  if (!compra) {
    throw new AppError("Compra nao encontrada", 404);
  }

  return mapCompraCompleta(compra);
};

module.exports = {
  criarCompra,
  listarCompras,
  buscarCompraPorId
};
