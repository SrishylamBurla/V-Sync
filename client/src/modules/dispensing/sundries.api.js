import api from "../../services/api";

// ============================================================
// SUNDRIES
// Uses the existing Inventory API with category=sundry
// ============================================================

export const getSundries = async (params = {}) => {
  const response = await api.get("/inventory", {
    params: {
      ...params,
      category: "sundry",
    },
  });

  return response.data;
};

export const getSundry = async (id) => {
  const response = await api.get(`/inventory/${id}`);

  return response.data;
};

export const createSundry = async (payload) => {
  const response = await api.post("/inventory", {
    ...payload,
    category: "sundry",
  });

  return response.data;
};

export const updateSundry = async (id, payload) => {
  const response = await api.put(`/inventory/${id}`, {
    ...payload,
    category: "sundry",
  });

  return response.data;
};

export const adjustSundryStock = async (id, payload) => {
  const response = await api.post(`/inventory/${id}/adjust`, payload);

  return response.data;
};

export const stocktakeSundry = async (id, payload) => {
  const response = await api.post(`/inventory/${id}/stocktake`, payload);

  return response.data;
};

export const getSundrySummary = async () => {
  const response = await api.get("/inventory/summary");

  return response.data;
};