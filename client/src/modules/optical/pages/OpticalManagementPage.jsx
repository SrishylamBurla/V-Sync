import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ContactRound,
  ExternalLink,
  Glasses,
  PackageCheck,
  History,
  ShoppingBag,
  X,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDispensingList } from "../spectacle.api";
import { getContactLenses } from "../../contactLenses/contactLens.api";
import { getPatients } from "../../patients/patient.api";

const statuses = ["draft", "ordered", "not_ready", "ready", "notified", "collected", "cancelled"];

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function OpticalManagementPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [contactOrders, setContactOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientPage, setPatientPage] = useState(1);
  const [patientHasMore, setPatientHasMore] = useState(false);
  const [recordModal, setRecordModal] = useState(null);
  const [recordView, setRecordView] = useState("history");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dispensingResult, contactResult] = await Promise.allSettled([
        getDispensingList(status ? { status } : {}),
        getContactLenses(status ? { status } : {}),
      ]);

      const dispensingResponse = dispensingResult.status === "fulfilled" ? dispensingResult.value : null;
      const contactResponse = contactResult.status === "fulfilled" ? contactResult.value : null;

      setJobs(dispensingResponse?.data || []);
      setContactOrders(contactResponse?.data || []);

      const failures = [dispensingResult, contactResult].filter((result) => result.status === "rejected");
      if (failures.length) {
        setError(failures[0].reason?.response?.data?.message || failures[0].reason?.message || "Some optical records could not be loaded.");
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load the optical workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const openPatientSelector = useCallback(async () => {
    setPatientModalOpen(true);
    setPatientSearch("");
    setPatientPage(1);
    setPatientLoading(true);
    try {
      const response = await getPatients({
        page: 1,
        limit: 20,
        search: "",
        status: "active",
      });

      // Patient API responses can be either:
      // { data: [...] }
      // { data: { data: [...], pagination: {...} } }
      // or directly [...]
      const payload = response?.data ?? response;
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.patients)
            ? payload.patients
            : [];

      setPatients(rows);

      const pagination = payload?.pagination || response?.pagination;
      setPatientHasMore(
        Boolean(
          pagination?.hasNextPage ??
          pagination?.hasNext ??
          response?.hasNextPage ??
          false
        )
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load patients."
      );
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const searchPatients = useCallback(async (search, page = 1, append = false) => {
    setPatientLoading(true);
    try {
      const response = await getPatients({
        page,
        limit: 20,
        search,
        status: "active",
      });

      const payload = response?.data ?? response;
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.patients)
            ? payload.patients
            : [];

      setPatients((current) => (append ? [...current, ...rows] : rows));
      setPatientPage(page);

      const pagination = payload?.pagination || response?.pagination;
      setPatientHasMore(
        Boolean(
          pagination?.hasNextPage ??
          pagination?.hasNext ??
          response?.hasNextPage ??
          false
        )
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to search patients."
      );
    } finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!patientModalOpen) return;

    const timer = window.setTimeout(() => {
      searchPatients(patientSearch.trim(), 1, false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [patientModalOpen, patientSearch, searchPatients]);

  const selectPatientForSpectacle = (patient) => {
    if (!patient?._id) return;
    setPatientModalOpen(false);
    navigate(`/optical/spectacles/new/${patient._id}`);
  };

  const spectacleJobs = useMemo(
    () => jobs,
    [jobs],
  );

  const filteredSpectacles = useMemo(() => filterRows(spectacleJobs, query), [spectacleJobs, query]);
  const filteredContacts = useMemo(() => filterRows(contactOrders, query), [contactOrders, query]);

  const currentOrders = useMemo(
    () => filteredSpectacles.filter((job) => !["collected", "cancelled"].includes(job.status)),
    [filteredSpectacles],
  );

  const previousPurchased = useMemo(
    () => filteredSpectacles.filter((job) => job.status === "collected"),
    [filteredSpectacles],
  );

  const opticalHistory = useMemo(
    () => [...filteredSpectacles].sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    }),
    [filteredSpectacles],
  );

  const totalOpen = jobs.filter((job) => !["collected", "cancelled"].includes(job.status)).length;
  const ready = jobs.filter((job) => job.status === "ready").length;
  const collected = jobs.filter((job) => job.status === "collected").length;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-5 sm:py-7">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-5 lg:px-7">
        <header className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-600">Optical workspace</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Optical Management</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Manage spectacle jobs, contact lens dispensing and optical production. Clinical consultations remain in Clinical Management.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500">OPTICAL</div>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate("/optical/contact-lenses/new")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ContactRound size={14} /> Contact lens order
              </button>
              <button
                type="button"
                onClick={openPatientSelector}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={14} /> Select patient for spectacle job
              </button>
            </div>
          </div>
        </header>
      {error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{error}</div>}

      <Section number="01" title="Optical overview">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Glasses} label="Open jobs" value={totalOpen} />
          <Metric icon={PackageCheck} label="Ready" value={ready} />
          <Metric icon={ContactRound} label="Contact lens orders" value={contactOrders.length} />
          <Metric icon={Glasses} label="Collected" value={collected} />
        </div>

      </Section>

      <Section number="02" title="Patient optical records" description="Quickly distinguish the complete spectacle history, active orders and previous purchases. Click any record to open the full optical record.">
        <div className="grid gap-3 sm:grid-cols-3">
          <RecordCard
            icon={History}
            title="Spectacle history"
            value={opticalHistory.length}
            description="Every spectacle job for the current search."
            active={recordView === "history"}
            onClick={() => setRecordView("history")}
          />
          <RecordCard
            icon={PackageCheck}
            title="Current orders"
            value={currentOrders.length}
            description="Draft, ordered, ready and active jobs."
            active={recordView === "current"}
            onClick={() => setRecordView("current")}
          />
          <RecordCard
            icon={ShoppingBag}
            title="Previous purchased"
            value={previousPurchased.length}
            description="Collected spectacle purchases."
            active={recordView === "purchased"}
            onClick={() => setRecordView("purchased")}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-slate-900">
                {recordView === "history" ? "Spectacle history" : recordView === "current" ? "Current orders" : "Previous purchased"}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {recordView === "history"
                  ? "Complete spectacle order history."
                  : recordView === "current"
                    ? "Orders that still require production, dispensing or collection."
                    : "Completed purchases collected by the patient."}
              </p>
            </div>
            <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
              {recordView === "history" ? opticalHistory.length : recordView === "current" ? currentOrders.length : previousPurchased.length} records
            </span>
          </div>

          {(() => {
            const rows = recordView === "history" ? opticalHistory : recordView === "current" ? currentOrders : previousPurchased;
            return rows.length ? (
              <div className="divide-y divide-slate-100">
                {rows.slice(0, 12).map((row) => (
                  <button
                    key={row._id}
                    type="button"
                    onClick={() => setRecordModal({ type: "spectacle", row })}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Glasses size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{row.jobNumber || row.recordNumber || "Spectacle job"}</span>
                        <StatusBadge value={row.status} />
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-slate-400">
                        {patientName(row.patientId)} · {row.patientId?.patientNumber || "—"} · {formatDate(row.jobDate || row.createdAt)}
                      </span>
                    </span>
                    <span className="hidden text-right sm:block">
                      <span className="block text-xs font-bold text-slate-800">₹{money(row.total ?? row.amount)}</span>
                      <span className="text-[10px] text-slate-400">{row.frame?.code || row.frameItemId?.code || "No frame"} · {row.lens?.code || row.lensItemId?.code || "No lens"}</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">View</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">No records in this category.</div>
            );
          })()}
        </div>
      </Section>

      <Section number="03" title="Spectacle jobs" description="Production jobs remain separate from the clinical consultation record.">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search job, patient, phone, frame or lens..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="">All statuses</option>
            {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
          </select>
        </div>

        {loading ? <LoadingState /> : (
          <Table
            rows={filteredSpectacles}
            empty="No spectacle jobs found."
            columns={[
              { key: "job", label: "Job", render: (row) => <button type="button" onClick={() => setRecordModal({ type: "spectacle", row })} className="font-semibold text-slate-900 hover:text-blue-700">{row.recordNumber || row.jobNumber || "View job"}</button> },
              { key: "patient", label: "Patient", render: (row) => <button type="button" onClick={() => navigate(`/patients/${row.patientId?._id}`)} className="text-left"><span className="block font-semibold text-slate-800">{patientName(row.patientId)}</span><span className="text-[10px] text-slate-400">{row.patientId?.patientNumber || "—"}</span></button> },
              { key: "frame", label: "Frame", render: (row) => row.frame?.code || row.frameItemId?.code || "—" },
              { key: "lens", label: "Lens", render: (row) => row.lens?.code || row.lensItemId?.code || "—" },
              { key: "due", label: "Due", render: (row) => formatDate(row.dueDate || row.specDueDate || row.labDueDate) },
              { key: "total", label: "Total", align: "right", render: (row) => `₹${money(row.amount)}` },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
            ]}
          />
        )}
      </Section>

      <Section number="04" title="Contact lens orders" description="Contact lens dispensing remains its own optical workflow and record type.">
        <Table
          rows={filteredContacts}
          empty="No contact lens orders found."
          columns={[
            { key: "order", label: "Order", render: (row) => <button type="button" onClick={() => setRecordModal({ type: "contact", row })} className="font-semibold text-slate-900 hover:text-blue-700">{row.orderNumber || "View order"}</button> },
            { key: "patient", label: "Patient", render: (row) => patientName(row.patientId) },
            { key: "lens", label: "Lens", render: (row) => `${row.brand || "—"}${row.model ? ` · ${row.model}` : ""}` },
            { key: "qty", label: "Qty", render: (row) => row.quantity || 1 },
            { key: "total", label: "Total", align: "right", render: (row) => `₹${money(row.total)}` },
            { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
          ]}
        />
      </Section>

      <Section number="05" title="Optical workflows">
        <div className="grid gap-3 sm:grid-cols-3">
          <WorkflowCard icon={Glasses} title="Spectacle dispensing" description="Create a spectacle job from the patient record." onClick={openPatientSelector} />
          <WorkflowCard icon={ContactRound} title="Contact lenses" description="Create or review contact lens orders and fitting." onClick={() => navigate("/optical/contact-lenses")} />
          <WorkflowCard icon={PackageCheck} title="Dispensing queue" description="Move optical jobs through order, ready and collection stages." onClick={() => navigate("/dispensing")} />
        </div>
      </Section>
      </div>

      {recordModal && (
        <OpticalRecordModal
          record={recordModal.row}
          type={recordModal.type}
          onClose={() => setRecordModal(null)}
          onOpen={() => {
            if (recordModal.type === "spectacle") {
              navigate(`/optical/spectacles/${recordModal.row._id}`);
            } else {
              navigate(`/optical/contact-lenses/${recordModal.row._id}`);
            }
          }}
        />
      )}

      {patientModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="select-patient-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPatientModalOpen(false);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-600">
                    Optical order
                  </div>
                  <h2 id="select-patient-title" className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                    Select patient
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose the patient here and continue directly to the spectacle job.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPatientModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  aria-label="Close patient selector"
                >
                  Close
                </button>
              </div>

              <div className="relative mt-4">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoFocus
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  placeholder="Search patient name, number or phone..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {patientLoading && patients.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-xs text-slate-400">
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Loading patients...
                </div>
              ) : patients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                  <ContactRound className="mx-auto text-slate-300" size={24} />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No patients found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try another name, patient number or phone number.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(patients) ? patients : []).map((patient) => {
                    const name = patientName(patient);
                    const age =
                      patient.age ??
                      (patient.dateOfBirth
                        ? Math.max(
                            0,
                            new Date().getFullYear() -
                              new Date(patient.dateOfBirth).getFullYear()
                          )
                        : null);

                    return (
                      <button
                        key={patient._id}
                        type="button"
                        onClick={() => selectPatientForSpectacle(patient)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <ContactRound size={17} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-slate-900">
                              {name}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              {patient.patientNumber || "No number"}
                            </span>
                          </span>

                          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                            {age !== null && <span>{age} yrs</span>}
                            {patient.phone && <span>{patient.phone}</span>}
                            {patient.gender && <span>{label(patient.gender)}</span>}
                          </span>
                        </span>

                        <span className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-bold text-white transition group-hover:bg-emerald-700">
                          Select
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {patientHasMore && (
                <button
                  type="button"
                  disabled={patientLoading}
                  onClick={() =>
                    searchPatients(
                      patientSearch.trim(),
                      patientPage + 1,
                      true
                    )
                  }
                  className="mx-auto mt-3 block rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {patientLoading ? "Loading..." : "Load more patients"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function filterRows(rows, query) {
  const term = query.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => [row.recordNumber, row.jobNumber, row.orderNumber, patientName(row.patientId), row.patientId?.patientNumber, row.patientId?.phone, row.brand, row.model, row.frame?.code, row.lens?.code].filter(Boolean).join(" ").toLowerCase().includes(term));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function RecordCard({ icon: Icon, title, value, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-950 text-white shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className={`flex items-center justify-between ${active ? "text-slate-300" : "text-slate-400"}`}>
        <Icon size={15} />
        <span className={`text-[10px] font-bold ${active ? "text-slate-400" : "text-slate-400"}`}>VIEW</span>
      </div>
      <div className="mt-3 text-xl font-bold">{value}</div>
      <div className={`mt-1 text-xs font-bold ${active ? "text-white" : "text-slate-800"}`}>{title}</div>
      <div className={`mt-1 text-[10px] leading-4 ${active ? "text-slate-400" : "text-slate-400"}`}>{description}</div>
    </button>
  );
}

function OpticalRecordModal({ record, type, onClose, onOpen }) {
  const isSpectacle = type === "spectacle";
  const patient = record?.patientId;
  const total = record?.total ?? record?.amount ?? record?.grandTotal ?? 0;
  const frame = record?.frame || {};
  const lens = record?.lens || {};
  const rx = record?.rx || record?.prescription || {};

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-600">
                {isSpectacle ? "Spectacle record" : "Contact lens record"}
              </div>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                {patientName(patient)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {patient?.patientNumber || "No patient number"} · {patient?.phone || "No phone"} · {formatDate(record?.jobDate || record?.orderDate || record?.createdAt)}
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <DetailBox label="Record" value={record?.jobNumber || record?.recordNumber || record?.orderNumber || "—"} />
            <DetailBox label="Status" value={label(record?.status)} />
            <DetailBox label="Due date" value={formatDate(record?.dueDate || record?.specDueDate || record?.labDueDate)} />
            <DetailBox label="Total" value={`₹${money(total)}`} />
          </div>

          {isSpectacle ? (
            <>
              <ModalSection title="Frame">
                <DetailGrid
                  items={[
                    ["Code", frame.code || record?.frameItemId?.code],
                    ["Description", frame.description],
                    ["Brand", frame.brand],
                    ["Model", frame.model],
                    ["Price", `₹${money(frame.price)}`],
                    ["Own frame", frame.ownFrame ? "Yes" : "No"],
                  ]}
                />
              </ModalSection>

              <ModalSection title="Lens">
                <DetailGrid
                  items={[
                    ["Code", lens.code || record?.lensItemId?.code],
                    ["Description", lens.description],
                    ["Supplier", lens.supplier],
                    ["Price", `₹${money(lens.price)}`],
                  ]}
                />
              </ModalSection>

              <ModalSection title="Prescription">
                <DetailGrid
                  items={[
                    ["Right sphere", rx.right?.sphere],
                    ["Right cylinder", rx.right?.cylinder],
                    ["Right axis", rx.right?.axis],
                    ["Right VA", rx.right?.va],
                    ["Left sphere", rx.left?.sphere],
                    ["Left cylinder", rx.left?.cylinder],
                    ["Left axis", rx.left?.axis],
                    ["Left VA", rx.left?.va],
                    ["PD right", record?.pd?.right],
                    ["PD left", record?.pd?.left],
                    ["PD total", record?.pd?.total],
                  ]}
                />
              </ModalSection>

              <ModalSection title="Pricing & notes">
                <DetailGrid
                  items={[
                    ["Frame", `₹${money(frame.price)}`],
                    ["Lens", `₹${money(lens.price)}`],
                    ["Extras", `₹${money((record?.extras || []).reduce((sum, item) => sum + Number(item?.price || 0), 0))}`],
                    ["Discount", `₹${money(record?.discount)}`],
                    ["Total", `₹${money(total)}`],
                    ["Notes", record?.notes],
                  ]}
                />
              </ModalSection>
            </>
          ) : (
            <>
              <ModalSection title="Contact lens order">
                <DetailGrid
                  items={[
                    ["Order", record?.orderNumber],
                    ["Brand", record?.brand],
                    ["Model", record?.model],
                    ["Lens type", record?.lensType || record?.type],
                    ["Quantity", record?.quantity || 1],
                    ["Price", `₹${money(record?.total || record?.amount)}`],
                    ["Supplier", record?.supplier],
                    ["Notes", record?.notes],
                  ]}
                />
              </ModalSection>
              <ModalSection title="Prescription">
                <DetailGrid
                  items={[
                    ["Right sphere", rx.right?.sphere],
                    ["Right cylinder", rx.right?.cylinder],
                    ["Right axis", rx.right?.axis],
                    ["Left sphere", rx.left?.sphere],
                    ["Left cylinder", rx.left?.cylinder],
                    ["Left axis", rx.left?.axis],
                    ["Add right", rx.right?.add],
                    ["Add left", rx.left?.add],
                  ]}
                />
              </ModalSection>
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Close
          </button>
          <button type="button" onClick={onOpen} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">
            Open full record
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSection({ title, children }) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800">{title}</div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DetailGrid({ items }) {
  return (
    <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{key}</div>
          <div className="mt-1 break-words text-xs font-semibold text-slate-700">{value || "—"}</div>
        </div>
      ))}
    </div>
  );
}

function DetailBox({ label: title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="mt-1 truncate text-xs font-bold text-slate-800">{value || "—"}</div>
    </div>
  );
}

function Metric({ icon: Icon, label: title, value }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-400"><Icon size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">{title}</span></div><div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div></div>;
}

function StatusBadge({ value }) {
  return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{label(value)}</span>;
}

function WorkflowCard({ icon: Icon, title, description, onClick }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon size={16} /></span><span className="mt-3 block text-xs font-bold text-slate-800">{title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-400">{description}</span><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 group-hover:text-slate-900">Open <ExternalLink size={11} /></span></button>;
}

function LoadingState() {
  return <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"><RefreshCw size={14} className="animate-spin" />Loading optical records...</div>;
}

function Section({ number, title, description, children }) {
  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          {number && <span className="text-[10px] font-bold text-emerald-600">{number}</span>}
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        </div>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Table({ rows, columns, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
          {columns.map((column) => <th key={column.key} className={`px-3 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>{column.label}</th>)}
        </tr></thead>
        <tbody>
          {rows.length ? rows.map((row, index) => <tr key={row._id || row.id || index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">{columns.map((column) => <td key={column.key} className={`px-3 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>) : <tr><td colSpan={columns.length} className="py-14 text-center text-xs text-slate-400">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
