const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const AppError = require("./AppError");

const generateJti = () => crypto.randomUUID();

const signAccessToken = ({ subject, sessionId, tokenJti, profileId }) =>
  jwt.sign(
    {
      sid: sessionId,
      profileId
    },
    env.jwtSecret,
    {
      jwtid: tokenJti,
      subject,
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    }
  );

const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience
    });

    return {
      sub: payload.sub,
      jti: payload.jti,
      sessionId: payload.sid,
      profileId: payload.profileId,
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    throw new AppError("Token invalido ou expirado", 401);
  }
};

const calculateExpirationDate = (value, unit) => {
  const expiresAt = new Date();

  if (unit === "hours") {
    expiresAt.setHours(expiresAt.getHours() + value);
    return expiresAt;
  }

  expiresAt.setMinutes(expiresAt.getMinutes() + value);
  return expiresAt;
};

module.exports = {
  generateJti,
  signAccessToken,
  verifyAccessToken,
  calculateExpirationDate
};
