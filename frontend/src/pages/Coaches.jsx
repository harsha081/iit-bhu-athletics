import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Users,
  UserRound,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";

import { getCoaches } from "../api/coaches";
import { getMediaUrl } from "../utils/mediaUrl";

export default function Coaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const data = await getCoaches();
        setCoaches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load coaches:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load coaches. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  const activeCoaches = coaches.filter(
    (coach) => coach.is_active === true
  );

  const retiredCoaches = coaches.filter(
    (coach) => coach.is_active === false
  );

  const visibleCoaches =
    filter === "active" ? activeCoaches : retiredCoaches;

  return (
    <main className="page-container">
      {/* Hero */}
      <section className="coaches-hero">
        <span className="eyebrow">THE PEOPLE BEHIND THE PERFORMANCE</span>

        <h1>
          Our <span>Coaches</span>
        </h1>

        <p>
          Meet the mentors who train, guide, and inspire IIT BHU Athletics
          athletes to achieve excellence.
        </p>

        <div className="coaches-hero-stats">
          <div>
            <Users size={25} />
            <strong>{loading ? "—" : activeCoaches.length}</strong>
            <span>Active Coaches</span>
          </div>

          <div>
            <BriefcaseBusiness size={25} />
            <strong>{loading ? "—" : retiredCoaches.length}</strong>
            <span>Retired Coaches</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="section coaches-content">
        <div className="coaches-heading">
          <div>
            <span className="eyebrow">OUR MENTORS</span>
            <h2>
              {filter === "active"
                ? "Current Coaches"
                : "Former Coaches"}
            </h2>
          </div>

          <div className="coaches-filters">
            <button
              type="button"
              className={`coaches-filter-button ${
                filter === "active" ? "active" : ""
              }`}
              onClick={() => setFilter("active")}
            >
              Active ({activeCoaches.length})
            </button>

            <button
              type="button"
              className={`coaches-filter-button ${
                filter === "retired" ? "active" : ""
              }`}
              onClick={() => setFilter("retired")}
            >
              Retired ({retiredCoaches.length})
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="coaches-message">
            <RefreshCw size={25} />
            <p>Loading coaches...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="coaches-message coaches-error">
            <p>{error}</p>

            <button
              type="button"
              className="secondary-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleCoaches.length === 0 && (
          <div className="coaches-message">
            <UserRound size={45} />
            <h3>No coaches found</h3>
            <p>
              Coach profiles will appear here once records are added by the
              athletics administration.
            </p>
          </div>
        )}

        {/* Coach cards */}
        {!loading && !error && visibleCoaches.length > 0 && (
          <div className="coaches-grid">
            {visibleCoaches.map((coach) => (
              <article className="public-coach-card" key={coach.id}>
                <div className="public-coach-photo">
                  {coach.photo_url ? (
                    <img
                      src={getMediaUrl(coach.photo_url)}
                      alt={coach.name}
                      loading="lazy"
                    />
                  ) : (
                    <UserRound size={65} strokeWidth={1.1} />
                  )}

                  <span
                    className={`public-coach-status ${
                      coach.is_active ? "coach-active" : "coach-retired"
                    }`}
                  >
                    {coach.is_active ? "Active" : "Retired"}
                  </span>
                </div>

                <div className="public-coach-info">
                  <span className="public-coach-role">
                    <BriefcaseBusiness size={15} />
                    {coach.role || "Athletics Coach"}
                  </span>

                  <h3>{coach.name}</h3>

                  <div className="public-coach-divider" />

                  <p>
                    {coach.is_active
                      ? "Supporting the next generation of IIT BHU athletes."
                      : "Recognized for contributions to IIT BHU Athletics."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Admin link */}
        <div className="coaches-admin-link">
          <Link to="/admin/login" className="text-link">
            Manage Coaches <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Back link */}
      <div className="coaches-back-link">
        <Link to="/" className="text-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
