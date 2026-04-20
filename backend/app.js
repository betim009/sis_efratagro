require("./src/config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const env = require("./src/config/env");
const routes = require("./src/routes");
const notFoundMiddleware = require("./src/middlewares/notFoundMiddleware");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

const app = express();

// ---------------------------------------------------------------------------
// Segurança
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(hpp());

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  })
);

// ---------------------------------------------------------------------------
// Compressão (gzip / brotli)
// ---------------------------------------------------------------------------
if (env.nodeEnv === "production") {
  app.use(compression());
}

// ---------------------------------------------------------------------------
// Rate Limiting global
// ---------------------------------------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === "production" ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Muitas requisições. Tente novamente em alguns minutos."
  }
});
app.use(globalLimiter);

// ---------------------------------------------------------------------------
// Rate Limiting — autenticação (mais restrito)
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Muitas tentativas de autenticação. Tente novamente mais tarde."
  }
});
app.use(`${env.apiPrefix}/auth`, authLimiter);

// ---------------------------------------------------------------------------
// Proxy confiável (quando atrás de Nginx / load balancer)
// ---------------------------------------------------------------------------
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------
app.use(env.apiPrefix, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
