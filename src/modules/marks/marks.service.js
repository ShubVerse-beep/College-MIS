const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const { calculateGrade } = require("../../utils/grade");
const Marks = require("./marks.model");
const Student = require("../student/student.model");
const { resolveCourseAccess } = require("../course/course.service");
const { createNotifications } = require("../notification/notification.service");

const calculateMarksMetrics = ({ internal, practical, external }) => {
  const total = Number(internal) + Number(practical) + Number(external);
  const percentage = Number(((total / 300) * 100).toFixed(2));
  const grade = calculateGrade(percentage);

  return {
    total,
    percentage,
    grade
  };
};

const upsertMarks = async (user, payload) => {
  const access = await resolveCourseAccess(user, payload.courseId);
  const student = await Student.findById(payload.studentId).populate("user", "name email isActive");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (
    student.department !== access.course.department ||
    student.semester !== access.course.semester
  ) {
    throw new ApiError(400, "Student is not eligible for the selected course");
  }

  const facultyId = access.faculty?._id || access.course.assignedFaculty;

  if (!facultyId) {
    throw new ApiError(400, "Assign a faculty member to the course before uploading marks");
  }

  const metrics = calculateMarksMetrics(payload);
  const marks = await Marks.findOneAndUpdate(
    {
      student: student._id,
      course: access.course._id,
      academicYear: payload.academicYear
    },
    {
      student: student._id,
      course: access.course._id,
      faculty: facultyId,
      academicYear: payload.academicYear,
      internal: payload.internal,
      practical: payload.practical,
      external: payload.external,
      total: metrics.total,
      percentage: metrics.percentage,
      grade: metrics.grade,
      isPublished: payload.isPublished
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  )
    .populate({
      path: "student",
      populate: { path: "user", select: "name email" }
    })
    .populate("course", "code title department semester")
    .populate({
      path: "faculty",
      populate: { path: "user", select: "name email" }
    });

  if (payload.isPublished && student.user?.isActive !== false) {
    await createNotifications({
      users: [{ _id: student.user._id, name: student.user.name, email: student.user.email }],
      title: "Marks published",
      message: `Your marks for ${access.course.title} (${payload.academicYear}) are now available.`,
      type: "marks",
      link: "/student/marks",
      channels: { inApp: true, email: true },
      metadata: {
        courseId: access.course._id.toString(),
        academicYear: payload.academicYear
      }
    });
  }

  return marks;
};

const listMarks = async (user, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.courseId) {
    filter.course = query.courseId;
  }

  if (query.academicYear) {
    filter.academicYear = query.academicYear;
  }

  if (user.role === "faculty") {
    const access = await resolveCourseAccess(user, query.courseId);
    filter.faculty = access.faculty._id;
  }

  if (query.department || query.semester) {
    const studentFilter = {};
    if (query.department) {
      studentFilter.department = query.department;
    }
    if (query.semester) {
      studentFilter.semester = Number(query.semester);
    }
    const students = await Student.find(studentFilter).select("_id");
    filter.student = { $in: students.map((item) => item._id) };
  }

  const [items, total] = await Promise.all([
    Marks.find(filter)
      .populate({
        path: "student",
        populate: { path: "user", select: "name email" }
      })
      .populate("course", "code title department semester")
      .populate({
        path: "faculty",
        populate: { path: "user", select: "name email" }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Marks.countDocuments(filter)
  ]);

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const getStudentMarks = async (userId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const marks = await Marks.find({ student: student._id })
    .populate("course", "code title department semester")
    .sort({ updatedAt: -1 });

  const averagePercentage =
    marks.length > 0
      ? Number(
          (
            marks.reduce((sum, entry) => sum + Number(entry.percentage || 0), 0) / marks.length
          ).toFixed(2)
        )
      : 0;

  return {
    items: marks,
    summary: {
      totalCourses: marks.length,
      averagePercentage
    }
  };
};

module.exports = {
  upsertMarks,
  listMarks,
  getStudentMarks
};

