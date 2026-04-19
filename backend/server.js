require("./src/config/env");

const app = require("./app");
const env = require("./src/config/env");
const logger = require("./src/config/logger");
const { testConnection, closePool } = require("./src/config/database");

let server;

const startServer = async () => {
  await testConnection();

  server = app.listen(env.port, () => {
    logger.info(`${env.appName} rodando na porta ${env.port} [${env.nodeEnv}]`);
  });
};

startServer().catch((error) => {
  logger.error("Falha ao conectar no PostgreSQL:", error);
  process.exit(1);
});

const shutdown = async (signal) => {
  if (!server) {
    await closePool();
    process.exit(0);
  }

  try {
    logger.info(`Encerrando aplicacao por ${signal}`);

    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Erro ao encerrar:", error);
    await closePool();
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", async (reason) => {
  logger.error("unhandledRejection:", reason);
  if (server) {
    server.close(async () => {
      await closePool();
      process.exit(1);
    });
    return;
  }

  await closePool();
  process.exit(1);
});

process.on("uncaughtException", async (error) => {
  logger.error("uncaughtException:", error);
  await closePool();
  process.exit(1);
});
