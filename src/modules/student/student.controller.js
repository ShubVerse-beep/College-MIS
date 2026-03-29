const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./student.service");

const createStudent = asyncHandler(async (req, res) => {
  const data = await service.createStudent(req.body);
  return sendResponse(res, 201, "Student created", data);
});

const listStudents = asyncHandler(async (req, res) => {
  const data = await service.listStudents(req.query);
  return sendResponse(res, 200, "Students fetched", data.items, data.meta);
});

const getStudent = asyncHandler(async (req, res) => {
  const data = await service.getStudentById(req.params.id);
  return sendResponse(res, 200, "Student fetched", data);
});

const updateStudent = asyncHandler(async (req, res) => {
  const data = await service.updateStudent(req.params.id, req.body);
  return sendResponse(res, 200, "Student updated", data);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const data = await service.deactivateStudent(req.params.id);
  return sendResponse(res, 200, "Student deactivated", data);
});

const me = asyncHandler(async (req, res) => {
  const data = await service.getStudentProfileByUser(req.user._id);
  return sendResponse(res, 200, "Student profile fetched", data);
});

const updateMe = asyncHandler(async (req, res) => {
  const data = await service.updateStudentProfileByUser(req.user._id, req.body);
  return sendResponse(res, 200, "Student profile updated", data);
});

const assignedStudents = asyncHandler(async (req, res) => {
  const data = await service.getAssignedStudentsForFaculty(req.user._id, req.query);
  return sendResponse(res, 200, "Assigned students fetched", data);
});

module.exports = {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  me,
  updateMe,
  assignedStudents
};

