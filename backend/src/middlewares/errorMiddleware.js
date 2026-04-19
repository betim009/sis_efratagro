const errorMiddleware = (error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Erro interno do servidor";

  if (process.env.NODE_ENV !== "test") {
    console.error("[error]", {
      method: request.method,
      path: request.originalUrl,
      statusCode,
      message
    });
  }

  response.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
};

module.exports = errorMiddleware;
