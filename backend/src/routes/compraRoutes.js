const express = require("express");

const compraController = require("../controllers/compraController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  permissionMiddleware("compras.create"),
  compraController.criarCompra
);

router.get(
  "/",
  permissionMiddleware("compras.read"),
  compraController.listarCompras
);

router.get(
  "/:id",
  permissionMiddleware("compras.read"),
  compraController.buscarCompraPorId
);

module.exports = router;
