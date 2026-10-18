import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  RefreshCw,
  Pencil,
  X,
  Save,
} from "lucide-react";

import { getAthletes } from "../api/athletes";

import {
  getLeadership,
  addLeadership,
  updateLeadership,
  deleteLeadership,
} from "../api/leadership";

const createInitialForm = () => ({
  athlete_id: "",
  position: "Captain",
  gender: "M",
  start_year: new Date().getFullYear(),
  end_year: "",
  is_current: true,
});

export default function LeadershipManagement() {
  const [athletes, setAthletes] = useState([]);
  const [leadership, setLeadership] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [athleteData, leadershipData] = await Promise.all([
        getAthletes(),
        getLeadership(),
      ]);

      setAthletes(Array.isArray(athleteData) ? athleteData : []);
      setLeadership(
        Array.isArray(leadershipData) ? leadershipData : []
      );
    } catch (err) {
      console.error("Failed to load leadership data:", err);
      setError("Unable to load leadership data. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  const fetchData = async () => {
    try {
      const [athleteData, leadershipData] = await Promise.all([
        getAthletes(),
        getLeadership(),
      ]);

      setAthletes(Array.isArray(athleteData) ? athleteData : []);
      setLeadership(
        Array.isArray(leadershipData)
          ? leadershipData
          : leadershipData?.leadership || []
      );
    } catch (error) {
      console.error("Failed to load leadership data:", error);
      setError("Failed to load athletes and leadership data.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // Only active athletes of the selected gender can be assigned
  // to current leadership positions.
  const eligibleAthletes = athletes.filter(
    (athlete) =>
      athlete.status === "Active" &&
      athlete.gender === form.gender
  );

  // During editing, include the existing athlete even if they are
  // no longer active, so historical records can still be edited.
  const availableAthletes = [
    ...eligibleAthletes,
    ...athletes.filter(
      (athlete) =>
        editingId !== null &&
        String(athlete.id) === String(form.athlete_id) &&
        !eligibleAthletes.some(
          (eligible) => eligible.id === athlete.id
        )
    ),
  ];

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "gender" ? { athlete_id: "" } : {}),
    }));
  }

  function handleEdit(record) {
    setEditingId(record.id);
    setError("");
    setSuccess("");

    setForm({
      athlete_id: String(record.athlete_id ?? ""),
      position: record.position || "Captain",
      gender: record.gender || "M",
      start_year: record.start_year || new Date().getFullYear(),
      end_year: record.end_year ?? "",
      is_current: Boolean(record.is_current),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(createInitialForm());
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.athlete_id) {
      setError("Please select an athlete.");
      return;
    }

    const startYear = Number(form.start_year);
    const endYear =
      form.end_year === "" ? null : Number(form.end_year);

    if (!Number.isInteger(startYear) || startYear < 2000) {
      setError("Please enter a valid start year.");
      return;
    }

    if (
      !form.is_current &&
      endYear !== null &&
      (!Number.isInteger(endYear) || endYear < startYear)
    ) {
      setError("End year must be greater than or equal to start year.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        athlete_id: Number(form.athlete_id),
        start_year: startYear,
        end_year: form.is_current ? null : endYear,
      };

      if (editingId !== null) {
        await updateLeadership(editingId, payload);
        setSuccess("Leadership record updated successfully.");
      } else {
        await addLeadership(payload);
        setSuccess("Leadership assignment saved successfully.");
      }

      setEditingId(null);
      setForm(createInitialForm());

      await loadData();
    } catch (err) {
      console.error("Failed to save leadership:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save leadership assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const confirmed = window.confirm(
      `Delete the leadership record for ${record.name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteLeadership(record.id);

      if (editingId === record.id) {
        cancelEdit();
      }

      setSuccess("Leadership record deleted successfully.");
      await loadData();
    } catch (err) {
      console.error("Failed to delete leadership:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete leadership record."
      );
    }
  }

  const currentLeadership = leadership.filter(
    (record) => record.is_current
  );

  const previousLeadership = leadership.filter(
    (record) => !record.is_current
  );

  return (
    <main className="section page-container">
      <Link to="/admin/dashboard" className="text-link">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">TEAM MANAGEMENT</span>

          <h1 className="page-title">Leadership Management</h1>

          <p className="muted">
            Manage captains, vice-captains, and leadership history
            for both men's and women's teams.
          </p>
        </div>
      </div>

      {/* Add/Edit Leadership Form */}
      <section className="dashboard-panel leadership-form-panel">
        <h2>
          {editingId !== null ? (
            <Pencil size={21} />
          ) : (
            <Users size={21} />
          )}

          {editingId !== null
            ? "Edit Leadership Record"
            : "Assign Leadership"}
        </h2>

        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}

        {success && (
          <p className="leadership-success" role="status">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="leadership-form">
          <div className="leadership-form-grid">
            <div>
              <label htmlFor="gender">Team *</label>

              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="M">Men's Team</option>
                <option value="F">Women's Team</option>
              </select>
            </div>

            <div>
              <label htmlFor="position">Position *</label>

              <select
                id="position"
                name="position"
                value={form.position}
                onChange={handleChange}
                required
              >
                <option value="Captain">Captain</option>
                <option value="Vice-Captain">Vice-Captain</option>
              </select>
            </div>

            <div>
              <label htmlFor="athlete_id">Select Athlete *</label>

              <select
                id="athlete_id"
                name="athlete_id"
                value={form.athlete_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose an athlete</option>

                {availableAthletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} — {athlete.branch || "Branch N/A"}
                    {athlete.status !== "Active" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>

              {eligibleAthletes.length === 0 &&
                editingId === null && (
                  <small className="muted">
                    No active athletes found for this team.
                  </small>
                )}
            </div>

            <div>
              <label htmlFor="start_year">Start Year *</label>

              <input
                id="start_year"
                name="start_year"
                type="number"
                min="2000"
                max="2100"
                value={form.start_year}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="end_year">End Year</label>

              <input
                id="end_year"
                name="end_year"
                type="number"
                min={form.start_year}
                max="2100"
                value={form.end_year}
                onChange={handleChange}
                disabled={form.is_current}
                placeholder="Optional"
              />
            </div>

            <label className="leadership-checkbox">
              <input
                type="checkbox"
                name="is_current"
                checked={form.is_current}
                onChange={handleChange}
              />

              Current leadership
            </label>
          </div>

          <div className="leadership-form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {editingId !== null ? (
                <Save size={18} />
              ) : (
                <Plus size={18} />
              )}

              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Leadership"
                  : "Assign Leadership"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
                disabled={saving}
              >
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Current Leadership */}
      <section className="dashboard-panel">
        <div className="dashboard-toolbar">
          <h2>Current Leadership</h2>

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

        {loading ? (
          <p>Loading leadership records...</p>
        ) : currentLeadership.length === 0 ? (
          <p className="muted">
            No current leadership assigned yet.
          </p>
        ) : (
          <LeadershipTable
            records={currentLeadership}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      {/* Previous Leadership */}
      <section className="dashboard-panel">
        <h2>Previous Leadership</h2>

        {loading ? (
          <p>Loading history...</p>
        ) : previousLeadership.length === 0 ? (
          <p className="muted">
            No previous leadership records yet.
          </p>
        ) : (
          <LeadershipTable
            records={previousLeadership}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>
    </main>
  );
}

function LeadershipTable({ records, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Athlete</th>
            <th>Team</th>
            <th>Position</th>
            <th>Term</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.name}</td>

              <td>{record.gender === "F" ? "Women" : "Men"}</td>

              <td>{record.position || "—"}</td>

              <td>
                {record.start_year || "—"} –{" "}
                {record.is_current
                  ? "Present"
                  : record.end_year || "—"}
              </td>

              <td>
                <div className="athlete-action-buttons">
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => onEdit(record)}
                    aria-label={`Edit leadership record for ${record.name}`}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => onDelete(record)}
                    aria-label={`Delete leadership record for ${record.name}`}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}