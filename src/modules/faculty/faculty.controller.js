const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./faculty.service");

const createFaculty = asyncHandler(async (req, res) => {
  const data = await service.createFaculty(req.body);
  return sendResponse(res, 201, "Faculty member created", data);
});

const listFaculty = asyncHandler(async (req, res) => {
  const data = await service.listFaculty(req.query);
  return sendResponse(res, 200, "Faculty list fetched", data.items, data.meta);
});

const getFaculty = asyncHandler(async (req, res) => {
  const data = await service.getFacultyById(req.params.id);
  return sendResponse(res, 200, "Faculty member fetched", data);
});

const updateFaculty = asyncHandler(async (req, res) => {
  const data = await service.updateFaculty(req.params.id, req.body);
  return sendResponse(res, 200, "Faculty member updated", data);
});

const deleteFaculty = asyncHandler(async (req, res) => {
  const data = await service.deactivateFaculty(req.params.id);
  return sendResponse(res, 200, "Faculty member deactivated", data);
});

const me = asyncHandler(async (req, res) => {
  const data = await service.getFacultyProfileByUser(req.user._id);
  return sendResponse(res, 200, "Faculty profile fetched", data);
});

module.exports = {
  createFaculty,
  listFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  me
};

