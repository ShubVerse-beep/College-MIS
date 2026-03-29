const bcrypt = require("bcryptjs");
const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const User = require("../user/user.model");
const Faculty = require("./faculty.model");
const { createNotifications } = require("../notification/notification.service");

const facultyAggregateBase = (query) => {
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

  if (query.department) {
    pipeline.push({ $match: { department: query.department } });
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
          { employeeId: { $regex: query.search, $options: "i" } },
          { "user.name": { $regex: query.search, $options: "i" } },
          { "user.email": { $regex: query.search, $options: "i" } }
        ]
      }
    });
  }

  return pipeline;
};

const getFacultyById = async (id) => {
  const faculty = await Faculty.findById(id).populate("user", "name email role isActive createdAt");

  if (!faculty) {
    throw new ApiError(404, "Faculty member not found");
  }

  return faculty;
};

const createFaculty = async (payload) => {
  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    role: "faculty"
  });

  const faculty = await Faculty.create({
    user: user._id,
    employeeId: payload.employeeId,
    department: payload.department,
    designation: payload.designation || "",
    qualification: payload.qualification || "",
    phone: payload.phone || ""
  });

  await createNotifications({
    users: [{ _id: user._id, name: user.name, email: user.email }],
    title: "Your faculty account is ready",
    message: "An administrator created your College MIS faculty account. Sign in to manage classes, attendance, and marks.",
    type: "account",
    link: "/faculty/dashboard",
    channels: { inApp: true, email: true }
  });

  return getFacultyById(faculty._id);
};

const listFaculty = async (query) => {
  const { page, limit, skip, sort } = getPagination(query);
  const pipeline = facultyAggregateBase(query);
  const sortField = query.sortBy === "name" ? "user.name" : query.sortBy || "createdAt";
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [items, totalResult] = await Promise.all([
    Faculty.aggregate([
      ...pipeline,
      { $sort: { [sortField]: sort[query.sortBy || "createdAt"] || sortDirection } },
      { $skip: skip },
      { $limit: limit }
    ]),
    Faculty.aggregate([...pipeline, { $count: "total" }])
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const updateFaculty = async (id, payload) => {
  const faculty = await Faculty.findById(id).populate("user");

  if (!faculty) {
    throw new ApiError(404, "Faculty member not found");
  }

  if (payload.name) {
    faculty.user.name = payload.name;
  }

  if (payload.email) {
    faculty.user.email = payload.email.toLowerCase();
  }

  if (typeof payload.isActive === "boolean") {
    faculty.user.isActive = payload.isActive;
  }

  await faculty.user.save();

  ["employeeId", "department", "designation", "qualification", "phone"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      faculty[field] = payload[field];
    }
  });

  await faculty.save();
  return getFacultyById(id);
};

const deactivateFaculty = async (id) => {
  const faculty = await Faculty.findById(id).populate("user");

  if (!faculty) {
    throw new ApiError(404, "Faculty member not found");
  }

  faculty.user.isActive = false;
  await faculty.user.save();

  return getFacultyById(id);
};

const getFacultyProfileByUser = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId }).populate("user", "name email role isActive");

  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found");
  }

  return faculty;
};

module.exports = {
  createFaculty,
  listFaculty,
  getFacultyById,
  updateFaculty,
  deactivateFaculty,
  getFacultyProfileByUser
};

