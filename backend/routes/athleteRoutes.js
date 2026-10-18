const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const pool = require("../config/db");
const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================
// ATHLETE PHOTO UPLOAD CONFIGURATION
// ============================================

const uploadDirectory = path.join(__dirname, "../uploads/athletes");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const safeExtension = [".jpg", ".jpeg", ".png", ".webp"].includes(
      extension
    )
      ? extension
      : ".jpg";

    const filename = `athlete-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${safeExtension}`;

    callback(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, and WebP images are allowed.")
      );
    }

    callback(null, true);
  },
});

// ============================================
// HELPER: PARSE EVENTS FROM JSON OR FORMDATA
// ============================================

function parseEvents(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error("Events must contain valid JSON.");
    }
  }

  if (
    !Array.isArray(value) ||
    value.some((event) => typeof event !== "string" || !event.trim())
  ) {
    throw new Error("Events must be an array of valid event names.");
  }

  return [...new Set(value.map((event) => event.trim()))];
}

// ============================================
// GET: ALL ATHLETES
// ============================================

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    if (status && !["Active", "Alumni"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Alumni",
      });
    }

    const result = await pool.query(
      `
      SELECT
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name,
              'category', e.category,
              'gender', e.gender
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'::json
        ) AS events
      FROM athletes a
      LEFT JOIN athlete_events ae ON ae.athlete_id = a.id
      LEFT JOIN events e ON e.id = ae.event_id
      WHERE ($1::varchar IS NULL OR a.status = $1)
      GROUP BY a.id
      ORDER BY a.id DESC
      `,
      [status || null]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch athletes error:", error.message);

    res.status(500).json({
      message: "Failed to fetch athletes",
    });
  }
});

// ============================================
// GET: ONE ATHLETE
// ============================================

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'name', e.name,
              'category', e.category,
              'gender', e.gender
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'::json
        ) AS events
      FROM athletes a
      LEFT JOIN athlete_events ae ON ae.athlete_id = a.id
      LEFT JOIN events e ON e.id = ae.event_id
      WHERE a.id = $1
      GROUP BY a.id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Athlete not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch athlete error:", error.message);

    res.status(500).json({
      message: "Failed to fetch athlete",
    });
  }
});

// ============================================
// POST: CREATE ATHLETE
// ============================================

router.post("/", authenticateAdmin, upload.single("photo"), async (req, res) => {
  let client;

  try {
    const {
      name,
      gender,
      branch,
      entry_year,
      photo_url,
      contact,
      status = "Active",
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Athlete name is required",
      });
    }

    if (!["Active", "Alumni"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Alumni",
      });
    }

    let events;

    try {
      events = parseEvents(req.body.events);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const finalPhotoUrl = req.file
      ? `/uploads/athletes/${req.file.filename}`
      : photo_url || null;

    client = await pool.connect();

    await client.query("BEGIN");

    const eventResult = await client.query(
      `
      SELECT id, name
      FROM events
      WHERE name = ANY($1::varchar[])
        AND (gender = $2 OR gender IS NULL)
      `,
      [events, gender || null]
    );

    const eventNames = new Set(
      eventResult.rows.map((event) => event.name)
    );

    if (events.some((event) => !eventNames.has(event))) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "One or more selected events are invalid for this gender",
      });
    }

    const athleteResult = await client.query(
      `
      INSERT INTO athletes
        (name, gender, branch, entry_year, photo_url, contact, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        name.trim(),
        gender || null,
        branch || null,
        entry_year || null,
        finalPhotoUrl,
        contact || null,
        status,
      ]
    );

    const athlete = athleteResult.rows[0];

    for (const event of eventResult.rows) {
      await client.query(
        `
        INSERT INTO athlete_events (athlete_id, event_id)
        VALUES ($1, $2)
        `,
        [athlete.id, event.id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      ...athlete,
      events: eventResult.rows,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Create athlete error:", error);

    res.status(500).json({
      message: "Failed to create athlete",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// ============================================
// PUT: UPDATE ATHLETE
// ============================================

router.put(
  "/:id",
  authenticateAdmin,
  upload.single("photo"),
  async (req, res) => {
    let client;

    try {
      const {
        name,
        gender,
        branch,
        entry_year,
        photo_url,
        contact,
        status = "Active",
      } = req.body;

      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Athlete name is required",
        });
      }

      if (!["Active", "Alumni"].includes(status)) {
        return res.status(400).json({
          message: "Status must be Active or Alumni",
        });
      }

      // On update, preserve event assignments if events were omitted.
      const eventsWereSubmitted = req.body.events !== undefined;
      let events = [];

      if (eventsWereSubmitted) {
        try {
          events = parseEvents(req.body.events);
        } catch (error) {
          return res.status(400).json({
            message: error.message,
          });
        }
      }

      client = await pool.connect();

      await client.query("BEGIN");

      // Preserve the current photo if no new photo or photo_url is supplied.
      const existing = await client.query(
        "SELECT photo_url FROM athletes WHERE id = $1",
        [req.params.id]
      );

      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Athlete not found",
        });
      }

      const finalPhotoUrl = req.file
        ? `/uploads/athletes/${req.file.filename}`
        : photo_url !== undefined
          ? photo_url || null
          : existing.rows[0].photo_url;

      let eventResult = { rows: [] };

      if (eventsWereSubmitted) {
        eventResult = await client.query(
          `
          SELECT id, name
          FROM events
          WHERE name = ANY($1::varchar[])
            AND (gender = $2 OR gender IS NULL)
          `,
          [events, gender || null]
        );

        const eventNames = new Set(
          eventResult.rows.map((event) => event.name)
        );

        if (events.some((event) => !eventNames.has(event))) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message: "One or more selected events are invalid for this gender",
          });
        }
      }

      const athleteResult = await client.query(
        `
        UPDATE athletes
        SET name = $1,
            gender = $2,
            branch = $3,
            entry_year = $4,
            photo_url = $5,
            contact = $6,
            status = $7
        WHERE id = $8
        RETURNING *
        `,
        [
          name.trim(),
          gender || null,
          branch || null,
          entry_year || null,
          finalPhotoUrl,
          contact || null,
          status,
          req.params.id,
        ]
      );

      if (eventsWereSubmitted) {
        await client.query(
          "DELETE FROM athlete_events WHERE athlete_id = $1",
          [req.params.id]
        );

        for (const event of eventResult.rows) {
          await client.query(
            `
            INSERT INTO athlete_events (athlete_id, event_id)
            VALUES ($1, $2)
            `,
            [req.params.id, event.id]
          );
        }
      }

      await client.query("COMMIT");

      res.json({
        ...athleteResult.rows[0],
        ...(eventsWereSubmitted ? { events: eventResult.rows } : {}),
      });
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK").catch(() => {});
      }

      console.error("Update athlete error:", error);

      res.status(500).json({
        message: "Failed to update athlete",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// ============================================
// DELETE: ATHLETE
// ============================================

router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM athletes WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Athlete not found",
      });
    }

    res.json({
      message: "Athlete deleted successfully",
    });
  } catch (error) {
    console.error("Delete athlete error:", error.message);

    res.status(500).json({
      message: "Failed to delete athlete",
    });
  }
});

module.exports = router;