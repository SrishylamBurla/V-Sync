import api from "../../services/api";

export const getLetters = async (params = {}) =>
  (await api.get("/communications/letters", { params })).data;
export const createLetter = async (payload) =>
  (await api.post("/communications/letters", payload)).data;
export const updateLetter = async (id, payload) =>
  (await api.put(`/communications/letters/${id}`, payload)).data;
export const getLetter = async (id) =>
  (await api.get(`/communications/letters/${id}`)).data;
export const getClinicalImages = async (params = {}) =>
  (await api.get("/communications/images", { params })).data;
export const createClinicalImage = async (payload) =>
  (await api.post("/communications/images", payload)).data;
export const deleteClinicalImage = async (id) =>
  (await api.delete(`/communications/images/${id}`)).data;
