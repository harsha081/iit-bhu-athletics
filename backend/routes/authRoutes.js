const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

// Create the first admin account
router.post("/setup", async (req, res) => {
  const { username, password, setupKey } = req.body;

  if (!process.env.ADMIN_SETUP_KEY ||
      setupKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ message: "Invalid setup key" });
  }

  if (!username?.trim() || !password || password.length < 12) {
    return res.status(400).json({
      message: "Username is required and password must be at least 12 characters",
    });
  }

  try {
    const existing = await pool.query("SELECT id FROM admins LIMIT 1");

    if (existing.rowCount > 0) {
      return res.status(403).json({
        message: "Admin setup is already complete",
      });
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO admins (username, password_hash) VALUES ($1, $2)",
      [username.trim(), hash]
    );

    res.status(201).json({ message: "Admin account created successfully" });
  } catch (error) {
    console.error("Admin setup error:", error.message);
    res.status(500).json({ message: "Unable to create admin account" });
  }
});

// Admin login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM admins WHERE username = $1",
      [username.trim()]
    );

    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: admin.id, role: "admin", username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
});

// Change the password of the existing first admin
router.put("/change-password", async (req, res) => {
  const { username, newPassword, setupKey } = req.body;

  if (
    !process.env.ADMIN_SETUP_KEY ||
    setupKey !== process.env.ADMIN_SETUP_KEY
  ) {
    return res.status(403).json({ message: "Invalid setup key" });
  }

  if (
    typeof username !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 12
  ) {
    return res.status(400).json({
      message: "Username is required and password must be at least 12 characters",
    });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 12);

    const result = await pool.query(
      `UPDATE admins
       SET password_hash = $1
       WHERE username = $2
       RETURNING id, username`,
      [hash, username.trim()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error.message);
    res.status(500).json({ message: "Unable to update password" });
  }
});

module.exports = router;