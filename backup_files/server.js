const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let tasks = [];

app.get("/api/health", (req, res) => {
  res.json({ message: "API is running." });
});

app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || title.trim().length < 2) {
    return res.status(400).json({ error: "Title must be at least 2 characters long." });
  }

  const task = {
    _id: Date.now().toString(),
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id/toggle", (req, res) => {
  const task = tasks.find(t => t._id === req.params.id);

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.done = !task.done;
  res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex(t => t._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  tasks.splice(index, 1);
  res.json({ message: "Task deleted successfully." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});