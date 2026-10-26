import API from "./client";

// Fetch published announcements for the public Home page.
export const getAnnouncements = async () => {
  const response = await API.get("/announcements");
  return response.data;
};

// Fetch all announcements, including drafts, for administrators.
export const getAllAnnouncements = async () => {
  const response = await API.get("/announcements/admin/all");
  return response.data;
};

// Create an announcement.
export const addAnnouncement = async (data) => {
  const response = await API.post("/announcements", data);
  return response.data;
};

// Update an existing announcement.
export const updateAnnouncement = async (id, data) => {
  const response = await API.put(`/announcements/${id}`, data);
  return response.data;
};

// Delete an announcement.
export const deleteAnnouncement = async (id) => {
  const response = await API.delete(`/announcements/${id}`);
  return response.data;
};
