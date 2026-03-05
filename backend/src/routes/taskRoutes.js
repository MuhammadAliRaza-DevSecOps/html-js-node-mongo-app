const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

// Health
router.get("/health", (req, res) => {
  res.json({ ok: true, service: "backend", time: new Date().toISOString() });
});

// Get all
router.get("/tasks", async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});

// Create
router.post("/tasks", async (req, res) => {
  const { title } = req.body || {};
  if (!title || title.trim().length < 2) {
    return res.status(400).json({ error: "Title required (min 2 chars)" });
  }
  const t = await Task.create({ title: title.trim() });
  res.status(201).json(t);
});

// Toggle
router.patch("/tasks/:id/toggle", async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  t.done = !t.done;
  await t.save();
  res.json(t);
});

// Delete
router.delete("/tasks/:id", async (req, res) => {
  const r = await Task.deleteOne({ _id: req.params.id });
  res.json({ deleted: r.deletedCount === 1 });
});

module.exports = router;