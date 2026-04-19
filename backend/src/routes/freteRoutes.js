const express = require("express");

const freteController = require("../controllers/freteController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════════════
// TABELAS DE FRETE (configuração)
// ═══════════════════════════════════════════════════════════════════════

router.post(
  "/tabelas",
  permissionMiddleware("fretes.tables.create"),
  freteController.createTabela
);

router.get(
  "/tabelas",
  permissionMiddleware("fretes.tables.read"),
  freteController.listTabelas
);

router.get(
  "/tabelas/:id",
  permissionMiddleware("fretes.tables.read"),
  freteController.getTabelaById
);

router.put(
  "/tabelas/:id",
  permissionMiddleware("fretes.tables.update"),
  freteController.updateTabela
);

router.patch(
  "/tabelas/:id/inativar",
  permissionMiddleware("fretes.tables.update"),
  freteController.inativarTabela
);

// ═══════════════════════════════════════════════════════════════════════
// CÁLCULO E OPERAÇÃO
// ═══════════════════════════════════════════════════════════════════════

// Rotas específicas antes das rotas com :id para evitar conflito

router.post(
  "/calcular",
  permissionMiddleware("fretes.calculate"),
  freteController.calcularFrete
);

router.get(
  "/periodo",
  permissionMiddleware("fretes.reports.read"),
  freteController.listFretesPorPeriodo
);

router.get(
  "/regiao/:regiao",
  permissionMiddleware("fretes.reports.read"),
  freteController.listFretesPorRegiao
);

router.get(
  "/venda/:vendaId",
  permissionMiddleware("fretes.read"),
  freteController.getFreteByVendaId
);

// CRUD e operações com :id

router.get(
  "/",
  permissionMiddleware("fretes.read"),
  freteController.listFretes
);

router.get(
  "/:id",
  permissionMiddleware("fretes.read"),
  freteController.getFreteById
);

router.patch(
  "/:id/vincular-entrega/:entregaId",
  permissionMiddleware("fretes.update"),
  freteController.vincularEntrega
);

router.patch(
  "/:id/vincular-veiculo/:veiculoId",
  permissionMiddleware("fretes.update"),
  freteController.vincularVeiculo
);

router.patch(
  "/:id/registrar-custo-real",
  permissionMiddleware("fretes.update"),
  freteController.registrarCustoReal
);

module.exports = router;
