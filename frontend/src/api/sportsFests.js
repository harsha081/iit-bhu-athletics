import axios from "axios";

const API_URL = "http://localhost:5000/api/sports-fests";

const getAuthConfig = () => {
  const token = localStorage.getItem("adminToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export async function getSportsFests() {
  const response = await axios.get(API_URL);
  return response.data;
}

export async function addSportsFest(festData) {
  const response = await axios.post(
    API_URL,
    festData,
    getAuthConfig()
  );

  return response.data;
}

export async function deleteSportsFest(id) {
  const response = await axios.delete(
    `${API_URL}/${id}`,
    getAuthConfig()
  );

  return response.data;
}