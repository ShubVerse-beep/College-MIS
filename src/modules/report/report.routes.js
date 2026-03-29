const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./report.controller");
const {
  attendanceReportQuerySchema,
  marksReportQuerySchema
} = require("./report.validation");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get(
  "/attendance/export",
  validate(attendanceReportQuerySchema, "query"),
  controller.attendanceReport
);
router.get("/marks/export", validate(marksReportQuerySchema, "query"), controller.marksReport);

module.exports = router;
