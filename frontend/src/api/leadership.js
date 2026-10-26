import API from "./client";

export const getLeadership = async () => {
  const response = await API.get("/leadership");
  return response.data;
};

export const addLeadership = async (leadership) => {
  const response = await API.post("/leadership", leadership);
  return response.data;
};

// Update an existing leadership record
export const updateLeadership = async (id, leadership) => {
  const response = await API.put(`/leadership/${id}`, leadership);
  return response.data;
};

export const deleteLeadership = async (id) => {
  const response = await API.delete(`/leadership/${id}`);
  return response.data;
};
