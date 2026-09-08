import api from "../../../services/api";

export const getMyOrganization = async () => {
  const response = await api.get("/organizations/me");
  return response.data;
};

export const getOrganizationSummary = async () => {
  const response = await api.get("/organizations/me/summary");
  return response.data;
};

export const updateMyOrganization = async (data) => {
  const response = await api.put("/organizations/me", data);
  return response.data;
};