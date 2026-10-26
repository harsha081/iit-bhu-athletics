import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  addAthlete,
  getAthletes,
  updateAthlete,
} from "../api/athletes";
import { ArrowLeft, Save } from "lucide-react";
import "./AddAthlete.css";

const initialForm = {
  name: "",
  gender: "M",
  branch: "",
  entry_year: "",
  photo_url: "",
  contact: "",
  status: "Active",
};

const eventCategories = {
  "Track Events": [
    "100m",
    "200m",
    "400m",
    "800m",
    "1500m",
    "5000m",
    "10000m",
    "110m Hurdles",
    "400m Hurdles",
    "4x100m Relay",
    "4x400m Relay",
  ],
  "Jumping Events": [
    "Long Jump",
    "High Jump",
    "Triple Jump",
    "Pole Vault",
  ],
  "Throwing Events": [
    "Shot Put",
    "Discus Throw",
    "Javelin Throw",
    "Hammer Throw",
  ],
  "Other Events": [
    "Cross Country",
    "Race Walking",
  ],
};

export default function AddAthlete() {
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingAthlete, setLoadingAthlete] = useState(isEditing);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setPhotoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview((previousPreview) => {
      if (previousPreview.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreview);
      }
      return previewUrl;
    });
  }

  // Load existing athlete when editing
  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;

    async function fetchAthlete() {
      try {
        const athletes = await getAthletes();
        const athlete = athletes.find(
          (item) => String(item.id) === String(id)
        );

        if (!athlete) {
          if (!cancelled) {
            setError("Athlete not found.");
          }
          return;
        }

        if (cancelled) return;

        setForm({
          name: athlete.name || "",
          gender: athlete.gender || "M",
          branch: athlete.branch || "",
          entry_year: athlete.entry_year ?? "",
          photo_url: athlete.photo_url || "",
          contact: athlete.contact || "",
          status: athlete.status || "Active",
        });

        setSelectedEvents(
          Array.isArray(athlete.events)
            ? athlete.events.map((event) => event.name)
            : []
        );
      } catch (err) {
        console.error("Error loading athlete:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load athlete details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAthlete(false);
        }
      }
    }

    fetchAthlete();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function handleEventChange(eventName) {
    setSelectedEvents((previousEvents) =>
      previousEvents.includes(eventName)
        ? previousEvents.filter((event) => event !== eventName)
        : [...previousEvents, eventName]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (selectedEvents.length === 0) {
      setError("Please select at least one athletics event.");
      return;
    }

    setSaving(true);

    try {
      const athleteData = new FormData();
      athleteData.append("name", form.name);
      athleteData.append("gender", form.gender);
      athleteData.append("branch", form.branch);
      athleteData.append("entry_year", form.entry_year ? String(form.entry_year) : "");
      athleteData.append("contact", form.contact);
      athleteData.append("status", form.status);
      athleteData.append("events", JSON.stringify(selectedEvents));

      if (photoFile) {
        athleteData.append("photo", photoFile);
      } else {
        athleteData.append("photo_url", form.photo_url || "");
      }

      if (isEditing) {
        await updateAthlete(id, athleteData);
      } else {
        await addAthlete(athleteData);
      }

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Error saving athlete:", err);

      setError(
        err.response?.data?.message ||
          `Unable to ${isEditing ? "update" : "add"} athlete. Please try again.`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingAthlete) {
    return (
      <main className="section page-container">
        <p>Loading athlete details...</p>
      </main>
    );
  }

  return (
    <main className="section page-container">
      <Link to="/admin/dashboard" className="text-link">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <form className="athlete-form" onSubmit={handleSubmit}>
        <span className="eyebrow">TEAM MANAGEMENT</span>

        <h1 className="page-title">
          {isEditing ? "Edit Athlete" : "Add Athlete"}
        </h1>

        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}

        <label htmlFor="name">Full Name *</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          maxLength={100}
        />

        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="F">Others</option>
        </select>

        <label htmlFor="branch">Branch</label>
        <input
          id="branch"
          name="branch"
          value={form.branch}
          onChange={handleChange}
          maxLength={100}
        />

        <label htmlFor="entry_year">Year of Entry</label>
        <input
          id="entry_year"
          name="entry_year"
          type="number"
          min="2000"
          max="2100"
          value={form.entry_year}
          onChange={handleChange}
        />

        <label htmlFor="athlete_photo">Athlete Photo</label>

<input
  ref={fileInputRef}
  id="athlete_photo"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handlePhotoChange}
/>

{(photoPreview || form.photo_url) && (
  <div className="athlete-photo-preview">
    <img
      src={
        photoPreview ||
        (form.photo_url.startsWith("http")
          ? form.photo_url
          : `http://localhost:5000${form.photo_url}`)
      }
      alt="Athlete preview"
    />

    {photoFile && (
      <button
        type="button"
        onClick={() => {
          if (photoPreview.startsWith("blob:")) {
            URL.revokeObjectURL(photoPreview);
          }

          setPhotoPreview("");
          setPhotoFile(null);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      >
        Remove Selected Photo
      </button>
    )}
  </div>
)}

<input
  ref={fileInputRef}
  id="athlete_photo"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handlePhotoChange}
/>

{photoPreview && (
  <div className="athlete-photo-preview">
    <img
      src={photoPreview}
      alt="Selected athlete"
    />

    <button
      type="button"
      onClick={() => {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview("");
        setPhotoFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }}
    >
      Remove Photo
    </button>
  </div>
)}

{!photoFile && form.photo_url && (
  <div className="athlete-photo-preview">
    <img
      src={form.photo_url.startsWith("http")
        ? form.photo_url
        : `http://localhost:5000${form.photo_url}`}
      alt="Current athlete"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  </div>
)}

        <label htmlFor="contact">Contact</label>
        <input
          id="contact"
          name="contact"
          value={form.contact}
          onChange={handleChange}
          maxLength={20}
        />

        {/* Athlete status */}
        <label htmlFor="status">Athlete Status *</label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          required
        >
          <option value="Active">Current Active Player</option>
          <option value="Alumni">Pass-Out Athlete (Alumni)</option>
        </select>

        {/* Multiple event selection */}
        <fieldset className="event-selection">
          <legend>Events Participating In *</legend>

          <p className="muted event-help">
            Select all events in which this athlete participates.
          </p>

          {Object.entries(eventCategories).map(
            ([category, events]) => (
              <div key={category} className="event-category">
                <h3 className="event-category-title">
                  {category}
                </h3>

                <div className="event-checkbox-grid">
                  {events.map((eventName) => {
                    const isSelected =
                      selectedEvents.includes(eventName);

                    return (
                      <label
                        key={eventName}
                        className={`event-option ${
                          isSelected ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleEventChange(eventName)
                          }
                        />

                        <span className="event-option-name">
                          {eventName}
                        </span>

                        {isSelected && (
                          <span className="event-selected-indicator">
                            ✓
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )
          )}

          <div className="event-selection-summary">
            <span>Selected events</span>
            <strong>{selectedEvents.length}</strong>
          </div>
        </fieldset>

        <button
          type="submit"
          className="primary-button login-button"
          disabled={saving}
        >
          <Save size={18} />
          {saving
            ? "Saving..."
            : isEditing
              ? "Update Athlete"
              : "Save Athlete"}
        </button>
      </form>
    </main>
  );
}