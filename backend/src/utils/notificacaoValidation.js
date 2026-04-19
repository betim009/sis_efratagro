const AppError = require("./AppError");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_TIPOS = [
  "ESTOQUE_BAIXO",
  "VENDA_FUTURA_PROXIMA",
  "DUPLICATA_VENCIDA",
  "DUPLICATA_VENCENDO",
  "MANUTENCAO_PENDENTE",
  "ENTREGA_NAO_CONCLUIDA",
  "ENTREGA_CONCLUIDA",
  "STATUS_ENTREGA_ALTERADO",
  "FRETE_DIVERGENTE",
  "ALERTA_GERAL"
];

const VALID_PRIORIDADES = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

const VALID_STATUS = ["NAO_LIDA", "LIDA", "ARQUIVADA"];

// ─── Helpers ────────────────────────────────────────────────────────

const isValidUuid = (value) => UUID_PATTERN.test(String(value || ""));

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const sanitizeString = (value) => {
  if (value === undefined || value === null) return null;
  const sanitized = String(value).trim();
  return sanitized.length ? sanitized : null;
};

// ─── Validação de criação de notificação ────────────────────────────

const validateCreatePayload = ({
  usuarioId,
  tipo,
  titulo,
  mensagem,
  prioridade = "MEDIA",
  entidade = null,
  entidadeId = null,
  metadata = null
}) => {
  if (!usuarioId || !isValidUuid(usuarioId)) {
    throw new AppError("usuario_id obrigatorio e deve ser UUID valido", 400);
  }

  if (!tipo || !VALID_TIPOS.includes(String(tipo).toUpperCase())) {
    throw new AppError(
      `tipo invalido. Use: ${VALID_TIPOS.join(", ")}`,
      400
    );
  }

  const tituloSanitized = sanitizeString(titulo);
  if (!tituloSanitized) {
    throw new AppError("titulo obrigatorio", 400);
  }

  const mensagemSanitized = sanitizeString(mensagem);
  if (!mensagemSanitized) {
    throw new AppError("mensagem obrigatoria", 400);
  }

  const prioridadeUpper = String(prioridade).toUpperCase();
  if (!VALID_PRIORIDADES.includes(prioridadeUpper)) {
    throw new AppError(
      `prioridade invalida. Use: ${VALID_PRIORIDADES.join(", ")}`,
      400
    );
  }

  const entidadeSanitized = sanitizeString(entidade);
  if (entidadeId && !isValidUuid(entidadeId)) {
    throw new AppError("entidade_id deve ser UUID valido", 400);
  }

  return {
    usuarioId,
    tipo: String(tipo).toUpperCase(),
    titulo: tituloSanitized,
    mensagem: mensagemSanitized,
    prioridade: prioridadeUpper,
    entidade: entidadeSanitized,
    entidadeId: entidadeId || null,
    metadata: metadata || null
  };
};

// ─── Parse de filtros de consulta ───────────────────────────────────

const parseNotificacaoFilters = (queryParams) => {
  const filters = {};

  if (queryParams.tipo) {
    const tipo = String(queryParams.tipo).toUpperCase();
    if (!VALID_TIPOS.includes(tipo)) {
      throw new AppError(
        `tipo invalido. Use: ${VALID_TIPOS.join(", ")}`,
        400
      );
    }
    filters.tipo = tipo;
  }

  if (queryParams.status) {
    const status = String(queryParams.status).toUpperCase();
    if (!VALID_STATUS.includes(status)) {
      throw new AppError(
        `status invalido. Use: ${VALID_STATUS.join(", ")}`,
        400
      );
    }
    filters.status = status;
  }

  if (queryParams.prioridade) {
    const prioridade = String(queryParams.prioridade).toUpperCase();
    if (!VALID_PRIORIDADES.includes(prioridade)) {
      throw new AppError(
        `prioridade invalida. Use: ${VALID_PRIORIDADES.join(", ")}`,
        400
      );
    }
    filters.prioridade = prioridade;
  }

  if (queryParams.dataInicio) {
    if (!isValidDate(queryParams.dataInicio)) {
      throw new AppError("dataInicio invalida. Use formato YYYY-MM-DD", 400);
    }
    filters.dataInicio = queryParams.dataInicio;
  }

  if (queryParams.dataFim) {
    if (!isValidDate(queryParams.dataFim)) {
      throw new AppError("dataFim invalida. Use formato YYYY-MM-DD", 400);
    }
    filters.dataFim = queryParams.dataFim;
  }

  if (filters.dataInicio && filters.dataFim) {
    if (new Date(filters.dataInicio) > new Date(filters.dataFim)) {
      throw new AppError("dataInicio nao pode ser posterior a dataFim", 400);
    }
  }

  const page = Number(queryParams.page);
  const limit = Number(queryParams.limit);

  filters.page = !Number.isNaN(page) && page >= 1 ? Math.floor(page) : 1;
  filters.limit =
    !Number.isNaN(limit) && limit >= 1 && limit <= 200
      ? Math.floor(limit)
      : 50;
  filters.offset = (filters.page - 1) * filters.limit;

  return filters;
};

module.exports = {
  VALID_TIPOS,
  VALID_PRIORIDADES,
  VALID_STATUS,
  isValidUuid,
  sanitizeString,
  validateCreatePayload,
  parseNotificacaoFilters
};
