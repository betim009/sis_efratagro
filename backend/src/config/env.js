const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET"
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${envVar}`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "SIS EfratAgro ERP",
  port: Number(process.env.PORT || 3001),
  apiPrefix: process.env.API_PREFIX || "/api",
  databaseUrl: process.env.DATABASE_URL || "",
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT || 5432),
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbPoolMax: Number(process.env.DB_POOL_MAX || 10),
  dbIdleTimeout: Number(process.env.DB_IDLE_TIMEOUT || 30000),
  dbConnectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 5000),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  jwtIssuer: process.env.JWT_ISSUER || "sis-efratagro-api",
  jwtAudience: process.env.JWT_AUDIENCE || "sis-efratagro-app",
  sessionIdleTimeoutMinutes: Number(
    process.env.SESSION_IDLE_TIMEOUT_MINUTES || 30
  ),
  sessionAbsoluteTimeoutHours: Number(
    process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS || 8
  ),
  passwordResetTokenTtlMinutes: Number(
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30
  ),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};
