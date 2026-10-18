const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/coaches — Get all coaches
// Optional: /api/coaches?status=active or ?status=retired
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        id,
        name,
        role,
        contact,
        is_active,
        photo_url
      FROM coaches
    `;

    const values = [];

    if (status === "active") {
      query += " WHERE is_active = TRUE";
    } else if (status === "retired") {
      query += " WHERE is_active = FALSE";
    }

    query += " ORDER BY name ASC";

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch coaches error:", error);
    res.status(500).json({ message: "Failed to fetch coaches" });
  }
});

// GET /api/coaches/:id — Get one coach
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, role, contact, is_active, photo_url
       FROM coaches
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Coach not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch coach error:", error);
    res.status(500).json({ message: "Failed to fetch coach" });
  }
});

// POST /api/coaches — Add a coach (Admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      role,
      contact,
      is_active = true,
      photo_url,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Coach name is required" });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        message: "is_active must be true or false",
      });
    }

    const result = await pool.query(
      `INSERT INTO coaches
        (name, role, contact, is_active, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, role, contact, is_active, photo_url`,
      [
        name.trim(),
        role || null,
        contact || null,
        is_active,
        finalPhotoUrl,
      ]
    );

    res.status(201).json({
      message: "Coach added successfully",
      coach: result.rows[0],
    });
  } catch (error) {
    console.error("Add coach error:", error);
    res.status(500).json({ message: "Failed to add coach" });
  }
});

// PUT /api/coaches/:id — Update a coach (Admin only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, contact, is_active, photo_url } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Coach name is required" });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        message: "is_active must be true or false",
      });
    }

    const result = await pool.query(
      `UPDATE coaches
       SET name = $1,
           role = $2,
           contact = $3,
           is_active = $4,
           photo_url = $5
       WHERE id = $6
       RETURNING id, name, role, contact, is_active, photo_url`,
      [
        name.trim(),
        role || null,
        contact || null,
        is_active,
        finalPhotoUrl,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Coach not found" });
    }

    res.json({
      message: "Coach updated successfully",
      coach: result.rows[0],
    });
  } catch (error) {
    console.error("Update coach error:", error);
    res.status(500).json({ message: "Failed to update coach" });
  }
});

// DELETE /api/coaches/:id — Delete a coach (Admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM coaches WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Coach not found" });
    }

    res.json({ message: "Coach deleted successfully" });
  } catch (error) {
    console.error("Delete coach error:", error);
    res.status(500).json({ message: "Failed to delete coach" });
  }
});

module.exports = router;