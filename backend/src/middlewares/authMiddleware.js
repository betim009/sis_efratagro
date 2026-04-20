const AppError = require("../utils/AppError");
const authService = require("../services/authService");

const authMiddleware = async (request, response, next) => {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError("Token de acesso nao informado", 401);
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Formato do token invalido", 401);
    }

    request.user = await authService.validateAuthenticatedRequest(token);

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authMiddleware;
