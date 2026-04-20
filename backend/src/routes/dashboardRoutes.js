const express = require("express");

const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET /dashboard/resumo
router.get(
  "/resumo",
  permissionMiddleware("dashboard.read"),
  dashboardController.getResumo
);

// GET /dashboard/vendas
router.get(
  "/vendas",
  permissionMiddleware("dashboard.read", "dashboard.sales.read"),
  dashboardController.getVendas
);

// GET /dashboard/financeiro
router.get(
  "/financeiro",
  permissionMiddleware("dashboard.read", "dashboard.finance.read"),
  dashboardController.getFinanceiro
);

// GET /dashboard/estoque
router.get(
  "/estoque",
  permissionMiddleware("dashboard.read", "dashboard.stock.read"),
  dashboardController.getEstoque
);

// GET /dashboard/vendas-futuras
router.get(
  "/vendas-futuras",
  permissionMiddleware("dashboard.read", "dashboard.sales.read"),
  dashboardController.getVendasFuturas
);

// GET /dashboard/frota
router.get(
  "/frota",
  permissionMiddleware("dashboard.read", "dashboard.fleet.read"),
  dashboardController.getFrota
);

// GET /dashboard/series/vendas
router.get(
  "/series/vendas",
  permissionMiddleware("dashboard.read", "dashboard.sales.read"),
  dashboardController.getSeriesVendas
);

// GET /dashboard/alertas
router.get(
  "/alertas",
  permissionMiddleware("dashboard.read", "dashboard.alerts.read"),
  dashboardController.getAlertas
);

// GET /dashboard/completo
router.get(
  "/completo",
  permissionMiddleware("dashboard.read"),
  dashboardController.getCompleto
);

module.exports = router;
