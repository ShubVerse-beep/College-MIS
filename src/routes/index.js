const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const studentRoutes = require("../modules/student/student.routes");
const facultyRoutes = require("../modules/faculty/faculty.routes");
const courseRoutes = require("../modules/course/course.routes");
const attendanceRoutes = require("../modules/attendance/attendance.routes");
const marksRoutes = require("../modules/marks/marks.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const notificationRoutes = require("../modules/notification/notification.routes");
const reportRoutes = require("../modules/report/report.routes");
const timetableRoutes = require("../modules/timetable/timetable.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/faculty", facultyRoutes);
router.use("/courses", courseRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/marks", marksRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/timetables", timetableRoutes);

module.exports = router;

