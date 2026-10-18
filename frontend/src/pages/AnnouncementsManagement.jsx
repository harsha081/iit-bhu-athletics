import { useEffect, useState } from "react";
import {
  Bell,
  Pencil,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Save,
  Megaphone,
} from "lucide-react";

import {
  getAllAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../api/announcements";

const categories = [
  "Trials",
  "Results",
  "Achievements",
  "Sports Fest",
  "General",
];

const initialForm = {
  title: "",
  content: "",
  category: "General",
  image_url: "",
  is_published: false,
  is_pinned: false,
  publish_at: "",
};

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filter, setFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function fetchAnnouncements() {
      try {
        const data = await getAllAnnouncements();

        if (!cancelled) {
          setAnnouncements(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load announcements."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnnouncements();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    setError("");

    try {
      const data = await getAllAnnouncements();

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load announcements."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEditing(announcement) {
    setEditingId(announcement.id);

    setForm({
      title: announcement.title || "",
      content: announcement.content || "",
      category: announcement.category || "General",
      image_url: announcement.image_url || "",
      is_published: Boolean(announcement.is_published),
      is_pinned: Boolean(announcement.is_pinned),
      publish_at: toDateTimeLocal(announcement.publish_at),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter an announcement title.");
      return;
    }

    if (
      form.publish_at &&
      new Date(form.publish_at).getTime() <= Date.now() &&
      form.is_published
    ) {
      // Past dates are allowed; they publish immediately.
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: form.image_url.trim() || null,
      publish_at: form.publish_at
        ? new Date(form.publish_at).toISOString()
        : null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateAnnouncement(editingId, payload);
        setSuccess("Announcement updated successfully.");
      } else {
        await addAnnouncement(payload);
        setSuccess("Announcement created successfully.");
      }

      resetForm();
      await loadAnnouncements();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the announcement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(announcement) {
    const confirmed = window.confirm(
      `Delete "${announcement.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteAnnouncement(announcement.id);

      if (editingId === announcement.id) {
        resetForm();
      }

      setSuccess("Announcement deleted successfully.");
      await loadAnnouncements();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete the announcement."
      );
    }
  }

  async function togglePublication(announcement) {
    const payload = {
      title: announcement.title,
      content: announcement.content || "",
      category: announcement.category || "General",
      image_url: announcement.image_url || null,
      is_published: !announcement.is_published,
      is_pinned: Boolean(announcement.is_pinned),
      publish_at: announcement.publish_at || null,
    };

    setError("");
    setSuccess("");

    try {
      await updateAnnouncement(announcement.id, payload);

      setSuccess(
        payload.is_published
          ? "Announcement published."
          : "Announcement moved to drafts."
      );

      await loadAnnouncements();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update publication status."
      );
    }
  }

  const filteredAnnouncements = announcements.filter(
    (announcement) => {
      if (filter === "Published") {
        return announcement.is_published;
      }

      if (filter === "Drafts") {
        return !announcement.is_published;
      }

      return true;
    }
  );

  const publishedCount = announcements.filter(
    (item) => item.is_published
  ).length;

  const draftCount = announcements.length - publishedCount;

  return (
    <div className="admin-page announcements-management">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h1>Updates Management</h1>

          <p>
            Publish announcements, share results, and keep the
            IIT BHU Athletics community informed.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-btn"
          onClick={loadAnnouncements}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="announcement-stats">
        <div className="announcement-stat-card">
          <span>Total Updates</span>
          <strong>{announcements.length}</strong>
        </div>

        <div className="announcement-stat-card">
          <span>Published</span>
          <strong>{publishedCount}</strong>
        </div>

        <div className="announcement-stat-card">
          <span>Drafts</span>
          <strong>{draftCount}</strong>
        </div>
      </div>

      {error && (
        <div className="announcement-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="announcement-alert success">
          {success}
        </div>
      )}

      <section className="announcement-form-panel">
        <div className="announcement-section-heading">
          <div className="announcement-heading-icon">
            {editingId ? (
              <Pencil size={20} />
            ) : (
              <Megaphone size={20} />
            )}
          </div>

          <div>
            <h2>
              {editingId ? "Edit Update" : "Create New Update"}
            </h2>

            <p>
              Add the details that should appear in the Updates
              section.
            </p>
          </div>
        </div>

        <form
          className="announcement-form"
          onSubmit={handleSubmit}
        >
          <div className="announcement-form-grid">
            <label className="announcement-field full-width">
              <span>Announcement Title *</span>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Athletics Trials Announced"
                maxLength={200}
                required
              />
            </label>

            <label className="announcement-field">
              <span>Category</span>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="announcement-field">
              <span>Image URL (optional)</span>

              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </label>

            <label className="announcement-field full-width">
              <span>Description</span>

              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write the announcement details..."
                rows={5}
              />
            </label>

            <label className="announcement-field full-width">
              <span>Schedule Publication (optional)</span>

              <input
                type="datetime-local"
                name="publish_at"
                value={form.publish_at}
                onChange={handleChange}
              />

              <small>
                Leave empty to publish immediately when
                publication is enabled.
              </small>
            </label>
          </div>

          <div className="announcement-checkboxes">
            <label>
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
              />

              <span>Publish this update</span>
            </label>

            <label>
              <input
                type="checkbox"
                name="is_pinned"
                checked={form.is_pinned}
                onChange={handleChange}
              />

              <Pin size={15} />
              <span>Pin to top</span>
            </label>
          </div>

          <div className="announcement-form-actions">
            <button
              type="submit"
              className="admin-primary-btn"
              disabled={saving}
            >
              <Save size={17} />

              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Update"}
            </button>

            {editingId && (
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={resetForm}
              >
                <X size={17} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="announcement-list-panel">
        <div className="announcement-list-header">
          <div>
            <h2>All Updates</h2>
            <p>Manage your published announcements and drafts.</p>
          </div>

          <div className="announcement-filter-tabs">
            {["All", "Published", "Drafts"].map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="announcement-empty">
            <RefreshCw size={25} />
            <p>Loading updates...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="announcement-empty">
            <Bell size={30} />
            <h3>No updates found</h3>
            <p>Create your first announcement using the form above.</p>
          </div>
        ) : (
          <div className="announcement-list">
            {filteredAnnouncements.map((announcement) => (
              <article
                className="announcement-admin-card"
                key={announcement.id}
              >
                {announcement.image_url && (
                  <img
                    className="announcement-admin-image"
                    src={announcement.image_url}
                    alt=""
                  />
                )}

                <div className="announcement-admin-content">
                  <div className="announcement-badges">
                    <span className="announcement-category">
                      {announcement.category || "General"}
                    </span>

                    <span
                      className={
                        announcement.is_published
                          ? "announcement-status published"
                          : "announcement-status draft"
                      }
                    >
                      {announcement.is_published
                        ? "Published"
                        : "Draft"}
                    </span>

                    {announcement.is_pinned && (
                      <span className="announcement-pinned">
                        <Pin size={12} />
                        Pinned
                      </span>
                    )}
                  </div>

                  <h3>{announcement.title}</h3>

                  <p>
                    {announcement.content || "No description provided."}
                  </p>

                  <small>
                    {announcement.publish_at
                      ? `Scheduled: ${new Date(
                          announcement.publish_at
                        ).toLocaleString()}`
                      : announcement.published_at
                        ? `Published: ${new Date(
                            announcement.published_at
                          ).toLocaleString()}`
                        : "Not published yet"}
                  </small>
                </div>

                <div className="announcement-card-actions">
                  <button
                    type="button"
                    title={
                      announcement.is_published
                        ? "Move to drafts"
                        : "Publish"
                    }
                    onClick={() =>
                      togglePublication(announcement)
                    }
                  >
                    {announcement.is_published ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                  <button
                    type="button"
                    title="Edit announcement"
                    onClick={() => startEditing(announcement)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    title="Delete announcement"
                    className="danger"
                    onClick={() => handleDelete(announcement)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}