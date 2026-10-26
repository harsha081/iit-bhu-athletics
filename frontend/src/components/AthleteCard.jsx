import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, Medal, Trophy, UserRound, X } from "lucide-react";
import { getMediaUrl } from "../utils/mediaUrl";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPosition(position) {
  const value = Number(position);
  if (!Number.isInteger(value) || value < 1) return "—";
  const suffix = value % 10 === 1 && value % 100 !== 11 ? "st" : value % 10 === 2 && value % 100 !== 12 ? "nd" : value % 10 === 3 && value % 100 !== 13 ? "rd" : "th";
  return `${value}${suffix}`;
}

export default function AthleteCard({ athlete, performanceHistory = [] }) {
  const events = Array.isArray(athlete.events) ? athlete.events : [];
  const [photoFailed, setPhotoFailed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const photoUrl = getMediaUrl(athlete.photo_url);

  useEffect(() => {
    if (!detailsOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setDetailsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [detailsOpen]);

  return (
    <>
      <article className="athlete-card">
      <div className="athlete-avatar">
        {photoUrl && !photoFailed ? (
          <img
            src={photoUrl}
            alt={athlete.name}
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <UserRound size={48} />
        )}
      </div>

      <div className="athlete-info">
        <h3>{athlete.name}</h3>

        <p>{athlete.branch || "Branch not provided"}</p>

        {athlete.entry_year && (
          <p className="athlete-entry-year">
            <Calendar size={15} />
            Entry Year: {athlete.entry_year}
          </p>
        )}

        <div className="athlete-events">
          <h4>
            <Trophy size={16} />
            Participating Events
          </h4>

          {events.length > 0 ? (
            <div className="athlete-event-badges">
              {events.map((event) => (
                <span
                  className="athlete-event-badge"
                  key={event.id ?? event.name}
                >
                  {event.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">No events assigned yet.</p>
          )}
        </div>

        <button
          type="button"
          className="athlete-details-button"
          onClick={() => setDetailsOpen(true)}
        >
          View Details
          <ChevronDown size={16} />
        </button>
      </div>
      </article>

      {detailsOpen && createPortal(
        <div className="athlete-details-modal-backdrop" role="presentation" onMouseDown={() => setDetailsOpen(false)}>
          <section
            className="athlete-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`athlete-history-title-${athlete.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="athlete-details-modal-header">
              <div>
                <span className="eyebrow">ATHLETE PROFILE</span>
                <h2 id={`athlete-history-title-${athlete.id}`}>{athlete.name} — Performance History</h2>
                <p>{athlete.branch || "IIT (BHU) Varanasi"} {athlete.entry_year ? `· Entry ${athlete.entry_year}` : ""}</p>
              </div>
              <button type="button" className="athlete-modal-close" onClick={() => setDetailsOpen(false)} aria-label="Close athlete details"><X size={20} /></button>
            </header>

            {performanceHistory.length === 0 ? (
              <p className="muted athlete-modal-empty">No sports fest results have been recorded yet.</p>
            ) : (
              <div className="athlete-history-table-wrap">
                <table>
                  <thead>
                    <tr><th>Event</th><th>Fest / Competition</th><th>Year</th><th>Result</th><th>Position</th><th>Medal</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {performanceHistory.map((record) => (
                      <tr key={record.id}>
                        <td>{record.event_name || "—"}</td>
                        <td>{record.sports_fest_name || record.competition || "—"}</td>
                        <td>{record.sports_fest_year || (record.record_date ? String(record.record_date).slice(0, 4) : "—")}</td>
                        <td>{record.result ?? "—"}</td>
                        <td>{formatPosition(record.position)}</td>
                        <td>{record.medal ? <span className={`athlete-medal ${String(record.medal).toLowerCase()}`}><Medal size={13} />{record.medal}</span> : "—"}</td>
                        <td>{formatDate(record.record_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
