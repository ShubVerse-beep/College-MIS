const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./course.service");

const createCourse = asyncHandler(async (req, res) => {
  const data = await service.createCourse(req.body);
  return sendResponse(res, 201, "Course created", data);
});

const listCourses = asyncHandler(async (req, res) => {
  const data = await service.listCourses(req.query);
  return sendResponse(res, 200, "Courses fetched", data.items, data.meta);
});

const getCourse = asyncHandler(async (req, res) => {
  const data = await service.getCourseById(req.params.id);
  return sendResponse(res, 200, "Course fetched", data);
});

const updateCourse = asyncHandler(async (req, res) => {
  const data = await service.updateCourse(req.params.id, req.body);
  return sendResponse(res, 200, "Course updated", data);
});

const deleteCourse = asyncHandler(async (req, res) => {
  const data = await service.deactivateCourse(req.params.id);
  return sendResponse(res, 200, "Course deactivated", data);
});

const assignedCourses = asyncHandler(async (req, res) => {
  const data = await service.getAssignedCoursesForFaculty(req.user._id);
  return sendResponse(res, 200, "Assigned courses fetched", data);
});

const myCourses = asyncHandler(async (req, res) => {
  const data = await service.getCoursesForStudent(req.user._id);
  return sendResponse(res, 200, "Student courses fetched", data);
});

module.exports = {
  createCourse,
  listCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  assignedCourses,
  myCourses
};

