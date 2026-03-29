const Student = require("../student/student.model");
const Faculty = require("../faculty/faculty.model");
const Course = require("../course/course.model");
const Attendance = require("../attendance/attendance.model");
const Marks = require("../marks/marks.model");
const Announcement = require("../notification/announcement.model");
const Notification = require("../notification/notification.model");
const Timetable = require("../timetable/timetable.model");

const buildChartData = (items, keyLabel = "label") =>
  items.map((item) => ({
    [keyLabel]: item._id,
    value: item.value
  }));

const getAdminDashboard = async () => {
  const [studentCount, facultyCount, courseCount, attendanceCount, announcementCount] =
    await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Course.countDocuments({ isActive: true }),
      Attendance.countDocuments(),
      Announcement.countDocuments()
    ]);

  const [departmentDistribution, semesterDistribution, gradeDistribution, recentAnnouncements] =
    await Promise.all([
      Student.aggregate([{ $group: { _id: "$department", value: { $sum: 1 } } }]),
      Course.aggregate([{ $group: { _id: "$semester", value: { $sum: 1 } } }]),
      Marks.aggregate([{ $group: { _id: "$grade", value: { $sum: 1 } } }]),
      Announcement.find().sort({ createdAt: -1 }).limit(5).populate("createdBy", "name role")
    ]);

  return {
    stats: {
      studentCount,
      facultyCount,
      courseCount,
      attendanceCount,
      announcementCount
    },
    charts: {
      departmentDistribution: buildChartData(departmentDistribution, "department"),
      semesterDistribution: buildChartData(semesterDistribution, "semester"),
      gradeDistribution: buildChartData(gradeDistribution, "grade")
    },
    recentAnnouncements
  };
};

const getFacultyDashboard = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId });
  const courses = await Course.find({ assignedFaculty: faculty?._id, isActive: true });
  const courseIds = courses.map((course) => course._id);
  const groups = Array.from(
    new Map(courses.map((course) => [`${course.department}-${course.semester}`, course])).values()
  );
  const studentCount = groups.length
    ? await Student.countDocuments({
        $or: groups.map((group) => ({
          department: group.department,
          semester: group.semester
        }))
      })
    : 0;

  const [attendanceCount, marksCount, notificationsUnread] = await Promise.all([
    Attendance.countDocuments({ faculty: faculty?._id }),
    Marks.countDocuments({ faculty: faculty?._id }),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  return {
    stats: {
      assignedCourses: courses.length,
      studentCount,
      attendanceCount,
      marksCount,
      notificationsUnread
    },
    charts: {
      courseLoad: await Promise.all(
        courses.map(async (course) => ({
          label: course.code,
          value: await Student.countDocuments({
            department: course.department,
            semester: course.semester
          })
        }))
      ),
      recentCourseCodes: courses.map((course) => ({
        label: course.code,
        value: course.credits
      }))
    },
    courses
  };
};

const getStudentDashboard = async (userId) => {
  const student = await Student.findOne({ user: userId });
  const courses = await Course.find({
    department: student?.department,
    semester: student?.semester,
    isActive: true
  });
  const attendanceSessions = await Attendance.find({ "records.student": student?._id }).populate(
    "course",
    "code title"
  );
  const marks = await Marks.find({ student: student?._id }).populate("course", "code title");
  const timetable = await Timetable.findOne({
    department: student?.department,
    semester: student?.semester,
    status: "published"
  }).sort({ updatedAt: -1 });
  const unreadNotifications = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });

  const presentCount = attendanceSessions.reduce((total, session) => {
    const record = session.records.find((item) => item.student.toString() === student._id.toString());
    return total + (record?.status === "present" ? 1 : 0);
  }, 0);
  const attendancePercentage =
    attendanceSessions.length > 0
      ? Number(((presentCount / attendanceSessions.length) * 100).toFixed(2))
      : 0;
  const marksAverage =
    marks.length > 0
      ? Number(
          (
            marks.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / marks.length
          ).toFixed(2)
        )
      : 0;

  return {
    stats: {
      courseCount: courses.length,
      attendancePercentage,
      marksAverage,
      unreadNotifications
    },
    charts: {
      marksByCourse: marks.map((item) => ({
        label: item.course?.code || "Course",
        value: item.percentage
      })),
      attendanceHistory: attendanceSessions.slice(0, 7).map((item) => ({
        label: item.course?.code || "Course",
        value:
          item.records.find((record) => record.student.toString() === student._id.toString())?.status ===
          "present"
            ? 100
            : 0
      }))
    },
    timetablePreview: timetable?.slots?.slice(0, 6) || []
  };
};

const getDashboardSummary = async (user) => {
  if (user.role === "admin") {
    return getAdminDashboard();
  }

  if (user.role === "faculty") {
    return getFacultyDashboard(user._id);
  }

  return getStudentDashboard(user._id);
};

module.exports = {
  getDashboardSummary
};

