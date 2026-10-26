import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getMissionCountdown = async () => {
  const response = await API.get("/mission-countdown");
  return response.data?.mission || response.data;
};

export const updateMissionCountdown = async (settings) => {
  const response = await API.put("/mission-countdown", settings);
  return response.data?.mission || response.data;
};
