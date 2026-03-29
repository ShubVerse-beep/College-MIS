const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const attendanceReportQuerySchema = Joi.object({
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  dateFrom: Joi.date().allow(""),
  dateTo: Joi.date().allow("")
});

const marksReportQuerySchema = Joi.object({
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).allow(""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12),
  academicYear: Joi.string().allow("")
});

module.exports = {
  attendanceReportQuerySchema,
  marksReportQuerySchema
};

