import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Medal,
  Search,
  Filter,
  Users,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import "./Events.css";

const API_BASE_URL = "http://localhost:5000/api";
const API_ORIGIN = "http://localhost:5000";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [athletesError, setAthletesError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGender, setSelectedGender] = useState("M");
  const [search, setSearch] = useState("");
  const [expandedAthlete, setExpandedAthlete] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        setLoadingEvents(true);
        setEventsError("");
        const response = await fetch(`${API_BASE_URL}/events`);
        if (!response.ok) throw new Error("Failed to fetch events.");
        const data = await response.json();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading events:", error);
        if (!cancelled) {
          setEventsError("Unable to load events. Please check that the backend server is running.");
        }
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesGender = String(event.gender || "").toUpperCase() === selectedGender;
      const matchesCategory =
        selectedCategory === "All" ||
        String(event.category || "").toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = String(event.name || "").toLowerCase().includes(normalizedSearch);
      return matchesGender && matchesCategory && matchesSearch;
    });
  }, [events, selectedGender, selectedCategory, search]);

  async function handleEventClick(event) {
    if (selectedEvent?.id === event.id) return;

    setSelectedEvent(event);
    setAthletes([]);
    setExpandedAthlete(null);
    setAthletesError("");
    setLoadingAthletes(true);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${event.id}/athletes`);
      if (!response.ok) throw new Error("Failed to fetch participating athletes.");
      const data = await response.json();
      setAthletes(Array.isArray(data.athletes) ? data.athletes : []);
    } catch (error) {
      console.error("Error loading event athletes:", error);
      setAthletesError("Unable to load athletes for this event. Please try again.");
    } finally {
      setLoadingAthletes(false);
    }
  }

  function resetSelectionIfFilteredOut(nextGender, nextCategory, nextSearch = search) {
    if (!selectedEvent) return;
    const normalizedSearch = nextSearch.trim().toLowerCase();
    const stillVisible = events.some((event) =>
      event.id === selectedEvent.id &&
      String(event.gender || "").toUpperCase() === nextGender &&
      (nextCategory === "All" ||
        String(event.category || "").toLowerCase() === nextCategory.toLowerCase()) &&
      String(event.name || "").toLowerCase().includes(normalizedSearch)
    );

    if (!stillVisible) {
      setSelectedEvent(null);
      setAthletes([]);
      setAthletesError("");
      setExpandedAthlete(null);
    }
  }

  function handleGenderChange(gender) {
    resetSelectionIfFilteredOut(gender, selectedCategory);
    setSelectedGender(gender);
  }

  function handleCategoryChange(category) {
    resetSelectionIfFilteredOut(selectedGender, category);
    setSelectedCategory(category);
  }

  function handleSearchChange(value) {
    resetSelectionIfFilteredOut(selectedGender, selectedCategory, value);
    setSearch(value);
  }

  function formatResult(result, category) {
    if (result === null || result === undefined || result === "") return "No result recorded";
    const value = Number(result);
    if (!Number.isFinite(value)) return String(result);
    const formatted = value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
    return category?.toLowerCase() === "field" ? `${formatted} m` : formatted;
  }

  function formatDate(date) {
    if (!date) return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function formatPosition(position) {
    if (position === null || position === undefined || position === "") return "—";
    const value = Number(position);
    if (!Number.isInteger(value) || value < 1) return "—";
    const suffix =
      value % 100 >= 11 && value % 100 <= 13
        ? "th"
        : value % 10 === 1
          ? "st"
          : value % 10 === 2
            ? "nd"
            : value % 10 === 3
              ? "rd"
              : "th";
    return `${value}${suffix}`;
  }

  function resolvePhotoUrl(photoUrl) {
    if (!photoUrl) return "";
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
    return `${API_ORIGIN}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
  }

  return (
    <main className="section page-container events-page events-layout-page">
      <span className="eyebrow">TRACK & FIELD</span>
      <h1 className="page-title">Athletics Events</h1>
      <p className="muted events-intro">
        Explore athletics events and discover the athletes representing IIT BHU in each discipline.
      </p>

      <section className="events-filter-panel events-filter-panel-new" aria-label="Event filters">
        <label className="events-search events-search-new">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search athletics events..."
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            aria-label="Search athletics events"
          />
        </label>

        <div className="events-filter-group" aria-label="Gender">
          {[
            { label: "Male", value: "M" },
            { label: "Female", value: "F" },
          ].map((gender) => (
            <button
              type="button"
              key={gender.value}
              className={`event-filter-button ${selectedGender === gender.value ? "active" : ""}`}
              onClick={() => handleGenderChange(gender.value)}
              aria-pressed={selectedGender === gender.value}
            >
              {gender.label}
            </button>
          ))}
        </div>

        <div className="events-filter-group events-discipline-filters" aria-label="Event category">
          <Filter size={20} aria-hidden="true" />
          {["All", "Track", "Field", "Other"].map((category) => (
            <button
              type="button"
              key={category}
              className={`event-filter-button ${selectedCategory === category ? "active" : ""}`}
              onClick={() => handleCategoryChange(category)}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {loadingEvents && (
        <p className="muted events-status">
          <LoaderCircle size={18} className="spinning" /> Loading events...
        </p>
      )}

      {eventsError && (
        <div className="error-message events-error" role="alert">
          <p>{eventsError}</p>
          <button type="button" className="secondary-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {!loadingEvents && !eventsError && (
        <section className="events-browser">
          <aside className="events-sidebar" aria-label="Athletics events list">
            <div className="events-sidebar-heading">
              <div>
                <span className="eyebrow">DISCIPLINES</span>
                <h2>Events</h2>
              </div>
              <span className="events-count">{visibleEvents.length}</span>
            </div>

            <div className="events-sidebar-list">
              {visibleEvents.map((event) => {
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <button
                    type="button"
                    key={event.id}
                    className={`events-sidebar-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleEventClick(event)}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span className="events-sidebar-item-copy">
                      <span className="events-sidebar-category">{event.category || "Athletics"}</span>
                      <strong>{event.name}</strong>
                    </span>
                    <ArrowRight size={17} className="events-sidebar-arrow" />
                  </button>
                );
              })}

              {visibleEvents.length === 0 && (
                <div className="events-sidebar-empty">
                  <Search size={22} />
                  <p>No events match these filters.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="events-detail-panel" aria-live="polite">
            {!selectedEvent ? (
              <div className="events-select-prompt">
                <span className="events-prompt-icon"><Users size={28} /></span>
                <h2>Select an event</h2>
                <p className="muted">
                  Choose an event from the list to view participating athletes, their best results, and competition history.
                </p>
              </div>
            ) : (
              <>
                <div className="events-detail-heading">
                  <div>
                    <span className="eyebrow">{(selectedEvent.category || "ATHLETICS").toUpperCase()} EVENT</span>
                    <h2>{selectedEvent.name}</h2>
                    <p className="muted">
                      {selectedEvent.gender?.toUpperCase() === "M" ? "Male" : "Female"} participants
                    </p>
                  </div>
                  <span className="events-detail-count">
                    <Users size={17} />
                    {loadingAthletes ? "…" : athletes.length} {athletes.length === 1 ? "athlete" : "athletes"}
                  </span>
                </div>

                {loadingAthletes && (
                  <div className="events-detail-state">
                    <LoaderCircle size={22} className="spinning" />
                    <span>Loading participating athletes...</span>
                  </div>
                )}

                {athletesError && (
                  <div className="error-message events-error" role="alert">
                    <p>{athletesError}</p>
                    <button type="button" className="secondary-button" onClick={() => handleEventClick(selectedEvent)}>
                      Retry
                    </button>
                  </div>
                )}

                {!loadingAthletes && !athletesError && athletes.length === 0 && (
                  <div className="events-detail-empty">
                    <Users size={30} />
                    <h3>No athletes assigned yet</h3>
                    <p className="muted">Athletes assigned to this event will appear here.</p>
                  </div>
                )}

                {!loadingAthletes && !athletesError && athletes.length > 0 && (
                  <div className="events-athlete-table-wrap">
                    <table className="public-results-table events-athlete-table">
                      <thead>
                        <tr>
                          <th>Athlete</th>
                          <th>Year of Entry</th>
                          <th>Branch</th>
                          <th>Best Result</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {athletes.map((athlete) => {
                          const athleteId = athlete.athlete_id;
                          const isExpanded = expandedAthlete === athleteId;
                          const history = Array.isArray(athlete.performance_history)
                            ? athlete.performance_history
                            : [];

                          return (
                            <Fragment key={athleteId}>
                              <tr>
                                <td>
                                  <div className="event-athlete-name">
                                    {athlete.photo_url ? (
                                      <img
                                        src={resolvePhotoUrl(athlete.photo_url)}
                                        alt=""
                                        className="event-athlete-photo"
                                        loading="lazy"
                                        onError={(event) => {
                                          event.currentTarget.style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <span className="event-athlete-avatar">
                                        {athlete.athlete_name?.charAt(0).toUpperCase() || "A"}
                                      </span>
                                    )}
                                    <strong>{athlete.athlete_name}</strong>
                                  </div>
                                </td>
                                <td>{athlete.entry_year || "—"}</td>
                                <td>{athlete.branch || "—"}</td>
                                <td className="events-best-result">
                                  {athlete.best_result != null
                                    ? formatResult(athlete.best_result, selectedEvent.category)
                                    : "No result recorded"}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="secondary-button events-view-details"
                                    onClick={() => setExpandedAthlete(isExpanded ? null : athleteId)}
                                    aria-expanded={isExpanded}
                                  >
                                    {isExpanded ? "Hide Details" : "View Details"}
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="events-history-row">
                                  <td colSpan={5}>
                                    <div className="event-athlete-details">
                                      <h3>{athlete.athlete_name} — Performance History</h3>
                                      {history.length === 0 ? (
                                        <p className="muted">No competition results have been recorded for this athlete in this event yet.</p>
                                      ) : (
                                        <div className="events-history-table-wrap">
                                          <table className="public-results-table">
                                            <thead>
                                              <tr>
                                                <th>Result</th>
                                                <th>Competition</th>
                                                <th>Year</th>
                                                <th>Position</th>
                                                <th>Medal</th>
                                                <th>Date</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {history.map((record) => (
                                                <tr key={record.id}>
                                                  <td>{formatResult(record.result, selectedEvent.category)}</td>
                                                  <td>{record.sports_fest_name || record.competition || "—"}</td>
                                                  <td>
                                                    {record.sports_fest_year ||
                                                      (record.record_date ? String(record.record_date).slice(0, 4) : "—")}
                                                  </td>
                                                  <td>{formatPosition(record.position)}</td>
                                                  <td>
                                                    {record.medal ? (
                                                      <span className={`public-medal ${String(record.medal).toLowerCase()}`}>
                                                        <Medal size={15} /> {record.medal}
                                                      </span>
                                                    ) : "—"}
                                                  </td>
                                                  <td>{formatDate(record.record_date)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      <div className="events-athlete-summary">
                                        <span><Trophy size={16} /> Best result: <strong>{athlete.best_result != null ? formatResult(athlete.best_result, selectedEvent.category) : "Not available"}</strong></span>
                                        <span><CalendarDays size={16} /> Entry year: <strong>{athlete.entry_year || "—"}</strong></span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
