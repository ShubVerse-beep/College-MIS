const { sendResponse } = require("../utils/response");

const notFound = (_req, _res, next) => {
  const error = new Error("Resource not found");
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  return sendResponse(
    res,
    statusCode,
    error.message || "Internal server error",
    null,
    error.details ? { details: error.details } : undefined
  );
};

module.exports = {
  notFound,
  errorHandler
};

