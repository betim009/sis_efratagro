const express = require("express");

const estoqueController = require("../controllers/estoqueController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/saldos",
  permissionMiddleware("estoque.read"),
  estoqueController.listarSaldos
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
