require("./src/config/env");

const app = require("./app");
const env = require("./src/config/env");
const { testConnection, closePool } = require("./src/config/database");

let server;

const startServer = async () => {
  await testConnection();

  server = app.listen(env.port, () => {
    console.log(`[server] ${env.appName} rodando na porta ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("[server] Falha ao conectar no PostgreSQL:", error.message);
  process.exit(1);
});

const shutdown = async (signal) => {
  if (!server) {
    await closePool();
    process.exit(0);
  }

  try {
    console.log(`[server] Encerrando aplicacao por ${signal}`);

    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  } catch (error) {
    console.error("[server] Erro ao encerrar:", error);
    await closePool();
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", async (reason) => {
  console.error("[server] unhandledRejection:", reason);
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
  console.error("[server] uncaughtException:", error);
  await closePool();
  process.exit(1);
});
