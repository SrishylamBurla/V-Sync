import api from "../../services/api";

export const getTodayAppointments = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const response = await api.get("/appointments", { params: { date: today } });
  return response.data;
};

export const createAppointment = async (payload) => {
  const response = await api.post("/appointments", payload);
  return response.data;
};

export const updateAppointment = async (id, payload) => {
  const response = await api.put(`/appointments/${id}`, payload);
  return response.data;
};
