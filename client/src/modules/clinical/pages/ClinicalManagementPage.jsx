import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  Eye,
  History,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPatients } from "../../patients/patient.api";
import { getPatientConsultations, getConsultation } from "../consultation.api";

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unnamed patient";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const ageFromDob = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

const label = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const consultationLabel = (item) => {
  if (item?.consultationType === "specialized")
    return label(item.specializedType || "specialized");
  if (item?.consultationType === "short_consult") return "Short Consultation";
  return "Comprehensive";
};

const consultationTone = (item) => {
  if (item?.consultationType === "specialized") return "violet";
  if (item?.consultationType === "short_consult") return "amber";
  return "blue";
};

const normalizePatients = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.patients)) return payload.patients;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeConsultations = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.consultations)) return payload.consultations;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function ClinicalManagementPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    setError("");
    try {
      const response = await getPatients({
        page: 1,
        limit: 40,
        search: query.trim(),
        status: "active",
      });
      setPatients(normalizePatients(response));
    } catch (requestError) {
      setPatients([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load patients.",
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPatients(), 250);
    return () => window.clearTimeout(timer);
  }, [loadPatients]);

  const selectPatient = useCallback(async (patient) => {
    if (!patient?._id) return;
    setSelectedPatient(patient);
    setSelectedConsultation(null);
    setLoadingHistory(true);
    setError("");
    try {
      const response = await getPatientConsultations(patient._id);
      const rows = normalizeConsultations(response).sort(
        (a, b) =>
          new Date(b.consultationDate || b.createdAt || 0).getTime() -
          new Date(a.consultationDate || a.createdAt || 0).getTime(),
      );
      setConsultations(rows);
    } catch (requestError) {
      setConsultations([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load consultation history.",
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return consultations;
    if (historyFilter === "specialized")
      return consultations.filter(
        (item) => item.consultationType === "specialized",
      );
    return consultations.filter(
      (item) => item.consultationType === historyFilter,
    );
  }, [consultations, historyFilter]);

  const completedComprehensive = consultations.some(
    (item) =>
      item.consultationType === "comprehensive" &&
      (item.status === "completed" || !item.status),
  );

  const openConsultation = async (consultation) => {
    setLoadingRecord(true);
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
      setLoadingRecord(false);
    }
  };

  const startConsultation = () => {
    if (!selectedPatient?._id) return;
    navigate(`/patients/${selectedPatient._id}/consultations/new`);
  };

  const startSpecialized = (specializedType) => {
    if (!selectedPatient?._id || !completedComprehensive) return;
    navigate(
      `/patients/${selectedPatient._id}/consultations/new?type=specialized&specializedType=${specializedType}`,
    );
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-3 py-5 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">
                Patient care workspace
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Clinical Management
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                Find a patient, review their clinical history and start the next
                consultation. Appointment scheduling is managed separately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPatients()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                size={14}
                className={loadingPatients ? "animate-spin" : ""}
              />{" "}
              Refresh patients
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[92px] xl:self-start">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Search size={15} className="text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900">
                  Find patient
                </h2>
              </div>
              <div className="relative mt-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, patient number or phone"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-blue-300 focus:bg-white"
                />
              </div>
            </div>
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
              {loadingPatients ? (
                <div className="flex items-center justify-center gap-2 px-4 py-12 text-xs text-slate-400">
                  <Loader2 size={15} className="animate-spin" /> Loading
                  patients...
                </div>
              ) : patients.length === 0 ? (
                <div className="px-5 py-12 text-center text-xs text-slate-400">
                  No active patients found.
                </div>
              ) : (
                patients.map((patient) => {
                  const active = selectedPatient?._id === patient._id;
                  const age = ageFromDob(patient.dateOfBirth);
                  return (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => void selectPatient(patient)}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {(patient.firstName?.[0] || "P").toUpperCase()}
                        {(patient.lastName?.[0] || "").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-900">
                          {fullName(patient)}
                        </div>
                        <div className="mt-1 truncate text-[10px] text-slate-400">
                          {patient.patientNumber || "No number"}
                          {age !== null ? ` · ${age} yrs` : ""}
                          {patient.phone ? ` · ${patient.phone}` : ""}
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={active ? "text-blue-500" : "text-slate-300"}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="min-w-0 space-y-5">
            {!selectedPatient ? (
              <EmptyWorkspace />
            ) : (
              <>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                          {(
                            selectedPatient.firstName?.[0] || "P"
                          ).toUpperCase()}
                          {(selectedPatient.lastName?.[0] || "").toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                            Selected patient
                          </div>
                          <h2 className="mt-1 text-xl font-bold text-slate-950">
                            {fullName(selectedPatient)}
                          </h2>
                          <div className="mt-1 text-xs text-slate-500">
                            {selectedPatient.patientNumber ||
                              "No patient number"}{" "}
                            · {ageFromDob(selectedPatient.dateOfBirth) ?? "—"}{" "}
                            years ·{" "}
                            {label(
                              selectedPatient.gender || "Gender not recorded",
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={startConsultation}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          <ClipboardPlus size={14} /> Start consultation
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/patients/${selectedPatient._id}`)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={14} /> Patient record
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-4">
                    <Summary
                      label="Consultations"
                      value={consultations.length}
                    />
                    <Summary
                      label="Comprehensive"
                      value={
                        consultations.filter(
                          (x) => x.consultationType === "comprehensive",
                        ).length
                      }
                    />
                    <Summary
                      label="Specialized"
                      value={
                        consultations.filter(
                          (x) => x.consultationType === "specialized",
                        ).length
                      }
                    />
                    <Summary
                      label="Latest visit"
                      value={formatDate(consultations[0]?.consultationDate)}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <History size={15} className="text-blue-600" />
                        <h2 className="text-sm font-bold text-slate-900">
                          Consultation history
                        </h2>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Select any previous visit to review the complete
                        clinical record.
                      </p>
                    </div>
                    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                      {[
                        ["all", "All"],
                        ["comprehensive", "Comprehensive"],
                        ["short_consult", "Short"],
                        ["specialized", "Specialized"],
                      ].map(([value, text]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setHistoryFilter(value)}
                          className={`rounded-lg px-2.5 py-1.5 text-[9px] font-bold ${historyFilter === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    {loadingHistory ? (
                      <div className="flex justify-center py-12 text-xs text-slate-400">
                        <Loader2 size={16} className="mr-2 animate-spin" />{" "}
                        Loading history...
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center text-xs text-slate-400">
                        No consultations in this category.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredHistory.map((item, index) => (
                          <button
                            key={item._id || index}
                            type="button"
                            onClick={() => void openConsultation(item)}
                            className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-xs font-bold text-slate-900">
                                {formatDate(item.consultationDate)}
                              </div>
                              <ChevronRight
                                size={14}
                                className="text-slate-300 group-hover:text-blue-500"
                              />
                            </div>
                            <div
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${toneClass(consultationTone(item))}`}
                            >
                              {consultationLabel(item)}
                            </div>
                            <div className="mt-3 space-y-1 text-[10px] text-slate-400">
                              <div>
                                Status:{" "}
                                <span className="font-semibold text-slate-600">
                                  {label(item.status || "completed")}
                                </span>
                              </div>
                              <div>
                                Clinician:{" "}
                                <span className="font-semibold text-slate-600">
                                  {item.optometristId
                                    ? fullName(item.optometristId)
                                    : "Clinical team"}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={15} className="text-violet-600" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Specialist assessments
                      </h2>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Specialist assessments become available after a completed
                      Comprehensive Consultation.
                    </p>
                  </div>
                  <div className="grid gap-3 p-5 md:grid-cols-3">
                    <SpecialistCard
                      title="Binocular Vision"
                      description="Detailed binocular, sensory, motor and accommodative evaluation."
                      enabled={completedComprehensive}
                      onClick={() => startSpecialized("binocular_vision")}
                    />
                    <SpecialistCard
                      title="Contact Lens"
                      description="Contact lens assessment, fitting and clinical evaluation."
                      enabled={completedComprehensive}
                      onClick={() => startSpecialized("contact_lenses")}
                    />
                    <SpecialistCard
                      title="Low Vision"
                      description="Functional vision assessment and low-vision management."
                      enabled={completedComprehensive}
                      onClick={() => startSpecialized("low_vision")}
                    />
                  </div>
                </section>
              </>
            )}
          </main>
        </section>
      </div>

      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          loading={loadingRecord}
          onClose={() => setSelectedConsultation(null)}
        />
      )}
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <section className="flex min-h-[560px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <UserRound size={25} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Select a patient
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Choose a patient from the clinical directory to review their
          consultation history and start the next clinical visit.
        </p>
      </div>
    </section>
  );
}

function Summary({ label: title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function SpecialistCard({ title, description, enabled, onClick }) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Stethoscope size={16} />
        </div>
        <ChevronRight
          size={15}
          className="text-slate-300 group-hover:text-violet-500"
        />
      </div>
      <div className="mt-3 text-xs font-bold text-slate-900">{title}</div>
      <p className="mt-1 text-[10px] leading-5 text-slate-400">{description}</p>
      <div
        className={`mt-3 text-[9px] font-bold ${enabled ? "text-emerald-600" : "text-slate-400"}`}
      >
        {enabled ? "Available" : "Complete Comprehensive first"}
      </div>
    </button>
  );
}

function ConsultationModal({ consultation, loading, onClose }) {
  const rx =
    consultation?.givenRx ||
    consultation?.subjectiveRx ||
    consultation?.previousRx;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.18em] text-blue-600">
              Clinical record
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {consultationLabel(consultation)}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {formatDateTime(consultation.consultationDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={17} />
          </button>
        </header>
        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <Loader2 size={17} className="mx-auto mb-2 animate-spin" />
              Loading clinical record...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Summary
                  label="Status"
                  value={label(consultation.status || "completed")}
                />
                <Summary label="Type" value={consultationLabel(consultation)} />
                <Summary
                  label="Recall due"
                  value={formatDate(consultation.recallDue)}
                />
              </div>
              <RecordBlock
                title="Symptoms / complaints"
                value={consultation.symptoms || consultation.chiefComplaints}
              />
              <RecordBlock
                title="Diagnosis / impression"
                value={consultation.diagnosis || consultation.impression}
              />
              <RecordBlock title="Advice" value={consultation.advice} />
              {rx && (
                <div>
                  <h3 className="mb-2 text-xs font-bold text-slate-900">
                    Prescription
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <RxCell label="OD" value={rx.right || rx.od} />
                    <RxCell label="OS" value={rx.left || rx.os} />
                  </div>
                </div>
              )}
              <RecordBlock title="Notes" value={consultation.notes} />
              {consultation.binocularVision && (
                <RecordBlock
                  title="Binocular Vision evaluation"
                  value={JSON.stringify(consultation.binocularVision, null, 2)}
                  pre
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordBlock({ title, value, pre = false }) {
  if (!value) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold text-slate-900">{title}</h3>
      <div
        className={`rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600 ${pre ? "whitespace-pre-wrap font-mono text-[10px]" : "whitespace-pre-wrap"}`}
      >
        {String(value)}
      </div>
    </div>
  );
}
function RxCell({ label: title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="mt-1 text-xs text-slate-700">
        {typeof value === "object" ? JSON.stringify(value) : value || "—"}
      </div>
    </div>
  );
}
function toneClass(tone) {
  return tone === "blue"
    ? "bg-blue-50 text-blue-700"
    : tone === "violet"
      ? "bg-violet-50 text-violet-700"
      : "bg-amber-50 text-amber-700";
}
