import api from "../../../services/api";

export const getBranches = async () => {
  const response = await api.get("/branches");
  return response.data;
};

export const getBranch = async (branchId) => {
  const response = await api.get(`/branches/${branchId}`);
  return response.data;
};

export const createBranch = async (branchData) => {
  const response = await api.post("/branches", branchData);
  return response.data;
};

export const updateBranch = async (branchId, branchData) => {
  const response = await api.put(`/branches/${branchId}`, branchData);
  return response.data;
};