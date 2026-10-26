const API_ORIGIN = "http://localhost:5000";

// Uploaded files are stored by the API as paths such as /uploads/athletes/photo.jpg.
// External image URLs are preserved unchanged.
export function getMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  const url = value.trim();
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
