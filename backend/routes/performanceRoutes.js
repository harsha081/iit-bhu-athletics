const express = require("express");
const pool = require("../config/db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Retrieve all performances
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.result,
        p.record_date,
        p.competition,
        p.medal,
        p.position,
        a.id AS athlete_id,
        a.name AS athlete_name,
        a.gender AS athlete_gender,
        e.id AS event_id,
        e.name AS event_name,
        e.category AS event_category,
        e.gender AS event_gender,
        sf.id AS sports_fest_id,
        sf.name AS sports_fest_name,
        sf.year AS sports_fest_year
      FROM performances p
      LEFT JOIN athletes a ON a.id = p.athlete_id
      LEFT JOIN events e ON e.id = p.event_id
      LEFT JOIN sports_fests sf ON sf.id = p.sports_fest_id
      ORDER BY sf.year DESC NULLS LAST, p.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching performances:", error);
    res.status(500).json({
      message: "Failed to fetch performances.",
    });
  }
});

// POST: Create a performance (admin only)
router.post(
  "/",
  authenticateAdmin,
  async (req, res) => {
  const {
    athlete_id,
    event_id,
    sports_fest_id,
    result: performanceResult,
    record_date,
    competition,
    medal,
    position,
  } = req.body;

  const athleteId = Number(athlete_id);
  const eventId = Number(event_id);
  const festId = Number(sports_fest_id);
  const numericResult = Number(performanceResult);

  if (
    !Number.isInteger(athleteId) ||
    athleteId <= 0 ||
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(festId) ||
    festId <= 0 ||
    performanceResult === "" ||
    performanceResult === null ||
    performanceResult === undefined ||
    !Number.isFinite(numericResult) ||
    numericResult < 0
  ) {
    return res.status(400).json({
      message:
        "Select a valid athlete, event, sports fest, and non-negative result.",
    });
  }

  const parsedPosition =
    position === "" || position === null || position === undefined
      ? null
      : Number(position);

  if (
    parsedPosition !== null &&
    (!Number.isInteger(parsedPosition) || parsedPosition < 1)
  ) {
    return res.status(400).json({
      message: "Position must be a positive whole number.",
    });
  }

  const allowedMedals = ["Gold", "Silver", "Bronze"];

  if (medal && !allowedMedals.includes(medal)) {
    return res.status(400).json({
      message: "Medal must be Gold, Silver, or Bronze.",
    });
  }

  try {
    // Verify the athlete, event, and sports fest exist.
    const validation = await pool.query(
      `SELECT
         EXISTS(SELECT 1 FROM athletes WHERE id = $1) AS athlete_exists,
         EXISTS(SELECT 1 FROM events WHERE id = $2) AS event_exists,
         EXISTS(SELECT 1 FROM sports_fests WHERE id = $3) AS fest_exists`,
      [athleteId, eventId, festId]
    );

    const valid = validation.rows[0];

    if (!valid.athlete_exists) {
      return res.status(400).json({ message: "Athlete not found." });
    }

    if (!valid.event_exists) {
      return res.status(400).json({ message: "Event not found." });
    }

    if (!valid.fest_exists) {
      return res.status(400).json({ message: "Sports fest not found." });
    }

    const inserted = await pool.query(
      `INSERT INTO performances
        (athlete_id, event_id, sports_fest_id, result,
         record_date, competition, medal, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        athleteId,
        eventId,
        festId,
        numericResult,
        record_date || null,
        competition || null,
        medal || null,
        parsedPosition,
      ]
    );

    res.status(201).json({
      message: "Performance recorded successfully.",
      performance: inserted.rows[0],
    });
  } catch (error) {
    console.error("Error creating performance:", error);

    res.status(500).json({
      message: "Failed to record performance.",
    });
  }
});

// DELETE: Remove a performance (admin only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid performance ID.",
    });
  }

  try {
    const deleted = await pool.query(
      "DELETE FROM performances WHERE id = $1 RETURNING id",
      [id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({
        message: "Performance not found.",
      });
    }

    res.json({
      message: "Performance deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting performance:", error);

    res.status(500).json({
      message: "Failed to delete performance.",
    });
  }
});

module.exports = router;
