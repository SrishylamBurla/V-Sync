import api from "../../services/api";

export const getPatientConsultations = async (patientId) => {
  const response = await api.get(`/consultations/patient/${patientId}`);
  return response.data;
};

export const getConsultation = async (consultationId) => {
  const response = await api.get(`/consultations/${consultationId}`);
  return response.data;
};

export const createConsultation = async (consultationData) => {
  const response = await api.post("/consultations", consultationData);
  return response.data;
};

export const updateConsultation = async (consultationId, consultationData) => {
  const response = await api.put(`/consultations/${consultationId}`, consultationData);
  return response.data;
};
