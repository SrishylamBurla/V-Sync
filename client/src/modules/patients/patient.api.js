import api from "../../services/api";

export const getPatients = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "active",
  branchId = "",
} = {}) => {
  const response = await api.get(
    "/patients",
    {
      params: {
        page,
        limit,
        search,
        status,
        ...(branchId
          ? { branchId }
          : {}),
      },
    }
  );

  return response.data;
};

export const getPatient = async (
  patientId
) => {
  const response = await api.get(
    `/patients/${patientId}`
  );

  return response.data;
};

export const createPatient = async (
  patientData
) => {
  const response = await api.post(
    "/patients",
    patientData
  );

  return response.data;
};

export const updatePatient = async (
  patientId,
  patientData
) => {
  const response = await api.put(
    `/patients/${patientId}`,
    patientData
  );

  return response.data;
};

export const deactivatePatient = async (
  patientId
) => {
  const response = await api.delete(
    `/patients/${patientId}`
  );

  return response.data;
};