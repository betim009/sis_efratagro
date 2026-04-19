const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/password-reset/request", authController.requestPasswordReset);
router.post("/password-reset/confirm", authController.confirmPasswordReset);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.getMe);

router.get(
  "/permissions-example",
  authMiddleware,
  permissionMiddleware("clientes.read", "estoque.read"),
  (request, response) => {
    response.status(200).json({
      status: "success",
      message: "Usuario autenticado e autorizado para o exemplo de permissao",
      data: {
        userId: request.user.id,
        permissions: request.user.permissions
      }
    });
  }
);

module.exports = router;
