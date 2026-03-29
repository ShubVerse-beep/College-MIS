const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/college_mis",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || "access-secret",
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "College MIS <noreply@example.com>"
};

module.exports = env;

