const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const upsertMarksSchema = Joi.object({
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  studentId: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  academicYear: Joi.string().min(4).max(20).required(),
  internal: Joi.number().min(0).max(100).required(),
  practical: Joi.number().min(0).max(100).required(),
  external: Joi.number().min(0).max(100).required(),
  isPublished: Joi.boolean().default(true)
});

const marksListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).allow(""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12),
  academicYear: Joi.string().allow("")
});

module.exports = {
  upsertMarksSchema,
  marksListQuerySchema
};

