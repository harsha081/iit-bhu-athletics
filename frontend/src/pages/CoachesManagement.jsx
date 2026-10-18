import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { getCoaches, addCoach, updateCoach, deleteCoach } from "../api/coaches";

const initialForm = {
  name: "",
  role: "",
  contact: "",
  photo_url: "",
  is_active: true,
};

export default function CoachesManagement() {
  const [coaches, setCoaches] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");

  const loadCoaches = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCoaches();
      setCoaches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load coaches:", err);
      setError(err.response?.data?.message || "Failed to load coaches.");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const fetchCoaches = async () => {
    try {
      const data = await getCoaches();
      setCoaches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load coaches:", err);
      setError(
        err.response?.data?.message || "Failed to load coaches."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchCoaches();
}, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (coach) => {
    setForm({
      name: coach.name || "",
      role: coach.role || "",
      contact: coach.contact || "",
      photo_url: coach.photo_url || "",
      is_active: coach.is_active === true,
    });

    setEditingId(coach.id);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter the coach's name.");
      return;
    }

    if (!editingId && typeof form.is_active !== "boolean") {
      setError("Please select a valid coach status.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || null,
      contact: form.contact.trim() || null,
      photo_url: form.photo_url.trim() || null,
      is_active: form.is_active,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateCoach(editingId, payload);
        setSuccess("Coach updated successfully!");
      } else {
        await addCoach(payload);
        setSuccess("Coach added successfully!");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadCoaches();
    } catch (err) {
      console.error("Failed to save coach:", err);
      setError(err.response?.data?.message || "Failed to save coach.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coach) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${coach.name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteCoach(coach.id);

      if (editingId === coach.id) {
        setForm(initialForm);
        setEditingId(null);
      }

      setSuccess("Coach deleted successfully!");
      await loadCoaches();
    } catch (err) {
      console.error("Failed to delete coach:", err);
      setError(err.response?.data?.message || "Failed to delete coach.");
    }
  };

  const filteredCoaches = coaches.filter((coach) => {
    if (filter === "active") return coach.is_active === true;
    if (filter === "retired") return coach.is_active === false;
    return true;
  });

  const activeCount = coaches.filter(
    (coach) => coach.is_active === true
  ).length;

  const retiredCount = coaches.filter(
    (coach) => coach.is_active === false
  ).length;

  return (
    <main className="page-container section">
      {/* Header */}
      <div className="dashboard-heading">
        <div>
          <Link to="/admin/dashboard" className="text-link">
            <ArrowLeft size={17} /> Back to Dashboard
          </Link>

          <h1 className="page-title">Coaches Management</h1>

          <p className="muted">
            Manage current and retired IIT BHU Athletics coaches.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadCoaches}
          disabled={loading}
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      {/* Statistics */}
      <section className="coach-stats">
        <article className="dashboard-panel coach-stat-card">
          <Users size={25} />
          <div>
            <h2>{coaches.length}</h2>
            <p>Total Coaches</p>
          </div>
        </article>

        <article className="dashboard-panel coach-stat-card">
          <Users size={25} />
          <div>
            <h2>{activeCount}</h2>
            <p>Active Coaches</p>
          </div>
        </article>

        <article className="dashboard-panel coach-stat-card">
          <Users size={25} />
          <div>
            <h2>{retiredCount}</h2>
            <p>Retired Coaches</p>
          </div>
        </article>
      </section>

      {/* Add/Edit Form */}
      <section className="dashboard-panel coach-form-panel">
        <div className="dashboard-toolbar">
          <h2>
            {editingId !== null ? (
              <Pencil size={21} />
            ) : (
              <Plus size={22} />
            )}

            {editingId !== null ? "Edit Coach" : "Add New Coach"}
          </h2>

          {editingId !== null && (
            <button
              type="button"
              className="secondary-button"
              onClick={resetForm}
            >
              <X size={17} /> Cancel Edit
            </button>
          )}
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="coach-success-message" role="status">
            {success}
          </p>
        )}

        <form className="coach-form" onSubmit={handleSubmit}>
          <div className="coach-form-grid">
            <div className="coach-form-group">
              <label htmlFor="coach-name">Full Name *</label>
              <input
                id="coach-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter coach's name"
                required
              />
            </div>

            <div className="coach-form-group">
              <label htmlFor="coach-role">Role / Specialization</label>
              <input
                id="coach-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Head Coach, Throws Coach"
              />
            </div>

            <div className="coach-form-group">
              <label htmlFor="coach-contact">Contact</label>
              <input
                id="coach-contact"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="Phone number or email"
              />
            </div>

            <div className="coach-form-group">
              <label htmlFor="coach-photo">Photo URL</label>
              <input
                id="coach-photo"
                name="photo_url"
                type="url"
                value={form.photo_url}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="coach-form-group">
              <label htmlFor="coach-status">Status</label>
              <select
                id="coach-status"
                name="is_active"
                value={String(form.is_active)}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    is_active: event.target.value === "true",
                  }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Retired</option>
              </select>
            </div>
          </div>

          <div className="coach-form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {editingId !== null ? <Save size={18} /> : <Plus size={18} />}

              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Coach"
                  : "Add Coach"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Coach List */}
      <section className="dashboard-panel coach-list-panel">
        <div className="dashboard-toolbar">
          <h2>All Coaches</h2>

          <select
            className="coach-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter coaches by status"
          >
            <option value="all">All Coaches</option>
            <option value="active">Active Coaches</option>
            <option value="retired">Retired Coaches</option>
          </select>
        </div>

        {loading ? (
          <p className="muted">Loading coaches...</p>
        ) : filteredCoaches.length === 0 ? (
          <div className="no-results">
            <UserRound size={35} />
            <h3>No coaches found</h3>
            <p>Add a coach or select another filter.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCoaches.map((coach) => (
                  <tr key={coach.id}>
                    <td>
                      <div className="coach-table-person">
                        {coach.photo_url ? (
                          <img
                            src={coach.photo_url}
                            alt={coach.name}
                            className="coach-table-photo"
                          />
                        ) : (
                          <div className="coach-table-placeholder">
                            <UserRound size={20} />
                          </div>
                        )}

                        <strong>{coach.name}</strong>
                      </div>
                    </td>

                    <td>{coach.role || "—"}</td>
                    <td>{coach.contact || "—"}</td>

                    <td>
                      <span
                        className={`athlete-status-badge ${
                          coach.is_active ? "active-status" : "alumni-status"
                        }`}
                      >
                        {coach.is_active ? "Active" : "Retired"}
                      </span>
                    </td>

                    <td>
                      <div className="athlete-action-buttons">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEdit(coach)}
                        >
                          <Pencil size={15} /> Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDelete(coach)}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
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