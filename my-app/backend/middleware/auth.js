// middleware/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// Verifies a JWT from the Authorization header and attaches userId to req.
// Replace JWT_SECRET with your env variable.
//
// Expected header:  Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config({ path: "backend/.env" });

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId || decoded.id || decoded._id;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
