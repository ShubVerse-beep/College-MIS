const ApiError = require("../../utils/ApiError");
const { getPagination, getPaginationMeta } = require("../../utils/pagination");
const Timetable = require("./timetable.model");
const Course = require("../course/course.model");
const Faculty = require("../faculty/faculty.model");
const Student = require("../student/student.model");
const { createNotifications, getUsersForAudience } = require("../notification/notification.service");

const timeToMinutes = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const slotsOverlap = (slotA, slotB) =>
  slotA.dayOfWeek === slotB.dayOfWeek &&
  timeToMinutes(slotA.startTime) < timeToMinutes(slotB.endTime) &&
  timeToMinutes(slotB.startTime) < timeToMinutes(slotA.endTime);

const validateSlots = async (slots, department, semester) => {
  for (const slot of slots) {
    if (timeToMinutes(slot.startTime) >= timeToMinutes(slot.endTime)) {
      throw new ApiError(400, "Every timetable slot must have an end time after its start time");
    }

    const course = await Course.findById(slot.course);

    if (!course || !course.isActive) {
      throw new ApiError(404, "One or more timetable courses do not exist");
    }

    if (course.department !== department || course.semester !== semester) {
      throw new ApiError(400, "Timetable slots must use courses from the selected department and semester");
    }

    if (!course.assignedFaculty || course.assignedFaculty.toString() !== slot.faculty) {
      throw new ApiError(400, "Each timetable slot must use the faculty assigned to its course");
    }

    if (slot.department !== department || slot.semester !== semester) {
      throw new ApiError(400, "Every slot must match the timetable department and semester");
    }
  }

  for (let index = 0; index < slots.length; index += 1) {
    for (let innerIndex = index + 1; innerIndex < slots.length; innerIndex += 1) {
      const slotA = slots[index];
      const slotB = slots[innerIndex];

      if (!slotsOverlap(slotA, slotB)) {
        continue;
      }

      if (
        slotA.faculty === slotB.faculty ||
        slotA.room === slotB.room ||
        (slotA.department === slotB.department && slotA.semester === slotB.semester)
      ) {
        throw new ApiError(400, "Timetable contains overlapping slots");
      }
    }
  }
};

const populateTimetable = (query) =>
  query.populate([
    { path: "slots.course", select: "code title department semester" },
    {
      path: "slots.faculty",
      populate: { path: "user", select: "name email" }
    }
  ]);

const notifyTimetableAudience = async (timetable, actionLabel) => {
  const users = await getUsersForAudience({
    audienceType: "group",
    department: timetable.department,
    semester: timetable.semester
  });

  await createNotifications({
    users,
    title: `Timetable ${actionLabel}`,
    message: `The ${timetable.department} semester ${timetable.semester} timetable for ${timetable.academicYear} has been ${actionLabel}.`,
    type: "timetable",
    link: "/timetable",
    channels: { inApp: true, email: true },
    metadata: {
      timetableId: timetable._id.toString(),
      academicYear: timetable.academicYear
    }
  });
};

const getTimetableByIdForAdmin = async (id) => {
  const timetable = await populateTimetable(Timetable.findById(id));

  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  return timetable;
};

const createTimetable = async (payload) => {
  await validateSlots(payload.slots, payload.department, payload.semester);

  const timetable = await Timetable.create(payload);
  const populated = await getTimetableByIdForAdmin(timetable._id);

  if (populated.status === "published") {
    await notifyTimetableAudience(populated, "published");
  }

  return populated;
};

const updateTimetable = async (id, payload) => {
  const timetable = await Timetable.findById(id);

  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  const nextState = {
    academicYear: payload.academicYear || timetable.academicYear,
    department: payload.department || timetable.department,
    semester: payload.semester || timetable.semester,
    status: payload.status || timetable.status,
    slots: payload.slots || timetable.slots
  };

  await validateSlots(nextState.slots, nextState.department, nextState.semester);

  Object.assign(timetable, nextState);
  await timetable.save();

  const populated = await getTimetableByIdForAdmin(id);

  if (populated.status === "published") {
    await notifyTimetableAudience(populated, "updated");
  }

  return populated;
};

const publishTimetable = async (id) => {
  const timetable = await Timetable.findByIdAndUpdate(
    id,
    { status: "published" },
    { new: true }
  );

  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  const populated = await getTimetableByIdForAdmin(id);
  await notifyTimetableAudience(populated, "published");
  return populated;
};

const listTimetables = async (user, query) => {
  const { page, limit, skip } = getPagination(query);

  if (user.role === "admin") {
    const filter = {};

    if (query.academicYear) filter.academicYear = query.academicYear;
    if (query.department) filter.department = query.department;
    if (query.semester) filter.semester = Number(query.semester);
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      populateTimetable(
        Timetable.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit)
      ),
      Timetable.countDocuments(filter)
    ]);

    return {
      items,
      meta: getPaginationMeta(page, limit, total)
    };
  }

  if (user.role === "faculty") {
    const faculty = await Faculty.findOne({ user: user._id });

    if (!faculty) {
      throw new ApiError(404, "Faculty profile not found");
    }

    const timetables = await populateTimetable(
      Timetable.find({ "slots.faculty": faculty._id }).sort({ updatedAt: -1 })
    );

    const items = timetables.map((timetable) => ({
      ...timetable.toObject(),
      slots: timetable.slots.filter(
        (slot) => slot.faculty?._id?.toString() === faculty._id.toString()
      )
    }));

    return {
      items,
      meta: getPaginationMeta(1, items.length || 1, items.length)
    };
  }

  const student = await Student.findOne({ user: user._id });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const timetables = await populateTimetable(
    Timetable.find({
      department: student.department,
      semester: student.semester,
      status: "published",
      ...(query.academicYear ? { academicYear: query.academicYear } : {})
    }).sort({ updatedAt: -1 })
  );

  return {
    items: timetables,
    meta: getPaginationMeta(1, timetables.length || 1, timetables.length)
  };
};

const getTimetableById = async (user, id) => {
  const timetable = await getTimetableByIdForAdmin(id);

  if (user.role === "admin") {
    return timetable;
  }

  if (user.role === "faculty") {
    const faculty = await Faculty.findOne({ user: user._id });

    if (!faculty) {
      throw new ApiError(404, "Faculty profile not found");
    }

    const slots = timetable.slots.filter(
      (slot) => slot.faculty?._id?.toString() === faculty._id.toString()
    );

    if (!slots.length) {
      throw new ApiError(403, "You do not have access to this timetable");
    }

    return {
      ...timetable.toObject(),
      slots
    };
  }

  const student = await Student.findOne({ user: user._id });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  if (
    timetable.department !== student.department ||
    timetable.semester !== student.semester ||
    timetable.status !== "published"
  ) {
    throw new ApiError(403, "You do not have access to this timetable");
  }

  return timetable;
};

const deleteTimetable = async (id) => {
  const timetable = await Timetable.findByIdAndDelete(id);

  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  return timetable;
};

module.exports = {
  createTimetable,
  updateTimetable,
  publishTimetable,
  listTimetables,
  getTimetableById,
  deleteTimetable
};

