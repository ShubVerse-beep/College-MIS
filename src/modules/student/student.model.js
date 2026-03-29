const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    admissionYear: {
      type: Number,
      required: true
    },
    phone: {
      type: String,
      default: ""
    },
    guardianName: {
      type: String,
      default: ""
    },
    guardianPhone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    dateOfBirth: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Student", studentSchema);

