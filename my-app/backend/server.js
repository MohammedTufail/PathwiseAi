require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();
const progressRoutes = require("./routes/progressRoutes");
const chatRoutes = require("./routes/chatRoutes");

// -----------------------------
// Hardcoded configuration
// -----------------------------
const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET; // choose a strong secret

app.use(cors());
app.use(express.json());
app.use("/api/chat", require("./routes/chatRoutes"));
// ===============================
// MongoDB Connection
// ===============================
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected ✅");
    console.log("Mongo URI:", MONGO_URI);
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
}

connectDB();
mongoose.set("debug", true); // optional: logs all queries

app.use("/api/chat", chatRoutes); // NEW

app.use("/api/progress", progressRoutes);

// ===============================
// Health Check
// ===============================
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// ===============================
// SIGNUP
// ===============================
app.post("/api/signup", async (req, res) => {
  console.log("Signup request received:", req.body);
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ message: "Signup successful ✅" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// LOGIN
// ===============================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful ✅",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Middleware: Auth routes
// ===============================
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.status(401).json({ message: "No token, unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ===============================
// AI Generate Route (Flask)
// ===============================
app.post("/api/generate", authMiddleware, async (req, res) => {
  try {
    const response = await fetch("http://localhost:5001/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      console.error(" Invalid JSON from Flask:", text);
      res.status(500).json({
        error: "Invalid response from AI server",
      });
    }
  } catch (err) {
    console.error("Generate Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Quiz Route (Flask)
// ===============================
app.post("/api/generate-quiz", authMiddleware, async (req, res) => {
  try {
    const response = await fetch("http://localhost:5001/api/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      console.error(" Invalid JSON from Flask:", text);
      res.status(500).json({
        error: "Invalid response from AI server",
      });
    }
  } catch (err) {
    console.error("Quiz Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Protected Test Route
// ===============================
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
