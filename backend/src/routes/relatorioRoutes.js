const express = require("express");

const relatorioController = require("../controllers/relatorioController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════════════
// VENDAS
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/vendas",
  permissionMiddleware("relatorios.read", "relatorios.sales.read"),
  relatorioController.getVendas
);

router.get(
  "/vendas/exportar/pdf",
  permissionMiddleware("relatorios.read", "relatorios.sales.read", "relatorios.export"),
  relatorioController.exportarVendasPdf
);

router.get(
  "/vendas/exportar/excel",
  permissionMiddleware("relatorios.read", "relatorios.sales.read", "relatorios.export"),
  relatorioController.exportarVendasExcel
);

// ═══════════════════════════════════════════════════════════════════════
// ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/estoque",
  permissionMiddleware("relatorios.read", "relatorios.stock.read"),
  relatorioController.getEstoque
);

router.get(
  "/estoque/exportar/pdf",
  permissionMiddleware("relatorios.read", "relatorios.stock.read", "relatorios.export"),
  relatorioController.exportarEstoquePdf
);

router.get(
  "/estoque/exportar/excel",
  permissionMiddleware("relatorios.read", "relatorios.stock.read", "relatorios.export"),
  relatorioController.exportarEstoqueExcel
);

// ═══════════════════════════════════════════════════════════════════════
// MOVIMENTAÇÕES DE ESTOQUE
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/movimentacoes-estoque",
  permissionMiddleware("relatorios.read", "relatorios.stock.read"),
  relatorioController.getMovimentacoes
);

// ═══════════════════════════════════════════════════════════════════════
// DUPLICATAS
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/duplicatas",
  permissionMiddleware("relatorios.read", "relatorios.finance.read"),
  relatorioController.getDuplicatas
);

router.get(
  "/duplicatas/exportar/pdf",
  permissionMiddleware("relatorios.read", "relatorios.finance.read", "relatorios.export"),
  relatorioController.exportarDuplicatasPdf
);

router.get(
  "/duplicatas/exportar/excel",
  permissionMiddleware("relatorios.read", "relatorios.finance.read", "relatorios.export"),
  relatorioController.exportarDuplicatasExcel
);

// ═══════════════════════════════════════════════════════════════════════
// PAGAMENTOS
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/pagamentos",
  permissionMiddleware("relatorios.read", "relatorios.finance.read"),
  relatorioController.getPagamentos
);

// ═══════════════════════════════════════════════════════════════════════
// ENTREGAS
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/entregas",
  permissionMiddleware("relatorios.read", "relatorios.delivery.read"),
  relatorioController.getEntregas
);

router.get(
  "/entregas/exportar/pdf",
  permissionMiddleware("relatorios.read", "relatorios.delivery.read", "relatorios.export"),
  relatorioController.exportarEntregasPdf
);

router.get(
  "/entregas/exportar/excel",
  permissionMiddleware("relatorios.read", "relatorios.delivery.read", "relatorios.export"),
  relatorioController.exportarEntregasExcel
);

// ═══════════════════════════════════════════════════════════════════════
// FROTA / MANUTENÇÕES
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/frota",
  permissionMiddleware("relatorios.read", "relatorios.fleet.read"),
  relatorioController.getFrota
);

// ═══════════════════════════════════════════════════════════════════════
// VENDAS FUTURAS
// ═══════════════════════════════════════════════════════════════════════

router.get(
  "/vendas-futuras",
  permissionMiddleware("relatorios.read", "relatorios.sales.read"),
  relatorioController.getVendasFuturas
);

module.exports = router;
