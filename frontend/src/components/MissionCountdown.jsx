import { useEffect, useState } from "react";
import { getMissionCountdown } from "../api/missionCountdown";
import "./MissionCountdown.css";

const DEFAULT_MISSION = {
  title: "INTER-IIT ATHLETICS MEET 2026",
  target_at: "2026-12-14T18:30:00.000Z",
  timezone: "Asia/Kolkata",
  description: "The next mission starts here.",
  is_active: true,
};

function getTimeLeft(targetAt) {
  const target = new Date(targetAt).getTime();
  if (!Number.isFinite(target)) return null;
  const difference = target - Date.now();
  if (difference <= 0) return { complete: true, justStarted: difference >= -60000 };

  return {
    complete: false,
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

const pad = (value) => String(value).padStart(2, "0");

export default function MissionCountdown() {
  const [mission, setMission] = useState(DEFAULT_MISSION);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(DEFAULT_MISSION.target_at));

  useEffect(() => {
    let mounted = true;
    getMissionCountdown()
      .then((savedMission) => {
        if (mounted && savedMission) setMission({ ...DEFAULT_MISSION, ...savedMission });
      })
      .catch((error) => console.error("Using default mission countdown:", error));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(mission.target_at) || getTimeLeft(DEFAULT_MISSION.target_at));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [mission.target_at]);

  if (!mission.is_active || !timeLeft) return null;

  if (timeLeft.complete) {
    return (
      <section className="mission-countdown" aria-live="polite">
        <span className="mission-countdown-kicker">NEXT MISSION</span>
        <h2>{mission.title}</h2>
        <p className="mission-countdown-status">
          {timeLeft.justStarted ? "THE MISSION STARTS NOW" : "THIS MISSION HAS STARTED"}
        </p>
      </section>
    );
  }

  const units = [
    [timeLeft.days, "DAYS"],
    [timeLeft.hours, "HOURS"],
    [timeLeft.minutes, "MINUTES"],
    [timeLeft.seconds, "SECONDS"],
  ];

  return (
    <section className="mission-countdown" aria-label={`Countdown to ${mission.title}`}>
      <span className="mission-countdown-kicker">NEXT MISSION</span>
      <h2>{mission.title}</h2>
      {mission.description && <p className="mission-countdown-description">{mission.description}</p>}
      <div className="mission-countdown-units">
        {units.map(([value, label]) => (
          <div className="mission-countdown-unit" key={label}>
            <strong>{label === "DAYS" ? value : pad(value)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
