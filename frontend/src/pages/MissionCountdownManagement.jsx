import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, CheckCircle2, Save, Timer } from "lucide-react";
import { getMissionCountdown, updateMissionCountdown } from "../api/missionCountdown";
import "./MissionCountdownManagement.css";

const DEFAULT_SETTINGS = {
  title: "INTER-IIT ATHLETICS MEET 2026",
  target_date: "2026-12-15",
  target_time: "00:00",
  timezone: "Asia/Kolkata",
  description: "The next mission starts here.",
  is_active: true,
};

function getTimezoneOffset(timestamp, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return Date.UTC(values.year, Number(values.month) - 1, values.day, values.hour, values.minute, values.second) - timestamp;
}

function zonedDateTimeToTimestamp(date, time, timezone) {
  const localTimestamp = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(localTimestamp)) return NaN;
  try {
    return localTimestamp - getTimezoneOffset(localTimestamp, timezone);
  } catch {
    return NaN;
  }
}

export default function MissionCountdownManagement() {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewNow, setPreviewNow] = useState(() => new Date().getTime());

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const mission = await getMissionCountdown();
      setForm({ ...DEFAULT_SETTINGS, ...mission });
    } catch (loadError) {
      setError(
        loadError.response?.data?.message ||
          "Could not load saved countdown settings. The default settings are shown."
      );
      console.error("Failed to load mission countdown:", loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { loadSettings(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const preview = useMemo(() => {
    const timestamp = zonedDateTimeToTimestamp(form.target_date, form.target_time, form.timezone);
    if (!Number.isFinite(timestamp)) return null;
    const remaining = Math.max(0, timestamp - previewNow);
    return { timestamp, days: Math.ceil(remaining / 86400000) };
  }, [form.target_date, form.target_time, form.timezone, previewNow]);

  const updateField = ({ target }) => {
    const { name, value, checked, type } = target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setPreviewNow(new Date().getTime());
    if (!form.title.trim()) return setError("Enter a mission title.");
    if (!preview) return setError("Enter a valid date, time, and IANA timezone (for example, Asia/Kolkata).");

    setSaving(true);
    try {
      const savedMission = await updateMissionCountdown({ ...form, title: form.title.trim(), description: form.description.trim(), timezone: form.timezone.trim() });
      setForm({ ...DEFAULT_SETTINGS, ...savedMission });
      setSuccess("Countdown settings saved. The Home page will use the updated configuration.");
    } catch (saveError) {
      const message = saveError.response?.data?.message || "Could not save the countdown settings. Sign in again if your session has expired.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="section page-container mission-admin-page">
      <Link to="/admin/dashboard" className="mission-admin-back"><ArrowLeft size={17} /> Back to Dashboard</Link>
      <header className="mission-admin-header">
        <span className="eyebrow">HOMEPAGE SETTINGS</span>
        <h1 className="page-title">Next Mission Countdown</h1>
        <p className="muted">Manage the live timer displayed below the IIT (BHU) Athletics logo.</p>
      </header>

      <div className="mission-admin-grid">
        <form className="mission-admin-form dashboard-panel" onSubmit={handleSubmit}>
          <div className="mission-admin-form-title"><CalendarClock size={22} /><div><h2>Countdown Settings</h2><p className="muted">Changes are stored in PostgreSQL and shown to public visitors.</p></div></div>
          {loading && <p className="muted">Loading saved settings…</p>}
          <label htmlFor="mission-title">Mission or competition title</label>
          <input id="mission-title" name="title" value={form.title} onChange={updateField} maxLength={120} required />
          <div className="mission-admin-date-row">
            <div><label htmlFor="mission-date">Target date</label><input id="mission-date" type="date" name="target_date" value={form.target_date} onChange={updateField} required /></div>
            <div><label htmlFor="mission-time">Target time</label><input id="mission-time" type="time" name="target_time" value={form.target_time} onChange={updateField} required /></div>
          </div>
          <label htmlFor="mission-timezone">Timezone (IANA)</label>
          <input id="mission-timezone" name="timezone" value={form.timezone} onChange={updateField} maxLength={80} required placeholder="Asia/Kolkata" />
          <label htmlFor="mission-description">Supporting message</label>
          <textarea id="mission-description" name="description" value={form.description} onChange={updateField} rows={3} maxLength={220} />
          <label className="mission-admin-toggle"><input type="checkbox" name="is_active" checked={form.is_active} onChange={updateField} /><span><strong>Show countdown on Home page</strong><small>Hide the countdown without deleting its saved configuration.</small></span></label>
          {error && <p className="mission-admin-message error-message" role="alert">{error}</p>}
          {success && <p className="mission-admin-message mission-admin-success" role="status"><CheckCircle2 size={17} />{success}</p>}
          <div className="mission-admin-actions"><button className="secondary-button" type="button" onClick={loadSettings} disabled={loading || saving}>Reload</button><button className="primary-button mission-admin-save" type="submit" disabled={saving || loading}><Save size={17} />{saving ? "Saving…" : "Save Countdown Settings"}</button></div>
        </form>

        <aside className="mission-admin-preview">
          <div className="mission-preview-icon"><Timer size={24} /></div>
          <span className="mission-preview-kicker">LIVE PREVIEW</span>
          <h2>{form.title || "Your next mission"}</h2>
          <p>{form.description || "Your supporting message will appear here."}</p>
          <div className="mission-preview-days"><strong>{preview?.days ?? "—"}</strong><span>days to go</span></div>
          <div className="mission-preview-date">{preview ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: form.timezone }).format(new Date(preview.timestamp)) : "Enter a valid timezone"}</div>
          <span className={`mission-preview-status ${form.is_active ? "is-active" : "is-hidden"}`}>{form.is_active ? "Visible on Home page" : "Hidden from Home page"}</span>
        </aside>
      </div>
    </main>
  );
}
