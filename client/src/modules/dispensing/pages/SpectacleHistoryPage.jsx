import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getPrescriptions } from "../../clinical/prescription.api";

const PAGE_SIZE = 20;

const getPatient = (row) => row?.patientId || row?.patient || null;

const getPatientId = (patient) => {
  if (!patient) return "";
  if (typeof patient === "string") return patient;
  return patient._id || patient.id || "";
};

const getPatientName = (patient) => {
  if (!patient) return "Unknown patient";

  if (typeof patient === "string") {
    return patient;
  }

  return (
    [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown patient"
  );
};

const getPatientNumber = (patient) => {
  if (!patient || typeof patient === "string") return "";

  return patient.patientNumber || patient.registrationNumber || "";
};

const getEye = (row, side) => {
  return (
    row?.[side] ||
    row?.prescription?.[side] ||
    row?.rx?.[side] ||
    {}
  );
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
};

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

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
};

export default function SpectacleHistoryPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const [page, setPage] = useState(1);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (type) {
        params.type = type;
      }

      const response = await getPrescriptions(params);

      const data = response?.data ?? response;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.prescriptions)
          ? data.prescriptions
          : Array.isArray(data?.rows)
            ? data.rows
            : Array.isArray(response?.prescriptions)
              ? response.prescriptions
              : [];

      setRows(list);
    } catch (err) {
      setRows([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load spectacle history.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, type]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  useEffect(() => {
    setPage(1);
  }, [search, type]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const patient = getPatient(row);

      const searchable = [
        getPatientName(patient),
        getPatientNumber(patient),
        patient?.phone,
        patient?.email,
        row?.type,
        row?.prescriptionType,
        row?.consultationType,
        row?.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [rows, search]);

  const openPatient = (patient) => {
    const id = getPatientId(patient);

    if (!id) return;

    navigate(`/patients/${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 py-5 sm:py-7">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                <Eye size={13} />
                Dispensing
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Spectacle History
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review previous spectacle prescriptions and quickly access
                the associated patient record.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPrescriptions}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-4">
          <SummaryItem
            label="Records"
            value={rows.length}
          />

          <SummaryItem
            label="Previous"
            value={
              rows.filter(
                (row) =>
                  row?.type === "previous" ||
                  row?.prescriptionType === "previous",
              ).length
            }
          />

          <SummaryItem
            label="Subjective"
            value={
              rows.filter(
                (row) =>
                  row?.type === "subjective" ||
                  row?.prescriptionType === "subjective",
              ).length
            }
          />

          <SummaryItem
            label="Given"
            value={
              rows.filter(
                (row) =>
                  row?.type === "given" ||
                  row?.prescriptionType === "given",
              ).length
            }
          />
        </div>
      </header>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, patient number, phone or prescription..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="relative">
            <Filter
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="h-11 min-w-[180px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">All prescription types</option>
              <option value="previous">Previous</option>
              <option value="subjective">Subjective</option>
              <option value="given">Given</option>
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Prescription register
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Spectacle prescriptions
            </h2>
          </div>

          <div className="text-xs text-slate-500">
            {filteredRows.length} record
            {filteredRows.length === 1 ? "" : "s"}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[380px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={17} className="animate-spin" />
              Loading spectacle history...
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-5 py-3">
                    Patient
                  </th>

                  <th className="px-5 py-3">
                    Type
                  </th>

                  <th className="px-5 py-3">
                    Right eye
                  </th>

                  <th className="px-5 py-3">
                    Left eye
                  </th>

                  <th className="px-5 py-3">
                    PD
                  </th>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => {
                  const patient = getPatient(row);

                  const right = getEye(row, "right");
                  const left = getEye(row, "left");

                  return (
                    <tr
                      key={row._id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
                    >
                      {/* PATIENT */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openPatient(patient)}
                          className="group flex items-center gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 text-xs font-bold text-blue-700">
                            {getPatientName(patient)
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((item) => item[0])
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                              {getPatientName(patient)}
                            </div>

                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {getPatientNumber(patient) ||
                                "No patient number"}
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold capitalize text-blue-700">
                          {formatValue(
                            row.type || row.prescriptionType,
                          )}
                        </span>
                      </td>

                      {/* RIGHT */}

                      <td className="px-5 py-4">
                        <RxCell eye={right} />
                      </td>

                      {/* LEFT */}

                      <td className="px-5 py-4">
                        <RxCell eye={left} />
                      </td>

                      {/* PD */}

                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-700">
                          {formatNumber(
                            row?.pd?.total ||
                              row?.pd?.binocular ||
                              row?.pd?.right,
                          )}
                        </div>

                        {row?.pd?.left || row?.pd?.right ? (
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            R {formatNumber(row?.pd?.right)} / L{" "}
                            {formatNumber(row?.pd?.left)}
                          </div>
                        ) : null}
                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {formatDate(
                          row.createdAt ||
                            row.prescriptionDate ||
                            row.date,
                        )}
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openPatient(patient)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <UserRound size={13} />
                          Patient
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading && (
          <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-400">
              Showing {filteredRows.length} prescription
              {filteredRows.length === 1 ? "" : "s"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                {page}
              </span>

              <button
                type="button"
                disabled={rows.length < PAGE_SIZE}
                onClick={() =>
                  setPage((current) => current + 1)
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   SUMMARY
============================================================ */

function SummaryItem({ label, value }) {
  return (
    <div className="border-r border-slate-200 px-5 py-4 last:border-r-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   RX CELL
============================================================ */

function RxCell({ eye }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-1">
      <RxValue label="SPH" value={eye?.sphere} />
      <RxValue label="CYL" value={eye?.cylinder} />
      <RxValue label="AXIS" value={eye?.axis} />

      <RxValue label="ADD" value={eye?.add} />
      <RxValue label="VA" value={eye?.va} />
      <RxValue label="PRISM" value={eye?.prism} />
    </div>
  );
}

function RxValue({ label, value }) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="text-[11px] font-semibold text-slate-700">
        {formatValue(value)}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState({ search }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Eye size={25} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {search
          ? "No spectacle prescriptions found"
          : "No spectacle history available"}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {search
          ? "Try a different patient name, patient number or prescription type."
          : "Previous spectacle prescriptions will appear here when they are recorded."}
      </p>
    </div>
  );
}