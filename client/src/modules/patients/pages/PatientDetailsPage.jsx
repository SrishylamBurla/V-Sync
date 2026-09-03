import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardPlus,
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
import {
  getPatient,
  updatePatient,
} from "../patient.api";
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

const fullName = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const roleLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentCategory, setDocumentCategory] = useState("other");
  const [documentNote, setDocumentNote] = useState("");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [patientResponse, consultationsResponse, patientDocumentsResponse] = await Promise.all([
        getPatient(patientId),
        getPatientConsultations(patientId),
        getPatientDocuments(patientId),
      ]);

      const patientData =
        patientResponse?.data?.patient ||
        patientResponse?.data ||
        patientResponse?.patient ||
        null;

      const consultationRows = Array.isArray(consultationsResponse?.data)
        ? consultationsResponse.data
        : Array.isArray(consultationsResponse?.data?.consultations)
          ? consultationsResponse.data.consultations
          : Array.isArray(consultationsResponse?.consultations)
            ? consultationsResponse.consultations
            : [];

      const documentRows = Array.isArray(patientDocumentsResponse)
        ? patientDocumentsResponse
        : [];

      setPatient({ ...patientData, documents: documentRows });
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
      setError(
        err?.response?.data?.message || "Unable to load patient record"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const latestConsultation = useMemo(
    () => consultations[0] || null,
    [consultations]
  );

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

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (!documentFiles.length || uploadingDocuments) return;

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
          "Unable to upload patient document"
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  const openDocument = async (document) => {
    if (!document?._id || openingDocumentId) return;

    setOpeningDocumentId(document._id);
    setError("");
    try {
      await openPatientDocument(patientId, document);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to open patient document"
      );
    } finally {
      setOpeningDocumentId("");
    }
  };

  const removePatientDocument = async (documentId) => {
    if (!documentId || deletingDocumentId) return;
    if (!window.confirm("Delete this patient document?")) return;

    setDeletingDocumentId(documentId);
    setError("");
    try {
      await deletePatientDocument(patientId, documentId);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete patient document"
      );
    } finally {
      setDeletingDocumentId("");
    }
  };

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
        response?.data?.patient ||
        response?.data ||
        response?.patient ||
        null;

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Loading patient record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Patient not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-5 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}/consultations/new`)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-violet-500 hover:to-blue-500"
          >
            <ClipboardPlus size={15} />
            Consultation
          </button>

          <button
            type="button"
            onClick={() => setDocumentOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <Upload size={15} />
            Upload documents
          </button>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Edit3 size={15} />
            Edit patient
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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
                  {patient.patientNumber || "No patient number"} ·{" "}
                  {patient.gender
                    ? roleLabel(patient.gender)
                    : "Gender not recorded"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge label={patient.status === "inactive" ? "Inactive" : "Active"} />
                  {patient.source && (
                    <Badge
                      label={`Source: ${roleLabel(patient.source)}`}
                      tone="blue"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/90 bg-white/75 p-4 sm:grid-cols-4">
              <Info label="Date of birth" value={date(patient.dateOfBirth)} />
              <Info label="Phone" value={patient.phone} />
              <Info label="Last consultation" value={date(patient.lastConsultationAt || latestConsultation?.consultationDate)} />
              <Info label="Next recall" value={date(patient.nextRecallAt)} />
            </div>
          </div>
        </header>

        <div className="grid xl:grid-cols-[1.35fr_.65fr]">
          <section className="divide-y divide-slate-200">
            <DocSection title="Personal & contact details">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <Info label="First name" value={patient.firstName} />
                <Info label="Surname" value={patient.lastName} />
                <Info label="Email" value={patient.email} />
                <Info label="Phone" value={patient.phone} />
                <Info label="Alternate phone" value={patient.alternatePhone} />
                <Info label="Occupation" value={patient.occupation} />
                <Info label="Preferred language" value={patient.preferredLanguage} />
                <Info label="Source" value={roleLabel(patient.source)} />
                <Info label="External reference" value={patient.externalNo} />
              </div>
            </DocSection>

            <DocSection title="Address">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {[
                  patient.address?.line1,
                  patient.address?.line2,
                  patient.address?.city,
                  patient.address?.state,
                  patient.address?.pincode,
                  patient.address?.country,
                ].filter(Boolean).join(", ") || "No address recorded."}
              </div>
            </DocSection>

            <DocSection title="Emergency contact">
              <div className="grid gap-5 sm:grid-cols-3">
                <Info label="Name" value={patient.emergencyContact?.name} />
                <Info label="Relationship" value={patient.emergencyContact?.relationship} />
                <Info label="Phone" value={patient.emergencyContact?.phone} />
              </div>
            </DocSection>

            <DocSection title="Patient documents">
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Documents & attachments</div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Store referrals, reports, prescriptions, IDs, clinical images and other files against this patient record.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentOpen(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Upload size={14} /> Upload document
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
                    {Array.isArray(patient.documents) && patient.documents.length ? (
                      patient.documents.map((doc) => (
                        <tr key={doc._id || doc.url || doc.name} className="border-b border-slate-100 last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <FileText size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="max-w-[230px] truncate text-xs font-semibold text-slate-700">{doc.name || doc.originalName || "Document"}</div>
                                <div className="mt-0.5 text-[10px] text-slate-400">{doc.mimeType || doc.type || "File"}{doc.size ? ` · ${formatBytes(doc.size)}` : ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-xs text-slate-600">{doc.category || "Other"}</td>
                          <td className="py-3 text-xs text-slate-600">{date(doc.createdAt || doc.uploadedAt)}</td>
                          <td className="max-w-[220px] py-3 text-xs text-slate-500">{doc.note || "—"}</td>
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
                                  {openingDocumentId === doc._id ? "Opening..." : "Open"}
                                </button>
                              )}
                              {(doc._id || doc.id) && (
                                <button type="button" onClick={() => removePatientDocument(doc._id || doc.id)} disabled={deletingDocumentId === (doc._id || doc.id)} className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50" aria-label="Delete document">
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
                          <FileText size={26} className="mx-auto text-slate-300" />
                          <div className="mt-2 text-xs font-semibold text-slate-500">No documents uploaded yet</div>
                          <div className="mt-1 text-[10px] text-slate-400">Upload patient files to keep the complete record together.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DocSection>

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
                            {date(consultation.consultationDate)}
                          </td>
                          <td className="py-3">
                            {[
                              consultation.optometristId?.firstName,
                              consultation.optometristId?.lastName,
                            ].filter(Boolean).join(" ") || "—"}
                          </td>
                          <td className="py-3">
                            {roleLabel(consultation.consultationType)}
                          </td>
                          <td className="py-3">
                            <span className="font-mono text-xs text-slate-600">
                              {consultation.givenRx?.right?.sphere || "—"} /{" "}
                              {consultation.givenRx?.left?.sphere || "—"}
                            </span>
                          </td>
                          <td className="py-3">
                            {date(consultation.recallDue)}
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
                        <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                          No consultations recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DocSection>
          </section>

          <aside className="bg-gradient-to-b from-slate-50 to-white p-5 sm:p-7">
            <div className="space-y-4">
              <SideCard icon={Phone} label="Phone" value={patient.phone || "Not recorded"} />
              <SideCard icon={Mail} label="Email" value={patient.email || "Not recorded"} />
              <SideCard icon={CalendarDays} label="Recall" value={date(patient.nextRecallAt)} />
              <SideCard
                icon={UserRound}
                label="Registered practice"
                value={patient.registeredBranchId?.name || "Practice"}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Patient notes
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {patient.notes || "No notes recorded."}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Clinical summary
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="Consultations" value={consultations.length} />
                <Stat label="Given Rx" value={latestConsultation?.givenRx ? "Available" : "—"} />
              </div>
              <button
                type="button"
                onClick={() => navigate(`/patients/${patientId}/consultations/new`)}
                className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50"
              >
                Start new consultation
              </button>
            </div>
          </aside>
        </div>

        <footer className="border-t-2 border-slate-900 bg-slate-50 px-5 py-4 text-xs text-slate-400 sm:px-8">
          <div className="flex flex-wrap justify-between gap-3">
            <span>VividOpt · Patient Record</span>
            <span>Created {date(patient.createdAt)}</span>
          </div>
        </footer>
      </article>

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

function EditPatientModal({ form, setForm, saving, onClose, onSubmit }) {
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
            <EditInput label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <EditInput label="Surname" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <EditInput label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <EditInput label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
            <EditInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            <EditInput label="Alternate phone" value={form.alternatePhone} onChange={(v) => setForm({ ...form, alternatePhone: v })} />
            <EditInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <EditInput label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Notes
              </span>
              <textarea
                rows={6}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
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
              Consultation · {date(consultation?.consultationDate)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Loading latest clinical details..." : roleLabel(consultation?.consultationType)}
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
          <div className="grid gap-4 sm:grid-cols-4">
            <Mini label="Medication" value={consultation?.medication} />
            <Mini label="Allergy" value={consultation?.allergy} />
            <Mini label="Recall" value={date(consultation?.recallDue)} />
            <Mini
              label="Clinician"
              value={[
                consultation?.optometristId?.firstName,
                consultation?.optometristId?.lastName,
              ].filter(Boolean).join(" ") || "—"}
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200">
            <header className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700">
              Given prescription
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 text-left">Eye</th>
                    {["Sphere", "Cylinder", "Axis", "VA", "Add", "Inter", "Prism", "Base"].map((field) => (
                      <th key={field} className="px-2 py-3 text-center">{field}</th>
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

          <div className="grid gap-4 lg:grid-cols-2">
            <MiniPanel title="Symptoms" value={consultation?.symptoms} />
            <MiniPanel title="Examination" value={[consultation?.ophthalmoscopy, consultation?.biomicroscopy].filter(Boolean).join("\n\n")} />
            <MiniPanel title="Visual field / colour vision" value={[consultation?.visualField, consultation?.colourVision].filter(Boolean).join("\n\n")} />
            <MiniPanel title="Clinical notes" value={consultation?.notes || consultation?.givenRx?.note} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RxRow({ code, values, tone }) {
  const fields = ["sphere", "cylinder", "axis", "va", "add", "inter", "prism", "base"];
  return (
    <tr className="border-b border-slate-100">
      <th className={`px-4 py-3 text-left text-xs font-bold ${tone === "blue" ? "text-blue-800 bg-blue-50" : "text-rose-800 bg-rose-50"}`}>
        {code}
      </th>
      {fields.map((field) => (
        <td key={field} className="px-2 py-3 text-center font-mono text-xs text-slate-700">
          {values?.[field] || "—"}
        </td>
      ))}
    </tr>
  );
}

function Badge({ label, tone = "green" }) {
  const classes =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${classes}`}>
      {label}
    </span>
  );
}

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

function EditInput({ label, value, onChange, type = "text", required = false }) {
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


function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function DocumentUploadModal({ files, setFiles, category, setCategory, note, setNote, uploading, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">Patient record</div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Upload documents</h2>
            <p className="mt-1 text-xs text-slate-500">Attach one or more files to this patient's record.</p>
          </div>
          <button type="button" onClick={onClose} disabled={uploading} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-40"><X size={16} /></button>
        </header>

        <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Files</span>
            <input
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              required={!files.length}
            />
          </label>

          {files.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected files</div>
              <div className="space-y-1.5">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                    <div className="min-w-0 truncate text-xs font-semibold text-slate-700">{file.name}</div>
                    <div className="shrink-0 text-[10px] text-slate-400">{formatBytes(file.size)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white">
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
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Note</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional description" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white" />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} disabled={uploading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Cancel</button>
            <button type="submit" disabled={!files.length || uploading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
              <Upload size={14} /> {uploading ? 'Uploading...' : `Upload ${files.length ? `(${files.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
