import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardPlus,
  ContactRound,
  Glasses,
  PackageCheck,
  Eye,
  FileText,
  Upload,
  Download,
  Trash2,
  Edit3,
  Mail,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getPatient, updatePatient } from "../patient.api";

import {
  uploadPatientDocument,
  getPatientDocuments,
  deletePatientDocument,
  openPatientDocument,
} from "../patient.documents.api.js";

import {
  getPatientConsultations,
  getConsultation,
} from "../../clinical/consultation.api";

// ============================================================
// HELPERS
// ============================================================

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const roleLabel = (value = "") =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

/**
 * Calculate age from date of birth.
 *
 * We intentionally calculate this instead of storing age in
 * MongoDB because age changes automatically over time.
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
};

const initialEdit = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  source: "",
  notes: "",
};

// ============================================================
// MAIN PAGE
// ============================================================

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingConsultation, setLoadingConsultation] = useState(false);

  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState(initialEdit);

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [serviceModal, setServiceModal] = useState(null);

  const [documentOpen, setDocumentOpen] = useState(false);

  const [documentFiles, setDocumentFiles] = useState([]);

  const [documentCategory, setDocumentCategory] = useState("other");

  const [documentNote, setDocumentNote] = useState("");

  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const [deletingDocumentId, setDeletingDocumentId] = useState("");

  const [openingDocumentId, setOpeningDocumentId] = useState("");

  // ==========================================================
  // AGE
  // ==========================================================

  const patientAge = useMemo(
    () => calculateAge(patient?.dateOfBirth),
    [patient?.dateOfBirth],
  );

  // ==========================================================
  // LOAD PATIENT
  // ==========================================================

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [patientResponse, consultationsResponse, patientDocumentsResponse] =
        await Promise.all([
          getPatient(patientId),
          getPatientConsultations(patientId),
          getPatientDocuments(patientId),
        ]);

      const patientData =
        patientResponse?.data?.patient ??
        patientResponse?.data?.data?.patient ??
        patientResponse?.data ??
        patientResponse?.patient ??
        null;

      console.log("Patient API response:", patientResponse);
      console.log("Patient data:", patientData);
      console.log("DOB:", patientData?.dateOfBirth);
      const consultationRows = Array.isArray(consultationsResponse?.data)
        ? consultationsResponse.data
        : Array.isArray(consultationsResponse?.data?.consultations)
          ? consultationsResponse.data.consultations
          : Array.isArray(consultationsResponse?.consultations)
            ? consultationsResponse.consultations
            : [];

      const documentRows = Array.isArray(patientDocumentsResponse)
        ? patientDocumentsResponse
        : Array.isArray(patientDocumentsResponse?.data)
          ? patientDocumentsResponse.data
          : [];

      setPatient({
        ...patientData,
        documents: documentRows,
      });

      setConsultations(consultationRows);

      setEditForm({
        ...initialEdit,

        firstName: patientData?.firstName || "",

        lastName: patientData?.lastName || "",

        dateOfBirth: patientData?.dateOfBirth
          ? new Date(patientData.dateOfBirth).toISOString().slice(0, 10)
          : "",

        gender: patientData?.gender || "",

        phone: patientData?.phone || "",

        alternatePhone: patientData?.alternatePhone || "",

        email: patientData?.email || "",

        source: patientData?.source || "",

        notes: patientData?.notes || "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load patient record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      load();
    }
  }, [patientId]);

  // ==========================================================
  // LATEST CONSULTATION
  // ==========================================================

  const latestConsultation = useMemo(
    () => consultations[0] || null,
    [consultations],
  );

  // ==========================================================
  // OPEN CONSULTATION
  // ==========================================================

  const openConsultation = async (consultation) => {
    setLoadingConsultation(true);
    setError("");

    try {
      const response = await getConsultation(consultation._id);

      const data =
        response?.data?.consultation ||
        response?.data ||
        response?.consultation ||
        consultation;

      setSelectedConsultation(data);
    } catch {
      setSelectedConsultation(consultation);
    } finally {
      setLoadingConsultation(false);
    }
  };

  // ==========================================================
  // DOCUMENT UPLOAD
  // ==========================================================

  const handleDocumentUpload = async (event) => {
    event.preventDefault();

    if (!documentFiles.length || uploadingDocuments) {
      return;
    }

    setUploadingDocuments(true);
    setError("");

    try {
      for (const file of documentFiles) {
        await uploadPatientDocument(patientId, {
          file,
          category: documentCategory,
          note: documentNote.trim(),
        });
      }

      setDocumentFiles([]);
      setDocumentNote("");
      setDocumentCategory("other");
      setDocumentOpen(false);

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to upload patient document",
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  // ==========================================================
  // OPEN DOCUMENT
  // ==========================================================

  const openDocument = async (document) => {
    if (!document?._id || openingDocumentId) {
      return;
    }

    setOpeningDocumentId(document._id);
    setError("");

    try {
      await openPatientDocument(patientId, document);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to open patient document",
      );
    } finally {
      setOpeningDocumentId("");
    }
  };

  // ==========================================================
  // DELETE DOCUMENT
  // ==========================================================

  const removePatientDocument = async (documentId) => {
    if (!documentId || deletingDocumentId) {
      return;
    }

    if (!window.confirm("Delete this patient document?")) {
      return;
    }

    setDeletingDocumentId(documentId);
    setError("");

    try {
      await deletePatientDocument(patientId, documentId);

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete patient document",
      );
    } finally {
      setDeletingDocumentId("");
    }
  };

  // ==========================================================
  // SAVE PATIENT
  // ==========================================================

  const saveEdit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await updatePatient(patientId, {
        ...editForm,

        firstName: editForm.firstName.trim(),

        lastName: editForm.lastName.trim(),

        phone: editForm.phone.trim(),

        alternatePhone: editForm.alternatePhone.trim(),

        email: editForm.email.trim().toLowerCase(),

        notes: editForm.notes.trim(),
      });

      const updated =
        response?.data?.patient || response?.data || response?.patient || null;

      if (updated && typeof updated === "object") {
        setPatient(updated);
      } else {
        await load();
      }

      setEditOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update patient");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Loading patient record...
      </div>
    );
  }

  // ==========================================================
  // NOT FOUND
  // ==========================================================

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Patient not found"}
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6 py-5 sm:py-7">
      {/* =====================================================
          TOP ACTION BAR
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}/consultations/new`)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-violet-500 hover:to-blue-500"
          >
            <ClipboardPlus size={15} />
            Consultation
          </button>

          <button
            type="button"
            onClick={() => setDocumentOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
          >
            <Upload size={15} />
            Upload documents
          </button>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Edit3 size={15} />
            Edit patient
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          MAIN PATIENT CARD
      ====================================================== */}

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* ===================================================
            PATIENT HEADER
        ==================================================== */}

        <header className="bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Patient identity */}

            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-100">
                {patient.firstName?.[0]}
                {patient.lastName?.[0]}
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-600">
                  Patient record
                </div>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {fullName(patient)}
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                  {patient.patientNumber || "No patient number"}

                  {" · "}

                  {patient.gender
                    ? roleLabel(patient.gender)
                    : "Gender not recorded"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    label={
                      patient.status === "inactive" ? "Inactive" : "Active"
                    }
                  />

                  {patient.source && (
                    <Badge
                      label={`Source: ${roleLabel(patient.source)}`}
                      tone="blue"
                    />
                  )}

                  {/* AGE BADGE */}

                  {patientAge !== null && (
                    <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                      {patientAge} years
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                QUICK INFORMATION
            ================================================== */}

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/90 bg-white/75 p-4 sm:grid-cols-5">
              <Info
                label="Date of birth"
                value={formatDate(patient.dateOfBirth)}
              />

              <Info
                label="Age"
                value={patientAge !== null ? `${patientAge} years` : "—"}
              />

              <Info label="Phone" value={patient.phone} />

              <Info
                label="Last consultation"
                value={formatDate(
                  patient.lastConsultationAt ||
                    latestConsultation?.consultationDate,
                )}
              />

              <Info
                label="Next recall"
                value={formatDate(patient.nextRecallAt)}
              />
            </div>
          </div>
        </header>

        {/* ===================================================
            BODY
        ==================================================== */}

        <div className="grid xl:grid-cols-[1.35fr_.65fr]">
          <section className="divide-y divide-slate-200">
            {/* =================================================
                PERSONAL DETAILS
            ================================================== */}

            <DocSection title="Personal & contact details">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <Info label="First name" value={patient.firstName} />

                <Info label="Surname" value={patient.lastName} />

                <Info
                  label="Date of birth"
                  value={formatDate(patient.dateOfBirth)}
                />

                <Info
                  label="Age"
                  value={patientAge !== null ? `${patientAge} years` : "—"}
                />

                <Info
                  label="Gender"
                  value={patient.gender ? roleLabel(patient.gender) : "—"}
                />

                <Info label="Email" value={patient.email} />

                <Info label="Phone" value={patient.phone} />

                <Info label="Alternate phone" value={patient.alternatePhone} />

                <Info label="Occupation" value={patient.occupation} />

                <Info
                  label="Preferred language"
                  value={patient.preferredLanguage}
                />

                <Info label="Source" value={roleLabel(patient.source)} />

                <Info label="External reference" value={patient.externalNo} />
              </div>
            </DocSection>

            {/* =================================================
                ADDRESS
            ================================================== */}

            <DocSection title="Address">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {[
                  patient.address?.line1,
                  patient.address?.line2,
                  patient.address?.city,
                  patient.address?.state,
                  patient.address?.pincode,
                  patient.address?.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "No address recorded."}
              </div>
            </DocSection>

            {/* =================================================
                EMERGENCY CONTACT
            ================================================== */}

            <DocSection title="Emergency contact">
              <div className="grid gap-5 sm:grid-cols-3">
                <Info label="Name" value={patient.emergencyContact?.name} />

                <Info
                  label="Relationship"
                  value={patient.emergencyContact?.relationship}
                />

                <Info label="Phone" value={patient.emergencyContact?.phone} />
              </div>
            </DocSection>

            {/* =================================================
                DOCUMENTS
            ================================================== */}

            <DocSection title="Patient documents">
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                      <FileText size={18} />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Documents & attachments
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Store referrals, reports, prescriptions, IDs, clinical
                        images and other files against this patient record.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDocumentOpen(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Upload size={14} />
                    Upload document
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Document</th>

                      <th className="pb-3">Category</th>

                      <th className="pb-3">Uploaded</th>

                      <th className="pb-3">Note</th>

                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Array.isArray(patient.documents) &&
                    patient.documents.length ? (
                      patient.documents.map((doc) => (
                        <tr
                          key={doc._id || doc.url || doc.name}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <FileText size={14} />
                              </div>

                              <div className="min-w-0">
                                <div className="max-w-[230px] truncate text-xs font-semibold text-slate-700">
                                  {doc.name || doc.originalName || "Document"}
                                </div>

                                <div className="mt-0.5 text-[10px] text-slate-400">
                                  {doc.mimeType || doc.type || "File"}

                                  {doc.size
                                    ? ` · ${formatBytes(doc.size)}`
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 text-xs text-slate-600">
                            {doc.category || "Other"}
                          </td>

                          <td className="py-3 text-xs text-slate-600">
                            {formatDate(doc.createdAt || doc.uploadedAt)}
                          </td>

                          <td className="max-w-[220px] py-3 text-xs text-slate-500">
                            {doc.note || "—"}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {doc._id && (
                                <button
                                  type="button"
                                  onClick={() => openDocument(doc)}
                                  disabled={openingDocumentId === doc._id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                                >
                                  <Download size={12} />

                                  {openingDocumentId === doc._id
                                    ? "Opening..."
                                    : "Open"}
                                </button>
                              )}

                              {(doc._id || doc.id) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removePatientDocument(doc._id || doc.id)
                                  }
                                  disabled={
                                    deletingDocumentId === (doc._id || doc.id)
                                  }
                                  className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                  aria-label="Delete document"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <FileText
                            size={26}
                            className="mx-auto text-slate-300"
                          />

                          <div className="mt-2 text-xs font-semibold text-slate-500">
                            No documents uploaded yet
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            Upload patient files to keep the complete record
                            together.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* =================================================
                CONSULTATION HISTORY
            ================================================== */}

            <DocSection title="Consultation history">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Date</th>

                      <th className="pb-3">Clinician</th>

                      <th className="pb-3">Type</th>

                      <th className="pb-3">Given Rx</th>

                      <th className="pb-3">Recall</th>

                      <th className="pb-3 text-right">Open</th>
                    </tr>
                  </thead>

                  <tbody>
                    {consultations.length ? (
                      consultations.map((consultation) => (
                        <tr
                          key={consultation._id}
                          className="border-b border-slate-100 transition hover:bg-slate-50/70"
                        >
                          <td className="py-3 font-semibold text-slate-700">
                            {formatDate(consultation.consultationDate)}
                          </td>

                          <td className="py-3">
                            {[
                              consultation.optometristId?.firstName,

                              consultation.optometristId?.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </td>

                          <td className="py-3">
                            {roleLabel(consultation.consultationType)}
                          </td>

                          <td className="py-3">
                            <span className="font-mono text-xs text-slate-600">
                              {consultation.givenRx?.right?.sphere || "—"}

                              {" / "}

                              {consultation.givenRx?.left?.sphere || "—"}
                            </span>
                          </td>

                          <td className="py-3">
                            {formatDate(consultation.recallDue)}
                          </td>

                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openConsultation(consultation)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              View clinical
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-xs text-slate-400"
                        >
                          No consultations recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* =================================================
                CARE PATHWAYS
            ================================================== */}
            <DocSection title="Care pathways">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs leading-5 text-slate-500">
                  Clinical examinations and optical dispensing are separate workflows. Start the appropriate workflow below; each opens its own dedicated page.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ServiceActionButton
                    icon={Glasses}
                    label="New Spectacle Job"
                    description="Create an optical order from the latest prescription"
                    onClick={() => navigate(`/optical/spectacles/new/${patientId}`)}
                  />
                  <ServiceActionButton
                    icon={ContactRound}
                    label="Contact Lens Dispensing"
                    description="Open contact lens order and fitting"
                    onClick={() => navigate(`/optical/contact-lenses/new?patientId=${patientId}`)}
                  />
                  <ServiceActionButton
                    icon={Eye}
                    label="Additional Consultation"
                    description="Start a focused clinical assessment"
                    onClick={() => setServiceModal("additional")}
                  />
                </div>
              </div>
            </DocSection>
          </section>

          {/* ===================================================
              SIDEBAR
          ==================================================== */}

          <aside className="bg-gradient-to-b from-slate-50 to-white p-5 sm:p-7">
            <div className="space-y-4">
              <SideCard
                icon={Phone}
                label="Phone"
                value={patient.phone || "Not recorded"}
              />

              <SideCard
                icon={Mail}
                label="Email"
                value={patient.email || "Not recorded"}
              />

              <SideCard
                icon={CalendarDays}
                label="Recall"
                value={formatDate(patient.nextRecallAt)}
              />

              <SideCard
                icon={UserRound}
                label="Registered practice"
                value={patient.registeredBranchId?.name || "Practice"}
              />
            </div>

            {/* =================================================
                PATIENT NOTES
            ================================================== */}

            <div className="mt-6 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Patient notes
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {patient.notes || "No notes recorded."}
              </p>
            </div>

            {/* =================================================
                CLINICAL SUMMARY
            ================================================== */}

            <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Clinical summary
              </div>

              {/* Patient quick facts */}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat
                  label="Age"
                  value={patientAge !== null ? `${patientAge}` : "—"}
                />

                <Stat label="Consultations" value={consultations.length} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat
                  label="Given Rx"
                  value={latestConsultation?.givenRx ? "Available" : "—"}
                />

                <Stat
                  label="Recall"
                  value={patient.nextRecallAt ? "Active" : "—"}
                />
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/patients/${patientId}/consultations/new`)
                  }
                  className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardPlus size={14} />
                    Start new consultation
                  </span>
                  <span className="text-[10px] text-blue-400">Clinical</span>
                </button>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <ServiceActionButton
                    icon={Glasses}
                    label="Optical Dispensing"
                    description="Spectacle job"
                    onClick={() => navigate(`/optical/spectacles/new/${patientId}`)}
                  />
                  <ServiceActionButton
                    icon={ContactRound}
                    label="Contact Lens Dispensing"
                    description="Lens order & fitting"
                    onClick={() => navigate(`/optical/contact-lenses/new?patientId=${patientId}`)}
                  />
                  <ServiceActionButton
                    icon={Eye}
                    label="Additional Consultation"
                    description="CL · BV · LV"
                    onClick={() => setServiceModal("additional")}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="border-t-2 border-slate-900 bg-slate-50 px-5 py-4 text-xs text-slate-400 sm:px-8">
          <div className="flex flex-wrap justify-between gap-3">
            <span>VividOpt · Patient Record</span>

            <span>Created {formatDate(patient.createdAt)}</span>
          </div>
        </footer>
      </article>

      {/* =======================================================
          MODALS
      ======================================================== */}

      {documentOpen && (
        <DocumentUploadModal
          files={documentFiles}
          setFiles={setDocumentFiles}
          category={documentCategory}
          setCategory={setDocumentCategory}
          note={documentNote}
          setNote={setDocumentNote}
          uploading={uploadingDocuments}
          onClose={() => !uploadingDocuments && setDocumentOpen(false)}
          onSubmit={handleDocumentUpload}
        />
      )}

      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          loading={loadingConsultation}
          onClose={() => setSelectedConsultation(null)}
        />
      )}

      {serviceModal && (
        <PatientServiceModal
          type={serviceModal}
          patient={patient}
          latestConsultation={latestConsultation}
          onClose={() => setServiceModal(null)}
        />
      )}

      {editOpen && (
        <EditPatientModal
          form={editForm}
          saving={saving}
          setForm={setEditForm}
          onClose={() => setEditOpen(false)}
          onSubmit={saveEdit}
        />
      )}
    </div>
  );
}

// ============================================================
// EDIT PATIENT MODAL
// ============================================================

function EditPatientModal({ form, setForm, saving, onClose, onSubmit }) {
  const age = calculateAge(form.dateOfBirth);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
              Patient maintenance
            </div>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Edit patient
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <EditInput
              label="First name"
              value={form.firstName}
              onChange={(value) =>
                setForm({
                  ...form,
                  firstName: value,
                })
              }
              required
            />

            <EditInput
              label="Surname"
              value={form.lastName}
              onChange={(value) =>
                setForm({
                  ...form,
                  lastName: value,
                })
              }
            />

            <EditInput
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(value) =>
                setForm({
                  ...form,
                  dateOfBirth: value,
                })
              }
            />

            {/* AGE */}

            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Age
              </span>

              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                {age !== null ? `${age} years` : "Calculated from DOB"}
              </div>
            </div>

            <EditInput
              label="Gender"
              value={form.gender}
              onChange={(value) =>
                setForm({
                  ...form,
                  gender: value,
                })
              }
            />

            <EditInput
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                setForm({
                  ...form,
                  phone: value,
                })
              }
              required
            />

            <EditInput
              label="Alternate phone"
              value={form.alternatePhone}
              onChange={(value) =>
                setForm({
                  ...form,
                  alternatePhone: value,
                })
              }
            />

            <EditInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                setForm({
                  ...form,
                  email: value,
                })
              }
            />

            <EditInput
              label="Source"
              value={form.source}
              onChange={(value) =>
                setForm({
                  ...form,
                  source: value,
                })
              }
            />

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Notes
              </span>

              <textarea
                rows={6}
                value={form.notes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    notes: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Save size={14} />

              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// PATIENT SERVICE ACTION BUTTON
// ============================================================

function ServiceActionButton({ icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold text-slate-800">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[9px] text-slate-400">
          {description}
        </span>
      </span>
    </button>
  );
}

// ============================================================
// PATIENT SERVICE MODAL
// ============================================================

function PatientServiceModal({ type, patient, latestConsultation, onClose }) {
  const [contactStep, setContactStep] = useState("consultation");

  const patientDisplayName = fullName(patient) || "Patient";
  const right = latestConsultation?.givenRx?.right || {};
  const left = latestConsultation?.givenRx?.left || {};

  const title =
    type === "optical"
      ? "Optical Dispensing"
      : type === "contact"
        ? "Contact Lens Dispensing"
        : "Additional Consultation";

  const subtitle =
    type === "optical"
      ? "Spectacle dispensing record"
      : type === "contact"
        ? "Contact lens order, fitting and follow-up"
        : "Additional clinical assessments for this patient";

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-3 text-white sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {type === "optical" ? (
                <Glasses size={16} />
              ) : type === "contact" ? (
                <ContactRound size={16} />
              ) : (
                <Eye size={16} />
              )}
              <h2 className="truncate text-sm font-bold">{title}</h2>
            </div>
            <p className="mt-0.5 truncate text-[9px] text-slate-300">
              {patientDisplayName} · {patient?.patientNumber || "No patient number"} · {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto bg-slate-50 p-3 sm:p-5">
          {type === "optical" && (
            <OpticalDispensingModalContent
              patient={patient}
              consultation={latestConsultation}
              right={right}
              left={left}
            />
          )}

          {type === "contact" && (
            <ContactLensDispensingModalContent
              patient={patient}
              consultation={latestConsultation}
              step={contactStep}
              setStep={setContactStep}
            />
          )}

          {type === "additional" && <AdditionalConsultModalContent patientId={patient?._id || patient?.id} />}
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="text-[9px] text-slate-400">
            Patient record · {patient?.patientNumber || "No reference"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-lg bg-slate-950 px-4 text-[10px] font-bold text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value = "", placeholder = "", className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        defaultValue={value || ""}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

function SectionTitle({ number, title, action }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        {number && <span className="text-[9px] font-bold text-blue-600">{number}.</span>}
        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-700">
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

function OpticalDispensingModalContent({ patient, consultation, right, left }) {
  const [form, setForm] = useState(() => ({
    jobNo: "",
    jobDate: new Date().toISOString().slice(0, 10),
    specDue: "",
    jobType: "New Spectacle",
    status: "Draft",
    dispenser: "",
    saleBy: "",
    saleByFs: "",
    rxDate: consultation?.consultationDate
      ? new Date(consultation.consultationDate).toISOString().slice(0, 10)
      : "",
    pd: consultation?.pd?.total || "",
    monoRight: "",
    monoLeft: "",
    use: "Near",
    frameCode: "",
    frameDescription: "",
    toReorder: "",
    frameSize: "",
    depth: "",
    ed: "",
    frameType: "MM",
    frameOther: "",
    fitting: "",
    frameDiscount: "",
    framePrice: "",
    lensRows: [
      { eye: "Right", code: "", description: "", size: "", segSize: "", segHt: "", ocHt: "", horDecen: "", verDecen: "", bc: "", lensSup: "", orderDate: "", price: "" },
      { eye: "Left", code: "", description: "", size: "", segSize: "", segHt: "", ocHt: "", horDecen: "", verDecen: "", bc: "", lensSup: "", orderDate: "", price: "" },
    ],
    extra1: "",
    extra1Price: "",
    extra2: "",
    extra2Price: "",
    extra3: "",
    extra3Price: "",
    others: "",
    labInstructions: "",
    labApply1: "",
    labApply2: "",
    labApply3: "",
    labFit: "",
    discountReason: "",
    overallDiscount: "",
    lensDiscount: "",
    billingNo: "",
    gst: "",
    total: "",
    followUpDate: "",
    notes: "",
  }));

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setLensField = (index, key, value) => {
    setForm((current) => ({
      ...current,
      lensRows: current.lensRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const num = (value) => Number(value || 0);
  const lensTotal = form.lensRows.reduce((sum, row) => sum + num(row.price), 0);
  const extrasTotal =
    num(form.extra1Price) + num(form.extra2Price) + num(form.extra3Price);
  const calculatedSubtotal =
    num(form.framePrice) + lensTotal + extrasTotal;
  const calculatedTotal = Math.max(
    0,
    calculatedSubtotal -
      num(form.frameDiscount) -
      num(form.overallDiscount) -
      num(form.lensDiscount),
  );
  const displayedTotal = form.total === "" ? calculatedTotal : num(form.total);

  const money = (value) => `₹${num(value).toFixed(2)}`;

  const rxFields = [
    ["sphere", "Sphere"],
    ["cylinder", "Cyl"],
    ["axis", "Axis"],
    ["add", "Add"],
    ["inter", "Inter"],
    ["prism", "H Prism"],
    ["base", "V Prism"],
  ];

  const lensHeaders = [
    ["code", "Lens Code"],
    ["description", "Lens Description"],
    ["size", "Lens Size"],
    ["segSize", "Seg Size"],
    ["segHt", "Seg Ht"],
    ["ocHt", "OC Ht"],
    ["horDecen", "Hor Decen"],
    ["verDecen", "Ver Decen"],
    ["bc", "BC"],
    ["lensSup", "Lens Sup"],
    ["orderDate", "Supplier Order Date"],
    ["price", "Lens Price $"],
  ];

  return (
    <div className="space-y-3 text-slate-800">
      {/* JOB HEADER */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle number="01" title="Spectacle details" action={<span className="text-[8px] font-semibold text-slate-400">Production dispensing record</span>} />

        <div className="grid gap-px bg-slate-200 md:grid-cols-12">
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Job Date" value={form.jobDate} onChange={(v) => setField("jobDate", v)} type="date" />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Spec Due" value={form.specDue} onChange={(v) => setField("specDue", v)} type="date" />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Job No" value={form.jobNo} onChange={(v) => setField("jobNo", v)} placeholder="SP-000359" />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Job Type" value={form.jobType} onChange={(v) => setField("jobType", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Status" value={form.status} onChange={(v) => setField("status", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Dispenser" value={form.dispenser} onChange={(v) => setField("dispenser", v)} />
          </div>

          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Rx Date" value={form.rxDate} onChange={(v) => setField("rxDate", v)} type="date" />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Sale by" value={form.saleBy} onChange={(v) => setField("saleBy", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="by FS" value={form.saleByFs} onChange={(v) => setField("saleByFs", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="PD" value={form.pd} onChange={(v) => setField("pd", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-1">
            <DispenseField label="Mono R" value={form.monoRight} onChange={(v) => setField("monoRight", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-1">
            <DispenseField label="Mono L" value={form.monoLeft} onChange={(v) => setField("monoLeft", v)} />
          </div>
          <div className="bg-white p-2 md:col-span-2">
            <DispenseField label="Use" value={form.use} onChange={(v) => setField("use", v)} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 px-3 py-2">
          <div className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Patient
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px]">
            <span><b className="text-slate-400">Name:</b> {fullName(patient) || "—"}</span>
            <span><b className="text-slate-400">Patient No:</b> {patient?.patientNumber || "—"}</span>
            <span><b className="text-slate-400">Phone:</b> {patient?.phone || "—"}</span>
          </div>
        </div>
      </div>

      {/* PRESCRIPTION */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle number="02" title="Rx" action={<span className="text-[8px] font-semibold text-blue-600">Latest given prescription</span>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-[9px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-20 border border-slate-200 px-2 py-2 text-left font-bold text-slate-500">Eye</th>
                {rxFields.map(([, label]) => (
                  <th key={label} className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Right", right],
                ["Left", left],
              ].map(([eyeName, values]) => (
                <tr key={eyeName}>
                  <td className="border border-slate-200 bg-slate-50 px-2 py-2 font-bold">{eyeName}</td>
                  {rxFields.map(([key]) => (
                    <td key={key} className="border border-slate-200 px-2 py-2 text-center font-mono font-semibold text-slate-700">
                      {values?.[key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FRAME */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle number="03" title="Frame" action={<span className="text-[8px] text-slate-400">Frame / fitting / reorder</span>} />
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-12">
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Frame Code" value={form.frameCode} onChange={(v) => setField("frameCode", v)} placeholder="OPT000007" /></div>
          <div className="bg-white p-2 lg:col-span-5"><DispenseField label="Frame Description" value={form.frameDescription} onChange={(v) => setField("frameDescription", v)} placeholder="Gucci, 111, Silver, 48-18, 140" /></div>
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="To Reorder ₹" value={form.toReorder} onChange={(v) => setField("toReorder", v)} /></div>
          <div className="bg-white p-2 lg:col-span-1"><DispenseField label="Size" value={form.frameSize} onChange={(v) => setField("frameSize", v)} /></div>
          <div className="bg-white p-2 lg:col-span-1"><DispenseField label="Depth" value={form.depth} onChange={(v) => setField("depth", v)} /></div>
          <div className="bg-white p-2 lg:col-span-1"><DispenseField label="ED" value={form.ed} onChange={(v) => setField("ed", v)} /></div>

          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Type" value={form.frameType} onChange={(v) => setField("frameType", v)} /></div>
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Other" value={form.frameOther} onChange={(v) => setField("frameOther", v)} /></div>
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Fitting $" value={form.fitting} onChange={(v) => setField("fitting", v)} /></div>
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Fr Discount $" value={form.frameDiscount} onChange={(v) => setField("frameDiscount", v)} /></div>
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Frame Price $" value={form.framePrice} onChange={(v) => setField("framePrice", v)} /></div>
          <div className="bg-white p-2 lg:col-span-2"><DispenseField label="Frame Stock / Ref" value="" onChange={() => {}} placeholder="Inventory" /></div>
        </div>
      </div>

      {/* LENSES */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle number="04" title="Lenses" action={<span className="text-[8px] font-semibold text-slate-400">Right / left dispensing details</span>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-[8px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-500">Eye</th>
                {lensHeaders.map(([, label]) => (
                  <th key={label} className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-500">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lensRows.map((row, index) => (
                <tr key={row.eye}>
                  <td className="border border-slate-200 bg-slate-50 px-2 py-2 font-bold">{row.eye}</td>
                  {lensHeaders.map(([key]) => (
                    <td key={key} className="border border-slate-200 p-1">
                      <input
                        type={key === "orderDate" ? "date" : "text"}
                        value={row[key] || ""}
                        onChange={(event) => setLensField(index, key, event.target.value)}
                        className="h-7 w-full min-w-[58px] rounded border border-slate-200 bg-white px-1.5 text-[8px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXTRAS + LAB */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionTitle number="05" title="Extras & Laboratory" />
        <div className="grid gap-px bg-slate-200 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white">
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
              {[
                ["extra1", "Extra 1", "extra1Price"],
                ["extra2", "Extra 2", "extra2Price"],
                ["extra3", "Extra 3", "extra3Price"],
              ].map(([key, label, priceKey]) => (
                <div key={key} className="bg-white p-2">
                  <div className="grid grid-cols-[1fr_82px] gap-2">
                    <DispenseField label={label} value={form[key]} onChange={(v) => setField(key, v)} />
                    <DispenseField label="Price $" value={form[priceKey]} onChange={(v) => setField(priceKey, v)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2">
              <DispenseField label="Others" value={form.others} onChange={(v) => setField("others", v)} />
            </div>

            <div className="p-2">
              <label className="block">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">Lab Inst.</span>
                <textarea
                  rows={6}
                  value={form.labInstructions}
                  onChange={(event) => setField("labInstructions", event.target.value)}
                  className="w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-[9px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </label>
            </div>
          </div>

          <div className="bg-white">
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
              {[
                ["labApply1", "Lab to Apply 1"],
                ["labApply2", "Lab to Apply 2"],
                ["labApply3", "Lab to Apply 3"],
                ["labFit", "Lab to Fit"],
              ].map(([key, label]) => (
                <div key={key} className="bg-white p-2">
                  <DispenseField label={label} value={form[key]} onChange={(v) => setField(key, v)} />
                </div>
              ))}
            </div>

            <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
              <div className="bg-white p-2"><DispenseField label="Discount Reason" value={form.discountReason} onChange={(v) => setField("discountReason", v)} /></div>
              <div className="bg-white p-2"><DispenseField label="Overall Discount $" value={form.overallDiscount} onChange={(v) => setField("overallDiscount", v)} /></div>
              <div className="bg-white p-2"><DispenseField label="Lens Discount %" value={form.lensDiscount} onChange={(v) => setField("lensDiscount", v)} /></div>
              <div className="bg-white p-2"><DispenseField label="Follow Up" value={form.followUpDate} onChange={(v) => setField("followUpDate", v)} type="date" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING + WORKFLOW */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.25fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <SectionTitle number="06" title="Billing" />
          <div className="p-3">
            <div className="space-y-2 text-[10px]">
              {[
                ["Frame", money(form.framePrice)],
                ["Fitting", money(form.fitting)],
                ["Lenses", money(lensTotal)],
                ["Extras", money(extrasTotal)],
                ["Frame Discount", `- ${money(form.frameDiscount)}`],
                ["Overall Discount", `- ${money(form.overallDiscount)}`],
                ["Lens Discount", `- ${money(form.lensDiscount)}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-dashed border-slate-200" />

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</span>
              <span className="text-lg font-black text-blue-700">{money(displayedTotal)}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <DispenseField label="GST" value={form.gst} onChange={(v) => setField("gst", v)} />
              <DispenseField label="Billing No" value={form.billingNo} onChange={(v) => setField("billingNo", v)} placeholder="BILL0002524" />
            </div>

            <button
              type="button"
              className="mt-3 h-9 w-full rounded-lg bg-slate-950 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Create Bill
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <SectionTitle number="07" title="Order & Progress" />
          <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
            {[
              ["Job Ready F6", "Mark the job ready for collection"],
              ["Notified F7", "Notify the patient"],
              ["Collected F8", "Mark the completed collection"],
              ["Follow Up", "Schedule follow-up"],
              ["Advance Progressive Parameters", "Open advanced progressive settings"],
              ["E.Order", "Open electronic lab order"],
            ].map(([label, description]) => (
              <button
                key={label}
                type="button"
                className="bg-white p-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold text-slate-800">{label}</span>
                  <span className="text-[8px] text-blue-600">Open</span>
                </div>
                <div className="mt-1 text-[8px] leading-4 text-slate-400">{description}</div>
              </button>
            ))}
          </div>

          <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-2">
            <div className="bg-white p-3">
              <DispenseField label="Job Status" value={form.status} onChange={(v) => setField("status", v)} />
            </div>
            <div className="bg-white p-3">
              <DispenseField label="Notes" value={form.notes} onChange={(v) => setField("notes", v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DispenseField({
  label,
  value = "",
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[9px] font-medium text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

function RxDispensingRow({ eye, values }) {
  const fields = ['sphere','cylinder','axis','add','inter','prism','base'];
  return (
    <tr>
      <td className="border border-slate-200 bg-slate-50 px-2 py-2 font-bold">{eye}</td>
      {fields.map((field) => <td key={field} className="border border-slate-200 px-2 py-2 text-center font-mono text-slate-700">{values?.[field] || '—'}</td>)}
    </tr>
  );
}

function ContactLensDispensingModalContent({ patient, consultation, step, setStep }) {
  const steps = [
    ['consultation', '01', 'Additional Consultation'],
    ['order', '02', 'Contact Lens Order'],
    ['fit', '03', 'Trial & Fitting'],
    ['followup', '04', 'Review & Collection'],
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
        <Field label="Patient" value={fullName(patient)} />
        <Field label="Patient No" value={patient?.patientNumber} />
        <Field label="Order Date" value={new Date().toISOString().slice(0, 10)} />
        <Field label="Status" value="Draft" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex min-w-[680px] items-center gap-1">
          {steps.map(([key, number, label], index) => (
            <button key={key} type="button" onClick={() => setStep(key)} className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition ${step === key ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              <span className="text-[8px] font-bold">{number}</span>
              <span className="text-[9px] font-bold">{label}</span>
              {index < steps.length - 1 && <span className="ml-auto text-slate-300">›</span>}
            </button>
          ))}
        </div>
      </div>

      {step === 'consultation' && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <SectionTitle number="01" title="Additional Consultation — Contact Lens" />
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Consult Type" value="Contact Lens Assessment" />
              <Field label="Reason" placeholder="New fit / Review" />
              <Field label="Dominant Eye" />
              <Field label="Previous Lens" />
              <Field label="Unaided VA OD" />
              <Field label="Unaided VA OS" />
              <Field label="Keratometry OD" />
              <Field label="Keratometry OS" />
            </div>
            <div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">Assessment</span><textarea rows="4" className="w-full resize-none rounded-md border border-slate-200 p-2.5 text-[10px] outline-none focus:border-blue-400" /></label>
              <label><span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">Advice / Care</span><textarea rows="4" className="w-full resize-none rounded-md border border-slate-200 p-2.5 text-[10px] outline-none focus:border-blue-400" /></label>
            </div>
          </div>
        </div>
      )}

      {step === 'order' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionTitle number="02" title="Contact Lens Order" />
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[900px] border-collapse text-[9px]">
              <thead><tr className="bg-slate-50 text-slate-500">{['Eye','Lens Type','Brand','Base Curve','Diameter','Sphere','Cylinder','Axis','Add','Supplier','Order Date','Price ₹'].map((head) => <th key={head} className="border border-slate-200 px-2 py-2 text-center font-bold">{head}</th>)}</tr></thead>
              <tbody>{['Right','Left'].map((eye) => <tr key={eye}><td className="border border-slate-200 bg-slate-50 px-2 py-2 font-bold">{eye}</td>{['Soft','Acuvue','8.6','14.2','+1.00','','','','','Supplier','', '1200'].map((value, i) => <td key={i} className="border border-slate-200 p-1"><input defaultValue={value} className="h-7 w-full min-w-[55px] rounded border border-slate-200 px-1.5 text-[9px]" /></td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'fit' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionTitle number="03" title="Trial & Fitting" />
          <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Trial Lens OD" /><Field label="Trial Lens OS" /><Field label="Movement OD" /><Field label="Movement OS" /><Field label="Centration OD" /><Field label="Centration OS" /><Field label="Comfort OD" /><Field label="Comfort OS" />
          </div>
          <div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2"><Field label="Fit Assessment" /><Field label="Final Lens Recommendation" /></div>
        </div>
      )}

      {step === 'followup' && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <SectionTitle number="04" title="Review & Collection" />
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Review Date" /><Field label="Collection Date" /><Field label="Notified Date" /><Field label="Billing No" /></div>
          </div>
          <AdditionalConsultMini />
        </div>
      )}
    </div>
  );
}

function AdditionalConsultMini() {
  return (
    <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
      <SectionTitle number="05" title="Additional Consultations" />
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {['Contact Lens Review','Binocular Vision','Low Vision'].map((item) => (
          <button key={item} type="button" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50">
            <div className="text-[10px] font-bold text-slate-700">{item}</div>
            <div className="mt-0.5 text-[8px] text-slate-400">Open assessment</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdditionalConsultModalContent({ patientId }) {
  const navigate = useNavigate();
  const items = [
    ['Contact Lens Consultation','Assessment, keratometry, trial lens and fitting.'],
    ['Binocular Vision','Accommodation, vergence and binocular assessment.'],
    ['Low Vision','Functional vision assessment and management plan.'],
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="text-[9px] font-bold uppercase tracking-[.14em] text-blue-600">Additional consultation</div>
        <h3 className="mt-1 text-base font-bold text-slate-900">Choose the assessment workflow</h3>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">Each assessment stays attached to the patient record and can be completed independently from the main consultation.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map(([title, description], index) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[9px] font-bold text-white">0{index + 1}</div>
            <h4 className="mt-3 text-xs font-bold text-slate-800">{title}</h4>
            <p className="mt-1 text-[9px] leading-5 text-slate-400">{description}</p>
            <button
              type="button"
              onClick={() => {
                const focus = index === 0 ? "contact_lenses" : index === 1 ? "binocular_vision" : "low_vision";
                navigate(`/patients/${patientId}/consultations/new?focus=${focus}`);
              }}
              className="mt-4 h-8 w-full rounded-lg border border-slate-200 bg-white text-[9px] font-bold text-slate-600 hover:bg-slate-50"
            >
              Open assessment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CONSULTATION MODAL
// ============================================================

function ConsultationModal({ consultation, onClose, loading }) {
  const right = consultation?.givenRx?.right || {};

  const left = consultation?.givenRx?.left || {};

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-violet-50 to-blue-50 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
              Clinical record
            </div>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Consultation · {formatDate(consultation?.consultationDate)}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading latest clinical details..."
                : roleLabel(consultation?.consultationType)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white bg-white/80 p-2 text-slate-500"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          {/* QUICK INFO */}

          <div className="grid gap-4 sm:grid-cols-4">
            <Mini label="Medication" value={consultation?.medication} />

            <Mini label="Allergy" value={consultation?.allergy} />

            <Mini label="Recall" value={formatDate(consultation?.recallDue)} />

            <Mini
              label="Clinician"
              value={
                [
                  consultation?.optometristId?.firstName,

                  consultation?.optometristId?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") || "—"
              }
            />
          </div>

          {/* GIVEN RX */}

          <section className="overflow-hidden rounded-2xl border border-slate-200">
            <header className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700">
              Given prescription
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 text-left">Eye</th>

                    {[
                      "Sphere",
                      "Cylinder",
                      "Axis",
                      "VA",
                      "Add",
                      "Inter",
                      "Prism",
                      "Base",
                    ].map((field) => (
                      <th key={field} className="px-2 py-3 text-center">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <RxRow code="OD" values={right} tone="blue" />

                  <RxRow code="OS" values={left} tone="rose" />
                </tbody>
              </table>
            </div>
          </section>

          {/* CLINICAL INFORMATION */}

          <div className="grid gap-4 lg:grid-cols-2">
            <MiniPanel title="Symptoms" value={consultation?.symptoms} />

            <MiniPanel
              title="Examination"
              value={[consultation?.ophthalmoscopy, consultation?.biomicroscopy]
                .filter(Boolean)
                .join("\n\n")}
            />

            <MiniPanel
              title="Visual field / colour vision"
              value={[consultation?.visualField, consultation?.colourVision]
                .filter(Boolean)
                .join("\n\n")}
            />

            <MiniPanel
              title="Clinical notes"
              value={consultation?.notes || consultation?.givenRx?.note}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RX ROW
// ============================================================

function RxRow({ code, values, tone }) {
  const fields = [
    "sphere",
    "cylinder",
    "axis",
    "va",
    "add",
    "inter",
    "prism",
    "base",
  ];

  return (
    <tr className="border-b border-slate-100">
      <th
        className={`px-4 py-3 text-left text-xs font-bold ${
          tone === "blue"
            ? "bg-blue-50 text-blue-800"
            : "bg-rose-50 text-rose-800"
        }`}
      >
        {code}
      </th>

      {fields.map((field) => (
        <td
          key={field}
          className="px-2 py-3 text-center font-mono text-xs text-slate-700"
        >
          {values?.[field] || "—"}
        </td>
      ))}
    </tr>
  );
}

// ============================================================
// BADGE
// ============================================================

function Badge({ label, tone = "green" }) {
  const classes =
    tone === "blue"
      ? "border-blue-100 bg-blue-50 text-blue-700"
      : "border-emerald-100 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${classes}`}
    >
      {label}
    </span>
  );
}

// ============================================================
// DOCUMENT SECTION
// ============================================================

function DocSection({ title, children }) {
  return (
    <section className="p-5 sm:p-7">
      <h2 className="mb-5 text-xs font-bold uppercase tracking-[.16em] text-slate-800">
        {title}
      </h2>

      {children}
    </section>
  );
}

// ============================================================
// INFO
// ============================================================

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

// ============================================================
// SIDE CARD
// ============================================================

function SideCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </div>

        <div className="mt-0.5 break-all text-sm font-semibold text-slate-700">
          {value}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT
// ============================================================

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-3 text-center">
      <div className="text-lg font-bold text-slate-900">{value}</div>

      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}

// ============================================================
// MINI
// ============================================================

function Mini({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

// ============================================================
// MINI PANEL
// ============================================================

function MiniPanel({ title, value }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </div>

      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {value || "—"}
      </div>
    </section>
  );
}

// ============================================================
// EDIT INPUT
// ============================================================

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
      />
    </label>
  );
}

// ============================================================
// FILE SIZE
// ============================================================

function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (!value) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );

  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

// ============================================================
// DOCUMENT UPLOAD MODAL
// ============================================================

function DocumentUploadModal({
  files,
  setFiles,
  category,
  setCategory,
  note,
  setNote,
  uploading,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <header className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
              Patient record
            </div>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Upload documents
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Attach one or more files to this patient's record.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </header>

        {/* FORM */}

        <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
          {/* FILES */}

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Files
            </span>

            <input
              type="file"
              multiple
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
              className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              required={!files.length}
            />
          </label>

          {/* SELECTED FILES */}

          {files.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected files
              </div>

              <div className="space-y-1.5">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
                  >
                    <div className="min-w-0 truncate text-xs font-semibold text-slate-700">
                      {file.name}
                    </div>

                    <div className="shrink-0 text-[10px] text-slate-400">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY / NOTE */}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Category
              </span>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              >
                {[
                  ["referral", "Referral"],
                  ["prescription", "Prescription"],
                  ["clinical_report", "Clinical report"],
                  ["identity", "Identity document"],
                  ["clinical_image", "Clinical image"],
                  ["insurance", "Insurance"],
                  ["other", "Other"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Note
              </span>

              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional description"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
              />
            </label>
          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!files.length || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Upload size={14} />

              {uploading
                ? "Uploading..."
                : `Upload ${files.length ? `(${files.length})` : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
