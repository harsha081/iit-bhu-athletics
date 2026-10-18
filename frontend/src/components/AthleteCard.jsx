import { UserRound, Calendar, Trophy } from "lucide-react";

export default function AthleteCard({ athlete }) {
  const events = Array.isArray(athlete.events) ? athlete.events : [];

  return (
    <article className="athlete-card">
      <div className="athlete-avatar">
        {athlete.photo_url ? (
          <img src={athlete.photo_url} alt={athlete.name} />
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
      </div>
    </article>
  );
}