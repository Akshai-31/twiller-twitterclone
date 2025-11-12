const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic user info
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // Profile related
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    dob: {
      type: String, // stored as "YYYY-MM-DD" from input type="date"
      default: "",
    },

    // Images
    profileImage: {
      type: String, // profile picture URL
      default: "",
    },
    coverimage: {
      type: String, // cover photo URL
      default: "",
    },

    // Account meta
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
