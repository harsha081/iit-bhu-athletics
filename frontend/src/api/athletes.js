import API from "./client";

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
