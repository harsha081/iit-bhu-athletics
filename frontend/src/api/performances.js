import axios from "axios";

const API_URL = "http://localhost:5000/api/performances";

function getAuthConfig() {
  const token = localStorage.getItem("adminToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function getPerformances() {
  const response = await axios.get(API_URL);
  return response.data;
}

export async function addPerformance(performanceData) {
  const response = await axios.post(
    API_URL,
    performanceData,
    getAuthConfig()
  );

  return response.data;
}

export async function deletePerformance(id) {
  const response = await axios.delete(
    `${API_URL}/${id}`,
    getAuthConfig()
  );

  return response.data;
}