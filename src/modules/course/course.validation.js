const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const createCourseSchema = Joi.object({
  code: Joi.string().min(2).max(50).required(),
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().allow(""),
  credits: Joi.number().integer().min(1).max(12).required(),
  department: Joi.string().min(2).max(100).required(),
  semester: Joi.number().integer().min(1).max(12).required(),
  assignedFaculty: Joi.string().pattern(OBJECT_ID_PATTERN).allow(null, "")
});

const updateCourseSchema = Joi.object({
  code: Joi.string().min(2).max(50),
  title: Joi.string().min(3).max(150),
  description: Joi.string().allow(""),
  credits: Joi.number().integer().min(1).max(12),
  department: Joi.string().min(2).max(100),
  semester: Joi.number().integer().min(1).max(12),
  assignedFaculty: Joi.string().pattern(OBJECT_ID_PATTERN).allow(null, ""),
  isActive: Joi.boolean()
});

const courseListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().allow(""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12),
  status: Joi.string().valid("active", "inactive").allow(""),
  sortBy: Joi.string().allow(""),
  sortOrder: Joi.string().valid("asc", "desc")
});

const courseIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  courseListQuerySchema,
  courseIdParamSchema
};

