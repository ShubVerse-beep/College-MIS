const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const Attendance = require("./attendance.model");
const Student = require("../student/student.model");
const {
  resolveCourseAccess,
  getEligibleStudentsForCourse,
  findFacultyByUserId
} = require("../course/course.service");
const { createNotifications } = require("../notification/notification.service");

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const validateAttendanceRecords = (records, eligibleStudents) => {
  const eligibleIds = new Set(
    eligibleStudents.filter((student) => student.user?.isActive !== false).map((student) => student._id.toString())
  );
  const submittedIds = records.map((record) => record.student);
  const uniqueIds = new Set(submittedIds);

  if (uniqueIds.size !== submittedIds.length) {
    throw new ApiError(400, "Duplicate student entries found in attendance");
  }

  if (eligibleIds.size !== records.length) {
    throw new ApiError(400, "Attendance must be recorded for every eligible student in the course");
  }

  submittedIds.forEach((studentId) => {
    if (!eligibleIds.has(studentId.toString())) {
      throw new ApiError(400, "Attendance contains a student who is not enrolled in the course");
    }
  });
};

const upsertAttendance = async (user, payload) => {
  const access = await resolveCourseAccess(user, payload.courseId);
  const { course, students } = await getEligibleStudentsForCourse(payload.courseId);
  validateAttendanceRecords(payload.records, students);

  const facultyId =
    access.faculty?._id || course.assignedFaculty;

  if (!facultyId) {
    throw new ApiError(400, "Assign a faculty member to the course before recording attendance");
  }

  const attendanceDate = normalizeDate(payload.date);
  const attendance = await Attendance.findOneAndUpdate(
    { course: course._id, date: attendanceDate },
    {
      course: course._id,
      faculty: facultyId,
      date: attendanceDate,
      department: course.department,
      semester: course.semester,
      records: payload.records.map((record) => ({
        student: record.student,
        status: record.status
      }))
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  )
    .populate("course", "code title department semester")
    .populate({
      path: "faculty",
      populate: { path: "user", select: "name email" }
    })
    .populate({
      path: "records.student",
      populate: { path: "user", select: "name email" }
    });

  const notificationUsers = students
    .filter((student) => student.user?.isActive !== false)
    .map((student) => ({
      _id: student.user._id,
      name: student.user.name,
      email: student.user.email
    }));

  await createNotifications({
    users: notificationUsers,
    title: "Attendance updated",
    message: `Attendance has been posted for ${course.title} on ${attendanceDate.toDateString()}.`,
    type: "attendance",
    link: "/student/attendance",
    channels: { inApp: true, email: false },
    metadata: {
      courseId: course._id.toString(),
      date: attendanceDate.toISOString()
    }
  });

  return attendance;
};

const listAttendance = async (user, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.courseId) {
    filter.course = query.courseId;
  }

  if (query.date) {
    filter.date = normalizeDate(query.date);
  }

  if (query.department) {
    filter.department = query.department;
  }

  if (query.semester) {
    filter.semester = Number(query.semester);
  }

  if (user.role === "faculty") {
    if (query.courseId) {
      const access = await resolveCourseAccess(user, query.courseId);
      filter.faculty = access.faculty._id;
    } else {
      const faculty = await findFacultyByUserId(user._id);
      filter.faculty = faculty._id;
    }
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate("course", "code title department semester")
      .populate({
        path: "faculty",
        populate: { path: "user", select: "name email" }
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter)
  ]);

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const getStudentAttendance = async (userId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const sessionDocuments = await Attendance.find({ "records.student": student._id })
    .populate("course", "code title department semester")
    .sort({ date: -1 });

  const summaryMap = new Map();

  const sessions = sessionDocuments.map((session) => {
    const record = session.records.find(
      (item) => item.student.toString() === student._id.toString()
    );

    if (!record) {
      return null;
    }

    const courseKey = session.course?._id?.toString() || "unknown";
    const existing = summaryMap.get(courseKey) || {
      courseId: courseKey,
      courseTitle: session.course?.title || "Unknown course",
      courseCode: session.course?.code || "-",
      presentCount: 0,
      totalCount: 0,
      percentage: 0
    };

    existing.totalCount += 1;
    if (record.status === "present") {
      existing.presentCount += 1;
    }
    existing.percentage =
      existing.totalCount > 0
        ? Number(((existing.presentCount / existing.totalCount) * 100).toFixed(2))
        : 0;

    summaryMap.set(courseKey, existing);
    return {
      ...session.toObject(),
      ownStatus: record.status
    };
  }).filter(Boolean);

  const overall = Array.from(summaryMap.values()).reduce(
    (accumulator, item) => {
      accumulator.presentCount += item.presentCount;
      accumulator.totalCount += item.totalCount;
      return accumulator;
    },
    { presentCount: 0, totalCount: 0 }
  );

  return {
    summary: Array.from(summaryMap.values()),
    sessions,
    overall: {
      presentCount: overall.presentCount,
      totalCount: overall.totalCount,
      percentage:
        overall.totalCount > 0
          ? Number(((overall.presentCount / overall.totalCount) * 100).toFixed(2))
          : 0
    }
  };
};

module.exports = {
  upsertAttendance,
  listAttendance,
  getStudentAttendance
};
