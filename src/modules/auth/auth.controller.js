const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const env = require("../../config/env");
const authService = require("./auth.service");

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
};

const getBootstrapStatus = asyncHandler(async (_req, res) => {
  const data = await authService.getBootstrapStatus();
  return sendResponse(res, 200, "Bootstrap status fetched", data);
});

const bootstrapAdmin = asyncHandler(async (req, res) => {
  const data = await authService.bootstrapAdmin(req.body);
  setRefreshTokenCookie(res, data.refreshToken);
  return sendResponse(res, 201, "Admin account created", {
    user: data.user,
    accessToken: data.accessToken
  });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  setRefreshTokenCookie(res, data.refreshToken);
  return sendResponse(res, 200, "Login successful", {
    user: data.user,
    accessToken: data.accessToken
  });
});

const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refreshSession(req.cookies.refreshToken);
  setRefreshTokenCookie(res, data.refreshToken);
  return sendResponse(res, 200, "Session refreshed", {
    user: data.user,
    accessToken: data.accessToken
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies.refreshToken, req.user?._id);
  clearRefreshTokenCookie(res);
  return sendResponse(res, 200, "Logout successful");
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentUser(req.user._id);
  return sendResponse(res, 200, "Current user fetched", data);
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user._id, req.body);
  clearRefreshTokenCookie(res);
  return sendResponse(res, 200, "Password updated", data);
});

module.exports = {
  getBootstrapStatus,
  bootstrapAdmin,
  login,
  refresh,
  logout,
  me,
  changePassword
};
