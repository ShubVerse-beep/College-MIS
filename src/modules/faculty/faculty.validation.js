const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const createFacultySchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  employeeId: Joi.string().min(3).max(50).required(),
  department: Joi.string().min(2).max(100).required(),
  designation: Joi.string().allow(""),
  qualification: Joi.string().allow(""),
  phone: Joi.string().allow("")
});

const updateFacultySchema = Joi.object({
  name: Joi.string().min(3).max(100),
  email: Joi.string().email(),
  employeeId: Joi.string().min(3).max(50),
  department: Joi.string().min(2).max(100),
  designation: Joi.string().allow(""),
  qualification: Joi.string().allow(""),
  phone: Joi.string().allow(""),
  isActive: Joi.boolean()
});

const facultyListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().allow(""),
  department: Joi.string().allow(""),
  status: Joi.string().valid("active", "inactive").allow(""),
  sortBy: Joi.string().allow(""),
  sortOrder: Joi.string().valid("asc", "desc")
});

const facultyIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

module.exports = {
  createFacultySchema,
  updateFacultySchema,
  facultyListQuerySchema,
  facultyIdParamSchema
};

