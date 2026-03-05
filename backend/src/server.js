require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

app.use("/api", taskRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`✅ Backend running on port ${port}`));
  } catch (e) {
    console.error("❌ Startup error:", e);
    process.exit(1);
  }
}

start();