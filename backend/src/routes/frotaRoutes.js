const express = require("express");

const frotaController = require("../controllers/frotaController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// ─── Alertas e relatórios (antes das rotas com :id) ─────────────────

router.get(
  "/alertas/manutencao-preventiva",
  permissionMiddleware("frota.read"),
  frotaController.getAlertasManutencaoPreventiva
);

router.get(
  "/relatorios/custos-manutencao",
  permissionMiddleware("frota.read"),
  frotaController.getRelatorioCustosManutencao
);

router.get(
  "/resumo",
  permissionMiddleware("frota.read"),
  frotaController.getResumoFrota
);

// ─── Veículos por status (antes de :id) ─────────────────────────────

router.get(
  "/veiculos/status/:status",
  permissionMiddleware("frota.read"),
  frotaController.listVeiculosByStatus
);

// ─── CRUD de veículos ───────────────────────────────────────────────

router.post(
  "/veiculos",
  permissionMiddleware("frota.create"),
  frotaController.createVeiculo
);

router.get(
  "/veiculos",
  permissionMiddleware("frota.read"),
  frotaController.listVeiculos
);

router.get(
  "/veiculos/:id",
  permissionMiddleware("frota.read"),
  frotaController.getVeiculoById
);

router.put(
  "/veiculos/:id",
  permissionMiddleware("frota.update"),
  frotaController.updateVeiculo
);

router.patch(
  "/veiculos/:id/status",
  permissionMiddleware("frota.update"),
  frotaController.updateVeiculoStatus
);

// ─── Histórico e manutenções por veículo ────────────────────────────

router.get(
  "/veiculos/:id/historico",
  permissionMiddleware("frota.read"),
  frotaController.getHistoricoVeiculo
);

router.get(
  "/veiculos/:id/manutencoes",
  permissionMiddleware("frota.read"),
  frotaController.listManutencoesByVeiculo
);

// ─── CRUD de manutenções ────────────────────────────────────────────

router.post(
  "/manutencoes",
  permissionMiddleware("frota.create"),
  frotaController.createManutencao
);

router.get(
  "/manutencoes",
  permissionMiddleware("frota.read"),
  frotaController.listManutencoes
);

router.get(
  "/manutencoes/:id",
  permissionMiddleware("frota.read"),
  frotaController.getManutencaoById
);

router.put(
  "/manutencoes/:id",
  permissionMiddleware("frota.update"),
  frotaController.updateManutencao
);

router.patch(
  "/manutencoes/:id/status",
  permissionMiddleware("frota.update"),
  frotaController.updateManutencaoStatus
);

// ─── Vinculação com entregas ────────────────────────────────────────

router.patch(
  "/entregas/:entregaId/vincular-veiculo/:veiculoId",
  permissionMiddleware("frota.update"),
  frotaController.vincularVeiculoAEntrega
);

module.exports = router;
