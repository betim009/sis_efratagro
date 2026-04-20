const { createLogger, format, transports } = require("winston");
const path = require("path");

const env = require("./env");

const LOG_DIR = path.resolve(__dirname, "../../logs");

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${extra}`;
  })
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.json()
);

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------
const logger = createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  defaultMeta: { service: "efratagro-api" },
  transports: [
    // Console — sempre ativo
    new transports.Console({
      format: consoleFormat
    })
  ]
});

// Em produção, adiciona arquivos de log
if (env.nodeEnv === "production" || env.nodeEnv === "staging") {
  logger.add(
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  );

  logger.add(
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    })
  );
}

module.exports = logger;
