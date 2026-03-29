const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/token");
const User = require("../modules/user/user.model");

const protect = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.replace("Bearer ", "")
      : null;

    if (!token) {
      return next(new ApiError(401, "Authentication required"));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-password -refreshTokenHash");

    if (!user || !user.isActive) {
      return next(new ApiError(401, "Invalid or inactive user"));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired access token"));
  }
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};

module.exports = {
  protect,
  authorize
};

