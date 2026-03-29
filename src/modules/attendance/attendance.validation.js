const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const attendanceRecordSchema = Joi.object({
  student: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  status: Joi.string().valid("present", "absent").required()
});

const upsertAttendanceSchema = Joi.object({
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  date: Joi.date().required(),
  records: Joi.array().items(attendanceRecordSchema).min(1).required()
});

const attendanceListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  courseId: Joi.string().pattern(OBJECT_ID_PATTERN).allow(""),
  date: Joi.date().allow(""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12)
});

module.exports = {
  upsertAttendanceSchema,
  attendanceListQuerySchema
};

