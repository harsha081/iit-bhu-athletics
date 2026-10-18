const express = require("express");
const pool = require("../config/db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

const VALID_POSITIONS = ["Captain", "Vice-Captain"];
const VALID_GENDERS = ["M", "F"];

// GET: Retrieve leadership history
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.athlete_id,
        c.name,
        c.position,
        c.gender,
        c.start_year,
        c.end_year,
        c.is_current,
        c.photo_url,
        a.branch,
        a.entry_year,
        a.status AS athlete_status
      FROM captains c
      LEFT JOIN athletes a ON a.id = c.athlete_id
      ORDER BY c.is_current DESC NULLS LAST,
               c.start_year DESC NULLS LAST,
               c.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch leadership error:", error.message);
    res.status(500).json({
      message: "Failed to fetch leadership records.",
    });
  }
});

// POST: Assign a captain or vice-captain
router.post(
  "/",
  authenticateAdmin,
  async (req, res) => {
  const {
    athlete_id,
    position,
    gender,
    start_year,
    end_year,
    is_current = true,
  } = req.body;

  const athleteId = Number(athlete_id);
  const startYear = Number(start_year);
  const endYear =
    end_year === "" || end_year == null
      ? null
      : Number(end_year);

  if (!Number.isInteger(athleteId) || athleteId <= 0) {
    return res.status(400).json({
      message: "Select a valid athlete.",
    });
  }

  if (!VALID_POSITIONS.includes(position)) {
    return res.status(400).json({
      message: "Position must be Captain or Vice-Captain.",
    });
  }

  if (!VALID_GENDERS.includes(gender)) {
    return res.status(400).json({
      message: "Gender must be M or F.",
    });
  }

  if (!Number.isInteger(startYear) || startYear < 2000) {
    return res.status(400).json({
      message: "Enter a valid start year.",
    });
  }

  if (
    endYear !== null &&
    (!Number.isInteger(endYear) || endYear < startYear)
  ) {
    return res.status(400).json({
      message: "End year must be greater than or equal to start year.",
    });
  }

  if (typeof is_current !== "boolean") {
    return res.status(400).json({
      message: "is_current must be true or false.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Ensure the selected athlete exists and has the correct gender.
    const athleteResult = await client.query(
      `SELECT id, name, gender, branch, entry_year, photo_url, status
       FROM athletes
       WHERE id = $1
       FOR UPDATE`,
      [athleteId]
    );

    const athlete = athleteResult.rows[0];

    if (!athlete) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Selected athlete was not found.",
      });
    }

    if (athlete.gender !== gender) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Selected athlete's gender does not match the position.",
      });
    }

    if (is_current && athlete.status !== "Active") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only active athletes can hold a current leadership position.",
      });
    }

    if (is_current) {
      // End any existing current holder's appointment for this position.
      await client.query(
        `UPDATE captains
         SET is_current = FALSE,
             end_year = COALESCE(end_year, $1)
         WHERE position = $2
           AND gender = $3
           AND is_current = TRUE`,
        [startYear, position, gender]
      );
    }

    const result = await client.query(
      `INSERT INTO captains
         (athlete_id, name, position, gender, start_year,
          end_year, is_current, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        athlete.id,
        athlete.name,
        position,
        gender,
        startYear,
        is_current ? null : endYear,
        is_current,
        athlete.photo_url,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Leadership assignment saved successfully.",
      leadership: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create leadership error:", error.message);

    res.status(500).json({
      message: "Failed to save leadership assignment.",
    });
  } finally {
    client.release();
  }
});

// PUT: Edit an existing leadership record
router.put(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
  const {
    athlete_id,
    position,
    gender,
    start_year,
    end_year,
    is_current,
  } = req.body;

  const recordId = Number(req.params.id);
  const athleteId = Number(athlete_id);
  const startYear = Number(start_year);
  const endYear =
    end_year === "" || end_year == null
      ? null
      : Number(end_year);

  if (!Number.isInteger(recordId) || recordId <= 0) {
    return res.status(400).json({ message: "Invalid leadership ID." });
  }

  if (!Number.isInteger(athleteId) || athleteId <= 0) {
    return res.status(400).json({ message: "Select a valid athlete." });
  }

  if (!["Captain", "Vice-Captain"].includes(position)) {
    return res.status(400).json({ message: "Invalid position." });
  }

  if (!["M", "F"].includes(gender)) {
    return res.status(400).json({ message: "Invalid gender." });
  }

  if (!Number.isInteger(startYear) || startYear < 2000) {
    return res.status(400).json({ message: "Enter a valid start year." });
  }

  if (
    endYear !== null &&
    (!Number.isInteger(endYear) || endYear < startYear)
  ) {
    return res.status(400).json({
      message: "End year must be greater than or equal to start year.",
    });
  }

  if (typeof is_current !== "boolean") {
    return res.status(400).json({
      message: "Current status must be true or false.",
    });
  }

  if (is_current && endYear !== null) {
    return res.status(400).json({
      message: "A current leadership record cannot have an end year.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      "SELECT id FROM captains WHERE id = $1 FOR UPDATE",
      [recordId]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Leadership record not found.",
      });
    }

    const athleteResult = await client.query(
      `SELECT id, name, gender, photo_url, status
       FROM athletes
       WHERE id = $1
       FOR UPDATE`,
      [athleteId]
    );

    const athlete = athleteResult.rows[0];

    if (!athlete) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Selected athlete was not found.",
      });
    }

    if (athlete.gender !== gender) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Athlete gender does not match the selected team.",
      });
    }

    if (is_current && athlete.status !== "Active") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only active athletes can hold current leadership positions.",
      });
    }

    if (is_current) {
      // End any other current record for this position and gender.
      await client.query(
        `UPDATE captains
         SET is_current = FALSE,
             end_year = COALESCE(end_year, $1)
         WHERE position = $2
           AND gender = $3
           AND is_current = TRUE
           AND id <> $4`,
        [startYear, position, gender, recordId]
      );
    }

    const result = await client.query(
      `UPDATE captains
       SET athlete_id = $1,
           name = $2,
           position = $3,
           gender = $4,
           start_year = $5,
           end_year = $6,
           is_current = $7,
           photo_url = $8
       WHERE id = $9
       RETURNING *`,
      [
        athlete.id,
        athlete.name,
        position,
        gender,
        startYear,
        is_current ? null : endYear,
        is_current,
        athlete.photo_url,
        recordId,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Leadership record updated successfully.",
      leadership: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update leadership error:", error.message);

    res.status(500).json({
      message: "Failed to update leadership record.",
    });
  } finally {
    client.release();
  }
});


// DELETE: Remove a leadership record
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM captains
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Leadership record not found.",
      });
    }

    res.json({
      message: "Leadership record deleted successfully.",
    });
  } catch (error) {
    console.error("Delete leadership error:", error.message);
    res.status(500).json({
      message: "Failed to delete leadership record.",
    });
  }
});

module.exports = router;
