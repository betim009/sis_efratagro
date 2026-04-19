const notificacaoModel = require("../models/notificacaoModel");
const AppError = require("../utils/AppError");
const {
  isValidUuid,
  validateCreatePayload,
  parseNotificacaoFilters
} = require("../utils/notificacaoValidation");

// ─── Criar notificação (chamado pelo helper ou por gatilhos) ────────

const criarNotificacao = async (payload) => {
  const parsed = validateCreatePayload(payload);
  return notificacaoModel.create(parsed);
};

// ─── Criar notificação para múltiplos usuários ─────────────────────
// Decisão: um mesmo evento (ex: estoque baixo) pode gerar notificação
// para vários usuários de perfis diferentes. Este método centraliza
// a criação em lote sem que o módulo chamador precise iterar.

const criarParaMultiplosUsuarios = async (usuarioIds, notificacaoBase) => {
  const resultados = [];

  for (const usuarioId of usuarioIds) {
    try {
      const notificacao = await criarNotificacao({
        ...notificacaoBase,
        usuarioId
      });
      resultados.push(notificacao);
    } catch (error) {
      console.error(
        `[notificacao] Falha ao notificar usuario ${usuarioId}:`,
        error.message
      );
    }
  }

  return resultados;
};

// ─── Listar notificações do usuário autenticado ─────────────────────

const listarMinhas = async (usuarioId, queryParams) => {
  const filters = parseNotificacaoFilters(queryParams);
  const result = await notificacaoModel.listByUsuario(usuarioId, filters);

  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

// ─── Listar todas (admin) ───────────────────────────────────────────

const listarTodas = async (queryParams) => {
  const filters = parseNotificacaoFilters(queryParams);
  const result = await notificacaoModel.listAll(filters);

  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

// ─── Buscar por ID ──────────────────────────────────────────────────

const buscarPorId = async (id, authenticatedUser) => {
  if (!isValidUuid(id)) {
    throw new AppError("ID de notificacao invalido", 400);
  }

  const notificacao = await notificacaoModel.findById(id);
  if (!notificacao) {
    throw new AppError("Notificacao nao encontrada", 404);
  }

  // Usuário só pode ver a própria notificação, a menos que tenha permissão admin
  if (
    notificacao.usuario_id !== authenticatedUser.id &&
    !authenticatedUser.isAdmin
  ) {
    throw new AppError("Acesso negado a esta notificacao", 403);
  }

  return notificacao;
};

// ─── Contagem de não lidas ──────────────────────────────────────────

const contarNaoLidas = async (usuarioId) => {
  const total = await notificacaoModel.countNaoLidas(usuarioId);
  return { total };
};

// ─── Marcar como lida ───────────────────────────────────────────────

const marcarComoLida = async (id, authenticatedUser) => {
  if (!isValidUuid(id)) {
    throw new AppError("ID de notificacao invalido", 400);
  }

  const notificacao = await notificacaoModel.findById(id);
  if (!notificacao) {
    throw new AppError("Notificacao nao encontrada", 404);
  }

  if (
    notificacao.usuario_id !== authenticatedUser.id &&
    !authenticatedUser.isAdmin
  ) {
    throw new AppError("Acesso negado a esta notificacao", 403);
  }

  if (notificacao.status === "LIDA") {
    return notificacao;
  }

  return notificacaoModel.marcarLida(id);
};

// ─── Marcar todas como lidas ────────────────────────────────────────

const marcarTodasComoLidas = async (usuarioId) => {
  const atualizadas = await notificacaoModel.marcarTodasLidas(usuarioId);
  return { atualizadas };
};

// ─── Arquivar ───────────────────────────────────────────────────────

const arquivarNotificacao = async (id, authenticatedUser) => {
  if (!isValidUuid(id)) {
    throw new AppError("ID de notificacao invalido", 400);
  }

  const notificacao = await notificacaoModel.findById(id);
  if (!notificacao) {
    throw new AppError("Notificacao nao encontrada", 404);
  }

  if (
    notificacao.usuario_id !== authenticatedUser.id &&
    !authenticatedUser.isAdmin
  ) {
    throw new AppError("Acesso negado a esta notificacao", 403);
  }

  if (notificacao.status === "ARQUIVADA") {
    return notificacao;
  }

  return notificacaoModel.arquivar(id);
};

// ─── Listar por tipo (atalho para o usuário autenticado) ────────────

const listarPorTipo = async (tipo, usuarioId, queryParams) => {
  const filters = parseNotificacaoFilters({ ...queryParams, tipo });
  const result = await notificacaoModel.listByUsuario(usuarioId, filters);

  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

// ─── Listar por status (atalho para o usuário autenticado) ──────────

const listarPorStatus = async (status, usuarioId, queryParams) => {
  const filters = parseNotificacaoFilters({ ...queryParams, status });
  const result = await notificacaoModel.listByUsuario(usuarioId, filters);

  return {
    notificacoes: result.notificacoes,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit) || 1
    }
  };
};

module.exports = {
  criarNotificacao,
  criarParaMultiplosUsuarios,
  listarMinhas,
  listarTodas,
  buscarPorId,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  arquivarNotificacao,
  listarPorTipo,
  listarPorStatus
};
