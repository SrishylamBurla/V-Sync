import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  ContactRound,
  Download,
  Edit3,
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
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
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
  if (item?.consultationType === "specialized") {
    return roleLabel(item.specializedType || "specialized");
  }
  return item?.consultationType === "short_consult"
    ? "Short Consultation"
    : "Comprehensive";
};

const consultationTone = (item) => {
  if (item?.consultationType === "specialized") return "violet";
  if (item?.consultationType === "short_consult") return "amber";
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
  ["optical", "Optical"],
  ["dispensing", "Dispensing"],
  ["billing", "Billing"],
  ["appointments", "Appointments"],
  ["documents", "Documents"],
];

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [spectacles, setSpectacles] = useState([]);
  const [contactLenses, setContactLenses] = useState([]);
  const [dispensing, setDispensing] = useState([]);
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

  const specializedHistory = useMemo(
    () =>
      consultations.filter((item) => item.consultationType === "specialized"),
    [consultations],
  );

  const latestConsultation = consultations[0] || null;
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance || 0),
    0,
  );

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!patientId) return;

      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          getPatient(patientId),
          getPatientConsultations(patientId),
          getPatientSpectacles(patientId),
          getPatientContactLenses(patientId),
          getDispensingList({ patientId }),
          getInvoices({ patientId }),
          getAppointments({ patientId }),
          getPatientDocuments(patientId),
        ]);

        const patientResult = results[0];
        if (patientResult.status === "rejected") throw patientResult.reason;

        const patientData = getPatientData(patientResult.value);
        if (!patientData) throw new Error("Patient record not found");

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
        const invoiceRows = getRows(value(5));
        const appointmentRows = getRows(value(6));
        const documentRows = Array.isArray(value(7))
          ? value(7)
          : getRows(value(7));

        setConsultations(consultationRows);
        setSpectacles(spectacleRows);
        setContactLenses(contactRows);
        setDispensing(dispensingRows);
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-110px 0px -65% 0px", threshold: [0.05, 0.25, 0.5] },
    );

    sections.forEach(([id]) => {
      const element = document.getElementById(`patient-${id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [loading, patientId]);

  const startConsultation = () =>
    navigate(`/patients/${patientId}/consultations/new`);

  const startSpecialized = (specialty) => {
    if (!completedComprehensive) {
      setError(
        "Complete a Comprehensive Consultation before starting a specialized consultation.",
      );
      return;
    }
    navigate(
      `/patients/${patientId}/consultations/new?type=specialized&specializedType=${specialty}`,
    );
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
      if (updated) setPatient(updated);
      setEditOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update patient");
    } finally {
      setSaving(false);
    }
  };

  const uploadDocuments = async (event) => {
    event.preventDefault();
    if (!documentFiles.length || uploading) return;
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
    if (!documentId || documentAction) return;
    if (!window.confirm("Delete this patient document?")) return;
    setDocumentAction(`delete:${documentId}`);
    try {
      await deletePatientDocument(patientId, documentId);
      await load({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete document");
    } finally {
      setDocumentAction("");
    }
  };

  const openDocument = async (document) => {
    if (!document?._id || documentAction) return;
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
      <div className="flex min-h-[65vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Loading patient workspace...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Patient record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 text-slate-800">
      <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-5 lg:px-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load({ silent: true })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setDocumentOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Upload size={14} /> Documents
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Edit3 size={14} /> Edit patient
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X size={14} />
            </button>
          </div>
        )}

        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-blue-50 via-white to-violet-50 px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-lg">
                  {(patient.firstName?.[0] || "P").toUpperCase()}
                  {(patient.lastName?.[0] || "").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                    Patient workspace
                  </div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {fullName(patient) || "Unnamed Patient"}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {patient.patientNumber || "No patient number"}
                    </span>
                    {age !== null && <span>· {age} years</span>}
                    {patient.gender && (
                      <span>· {roleLabel(patient.gender)}</span>
                    )}
                    {patient.phone && <span>· {patient.phone}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      label={
                        patient.status === "inactive" ? "Inactive" : "Active"
                      }
                      tone={patient.status === "inactive" ? "amber" : "green"}
                    />
                    <Badge label={`${consultations.length} consultations`} />
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

              <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[600px] xl:grid-cols-4">
                <QuickAction
                  icon={ClipboardPlus}
                  label="Start Consultation"
                  onClick={startConsultation}
                  primary
                />
                <QuickAction
                  icon={Glasses}
                  label="New Spectacle Job"
                  onClick={() =>
                    navigate(`/optical/spectacles/new/${patientId}`)
                  }
                />
                <QuickAction
                  icon={ContactRound}
                  label="Contact Lens"
                  onClick={() => startSpecialized("contact_lenses")}
                  disabled={!completedComprehensive}
                />
                <QuickAction
                  icon={Receipt}
                  label="Create Bill"
                  onClick={() => navigate(`/billing?patientId=${patientId}`)}
                />
              </div>
            </div>
          </div>

          <nav className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-t border-slate-200 bg-white px-3 py-2 sm:px-5">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveSection(id);
                  document
                    .getElementById(`patient-${id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-bold transition ${activeSection === id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mt-4 space-y-4">
          <section
            id="patient-overview"
            className="scroll-mt-24 grid gap-4 xl:grid-cols-[1.2fr_.8fr]"
          >
            <Panel title="Patient overview" icon={UserRound}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info
                  label="Date of birth"
                  value={formatDate(patient.dateOfBirth)}
                />
                <Info label="Age" value={age === null ? "—" : `${age} years`} />
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
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Patient notes
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                    {patient.notes}
                  </p>
                </div>
              )}
            </Panel>

            <Panel title="Care pathway" icon={Stethoscope}>
              <div className="space-y-3">
                <PathStep
                  done={completedComprehensive}
                  title="Comprehensive Consultation"
                  description={
                    completedComprehensive
                      ? "Completed — specialized consultations are unlocked."
                      : "Required before specialized consultations."
                  }
                />
                <PathStep
                  done={specializedHistory.some(
                    (x) => x.specializedType === "contact_lenses",
                  )}
                  title="Contact Lens"
                  description="Specialized consultation and fitting workflow."
                  onClick={() => startSpecialized("contact_lenses")}
                  disabled={!completedComprehensive}
                />
                <PathStep
                  done={specializedHistory.some(
                    (x) => x.specializedType === "binocular_vision",
                  )}
                  title="Binocular Vision"
                  description="Specialized binocular vision assessment."
                  onClick={() => startSpecialized("binocular_vision")}
                  disabled={!completedComprehensive}
                />
                <PathStep
                  done={specializedHistory.some(
                    (x) => x.specializedType === "low_vision",
                  )}
                  title="Low Vision"
                  description="Specialized low vision assessment."
                  onClick={() => startSpecialized("low_vision")}
                  disabled={!completedComprehensive}
                />
              </div>
            </Panel>
          </section>

          <section id="patient-consultations" className="scroll-mt-24">
            <Panel
              title="Consultation history"
              icon={History}
              action={
                <button
                  type="button"
                  onClick={startConsultation}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white"
                >
                  <Plus size={13} /> New consultation
                </button>
              }
            >
              {consultations.length === 0 ? (
                <Empty
                  title="No consultations yet"
                  description="Start the patient's first Comprehensive Consultation."
                  action={startConsultation}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {consultations.map((item, index) => (
                      <button
                        key={item._id || index}
                        type="button"
                        onClick={() => void openConsultation(item)}
                        className={`min-w-[150px] rounded-2xl border p-3 text-left transition ${index === 0 ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {index === 0
                              ? "Latest"
                              : `Visit ${consultations.length - index}`}
                          </span>
                          <ChevronRight size={13} className="text-slate-300" />
                        </div>
                        <div className="mt-2 text-sm font-bold text-slate-900">
                          {formatDate(item.consultationDate)}
                        </div>
                        <div
                          className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${toneClass(consultationTone(item))}`}
                        >
                          {consultationLabel(item)}
                        </div>
                        <div className="mt-2 text-[9px] text-slate-400">
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
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Stat
                      label="Total consultations"
                      value={consultations.length}
                    />
                    <Stat
                      label="Comprehensive"
                      value={
                        consultations.filter(
                          (x) => x.consultationType === "comprehensive",
                        ).length
                      }
                    />
                    <Stat
                      label="Specialized"
                      value={specializedHistory.length}
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

          <section
            id="patient-optical"
            className="scroll-mt-24 grid gap-4 xl:grid-cols-2"
          >
            <Panel
              title="Spectacle history"
              icon={Glasses}
              action={
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/optical/spectacles/new/${patientId}`)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600"
                >
                  New job
                </button>
              }
            >
              <RecordList
                rows={spectacles}
                empty="No spectacle jobs for this patient."
                render={(item) => (
                  <button
                    type="button"
                    onClick={() => navigate(`/optical/spectacles/${item._id}`)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.jobNumber || "Spectacle Job"}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {formatDate(item.jobDate)} ·{" "}
                        {item.frame?.description ||
                          item.frame?.code ||
                          "Frame pending"}
                      </div>
                    </div>
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
                  </button>
                )}
              />
            </Panel>

            <Panel
              title="Contact lens history"
              icon={ContactRound}
              action={
                completedComprehensive ? (
                  <button
                    type="button"
                    onClick={() => startSpecialized("contact_lenses")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600"
                  >
                    Consultation
                  </button>
                ) : null
              }
            >
              <RecordList
                rows={contactLenses}
                empty="No contact lens orders for this patient."
                render={(item) => (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/optical/contact-lenses/${item._id}`)
                    }
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.orderNumber || "Contact Lens Order"}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {formatDate(item.orderDate)} ·{" "}
                        {item.brand || item.lensType || "Lens"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {formatMoney(item.total)}
                      </div>
                      <Status status={item.status} />
                    </div>
                  </button>
                )}
              />
            </Panel>
          </section>

          <section id="patient-dispensing" className="scroll-mt-24">
            <Panel
              title="Dispensing"
              icon={Receipt}
              action={
                <button
                  type="button"
                  onClick={() => navigate("/dispensing")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600"
                >
                  Open dispensing
                </button>
              }
            >
              <RecordList
                rows={dispensing}
                empty="No dispensing records for this patient."
                render={(item) => (
                  <button
                    type="button"
                    onClick={() => navigate(`/dispensing/${item._id}`)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.recordNumber}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {item.itemType} ·{" "}
                        {formatDate(item.orderDate || item.jobDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {formatMoney(item.amount)}
                      </div>
                      <Status status={item.status} />
                    </div>
                  </button>
                )}
              />
            </Panel>
          </section>

          <section id="patient-appointments" className="scroll-mt-24">
            <Panel
              title="Appointments"
              icon={CalendarDays}
              action={
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/appointments/book?patientId=${patientId}`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white"
                >
                  <Plus size={13} /> Book appointment
                </button>
              }
            >
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
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {formatDate(item.appointmentDate)}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {item.type || "Eye Examination"} ·{" "}
                        {item.reason || "Routine visit"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-700">
                        {item.appointmentDate
                          ? new Date(item.appointmentDate).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "—"}
                      </div>
                      <Status status={item.status} />
                    </div>
                  </button>
                )}
              />
            </Panel>
          </section>

          <section id="patient-billing" className="scroll-mt-24">
            <Panel
              title="Billing & payments"
              icon={Wallet}
              action={
                <button
                  type="button"
                  onClick={() => navigate(`/billing?patientId=${patientId}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white"
                >
                  <Plus size={13} /> Create bill
                </button>
              }
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Invoices" value={invoices.length} />
                <Stat
                  label="Paid"
                  value={formatMoney(
                    invoices.reduce((a, x) => a + Number(x.paidAmount || 0), 0),
                  )}
                />
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
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.invoiceNumber}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {formatDate(item.invoiceDate)} ·{" "}
                        {item.items?.length || 0} item(s)
                      </div>
                    </div>
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
                  </button>
                )}
              />
            </Panel>
          </section>

          <section id="patient-documents" className="scroll-mt-24">
            <Panel
              title="Documents"
              icon={FileText}
              action={
                <button
                  type="button"
                  onClick={() => setDocumentOpen(true)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700"
                >
                  Upload
                </button>
              }
            >
              <RecordList
                rows={documents}
                empty="No documents uploaded for this patient."
                render={(item) => (
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-slate-900">
                          {item.originalName ||
                            item.filename ||
                            "Patient document"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {roleLabel(item.category || "other")} ·{" "}
                          {formatDate(item.createdAt || item.uploadedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => void openDocument(item)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeDocument(item._id)}
                        className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              />
            </Panel>
          </section>
        </main>
      </div>

      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          loading={loadingConsultation}
          onClose={() => setSelectedConsultation(null)}
        />
      )}

      {editOpen && (
        <Modal title="Edit patient" onClose={() => setEditOpen(false)}>
          <form onSubmit={savePatient} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="First name"
                value={editForm.firstName}
                onChange={(v) => setEditForm({ ...editForm, firstName: v })}
                required
              />
              <Field
                label="Middle name"
                value={editForm.middleName}
                onChange={(v) => setEditForm({ ...editForm, middleName: v })}
              />
              <Field
                label="Last name"
                value={editForm.lastName}
                onChange={(v) => setEditForm({ ...editForm, lastName: v })}
                required
              />
              <Field
                label="Date of birth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(v) => setEditForm({ ...editForm, dateOfBirth: v })}
              />
              <Field
                label="Gender"
                value={editForm.gender}
                onChange={(v) => setEditForm({ ...editForm, gender: v })}
                options={["male", "female", "other"]}
              />
              <Field
                label="Phone"
                value={editForm.phone}
                onChange={(v) => setEditForm({ ...editForm, phone: v })}
              />
              <Field
                label="Alternate phone"
                value={editForm.alternatePhone}
                onChange={(v) =>
                  setEditForm({ ...editForm, alternatePhone: v })
                }
              />
              <Field
                label="Email"
                value={editForm.email}
                onChange={(v) => setEditForm({ ...editForm, email: v })}
              />
            </div>
            <Field
              label="Notes"
              type="textarea"
              value={editForm.notes}
              onChange={(v) => setEditForm({ ...editForm, notes: v })}
            />
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}Save
                changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {documentOpen && (
        <Modal
          title="Upload patient documents"
          onClose={() => setDocumentOpen(false)}
        >
          <form onSubmit={uploadDocuments} className="space-y-4">
            <Field
              label="Category"
              value={documentCategory}
              onChange={setDocumentCategory}
              options={["prescription", "report", "invoice", "photo", "other"]}
            />
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Files
              </span>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setDocumentFiles(Array.from(e.target.files || []))
                }
                className="block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs"
              />
            </label>
            <Field
              label="Note"
              value={documentNote}
              onChange={setDocumentNote}
            />
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setDocumentOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={!documentFiles.length || uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
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

function Panel({ title, icon: Icon, action, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={15} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${primary ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function PathStep({ done, title, description, onClick, disabled }) {
  const content = (
    <>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
      >
        {done ? "✓" : "•"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-[10px] leading-5 text-slate-400">
          {description}
        </div>
      </div>
      {onClick && <ChevronRight size={15} className="text-slate-300" />}
    </>
  );
  if (!onClick)
    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
        {content}
      </div>
    );
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {content}
    </button>
  );
}

function Stat({ label, value, warning = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-bold ${warning ? "text-amber-700" : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-xs font-semibold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}
function Badge({ label, tone = "slate" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${toneClass(tone)}`}
    >
      {label}
    </span>
  );
}
function toneClass(tone) {
  return tone === "green"
    ? "bg-emerald-50 text-emerald-700"
    : tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "violet"
        ? "bg-violet-50 text-violet-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";
}
function Status({ status }) {
  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2 py-1 text-[8px] font-bold uppercase ${status === "paid" || status === "collected" || status === "ready" ? "bg-emerald-50 text-emerald-700" : status === "partially_paid" || status === "notified" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
    >
      {roleLabel(status || "pending")}
    </span>
  );
}
function RecordList({ rows, empty, render }) {
  if (!rows?.length)
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center text-xs text-slate-400">
        {empty}
      </div>
    );
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row._id || index}>{render(row)}</div>
      ))}
    </div>
  );
}
function Empty({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
      <div className="text-sm font-bold text-slate-700">{title}</div>
      <div className="mt-1 text-xs text-slate-400">{description}</div>
      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
        >
          Start now
        </button>
      )}
    </div>
  );
}

function ConsultationModal({ consultation, loading, onClose }) {
  const rx = consultation?.givenRx || consultation?.finalRx || {};
  return (
    <Modal
      title={`${consultationLabel(consultation)} · ${formatDate(consultation.consultationDate)}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Loading consultation...
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Type" value={consultationLabel(consultation)} />
              <Info
                label="Clinician"
                value={
                  [
                    consultation.optometristId?.firstName,
                    consultation.optometristId?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Clinical team"
                }
              />
              <Info
                label="Status"
                value={roleLabel(consultation.status || "completed")}
              />
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Prescription
              </div>
              <div className="grid grid-cols-3 text-xs">
                <div className="border-r border-slate-200 p-3 font-bold">
                  Eye
                </div>
                <div className="border-r border-slate-200 p-3 font-bold">
                  OD
                </div>
                <div className="p-3 font-bold">OS</div>
                {["sphere", "cylinder", "axis", "va", "add"].map((key) => (
                  <>
                    <div
                      key={`${key}-l`}
                      className="border-r border-t border-slate-200 p-3 text-slate-500"
                    >
                      {roleLabel(key)}
                    </div>
                    <div
                      key={`${key}-r`}
                      className="border-r border-t border-slate-200 p-3"
                    >
                      {rx.right?.[key] || "—"}
                    </div>
                    <div
                      key={`${key}-o`}
                      className="border-t border-slate-200 p-3"
                    >
                      {rx.left?.[key] || "—"}
                    </div>
                  </>
                ))}
              </div>
            </div>
            <Info
              label="Notes"
              value={
                consultation.notes ||
                consultation.clinicalNotes ||
                "No clinical notes recorded."
              }
            />
          </>
        )}
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50"
          >
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-70px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  required = false,
}) {
  if (options)
    return (
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <select
          required={required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {roleLabel(option)}
            </option>
          ))}
        </select>
      </label>
    );
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        required={required}
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
      />
    </label>
  );
}
