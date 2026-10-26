import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import AthleteCard from "../components/AthleteCard";
import { getAthletes } from "../api/athletes";
import "./Alumni.css";


export default function Alumni() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const visibleAlumni = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...athletes]
      .filter((athlete) =>
        String(athlete.name || "").toLowerCase().includes(normalizedSearch)
      )
      .sort((first, second) => {
        const firstYear = Number(first.entry_year) || 0;
        const secondYear = Number(second.entry_year) || 0;

        return (
          secondYear - firstYear ||
          String(first.name || "").localeCompare(String(second.name || ""))
        );
      });
  }, [athletes, searchTerm]);

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
        <>
          <label className="alumni-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search alumni by name"
              aria-label="Search alumni by name"
            />
          </label>

          {visibleAlumni.length > 0 ? (
            <div className="alumni-grid">
              {visibleAlumni.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} />
              ))}
            </div>
          ) : (
            <p className="muted alumni-search-empty">No alumni match your search.</p>
          )}
        </>
      )}
    </main>
  );
}
