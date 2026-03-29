const mongoose = require("mongoose");

const timetableSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    },
    department: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      required: true
    }
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },
    slots: [timetableSlotSchema]
  },
  {
    timestamps: true
  }
);

timetableSchema.index({ academicYear: 1, department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);

