const mongoose = require("mongoose");
const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    rollNo: {
      type: Number,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    motherName: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    parentPhone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: String,
      required: true,
      enum: ["b.tech", "m.tech", "b.com", "m.com", "bba", "mba"],
      lowercase: true,
    },

    branch: {
      type: String,
      trim: true,
    },

    year: {
      type: Number,
      min: 1,
      max: 4,
    },

    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 4
    },

    admissionDate: {
      type: Date,
      default: Date.now,
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    photo: {
      type: [String],
      default: [],
    },

    avgCGPA: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },

    joinedClub: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("student", studentSchema);