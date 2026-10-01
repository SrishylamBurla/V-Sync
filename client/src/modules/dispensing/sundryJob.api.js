import api from "../../services/api";

export const getSundryJobs = async (params = {}) =>
  (await api.get("/sundry-jobs", { params })).data;

export const getSundryJob = async (id) =>
  (await api.get(`/sundry-jobs/${id}`)).data;

export const createSundryJob = async (payload) =>
  (await api.post("/sundry-jobs", payload)).data;

export const updateSundryJob = async (id, payload) =>
  (await api.put(`/sundry-jobs/${id}`, payload)).data;

export const updateSundryJobStatus = async (id, status) =>
  (await api.patch(`/sundry-jobs/${id}/status`, { status })).data;
