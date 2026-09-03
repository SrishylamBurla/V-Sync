import api from "../../services/api";
export const getPracticeSettings = async () =>
  (await api.get("/settings")).data;
export const updatePracticeSettings = async (payload) =>
  (await api.put("/settings", payload)).data;
