// backend/routes/chatRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Mounted at /api/chat in app.js
// All routes require authentication (same JWT middleware as progress routes).
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sendMessage, clearHistory } = require("../controllers/chatController");

router.use(auth);

// POST   /api/chat/:courseId   — send a message
router.post("/:courseId", sendMessage);

// DELETE /api/chat/:courseId   — clear history
router.delete("/:courseId", clearHistory);

module.exports = router;
