const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./attendance.controller");
const { upsertAttendanceSchema, attendanceListQuerySchema } = require("./attendance.validation");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("student"), controller.myAttendance);
router.get(
  "/",
  authorize("admin", "faculty"),
  validate(attendanceListQuerySchema, "query"),
  controller.listAttendance
);
router.post(
  "/",
  authorize("admin", "faculty"),
  validate(upsertAttendanceSchema),
  controller.upsertAttendance
);

module.exports = router;

