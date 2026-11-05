
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  ContactRound,
  Download,
  Edit3,
  Eye,
  FileText,
  Glasses,
  History,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Stethoscope,
  Trash2,
  Upload,
  UserRound,
  Wallet,
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

import { getPatientSpectacles } from "../../optical/spectacle.api";
import { getPatientContactLenses } from "../../contactLenses/contactLens.api";

import { getDispensingList } from "../../dispensing/dispensing.api";
import { getSundryJobs } from "../../dispensing/sundryJob.api";
import { getInvoices } from "../../billing/billing.api";
import { getAppointments } from "../../appointments/appointment.api";

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const calculateAge = (dob) => {
  if (!dob) return null;

  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const month = now.getMonth() - birth.getMonth();

  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const roleLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getPatientData = (response) =>
  response?.data?.patient || response?.data || response?.patient || null;

const getRows = (response) =>
  Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : [];

const consultationLabel = (item) => {
  const type = String(item?.consultationType || "").toLowerCase();

  if (type === "short_consult") {
    return "Short Consultation";
  }

  if (type === "comprehensive") {
    return "Comprehensive Consultation";
  }

  if (
    type === "binocular_vision" ||
    item?.specializedType === "binocular_vision"
  ) {
    return "Binocular Vision";
  }

  if (type === "low_vision" || item?.specializedType === "low_vision") {
    return "Low Vision";
  }

  if (
    type === "contact_lens" ||
    type === "contact_lenses" ||
    item?.specializedType === "contact_lens" ||
    item?.specializedType === "contact_lenses"
  ) {
    return "Contact Lens Consultation";
  }

  if (type === "specialized") {
    return roleLabel(item.specializedType || "specialized");
  }

  return "Consultation";
};

const consultationTone = (item) => {
  const type = String(item?.consultationType || "").toLowerCase();

  if (
    type === "binocular_vision" ||
    type === "low_vision" ||
    type === "contact_lens" ||
    type === "contact_lenses" ||
    type === "specialized"
  ) {
    return "violet";
  }

  if (type === "short_consult") {
    return "amber";
  }

  return "blue";
};

const initialEdit = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  source: "",
  notes: "",
};

const sections = [
  ["overview", "Overview"],
  ["consultations", "Consultations"],
  ["optical", "Dispensing"],
  ["appointments", "Appointments"],
  ["billing", "Billing"],
  ["documents", "Documents"],
];

const DEFAULT_PAGE_SIZE = 8;

function usePaginatedRows(rows = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    totalPages,
    pageRows: rows.slice(start, start + pageSize),
    startIndex: start,
  };
}

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);

  const [consultations, setConsultations] = useState([]);
  const [spectacles, setSpectacles] = useState([]);
  const [contactLenses, setContactLenses] = useState([]);
  const [dispensing, setDispensing] = useState([]);
  const [sundryJobs, setSundryJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [loadingConsultation, setLoadingConsultation] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState(initialEdit);

  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentCategory, setDocumentCategory] = useState("other");
  const [documentNote, setDocumentNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documentAction, setDocumentAction] = useState("");

  const age = useMemo(
    () => calculateAge(patient?.dateOfBirth),
    [patient?.dateOfBirth],
  );

  const completedComprehensive = useMemo(
    () =>
      consultations.some(
        (item) =>
          item.consultationType === "comprehensive" &&
          (item.status === "completed" || !item.status),
      ),
    [consultations],
  );

  const shortConsultations = useMemo(
    () =>
      consultations.filter((item) => item.consultationType === "short_consult"),
    [consultations],
  );

  const binocularVisionHistory = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.consultationType === "binocular_vision" ||
          item.specializedType === "binocular_vision",
      ),
    [consultations],
  );

  const lowVisionHistory = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.consultationType === "low_vision" ||
          item.specializedType === "low_vision",
      ),
    [consultations],
  );

  const contactLensConsultationHistory = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.consultationType === "contact_lens" ||
          item.consultationType === "contact_lenses" ||
          item.specializedType === "contact_lens" ||
          item.specializedType === "contact_lenses",
      ),
    [consultations],
  );

  const latestConsultation = consultations[0] || null;

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance || 0),
    0,
  );

  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.paidAmount || 0),
    0,
  );

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((item) => {
        if (!item?.appointmentDate) return false;

        const date = new Date(item.appointmentDate);

        return !Number.isNaN(date.getTime()) && date >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime(),
      );
  }, [appointments]);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!patientId) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const results = await Promise.allSettled([
          getPatient(patientId),
          getPatientConsultations(patientId),
          getPatientSpectacles(patientId),
          getPatientContactLenses(patientId),
          getDispensingList({ patientId }),
          getSundryJobs({ patientId }),
          getInvoices({ patientId }),
          getAppointments({ patientId }),
          getPatientDocuments(patientId),
        ]);

        const patientResult = results[0];

        if (patientResult.status === "rejected") {
          throw patientResult.reason;
        }

        const patientData = getPatientData(patientResult.value);

        if (!patientData) {
          throw new Error("Patient record not found");
        }

        setPatient(patientData);

        setEditForm({
          ...initialEdit,
          firstName: patientData.firstName || "",
          middleName: patientData.middleName || "",
          lastName: patientData.lastName || "",
          dateOfBirth: patientData.dateOfBirth
            ? new Date(patientData.dateOfBirth).toISOString().slice(0, 10)
            : "",
          gender: patientData.gender || "",
          phone: patientData.phone || "",
          alternatePhone: patientData.alternatePhone || "",
          email: patientData.email || "",
          source: patientData.source || "",
          notes: patientData.notes || "",
        });

        const value = (index) =>
          results[index].status === "fulfilled" ? results[index].value : null;

        const consultationRows = getRows(value(1));

        const spectacleRows = getRows(value(2));

        const contactRows = getRows(value(3));

        const dispensingRows = getRows(value(4));

        const sundryRows = getRows(value(5));

        const invoiceRows = getRows(value(6));

        const appointmentRows = getRows(value(7));

        const documentRows = Array.isArray(value(8))
          ? value(8)
          : getRows(value(8));

        setConsultations(consultationRows);

        setSpectacles(spectacleRows);

        setContactLenses(contactRows);

        setDispensing(dispensingRows);

        setSundryJobs(sundryRows);

        setInvoices(invoiceRows);

        setAppointments(appointmentRows);

        setDocuments(documentRows);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load patient workspace",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  /*
   * ----------------------------------------------------------
   * CONSULTATION NAVIGATION
   * ----------------------------------------------------------
   *
   * These are clinical consultation pages.
   *
   * They are intentionally NOT routed through dispensing.
   */

  const startComprehensiveConsultation = () => {
    navigate(`/patients/${patientId}/consultations/new?type=comprehensive`);
  };

  const startShortConsultation = () => {
    navigate(`/patients/${patientId}/consultations/new?type=short_consult`);
  };

  const startBinocularVisionConsultation = () => {
    navigate(`/patients/${patientId}/consultations/binocular-vision`);
  };

  const startLowVisionConsultation = () => {
    navigate(`/patients/${patientId}/consultations/low-vision`);
  };

  const startContactLensConsultation = () => {
    navigate(`/patients/${patientId}/consultations/contact-lens`);
  };

  const startSpecialized = (type) => {
    if (!completedComprehensive) return;

    if (type === "binocular_vision") {
      startBinocularVisionConsultation();
      return;
    }

    if (type === "low_vision") {
      startLowVisionConsultation();
      return;
    }

    if (type === "contact_lenses" || type === "contact_lens") {
      startContactLensConsultation();
    }
  };

  /*
   * ----------------------------------------------------------
   * DISPENSING NAVIGATION
   * ----------------------------------------------------------
   *
   * These are orders/jobs.
   *
   * They must NEVER open a consultation page.
   */

  const startSpectacleJob = () => {
    navigate(`/dispensing/spectacles/new/${patientId}`);
  };

  const startContactLensOrder = () => {
    navigate(`/dispensing/contact-lenses/new?patientId=${patientId}`);
  };

  const startSundryJob = () => {
    navigate(`/dispensing/sundries/new?patientId=${patientId}`);
  };

  const startConsultation = () => {
    startComprehensiveConsultation();
  };

  const openConsultation = async (consultation) => {
    setLoadingConsultation(true);
    setError("");

    try {
      const response = await getConsultation(consultation._id);

      setSelectedConsultation(
        response?.data?.consultation ||
          response?.data ||
          response?.consultation ||
          consultation,
      );
    } catch {
      setSelectedConsultation(consultation);
    } finally {
      setLoadingConsultation(false);
    }
  };

  const savePatient = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await updatePatient(patientId, {
        ...editForm,
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        alternatePhone: editForm.alternatePhone.trim(),
        email: editForm.email.trim().toLowerCase(),
        notes: editForm.notes.trim(),
      });

      const updated = getPatientData(response);

      if (updated) {
        setPatient(updated);
      }

      setEditOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update patient");
    } finally {
      setSaving(false);
    }
  };

  const uploadDocuments = async (event) => {
    event.preventDefault();

    if (!documentFiles.length || uploading) {
      return;
    }

    setUploading(true);
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
      setDocumentOpen(false);

      await load({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to upload document");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (documentId) => {
    if (!documentId || documentAction) {
      return;
    }

    if (!window.confirm("Delete this patient document?")) {
      return;
    }

    setDocumentAction(`delete:${documentId}`);

    try {
      await deletePatientDocument(patientId, documentId);

      await load({
        silent: true,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete document");
    } finally {
      setDocumentAction("");
    }
  };

  const openDocument = async (document) => {
    if (!document?._id || documentAction) {
      return;
    }

    setDocumentAction(`open:${document._id}`);

    try {
      await openPatientDocument(patientId, document);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to open document");
    } finally {
      setDocumentAction("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center bg-[#f4f7fb] px-4">
        <div className="w-full max-w-sm rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Loader2 size={24} className="animate-spin" />
          </div>
          <p className="mt-5 text-sm font-bold text-slate-900">Preparing patient workspace</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">Loading profile, clinical history and linked records.</p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-[72vh] bg-[#f4f7fb] px-4 py-12">
        <div className="mx-auto max-w-xl rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <UserRound size={24} />
          </div>
          <h1 className="mt-5 text-lg font-bold tracking-tight text-slate-950">Unable to open patient record</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{error || "The patient record could not be found or is no longer available."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => navigate("/patients")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
              <ArrowLeft size={14} /> Back to patients
            </button>
            <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800">
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-14 text-slate-800">
      <div className="mx-auto max-w-[1760px] px-3 py-5 sm:px-5 lg:px-7 lg:py-6">
        {/* ================================================== */}
        {/* TOP TOOLBAR */}
        {/* ================================================== */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                <ArrowLeft size={14} />
              </span>
              Back to patients
            </button>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Patient management
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">Workspace</span>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Patient workspace</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">A complete view of patient care, dispensing activity and account history.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load({ silent: true })}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => setDocumentOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Upload size={14} /> Documents
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)] transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <Edit3 size={14} /> Edit patient
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3.5 text-xs font-medium text-red-700 shadow-sm">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* PATIENT HEADER */}
        {/* ================================================== */}

        <header className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.055)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-indigo-50/70 px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-violet-100/30 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              {/* Identity */}

              <div className="flex min-w-0 items-start gap-4">
                <div className="relative">
                  <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-900 text-2xl font-bold text-white shadow-[0_14px_30px_rgba(30,41,59,0.2)] ring-4 ring-white">
                    {(patient.firstName?.[0] || "P").toUpperCase()}
                    {(patient.lastName?.[0] || "").toUpperCase()}
                  </div>

                  <span
                    className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full border-[3px] border-white ${
                      patient.status === "inactive"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
                      Patient
                    </span>

                    {patient.patientNumber && (
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        #{patient.patientNumber}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-[30px]">
                    {fullName(patient) || "Unnamed Patient"}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-slate-500">
                    {age !== null && (
                      <span className="font-medium">{age} years</span>
                    )}

                    {patient.gender && (
                      <>
                        <span className="text-slate-300">•</span>

                        <span>{roleLabel(patient.gender)}</span>
                      </>
                    )}

                    {patient.phone && (
                      <>
                        <span className="text-slate-300">•</span>

                        <span>{patient.phone}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      label={
                        patient.status === "inactive" ? "Inactive" : "Active"
                      }
                      tone={patient.status === "inactive" ? "amber" : "green"}
                    />

                    <Badge
                      label={`${consultations.length} consultations`}
                      tone="blue"
                    />

                    <Badge
                      label={`${invoices.length} invoices`}
                      tone="violet"
                    />

                    {outstanding > 0 && (
                      <Badge
                        label={`${formatMoney(outstanding)} outstanding`}
                        tone="amber"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* QUICK ACTIONS */}
              {/* ================================================== */}

              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-[600px] xl:grid-cols-4">
                {/* Clinical consultation */}
                <QuickAction
                  icon={ClipboardPlus}
                  label="Start Consultation"
                  onClick={startComprehensiveConsultation}
                  primary
                />

                {/* Spectacle ORDER/JOB */}
                <QuickAction
                  icon={Glasses}
                  label="New Spectacle Job"
                  onClick={startSpectacleJob}
                />

                {/* Contact Lens ORDER */}
                <QuickAction
                  icon={ContactRound}
                  label="Contact Lens Order"
                  onClick={startContactLensOrder}
                />

                <QuickAction
                  icon={Receipt}
                  label="Create Bill"
                  onClick={() => navigate(`/billing?patientId=${patientId}`)}
                />
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* SECTION NAVIGATION */}
          {/* ================================================== */}

          <nav className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  activeSection === id
                    ? "bg-slate-950 text-white shadow-[0_5px_14px_rgba(15,23,42,0.15)]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{label}</span>

                {id !== "overview" && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[9px] ${
                      activeSection === id
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {id === "consultations"
                      ? consultations.length
                      : id === "optical"
                        ? spectacles.length + contactLenses.length + sundryJobs.length
                        : id === "appointments"
                          ? appointments.length
                          : id === "billing"
                            ? invoices.length
                            : documents.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Consultations</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><History size={16} /></span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{consultations.length}</div>
            <p className="mt-1 text-[11px] text-slate-500">{latestConsultation ? `Latest · ${formatDate(latestConsultation.consultationDate)}` : "No clinical history yet"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Dispensing records</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Glasses size={16} /></span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{spectacles.length + contactLenses.length + sundryJobs.length}</div>
            <p className="mt-1 text-[11px] text-slate-500">Spectacles, contact lenses and sundries</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Appointments</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><CalendarDays size={16} /></span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{appointments.length}</div>
            <p className="mt-1 text-[11px] text-slate-500">{upcomingAppointments.length} upcoming</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Outstanding balance</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Wallet size={16} /></span>
            </div>
            <div className={`mt-3 text-2xl font-bold tracking-tight ${outstanding > 0 ? "text-amber-700" : "text-slate-950"}`}>{formatMoney(outstanding)}</div>
            <p className="mt-1 text-[11px] text-slate-500">Across {invoices.length} invoice{invoices.length === 1 ? "" : "s"}</p>
          </div>
        </section>

        <main className="mt-5 space-y-5">
          {/* ================================================== */}
          {/* OVERVIEW */}
          {/* ================================================== */}

          {activeSection === "overview" && (
            <section className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
              <Panel title="Patient overview" icon={UserRound}>
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Info
                    label="Date of birth"
                    value={formatDate(patient.dateOfBirth)}
                  />

                  <Info
                    label="Age"
                    value={age === null ? "—" : `${age} years`}
                  />

                  <Info
                    label="Gender"
                    value={patient.gender ? roleLabel(patient.gender) : "—"}
                  />

                  <Info label="Phone" value={patient.phone || "—"} />

                  <Info
                    label="Alternate phone"
                    value={patient.alternatePhone || "—"}
                  />

                  <Info label="Email" value={patient.email || "—"} />

                  <Info
                    label="Source"
                    value={patient.source ? roleLabel(patient.source) : "—"}
                  />

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

                {patient.notes && (
                  <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Patient notes
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                      {patient.notes}
                    </p>
                  </div>
                )}
              </Panel>

              {/* ================================================== */}
              {/* CARE PATHWAY */}
              {/* ================================================== */}
              <Panel title="Care pathway" icon={Stethoscope}>
                <div className="space-y-3">
                  {/* =====================================================
        PRIMARY CONSULTATION
    ===================================================== */}

                  <PathStep
                    done={completedComprehensive}
                    title="Comprehensive Consultation"
                    description={
                      completedComprehensive
                        ? "Completed. Additional clinical consultations are available."
                        : "Full clinical examination, refraction, diagnosis and advice."
                    }
                    onClick={
                      completedComprehensive ? undefined : startConsultation
                    }
                  />

                  <PathStep
                    done={consultations.some(
                      (item) => item.consultationType === "short_consult",
                    )}
                    title="Short Consultation"
                    description="Focused clinical consultation for repeat or limited visits."
                    onClick={startConsultation}
                  />

                  {/* =====================================================
        SPECIALIZED CLINICAL CONSULTATIONS
    ===================================================== */}

                  <div className="pt-3">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Specialized clinical consultations
                    </div>

                    <div className="space-y-2">
                      <PathStep
                        done={consultations.some(
                          (item) =>
                            item.consultationType === "specialized" &&
                            item.specializedType === "binocular_vision",
                        )}
                        title="Binocular Vision"
                        description="Binocular, accommodation and vergence assessment."
                        onClick={() => startSpecialized("binocular_vision")}
                        disabled={!completedComprehensive}
                      />

                      <PathStep
                        done={consultations.some(
                          (item) =>
                            item.consultationType === "specialized" &&
                            item.specializedType === "low_vision",
                        )}
                        title="Low Vision"
                        description="Low vision assessment, aids and management."
                        onClick={() => startSpecialized("low_vision")}
                        disabled={!completedComprehensive}
                      />

                      <PathStep
                        done={consultations.some(
                          (item) =>
                            item.consultationType === "specialized" &&
                            item.specializedType === "contact_lenses",
                        )}
                        title="Contact Lens Consultation"
                        description="Clinical contact lens assessment and fitting."
                        onClick={() => startSpecialized("contact_lenses")}
                        disabled={!completedComprehensive}
                      />
                    </div>
                  </div>

                  {/* =====================================================
        DISPENSING
    ===================================================== */}

                  <div className="pt-3">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Dispensing
                    </div>

                    <div className="space-y-2">
                      <PathStep
                        title="Spectacle Job"
                        description="Create a spectacle dispensing job from a clinical prescription."
                        onClick={() =>
                          navigate(`/dispensing/spectacles/new/${patientId}`)
                        }
                      />

                      <PathStep
                        title="Contact Lens Job"
                        description="Create a contact lens dispensing order."
                        onClick={() =>
                          navigate(
                            `/dispensing/contact-lenses/new/${patientId}`,
                          )
                        }
                      />

                      <PathStep
                        title="Sundries"
                        description="Add optical accessories and other dispensing items."
                        onClick={() =>
                          navigate(
                            `/dispensing/sundries?patientId=${patientId}`,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* CONSULTATION HISTORY */}
          {/* ================================================== */}

          {activeSection === "consultations" && (
            <section>
              <Panel
                title="Consultation history"
                icon={History}
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startShortConsultation}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={13} />
                      Short
                    </button>

                    <button
                      type="button"
                      onClick={startComprehensiveConsultation}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Plus size={13} />
                      New consultation
                    </button>
                  </div>
                }
              >
                {consultations.length === 0 ? (
                  <Empty
                    title="No consultations yet"
                    description="Start the patient's first clinical consultation."
                    action={startComprehensiveConsultation}
                  />
                ) : (
                  <div className="space-y-3">
                    <RecordList
                      rows={consultations}
                      pageSize={6}
                      gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                      render={(item, index) => (
                        <button
                          type="button"
                          onClick={() => void openConsultation(item)}
                          className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                            index === 0
                              ? "border-blue-200 bg-blue-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              {index === 0 ? "Latest" : "Consultation"}
                            </span>

                            <ChevronRight
                              size={13}
                              className="text-slate-300 transition-transform group-hover:translate-x-0.5"
                            />
                          </div>

                          <div className="mt-3 text-sm font-bold tracking-tight text-slate-950">
                            {formatDate(item.consultationDate)}
                          </div>

                          <div
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${toneClass(
                              consultationTone(item),
                            )}`}
                          >
                            {consultationLabel(item)}
                          </div>

                          <div className="mt-3 text-[9px] text-slate-400">
                            {item.optometristId
                              ? [
                                  item.optometristId.firstName,
                                  item.optometristId.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ")
                              : "Clinical team"}
                          </div>
                        </button>
                      )}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <Stat label="Total" value={consultations.length} />

                      <Stat
                        label="Comprehensive"
                        value={
                          consultations.filter(
                            (x) => x.consultationType === "comprehensive",
                          ).length
                        }
                      />

                      <Stat label="Short" value={shortConsultations.length} />

                      <Stat
                        label="Specialized"
                        value={
                          binocularVisionHistory.length +
                          lowVisionHistory.length +
                          contactLensConsultationHistory.length
                        }
                      />

                      <Stat
                        label="Latest"
                        value={formatDate(latestConsultation?.consultationDate)}
                      />
                    </div>
                  </div>
                )}
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* DISPENSING */}
          {/* ================================================== */}

          {activeSection === "optical" && (
            <section className="grid gap-3 xl:grid-cols-2">
              {/* ================================================== */}
              {/* SPECTACLE HISTORY */}
              {/* ================================================== */}

              <Panel
                title="Spectacle history"
                icon={Glasses}
                action={
                  <button
                    type="button"
                    onClick={startSpectacleJob}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    New spectacle job
                  </button>
                }
              >
                <RecordList
                  rows={spectacles}
                  empty="No spectacle jobs for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dispensing/spectacles/${item._id}`)
                      }
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Glasses size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.jobNumber || "Spectacle Job"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {formatDate(item.jobDate)} ·{" "}
                            {item.frame?.description ||
                              item.frame?.code ||
                              "Frame pending"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {formatMoney(
                              Number(item.frame?.price || 0) +
                                Number(item.lens?.price || 0) +
                                (item.extras || []).reduce(
                                  (a, x) => a + Number(x.price || 0),
                                  0,
                                ) -
                                Number(item.discount || 0),
                            )}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>

              {/* ================================================== */}
              {/* CONTACT LENS ORDERS */}
              {/* ================================================== */}

              <Panel
                title="Contact lens orders"
                icon={ContactRound}
                action={
                  <button
                    type="button"
                    onClick={startContactLensOrder}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    New contact lens order
                  </button>
                }
              >
                <RecordList
                  rows={contactLenses}
                  empty="No contact lens orders for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dispensing/contact-lenses/${item._id}`)
                      }
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <ContactRound size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.orderNumber || "Contact Lens Order"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {formatDate(item.orderDate)} ·{" "}
                            {item.brand || item.lensType || "Lens"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {formatMoney(item.total)}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* SUNDRIES */}
          {activeSection === "optical" && (
            <section>
              <Panel
                title="Sundries"
                icon={Boxes}
                action={
                  <button
                    type="button"
                    onClick={startSundryJob}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    New sundry record
                  </button>
                }
              >
                <RecordList
                  rows={sundryJobs}
                  empty="No sundry dispensing records for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/dispensing/sundries/${item._id}`)}
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Boxes size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">{item.jobNumber || "Sundry Job"}</div>
                          <div className="mt-1 text-[10px] text-slate-400">{formatDate(item.jobDate || item.createdAt)} · {item.item?.description || item.item?.code || "Sundry"}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right"><div className="text-xs font-bold text-slate-800">{formatMoney(item.total)}</div><Status status={item.status} /></div>
                        <ChevronRight size={15} className="text-slate-300" />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* APPOINTMENTS */}
          {/* ================================================== */}

          {activeSection === "appointments" && (
            <section>
              <Panel
                title="Appointments"
                icon={CalendarDays}
                action={
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/appointments/book?patientId=${patientId}`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Plus size={13} />
                    Book appointment
                  </button>
                }
              >
                {upcomingAppointments.length > 0 && (
                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
                      Next appointment
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {formatDate(upcomingAppointments[0].appointmentDate)}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(
                            upcomingAppointments[0].appointmentDate,
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {upcomingAppointments[0].type || "Eye Examination"}
                        </div>
                      </div>

                      <Status
                        status={upcomingAppointments[0].status || "scheduled"}
                      />
                    </div>
                  </div>
                )}

                <RecordList
                  rows={[...appointments].sort(
                    (a, b) =>
                      new Date(b.appointmentDate || 0).getTime() -
                      new Date(a.appointmentDate || 0).getTime(),
                  )}
                  empty="No appointments for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/appointments/${item._id}`)}
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <CalendarDays size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {formatDate(item.appointmentDate)}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {item.type || "Eye Examination"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-700">
                            {item.appointmentDate
                              ? new Date(
                                  item.appointmentDate,
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* BILLING */}
          {/* ================================================== */}

          {activeSection === "billing" && (
            <section>
              <Panel
                title="Billing & payments"
                icon={Wallet}
                action={
                  <button
                    type="button"
                    onClick={() => navigate(`/billing?patientId=${patientId}`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Plus size={13} />
                    Create bill
                  </button>
                }
              >
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  <Stat label="Invoices" value={invoices.length} />

                  <Stat label="Paid" value={formatMoney(totalPaid)} />

                  <Stat
                    label="Outstanding"
                    value={formatMoney(outstanding)}
                    warning={outstanding > 0}
                  />
                </div>

                <RecordList
                  rows={invoices}
                  empty="No invoices for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/billing/${item._id}`)}
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/20 hover:shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <Wallet size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.invoiceNumber || "Invoice"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {formatDate(item.invoiceDate)} ·{" "}
                            {item.items?.length || 0} item(s)
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {formatMoney(item.total)}
                          </div>

                          <div className="mt-1 text-[9px] font-semibold text-slate-500">
                            Paid {formatMoney(item.paidAmount)} · Balance{" "}
                            {formatMoney(item.balance)}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* DOCUMENTS */}
          {/* ================================================== */}

          {activeSection === "documents" && (
            <section>
              <Panel
                title="Documents"
                icon={FileText}
                action={
                  <button
                    type="button"
                    onClick={() => setDocumentOpen(true)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    Upload
                  </button>
                }
              >
                <RecordList
                  rows={documents}
                  empty="No documents uploaded for this patient."
                  render={(item) => (
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/20">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <FileText size={15} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.originalName ||
                              item.filename ||
                              "Patient document"}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                            <span>{roleLabel(item.category || "other")}</span>

                            <span>·</span>

                            <span>
                              {formatDate(item.createdAt || item.uploadedAt)}
                            </span>
                          </div>

                          {item.note && (
                            <div className="mt-1 truncate text-[10px] text-slate-500">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openDocument(item)}
                          disabled={documentAction === `open:${item._id}`}
                          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                          aria-label="Open document"
                        >
                          {documentAction === `open:${item._id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void removeDocument(item._id)}
                          disabled={documentAction === `delete:${item._id}`}
                          className="rounded-xl border border-red-100 p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label="Delete document"
                        >
                          {documentAction === `delete:${item._id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                />
              </Panel>
            </section>
          )}
        </main>
      </div>

      {/* ================================================== */}
      {/* CONSULTATION MODAL */}
      {/* ================================================== */}

      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          loading={loadingConsultation}
          onClose={() => setSelectedConsultation(null)}
        />
      )}

      {/* ================================================== */}
      {/* EDIT PATIENT */}
      {/* ================================================== */}

      {editOpen && (
        <Modal
          title="Edit patient"
          onClose={() => !saving && setEditOpen(false)}
        >
          <form onSubmit={savePatient} className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                value={editForm.firstName}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    firstName: v,
                  })
                }
                required
              />

              <Field
                label="Middle name"
                value={editForm.middleName}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    middleName: v,
                  })
                }
              />

              <Field
                label="Last name"
                value={editForm.lastName}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    lastName: v,
                  })
                }
                required
              />

              <Field
                label="Date of birth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    dateOfBirth: v,
                  })
                }
              />

              <Field
                label="Gender"
                value={editForm.gender}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    gender: v,
                  })
                }
                options={["male", "female", "other"]}
              />

              <Field
                label="Phone"
                value={editForm.phone}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    phone: v,
                  })
                }
              />

              <Field
                label="Alternate phone"
                value={editForm.alternatePhone}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    alternatePhone: v,
                  })
                }
              />

              <Field
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    email: v,
                  })
                }
              />
            </div>

            <Field
              label="Notes"
              type="textarea"
              value={editForm.notes}
              onChange={(v) =>
                setEditForm({
                  ...editForm,
                  notes: v,
                })
              }
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================================================== */}
      {/* DOCUMENT UPLOAD */}
      {/* ================================================== */}

      {documentOpen && (
        <Modal
          title="Upload patient documents"
          onClose={() => !uploading && setDocumentOpen(false)}
        >
          <form onSubmit={uploadDocuments} className="space-y-3">
            <Field
              label="Category"
              value={documentCategory}
              onChange={setDocumentCategory}
              options={["prescription", "report", "invoice", "photo", "other"]}
            />

            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                Files
              </span>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-3 transition hover:border-blue-300 hover:bg-blue-50/30">
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setDocumentFiles(Array.from(e.target.files || []))
                  }
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                />

                {documentFiles.length > 0 && (
                  <div className="mt-3 text-[10px] font-medium text-slate-500">
                    {documentFiles.length} file
                    {documentFiles.length === 1 ? "" : "s"} selected
                  </div>
                )}
              </div>
            </label>

            <Field
              label="Note"
              value={documentNote}
              onChange={setDocumentNote}
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setDocumentOpen(false)}
                disabled={uploading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!documentFiles.length || uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading && <Loader2 size={14} className="animate-spin" />}
                Upload
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   PANEL
============================================================ */

function Panel({ title, icon: Icon, action, children }) {
  return (
    <section className="group overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_6px_26px_rgba(15,23,42,0.035)] transition-shadow duration-200 hover:shadow-[0_10px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <Icon size={14} strokeWidth={1.8} />
          </div>

          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>

        {action}
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon: Icon,
  label,
  onClick,
  primary = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "bg-gradient-to-br from-slate-950 to-indigo-950 text-white shadow-[0_8px_18px_rgba(15,23,42,0.17)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.2)]"
          : "border border-slate-200 bg-white text-slate-700 shadow-[0_3px_10px_rgba(15,23,42,0.035)] hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-800 hover:shadow-md"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          primary
            ? "bg-white/10"
            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
        }`}
      >
        <Icon size={14} />
      </span>

      {label}
    </button>
  );
}

/* ============================================================
   CARE PATHWAY STEP
============================================================ */

function PathStep({ done, title, description, onClick, disabled = false }) {
  const content = (
    <>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 ${
          done
            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
            : "bg-slate-50 text-slate-400 ring-slate-200"
        }`}
      >
        {done ? "✓" : "•"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900">{title}</div>

        <div className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </div>
      </div>

      {onClick && (
        <ChevronRight
          size={15}
          className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </>
  );

  if (!onClick) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-[0_8px_22px_rgba(15,23,42,0.055)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {content}
    </button>
  );
}

/* ============================================================
   STAT
============================================================ */

function Stat({ label, value, warning = false }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div
        className={`mt-2 text-lg font-bold tracking-tight ${
          warning ? "text-amber-700" : "text-slate-950"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   INFO
============================================================ */

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div className="mt-1.5 break-words text-sm font-semibold leading-6 text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/* ============================================================
   BADGE
============================================================ */

function Badge({ label, tone = "slate" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold ${toneClass(
        tone,
      )}`}
    >
      {label}
    </span>
  );
}

function toneClass(tone) {
  switch (tone) {
    case "green":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "blue":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "violet":
      return "border-violet-100 bg-violet-50 text-violet-700";

    case "amber":
      return "border-amber-100 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

/* ============================================================
   STATUS
============================================================ */

function Status({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const isPositive = [
    "paid",
    "collected",
    "ready",
    "completed",
    "confirmed",
  ].includes(normalized);

  const isWarning = [
    "partially_paid",
    "notified",
    "pending",
    "scheduled",
  ].includes(normalized);

  return (
    <span
      className={`mt-1.5 inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
        isPositive
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : isWarning
            ? "border-amber-100 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      {roleLabel(normalized)}
    </span>
  );
}

/* ============================================================
   RECORD LIST
============================================================ */

function RecordList({
  rows,
  empty,
  render,
  pageSize = DEFAULT_PAGE_SIZE,
  gridClassName = "space-y-2.5",
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const { page, setPage, totalPages, pageRows, startIndex } = usePaginatedRows(
    safeRows,
    pageSize,
  );

  if (!safeRows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-10 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }

  return (
    <div>
      <div className={gridClassName}>
        {pageRows.map((row, index) => (
          <div key={row._id || `${startIndex + index}`}>
            {render(row, startIndex + index)}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={safeRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ============================================================
   PAGINATION
============================================================ */

function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const start = (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalItems);

  const pageNumbers = Array.from(
    {
      length: totalPages,
    },
    (_, index) => index + 1,
  ).filter(
    (number) =>
      number === 1 || number === totalPages || Math.abs(number - page) <= 1,
  );

  const compactPages = [];

  pageNumbers.forEach((number, index) => {
    if (index > 0 && number - pageNumbers[index - 1] > 1) {
      compactPages.push(`ellipsis-${number}`);
    }

    compactPages.push(number);
  });

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[10px] font-medium text-slate-400">
        Showing <span className="font-bold text-slate-600">{start}</span>–
        <span className="font-bold text-slate-600">{end}</span> of{" "}
        <span className="font-bold text-slate-600">{totalItems}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {compactPages.map((item) =>
          typeof item === "string" ? (
            <span
              key={item}
              className="flex h-8 w-6 items-center justify-center text-[10px] text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`h-9 min-w-9 rounded-xl px-2.5 text-[11px] font-bold transition ${
                item === page
                  ? "bg-slate-950 text-white"
                  : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function Empty({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-5 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <FileText size={19} />
      </div>

      <div className="mt-3 text-xs font-bold text-slate-800">{title}</div>

      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </div>

      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={14} />
          Start now
        </button>
      )}
    </div>
  );
}

/* ============================================================
   CONSULTATION MODAL
============================================================ */

const HISTORY_FIELD_LABELS = {
  right: "Right Eye",
  left: "Left Eye",
  od: "OD",
  os: "OS",
  ou: "OU",
  va: "Visual Acuity",
  nearVa: "Near Visual Acuity",
  sphere: "Sphere",
  cylinder: "Cylinder",
  axis: "Axis",
  add: "Add",
  inter: "Intermediate",
  pd: "Pupillary Distance (PD)",
  npc: "Near Point of Convergence (NPC)",
  npa: "Near Point of Accommodation (NPA)",
  aa: "Amplitude of Accommodation (AA)",
  nra: "Negative Relative Accommodation (NRA)",
  pra: "Positive Relative Accommodation (PRA)",
  mem: "MEM Retinoscopy",
  cdRatio: "Cup-to-Disc Ratio",
  slitLamp: "Slit Lamp",
  fundus: "Fundus",
  colourVision: "Colour Vision",
  visualField: "Visual Field",
};

const consultationHistoryLabel = (key) => {
  if (HISTORY_FIELD_LABELS[key]) return HISTORY_FIELD_LABELS[key];

  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();
};

const parseConsultationHistoryValue = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
};

const isEmptyConsultationHistoryValue = (value) => {
  const normalized = parseConsultationHistoryValue(value);

  if (normalized === null || normalized === undefined) return true;
  if (typeof normalized === "string") return normalized.trim() === "";

  if (Array.isArray(normalized)) {
    return (
      normalized.length === 0 ||
      normalized.every(isEmptyConsultationHistoryValue)
    );
  }

  if (typeof normalized === "object") {
    const entries = Object.entries(normalized).filter(
      ([key]) => key !== "_id" && key !== "__v",
    );

    return (
      entries.length === 0 ||
      entries.every(([, entryValue]) =>
        isEmptyConsultationHistoryValue(entryValue),
      )
    );
  }

  return false;
};

const formatConsultationDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ConsultationHistoryValue({ value, depth = 0 }) {
  const normalized = parseConsultationHistoryValue(value);

  if (isEmptyConsultationHistoryValue(normalized)) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  if (typeof normalized === "boolean") {
    return (
      <span className="text-xs font-medium text-slate-700">
        {normalized ? "Yes" : "No"}
      </span>
    );
  }

  if (typeof normalized !== "object") {
    return (
      <span className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {String(normalized)}
      </span>
    );
  }

  if (depth > 7) {
    return (
      <span className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
        {JSON.stringify(normalized)}
      </span>
    );
  }

  if (Array.isArray(normalized)) {
    const items = normalized.filter(
      (item) => !isEmptyConsultationHistoryValue(item),
    );

    if (!items.length) {
      return <span className="text-xs text-slate-300">—</span>;
    }

    const hasObjects = items.some(
      (item) => typeof item === "object" && item !== null,
    );

    if (!hasObjects) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <span
              key={`${String(item)}-${index}`}
              className="max-w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
            >
              <span className="break-words">{String(item)}</span>
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`history-item-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            {item && typeof item === "object" && !Array.isArray(item) && (
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {item.name || item.title || item.testName || item.test || `Record ${index + 1}`}
              </div>
            )}
            <ConsultationHistoryValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(normalized).filter(
    ([key, entryValue]) =>
      key !== "_id" &&
      key !== "__v" &&
      !isEmptyConsultationHistoryValue(entryValue),
  );

  if (!entries.length) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const eyeKeys = new Set(["right", "left", "od", "os"]);
  const eyeGrouped = entries.some(([key]) =>
    eyeKeys.has(String(key).toLowerCase()),
  );

  return (
    <div
      className={`grid min-w-0 grid-cols-1 gap-2 ${eyeGrouped ? "md:grid-cols-2" : "sm:grid-cols-2"}`}
    >
      {entries.map(([key, entryValue]) => {
        const nested =
          entryValue !== null && typeof entryValue === "object";

        return (
          <div
            key={key}
            className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 ${nested ? "sm:col-span-2" : ""}`}
          >
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.09em] text-slate-400">
              {consultationHistoryLabel(key)}
            </div>
            <div className="min-w-0">
              <ConsultationHistoryValue
                value={entryValue}
                depth={depth + 1}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConsultationHistoryField({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="min-w-0">
        <ConsultationHistoryValue value={value} />
      </div>
    </div>
  );
}

function ConsultationPrescriptionHistory({ title, prescription }) {
  const normalized = parseConsultationHistoryValue(prescription);
  if (isEmptyConsultationHistoryValue(normalized)) return null;

  const isObject =
    normalized !== null &&
    typeof normalized === "object" &&
    !Array.isArray(normalized);
  const right = isObject
    ? normalized.right || normalized.od || normalized.rightEye || {}
    : null;
  const left = isObject
    ? normalized.left || normalized.os || normalized.leftEye || {}
    : null;
  const isEyeBased = Boolean(right || left) && isObject && (
    Object.prototype.hasOwnProperty.call(normalized, "right") ||
    Object.prototype.hasOwnProperty.call(normalized, "left") ||
    Object.prototype.hasOwnProperty.call(normalized, "od") ||
    Object.prototype.hasOwnProperty.call(normalized, "os") ||
    Object.prototype.hasOwnProperty.call(normalized, "rightEye") ||
    Object.prototype.hasOwnProperty.call(normalized, "leftEye")
  );

  if (!isEyeBased) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <h3 className="text-[10px] font-bold text-slate-700">{title}</h3>
        </div>
        <div className="p-3">
          <ConsultationHistoryValue value={normalized} />
        </div>
      </div>
    );
  }

  const columns = [
    ["sphere", "Sphere"],
    ["cylinder", "Cylinder"],
    ["axis", "Axis"],
    ["va", "VA"],
    ["nearVa", "Near VA"],
    ["add", "Add"],
    ["inter", "Intermediate"],
    ["prism", "Prism"],
    ["base", "Base"],
  ];

  const rootExtras = Object.fromEntries(
    Object.entries(normalized).filter(
      ([key, value]) =>
        !["right", "left", "od", "os", "rightEye", "leftEye", "_id", "__v"].includes(key) &&
        !isEmptyConsultationHistoryValue(value),
    ),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="text-[10px] font-bold text-slate-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-slate-400">
              <th className="px-3 py-2 font-bold">Eye</th>
              {columns.map(([, label]) => (
                <th key={label} className="px-3 py-2 font-bold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["OD", right || {}],
              ["OS", left || {}],
            ].map(([eye, row]) => (
              <tr key={eye} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 font-bold text-slate-700">{eye}</td>
                {columns.map(([key]) => (
                  <td key={key} className="px-3 py-2 text-slate-600">
                    {isEmptyConsultationHistoryValue(row?.[key])
                      ? "—"
                      : String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isEmptyConsultationHistoryValue(rootExtras) && (
        <div className="border-t border-slate-100 p-3">
          <ConsultationHistoryValue value={rootExtras} />
        </div>
      )}
    </div>
  );
}

function ConsultationModal({ consultation, loading, onClose }) {
  const clinician = [
    consultation?.optometristId?.firstName,
    consultation?.optometristId?.lastName,
  ].filter(Boolean).join(" ") || "Clinical team";

  const prescriptions = [
    ["Previous Rx", consultation?.previousRx],
    ["Objective Rx", consultation?.objectiveRx],
    ["Subjective Rx", consultation?.subjectiveRx],
    ["Final Rx", consultation?.finalRx],
    ["Given Rx", consultation?.givenRx],
  ];
  const hasPrescriptionHistory = prescriptions.some(([, value]) =>
    !isEmptyConsultationHistoryValue(value),
  );

  return (
    <Modal
      title={`${consultationLabel(consultation)} · ${formatDate(
        consultation?.consultationDate,
      )}`}
      onClose={onClose}
      size="max-w-7xl"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
          <Loader2 size={15} className="animate-spin" />
          Loading consultation...
        </div>
      ) : (
        <div className="space-y-3">
          {/* SUMMARY */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Consultation type</div>
              <div className="mt-1 text-xs font-bold text-slate-800">{consultationLabel(consultation)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Visit date</div>
              <div className="mt-1 text-xs font-bold text-slate-800">{formatConsultationDateTime(consultation?.consultationDate)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Optometrist / doctor</div>
              <div className="mt-1 text-xs font-bold text-slate-800">{clinician}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Status</div>
              <div className="mt-1 text-xs font-bold text-slate-800">{roleLabel(consultation?.status || "completed")}</div>
            </div>
          </div>

          {/* CONSULTATION INFORMATION */}
          <Panel title="Consultation Information" icon={ClipboardPlus}>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
              <ConsultationHistoryField label="Reason for Visit" value={consultation?.reasonForVisit} />
              <ConsultationHistoryField label="Symptoms" value={consultation?.symptoms} />
              <ConsultationHistoryField label="Medical History" value={consultation?.medicalHistory} />
              <ConsultationHistoryField label="Ocular History" value={consultation?.ocularHistory} />
              <ConsultationHistoryField label="Family History" value={consultation?.familyHistory} />
              <ConsultationHistoryField label="Medication" value={consultation?.medication} />
              <ConsultationHistoryField label="Allergies" value={consultation?.allergy} />
              <ConsultationHistoryField label="Pupillary Findings" value={consultation?.pupils} />
            </div>
          </Panel>

          {/* VISUAL ACUITY */}
          {!isEmptyConsultationHistoryValue(consultation?.visualAcuity) && (
            <Panel title="Visual Acuity" icon={Eye}>
              <ConsultationHistoryValue value={consultation.visualAcuity} />
            </Panel>
          )}

          {/* REFRACTION AND ALL PRESCRIPTION STAGES */}
          <Panel title="Refraction & Prescription" icon={Glasses}>
            <div className="space-y-3">
              {hasPrescriptionHistory ? (
                prescriptions.map(([title, value]) => (
                  <ConsultationPrescriptionHistory key={title} title={title} prescription={value} />
                )).filter(Boolean)
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-400">
                  No prescription history recorded.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <ConsultationHistoryField label="Pupillary Distance (PD)" value={consultation?.pd} />
                <ConsultationHistoryField label="Refraction Notes" value={consultation?.refractionNotes} />
              </div>
            </div>
          </Panel>

          {/* BINOCULAR VISION */}
          {!isEmptyConsultationHistoryValue(consultation?.binocularVision) && (
            <Panel title="Binocular Vision" icon={Eye}>
              <ConsultationHistoryValue value={consultation.binocularVision} />
            </Panel>
          )}

          {/* CLINICAL TESTS, DIAGNOSIS AND TREATMENT */}
          <Panel title="Clinical Management & Tests" icon={Stethoscope}>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
              <ConsultationHistoryField label="Slit Lamp" value={consultation?.slitLamp} />
              <ConsultationHistoryField label="Fundus" value={consultation?.fundus} />
              <ConsultationHistoryField label="Ophthalmoscopy" value={consultation?.ophthalmoscopy} />
              <ConsultationHistoryField label="Biomicroscopy" value={consultation?.biomicroscopy} />
              <ConsultationHistoryField label="Visual Field" value={consultation?.visualField} />
              <ConsultationHistoryField label="Colour Vision" value={consultation?.colourVision} />
              <ConsultationHistoryField label="Other Tests" value={consultation?.otherTests} />
              <ConsultationHistoryField label="Diagnosis" value={consultation?.diagnosis} />
              <ConsultationHistoryField label="Advice / Management Plan" value={consultation?.advice} />
              <ConsultationHistoryField label="Therapeutics" value={consultation?.therapeutics} />
            </div>
          </Panel>

          {/* SPECIALIST ASSESSMENTS */}
          {!isEmptyConsultationHistoryValue(consultation?.lowVision) && (
            <Panel title="Low Vision Management" icon={Eye}>
              <ConsultationHistoryValue value={consultation.lowVision} />
            </Panel>
          )}

          {!isEmptyConsultationHistoryValue(consultation?.contactLens || consultation?.contactLenses) && (
            <Panel title="Contact Lens Management" icon={ContactRound}>
              <ConsultationHistoryValue value={consultation.contactLens || consultation.contactLenses} />
            </Panel>
          )}

          {!isEmptyConsultationHistoryValue(consultation?.dispensing) && (
            <Panel title="Dispensing" icon={Glasses}>
              <ConsultationHistoryValue value={consultation.dispensing} />
            </Panel>
          )}

          {/* CLINICAL NOTES, INSTRUCTIONS AND RECALL */}
          <Panel title="Clinical Notes & Recall" icon={FileText}>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <ConsultationHistoryField label="Clinical Notes" value={consultation?.clinicalNotes} />
              <ConsultationHistoryField label="Patient Instructions" value={consultation?.patientInstructions} />
              <ConsultationHistoryField label="Internal Notes" value={consultation?.internalNotes} />
              <ConsultationHistoryField label="Additional Notes" value={consultation?.notes} />
              <ConsultationHistoryField label="Recall Due Date" value={formatDate(consultation?.recallDue || consultation?.recall?.due)} />
              <ConsultationHistoryField label="Recall Letter" value={consultation?.recallLetter || consultation?.recall?.message} />
              {!isEmptyConsultationHistoryValue(consultation?.recall) && (
                <div className="sm:col-span-2">
                  <ConsultationHistoryField label="Recall Details" value={consultation.recall} />
                </div>
              )}
            </div>
          </Panel>

          {/* RECORD TIMESTAMPS */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Created</div>
              <div className="mt-1 text-[10px] font-semibold text-slate-600">{formatConsultationDateTime(consultation?.createdAt)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Last updated</div>
              <div className="mt-1 text-[10px] font-semibold text-slate-600">{formatConsultationDateTime(consultation?.updatedAt)}</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
   MODAL
============================================================ */

function Modal({ title, onClose, children, size = "max-w-4xl" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-md sm:p-6">
      <div className={`max-h-[92vh] w-full ${size} overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.28)]`}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  required = false,
}) {
  const labelClass =
    "mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500";

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50";

  if (options) {
    return (
      <label className="block">
        <span className={labelClass}>{label}</span>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} h-11`}
        >
          <option value="">Select</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {roleLabel(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block">
        <span className={labelClass}>{label}</span>

        <textarea
          value={value}
          required={required}
          rows={5}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} py-2.5`}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} h-11`}
      />
    </label>
  );
}
