import api from "../../services/api";

/**
 * Appointment API
 * Centralizes all appointment-related HTTP requests.
 */

export const getAppointments = async ({
  date = "",
  status = "",
  clinicianId = "",
  search = "",
} = {}) => {
  const params = {};

  if (date) params.date = date;
  if (status) params.status = status;
  if (clinicianId) params.clinicianId = clinicianId;
  if (search?.trim()) params.search = search.trim();

  const response = await api.get("/appointments", { params });
  return response.data;
};

export const getAppointment = async (id) => {
  if (!id) {
    throw new Error("Appointment ID is required.");
  }

  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

export const getAppointmentClinicians = async () => {
  const response = await api.get("/appointments/clinicians");
  return response.data;
};

export const createAppointment = async (payload) => {
  if (!payload?.patientId) {
    throw new Error("Patient is required.");
  }

  if (!payload?.appointmentDate) {
    throw new Error("Appointment date and time are required.");
  }

  const response = await api.post("/appointments", payload);
  return response.data;
};

export const updateAppointment = async (id, payload) => {
  if (!id) {
    throw new Error("Appointment ID is required.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Appointment update data is required.");
  }

  const response = await api.put(`/appointments/${id}`, payload);
  return response.data;
};

export const assignAppointmentClinician = async (id, clinicianId) => {
  if (!id) {
    throw new Error("Appointment ID is required.");
  }

  const response = await api.put(`/appointments/${id}`, {
    clinicianId: clinicianId || null,
  });

  return response.data;
};

export const unassignAppointmentClinician = async (id) => {
  if (!id) {
    throw new Error("Appointment ID is required.");
  }

  const response = await api.put(`/appointments/${id}`, {
    clinicianId: null,
  });

  return response.data;
};

export default {
  getAppointments,
  getAppointment,
  getAppointmentClinicians,
  createAppointment,
  updateAppointment,
  assignAppointmentClinician,
  unassignAppointmentClinician,
};