const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Allowed announcement categories
const ALLOWED_CATEGORIES = [
  "Trials",
  "Results",
  "Achievements",
  "Sports Fest",
  "General",
];

// Check whether the announcement is ready to be published.
function isReadyToPublish(announcement) {
  if (!announcement.is_published) return false;

  if (announcement.publish_at) {
    return new Date(announcement.publish_at).getTime() <= Date.now();
  }

  return true;
}

// GET /api/announcements
// Public: return only published announcements that are due.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
            id,
            title,
            content,
            category,
            image_url,
            is_published,
            is_pinned,
            COALESCE(publish_at, published_at) AS published_at,
            updated_at
        FROM announcements
       WHERE is_published = TRUE
         AND (
           publish_at IS NULL
           OR publish_at <= CURRENT_TIMESTAMP
         )
       ORDER BY is_pinned DESC,
                COALESCE(publish_at, published_at) DESC NULLS LAST,
                id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      message: "Failed to fetch announcements",
    });
  }
});

// GET /api/announcements/admin/all
// Admin: return all announcements, including drafts.
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
      FROM announcements
      ORDER BY updated_at DESC NULLS LAST, id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all announcements:", error);
    res.status(500).json({
      message: "Failed to fetch announcements",
    });
  }
});

// POST /api/announcements
// Admin: create an announcement.
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      content,
      category = "General",
      image_url = null,
      is_published = false,
      is_pinned = false,
      publish_at = null,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Announcement title is required",
      });
    }

    if (typeof is_published !== "boolean" ||
        typeof is_pinned !== "boolean") {
      return res.status(400).json({
        message: "Publication and pinned values must be boolean",
      });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Invalid announcement category",
      });
    }

    if (publish_at && Number.isNaN(Date.parse(publish_at))) {
      return res.status(400).json({
        message: "Invalid publication date",
      });
    }

    const result = await pool.query(
      `INSERT INTO announcements
         (title, content, category, image_url,
          is_published, is_pinned, publish_at, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
          CASE
            WHEN $5::boolean = TRUE AND $7::timestamp IS NULL
            THEN CURRENT_TIMESTAMP
            ELSE NULL
          END)
       RETURNING *`,
      [
        title.trim(),
        content || "",
        category,
        image_url || null,
        is_published,
        is_pinned,
        publish_at || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      message: "Failed to create announcement",
    });
  }
});

// PUT /api/announcements/:id
// Admin: edit an announcement.
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      content,
      category,
      image_url,
      is_published,
      is_pinned,
      publish_at,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Announcement title is required",
      });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Invalid announcement category",
      });
    }

    if (typeof is_published !== "boolean" ||
        typeof is_pinned !== "boolean") {
      return res.status(400).json({
        message: "Publication and pinned values must be boolean",
      });
    }

    if (publish_at && Number.isNaN(Date.parse(publish_at))) {
      return res.status(400).json({
        message: "Invalid publication date",
      });
    }

    const result = await pool.query(
      `UPDATE announcements
       SET title = $1,
           content = $2,
           category = $3,
           image_url = $4,
           is_published = $5,
           is_pinned = $6,
           publish_at = $7,
           published_at = CASE
             WHEN $5::boolean = FALSE THEN NULL
             WHEN $7::timestamp IS NOT NULL THEN NULL
             WHEN published_at IS NULL THEN CURRENT_TIMESTAMP
             ELSE published_at
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        title.trim(),
        content || "",
        category,
        image_url || null,
        is_published,
        is_pinned,
        publish_at || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({
      message: "Failed to update announcement",
    });
  }
});

// DELETE /api/announcements/:id
// Admin: delete an announcement.
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM announcements
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    res.json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      message: "Failed to delete announcement",
    });
  }
});

module.exports = router;
