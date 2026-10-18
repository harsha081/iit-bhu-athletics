import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Calendar,
  MapPin,
} from "lucide-react";

import {
  getSportsFests,
  addSportsFest,
  deleteSportsFest,
} from "../api/sportsFests";

const initialForm = {
  name: "",
  year: new Date().getFullYear(),
  location: "",
  start_date: "",
  end_date: "",
  description: "",
};

export default function SportsFestManagement() {
  const [fests, setFests] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadFests() {
    setLoading(true);
    setError("");

    try {
      const data = await getSportsFests();
      setFests(data);
    } catch (err) {
      console.error("Failed to load sports fests:", err);
      setError("Unable to load sports fests. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  const timeoutId = setTimeout(() => {
    loadFests();
  }, 0);

  return () => clearTimeout(timeoutId);
}, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter the sports fest name.");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setSaving(true);

    try {
      await addSportsFest({
        ...form,
        name: form.name.trim(),
        year: Number(form.year),
        location: form.location.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description.trim() || null,
      });

      setForm({
        ...initialForm,
        year: new Date().getFullYear(),
      });

      setSuccess("Sports fest created successfully.");
      await loadFests();
    } catch (err) {
      console.error("Failed to create sports fest:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create sports fest. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name, year) {
    const confirmed = window.confirm(
      `Delete ${name} (${year})? Its linked performance records will be preserved, but their sports fest reference will be cleared.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteSportsFest(id);
      setSuccess("Sports fest deleted successfully.");
      await loadFests();
    } catch (err) {
      console.error("Failed to delete sports fest:", err);
      setError(
        err.response?.data?.message ||
          "Unable to delete sports fest."
      );
    }
  }

  return (
    <main className="section page-container">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">MANAGEMENT PORTAL</span>
          <h1 className="page-title">Sports Fest Management</h1>
          <p className="muted">
            Create and manage athletics competitions.
          </p>
        </div>

        <Link to="/admin/dashboard" className="secondary-button">
          <ArrowLeft size={18} />
          Dashboard
        </Link>
      </div>

      {/* Create sports fest */}
      <section className="dashboard-panel sports-fest-form-panel">
        <div className="dashboard-toolbar">
          <h2>
            <Plus size={20} />
            Create Sports Fest
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="sports-fest-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Sports Fest Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Inter-IIT, Spardha, Outfest"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input
                id="year"
                name="year"
                type="number"
                min="1900"
                max="2100"
                value={form.year}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. IIT BHU, Varanasi"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="start_date">Start Date</label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date</label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group form-full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="Enter competition details..."
                value={form.description}
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
            <Plus size={18} />
            {saving ? "Creating..." : "Create Sports Fest"}
          </button>
        </form>
      </section>

      {/* Existing sports fests */}
      <section className="dashboard-panel">
        <div className="dashboard-toolbar">
          <h2>
            <Trophy size={21} />
            Existing Sports Fests
          </h2>

          <button
            type="button"
            className="secondary-button"
            onClick={loadFests}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading && <p>Loading sports fests...</p>}

        {!loading && fests.length === 0 && !error && (
          <p className="muted">
            No sports fests yet. Create your first competition above.
          </p>
        )}

        {!loading && fests.length > 0 && (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Location</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {fests.map((fest) => (
                  <tr key={fest.id}>
                    <td>{fest.name}</td>
                    <td>{fest.year}</td>
                    <td>
                      {fest.location ? (
                        <span className="fest-detail">
                          <MapPin size={15} />
                          {fest.location}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className="fest-detail">
                        <Calendar size={15} />
                        {fest.start_date
                          ? new Date(
                              `${String(fest.start_date).slice(0, 10)}T00:00:00`
                            ).toLocaleDateString()
                          : "TBD"}
                        {" – "}
                        {fest.end_date
                          ? new Date(
                              `${String(fest.end_date).slice(0, 10)}T00:00:00`
                            ).toLocaleDateString()
                          : "TBD"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(fest.id, fest.name, fest.year)
                        }
                        aria-label={`Delete ${fest.name} ${fest.year}`}
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