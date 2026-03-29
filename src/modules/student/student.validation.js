const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const createStudentSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  studentId: Joi.string().min(3).max(50).required(),
  department: Joi.string().min(2).max(100).required(),
  semester: Joi.number().integer().min(1).max(12).required(),
  admissionYear: Joi.number().integer().min(2000).max(2100).required(),
  phone: Joi.string().allow(""),
  guardianName: Joi.string().allow(""),
  guardianPhone: Joi.string().allow(""),
  address: Joi.string().allow(""),
  dateOfBirth: Joi.date().allow(null, "")
});

const updateStudentSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  email: Joi.string().email(),
  studentId: Joi.string().min(3).max(50),
  department: Joi.string().min(2).max(100),
  semester: Joi.number().integer().min(1).max(12),
  admissionYear: Joi.number().integer().min(2000).max(2100),
  phone: Joi.string().allow(""),
  guardianName: Joi.string().allow(""),
  guardianPhone: Joi.string().allow(""),
  address: Joi.string().allow(""),
  dateOfBirth: Joi.date().allow(null, ""),
  isActive: Joi.boolean()
});

const studentListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().allow(""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12),
  status: Joi.string().valid("active", "inactive").allow(""),
  sortBy: Joi.string().allow(""),
  sortOrder: Joi.string().valid("asc", "desc")
});

const studentIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

const studentSelfUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  phone: Joi.string().allow(""),
  guardianName: Joi.string().allow(""),
  guardianPhone: Joi.string().allow(""),
  address: Joi.string().allow(""),
  dateOfBirth: Joi.date().allow(null, "")
});

const assignedStudentsQuerySchema = Joi.object({
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).allow(""),
  search: Joi.string().allow("")
});

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  studentListQuerySchema,
  studentIdParamSchema,
  studentSelfUpdateSchema,
  assignedStudentsQuerySchema
};

