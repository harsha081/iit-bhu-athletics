const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET: Fetch all events
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT id, name, category, gender, display_order
        FROM events
        ORDER BY display_order ASC, id ASC
      `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);

    res.status(500).json({
      message: "Failed to fetch events.",
    });
  }
});

// GET: Fetch athletes participating in a particular event
router.get("/:id/athletes", async (req, res) => {
  const eventId = Number(req.params.id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      message: "Invalid event ID.",
    });
  }

  try {
    const eventCheck = await pool.query(
      "SELECT id, name, category, gender FROM events WHERE id = $1",
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found.",
      });
    }

    const event = eventCheck.rows[0];

    const result = await pool.query(
      `
      SELECT
        a.id AS athlete_id,
        a.name AS athlete_name,
        a.entry_year,
        a.branch,
        a.photo_url,

        best.result AS best_result,
        best.record_date AS best_record_date,
        best.competition AS best_competition,

        COALESCE(history.records, '[]'::json) AS performance_history

      FROM athlete_events ae

      JOIN athletes a
        ON a.id = ae.athlete_id

      LEFT JOIN LATERAL (
        SELECT
          p.result,
          p.record_date,
          p.competition
        FROM performances p
        WHERE p.athlete_id = a.id
          AND p.event_id = $1

        ORDER BY
          CASE
            WHEN LOWER($2) = 'field' THEN p.result
          END DESC NULLS LAST,

          CASE
            WHEN LOWER($2) <> 'field' THEN p.result
          END ASC NULLS LAST,

          p.record_date DESC NULLS LAST

        LIMIT 1
      ) best ON TRUE

      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', p.id,
            'result', p.result,
            'record_date', p.record_date,
            'competition', p.competition,
            'sports_fest_name', sf.name,
            'sports_fest_year', sf.year,
            'position', p.position,
            'medal', p.medal
          )
          ORDER BY p.record_date DESC NULLS LAST, p.id DESC
        ) AS records

        FROM performances p

        LEFT JOIN sports_fests sf
          ON sf.id = p.sports_fest_id

        WHERE p.athlete_id = a.id
          AND p.event_id = $1
      ) history ON TRUE

      WHERE ae.event_id = $1

      ORDER BY a.name;
      `,
      [eventId, event.category]
    );

    res.json({
      event,
      athletes: result.rows,
    });
  } catch (error) {
    console.error("Error fetching event athletes:", error);

    res.status(500).json({
      message: "Failed to fetch athletes for this event.",
    });
  }
});

module.exports = router;