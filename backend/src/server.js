// ═══════════════════════════════════════════════════════
//  ProTask · Backend Server
//  Entry point: backend/src/server.js
//  Start command: node src/server.js  (from backend/ folder)
// ═══════════════════════════════════════════════════════

"use strict";

require("dotenv").config();                      // loads .env from backend/ root

const express  = require("express");
const cors     = require("cors");
const morgan   = require("morgan");
const mongoose = require("mongoose");

const taskRoutes = require("./routes/taskRoutes"); // relative to THIS file

// ── Config ───────────────────────────────────────────────
const PORT       = process.env.PORT       || 5000;
const MONGO_URI  = process.env.MONGO_URI  || "mongodb://localhost:27017/appdb";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ── App ──────────────────────────────────────────────────
const app = express();

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(morgan("dev"));

// ── Health check (no auth, no DB needed) ─────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ProTask API is running.",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ── Task routes — mounted at /api ─────────────────────────
// taskRoutes defines: GET /tasks, POST /tasks,
//                     PATCH /tasks/:id/toggle, DELETE /tasks/:id
app.use("/api", taskRoutes);

// ── 404 fallback ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global error handler ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// ── MongoDB connect → then start server ──────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅  MongoDB connected: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
      console.log(`🩺  Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);   // fail fast so Docker restarts the container
  });