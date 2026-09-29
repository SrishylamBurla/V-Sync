import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Glasses,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDispensingList } from "../../dispensing/dispensing.api";
import { getPatients } from "../../patients/patient.api";

import {
  DocumentShell,
  Section,
  Table,
} from "../../../components/common/DocumentUI";

const statuses = [
  "draft",
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const normalizeItemType = (value) => {
  const type = String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  if (
    type.includes("contact") ||
    type.includes("contact lens") ||
    type === "lens"
  ) {
    return "contact_lens";
  }

  return "spectacle";
};

const normalizePatients = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.patients)) {
    return payload.patients;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

export default function SpectacleJobsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Patient selector
   */
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientPage, setPatientPage] = useState(1);
  const [patientHasMore, setPatientHasMore] = useState(false);

  /*
   * Load spectacle jobs
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDispensingList(
        status ? { status } : {},
      );

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      // Only spectacle jobs belong on this page.
      const spectacleJobs = data.filter(
        (job) => normalizeItemType(job?.itemType) === "spectacle",
      );

      setRows(spectacleJobs);
    } catch (err) {
      setRows([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load spectacle jobs.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  /*
   * ---------------------------------------------------------
   * PATIENT SELECTOR
   * ---------------------------------------------------------
   */

  const openPatientSelector = useCallback(async () => {
    setPatientModalOpen(true);
    setPatientSearch("");
    setPatientPage(1);
    setPatientLoading(true);
    setError("");

    try {
      const response = await getPatients({
        page: 1,
        limit: 20,
        search: "",
        status: "active",
      });

      const patientRows = normalizePatients(response);

      setPatients(patientRows);

      const payload = response?.data ?? response;

      const pagination =
        payload?.pagination ||
        response?.pagination;

      setPatientHasMore(
        Boolean(
          pagination?.hasNextPage ??
            pagination?.hasNext ??
            response?.hasNextPage ??
            false,
        ),
      );
    } catch (err) {
      setPatients([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load patients.",
      );
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const searchPatients = useCallback(
    async (search, page = 1, append = false) => {
      setPatientLoading(true);

      try {
        const response = await getPatients({
          page,
          limit: 20,
          search,
          status: "active",
        });

        const patientRows = normalizePatients(response);

        setPatients((current) =>
          append ? [...current, ...patientRows] : patientRows,
        );

        setPatientPage(page);

        const payload = response?.data ?? response;

        const pagination =
          payload?.pagination ||
          response?.pagination;

        setPatientHasMore(
          Boolean(
            pagination?.hasNextPage ??
              pagination?.hasNext ??
              response?.hasNextPage ??
              false,
          ),
        );
      } catch (err) {
        if (!append) {
          setPatients([]);
        }

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to search patients.",
        );
      } finally {
        setPatientLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!patientModalOpen) return;

    const timer = window.setTimeout(() => {
      searchPatients(patientSearch.trim(), 1, false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    patientModalOpen,
    patientSearch,
    searchPatients,
  ]);

  /*
   * Select patient -> create spectacle job
   *
   * THIS FIXES THE PREVIOUS:
   * Invalid dispensing job ID
   *
   * The patient _id is now explicitly passed.
   */
  const selectPatientForSpectacle = (patient) => {
    if (!patient?._id) {
      setError("Selected patient does not have a valid patient ID.");
      return;
    }

    setPatientModalOpen(false);

    navigate(
      `/dispensing/spectacles/new/${patient._id}`,
    );
  };

  const loadMorePatients = () => {
    if (patientLoading || !patientHasMore) return;

    searchPatients(
      patientSearch.trim(),
      patientPage + 1,
      true,
    );
  };

  /*
   * Search existing spectacle jobs
   */
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return rows;
    }

    return rows.filter((row) => {
      const searchable = [
        row?.recordNumber,
        row?.jobNumber,

        patientName(row?.patientId),

        row?.patientId?.patientNumber,
        row?.patientId?.phone,

        row?.brand,
        row?.model,
        row?.supplier,

        row?.status,

        row?.frame?.code,
        row?.frame?.description,

        row?.lens?.code,
        row?.lens?.description,
        row?.lens?.supplier,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [rows, query]);

  const counts = useMemo(() => {
    return Object.fromEntries(
      statuses.map((currentStatus) => [
        currentStatus,
        rows.filter(
          (row) => row?.status === currentStatus,
        ).length,
      ]),
    );
  }, [rows]);

  const openJob = (id) => {
    if (!id) return;

    navigate(`/dispensing/spectacles/${id}`);
  };

  const openPatient = (id) => {
    if (!id) return;

    navigate(`/patients/${id}`);
  };

  const getTotal = (row) => {
    const frame = Number(row?.frame?.price || 0);
    const lens = Number(row?.lens?.price || 0);

    const extras = Array.isArray(row?.extras)
      ? row.extras.reduce(
          (sum, item) =>
            sum + Number(item?.price || 0),
          0,
        )
      : 0;

    const discount = Number(row?.discount || 0);

    return Math.max(
      0,
      frame + lens + extras - discount,
    );
  };

  return (
    <>
      <DocumentShell
        eyebrow="Dispensing workspace"
        title="Spectacle Jobs"
        subtitle="Manage spectacle dispensing jobs from prescription and frame selection through collection."
        code="SPECTACLE JOBS"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              Refresh
            </button>

            {/*
             * NEW SPECTACLE JOB
             *
             * Do NOT navigate directly with an undefined
             * patientId.
             *
             * First select the patient.
             */}
            <button
              type="button"
              onClick={openPatientSelector}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={14} />

              New spectacle job
            </button>
          </div>
        }
      >
        {error && (
          <div className="m-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-lg p-1 hover:bg-red-100"
              aria-label="Close error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =========================================================
            01 — SPECTACLE JOB REGISTER
        ========================================================== */}

        <Section
          number="01"
          title="Spectacle job register"
          description="View and manage spectacle dispensing jobs for your practice."
        >
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_190px]">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search job, patient, phone, frame or lens..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="">
                All statuses
              </option>

              {statuses.map((currentStatus) => (
                <option
                  key={currentStatus}
                  value={currentStatus}
                >
                  {label(currentStatus)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading spectacle jobs...
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "job",
                  label: "Job",
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() =>
                        openJob(row?._id)
                      }
                      className="text-left"
                    >
                      <span className="block font-semibold text-slate-900 hover:underline">
                        {row?.recordNumber ||
                          row?.jobNumber ||
                          "—"}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        Spectacle
                      </span>
                    </button>
                  ),
                },

                {
                  key: "patient",
                  label: "Patient",
                  render: (row) => {
                    const patientId =
                      row?.patientId?._id;

                    if (!patientId) {
                      return (
                        <div>
                          <span className="block font-semibold text-slate-800">
                            {patientName(
                              row?.patientId,
                            )}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            No patient information
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() =>
                          openPatient(
                            patientId,
                          )
                        }
                        className="text-left"
                      >
                        <span className="block font-semibold text-slate-800 hover:underline">
                          {patientName(
                            row?.patientId,
                          )}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          {row?.patientId
                            ?.patientNumber ||
                            "No patient number"}

                          {row?.patientId
                            ?.phone
                            ? ` · ${row.patientId.phone}`
                            : ""}
                        </span>
                      </button>
                    );
                  },
                },

                {
                  key: "frame",
                  label: "Frame",
                  render: (row) => (
                    <div>
                      <span className="block font-medium text-slate-700">
                        {row?.frame?.code ||
                          row?.frame?.description ||
                          "—"}
                      </span>

                      {row?.frame?.description &&
                        row?.frame?.code && (
                          <span className="text-[10px] text-slate-400">
                            {
                              row.frame
                                .description
                            }
                          </span>
                        )}
                    </div>
                  ),
                },

                {
                  key: "lens",
                  label: "Lens",
                  render: (row) => (
                    <div>
                      <span className="block font-medium text-slate-700">
                        {row?.lens?.code ||
                          row?.lens?.description ||
                          "—"}
                      </span>

                      {row?.lens?.supplier && (
                        <span className="text-[10px] text-slate-400">
                          {
                            row.lens
                              .supplier
                          }
                        </span>
                      )}
                    </div>
                  ),
                },

                {
                  key: "dueDate",
                  label: "Due",
                  render: (row) =>
                    row?.dueDate
                      ? new Date(
                          row.dueDate,
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—",
                },

                {
                  key: "total",
                  label: "Total",
                  render: (row) =>
                    money(getTotal(row)),
                },

                {
                  key: "status",
                  label: "Status",
                  render: (row) => (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {label(row?.status)}
                    </span>
                  ),
                },

                {
                  key: "action",
                  label: "",
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() =>
                        openJob(row?._id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Glasses size={12} />
                      Open
                    </button>
                  ),
                },
              ]}
              rows={filtered}
              empty="No spectacle jobs found."
            />
          )}
        </Section>

        {/* =========================================================
            02 — WORKFLOW SUMMARY
        ========================================================== */}

        <Section
          number="02"
          title="Workflow summary"
          description="Current spectacle jobs grouped by dispensing status."
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {statuses.map((currentStatus) => {
              const active =
                status === currentStatus;

              return (
                <button
                  key={currentStatus}
                  type="button"
                  onClick={() =>
                    setStatus(
                      active
                        ? ""
                        : currentStatus,
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      active
                        ? "text-slate-300"
                        : "text-slate-400"
                    }`}
                  >
                    {label(currentStatus)}
                  </div>

                  <div className="mt-2 text-2xl font-bold">
                    {counts[currentStatus] ||
                      0}
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    Spectacle jobs
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* =========================================================
            03 — WORKFLOW
        ========================================================== */}

        <Section
          number="03"
          title="Dispensing workflow"
          description="Spectacle jobs move through the dispensing process."
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {[
              "Draft",
              "Ordered",
              "Not Ready",
              "Ready",
              "Notified",
              "Collected",
            ].map((step, index, array) => (
              <span
                key={step}
                className="flex items-center gap-2"
              >
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  {step}
                </span>

                {index <
                  array.length - 1 && (
                  <span>→</span>
                )}
              </span>
            ))}
          </div>
        </Section>
      </DocumentShell>

      {/* =========================================================
          PATIENT SELECTOR MODAL
      ========================================================== */}

      {patientModalOpen && (
        <PatientSelectorModal
          search={patientSearch}
          setSearch={setPatientSearch}
          patients={patients}
          loading={patientLoading}
          hasMore={patientHasMore}
          onLoadMore={loadMorePatients}
          onSelect={selectPatientForSpectacle}
          onClose={() =>
            setPatientModalOpen(false)
          }
        />
      )}
    </>
  );
}

/* ===============================================================
   PATIENT SELECTOR
================================================================ */

function PatientSelectorModal({
  search,
  setSearch,
  patients,
  loading,
  hasMore,
  onLoadMore,
  onSelect,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spectacle-patient-selector-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-violet-50 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Glasses size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                    Spectacle dispensing
                  </p>

                  <h2
                    id="spectacle-patient-selector-title"
                    className="mt-0.5 text-lg font-bold tracking-tight text-slate-900"
                  >
                    Select patient
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Search for the patient before creating
                a new spectacle job.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close patient selector"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              autoFocus
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by patient name, phone or patient number..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
            <UserRound size={12} />
            <span>
              Only active patients are shown.
            </span>
          </div>
        </div>

        {/* Patient list */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {loading && patients.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Loader2
                size={24}
                className="animate-spin text-violet-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Searching patients...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait.
              </p>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <UserRound size={21} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                No patients found
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Try searching with the patient's name,
                phone number or patient number.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {patients.map((patient) => {
                const initials =
                  (
                    (patient?.firstName?.[0] ||
                      "") +
                    (patient?.lastName?.[0] ||
                      "")
                  ).toUpperCase() || "?";

                return (
                  <button
                    key={patient._id}
                    type="button"
                    onClick={() =>
                      onSelect(patient)
                    }
                    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm"
                  >
                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-xs font-bold text-violet-700">
                      {initials}
                    </div>

                    {/* Patient information */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-900 group-hover:text-violet-700">
                        {patientName(patient)}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                        <span>
                          {patient?.patientNumber ||
                            "No patient number"}
                        </span>

                        {patient?.phone && (
                          <>
                            <span>•</span>
                            <span>
                              {patient.phone}
                            </span>
                          </>
                        )}

                        {patient?.gender && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {patient.gender}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Select */}
                    <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 transition group-hover:border-violet-200 group-hover:bg-violet-600 group-hover:text-white">
                      Select
                    </div>
                  </button>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:bg-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Load more patients
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="text-[10px] text-slate-400">
            Select a patient to continue
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}