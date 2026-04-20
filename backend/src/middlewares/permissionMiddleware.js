const authService = require("../services/authService");
const AppError = require("../utils/AppError");

const permissionMiddleware = (...requiredPermissions) => {
  return (request, response, next) => {
    try {
      if (!request.user) {
        throw new AppError("Usuario autenticado nao encontrado no contexto", 500);
      }

      requiredPermissions.forEach((permission) => {
        authService.ensurePermission(request.user, permission);
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = permissionMiddleware;
