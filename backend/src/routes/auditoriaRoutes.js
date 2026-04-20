const express = require("express");

const auditoriaController = require("../controllers/auditoriaController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Métricas de auditoria (antes das rotas com parâmetros)
router.get(
  "/logs/metricas",
  permissionMiddleware("auditoria.read", "auditoria.read.all"),
  auditoriaController.getMetricas
);

// Logs por usuário
router.get(
  "/logs/usuario/:usuarioId",
  permissionMiddleware("auditoria.read", "auditoria.read.by_user"),
  auditoriaController.listLogsByUsuario
);

// Logs por módulo (tabela)
router.get(
  "/logs/modulo/:modulo",
  permissionMiddleware("auditoria.read", "auditoria.read.by_module"),
  auditoriaController.listLogsByModulo
);

// Logs por entidade e ID de registro
router.get(
  "/logs/entidade/:entidade/:entidadeId",
  permissionMiddleware("auditoria.read"),
  auditoriaController.listLogsByEntidade
);

// Logs por ação
router.get(
  "/logs/acao/:acao",
  permissionMiddleware("auditoria.read"),
  auditoriaController.listLogsByAcao
);

// Log específico por ID
router.get(
  "/logs/:id",
  permissionMiddleware("auditoria.read"),
  auditoriaController.getLogById
);

// Listagem geral com filtros via query string
router.get(
  "/logs",
  permissionMiddleware("auditoria.read"),
  auditoriaController.listLogs
);

module.exports = router;
