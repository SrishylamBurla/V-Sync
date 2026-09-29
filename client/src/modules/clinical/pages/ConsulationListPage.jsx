import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getConsultations,
} from "../consultation.api";

const CONSULTATION_TYPES = [
  {
    value: "",
    label: "All consultation types",
  },
  {
    value: "comprehensive",
    label: "Comprehensive",
  },
  {
    value: "short_consult",
    label: "Short Consult",
  },
  {
    value: "binocular_vision",
    label: "Binocular Vision",
  },
  {
    value: "low_vision",
    label: "Low Vision",
  },
  {
    value: "contact_lenses",
    label: "Contact Lens Consultation",
  },
];

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "completed",
    label: "Completed",
  },
];

const PAGE_SIZE = 25;

const getPatientName = (patient) => {
  if (!patient) return "Unknown Patient";

  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unknown Patient";
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getConsultationTypeLabel = (type) => {
  switch (type) {
    case "comprehensive":
      return "Comprehensive";

    case "short_consult":
      return "Short Consult";

    case "binocular_vision":
      return "Binocular Vision";

    case "low_vision":
      return "Low Vision";

    case "contact_lenses":
      return "Contact Lens";

    case "specialized":
      return "Specialized";

    default:
      return type
        ? type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) =>
              char.toUpperCase(),
            )
        : "Consultation";
  }
};

const getConsultationTypeClass = (type) => {
  switch (type) {
    case "comprehensive":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "short_consult":
      return "bg-slate-50 text-slate-700 border-slate-200";

    case "binocular_vision":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "low_vision":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "contact_lenses":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    case "draft":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export default function ConsultationListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [consultationType, setConsultationType] =
    useState("");

  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [consultations, setConsultations] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const loadConsultations = useCallback(
    async ({
      currentPage = page,
      currentSearch = search,
      currentType = consultationType,
      currentStatus = status,
      isRefresh = false,
    } = {}) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getConsultations({
          page: currentPage,
          limit: PAGE_SIZE,
          search: currentSearch || undefined,
          consultationType:
            currentType || undefined,
          status:
            currentStatus || undefined,
        });

        /*
         * API response:
         *
         * {
         *   success: true,
         *   data: {
         *      consultations: [],
         *      pagination: {}
         *   }
         * }
         */

        const data = response?.data ?? response;

        setConsultations(
          Array.isArray(data?.consultations)
            ? data.consultations
            : [],
        );

        setPagination({
          page:
            Number(data?.pagination?.page) ||
            currentPage,

          limit:
            Number(data?.pagination?.limit) ||
            PAGE_SIZE,

          total:
            Number(data?.pagination?.total) ||
            0,

          totalPages:
            Number(
              data?.pagination?.totalPages,
            ) || 1,
        });
      } catch (err) {
        console.error(
          "Failed to load consultations:",
          err,
        );

        setConsultations([]);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load consultation history.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      consultationType,
      status,
    ],
  );

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const handleSearch = () => {
    const value = searchInput.trim();

    setPage(1);
    setSearch(value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleTypeChange = (value) => {
    setConsultationType(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleRefresh = () => {
    loadConsultations({
      currentPage: page,
      currentSearch: search,
      currentType: consultationType,
      currentStatus: status,
      isRefresh: true,
    });
  };

  const handlePrevious = () => {
    if (page <= 1) return;

    setPage((current) => current - 1);
  };

  const handleNext = () => {
    if (page >= pagination.totalPages) {
      return;
    }

    setPage((current) => current + 1);
  };

  const handleViewConsultation = (
    consultation,
  ) => {
    if (!consultation?._id) {
      return;
    }

    navigate(
      `/clinical/consultations/${consultation._id}`,
    );
  };

  const handlePatient = (patientId) => {
    if (!patientId) {
      return;
    }

    const id =
      typeof patientId === "object"
        ? patientId._id
        : patientId;

    if (!id) {
      return;
    }

    navigate(`/patients/${id}`);
  };

  const hasFilters = useMemo(
    () =>
      Boolean(
        search ||
          consultationType ||
          status,
      ),
    [
      search,
      consultationType,
      status,
    ],
  );

  const firstResult =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) *
          pagination.limit +
        1;

  const lastResult =
    Math.min(
      pagination.page *
        pagination.limit,
      pagination.total,
    );

  return (
    <div className="min-h-full bg-slate-50">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <ClipboardList
                  size={21}
                  strokeWidth={2}
                />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  Clinical Management
                </h1>

                <p className="mt-0.5 text-sm text-slate-500">
                  Consultation history and clinical
                  records
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw size={16} />
              )}

              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}
      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* ===================================================
            SEARCH / FILTER BAR
        =================================================== */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              {/* SEARCH */}
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  placeholder="Search patient name, patient ID or phone..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={
                      handleClearSearch
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Search size={16} />
                Search
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowFilters(
                    (current) =>
                      !current,
                  )
                }
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition ${
                  showFilters ||
                  hasFilters
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter size={16} />
                Filters
              </button>
            </div>

            {/* FILTERS */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Consultation Type
                  </label>

                  <select
                    value={
                      consultationType
                    }
                    onChange={(event) =>
                      handleTypeChange(
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    {CONSULTATION_TYPES.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      handleStatusChange(
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            ACTIVE FILTER SUMMARY
        =================================================== */}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Search: "{search}"
                <X size={13} />
              </button>
            )}

            {consultationType && (
              <button
                type="button"
                onClick={() =>
                  handleTypeChange("")
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {getConsultationTypeLabel(
                  consultationType,
                )}
                <X size={13} />
              </button>
            )}

            {status && (
              <button
                type="button"
                onClick={() =>
                  handleStatusChange("")
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {status}
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* ===================================================
            SUMMARY
        =================================================== */}
        <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Consultation History
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {pagination.total} consultation
              {pagination.total === 1
                ? ""
                : "s"} found
            </p>
          </div>

          {pagination.total > 0 && (
            <p className="text-xs text-slate-500">
              Showing {firstResult}–{lastResult}{" "}
              of {pagination.total}
            </p>
          )}
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}
        {error && !loading && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to load consultation
                  history
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadConsultations()
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            TABLE
        =================================================== */}
        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2
                  size={26}
                  className="animate-spin"
                />

                <span className="text-sm">
                  Loading consultation history...
                </span>
              </div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ClipboardList
                  size={25}
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No consultations found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                There are no consultation records
                matching the current search or
                filters.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                    setConsultationType(
                      "",
                    );
                    setStatus("");
                    setPage(1);
                  }}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Patient
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Patient ID
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Consultation
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Optometrist
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {consultations.map(
                      (consultation) => {
                        const patient =
                          consultation.patientId;

                        const optometrist =
                          consultation.optometristId;

                        return (
                          <tr
                            key={
                              consultation._id
                            }
                            className="group transition hover:bg-slate-50/70"
                          >
                            {/* PATIENT */}
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handlePatient(
                                    patient?._id,
                                  )
                                }
                                className="flex items-center gap-3 text-left"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                  <UserRound
                                    size={17}
                                  />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                                    {getPatientName(
                                      patient,
                                    )}
                                  </p>

                                  {patient?.phone && (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      {
                                        patient.phone
                                      }
                                    </p>
                                  )}
                                </div>
                              </button>
                            </td>

                            {/* PATIENT ID */}
                            <td className="px-5 py-4">
                              <span className="font-mono text-xs font-medium text-slate-600">
                                {patient?.patientNumber ||
                                  "—"}
                              </span>
                            </td>

                            {/* TYPE */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getConsultationTypeClass(
                                  consultation.consultationType,
                                )}`}
                              >
                                {getConsultationTypeLabel(
                                  consultation.consultationType,
                                )}
                              </span>
                            </td>

                            {/* DATE */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <CalendarDays
                                  size={15}
                                  className="text-slate-400"
                                />

                                <div>
                                  <p className="text-sm text-slate-700">
                                    {formatDate(
                                      consultation.consultationDate,
                                    )}
                                  </p>

                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {formatDateTime(
                                      consultation.consultationDate,
                                    ).split(
                                      ", ",
                                    )[1] ||
                                      ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* OPTOMETRIST */}
                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-700">
                                {optometrist
                                  ? [
                                      optometrist.firstName,
                                      optometrist.lastName,
                                    ]
                                      .filter(
                                        Boolean,
                                      )
                                      .join(
                                        " ",
                                      )
                                  : "—"}
                              </p>
                            </td>

                            {/* STATUS */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                  consultation.status,
                                )}`}
                              >
                                {consultation.status
                                  ? consultation.status
                                      .replace(
                                        /_/g,
                                        " ",
                                      )
                                      .replace(
                                        /\b\w/g,
                                        (
                                          char,
                                        ) =>
                                          char.toUpperCase(),
                                      )
                                  : "Completed"}
                              </span>
                            </td>

                            {/* ACTION */}
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleViewConsultation(
                                    consultation,
                                  )
                                }
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <Eye
                                  size={15}
                                />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET CARDS */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {consultations.map(
                  (consultation) => {
                    const patient =
                      consultation.patientId;

                    const optometrist =
                      consultation.optometristId;

                    return (
                      <div
                        key={
                          consultation._id
                        }
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handlePatient(
                                patient?._id,
                              )
                            }
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <UserRound
                                size={18}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {getPatientName(
                                  patient,
                                )}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {patient?.patientNumber ||
                                  "No patient ID"}
                              </p>
                            </div>
                          </button>

                          <span
                            className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(
                              consultation.status,
                            )}`}
                          >
                            {consultation.status ||
                              "Completed"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getConsultationTypeClass(
                              consultation.consultationType,
                            )}`}
                          >
                            {getConsultationTypeLabel(
                              consultation.consultationType,
                            )}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Date
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-700">
                              {formatDate(
                                consultation.consultationDate,
                              )}
                            </p>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Optometrist
                            </p>

                            <p className="mt-1 truncate text-xs font-medium text-slate-700">
                              {optometrist
                                ? [
                                    optometrist.firstName,
                                    optometrist.lastName,
                                  ]
                                    .filter(
                                      Boolean,
                                    )
                                    .join(
                                      " ",
                                    )
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleViewConsultation(
                              consultation,
                            )
                          }
                          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          View Consultation
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}
        </section>

        {/* ===================================================
            PAGINATION
        =================================================== */}
        {!loading &&
          consultations.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    handlePrevious
                  }
                  disabled={
                    pagination.page <= 1
                  }
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={15}
                  />
                  Previous
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white">
                  {pagination.page}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}