const express = require("express");

const healthController = require("../controllers/healthController");
const authRoutes = require("./authRoutes");
const clienteRoutes = require("./clienteRoutes");
const fornecedorRoutes = require("./fornecedorRoutes");
const produtoRoutes = require("./produtoRoutes");

const router = express.Router();

router.get("/", (request, response) => {
  response.status(200).json({
    status: "success",
    message: "API base do ERP operacional"
  });
});

router.get("/health", healthController.getHealthStatus);
router.use("/auth", authRoutes);
router.use("/clientes", clienteRoutes);
router.use("/fornecedores", fornecedorRoutes);
router.use("/produtos", produtoRoutes);

module.exports = router;
