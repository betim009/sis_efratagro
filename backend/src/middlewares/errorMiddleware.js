const logger = require("../config/logger");

const errorMiddleware = (error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Erro interno do servidor";

  logger.error(message, {
    method: request.method,
    path: request.originalUrl,
    statusCode,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack })
  });

  response.status(statusCode).json({
    status: "error",
    message: statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Erro interno do servidor"
      : message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
};

module.exports = errorMiddleware;
