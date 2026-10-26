import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Medal, Search, Trophy, Users } from "lucide-react";
import { getSportsFests } from "../api/sportsFests";
import { getPerformances } from "../api/performances";
import "./SportsMeets.css";

function formatDate(value) {
  if (!value) return "TBD";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "TBD"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPosition(position) {
  const number = Number(position);
  if (!Number.isInteger(number) || number < 1) return "—";
  const suffix = number % 10 === 1 && number % 100 !== 11 ? "st" : number % 10 === 2 && number % 100 !== 12 ? "nd" : number % 10 === 3 && number % 100 !== 13 ? "rd" : "th";
  return `${number}${suffix}`;
}

export default function SportsMeets() {
  const [fests, setFests] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [selectedFestId, setSelectedFestId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [athleteSearch, setAthleteSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSportsMeets() {
      try {
        const [festData, performanceData] = await Promise.all([getSportsFests(), getPerformances()]);
        if (cancelled) return;
        const allFests = Array.isArray(festData) ? festData : [];
        setFests(allFests);
        setPerformances(Array.isArray(performanceData) ? performanceData : []);
        setSelectedFestId(allFests[0]?.id ?? null);
      } catch (loadError) {
        console.error("Unable to load sports meets:", loadError);
        if (!cancelled) setError("Unable to load sports meets. Please check that the backend is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSportsMeets();
    return () => { cancelled = true; };
  }, []);

  const selectedFest = fests.find((fest) => String(fest.id) === String(selectedFestId));
  const festPerformances = useMemo(
    () => performances.filter((performance) => String(performance.sports_fest_id) === String(selectedFestId)),
    [performances, selectedFestId]
  );
  const availableEvents = useMemo(
    () => [...new Set(festPerformances.map((performance) => performance.event_name).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second)),
    [festPerformances]
  );
  const visiblePerformances = useMemo(() => {
    const normalizedSearch = athleteSearch.trim().toLowerCase();
    return festPerformances
      .filter((performance) => selectedEvent === "all" || performance.event_name === selectedEvent)
      .filter((performance) => {
        if (selectedGender === "all") return true;
        const gender = String(performance.athlete_gender || "").trim().toLowerCase();
        return selectedGender === "male" ? gender === "m" || gender === "male" : gender === "f" || gender === "female";
      })
      .filter((performance) => String(performance.athlete_name || "").toLowerCase().includes(normalizedSearch))
      .slice()
      .sort((first, second) =>
        String(first.event_name || "").localeCompare(String(second.event_name || "")) ||
        String(first.athlete_name || "").localeCompare(String(second.athlete_name || ""))
      );
  }, [athleteSearch, festPerformances, selectedEvent, selectedGender]);

  return (
    <main className="section page-container sports-meets-page">
      <header className="sports-meets-header">
        <span className="eyebrow">COMPETITION ARCHIVE</span>
        <h1 className="page-title">Sports Meets</h1>
        <p className="muted">Explore IIT (BHU) Athletics by competition—Inter IIT, Spardha, and every recorded meet.</p>
      </header>

      {loading && <p>Loading sports meets...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      {!loading && !error && fests.length === 0 && (
        <div className="sports-meets-empty"><Trophy size={34} /><h2>No sports meets yet</h2><p>Competition records will appear here once added by the athletics administration.</p></div>
      )}

      {!loading && !error && fests.length > 0 && (
        <>
          <section className="sports-meets-grid" aria-label="Sports meet selection">
            {fests.map((fest) => {
              const resultCount = performances.filter((performance) => String(performance.sports_fest_id) === String(fest.id)).length;
              const selected = String(fest.id) === String(selectedFestId);
              return (
                <button key={fest.id} type="button" className={`sports-meet-card ${selected ? "is-selected" : ""}`} onClick={() => { setSelectedFestId(fest.id); setSelectedEvent("all"); setSelectedGender("all"); setAthleteSearch(""); }} aria-pressed={selected}>
                  <span className="sports-meet-year">{fest.year}</span>
                  <Trophy size={23} />
                  <h2>{fest.name}</h2>
                  <p>{fest.description || "Competition results and athlete performances."}</p>
                  <span className="sports-meet-meta"><Users size={15} /> {resultCount} {resultCount === 1 ? "result" : "results"}</span>
                </button>
              );
            })}
          </section>

          {selectedFest && (
            <section className="sports-meet-details" aria-live="polite">
              <div className="sports-meet-details-heading">
                <div><span className="eyebrow">SELECTED MEET</span><h2>{selectedFest.name} <span>{selectedFest.year}</span></h2></div>
                <div className="sports-meet-date-location">
                  <span><CalendarDays size={16} /> {formatDate(selectedFest.start_date)}{selectedFest.end_date && selectedFest.end_date !== selectedFest.start_date ? ` – ${formatDate(selectedFest.end_date)}` : ""}</span>
                  {selectedFest.location && <span><MapPin size={16} /> {selectedFest.location}</span>}
                </div>
              </div>
              {selectedFest.description && <p className="sports-meet-description">{selectedFest.description}</p>}

              {festPerformances.length === 0 ? (
                <p className="muted sports-meet-no-results">No athlete results have been recorded for this meet yet.</p>
              ) : (
                <>
                  <section className="sports-meet-filters" aria-label="Filter sports meet results">
                    <label className="sports-meet-search"><Search size={18} /><input type="search" value={athleteSearch} onChange={(event) => setAthleteSearch(event.target.value)} placeholder="Search athlete name..." aria-label="Search athlete name" /></label>
                    <label className="sports-meet-event-filter">Event<select value={selectedEvent} onChange={(event) => setSelectedEvent(event.target.value)}><option value="all">All events</option>{availableEvents.map((eventName) => <option key={eventName} value={eventName}>{eventName}</option>)}</select></label>
                    <div className="sports-meet-gender-filter" aria-label="Filter by athlete gender"><span>Gender</span>{["all", "male", "female"].map((gender) => <button key={gender} type="button" className={selectedGender === gender ? "active" : ""} onClick={() => setSelectedGender(gender)} aria-pressed={selectedGender === gender}>{gender === "all" ? "All" : gender === "male" ? "Male" : "Female"}</button>)}</div>
                  </section>
                  <p className="sports-meet-result-count">Showing {visiblePerformances.length} of {festPerformances.length} results, ordered by event.</p>
                  {visiblePerformances.length === 0 ? <p className="muted sports-meet-no-results">No results match the selected filters.</p> : <div className="sports-meet-results-wrap">
                    <table className="sports-meet-results">
                      <thead><tr><th>Athlete</th><th>Event</th><th>Result</th><th>Position</th><th>Medal</th><th>Date</th></tr></thead>
                      <tbody>{visiblePerformances.map((performance) => <tr key={performance.id}><td>{performance.athlete_name || "—"}</td><td>{performance.event_name || "—"}</td><td>{performance.result ?? "—"}</td><td>{formatPosition(performance.position)}</td><td>{performance.medal ? <span className={`sports-meet-medal ${String(performance.medal).toLowerCase()}`}><Medal size={14} /> {performance.medal}</span> : "—"}</td><td>{formatDate(performance.record_date)}</td></tr>)}</tbody>
                    </table>
                  </div>}
                </>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
