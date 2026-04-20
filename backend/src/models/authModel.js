const { query } = require("../config/database");

const findUserForAuthByEmail = async (email) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.perfil_id,
        u.nome,
        u.email,
        u.senha_hash,
        u.status,
        u.ultimo_login_em,
        p.nome AS perfil_nome
      FROM usuarios u
      INNER JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
};

const findUserProfileById = async (userId) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.perfil_id,
        u.nome,
        u.email,
        u.telefone,
        u.status,
        u.ultimo_login_em,
        u.criado_em,
        p.nome AS perfil_nome
      FROM usuarios u
      INNER JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
};

const findPermissionsByProfileId = async (profileId) => {
  const result = await query(
    `
      SELECT modulo, pode_criar, pode_ler, pode_atualizar, pode_excluir
      FROM perfil_permissoes
      WHERE perfil_id = $1
      ORDER BY modulo ASC
    `,
    [profileId]
  );

  return result.rows;
};

const updateLastLogin = async (userId) => {
  await query(
    `
      UPDATE usuarios
      SET ultimo_login_em = NOW(), atualizado_em = NOW()
      WHERE id = $1
    `,
    [userId]
  );
};

const createSession = async ({
  userId,
  tokenJti,
  ipAddress,
  userAgent,
  expiresAt
}) => {
  const result = await query(
    `
      INSERT INTO sessoes_usuario (
        usuario_id,
        token_jti,
        ip_origem,
        user_agent,
        ultimo_acesso_em,
        expira_em
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING id, usuario_id, token_jti, ultimo_acesso_em, expira_em, revogada_em
    `,
    [userId, tokenJti, ipAddress, userAgent, expiresAt]
  );

  return result.rows[0];
};

const findSessionById = async (sessionId) => {
  const result = await query(
    `
      SELECT
        s.id,
        s.usuario_id,
        s.token_jti,
        s.ip_origem,
        s.user_agent,
        s.ultimo_acesso_em,
        s.expira_em,
        s.revogada_em,
        u.perfil_id,
        u.nome,
        u.email,
        u.status,
        p.nome AS perfil_nome
      FROM sessoes_usuario s
      INNER JOIN usuarios u ON u.id = s.usuario_id
      INNER JOIN perfis_acesso p ON p.id = u.perfil_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
};

const touchSession = async (sessionId) => {
  await query(
    `
      UPDATE sessoes_usuario
      SET ultimo_acesso_em = NOW()
      WHERE id = $1
    `,
    [sessionId]
  );
};

const revokeSession = async (sessionId, reason = "LOGOUT") => {
  await query(
    `
      UPDATE sessoes_usuario
      SET revogada_em = NOW(), motivo_revogacao = $2
      WHERE id = $1 AND revogada_em IS NULL
    `,
    [sessionId, reason]
  );
};

const revokeAllUserSessions = async (userId, reason = "PASSWORD_RESET") => {
  await query(
    `
      UPDATE sessoes_usuario
      SET revogada_em = NOW(), motivo_revogacao = $2
      WHERE usuario_id = $1 AND revogada_em IS NULL
    `,
    [userId, reason]
  );
};

const createPasswordResetToken = async ({
  userId,
  tokenHash,
  expiresAt,
  ipAddress
}) => {
  const result = await query(
    `
      INSERT INTO tokens_reset_senha (
        usuario_id,
        token_hash,
        expira_em,
        ip_origem
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, usuario_id, expira_em, criado_em
    `,
    [userId, tokenHash, expiresAt, ipAddress]
  );

  return result.rows[0];
};

const findActivePasswordResetToken = async (tokenHash) => {
  const result = await query(
    `
      SELECT
        t.id,
        t.usuario_id,
        t.expira_em,
        t.utilizado_em,
        u.status,
        u.email,
        u.nome
      FROM tokens_reset_senha t
      INNER JOIN usuarios u ON u.id = t.usuario_id
      WHERE t.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
};

const markPasswordResetTokenAsUsed = async (tokenId) => {
  await query(
    `
      UPDATE tokens_reset_senha
      SET utilizado_em = NOW()
      WHERE id = $1 AND utilizado_em IS NULL
    `,
    [tokenId]
  );
};

const invalidateOpenPasswordResetTokens = async (userId) => {
  await query(
    `
      UPDATE tokens_reset_senha
      SET utilizado_em = NOW()
      WHERE usuario_id = $1 AND utilizado_em IS NULL
    `,
    [userId]
  );
};

const updatePasswordHash = async (userId, passwordHash) => {
  await query(
    `
      UPDATE usuarios
      SET senha_hash = $2, atualizado_em = NOW()
      WHERE id = $1
    `,
    [userId, passwordHash]
  );
};

module.exports = {
  findUserForAuthByEmail,
  findUserProfileById,
  findPermissionsByProfileId,
  updateLastLogin,
  createSession,
  findSessionById,
  touchSession,
  revokeSession,
  revokeAllUserSessions,
  createPasswordResetToken,
  findActivePasswordResetToken,
  markPasswordResetTokenAsUsed,
  invalidateOpenPasswordResetTokens,
  updatePasswordHash
};
