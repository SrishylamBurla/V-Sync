import api from "../../services/api";
export const getDispensingList = async (params={}) => (await api.get("/dispensing", {params})).data;
export const getDispensing = async (id) => (await api.get(`/dispensing/${id}`)).data;
export const updateDispensing = async (id, status) => (await api.put(`/dispensing/${id}`, {status})).data;
