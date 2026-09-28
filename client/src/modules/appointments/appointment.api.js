import api from "../../services/api";

export const getAppointments = async (params = {}) =>
  (await api.get("/appointments", { params })).data;

export const getPatientAppointments = async (patientId) =>
  (
    await api.get("/appointments", {
      params: {
        patientId,
      },
    })
  ).data;

export const getAppointment = async (id) =>
  (await api.get(`/appointments/${id}`)).data;

export const getAppointmentClinicians = async () =>
  (await api.get("/appointments/clinicians")).data;

export const createAppointment = async (payload) =>
  (await api.post("/appointments", payload)).data;

export const updateAppointment = async (id, payload) =>
  (await api.put(`/appointments/${id}`, payload)).data;

export const assignAppointmentClinician = async (
  id,
  clinicianId,
) =>
  (
    await api.put(`/appointments/${id}`, {
      clinicianId,
    })
  ).data;

export const unassignAppointmentClinician = async (id) =>
  (
    await api.put(`/appointments/${id}`, {
      clinicianId: null,
    })
  ).data;