const express = require("express");

const healthController = require("../controllers/healthController");
const authRoutes = require("./authRoutes");
const clienteRoutes = require("./clienteRoutes");
const fornecedorRoutes = require("./fornecedorRoutes");
const produtoRoutes = require("./produtoRoutes");
const estoqueRoutes = require("./estoqueRoutes");
const compraRoutes = require("./compraRoutes");
const vendaRoutes = require("./vendaRoutes");
const financeiroRoutes = require("./financeiroRoutes");
const frotaRoutes = require("./frotaRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const relatorioRoutes = require("./relatorioRoutes");
const freteRoutes = require("./freteRoutes");
const auditoriaRoutes = require("./auditoriaRoutes");
const notificacaoRoutes = require("./notificacaoRoutes");

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
router.use("/estoque", estoqueRoutes);
router.use("/compras", compraRoutes);
router.use("/vendas", vendaRoutes);
router.use("/financeiro", financeiroRoutes);
router.use("/frota", frotaRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/relatorios", relatorioRoutes);
router.use("/fretes", freteRoutes);
router.use("/auditoria", auditoriaRoutes);
router.use("/notificacoes", notificacaoRoutes);

module.exports = router;
