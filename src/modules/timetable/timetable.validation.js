const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const slotSchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    .required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  room: Joi.string().min(1).max(50).required(),
  course: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  faculty: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  department: Joi.string().min(2).max(100).required(),
  semester: Joi.number().integer().min(1).max(12).required()
});

const createTimetableSchema = Joi.object({
  academicYear: Joi.string().min(4).max(20).required(),
  department: Joi.string().min(2).max(100).required(),
  semester: Joi.number().integer().min(1).max(12).required(),
  status: Joi.string().valid("draft", "published").default("draft"),
  slots: Joi.array().items(slotSchema).required()
});

const updateTimetableSchema = Joi.object({
  academicYear: Joi.string().min(4).max(20),
  department: Joi.string().min(2).max(100),
  semester: Joi.number().integer().min(1).max(12),
  status: Joi.string().valid("draft", "published"),
  slots: Joi.array().items(slotSchema)
});

const timetableListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  academicYear: Joi.string().allow(""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12),
  status: Joi.string().valid("draft", "published").allow("")
});

const timetableIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

module.exports = {
  createTimetableSchema,
  updateTimetableSchema,
  timetableListQuerySchema,
  timetableIdParamSchema
};

