const sendResponse = (res, statusCode, message, data = null, meta = null) => {
  const payload = {
    success: statusCode < 400,
    message,
    data
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendResponse
};

