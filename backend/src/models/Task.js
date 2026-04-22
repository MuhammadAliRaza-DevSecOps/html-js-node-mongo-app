// ═══════════════════════════════════════════════════════
//  ProTask · Task Model
//  File: backend/src/models/Task.js
// ═══════════════════════════════════════════════════════

"use strict";

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      minlength: [2, "Title must be at least 2 characters."]
    },
    done: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true   // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Task", taskSchema);