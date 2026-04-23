const express = require("express");

const estoqueController = require("../controllers/estoqueController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/locais",
  permissionMiddleware("estoque.read"),
  estoqueController.listarLocais
);

router.post(
  "/locais",
  permissionMiddleware("estoque.create"),
  estoqueController.criarLocal
);

router.put(
  "/locais/:id",
  permissionMiddleware("estoque.update"),
  estoqueController.atualizarLocal
);

router.patch(
  "/locais/:id/inativar",
  permissionMiddleware("estoque.update"),
  estoqueController.inativarLocal
);

router.post(
  "/movimentacoes/entrada",
  permissionMiddleware("estoque.create"),
  estoqueController.registrarEntrada
);

router.post(
  "/movimentacoes/saida",
  permissionMiddleware("estoque.create"),
  estoqueController.registrarSaida
);

router.post(
  "/movimentacoes/transferencia",
  permissionMiddleware("estoque.create"),
  estoqueController.registrarTransferencia
);

router.post(
  "/movimentacoes/ajuste",
  permissionMiddleware("estoque.create"),
  estoqueController.registrarAjuste
);

router.post(
  "/movimentacoes/devolucao-fornecedor",
  permissionMiddleware("estoque.create"),
  estoqueController.registrarDevolucaoFornecedor
);

router.post(
  "/movimentacoes/devolucao-cliente",
  permissionMiddleware("estoque.create"),
  estoqueController.registrarDevolucaoCliente
);

router.get(
  "/saldos",
  permissionMiddleware("estoque.read"),
  estoqueController.listarSaldos
);

router.get(
  "/saldos/produto/:produtoId",
  permissionMiddleware("estoque.read"),
  estoqueController.buscarSaldoPorProduto
);

router.get(
  "/saldos/produto/:produtoId/local/:localId",
  permissionMiddleware("estoque.read"),
  estoqueController.buscarSaldoPorProdutoELocal
);

router.get(
  "/movimentacoes",
  permissionMiddleware("estoque.read"),
  estoqueController.listarMovimentacoes
);

router.get(
  "/alertas/baixo-estoque",
  permissionMiddleware("estoque.read"),
  estoqueController.listarAlertasBaixoEstoque
);

module.exports = router;
