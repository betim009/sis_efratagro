const crypto = require("crypto");

const authModel = require("../models/authModel");
const auditLogModel = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const env = require("../config/env");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  signAccessToken,
  verifyAccessToken,
  generateJti,
  calculateExpirationDate
} = require("../utils/jwt");
const {
  mapPermissions,
  hasPermission
} = require("../utils/permissions");

const getRequestMetadata = (request) => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent") || null
});

const ensureEmail = (email) => {
  if (!email || typeof email !== "string") {
    throw new AppError("E-mail obrigatorio", 400);
  }
};

const ensurePassword = (password) => {
  if (!password || typeof password !== "string") {
    throw new AppError("Senha obrigatoria", 400);
  }
};

const ensureStrongEnoughPassword = (password) => {
  ensurePassword(password);

  if (password.length < 8) {
    throw new AppError("A nova senha deve ter pelo menos 8 caracteres", 400);
  }
};

const getSessionExpiry = () =>
  calculateExpirationDate(env.sessionAbsoluteTimeoutHours, "hours");

const getResetExpiry = () =>
  calculateExpirationDate(env.passwordResetTokenTtlMinutes, "minutes");

const buildAuthenticatedUser = async (userId, sessionId) => {
  const user = await authModel.findUserProfileById(userId);

  if (!user) {
    throw new AppError("Usuario autenticado nao encontrado", 401);
  }

  const permissionRows = await authModel.findPermissionsByProfileId(user.perfil_id);
  const permissions = mapPermissions(permissionRows);

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    phone: user.telefone,
    status: user.status,
    profile: {
      id: user.perfil_id,
      name: user.perfil_nome
    },
    session: {
      id: sessionId
    },
    permissions
  };
};

const login = async ({ email, password, request }) => {
  ensureEmail(email);
  ensurePassword(password);

  const user = await authModel.findUserForAuthByEmail(email);
  const metadata = getRequestMetadata(request);

  if (!user) {
    await auditLogModel.createAuditLog({
      tableName: "usuarios",
      action: "LOGIN",
      newData: { email, status: "FAILED_USER_NOT_FOUND" },
      ...metadata
    });

    throw new AppError("Credenciais invalidas", 401);
  }

  if (user.status !== "ATIVO") {
    await auditLogModel.createAuditLog({
      userId: user.id,
      tableName: "usuarios",
      recordId: user.id,
      action: "LOGIN",
      newData: { email: user.email, status: "FAILED_USER_INACTIVE" },
      ...metadata
    });

    throw new AppError("Usuario sem acesso ativo", 403);
  }

  const passwordMatches = await comparePassword(password, user.senha_hash);

  if (!passwordMatches) {
    await auditLogModel.createAuditLog({
      userId: user.id,
      tableName: "usuarios",
      recordId: user.id,
      action: "LOGIN",
      newData: { email: user.email, status: "FAILED_INVALID_PASSWORD" },
      ...metadata
    });

    throw new AppError("Credenciais invalidas", 401);
  }

  const tokenJti = generateJti();
  const session = await authModel.createSession({
    userId: user.id,
    tokenJti,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    expiresAt: getSessionExpiry()
  });

  await authModel.updateLastLogin(user.id);

  const token = signAccessToken({
    subject: user.id,
    sessionId: session.id,
    tokenJti,
    profileId: user.perfil_id
  });

  const authenticatedUser = await buildAuthenticatedUser(user.id, session.id);

  await auditLogModel.createAuditLog({
    userId: user.id,
    tableName: "usuarios",
    recordId: user.id,
    action: "LOGIN",
    newData: { sessionId: session.id, profile: user.perfil_nome, status: "SUCCESS" },
    ...metadata
  });

  return {
    token,
    tokenType: "Bearer",
    expiresIn: env.jwtExpiresIn,
    user: authenticatedUser
  };
};

const getAuthenticatedProfile = async (authenticatedUser) =>
  buildAuthenticatedUser(authenticatedUser.id, authenticatedUser.sessionId);

const requestPasswordReset = async ({ email, request }) => {
  ensureEmail(email);

  const user = await authModel.findUserForAuthByEmail(email);
  const metadata = getRequestMetadata(request);

  if (!user) {
    await auditLogModel.createAuditLog({
      tableName: "usuarios",
      action: "PASSWORD_RESET_REQUEST",
      newData: { email, status: "IGNORED_USER_NOT_FOUND" },
      ...metadata
    });

    return {
      message:
        "Se o e-mail estiver cadastrado, um token de redefinicao sera disponibilizado."
    };
  }

  await authModel.invalidateOpenPasswordResetTokens(user.id);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const resetToken = await authModel.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt: getResetExpiry(),
    ipAddress: metadata.ipAddress
  });

  await auditLogModel.createAuditLog({
    userId: user.id,
    tableName: "usuarios",
    recordId: user.id,
    action: "PASSWORD_RESET_REQUEST",
    newData: { resetTokenId: resetToken.id, status: "CREATED" },
    ...metadata
  });

  return {
    message:
      "Solicitacao de redefinicao registrada. Integre o envio por e-mail na camada de notificacao.",
    reset: {
      token: rawToken,
      expiresAt: resetToken.expira_em
    }
  };
};

const confirmPasswordReset = async ({ token, newPassword, request }) => {
  if (!token || typeof token !== "string") {
    throw new AppError("Token de redefinicao obrigatorio", 400);
  }

  ensureStrongEnoughPassword(newPassword);

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetToken = await authModel.findActivePasswordResetToken(tokenHash);
  const metadata = getRequestMetadata(request);

  if (!resetToken || resetToken.utilizado_em) {
    throw new AppError("Token de redefinicao invalido", 400);
  }

  if (resetToken.status !== "ATIVO") {
    throw new AppError("Usuario sem acesso ativo", 403);
  }

  if (new Date(resetToken.expira_em) < new Date()) {
    throw new AppError("Token de redefinicao expirado", 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await authModel.updatePasswordHash(resetToken.usuario_id, passwordHash);
  await authModel.markPasswordResetTokenAsUsed(resetToken.id);
  await authModel.invalidateOpenPasswordResetTokens(resetToken.usuario_id);
  await authModel.revokeAllUserSessions(resetToken.usuario_id);

  await auditLogModel.createAuditLog({
    userId: resetToken.usuario_id,
    tableName: "usuarios",
    recordId: resetToken.usuario_id,
    action: "PASSWORD_RESET_CONFIRM",
    newData: { resetTokenId: resetToken.id, status: "SUCCESS" },
    ...metadata
  });

  return {
    message: "Senha redefinida com sucesso. Faça login novamente."
  };
};

const logout = async (authenticatedUser, request) => {
  const metadata = getRequestMetadata(request);

  await authModel.revokeSession(authenticatedUser.sessionId, "LOGOUT");

  await auditLogModel.createAuditLog({
    userId: authenticatedUser.id,
    tableName: "usuarios",
    recordId: authenticatedUser.id,
    action: "LOGOUT",
    newData: { sessionId: authenticatedUser.sessionId, status: "SUCCESS" },
    ...metadata
  });

  return {
    message: "Sessao encerrada com sucesso."
  };
};

const validateAuthenticatedRequest = async (token) => {
  const payload = verifyAccessToken(token);
  const session = await authModel.findSessionById(payload.sessionId);

  if (!session) {
    throw new AppError("Sessao nao encontrada", 401);
  }

  if (session.revogada_em) {
    throw new AppError("Sessao revogada", 401);
  }

  if (session.status !== "ATIVO") {
    throw new AppError("Usuario sem acesso ativo", 403);
  }

  if (session.token_jti !== payload.jti) {
    throw new AppError("Token invalido para a sessao", 401);
  }

  if (new Date(session.expira_em) < new Date()) {
    await authModel.revokeSession(session.id, "ABSOLUTE_TIMEOUT");
    throw new AppError("Sessao expirada", 401);
  }

  const lastAccessTime = new Date(session.ultimo_acesso_em).getTime();
  const idleWindowMs = env.sessionIdleTimeoutMinutes * 60 * 1000;

  if (Date.now() - lastAccessTime > idleWindowMs) {
    await authModel.revokeSession(session.id, "IDLE_TIMEOUT");
    throw new AppError("Sessao expirada por inatividade", 401);
  }

  await authModel.touchSession(session.id);

  const permissionRows = await authModel.findPermissionsByProfileId(session.perfil_id);
  const permissions = mapPermissions(permissionRows);

  return {
    id: session.usuario_id,
    sessionId: session.id,
    email: session.email,
    name: session.nome,
    status: session.status,
    profile: {
      id: session.perfil_id,
      name: session.perfil_nome
    },
    permissions,
    tokenPayload: payload
  };
};

const ensurePermission = (authenticatedUser, permission) => {
  if (!hasPermission(authenticatedUser.permissions, permission)) {
    throw new AppError("Usuario sem permissao para executar esta acao", 403);
  }
};

module.exports = {
  login,
  getAuthenticatedProfile,
  requestPasswordReset,
  confirmPasswordReset,
  logout,
  validateAuthenticatedRequest,
  ensurePermission
};
