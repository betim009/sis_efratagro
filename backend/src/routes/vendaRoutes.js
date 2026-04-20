const express = require("express");

const vendaController = require("../controllers/vendaController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  permissionMiddleware("vendas.read"),
  vendaController.listVendas
);

module.exports = router;
