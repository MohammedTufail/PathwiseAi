// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  // Password is optional now for Google users
  password: {
    type: String,
    required: function () {
      return this.provider !== "google";
    },
  },

  provider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },

  picture: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
