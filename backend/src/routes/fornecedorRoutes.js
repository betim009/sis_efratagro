const express = require("express");

const fornecedorController = require("../controllers/fornecedorController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  permissionMiddleware("fornecedores.create"),
  fornecedorController.createFornecedor
);

router.get(
  "/",
  permissionMiddleware("fornecedores.read"),
  fornecedorController.listFornecedores
);

router.get(
  "/:id",
  permissionMiddleware("fornecedores.read"),
  fornecedorController.getFornecedorById
);

router.put(
  "/:id",
  permissionMiddleware("fornecedores.update"),
  fornecedorController.updateFornecedor
);

router.patch(
  "/:id/inativar",
  permissionMiddleware("fornecedores.inactivate"),
  fornecedorController.inactivateFornecedor
);

router.get(
  "/:id/historico-compras",
  permissionMiddleware("fornecedores.read"),
  fornecedorController.getHistoricoCompras
);

module.exports = router;
