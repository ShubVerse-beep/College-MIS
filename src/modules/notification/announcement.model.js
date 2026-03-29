const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    audienceType: {
      type: String,
      enum: ["all", "role", "group"],
      required: true
    },
    targetRole: {
      type: String,
      enum: ["admin", "faculty", "student", null],
      default: null
    },
    department: {
      type: String,
      default: ""
    },
    semester: {
      type: Number,
      default: null
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Announcement", announcementSchema);

