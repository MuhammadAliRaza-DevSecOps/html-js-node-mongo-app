// ═══════════════════════════════════════════════════════
//  ProTask · Task Routes
//  File: backend/src/routes/taskRoutes.js
//
//  Mounted at /api in server.js, so final URLs are:
//    GET    /api/tasks
//    POST   /api/tasks
//    PATCH  /api/tasks/:id/toggle
//    DELETE /api/tasks/:id
// ═══════════════════════════════════════════════════════

"use strict";

const express = require("express");
const Task    = require("../models/Task");   // relative: routes/ → models/

const router = express.Router();

// ── GET /api/tasks ───────────────────────────────────────
router.get("/tasks", async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("GET /tasks error:", err);
    next(err);
  }
});

// ── POST /api/tasks ──────────────────────────────────────
router.post("/tasks", async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({
        error: "Title must be at least 2 characters long."
      });
    }

    const task = await Task.create({ title: title.trim(), done: false });
    res.status(201).json(task);
  } catch (err) {
    console.error("POST /tasks error:", err);
    next(err);
  }
});

// ── PATCH /api/tasks/:id/toggle ──────────────────────────
router.patch("/tasks/:id/toggle", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    task.done = !task.done;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error("PATCH /tasks/:id/toggle error:", err);
    next(err);
  }
});

// ── DELETE /api/tasks/:id ────────────────────────────────
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("DELETE /tasks/:id error:", err);
    next(err);
  }
});

module.exports = router;