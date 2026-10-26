const express = require("express");
const pool = require("../config/db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

const DEFAULT_MISSION = {
  id: 1,
  title: "INTER-IIT ATHLETICS MEET 2026",
  target_at: "2026-12-14T18:30:00.000Z",
  timezone: "Asia/Kolkata",
  description: "The next mission starts here.",
  is_active: true,
};

const missionFields = `
  id,
  title,
  target_at,
  timezone,
  description,
  is_active,
  created_at,
  updated_at,
  to_char(target_at AT TIME ZONE timezone, 'YYYY-MM-DD') AS target_date,
  to_char(target_at AT TIME ZONE timezone, 'HH24:MI') AS target_time
`;

// Public: Home page can read the setting without exposing any credentials.
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${missionFields} FROM mission_countdowns WHERE id = 1`
    );

    return res.json({ mission: result.rows[0] || DEFAULT_MISSION });
  } catch (error) {
    console.error("Failed to fetch mission countdown:", error.message);
    if (error.code === "42P01" || error.code === "42703") {
      return res.status(503).json({
        message: "Countdown database setup is incomplete. Run backend/migrations/20261023_mission_countdown.sql and restart the backend.",
      });
    }
    return res.status(500).json({ message: "Unable to load mission countdown." });
  }
});

// Admin-only: update the one homepage mission configuration.
router.put("/", authenticateAdmin, async (req, res) => {
  const { title, target_date, target_time, timezone, description = "", is_active } = req.body || {};

  if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
    return res.status(400).json({ message: "A mission title of 1–120 characters is required." });
  }
  if (typeof target_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return res.status(400).json({ message: "Choose a valid target date." });
  }
  if (typeof target_time !== "string" || !/^\d{2}:\d{2}$/.test(target_time)) {
    return res.status(400).json({ message: "Choose a valid target time." });
  }
  if (typeof timezone !== "string" || !timezone.trim() || timezone.length > 80) {
    return res.status(400).json({ message: "Choose a valid timezone." });
  }
  if (typeof description !== "string" || description.length > 220) {
    return res.status(400).json({ message: "Supporting message must be 220 characters or fewer." });
  }
  if (typeof is_active !== "boolean") {
    return res.status(400).json({ message: "Countdown visibility must be true or false." });
  }

  try {
    const validation = await pool.query(
      `SELECT
        to_char($1::date, 'YYYY-MM-DD') AS date_value,
        to_char($2::time, 'HH24:MI') AS time_value,
        NOW() AT TIME ZONE $3 AS timezone_check`,
      [target_date, target_time, timezone.trim()]
    );

    if (
      validation.rows[0].date_value !== target_date ||
      validation.rows[0].time_value !== target_time
    ) {
      return res.status(400).json({ message: "The selected date or time is invalid." });
    }

    const result = await pool.query(
      `INSERT INTO mission_countdowns
        (id, title, target_at, timezone, description, is_active, updated_at)
       VALUES
        (1, $1, ($2::date + $3::time) AT TIME ZONE $4, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        target_at = EXCLUDED.target_at,
        timezone = EXCLUDED.timezone,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
       RETURNING ${missionFields}`,
      [title.trim(), target_date, target_time, timezone.trim(), description.trim(), is_active]
    );

    return res.json({ message: "Mission countdown settings saved.", mission: result.rows[0] });
  } catch (error) {
    console.error("Failed to save mission countdown:", error.message);
    if (error.code === "42P01" || error.code === "42703") {
      return res.status(503).json({
        message: "Countdown database setup is incomplete. Run backend/migrations/20261023_mission_countdown.sql and restart the backend.",
      });
    }
    return res.status(400).json({ message: "Unable to save mission countdown. Check the date, time, and timezone." });
  }
});

module.exports = router;
