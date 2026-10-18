import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach the admin token to API requests.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// GET: Retrieve all athletes
// GET: Retrieve athletes, optionally filtered by status
export const getAthletes = async (status = "") => {
  const response = await API.get("/athletes", {
    params: status ? { status } : {},
  });

  return response.data;
};
// POST: Add an athlete
export const addAthlete = async (athlete) => {
  const response = await API.post("/athletes", athlete);
  return response.data;
};

// PUT: Update an athlete
export const updateAthlete = async (id, athlete) => {
  const response = await API.put(`/athletes/${id}`, athlete);
  return response.data;
};

// DELETE: Remove an athlete
export const deleteAthlete = async (id) => {
  const response = await API.delete(`/athletes/${id}`);
  return response.data;
};