import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getCoaches = async (status = "") => {
  const response = await API.get("/coaches", {
    params: status ? { status } : {},
  });

  return response.data;
};

export const addCoach = async (data) => {
  const response = await API.post("/coaches", data);
  return response.data;
};

export const updateCoach = async (id, data) => {
  const response = await API.put(`/coaches/${id}`, data);
  return response.data;
};

export const deleteCoach = async (id) => {
  const response = await API.delete(`/coaches/${id}`);
  return response.data;
};