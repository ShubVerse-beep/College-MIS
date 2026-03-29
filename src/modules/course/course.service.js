const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const Course = require("./course.model");
const Student = require("../student/student.model");
const Faculty = require("../faculty/faculty.model");
const { createNotifications } = require("../notification/notification.service");

const findFacultyByUserId = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId });

  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found");
  }

  return faculty;
};

const getCourseById = async (id) => {
  const course = await Course.findById(id).populate({
    path: "assignedFaculty",
    populate: {
      path: "user",
      select: "name email"
    }
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return course;
};

const sendCourseAssignmentNotification = async (facultyId, course) => {
  if (!facultyId) {
    return;
  }

  const faculty = await Faculty.findById(facultyId).populate("user", "name email");

  if (!faculty?.user) {
    return;
  }

  await createNotifications({
    users: [{ _id: faculty.user._id, name: faculty.user.name, email: faculty.user.email }],
    title: "New course assignment",
    message: `You have been assigned to ${course.title} (${course.code}).`,
    type: "course",
    link: "/faculty/courses",
    channels: { inApp: true, email: true },
    metadata: {
      courseId: course._id.toString()
    }
  });
};

const createCourse = async (payload) => {
  if (payload.assignedFaculty) {
    const assignedFaculty = await Faculty.findById(payload.assignedFaculty);

    if (!assignedFaculty) {
      throw new ApiError(404, "Assigned faculty not found");
    }
  }

  const course = await Course.create({
    ...payload,
    assignedFaculty: payload.assignedFaculty || null
  });

  if (course.assignedFaculty) {
    await sendCourseAssignmentNotification(course.assignedFaculty, course);
  }

  return getCourseById(course._id);
};

const listCourses = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};

  if (query.department) {
    filter.department = query.department;
  }

  if (query.semester) {
    filter.semester = Number(query.semester);
  }

  if (query.status === "active") {
    filter.isActive = true;
  }

  if (query.status === "inactive") {
    filter.isActive = false;
  }

  if (query.search) {
    filter.$or = [
      { code: { $regex: query.search, $options: "i" } },
      { title: { $regex: query.search, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate({
        path: "assignedFaculty",
        populate: { path: "user", select: "name email" }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter)
  ]);

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const updateCourse = async (id, payload) => {
  const course = await Course.findById(id);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (payload.assignedFaculty) {
    const assignedFaculty = await Faculty.findById(payload.assignedFaculty);

    if (!assignedFaculty) {
      throw new ApiError(404, "Assigned faculty not found");
    }
  }

  const previousFacultyId = course.assignedFaculty?.toString() || null;
  Object.keys(payload).forEach((field) => {
    if (payload[field] !== undefined) {
      course[field] = payload[field] === "" ? null : payload[field];
    }
  });
  await course.save();

  if (course.assignedFaculty && course.assignedFaculty.toString() !== previousFacultyId) {
    await sendCourseAssignmentNotification(course.assignedFaculty, course);
  }

  return getCourseById(id);
};

const deactivateCourse = async (id) => {
  const course = await Course.findByIdAndUpdate(id, { isActive: false }, { new: true });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return getCourseById(id);
};

const getAssignedCoursesForFaculty = async (userId) => {
  const faculty = await findFacultyByUserId(userId);
  return Course.find({ assignedFaculty: faculty._id, isActive: true }).populate({
    path: "assignedFaculty",
    populate: { path: "user", select: "name email" }
  });
};

const getCoursesForStudent = async (userId) => {
  const student = await Student.findOne({ user: userId });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return Course.find({
    department: student.department,
    semester: student.semester,
    isActive: true
  }).populate({
    path: "assignedFaculty",
    populate: { path: "user", select: "name email" }
  });
};

const getEligibleStudentsForCourse = async (courseId) => {
  const course = await Course.findById(courseId);

  if (!course || !course.isActive) {
    throw new ApiError(404, "Course not found");
  }

  const students = await Student.find({
    department: course.department,
    semester: course.semester
  }).populate("user", "name email isActive");

  return {
    course,
    students
  };
};

const resolveCourseAccess = async (user, courseId) => {
  const course = await Course.findById(courseId);

  if (!course || !course.isActive) {
    throw new ApiError(404, "Course not found");
  }

  if (user.role === "admin") {
    return {
      course,
      faculty: course.assignedFaculty ? await Faculty.findById(course.assignedFaculty) : null
    };
  }

  if (user.role === "faculty") {
    const faculty = await findFacultyByUserId(user._id);

    if (!course.assignedFaculty || course.assignedFaculty.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only manage assigned courses");
    }

    return {
      course,
      faculty
    };
  }

  const student = await Student.findOne({ user: user._id });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  if (student.department !== course.department || student.semester !== course.semester) {
    throw new ApiError(403, "You do not have access to this course");
  }

  return {
    course,
    student
  };
};

module.exports = {
  createCourse,
  listCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  getAssignedCoursesForFaculty,
  getCoursesForStudent,
  getEligibleStudentsForCourse,
  resolveCourseAccess,
  findFacultyByUserId
};

