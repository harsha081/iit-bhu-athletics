import API from "./client";

export const getMissionCountdown = async () => {
  const response = await API.get("/mission-countdown");
  return response.data?.mission || response.data;
};

export const updateMissionCountdown = async (settings) => {
  const response = await API.put("/mission-countdown", settings);
  return response.data?.mission || response.data;
};
