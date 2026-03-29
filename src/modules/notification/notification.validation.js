const Joi = require("joi");
const { OBJECT_ID_PATTERN } = require("../../utils/constants");

const announcementSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  message: Joi.string().min(5).max(2000).required(),
  audienceType: Joi.string().valid("all", "role", "group").required(),
  targetRole: Joi.string().valid("admin", "faculty", "student").allow(null, ""),
  department: Joi.string().allow(""),
  semester: Joi.number().integer().min(1).max(12).allow(null),
  channels: Joi.object({
    inApp: Joi.boolean().default(true),
    email: Joi.boolean().default(false)
  }).default()
}).custom((value, helpers) => {
  if (value.audienceType === "role" && !value.targetRole) {
    return helpers.message("Target role is required for role audiences");
  }

  if (value.audienceType === "group" && (!value.department || !value.semester)) {
    return helpers.message("Department and semester are required for group audiences");
  }

  return value;
}, "Announcement audience validation");

const notificationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  isRead: Joi.boolean(),
  type: Joi.string()
});

const notificationIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

module.exports = {
  announcementSchema,
  notificationListQuerySchema,
  notificationIdParamSchema
};
