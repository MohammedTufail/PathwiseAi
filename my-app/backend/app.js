// app.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point for the Express server.
// Mount your existing quiz route (/generate-quiz) alongside the new
// progress routes (/api/progress).
// ─────────────────────────────────────────────────────────────────────────────
/*
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const progressRoutes = require("./routes/progressRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["https://pathwise-ai-blue.vercel.app", "http://localhost:5173"],
  }),
);
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Progress tracking (NEW)
app.use("/api/progress", progressRoutes);

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/pathwiseai")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
*/