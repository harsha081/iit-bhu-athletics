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

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Serve uploaded athlete photos
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

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
