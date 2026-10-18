import { useEffect, useState } from "react";
import AthleteCard from "../components/AthleteCard";
import { getAthletes } from "../api/athletes";

export default function Athletes() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAthletes() {
      try {
        const data = await getAthletes("Active");
        setAthletes(data);
      } catch (err) {
        console.error("Error fetching active athletes:", err);
        setError("Unable to load current players. Check the backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchAthletes();
  }, []);

  return (
    <main className="section page-container">
      <span className="eyebrow">THE TEAM</span>
      <h1 className="page-title">Current Players</h1>

      <p className="muted">
        Meet the active athletes currently representing IIT BHU.
      </p>

      {loading && <p>Loading current players...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && athletes.length === 0 && (
        <p className="muted">
          No current players have been added yet.
        </p>
      )}

      {!loading && !error && athletes.length > 0 && (
        <div className="athlete-grid">
          {athletes.map((athlete) => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </div>
      )}
    </main>
  );
}