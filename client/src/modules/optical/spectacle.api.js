import api from "../../services/api";

const unwrap = (response) => response?.data ?? response;

/**
 * Get one spectacle job by Spectacle MongoDB _id.
 */
export const getSpectacle = async (id) => {
  if (!id) {
    throw new Error("Spectacle ID is required.");
  }

  const response = await api.get(`/spectacles/${id}`);

  return unwrap(response);
};

/**
 * Get the latest consultation for a patient.
 */
export const getLatestConsultationForPatient = async (patientId) => {
  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  const response = await api.get(
    `/spectacles/patient/${patientId}/latest-consultation`,
  );

  return unwrap(response);
};

/**
 * Get all spectacle jobs belonging to one patient.
 */
export const getPatientSpectacles = async (
  patientId,
  params = {},
) => {
  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  const response = await api.get(
    `/spectacles/patient/${patientId}`,
    {
      params,
    },
  );

  return unwrap(response);
};

/**
 * Create a new spectacle job.
 */
export const createSpectacle = async (payload) => {
  if (!payload?.patientId) {
    throw new Error("Patient ID is required.");
  }

  const response = await api.post(
    "/spectacles",
    payload,
  );

  return unwrap(response);
};

/**
 * Update an existing spectacle job.
 */
export const updateSpectacle = async (id, payload) => {
  if (!id) {
    throw new Error("Spectacle ID is required.");
  }

  const response = await api.put(
    `/spectacles/${id}`,
    payload,
  );

  return unwrap(response);
};

/**
 * Change spectacle dispensing status.
 *
 * draft
 * → ordered
 * → not_ready
 * → ready
 * → notified
 * → collected
 */
export const updateSpectacleStatus = async (
  id,
  status,
) => {
  if (!id) {
    throw new Error("Spectacle ID is required.");
  }

  if (!status) {
    throw new Error("Spectacle status is required.");
  }

  const response = await api.patch(
    `/spectacles/${id}/status`,
    {
      status,
    },
  );

  return unwrap(response);
};

/**
 * Get spectacle dispensing register.
 */
export const getDispensingList = async (
  params = {},
) => {
  const response = await api.get(
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