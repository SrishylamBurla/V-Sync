// // import api from "../../services/api";

// // export const getPatientConsultations = async (patientId) => {
// //   const response = await api.get(`/consultations/patient/${patientId}`);
// //   return response.data;
// // };

// // export const getConsultation = async (consultationId) => {
// //   const response = await api.get(`/consultations/${consultationId}`);
// //   return response.data;
// // };

// // export const createConsultation = async (consultationData) => {
// //   const response = await api.post("/consultations", consultationData);
// //   return response.data;
// // };

// // export const updateConsultation = async (consultationId, consultationData) => {
// //   const response = await api.put(`/consultations/${consultationId}`, consultationData);
// //   return response.data;
// // };
// import api from "../../services/api";

// const unwrap = (response) => response?.data ?? response;

// export const getConsultations = async (params = {}) =>
//   unwrap(await api.get("/consultations", { params }));

// export const getPatientConsultations = async (patientId) => {
//   if (!patientId) {
//     throw new Error("Patient ID is required.");
//   }

//   return unwrap(
//     await api.get(`/consultations/patient/${patientId}`),
//   );
// };

// export const getConsultation = async (consultationId) => {
//   if (!consultationId) {
//     throw new Error("Consultation ID is required.");
//   }

//   return unwrap(
//     await api.get(`/consultations/${consultationId}`),
//   );
// };

// export const createConsultation = async (payload) => {
//   if (!payload?.patientId) {
//     throw new Error("Patient ID is required.");
//   }

//   return unwrap(
//     await api.post("/consultations", payload),
//   );
// };

// export const updateConsultation = async (
//   consultationId,
//   payload,
// ) => {
//   if (!consultationId) {
//     throw new Error("Consultation ID is required.");
//   }

//   return unwrap(
//     await api.put(
//       `/consultations/${consultationId}`,
//       payload,
//     ),
//   );
// };

// export default {
//   getConsultations,
//   getPatientConsultations,
//   getConsultation,
//   createConsultation,
//   updateConsultation,
// };

import api from "../../services/api";

/**
 * Normalize axios responses.
 *
 * Handles:
 * {
 *   success: true,
 *   data: [...]
 * }
 *
 * as well as direct response payloads.
 */
const unwrap = (response) => response?.data ?? response;

/**
 * ============================================================
 * GET ALL CONSULTATIONS
 * ============================================================
 *
 * Used by the Clinical Management / Consultation History page.
 *
 * Supports:
 * - patientId
 * - page
 * - limit
 * - type
 * - search
 * - status
 *
 * Example:
 * getConsultations({
 *   patientId,
 *   page: 1,
 *   limit: 20,
 * })
 */
export const getConsultations = async (params = {}) => {
  const response = await api.get("/consultations", {
    params,
  });

  return unwrap(response);
};

/**
 * ============================================================
 * GET PATIENT CONSULTATION HISTORY
 * ============================================================
 *
 * Returns all consultations belonging to one patient.
 */
export const getPatientConsultations = async (patientId) => {
  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  const response = await api.get(
    `/consultations/patient/${patientId}`,
  );

  return unwrap(response);
};

/**
 * ============================================================
 * GET SINGLE CONSULTATION
 * ============================================================
 */
export const getConsultation = async (consultationId) => {
  if (!consultationId) {
    throw new Error("Consultation ID is required.");
  }

  const response = await api.get(
    `/consultations/${consultationId}`,
  );

  return unwrap(response);
};

/**
 * ============================================================
 * CREATE CONSULTATION
 * ============================================================
 *
 * Used for:
 * - Comprehensive consultation
 * - Short consultation
 * - Binocular Vision
 * - Low Vision
 * - Contact Lens consultation
 *
 * These are clinical consultations.
 *
 * They are NOT dispensing jobs.
 */
export const createConsultation = async (payload) => {
  if (!payload?.patientId) {
    throw new Error("Patient ID is required.");
  }

  const response = await api.post(
    "/consultations",
    payload,
  );

  return unwrap(response);
};

/**
 * ============================================================
 * UPDATE CONSULTATION
 * ============================================================
 */
export const updateConsultation = async (
  consultationId,
  payload,
) => {
  if (!consultationId) {
    throw new Error("Consultation ID is required.");
  }

  const response = await api.put(
    `/consultations/${consultationId}`,
    payload,
  );

  return unwrap(response);
};

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */
export default {
  getConsultations,
  getPatientConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
};