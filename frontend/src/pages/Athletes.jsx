import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import AthleteCard from "../components/AthleteCard";
import { getAthletes } from "../api/athletes";
import { getPerformances } from "../api/performances";
import "./Athletes.css";

export default function Athletes() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [performances, setPerformances] = useState([]);

  useEffect(() => {
    async function fetchAthletes() {
      try {
        const [athletesResult, performancesResult] = await Promise.allSettled([
          getAthletes("Active"),
          getPerformances(),
        ]);

        if (athletesResult.status === "rejected") {
          throw athletesResult.reason;
        }

        setAthletes(athletesResult.value);
        if (performancesResult.status === "fulfilled") {
          setPerformances(Array.isArray(performancesResult.value) ? performancesResult.value : []);
        } else {
          console.error("Unable to load performance history:", performancesResult.reason);
        }
      } catch (err) {
        console.error("Error fetching active athletes:", err);
        setError("Unable to load current players. Check the backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchAthletes();
  }, []);

  const displayedAthletes = useMemo(() => {
    const matchesGender = (athlete) => {
      if (genderFilter === "all") return true;

      const gender = String(athlete.gender || "").trim().toLowerCase();
      return genderFilter === "male"
        ? gender === "m" || gender === "male"
        : gender === "f" || gender === "female";
    };

    const matchesSearch = (athlete) =>
      athlete.name?.toLowerCase().includes(searchTerm.trim().toLowerCase());

    const getEntryYear = (athlete) => {
      if (
        athlete.entry_year === null ||
        athlete.entry_year === undefined ||
        String(athlete.entry_year).trim() === ""
      ) {
        return null;
      }

      const year = Number(athlete.entry_year);
      return Number.isFinite(year) && year > 0 ? year : null;
    };

    return athletes
      .map((athlete, originalIndex) => ({
        athlete,
        originalIndex,
        entryYear: getEntryYear(athlete),
      }))
      .filter(({ athlete }) => matchesGender(athlete) && matchesSearch(athlete))
      .sort((a, b) => {
        if (a.entryYear === null && b.entryYear === null) {
          return a.originalIndex - b.originalIndex;
        }
        if (a.entryYear === null) return 1;
        if (b.entryYear === null) return -1;
        return a.entryYear - b.entryYear || a.originalIndex - b.originalIndex;
      })
      .map(({ athlete }) => athlete);
  }, [athletes, genderFilter, searchTerm]);

  return (
    <main className="section page-container">
      <span className="eyebrow">THE TEAM</span>
      <h1 className="page-title">Current Players</h1>

      <p className="muted">
        Meet the active athletes currently representing IIT BHU.
      </p>

      {loading && <p>Loading current players...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && athletes.length > 0 && (
        <div className="athlete-tools">
          <label className="athlete-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search athlete by name"
              aria-label="Search athlete by name"
            />
          </label>

          <div className="athlete-filter" aria-label="Filter athletes by gender">
            <span className="athlete-filter-label">Filter team</span>
            <div className="athlete-filter-controls">
              {[
                ["all", "All"],
                ["male", "Male"],
                ["female", "Female"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`athlete-filter-button ${genderFilter === value ? "is-selected" : ""}`}
                  aria-pressed={genderFilter === value}
                  onClick={() => setGenderFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && athletes.length === 0 && (
        <p className="muted">
          No current players have been added yet.
        </p>
      )}

      {!loading && !error && displayedAthletes.length > 0 && (
        <div className="athlete-grid">
          {displayedAthletes.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              performanceHistory={performances.filter(
                (performance) => String(performance.athlete_id) === String(athlete.id)
              )}
            />
          ))}
        </div>
      )}

      {!loading && !error && athletes.length > 0 && displayedAthletes.length === 0 && (
        <p className="muted athlete-filter-empty">
          No athletes match your current search and filter.
        </p>
      )}
    </main>
  );
}
