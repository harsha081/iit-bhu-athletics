import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import {
  ArrowRight,
  Trophy,
  Users,
  Medal,
  Crown,
  UserRound,
  GraduationCap,
  Megaphone,
} from "lucide-react";

import { getAthletes } from "../api/athletes";
import { getLeadership } from "../api/leadership";
import { getAnnouncements } from "../api/announcements";
import { getCoaches } from "../api/coaches";
import api from "../api/client";
import MissionCountdown from "../components/MissionCountdown";
import { getMediaUrl } from "../utils/mediaUrl";

export default function Home() {
  const [athletes, setAthletes] = useState([]);
  const [leadership, setLeadership] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHomeData = async () => {
      try {
        const [
          athleteData,
          leadershipData,
          performanceResponse,
          announcementResponse,
          coachesResponse,
        ] = await Promise.allSettled([
          getAthletes("Active"),
          getLeadership(),

          api.get("/performances").then((response) => response.data),

          getAnnouncements(),
          getCoaches("active"),
        ]);

        if (cancelled) return;

        // Active athletes
        if (athleteData.status === "fulfilled") {
          const data = athleteData.value;

          setAthletes(
            Array.isArray(data)
              ? data
              : data?.athletes || []
          );
        } else {
          console.error(
            "Failed to load athletes:",
            athleteData.reason
          );
        }

        // Leadership
        if (leadershipData.status === "fulfilled") {
          const data = leadershipData.value;

          setLeadership(
            Array.isArray(data)
              ? data
              : data?.leadership || []
          );
        } else {
          console.error(
            "Failed to load leadership:",
            leadershipData.reason
          );
        }

        // Performance records
        if (performanceResponse.status === "fulfilled") {
          const data = performanceResponse.value;

          setPerformances(
            Array.isArray(data)
              ? data
              : data?.performances || []
          );
        } else {
          console.error(
            "Failed to load performances:",
            performanceResponse.reason
          );
        }

        // Published announcements
        if (announcementResponse.status === "fulfilled") {
          const data = announcementResponse.value;

          const announcementList = Array.isArray(data)
            ? data
            : data?.announcements || [];

          const sortedAnnouncements = [
            ...announcementList,
          ].sort((a, b) => {
            const pinnedDifference =
              Number(Boolean(b.is_pinned)) -
              Number(Boolean(a.is_pinned));

            if (pinnedDifference !== 0) {
              return pinnedDifference;
            }

            const dateA = new Date(
              a.published_at || a.publish_at || 0
            ).getTime();

            const dateB = new Date(
              b.published_at || b.publish_at || 0
            ).getTime();

            return dateB - dateA;
          });

          setAnnouncements(sortedAnnouncements);
        } else {
          console.error(
            "Failed to load announcements:",
            announcementResponse.reason
          );
        }

        // Active coaches
        if (coachesResponse.status === "fulfilled") {
          const data = coachesResponse.value;

          const coachList = Array.isArray(data)
            ? data
            : data?.coaches || [];

          setCoaches(
            coachList.filter(
              (coach) =>
                coach.is_active === true ||
                coach.is_active === "true" ||
                coach.is_active === 1
            )
          );
        } else {
          console.error(
            "Failed to load coaches:",
            coachesResponse.reason
          );
        }
      } catch (error) {
        console.error(
          "Failed to load home page data:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Current leadership
  const currentLeadership = leadership.filter(
    (leader) =>
      leader.is_current === true ||
      leader.is_current === "true" ||
      leader.is_current === 1
  );

  const getLeader = (position, gender) =>
    currentLeadership.find(
      (leader) =>
        leader.position?.toLowerCase() ===
          position.toLowerCase() &&
        leader.gender?.toUpperCase() ===
          gender.toUpperCase()
    );

  const getLeaderName = (leader) =>
    leader?.name ||
    leader?.athlete_name ||
    "Not announced";

  // Homepage statistics
  const stats = [
    {
      icon: Users,
      value: loading ? "—" : athletes.length,
      label: "Active Athletes",
    },
    {
      icon: Trophy,
      value: loading ? "—" : "19",
      label: "Events",
    },
    {
      icon: Medal,
      value: loading
        ? "—"
        : performances.filter(
            (performance) =>
              performance.medal &&
              performance.medal.toLowerCase() !== "none"
          ).length,
      label: "Medal Entries",
    },
  ];

  // Leadership cards
  const leadershipCards = [
    {
      position: "Captain",
      gender: "M",
      label: "Men's Captain",
    },
    {
      position: "Captain",
      gender: "F",
      label: "Women's Captain",
    },
    {
      position: "Vice-Captain",
      gender: "M",
      label: "Men's Vice-Captain",
    },
    {
      position: "Vice-Captain",
      gender: "F",
      label: "Women's Vice-Captain",
    },
  ];

  // Build an all-time Hall of Fame from medal-winning performance records.
  // If the medal field is empty, podium positions (1–3) are used as a fallback.
  const getMedalType = (performance) => {
    const rawMedal = String(performance.medal || "").trim().toLowerCase();

    if (rawMedal && !["none", "null", "-", "n/a"].includes(rawMedal)) {
      if (rawMedal.includes("gold") || rawMedal === "g") return "Gold";
      if (rawMedal.includes("silver") || rawMedal === "s") return "Silver";
      if (rawMedal.includes("bronze") || rawMedal === "b") return "Bronze";
      return performance.medal;
    }

    const position = Number(performance.position);
    if (position === 1) return "Gold";
    if (position === 2) return "Silver";
    if (position === 3) return "Bronze";
    return null;
  };

  const hallOfFame = (() => {
    const medalistsByAthlete = new Map();

    performances.forEach((performance) => {
      const medalType = getMedalType(performance);
      if (!medalType) return;

      const athleteName =
        performance.athlete_name ||
        performance.name ||
        performance.athlete?.name;

      if (!athleteName) return;

      const athleteKey = String(
        performance.athlete_id ?? athleteName
      ).toLowerCase();

      const matchingAthlete = athletes.find(
        (athlete) =>
          String(athlete.id) === String(performance.athlete_id) ||
          String(athlete.name || "").toLowerCase() ===
            String(athleteName).toLowerCase()
      );

      if (!medalistsByAthlete.has(athleteKey)) {
        medalistsByAthlete.set(athleteKey, {
          id: athleteKey,
          name: athleteName,
          photo_url:
            performance.athlete_photo_url ||
            performance.photo_url ||
            matchingAthlete?.photo_url ||
            null,
          gold: 0,
          silver: 0,
          bronze: 0,
          otherMedals: 0,
          events: new Set(),
          totalMedals: 0,
        });
      }

      const medalist = medalistsByAthlete.get(athleteKey);
      const normalizedMedal = String(medalType).toLowerCase();
      if (normalizedMedal === "gold") medalist.gold += 1;
      else if (normalizedMedal === "silver") medalist.silver += 1;
      else if (normalizedMedal === "bronze") medalist.bronze += 1;
      else medalist.otherMedals += 1;
      medalist.totalMedals += 1;

      const eventName =
        performance.event_name ||
        performance.event ||
        performance.discipline;
      if (eventName) medalist.events.add(eventName);
    });

    return Array.from(medalistsByAthlete.values()).sort((a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      b.totalMedals - a.totalMedals ||
      a.name.localeCompare(b.name)
    );
  })();

  return (
    <main>
      {/* ==============================
          HERO SECTION
      ============================== */}
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            ATHLETICS · IIT (BHU) VARANASI
          </span>

          <h1>
            BUILT TO
            <br />
            <span>COMPETE.</span>
            <br />
            BORN TO WIN.
          </h1>

          <p>
            Celebrating the athletes, champions, and legacy
            of IIT BHU Athletics.
          </p>

          <div className="hero-actions">
            <Link to="/athletes" className="primary-button">
              Meet Our Athletes <ArrowRight size={18} />
            </Link>

            <Link to="/events" className="secondary-button">
              Explore Events
            </Link>
          </div>
        </div>

        <div className="hero-decoration">
          <img
            className="hero-athletics-logo"
            src="/athletics-logo.png"
            alt="IIT (BHU) Varanasi Athletics logo"
            fetchPriority="high"
          />
          <MissionCountdown />
        </div>
      </section>

      {/* ==============================
          STATISTICS
      ============================== */}
      <section className="stats">
        {stats.map(({ icon: Icon, value, label }) => (
          <article className="stat-card" key={label}>
            <Icon size={26} />

            <div>
              <h2>{value}</h2>
              <h3></h3>
              <p>{label}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ==============================
          UPDATES SIDEBAR + ATHLETICS COMMUNITY
      ============================== */}
      <section className="home-community-layout" aria-label="Athletics updates and team">
        {/* Left sidebar: latest announcements */}
        <aside className="home-updates-sidebar">
          <div className="home-sidebar-heading">
            <span className="eyebrow">WHAT'S HAPPENING</span>
            <h2>Latest Updates</h2>
            <p>Trials, results, achievements, and important notices.</p>
            <span className="home-update-count">
              {announcements.length} {announcements.length === 1 ? "update" : "updates"}
            </span>
          </div>

          {loading ? (
            <div className="home-sidebar-state">
              <Megaphone size={25} />
              <h3>Loading updates...</h3>
              <p>Please wait while we fetch the latest announcements.</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="home-sidebar-state">
              <Megaphone size={25} />
              <h3>No updates yet</h3>
              <p>New athletics announcements will appear here.</p>
            </div>
          ) : (
            <div className="home-update-list">
              {announcements.slice(0, 5).map((announcement) => (
                <article className="home-update-row" key={announcement.id}>
                  <div className="home-update-row-meta">
                    <span className="home-update-category">
                      {announcement.category || "General"}
                    </span>
                    {announcement.is_pinned && (
                      <span className="home-update-pinned">📌 Pinned</span>
                    )}
                  </div>

                  <h3>{announcement.title}</h3>
                  <p>
                    {announcement.content || "Read the latest athletics update."}
                  </p>
                  <div className="home-update-row-footer">
                    <span>
                      {announcement.published_at || announcement.publish_at
                        ? new Date(
                            announcement.published_at || announcement.publish_at
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Link to="/updates" className="home-sidebar-link">
            All updates <ArrowRight size={16} />
          </Link>
        </aside>

        {/* Right column: leadership, coaches, then all-time medalists */}
        <div className="home-community-main">
          <section className="home-community-panel home-leadership-panel">
            <div className="home-panel-heading">
              <div>
                <span className="eyebrow">THE TEAM BEHIND THE TEAM</span>
                <h2>Captains & Vice-Captains</h2>
                <p>Meet the student leaders representing men's and women's athletics.</p>
              </div>
              <Link to="/admin/login" className="home-panel-link">
                Manage <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <p className="home-community-loading">Loading leadership...</p>
            ) : (
              <div className="home-leadership-compact-grid">
                {leadershipCards.map(({ position, gender, label }) => {
                  const leader = getLeader(position, gender);

                  return (
                    <article
                      className="home-leader-compact-card"
                      key={`${position}-${gender}`}
                    >
                      <div className="home-leader-compact-photo">
                        {leader?.photo_url ? (
                          <img src={getMediaUrl(leader.photo_url)} alt={getLeaderName(leader)} loading="lazy" />
                        ) : (
                          <UserRound size={30} strokeWidth={1.2} />
                        )}
                      </div>
                      <div className="home-leader-compact-info">
                        <span className="home-leader-label">
                          <Crown size={14} /> {label}
                        </span>
                        <h3>{getLeaderName(leader)}</h3>
                        {leader ? (
                          <p>
                            {leader.branch || "IIT (BHU) Varanasi"}
                            {leader.entry_year ? ` · ${leader.entry_year}` : ""}
                          </p>
                        ) : (
                          <p>Details will be updated soon.</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="home-community-panel home-coaches-panel">
            <div className="home-panel-heading">
              <div>
                <span className="eyebrow">GUIDANCE · EXPERIENCE · EXCELLENCE</span>
                <h2>Our Coaches</h2>
                <p>The coaching team supporting IIT BHU athletes.</p>
              </div>
              <Link to="/coaches" className="home-panel-link">
                All coaches <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <p className="home-community-loading">Loading coaches...</p>
            ) : coaches.length === 0 ? (
              <div className="home-community-empty">
                <GraduationCap size={28} />
                <div>
                  <h3>Coach profiles coming soon</h3>
                  <p>Our coaching team details will be updated here.</p>
                </div>
              </div>
            ) : (
              <div className="home-coaches-compact-grid">
                {coaches.slice(0, 3).map((coach) => (
                  <article className="home-coach-compact-card" key={coach.id}>
                    <div className="home-coach-compact-photo">
                      {coach.photo_url ? (
                        <img src={getMediaUrl(coach.photo_url)} alt={coach.name} loading="lazy" />
                      ) : (
                        <UserRound size={30} strokeWidth={1.2} />
                      )}
                    </div>
                    <div className="home-coach-compact-info">
                      <span className="home-coach-badge">
                        <GraduationCap size={14} /> Coach
                      </span>
                      <h3>{coach.name}</h3>
                      <p>{coach.role || "Athletics Coach"}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="home-community-panel home-hall-of-fame-panel">
            <div className="home-panel-heading">
              <div>
                <span className="eyebrow">EXCELLENCE THROUGH THE YEARS</span>
                <h2>Hall of Fame</h2>
                <p>Medal-winning performances by current athletes and alumni.</p>
              </div>
              <span className="home-hall-count">
                <Medal size={16} /> {hallOfFame.length} {hallOfFame.length === 1 ? "medalist" : "medalists"}
              </span>
            </div>

            {loading ? (
              <p className="home-community-loading">Loading medalists...</p>
            ) : hallOfFame.length === 0 ? (
              <div className="home-community-empty">
                <Trophy size={28} />
                <div>
                  <h3>Champions will be celebrated here</h3>
                  <p>Medal-winning performance records will appear once recorded.</p>
                </div>
              </div>
            ) : (
              <div className="home-hall-of-fame-grid">
                {hallOfFame.slice(0, 6).map((medalist, index) => (
                  <article className="home-medalist-card" key={medalist.id}>
                    <span className="home-medalist-rank">{String(index + 1).padStart(2, "0")}</span>
                    <div className="home-medalist-photo">
                      {medalist.photo_url ? (
                        <img src={getMediaUrl(medalist.photo_url)} alt={medalist.name} loading="lazy" />
                      ) : (
                        <span>{medalist.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                      )}
                    </div>
                    <div className="home-medalist-info">
                      <h3>{medalist.name}</h3>
                      <div className="home-medal-counts">
                        {medalist.gold > 0 && <span className="medal-gold">🥇 {medalist.gold}</span>}
                        {medalist.silver > 0 && <span className="medal-silver">🥈 {medalist.silver}</span>}
                        {medalist.bronze > 0 && <span className="medal-bronze">🥉 {medalist.bronze}</span>}
                        {medalist.otherMedals > 0 && <span className="medal-other">🏅 {medalist.otherMedals}</span>}
                      </div>
                      <p className="home-medalist-events">
                        {Array.from(medalist.events).slice(0, 2).join(" · ") || "Athletics medalist"}
                      </p>
                      <span className="home-medalist-total">
                        {medalist.totalMedals} {medalist.totalMedals === 1 ? "medal" : "medals"} recorded
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Link to="/events" className="home-hall-of-fame-link">
              Explore event records <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </section>

      {/* ==============================
          WELCOME SECTION
      ============================== */}
      <section className="welcome section">
        <span className="eyebrow">OUR LEGACY</span>

        <h2>One Team. One Spirit.</h2>

        <p>
          From the track to the field, we celebrate dedication,
          discipline, teamwork, and the pursuit of excellence.
        </p>

        <Link to="/alumni" className="text-link">
          Discover our alumni <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
