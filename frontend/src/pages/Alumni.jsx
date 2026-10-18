import { useEffect, useState } from "react";
import AthleteCard from "../components/AthleteCard";
import { getAthletes } from "../api/athletes";

export default function Alumni() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAlumni() {
      try {
        const data = await getAthletes("Alumni");
        setAthletes(data);
      } catch (err) {
        console.error("Error fetching alumni:", err);
        setError("Unable to load alumni. Check the backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchAlumni();
  }, []);

  return (
    <main className="section page-container">
      <span className="eyebrow">OUR LEGACY</span>
      <h1 className="page-title">Athletics Alumni</h1>

      <p className="muted">
        Celebrating the athletes who have represented IIT BHU
        and graduated from the institute.
      </p>

      {loading && <p>Loading alumni...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && athletes.length === 0 && (
        <p className="muted">
          No alumni have been added yet.
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