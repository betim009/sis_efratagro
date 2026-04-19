const { Pool } = require("pg");

const env = require("./env");

const poolConfig = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      max: env.dbPoolMax,
      idleTimeoutMillis: env.dbIdleTimeout,
      connectionTimeoutMillis: env.dbConnectionTimeout
    }
  : {
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
      max: env.dbPoolMax,
      idleTimeoutMillis: env.dbIdleTimeout,
      connectionTimeoutMillis: env.dbConnectionTimeout
    };

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("[database] Erro inesperado no pool:", error);
});

const query = (text, params = []) => pool.query(text, params);

const testConnection = async () => {
  await query("SELECT 1");
};

const closePool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  testConnection,
  closePool
};
