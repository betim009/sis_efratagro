const express = require("express");

const notificacaoController = require("../controllers/notificacaoController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Contagem de não lidas (antes das rotas com parâmetros dinâmicos)
router.get(
  "/nao-lidas/contagem",
  permissionMiddleware("notificacoes.read"),
  notificacaoController.contarNaoLidas
);

// Marcar todas como lidas
router.patch(
  "/marcar-todas-lidas",
  permissionMiddleware("notificacoes.update"),
  notificacaoController.marcarTodasComoLidas
);

// Listagem administrativa (todas as notificações de todos os usuários)
router.get(
  "/todas",
  permissionMiddleware("notificacoes.read", "notificacoes.read.all"),
  notificacaoController.listarTodasNotificacoes
);

// Listar por tipo
router.get(
  "/tipo/:tipo",
  permissionMiddleware("notificacoes.read"),
  notificacaoController.listarPorTipo
);

// Listar por status
router.get(
  "/status/:status",
  permissionMiddleware("notificacoes.read"),
  notificacaoController.listarPorStatus
);

// Marcar como lida
router.patch(
  "/:id/marcar-lida",
  permissionMiddleware("notificacoes.update"),
  notificacaoController.marcarComoLida
);

// Arquivar notificação
router.patch(
  "/:id/arquivar",
  permissionMiddleware("notificacoes.update"),
  notificacaoController.arquivar
);

// Buscar por ID
router.get(
  "/:id",
  permissionMiddleware("notificacoes.read"),
  notificacaoController.buscarPorId
);

// Listagem geral do usuário autenticado com filtros via query string
router.get(
  "/",
  permissionMiddleware("notificacoes.read"),
  notificacaoController.listarNotificacoes
);

module.exports = router;
