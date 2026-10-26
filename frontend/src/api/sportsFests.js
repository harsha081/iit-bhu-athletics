import API from "./client";

export async function getSportsFests() {
  const response = await API.get("/sports-fests");
  return response.data;
}

export async function addSportsFest(festData) {
  const response = await API.post("/sports-fests", festData);

  return response.data;
}

export async function deleteSportsFest(id) {
  const response = await API.delete(`/sports-fests/${id}`);

  return response.data;
}
