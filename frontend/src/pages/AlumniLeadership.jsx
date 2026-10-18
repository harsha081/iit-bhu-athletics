import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  CalendarDays,
  Crown,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { getLeadership } from "../api/leadership";

const genderOptions = [
  { label: "All Genders", value: "All" },
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

const positionOptions = [
  { label: "All Positions", value: "All" },
  { label: "Captain", value: "Captain" },
  { label: "Vice-Captain", value: "Vice-Captain" },
];

function normalizeGender(gender) {
  const value = String(gender ?? "").trim().toLowerCase();

  if (["m", "male", "men", "man"].includes(value)) {
    return "M";
  }

  if (["f", "female", "women", "woman"].includes(value)) {
    return "F";
  }

  return "";
}

function normalizePosition(position) {
  const value = String(position ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (value === "captain") {
    return "Captain";
  }

  if (
    value === "vice-captain" ||
    value === "vicecaptain" ||
    value === "vice captain" ||
    value === "vc"
  ) {
    return "Vice-Captain";
  }

  return "";
}

function isCurrentLeader(leader) {
  const value = leader.is_current;

  return (
    value === true ||
    value === 1 ||
    String(value).toLowerCase() === "true" ||
    String(value) === "1"
  );
}

function getLeaderName(leader) {
  return (
    leader.name ||
    leader.athlete_name ||
    "Name not available"
  );
}

function getTenureYear(leader) {
  const value =
    leader.end_year ??
    leader.endYear ??
    leader.start_year ??
    leader.startYear ??
    leader.year ??
    0;

  const year = Number(value);

  return Number.isFinite(year) ? year : 0;
}

function getTenureLabel(leader) {
  const start =
    leader.start_year ??
    leader.startYear ??
    leader.year;

  const end =
    leader.end_year ??
    leader.endYear;

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (start) {
    return `Since ${start}`;
  }

  if (end) {
    return `Ended ${end}`;
  }

  return "Tenure not available";
}

export default function AlumniLeadership() {
  const [leadership, setLeadership] = useState([]);
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeadership() {
      try {
        setError("");

        const response = await getLeadership();

        const records = Array.isArray(response)
          ? response
          : response?.leadership || [];

        if (!cancelled) {
          setLeadership(records);
        }
      } catch (err) {
        console.error(
          "Failed to load alumni leadership:",
          err
        );

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load alumni leadership. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        loadLeadership();
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const alumniLeaders = useMemo(() => {
    return leadership
      .filter((leader) => {
        const position = normalizePosition(leader.position);

        // Keep only former captains and vice-captains.
        if (!["Captain", "Vice-Captain"].includes(position)) {
          return false;
        }

        // Exclude current leadership.
        if (isCurrentLeader(leader)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Newest completed leadership tenure first.
        const yearDifference =
          getTenureYear(b) - getTenureYear(a);

        if (yearDifference !== 0) {
          return yearDifference;
        }

        const startA = Number(a.start_year ?? a.startYear ?? 0);
        const startB = Number(b.start_year ?? b.startYear ?? 0);

        return startB - startA;
      });
  }, [leadership]);

  const filteredLeaders = useMemo(() => {
    return alumniLeaders.filter((leader) => {
      const genderMatches =
        selectedGender === "All" ||
        normalizeGender(leader.gender) === selectedGender;

      const positionMatches =
        selectedPosition === "All" ||
        normalizePosition(leader.position) ===
          selectedPosition;

      return genderMatches && positionMatches;
    });
  }, [alumniLeaders, selectedGender, selectedPosition]);

  return (
    <main className="alumni-leadership-page">
      {/* Hero */}
      <section className="alumni-leadership-hero">
        <div className="alumni-leadership-hero-content">
          <span className="eyebrow">
            IIT (BHU) VARANASI · ATHLETICS
          </span>

          <h1>
            Our Legacy.
            <br />
            <span>Our Leaders.</span>
          </h1>

          <p>
            Celebrating the former captains and vice-captains
            who led IIT BHU Athletics with dedication,
            discipline, and team spirit.
          </p>

          <div className="alumni-leadership-hero-stat">
            <Crown size={22} />

            <div>
              <strong>{alumniLeaders.length}</strong>
              <span>Former Leaders</span>
            </div>
          </div>
        </div>

        <div className="alumni-leadership-hero-icon">
          <ShieldCheck size={150} strokeWidth={0.8} />
        </div>
      </section>

      {/* Alumni Leaders */}
      <section className="section alumni-leadership-content">
        <div className="home-section-heading">
          <span className="eyebrow">
            HONOURING OUR HISTORY
          </span>

          <h2>Alumni Captains & Vice-Captains</h2>

          <p>
            Explore the people who shaped our athletics team.
            Filter by gender and leadership position.
          </p>
        </div>

        {/* Filters */}
        <div className="alumni-leadership-filters">
          <label className="alumni-filter-group">
            <span>
              <Users size={17} />
              Gender
            </span>

            <select
              value={selectedGender}
              onChange={(event) =>
                setSelectedGender(event.target.value)
              }
            >
              {genderOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="alumni-filter-group">
            <span>
              <Crown size={17} />
              Position
            </span>

            <select
              value={selectedPosition}
              onChange={(event) =>
                setSelectedPosition(event.target.value)
              }
            >
              {positionOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="alumni-sort-indicator">
            <ArrowDownUp size={17} />

            <span>Most recent first</span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="alumni-leadership-message">
            <div className="alumni-leadership-spinner" />

            <p>Loading former leaders...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="alumni-leadership-message alumni-leadership-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredLeaders.length === 0 && (
          <div className="alumni-leadership-message">
            <Users size={36} />

            <h3>No former leaders found</h3>

            <p>
              No former leaders match the selected filters.
              Try changing the gender or position.
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && filteredLeaders.length > 0 && (
          <>
            <div className="alumni-leadership-results">
              Showing <strong>{filteredLeaders.length}</strong>{" "}
              former{" "}
              {selectedPosition === "All"
                ? "leaders"
                : selectedPosition.toLowerCase() + "s"}
            </div>

            <div className="alumni-leadership-grid">
              {filteredLeaders.map((leader, index) => {
                const position = normalizePosition(
                  leader.position
                );

                const gender = normalizeGender(leader.gender);

                return (
                  <article
                    className="alumni-leader-card"
                    key={
                      leader.id ??
                      `${getLeaderName(leader)}-${position}-${index}`
                    }
                  >
                    <div className="alumni-leader-photo">
                      {leader.photo_url ? (
                        <img
                          src={leader.photo_url}
                          alt={getLeaderName(leader)}
                          loading="lazy"
                        />
                      ) : (
                        <UserRound
                          size={54}
                          strokeWidth={1.1}
                        />
                      )}

                      <span className="alumni-leader-rank">
                        <Crown size={15} />
                        {position}
                      </span>
                    </div>

                    <div className="alumni-leader-info">
                      <span className="alumni-leader-gender">
                        {gender === "M"
                          ? "Men's Athletics"
                          : gender === "F"
                            ? "Women's Athletics"
                            : "Athletics"}
                      </span>

                      <h3>{getLeaderName(leader)}</h3>

                      <p className="alumni-leader-branch">
                        {leader.branch ||
                          "IIT (BHU) Varanasi"}

                        {leader.entry_year
                          ? ` · Entry ${leader.entry_year}`
                          : ""}
                      </p>

                      <div className="alumni-leader-tenure">
                        <CalendarDays size={17} />

                        <span>{getTenureLabel(leader)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}