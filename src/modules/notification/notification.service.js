const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const { sendEmail, isEmailConfigured } = require("../../utils/email");
const User = require("../user/user.model");
const Student = require("../student/student.model");
const Faculty = require("../faculty/faculty.model");
const Course = require("../course/course.model");
const Announcement = require("./announcement.model");
const Notification = require("./notification.model");

const getUsersForAudience = async ({ audienceType, targetRole, department, semester }) => {
  if (audienceType === "all") {
    return User.find({ isActive: true }).select("_id name email role").lean();
  }

  if (audienceType === "role") {
    return User.find({ isActive: true, role: targetRole }).select("_id name email role").lean();
  }

  if (!department || !semester) {
    throw new ApiError(400, "Department and semester are required for group audiences");
  }

  const users = [];

  if (!targetRole || targetRole === "student") {
    const students = await Student.find({ department, semester }).populate({
      path: "user",
      select: "_id name email role isActive"
    });

    students.forEach((student) => {
      if (student.user?.isActive) {
        users.push({
          _id: student.user._id,
          name: student.user.name,
          email: student.user.email,
          role: student.user.role
        });
      }
    });
  }

  if (!targetRole || targetRole === "faculty") {
    const facultyList = await Faculty.find({ department }).populate({
      path: "user",
      select: "_id name email role isActive"
    });

    facultyList.forEach((faculty) => {
      if (faculty.user?.isActive) {
        users.push({
          _id: faculty.user._id,
          name: faculty.user.name,
          email: faculty.user.email,
          role: faculty.user.role
        });
      }
    });
  }

  if (targetRole === "admin") {
    const admins = await User.find({ role: "admin", isActive: true }).select("_id name email role").lean();
    users.push(...admins);
  }

  const uniqueMap = new Map();
  users.forEach((user) => uniqueMap.set(user._id.toString(), user));
  return Array.from(uniqueMap.values());
};

const createNotifications = async ({
  users,
  title,
  message,
  type = "system",
  link = "",
  channels = { inApp: true, email: false },
  metadata = {},
  announcementId = null
}) => {
  if (!users.length) {
    return [];
  }

  const notifications = await Notification.insertMany(
    users.map((user) => ({
      recipient: user._id,
      announcement: announcementId,
      title,
      message,
      type,
      link,
      channels,
      emailStatus: channels.email && isEmailConfigured() ? "pending" : "skipped",
      metadata
    }))
  );

  if (channels.email) {
    for (const notification of notifications) {
      const user = users.find(
        (candidate) => candidate._id.toString() === notification.recipient.toString()
      );

      if (!user?.email) {
        notification.emailStatus = "skipped";
        await notification.save();
        continue;
      }

      try {
        const emailResult = await sendEmail({
          to: user.email,
          subject: title,
          text: `${message}\n\nOpen College MIS to view more details.`,
          html: `<p>${message}</p><p>Open College MIS to view more details.</p>`
        });
        notification.emailStatus = emailResult.status;
        await notification.save();
      } catch (_error) {
        notification.emailStatus = "failed";
        await notification.save();
      }
    }
  }

  return notifications;
};

const assertFacultyAnnouncementScope = async (userId, payload) => {
  if (payload.audienceType !== "group" || payload.targetRole !== "student") {
    throw new ApiError(
      403,
      "Faculty announcements are limited to student groups tied to assigned courses"
    );
  }

  const faculty = await Faculty.findOne({ user: userId });

  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found");
  }

  const hasAssignedCourse = await Course.exists({
    assignedFaculty: faculty._id,
    department: payload.department,
    semester: payload.semester,
    isActive: true
  });

  if (!hasAssignedCourse) {
    throw new ApiError(403, "You can only notify student groups for your assigned courses");
  }
};

const createAnnouncement = async (user, payload) => {
  if (user.role === "faculty") {
    await assertFacultyAnnouncementScope(user._id, payload);
  }

  const announcement = await Announcement.create({
    ...payload,
    targetRole: payload.targetRole || null,
    createdBy: user._id
  });

  const users = await getUsersForAudience(payload);

  await createNotifications({
    users,
    title: payload.title,
    message: payload.message,
    type: "announcement",
    link: "/notifications",
    channels: payload.channels,
    metadata: {
      audienceType: payload.audienceType,
      targetRole: payload.targetRole || null,
      department: payload.department || "",
      semester: payload.semester || null
    },
    announcementId: announcement._id
  });

  return announcement.populate("createdBy", "name email role");
};

const listAnnouncements = async (user, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = user.role === "admin" ? {} : { createdBy: user._id };
  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Announcement.countDocuments(filter)
  ]);

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const listNotifications = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { recipient: userId };

  if (query.type) {
    filter.type = query.type;
  }

  if (typeof query.isRead === "boolean") {
    filter.isRead = query.isRead;
  }

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter)
  ]);

  return {
    items,
    meta: getPaginationMeta(page, limit, total)
  };
};

const markAsRead = async (userId, id) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });

  return {
    unreadCount
  };
};

module.exports = {
  getUsersForAudience,
  createNotifications,
  createAnnouncement,
  listAnnouncements,
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};

