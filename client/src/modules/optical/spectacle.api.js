import api from "../../services/api";

const unwrap = (response) =>
  response?.data ?? response;

export const getSpectacle = async (id) => {
  if (!id) {
    throw new Error(
      "Spectacle ID is required",
    );
  }

  const response =
    await api.get(
      `/spectacles/${id}`,
    );

  return unwrap(response);
};

export const getLatestConsultationForPatient =
  async (patientId) => {
    if (!patientId) {
      throw new Error(
        "Patient ID is required",
      );
    }

    const response =
      await api.get(
        `/spectacles/patient/${patientId}/latest-consultation`,
      );

    return unwrap(response);
  };

export const getPatientSpectacles =
  async (patientId, params = {}) => {
    if (!patientId) {
      throw new Error(
        "Patient ID is required",
      );
    }

    const response =
      await api.get(
        `/spectacles/patient/${patientId}`,
        {
          params,
        },
      );

    return unwrap(response);
  };

export const createSpectacle =
  async (payload) => {
    if (!payload?.patientId) {
      throw new Error(
        "Patient ID is required",
      );
    }

    const response =
      await api.post(
        "/spectacles",
        payload,
      );

    return unwrap(response);
  };

export const updateSpectacle =
  async (id, payload) => {
    if (!id) {
      throw new Error(
        "Spectacle ID is required",
      );
    }

    const response =
      await api.put(
        `/spectacles/${id}`,
        payload,
      );

    return unwrap(response);
  };

export const updateSpectacleStatus =
  async (id, status) => {
    if (!id) {
      throw new Error(
        "Spectacle ID is required",
      );
    }

    if (!status) {
      throw new Error(
        "Spectacle status is required",
      );
    }

    const response =
      await api.patch(
        `/spectacles/${id}/status`,
        {
          status,
        },
      );

    return unwrap(response);
  };

export const getDispensingList =
  async (params = {}) => {
    const response =
      await api.get(
        "/spectacles/dispensing",
        {
          params,
        },
      );

    return unwrap(response);
  };

export default {
  getSpectacle,
  getLatestConsultationForPatient,
  getPatientSpectacles,
  createSpectacle,
  updateSpectacle,
  updateSpectacleStatus,
  getDispensingList,
};