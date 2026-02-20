/*const express = require("express");
const cors = require("cors");
require("dotenv").config();
const CompleteLearningSystem = require("./learningSystem");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

app.post("/api/generate", async (req, res) => {
  const system = new CompleteLearningSystem();
  const result = await system.createCompleteGuide(req.body);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
*/

const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ===============================
   Health Check Route
================================ */
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

/* ===============================
   AI Generate Route
================================ */
app.post("/api/generate", async (req, res) => {
  try {
    // Start Python process
    const py = spawn("python", ["backend/learning_system.py"]);

    let data = "";
    let error = "";

    // Send JSON input to Python
    py.stdin.write(JSON.stringify(req.body));
    py.stdin.end();

    // Capture Python output
    py.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    // Capture Python errors
    py.stderr.on("data", (err) => {
      error += err.toString();
    });

    // When Python finishes
    py.on("close", (code) => {
      if (error) {
        console.error("Python Error:", error);
        return res.status(500).json({ error });
      }

      try {
        const parsed = JSON.parse(data);
        res.json(parsed);
      } catch {
        // If Python returned plain text
        res.json({ output: data });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   Start Server
================================ */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});