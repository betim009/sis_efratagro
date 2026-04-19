const express = require("express");

const produtoController = require("../controllers/produtoController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/alertas/estoque-minimo",
  permissionMiddleware("produtos.read"),
  produtoController.getAlertasEstoqueMinimo
);

router.get(
  "/status/:status",
  permissionMiddleware("produtos.read"),
  produtoController.listProdutosByStatus
);

router.get(
  "/categoria/:categoria",
  permissionMiddleware("produtos.read"),
  produtoController.listProdutosByCategoria
);

router.post(
  "/",
  permissionMiddleware("produtos.create"),
  produtoController.createProduto
);

router.get(
  "/",
  permissionMiddleware("produtos.read"),
  produtoController.listProdutos
);

router.get(
  "/:id/saldo-estoque",
  permissionMiddleware("produtos.read"),
  produtoController.getSaldoEstoque
);

router.get(
  "/:id",
  permissionMiddleware("produtos.read"),
  produtoController.getProdutoById
);

router.put(
  "/:id",
  permissionMiddleware("produtos.update"),
  produtoController.updateProduto
);

router.patch(
  "/:id/inativar",
  permissionMiddleware("produtos.inactivate"),
  produtoController.inactivateProduto
);

module.exports = router;
