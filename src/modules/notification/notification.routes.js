const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./notification.controller");
const {
  announcementSchema,
  notificationListQuerySchema,
  notificationIdParamSchema
} = require("./notification.validation");

const router = express.Router();

router.use(protect);

router.get("/notifications", validate(notificationListQuerySchema, "query"), controller.listNotifications);
router.patch(
  "/notifications/:id/read",
  validate(notificationIdParamSchema, "params"),
  controller.markAsRead
);
router.patch("/notifications/read-all", controller.markAllAsRead);
router.get("/notifications/unread-count", controller.unreadCount);

router.get("/announcements", authorize("admin", "faculty"), controller.listAnnouncements);
router.post(
  "/announcements",
  authorize("admin", "faculty"),
  validate(announcementSchema),
  controller.createAnnouncement
);

module.exports = router;
