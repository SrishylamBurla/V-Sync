import api from "../../../services/api";

export const getOrganizations = async (params = {}) => {
  const response = await api.get("/admin/organizations", {
    params,
  });

  return response.data;
};

export const getOrganization = async (id) => {
  const response = await api.get(`/admin/organizations/${id}`);

  return response.data;
};

export const createOrganization = async (data) => {
  const response = await api.post("/admin/organizations", data);

  return response.data;
};

export const updateOrganization = async (id, data) => {
  const response = await api.put(
    `/admin/organizations/${id}`,
    data
  );

  return response.data;
};

export const updateOrganizationStatus = async (id, status) => {
  const response = await api.patch(
    `/admin/organizations/${id}/status`,
    { status }
  );

  return response.data;
};