import API from "./client";

export async function getPerformances() {
  const response = await API.get("/performances");
  return response.data;
}

export async function addPerformance(performanceData) {
  const response = await API.post("/performances", performanceData);

  return response.data;
}

export async function deletePerformance(id) {
  const response = await API.delete(`/performances/${id}`);

  return response.data;
}
