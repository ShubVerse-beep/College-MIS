const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./dashboard.service");

const summary = asyncHandler(async (req, res) => {
  const data = await service.getDashboardSummary(req.user);
  return sendResponse(res, 200, "Dashboard summary fetched", data);
});

module.exports = {
  summary
};

