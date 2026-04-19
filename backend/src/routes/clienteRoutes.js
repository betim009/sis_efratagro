const express = require("express");

const clienteController = require("../controllers/clienteController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  permissionMiddleware("clientes.create"),
  clienteController.createCliente
);

router.get(
  "/",
  permissionMiddleware("clientes.read"),
  clienteController.listClientes
);

router.get(
  "/:id",
  permissionMiddleware("clientes.read"),
  clienteController.getClienteById
);

router.put(
  "/:id",
  permissionMiddleware("clientes.update"),
  clienteController.updateCliente
);

router.patch(
  "/:id/status",
  clienteController.changeClienteStatus
);

router.patch(
  "/:id/inativar",
  permissionMiddleware("clientes.inactivate"),
  clienteController.inactivateCliente
);

router.get(
  "/:id/historico-compras",
  permissionMiddleware("clientes.read"),
  clienteController.getHistoricoCompras
);

router.get(
  "/:id/debitos-em-aberto",
  permissionMiddleware("clientes.read"),
  clienteController.getDebitosEmAberto
);

module.exports = router;
