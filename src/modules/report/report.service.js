const Course = require("../course/course.model");
const Attendance = require("../attendance/attendance.model");
const Marks = require("../marks/marks.model");

const exportAttendanceReport = async (query) => {
  const filter = {
    course: query.courseId
  };

  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.date.$lte = new Date(query.dateTo);
  }

  const course = await Course.findById(query.courseId);
  const attendance = await Attendance.find(filter)
    .populate({
      path: "records.student",
      populate: { path: "user", select: "name email" }
    })
    .sort({ date: -1 });

  const rows = attendance.flatMap((session) =>
    session.records.map((record) => ({
      Date: new Date(session.date).toLocaleDateString(),
      Student: record.student?.user?.name || "Unknown",
      Status: record.status,
      Course: course?.code || "-"
    }))
  );

  return {
    title: `Attendance Report - ${course?.code || "Course"}`,
    columns: ["Date", "Student", "Status", "Course"],
    rows
  };
};

const exportMarksReport = async (query) => {
  const filter = {};

  if (query.courseId) filter.course = query.courseId;
  if (query.academicYear) filter.academicYear = query.academicYear;

  const marks = await Marks.find(filter)
    .populate({
      path: "student",
      populate: { path: "user", select: "name email" }
    })
    .populate("course", "code title department semester")
    .sort({ updatedAt: -1 });

  const rows = marks
    .filter((item) => {
      if (query.department && item.course?.department !== query.department) {
        return false;
      }
      if (query.semester && item.course?.semester !== Number(query.semester)) {
        return false;
      }
      return true;
    })
    .map((item) => ({
      Student: item.student?.user?.name || "Unknown",
      Course: item.course?.code || "-",
      AcademicYear: item.academicYear,
      Total: item.total,
      Percentage: `${item.percentage}%`,
      Grade: item.grade
    }));

  return {
    title: "Marks Report",
    columns: ["Student", "Course", "AcademicYear", "Total", "Percentage", "Grade"],
    rows
  };
};

module.exports = {
  exportAttendanceReport,
  exportMarksReport
};

