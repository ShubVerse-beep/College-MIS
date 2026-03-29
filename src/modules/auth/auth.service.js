const bcrypt = require("bcryptjs");
const ApiError = require("../../utils/ApiError");
const {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../../utils/token");
const User = require("../user/user.model");
const Student = require("../student/student.model");
const Faculty = require("../faculty/faculty.model");

const sanitizeUser = async (user) => {
  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  };

  if (user.role === "student") {
    const student = await Student.findOne({ user: user._id }).lean();
    return { ...base, profile: student };
  }

  if (user.role === "faculty") {
    const faculty = await Faculty.findOne({ user: user._id }).lean();
    return { ...base, profile: faculty };
  }

  return { ...base, profile: null };
};

const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  role: user.role
});

const createTokensForUser = async (user) => {
  const payload = buildTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken
  };
};

const getBootstrapStatus = async () => {
  const adminCount = await User.countDocuments({ role: "admin" });
  return {
    canBootstrap: adminCount === 0
  };
};

const bootstrapAdmin = async (payload) => {
  const { canBootstrap } = await getBootstrapStatus();

  if (!canBootstrap) {
    throw new ApiError(409, "Initial admin account has already been created");
  }

  const password = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password,
    role: "admin"
  });

  const tokens = await createTokensForUser(user);
  const sanitizedUser = await sanitizeUser(user);

  return {
    user: sanitizedUser,
    ...tokens
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account is inactive");
  }

  const tokens = await createTokensForUser(user);
  const sanitizedUser = await sanitizeUser(user);

  return {
    user: sanitizedUser,
    ...tokens
  };
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, "Refresh token does not match");
  }

  const tokens = await createTokensForUser(user);
  const sanitizedUser = await sanitizeUser(user);

  return {
    user: sanitizedUser,
    ...tokens
  };
};

const logout = async (refreshToken, currentUserId) => {
  if (!refreshToken && !currentUserId) {
    return;
  }

  if (currentUserId) {
    await User.findByIdAndUpdate(currentUserId, { refreshTokenHash: null });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
  } catch (_error) {
    return;
  }
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};

const changePassword = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordMatches = await bcrypt.compare(payload.currentPassword, user.password);

  if (!passwordMatches) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(payload.newPassword, 10);
  user.refreshTokenHash = null;
  await user.save();

  return sanitizeUser(user);
};

module.exports = {
  getBootstrapStatus,
  bootstrapAdmin,
  login,
  refreshSession,
  logout,
  getCurrentUser,
  changePassword
};
