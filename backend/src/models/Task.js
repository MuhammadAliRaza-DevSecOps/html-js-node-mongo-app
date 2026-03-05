const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    done: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);