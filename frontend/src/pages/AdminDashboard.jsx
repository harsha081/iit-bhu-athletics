import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAthletes,
  deleteAthlete,
} from "../api/athletes";

import {
  Users,
  Trophy,
  Crown,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  LogOut,
  Megaphone,
} from "lucide-react";

export default function AdminDashboard() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch athletes from the backend
  async function loadAthletes() {
    setLoading(true);
    setError("");

    try {
      const data = await getAthletes();
      setAthletes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading athletes:", error);
      setError("Unable to load athletes. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

  // Load athletes when the dashboard opens
useEffect(() => {
  const fetchAthletes = async () => {
    try {
      const data = await getAthletes();
      setAthletes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading athletes:", error);
      setError("Unable to load athletes. Check the backend.");
    } finally {
      setLoading(false);
    }
  };

  fetchAthletes();
}, []);

  // Delete an athlete
  async function handleDelete(id, name) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteAthlete(id);
      await loadAthletes();
    } catch (error) {
      console.error("Error deleting athlete:", error);
      setError("Unable to delete athlete.");
    }
  }

  return (
    <main className="section page-container">
      {/* Dashboard heading */}
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">MANAGEMENT PORTAL</span>

          <h1 className="page-title">Athletics Dashboard</h1>

          <p className="muted">
            Manage athletes, coaches, leadership, sporting events, and
            competitions.
          </p>
        </div>

        <Link to="/" className="secondary-button">
          <LogOut size={18} />
          Public Website
        </Link>
      </div>

      {/* Dashboard statistics */}
      <section className="dashboard-stats">
        <article className="stat-card">
          <Users size={28} />

          <div>
            <p>Total Athletes</p>
            <h2>{athletes.length}</h2>
          </div>
        </article>
      </section>

      {/* Management navigation */}
      <section className="dashboard-panel">
        <div className="dashboard-toolbar">
          <h2>Management Modules</h2>
        </div>

        <div className="management-modules">
          {/* Athlete Management */}
          <Link
            to="/admin/athletes/new"
            className="management-module-card"
          >
            <div className="management-module-icon">
              <Users size={26} />
            </div>

            <div>
              <h3>Athlete Management</h3>
              <p className="muted">
                Add athletes and assign their participating events.
              </p>
            </div>

            <ArrowRight size={20} />
          </Link>

          {/* Coaches Management */}
          <Link
            to="/admin/coaches"
            className="management-module-card"
          >
            <div className="management-module-icon">
              <Users size={26} />
            </div>

            <div>
              <h3>Coaches Management</h3>
              <p className="muted">
                Add, edit, and manage active and retired coaches.
              </p>
            </div>

            <ArrowRight size={20} />
          </Link>

          {/* Sports Fest Management */}
          <Link
            to="/admin/sports-fests"
            className="management-module-card"
          >
            <div className="management-module-icon">
              <Trophy size={26} />
            </div>

            <div>
              <h3>Sports Fest Management</h3>
              <p className="muted">
                Create and manage Inter-IIT, Spardha, Outfest, and other
                competitions.
              </p>
            </div>

            <ArrowRight size={20} />
          </Link>

          {/* Performance Management */}
          <Link
            to="/admin/performances"
            className="management-module-card"
          >
            <div className="management-module-icon">
              <Trophy size={26} />
            </div>

            <div>
              <h3>Performance Management</h3>
              <p className="muted">
                Record competition results, athlete positions, medals, and
                performance history.
              </p>
            </div>

            <ArrowRight size={20} />
          </Link>

          {/* Leadership Management */}
          <Link
            to="/admin/leadership"
            className="management-module-card"
          >
            <div className="management-module-icon">
              <Crown size={26} />
            </div>

            <div>
              <h3>Leadership Management</h3>
              <p className="muted">
                Assign men's and women's captains and vice-captains, and
                manage leadership history.
              </p>
            </div>

            <ArrowRight size={20} />
          </Link>
          {/* Updates Management */}
          <Link
            to="/admin/announcements"
            className="management-module-card"
          >
            <div className="management-module-icon">
              <Megaphone size={26} />
            </div>

            <div>
              <h3>Updates Management</h3>

              <p className="muted">
                Create announcements, publish results, share trials updates,
                and manage athletics news.
              </p>
            </div>

            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Athlete management table */}
      <section className="dashboard-panel">
        <div className="dashboard-toolbar">
          <h2>Athlete Management</h2>

          <Link
            to="/admin/athletes/new"
            className="primary-button"
          >
            <Plus size={18} />
            Add Athlete
          </Link>
        </div>

        {/* Loading message */}
        {loading && <p>Loading athletes...</p>}

        {/* Error message */}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}

        {/* Empty state */}
        {!loading && !error && athletes.length === 0 && (
          <p className="muted">
            No athletes found. Add your first athlete.
          </p>
        )}

        {/* Athletes table */}
        {!loading && !error && athletes.length > 0 && (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Entry Year</th>
                  <th>Status</th>
                  <th>Participating Events</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {athletes.map((athlete) => {
                  const events = Array.isArray(athlete.events)
                    ? athlete.events
                    : [];

                  const status = athlete.status || "Active";

                  return (
                    <tr key={athlete.id}>
                      <td>{athlete.name}</td>

                      <td>{athlete.branch || "—"}</td>

                      <td>{athlete.entry_year || "—"}</td>

                      <td>
                        <span
                          className={
                            status === "Alumni"
                              ? "athlete-status-badge alumni-status"
                              : "athlete-status-badge active-status"
                          }
                        >
                          {status === "Alumni" ? "Alumni" : "Active"}
                        </span>
                      </td>

                      <td>
                        {events.length > 0 ? (
                          <div className="admin-event-list">
                            {events.map((event) => (
                              <span
                                key={event.id ?? event.name}
                                className="admin-event-badge"
                              >
                                <Trophy size={13} />
                                {event.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="muted">
                            No events assigned
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="athlete-action-buttons">
                          {/* Edit athlete */}
                          <Link
                            to={`/admin/athletes/edit/${athlete.id}`}
                            className="edit-button"
                            aria-label={`Edit ${athlete.name}`}
                            title={`Edit ${athlete.name}`}
                          >
                            <Pencil size={16} />
                            Edit
                          </Link>

                          {/* Delete athlete */}
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleDelete(athlete.id, athlete.name)
                            }
                            aria-label={`Delete ${athlete.name}`}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Refresh button */}
        <button
          type="button"
          className="secondary-button refresh-button"
          onClick={loadAthletes}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>
    </main>
  );
}