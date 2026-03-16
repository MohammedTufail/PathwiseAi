const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

// -----------------------------
// Hardcoded configuration
// -----------------------------
const PORT = 5000;
const MONGO_URI =
  "mongodb://hyderabadwalamohammed_db_user:Hyderabadwala17@ac-2z6ppyt-shard-00-00.x63gaae.mongodb.net:27017,ac-2z6ppyt-shard-00-01.x63gaae.mongodb.net:27017,ac-2z6ppyt-shard-00-02.x63gaae.mongodb.net:27017/?ssl=true&replicaSet=atlas-9l8yhc-shard-0&authSource=admin&appName=Cluster0";
const JWT_SECRET = "supersecretkey123"; // choose a strong secret

app.use(cors());
app.use(express.json());

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
// AI Generate Route
// ===============================
app.post("/api/generate", async (req, res) => {
  try {
    const py = spawn("python", ["backend/learning_system.py"]);

    let data = "";
    let error = "";

    py.stdin.write(JSON.stringify(req.body));
    py.stdin.end();

    py.stdout.on("data", (chunk) => (data += chunk.toString()));
    py.stderr.on("data", (err) => (error += err.toString()));

    py.on("close", (code) => {
      if (error) {
        console.error("Python Error:", error);
        return res.status(500).json({ error });
      }

      try {
        const parsed = JSON.parse(data);
        res.json(parsed);
      } catch {
        res.json({ output: data });
      }
    });
  } catch (err) {
    console.error("Generate Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
