import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Pin,
  RefreshCw,
  Trophy,
} from "lucide-react";

import { getAnnouncements } from "../api/announcements";

const categories = [
  "All",
  "Trials",
  "Results",
  "Achievements",
  "Sports Fest",
  "General",
];

export default function Updates() {
  const [announcements, setAnnouncements] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnnouncements() {
    setLoading(true);
    setError("");

    try {
      const data = await getAnnouncements();

      const list = Array.isArray(data)
        ? data
        : data?.announcements || [];

      const sorted = [...list].sort((a, b) => {
        const pinnedDifference =
          Number(Boolean(b.is_pinned)) -
          Number(Boolean(a.is_pinned));

        if (pinnedDifference !== 0) {
          return pinnedDifference;
        }

        const dateA = new Date(
          a.published_at || a.publish_at || 0
        ).getTime();

        const dateB = new Date(
          b.published_at || b.publish_at || 0
        ).getTime();

        return dateB - dateA;
      });

      setAnnouncements(sorted);
    } catch (err) {
      console.error("Failed to load updates:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load updates. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Load announcements once when the page mounts.
  // Deferring the request to a microtask avoids synchronous state updates
  // directly inside the effect and supports cleanup if the page unmounts.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadAnnouncements();
    };

    queueMicrotask(() => {
      if (!cancelled) {
        load();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAnnouncements =
    activeCategory === "All"
      ? announcements
      : announcements.filter(
          (announcement) =>
            announcement.category === activeCategory
        );

  function formatDate(announcement) {
    const date =
      announcement.published_at ||
      announcement.publish_at;

    if (!date) return null;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <main className="updates-page">
      {/* Page Hero */}
      <section className="updates-hero">
        <div className="updates-hero-content">
          <Link to="/" className="updates-back-link">
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <span className="eyebrow">
            IIT (BHU) VARANASI · ATHLETICS
          </span>

          <h1>
            Latest <span>Updates.</span>
          </h1>

          <p>
            Stay connected with the latest athletics
            announcements, competition results, achievements,
            and upcoming trials.
          </p>

          <div className="updates-hero-stats">
            <div>
              <Bell size={20} />
              <span>
                {announcements.length} Published Updates
              </span>
            </div>
          </div>
        </div>

        <div className="updates-hero-decoration">
          <Trophy size={140} strokeWidth={0.8} />
        </div>
      </section>

      {/* Updates Listing */}
      <section className="section updates-content">
        <div className="updates-heading">
          <div>
            <span className="eyebrow">
              STAY INFORMED
            </span>

            <h2>Announcements & News</h2>

            <p>
              Everything happening in IIT BHU Athletics,
              all in one place.
            </p>
          </div>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={loadAnnouncements}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "updates-spinning" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Category Filters */}
        <div className="updates-category-filters">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={
                activeCategory === category ? "active" : ""
              }
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="updates-message">
            <RefreshCw
              size={28}
              className="updates-spinning"
            />
            <p>Loading the latest updates...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="updates-message updates-error">
            <p>{error}</p>

            <button
              type="button"
              className="primary-button"
              onClick={loadAnnouncements}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          !error &&
          filteredAnnouncements.length === 0 && (
            <div className="updates-message">
              <Bell size={32} />

              <h3>No updates found</h3>

              <p>
                {activeCategory === "All"
                  ? "New announcements will appear here when published."
                  : `There are no published updates in ${activeCategory} yet.`}
              </p>
            </div>
          )}

        {/* Announcement Cards */}
        {!loading &&
          !error &&
          filteredAnnouncements.length > 0 && (
            <div className="updates-grid">
              {filteredAnnouncements.map((announcement) => (
                <article
                  className="updates-card"
                  key={announcement.id}
                >
                  {announcement.image_url ? (
                    <img
                      src={announcement.image_url}
                      alt={announcement.title}
                      className="updates-card-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="updates-card-placeholder">
                      <Trophy
                        size={42}
                        strokeWidth={1.2}
                      />
                      <span>IIT BHU ATHLETICS</span>
                    </div>
                  )}

                  <div className="updates-card-body">
                    <div className="updates-card-meta">
                      <span className="updates-category-badge">
                        {announcement.category || "General"}
                      </span>

                      {announcement.is_pinned && (
                        <span className="updates-pinned-badge">
                          <Pin size={13} />
                          Pinned
                        </span>
                      )}
                    </div>

                    <h3>{announcement.title}</h3>

                    <p className="updates-card-description">
                      {announcement.content ||
                        "Read the latest update from IIT BHU Athletics."}
                    </p>

                    <div className="updates-card-footer">
                      {formatDate(announcement) && (
                        <span>
                          <CalendarDays size={15} />
                          {formatDate(announcement)}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>

      {/* Bottom CTA */}
      <section className="updates-bottom-cta">
        <Trophy size={32} />

        <h2>One Team. One Spirit.</h2>

        <p>
          Follow the journey of IIT BHU Athletics.
        </p>

        <Link to="/athletes" className="primary-button">
          Meet Our Athletes <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
