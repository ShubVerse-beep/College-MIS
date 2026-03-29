const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./attendance.service");

const upsertAttendance = asyncHandler(async (req, res) => {
  const data = await service.upsertAttendance(req.user, req.body);
  return sendResponse(res, 200, "Attendance saved", data);
});

const listAttendance = asyncHandler(async (req, res) => {
  const data = await service.listAttendance(req.user, req.query);
  return sendResponse(res, 200, "Attendance records fetched", data.items, data.meta);
});

const myAttendance = asyncHandler(async (req, res) => {
  const data = await service.getStudentAttendance(req.user._id);
  return sendResponse(res, 200, "Student attendance fetched", data);
});

module.exports = {
  upsertAttendance,
  listAttendance,
  myAttendance
};

