import api from "../../services/api";
export const getInventory = async (params={}) => (await api.get("/inventory",{params})).data;
export const getInventorySummary = async () => (await api.get("/inventory/summary")).data;
export const createInventoryItem = async payload => (await api.post("/inventory",payload)).data;
export const updateInventoryItem = async (id,payload) => (await api.put(`/inventory/${id}`,payload)).data;
export const getInventoryItem = async id => (await api.get(`/inventory/${id}`)).data;
export const adjustInventory = async (id,payload) => (await api.post(`/inventory/${id}/adjust`,payload)).data;
export const stocktakeInventory = async (id,payload) => (await api.post(`/inventory/${id}/stocktake`,payload)).data;
