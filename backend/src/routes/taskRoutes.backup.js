const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("GET /tasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({
        error: "Title must be at least 2 characters long."
      });
    }

    const newTask = await Task.create({
      title: title.trim(),
      done: false
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("POST /tasks error:", error);
    res.status(500).json({ error: "Failed to create task." });
  }
});

router.patch("/tasks/:id/toggle", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    task.done = !task.done;
    await task.save();

    res.json(task);
  } catch (error) {
    console.error("PATCH /tasks/:id/toggle error:", error);
    res.status(500).json({ error: "Failed to toggle task." });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("DELETE /tasks/:id error:", error);
    res.status(500).json({ error: "Failed to delete task." });
  }
});

module.exports = router;