import api from "../../../services/api";

export const getStaff = async (params = {}) => {
  const response = await api.get("/staff", {
    params,
  });

  return response.data;
};

export const getStaffMember = async (staffId) => {
  const response = await api.get(`/staff/${staffId}`);

  return response.data;
};

export const createStaff = async (staffData) => {
  const response = await api.post("/staff", staffData);

  return response.data;
};

export const updateStaff = async (
  staffId,
  staffData
) => {
  const response = await api.put(
    `/staff/${staffId}`,
    staffData
  );

  return response.data;
};

export const updateStaffStatus = async (
  staffId,
  status
) => {
  const response = await api.patch(
    `/staff/${staffId}/status`,
    { status }
  );

  return response.data;
};

export const resetStaffPassword = async (
  staffId,
  password
) => {
  const response = await api.post(
    `/staff/${staffId}/reset-password`,
    { password }
  );

  return response.data;
};