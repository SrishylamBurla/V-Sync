import api from "../../services/api";

const normalizeDocument = (value) =>
  value?.document || value?.data?.document || value?.data || value;

export const uploadPatientDocument = async (
  patientId,
  { file, category = "Other", note = "" } = {}
) => {
  if (!patientId) throw new Error("Patient ID is required");
  if (!file) throw new Error("Please select a file");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  formData.append("note", note);

  const response = await api.post(`/patients/${patientId}/documents`, formData);
  return normalizeDocument(response.data);
};

export const getPatientDocuments = async (patientId) => {
  if (!patientId) throw new Error("Patient ID is required");

  const response = await api.get(`/patients/${patientId}/documents`);
  return response?.data?.documents || response?.data?.data?.documents || [];
};

export const deletePatientDocument = async (patientId, documentId) => {
  if (!patientId) throw new Error("Patient ID is required");
  if (!documentId) throw new Error("Document ID is required");

  const response = await api.delete(
    `/patients/${patientId}/documents/${documentId}`
  );
  return response?.data || response;
};

export const openPatientDocument = async (patientId, doc) => {
  if (!patientId) throw new Error("Patient ID is required");
  if (!doc?._id) throw new Error("Document ID is required");

  const response = await api.get(
    `/patients/${patientId}/documents/${doc._id}/file`,
    { responseType: "blob" }
  );

  const blob = new Blob([response.data], {
    type:
      response.headers?.["content-type"] ||
      doc.mimeType ||
      "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (!popup) {
    const link = window.document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = doc.originalName || "patient-document";
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export default {
  uploadPatientDocument,
  getPatientDocuments,
  deletePatientDocument,
  openPatientDocument,
};
