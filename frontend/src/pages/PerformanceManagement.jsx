import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Plus,
  Trash2,
  RefreshCw,
  Medal,
} from "lucide-react";

import { getAthletes } from "../api/athletes";
import { getSportsFests } from "../api/sportsFests";
import {
  getPerformances,
  addPerformance,
  deletePerformance,
} from "../api/performances";
import { API_BASE_URL } from "../api/client";

const initialForm = {
  athlete_id: "",
  event_id: "",
  sports_fest_id: "",
  result: "",
  record_date: "",
  competition: "",
  position: "",
  medal: "",
};

export default function PerformanceManagement() {
  const [athletes, setAthletes] = useState([]);
  const [events, setEvents] = useState([]);
  const [fests, setFests] = useState([]);
  const [performances, setPerformances] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [athleteData, festData, performanceData] =
        await Promise.all([
          getAthletes(),
          getSportsFests(),
          getPerformances(),
        ]);

      setAthletes(athleteData);
      setFests(festData);
      setPerformances(performanceData);

      // Events are loaded separately because the athlete API
      // returns assigned events rather than the full event list.
      const response = await fetch(`${API_BASE_URL}/events`);

      if (!response.ok) {
        throw new Error("Unable to load events.");
      }

      const eventData = await response.json();
      setEvents(eventData);
    } catch (err) {
      console.error("Error loading performance data:", err);
      setError(
        "Unable to load data. Check that the backend APIs are running."
      );
    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  const timeoutId = setTimeout(() => {
    loadData();
  }, 0);

  return () => clearTimeout(timeoutId);
}, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "athlete_id") {
      setForm((previous) => ({
        ...previous,
        athlete_id: value,
        event_id: "",
      }));
    }
  }

  const selectedAthlete = athletes.find(
    (athlete) => String(athlete.id) === form.athlete_id
  );

  const availableEvents = selectedAthlete
    ? events.filter((event) =>
        (selectedAthlete.events || []).some(
          (athleteEvent) =>
            String(athleteEvent.id) === String(event.id)
        )
      )
    : events;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.athlete_id ||
      !form.event_id ||
      !form.sports_fest_id ||
      form.result === ""
    ) {
      setError(
        "Please select an athlete, event, sports fest, and enter a result."
      );
      return;
    }

    const numericResult = Number(form.result);

    if (!Number.isFinite(numericResult) || numericResult < 0) {
      setError("Result must be a valid non-negative number.");
      return;
    }

    setSaving(true);

    try {
      await addPerformance({
        athlete_id: Number(form.athlete_id),
        event_id: Number(form.event_id),
        sports_fest_id: Number(form.sports_fest_id),
        result: numericResult,
        record_date: form.record_date || null,
        competition: form.competition.trim() || null,
        position: form.position ? Number(form.position) : null,
        medal: form.medal || null,
      });

      setForm(initialForm);
      setSuccess("Performance recorded successfully.");

      await loadData();
    } catch (err) {
      console.error("Error saving performance:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save performance."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this performance record?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deletePerformance(id);
      setSuccess("Performance deleted successfully.");
      await loadData();
    } catch (err) {
      console.error("Error deleting performance:", err);
      setError("Unable to delete performance.");
    }
  }

  return (
    <main className="section page-container">
      {/* Heading */}
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">MANAGEMENT PORTAL</span>

          <h1 className="page-title">
            Performance Management
          </h1>

          <p className="muted">
            Record and manage athletes' competition results.
          </p>
        </div>

        <Link
          to="/admin/dashboard"
          className="secondary-button"
        >
          <ArrowLeft size={18} />
          Dashboard
        </Link>
      </div>

      {/* Form */}
      <section className="dashboard-panel performance-form-panel">
        <div className="dashboard-toolbar">
          <h2>
            <Plus size={20} />
            Record Performance
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="performance-form"
        >
          <div className="performance-form-grid">
            <div className="form-group">
              <label htmlFor="sports_fest_id">
                Sports Fest *
              </label>

              <select
                id="sports_fest_id"
                name="sports_fest_id"
                value={form.sports_fest_id}
                onChange={handleChange}
                required
              >
                <option value="">Select sports fest</option>

                {fests.map((fest) => (
                  <option key={fest.id} value={fest.id}>
                    {fest.name} ({fest.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="athlete_id">Athlete *</label>

              <select
                id="athlete_id"
                name="athlete_id"
                value={form.athlete_id}
                onChange={handleChange}
                required
              >
                <option value="">Select athlete</option>

                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="event_id">Event *</label>

              <select
                id="event_id"
                name="event_id"
                value={form.event_id}
                onChange={handleChange}
                required
              >
                <option value="">Select event</option>

                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.gender || "All"})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="result">
                Result * (time, distance, or height)
              </label>

              <input
                id="result"
                name="result"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 11.25"
                value={form.result}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="position">Position</label>

              <input
                id="position"
                name="position"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 1"
                value={form.position}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="medal">Medal</label>

              <select
                id="medal"
                name="medal"
                value={form.medal}
                onChange={handleChange}
              >
                <option value="">No medal</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="record_date">Record Date</label>

              <input
                id="record_date"
                name="record_date"
                type="date"
                value={form.record_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="competition">
                Competition Details
              </label>

              <input
                id="competition"
                name="competition"
                type="text"
                placeholder="e.g. Men's 100m Final"
                value={form.competition}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="success-message">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Trophy size={18} />
            {saving ? "Saving..." : "Save Performance"}
          </button>
        </form>
      </section>

      {/* Existing performances */}
      <section className="dashboard-panel">
        <div className="dashboard-toolbar">
          <h2>
            <Medal size={21} />
            Recorded Performances
          </h2>

          <button
            type="button"
            className="secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading && <p>Loading performances...</p>}

        {!loading &&
          !error &&
          performances.length === 0 && (
            <p className="muted">
              No performances recorded yet.
            </p>
          )}

        {!loading && performances.length > 0 && (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Event</th>
                  <th>Sports Fest</th>
                  <th>Result</th>
                  <th>Position</th>
                  <th>Medal</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {performances.map((performance) => (
                  <tr key={performance.id}>
                    <td>
                      {performance.athlete_name || "Unknown"}
                    </td>

                    <td>
                      {performance.event_name || "Unknown"}
                    </td>

                    <td>
                      {performance.sports_fest_name
                        ? `${performance.sports_fest_name} ${
                            performance.sports_fest_year || ""
                          }`
                        : performance.competition || "—"}
                    </td>

                    <td>{performance.result}</td>

                    <td>
                      {performance.position
                        ? `${performance.position}${
                            performance.position === 1
                              ? "st"
                              : performance.position === 2
                                ? "nd"
                                : performance.position === 3
                                  ? "rd"
                                  : "th"
                          }`
                        : "—"}
                    </td>

                    <td>
                      {performance.medal ? (
                        <span
                          className={`performance-medal ${performance.medal.toLowerCase()}`}
                        >
                          {performance.medal}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(performance.id)
                        }
                        aria-label={`Delete performance ${performance.id}`}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
