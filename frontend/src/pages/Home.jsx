import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import "./Home.css";

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

          fetch("http://localhost:5000/api/performances").then(
            (response) => {
              if (!response.ok) {
                throw new Error("Failed to fetch performances");
              }

              return response.json();
            }
          ),

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
          <Trophy size={180} strokeWidth={0.8} />
          <span>IIT BHU</span>
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
          LATEST UPDATES
      ============================== */}
      <section className="section home-updates">
        <div className="home-section-heading">
          <span className="eyebrow">
            WHAT'S HAPPENING
          </span>

          <h2>Latest Updates</h2>

          <p>
            Stay informed about athletics trials, achievements,
            competition results, and upcoming events.
          </p>
        </div>

        {loading ? (
          <div className="home-updates-empty">
            <Megaphone size={32} />

            <h3>Loading updates...</h3>

            <p>
              Please wait while we fetch the latest announcements.
            </p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="home-updates-empty">
            <Megaphone size={32} />

            <h3>No updates yet</h3>

            <p>
              New athletics announcements will appear here.
            </p>
          </div>
        ) : (
          <div className="home-updates-grid">
            {announcements.slice(0, 3).map((announcement) => (
              <article
                className="home-update-card"
                key={announcement.id}
              >
                {announcement.image_url ? (
                  <img
                    className="home-update-image"
                    src={announcement.image_url}
                    alt={announcement.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="home-update-image-placeholder">
                    <Trophy
                      size={38}
                      strokeWidth={1.2}
                    />
                  </div>
                )}

                <div className="home-update-content">
                  <div className="home-update-meta">
                    <span className="home-update-category">
                      {announcement.category || "General"}
                    </span>

                    {announcement.is_pinned && (
                      <span className="home-update-pinned">
                        📌 Pinned
                      </span>
                    )}
                  </div>

                  <h3>{announcement.title}</h3>

                  <p>
                    {announcement.content ||
                      "Read the latest athletics update."}
                  </p>

                  <span className="home-update-date">
                    {announcement.published_at
                      ? new Date(
                          announcement.published_at
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

        <div className="home-updates-action">
          <Link to="/updates" className="primary-button">
            View Latest Updates <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ==============================
          CURRENT LEADERSHIP
      ============================== */}
      <section className="section home-leadership">
        <div className="home-section-heading">
          <span className="eyebrow">
            THE TEAM BEHIND THE TEAM
          </span>

          <h2>Current Leadership</h2>

          <p>
            Meet the captains leading IIT BHU Athletics on and
            off the field.
          </p>
        </div>

        {loading ? (
          <p className="home-loading">
            Loading leadership...
          </p>
        ) : (
          <div className="home-leadership-grid">
            {leadershipCards.map(
              ({ position, gender, label }) => {
                const leader = getLeader(position, gender);

                return (
                  <article
                    className="home-leader-card"
                    key={`${position}-${gender}`}
                  >
                    <div className="home-leader-photo">
                      {leader?.photo_url ? (
                        <img
                          src={leader.photo_url}
                          alt={getLeaderName(leader)}
                        />
                      ) : (
                        <UserRound
                          size={44}
                          strokeWidth={1.2}
                        />
                      )}
                    </div>

                    <div className="home-leader-info">
                      <span className="home-leader-label">
                        <Crown size={15} />
                        {label}
                      </span>

                      <h3>{getLeaderName(leader)}</h3>

                      {leader ? (
                        <>
                          <p>
                            {leader.branch ||
                              "IIT (BHU) Varanasi"}

                            {leader.entry_year
                              ? ` · ${leader.entry_year}`
                              : ""}
                          </p>

                          {leader.start_year && (
                            <span className="home-leader-term">
                              Since {leader.start_year}
                            </span>
                          )}
                        </>
                      ) : (
                        <p>
                          Leadership details will be updated soon.
                        </p>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        <div className="home-leadership-action">
          <Link to="/admin/login" className="text-link">
            Manage Leadership <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ==============================
          CURRENT COACHES
      ============================== */}
      <section className="section home-coaches">
        <div className="home-section-heading">
          <span className="eyebrow">
            GUIDANCE · EXPERIENCE · EXCELLENCE
          </span>

          <h2>Our Coaches</h2>

          <p>
            Meet the coaches guiding and developing the athletes
            of IIT BHU Athletics.
          </p>
        </div>

        {loading ? (
          <div className="home-coaches-empty">
            <GraduationCap size={36} />

            <h3>Loading coaches...</h3>

            <p>
              Please wait while we fetch the coaching team.
            </p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="home-coaches-empty">
            <GraduationCap
              size={36}
              strokeWidth={1.2}
            />

            <h3>Coach profiles coming soon</h3>

            <p>
              Our coaching team details will be updated here.
            </p>
          </div>
        ) : (
          <div className="home-coaches-grid">
            {coaches.slice(0, 3).map((coach) => (
              <article
                className="home-coach-card"
                key={coach.id}
              >
                <div className="home-coach-photo">
                  {coach.photo_url ? (
                    <img
                      src={coach.photo_url}
                      alt={coach.name}
                      loading="lazy"
                    />
                  ) : (
                    <UserRound
                      size={46}
                      strokeWidth={1.2}
                    />
                  )}
                </div>

                <div className="home-coach-info">
                  <span className="home-coach-badge">
                    <GraduationCap size={15} />
                    Coach
                  </span>

                  <h3>{coach.name}</h3>

                  <p className="home-coach-role">
                    {coach.role || "Athletics Coach"}
                  </p>

                  {coach.contact && (
                    <p className="home-coach-contact">
                      {coach.contact}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="home-coaches-action">
          <Link to="/coaches" className="text-link">
            Meet All Coaches <ArrowRight size={18} />
          </Link>
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