import api from "../../services/api";

const hasValues = (rx) => {
  if (!rx || typeof rx !== "object") return false;
  const eyes = [rx.right, rx.left].filter((eye) => eye && typeof eye === "object");
  return Boolean(String(rx.note || "").trim()) || eyes.some((eye) => Object.values(eye).some((value) => value !== null && value !== undefined && String(value).trim() !== ""));
};

/**
 * The current data model stores spectacle prescriptions inside consultations.
 * Convert those saved structures into a prescription-register row shape so the
 * history page uses the existing source of truth rather than a fictional API.
 */
export const getPrescriptions = async ({ page = 1, limit = 20, type = "" } = {}) => {
  const response = await api.get("/consultations", {
    params: { page, limit: Math.min(100, Math.max(1, limit)) },
  });
  const payload = response?.data?.data ?? response?.data ?? {};
  const consultations = Array.isArray(payload?.consultations) ? payload.consultations : Array.isArray(payload) ? payload : [];
  const prescriptionRows = [];

  for (const consultation of consultations) {
    const definitions = [
      ["previous", consultation.previousRx],
      ["subjective", consultation.subjectiveRx],
      ["given", consultation.givenRx],
    ];
    for (const [prescriptionType, rx] of definitions) {
      if (!hasValues(rx) || (type && type !== prescriptionType)) continue;
      prescriptionRows.push({
        _id: `${consultation._id}-${prescriptionType}`,
        consultationId: consultation._id,
        patientId: consultation.patientId || consultation.patient || null,
        type: prescriptionType,
        prescriptionType,
        right: rx?.right || {},
        left: rx?.left || {},
        pd: consultation.pd || {},
        notes: rx?.note || consultation.notes || "",
        consultationType: consultation.consultationType || "",
        prescriptionDate: consultation.consultationDate || consultation.updatedAt || consultation.createdAt,
        createdAt: consultation.consultationDate || consultation.updatedAt || consultation.createdAt,
      });
    }
  }

  return { success: true, data: { prescriptions: prescriptionRows, pagination: payload?.pagination || null } };
};

export default { getPrescriptions };
