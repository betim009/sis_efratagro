const AppError = require("../utils/AppError");

const notFoundMiddleware = (request, response, next) => {
  next(new AppError(`Rota nao encontrada: ${request.originalUrl}`, 404));
};

module.exports = notFoundMiddleware;
