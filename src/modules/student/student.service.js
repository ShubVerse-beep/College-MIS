const bcrypt = require("bcryptjs");
const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const User = require("../user/user.model");
const Student = require("./student.model");
const Faculty = require("../faculty/faculty.model");
const Course = require("../course/course.model");
const { createNotifications } = require("../notification/notification.service");

const studentAggregateBase = (query) => {
  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    }
  ];

  const match = {};

  if (query.department) {
    match.department = query.department;
  }

  if (query.semester) {
    match.semester = Number(query.semester);
  }

  if (Object.keys(match).length) {
    pipeline.push({ $match: match });
  }

  if (query.status === "active") {
    pipeline.push({ $match: { "user.isActive": true } });
  }

  if (query.status === "inactive") {
    pipeline.push({ $match: { "user.isActive": false } });
  }

  if (query.search) {
    pipeline.push({
      $match: {
        $or: [
          { studentId: { $regex: query.search, $options: "i" } },
          { "user.name": { $regex: query.search, $options: "i" } },
          { "user.email": { $regex: query.search, $options: "i" } }
        ]
      }
    });
  }

  return pipeline;
};

const getStudentById = async (id) => {
  const student = await Student.findById(id).populate("user", "name email role isActive createdAt");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

const createStudent = async (payload) => {
  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    role: "student"
  });

  const student = await Student.create({
    user: user._id,
    studentId: payload.studentId,
    department: payload.department,
    semester: payload.semester,
    admissionYear: payload.admissionYear,
    phone: payload.phone || "",
    guardianName: payload.guardianName || "",
    guardianPhone: payload.guardianPhone || "",
    address: payload.address || "",
    dateOfBirth: payload.dateOfBirth || null
  });

  await createNotifications({
    users: [{ _id: user._id, name: user.name, email: user.email }],
    title: "Your student account is ready",
    message: "An administrator created your College MIS student account. Sign in to view your dashboard.",
    type: "account",
    link: "/student/dashboard",
    channels: { inApp: true, email: true }
  });

  return getStudentById(student._id);
};

const listStudents = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const pipeline = studentAggregateBase(query);
  const sortField = query.sortBy === "name" ? "user.name" : query.sortBy || "createdAt";
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [items, totalResult] = await Promise.all([
    Student.aggregate([
      ...pipeline,
      { $sort: { [sortField]: sort[query.sortBy || "createdAt"] || sortDirection } },
      { $skip: skip },
      { $limit: limit }
    ]),
    Student.aggregate([...pipeline, { $count: "total" }])
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const updateStudent = async (id, payload) => {
  const student = await Student.findById(id).populate("user");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (payload.name) {
    student.user.name = payload.name;
  }

  if (payload.email) {
    student.user.email = payload.email.toLowerCase();
  }

  if (typeof payload.isActive === "boolean") {
    student.user.isActive = payload.isActive;
  }

  await student.user.save();

  [
    "studentId",
    "department",
    "semester",
    "admissionYear",
    "phone",
    "guardianName",
    "guardianPhone",
    "address",
    "dateOfBirth"
  ].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      student[field] = payload[field];
    }
  });

  await student.save();
  return getStudentById(id);
};

const deactivateStudent = async (id) => {
  const student = await Student.findById(id).populate("user");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  student.user.isActive = false;
  await student.user.save();

  return getStudentById(id);
};

const getStudentProfileByUser = async (userId) => {
  const student = await Student.findOne({ user: userId }).populate("user", "name email role isActive");

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return student;
};

const updateStudentProfileByUser = async (userId, payload) => {
  const student = await Student.findOne({ user: userId }).populate("user");

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  if (payload.name) {
    student.user.name = payload.name;
    await student.user.save();
  }

  ["phone", "guardianName", "guardianPhone", "address", "dateOfBirth"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      student[field] = payload[field];
    }
  });

  await student.save();
  return getStudentProfileByUser(userId);
};

const getAssignedStudentsForFaculty = async (userId, query) => {
  const faculty = await Faculty.findOne({ user: userId });

  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found");
  }

  const courseFilter = {
    assignedFaculty: faculty._id,
    isActive: true
  };

  if (query.courseId) {
    courseFilter._id = query.courseId;
  }

  const courses = await Course.find(courseFilter).lean();

  if (!courses.length) {
    return [];
  }

  const groups = Array.from(
    new Map(courses.map((course) => [`${course.department}-${course.semester}`, course])).values()
  );

  const orConditions = groups.map((group) => ({
    department: group.department,
    semester: group.semester
  }));

  const students = await Student.find({ $or: orConditions })
    .populate("user", "name email role isActive")
    .sort({ createdAt: -1 });

  if (!query.search) {
    return students;
  }

  const search = query.search.toLowerCase();
  return students.filter((student) => {
    const user = student.user || {};
    return (
      student.studentId.toLowerCase().includes(search) ||
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });
};

module.exports = {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
  getStudentProfileByUser,
  updateStudentProfileByUser,
  getAssignedStudentsForFaculty
};

