const express = require("express");
const pool = require("../config/db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Retrieve all sports fests
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM sports_fests
      ORDER BY year DESC, name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sports fests:", error);
    res.status(500).json({ message: "Failed to fetch sports fests." });
  }
});

// GET: Retrieve one sports fest
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sports_fests WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sports fest not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching sports fest:", error);
    res.status(500).json({ message: "Failed to fetch sports fest." });
  }
});

// POST: Create a sports fest (admin only)
router.post(
  "/",
  authenticateAdmin,
  async (req, res) => {
  const {
    name,
    year,
    location,
    start_date,
    end_date,
    description,
  } = req.body;

  if (!name || !Number.isInteger(Number(year))) {
    return res.status(400).json({
      message: "A sports fest name and valid year are required.",
    });
  }

  const festYear = Number(year);

  if (festYear < 1900 || festYear > 2100) {
    return res.status(400).json({ message: "Invalid sports fest year." });
  }

  if (start_date && end_date && start_date > end_date) {
    return res.status(400).json({
      message: "End date cannot be earlier than start date.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sports_fests
        (name, year, location, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        festYear,
        location || null,
        start_date || null,
        end_date || null,
        description || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This sports fest already exists for that year.",
      });
    }

    console.error("Error creating sports fest:", error);
    res.status(500).json({ message: "Failed to create sports fest." });
  }
});

// DELETE: Delete a sports fest (admin only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM sports_fests WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sports fest not found." });
    }

    res.json({ message: "Sports fest deleted successfully." });
  } catch (error) {
    console.error("Error deleting sports fest:", error);
    res.status(500).json({ message: "Failed to delete sports fest." });
  }
});

module.exports = router;