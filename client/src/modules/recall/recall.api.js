import api from "../../services/api";

export const getRecallSummary = async () => (await api.get("/recall/summary")).data;
export const getRecallSettings = async () => (await api.get("/recall/settings")).data;
export const updateRecallSettings = async (payload) => (await api.put("/recall/settings", payload)).data;
export const createRecallList = async (payload) => (await api.post("/recall/lists", payload)).data;
export const getCurrentRecallList = async () => (await api.get("/recall/lists/current")).data;
export const updateRecallEntry = async (listId, entryId, payload) => (await api.put(`/recall/lists/${listId}/entries/${entryId}`, payload)).data;
export const updateRecallList = async (id, payload) => (await api.put(`/recall/lists/${id}`, payload)).data;
