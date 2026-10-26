require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const pool = require("./config/db");

const athleteRoutes = require("./routes/athleteRoutes");
const authRoutes = require("./routes/authRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const eventRoutes = require("./routes/eventRoutes");
const leadershipRoutes = require("./routes/leadershipRoutes");
const coachRoutes = require("./routes/coachRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const sportsFestRoutes = require("./routes/sportsFestRoutes");
const missionCountdownRoutes = require("./routes/missionCountdownRoutes");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json());

// Legacy support for existing athlete records. New uploads are disabled.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/athletes", athleteRoutes);
app.use("/api/performances", performanceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/leadership", leadershipRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/sports-fests", sportsFestRoutes);
app.use("/api/mission-countdown", missionCountdownRoutes);

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");

    res.json({
      status: "OK",
      database: result.rows[0].current_database,
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});

// Start a local server only when this file is run directly. Vercel imports the
// exported app as a serverless function instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
