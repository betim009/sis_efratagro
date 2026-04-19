const express = require("express");

const financeiroController = require("../controllers/financeiroController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// ─── Alertas (devem vir antes das rotas com :id) ────────────────────

router.get(
  "/duplicatas/alertas/vencidas",
  permissionMiddleware("financeiro.read"),
  financeiroController.getAlertasVencidas
);

router.get(
  "/duplicatas/alertas/vencendo",
  permissionMiddleware("financeiro.read"),
  financeiroController.getAlertasVencendo
);

// ─── Resumo para dashboard ──────────────────────────────────────────

router.get(
  "/resumo",
  permissionMiddleware("financeiro.read"),
  financeiroController.getResumoFinanceiro
);

// ─── Filtros por status e cliente ───────────────────────────────────

router.get(
  "/duplicatas/status/:status",
  permissionMiddleware("financeiro.read"),
  financeiroController.listDuplicatasByStatus
);

router.get(
  "/duplicatas/cliente/:clienteId",
  permissionMiddleware("financeiro.read"),
  financeiroController.listDuplicatasByCliente
);

// ─── Gerar duplicatas ───────────────────────────────────────────────

router.post(
  "/duplicatas/gerar",
  permissionMiddleware("financeiro.create"),
  financeiroController.gerarDuplicata
);

router.post(
  "/duplicatas/gerar-parcelas",
  permissionMiddleware("financeiro.create"),
  financeiroController.gerarParcelas
);

// ─── CRUD de duplicatas ─────────────────────────────────────────────

router.get(
  "/duplicatas",
  permissionMiddleware("financeiro.read"),
  financeiroController.listDuplicatas
);

router.get(
  "/duplicatas/:id",
  permissionMiddleware("financeiro.read"),
  financeiroController.getDuplicataById
);

// ─── Pagamentos de uma duplicata ────────────────────────────────────

router.get(
  "/duplicatas/:id/pagamentos",
  permissionMiddleware("financeiro.read"),
  financeiroController.listPagamentosByDuplicata
);

router.post(
  "/duplicatas/:id/pagamentos",
  permissionMiddleware("financeiro.create"),
  financeiroController.registrarPagamento
);

module.exports = router;
