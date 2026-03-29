const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./marks.service");

const upsertMarks = asyncHandler(async (req, res) => {
  const data = await service.upsertMarks(req.user, req.body);
  return sendResponse(res, 200, "Marks saved", data);
});

const listMarks = asyncHandler(async (req, res) => {
  const data = await service.listMarks(req.user, req.query);
  return sendResponse(res, 200, "Marks fetched", data.items, data.meta);
});

const myMarks = asyncHandler(async (req, res) => {
  const data = await service.getStudentMarks(req.user._id);
  return sendResponse(res, 200, "Student marks fetched", data);
});

module.exports = {
  upsertMarks,
  listMarks,
  myMarks
};

