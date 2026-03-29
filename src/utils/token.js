const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

const signAccessToken = (payload) =>
  jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn
  });

const verifyAccessToken = (token) => jwt.verify(token, env.accessTokenSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.refreshTokenSecret);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
};

