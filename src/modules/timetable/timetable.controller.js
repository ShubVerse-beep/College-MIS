const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./timetable.service");

const createTimetable = asyncHandler(async (req, res) => {
  const data = await service.createTimetable(req.body);
  return sendResponse(res, 201, "Timetable created", data);
});

const updateTimetable = asyncHandler(async (req, res) => {
  const data = await service.updateTimetable(req.params.id, req.body);
  return sendResponse(res, 200, "Timetable updated", data);
});

const publishTimetable = asyncHandler(async (req, res) => {
  const data = await service.publishTimetable(req.params.id);
  return sendResponse(res, 200, "Timetable published", data);
});

const listTimetables = asyncHandler(async (req, res) => {
  const data = await service.listTimetables(req.user, req.query);
  return sendResponse(res, 200, "Timetables fetched", data.items, data.meta);
});

const getTimetable = asyncHandler(async (req, res) => {
  const data = await service.getTimetableById(req.user, req.params.id);
  return sendResponse(res, 200, "Timetable fetched", data);
});

const deleteTimetable = asyncHandler(async (req, res) => {
  const data = await service.deleteTimetable(req.params.id);
  return sendResponse(res, 200, "Timetable deleted", data);
});

module.exports = {
  createTimetable,
  updateTimetable,
  publishTimetable,
  listTimetables,
  getTimetable,
  deleteTimetable
};

