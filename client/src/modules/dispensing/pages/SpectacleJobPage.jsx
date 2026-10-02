import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Filter,
  Glasses,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDispensingList } from "../dispensing.api";

const PAGE_SIZE = 20;

const STATUSES = [
  "draft",
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const patientName = (patient) => {
  if (!patient) return "Unknown patient";
  if (typeof patient === "string") return patient;

  return (
    [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown patient"
  );
};

const patientId = (patient) => {
  if (!patient) return "";
  if (typeof patient === "string") return patient;
  return patient._id || patient.id || "";
};

const patientNumber = (patient) => {
  if (!patient || typeof patient === "string") return "";
  return patient.patientNumber || patient.registrationNumber || "";
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

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusClass = (status) => {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-600";
    case "ordered":
      return "bg-blue-50 text-blue-700";
    case "not_ready":
      return "bg-orange-50 text-orange-700";
    case "ready":
      return "bg-amber-50 text-amber-700";
    case "notified":
      return "bg-violet-50 text-violet-700";
    case "collected":
      return "bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const normalizeItemType = (value) => {
  const type = String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim();

  if (type.includes("contact")) return "contact_lens";
  if (type.includes("sundry")) return "sundry";
  return "spectacle";
};

const extractRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.jobs)) return response.data.jobs;
  if (Array.isArray(response?.data?.dispensing)) return response.data.dispensing;
  if (Array.isArray(response?.jobs)) return response.jobs;
  if (Array.isArray(response?.dispensing)) return response.dispensing;
  return [];
};

const recordNumber = (row) =>
  row?.recordNumber ||
  row?.jobNumber ||
  row?.orderNumber ||
  row?.dispensingNumber ||
  "Spectacle job";

const total = (row) => {
  if (row?.total !== undefined && row?.total !== null) {
    return Number(row.total || 0);
  }

  const frame = Number(row?.frame?.price || 0);
  const lens = Number(row?.lens?.price || 0);
  const extras = Array.isArray(row?.extras)
    ? row.extras.reduce((sum, item) => sum + Number(item?.price || 0), 0)
    : 0;
  const discount = Number(row?.discount || 0);

  return Math.max(0, frame + lens + extras - discount);
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function SpectacleJobsPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: PAGE_SIZE };
      if (status) params.status = status;

      const response = await getDispensingList(params);
      const rows = extractRows(response).filter(
        (row) => normalizeItemType(row?.itemType) === "spectacle",
      );

      setJobs(rows);
    } catch (err) {
      setJobs([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load spectacle jobs.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const patient = job?.patientId || job?.patient;
      const searchable = [
        recordNumber(job),
        job?._id,
        patientName(patient),
        patientNumber(patient),
        patient?.phone,
        patient?.mobile,
        patient?.email,
        job?.status,
        job?.brand,
        job?.model,
        job?.supplier,
        job?.frame?.code,
        job?.frame?.description,
        job?.frame?.brand,
        job?.frame?.model,
        job?.lens?.code,
        job?.lens?.description,
        job?.lens?.supplier,
        job?.lens?.brand,
        job?.lens?.model,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [jobs, search]);

  const summary = useMemo(
    () => ({
      total: jobs.length,
      draft: jobs.filter((x) => x.status === "draft").length,
      ordered: jobs.filter((x) => x.status === "ordered").length,
      notReady: jobs.filter((x) => x.status === "not_ready").length,
      ready: jobs.filter((x) => x.status === "ready").length,
      collected: jobs.filter((x) => x.status === "collected").length,
    }),
    [jobs],
  );

  const openPatient = (patient) => {
    const id = patientId(patient);
    if (id) navigate(`/patients/${id}`);
  };

  const openJob = (job) => {
    // Always use the real dispensing document _id.
    // Never use patientId, recordNumber or jobNumber here.
    if (!job?._id) {
      setError("This spectacle job does not contain a valid dispensing job ID.");
      return;
    }

    navigate(`/dispensing/spectacles/${job._id}`);
  };

  const createJob = () => {
    // Same architecture as ContactLensPage: patient selection is handled by NewSpectaclePage.
    navigate("/dispensing/spectacles/new");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 py-5 sm:py-7">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                <Glasses size={13} />
                Dispensing
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Spectacle Jobs
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage spectacle dispensing jobs, patient prescriptions, frames,
                lenses and collection workflow from one dedicated workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadJobs()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button
                type="button"
                onClick={createJob}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600"
              >
                <Plus size={15} />
                New spectacle job
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-6">
          <SummaryItem label="Total" value={summary.total} />
          <SummaryItem label="Draft" value={summary.draft} />
          <SummaryItem label="Ordered" value={summary.ordered} />
          <SummaryItem label="Not Ready" value={summary.notReady} />
          <SummaryItem label="Ready" value={summary.ready} />
          <SummaryItem label="Collected" value={summary.collected} />
        </div>
      </header>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
            aria-label="Close error"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
              placeholder="Search job, patient, patient number, phone, frame or lens..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <div className="relative">
            <Filter
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-11 min-w-[190px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            >
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Dispensing register
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Spectacle orders
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            {filteredJobs.length} record{filteredJobs.length === 1 ? "" : "s"}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[380px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={17} className="animate-spin" />
              Loading spectacle jobs...
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState search={search} onCreate={createJob} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Frame</th>
                  <th className="px-5 py-3">Lens</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Due date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredJobs.map((job) => {
                  const patient = job?.patientId || job?.patient;

                  return (
                    <tr
                      key={job._id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => openJob(job)} className="text-left">
                          <div className="text-sm font-bold text-slate-900 hover:text-violet-700">
                            {recordNumber(job)}
                          </div>
                          <div className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400">
                            {job?._id || "No job ID"}
                          </div>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openPatient(patient)}
                          className="group flex items-center gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-xs font-bold text-violet-700">
                            {patientName(patient)
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((item) => item[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-700">
                              {patientName(patient)}
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {patientNumber(patient) || "No patient number"}
                              {patient?.phone ? ` · ${patient.phone}` : ""}
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {job?.frame?.code || job?.frame?.brand || "—"}
                        </div>
                        <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">
                          {job?.frame?.description || job?.frame?.model || "Frame not recorded"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {job?.lens?.code || job?.lens?.brand || "—"}
                        </div>
                        <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">
                          {job?.lens?.description || job?.lens?.model || job?.lens?.supplier || "Lens not recorded"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {money(total(job))}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {formatDate(job?.dueDate || job?.expectedDate || job?.deliveryDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(job?.status)}`}>
                          {label(job?.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openJob(job)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        >
                          View job
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-400">
              Showing {filteredJobs.length} spectacle job{filteredJobs.length === 1 ? "" : "s"}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                {page}
              </span>

              <button
                type="button"
                disabled={jobs.length < PAGE_SIZE}
                onClick={() => setPage((current) => current + 1)}
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

function SummaryItem({ label: title, value }) {
  return (
    <div className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function EmptyState({ search, onCreate }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Glasses size={25} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {search ? "No spectacle jobs found" : "No spectacle jobs yet"}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {search
          ? "Try another patient name, patient number, job number, frame or lens search."
          : "Create a new spectacle dispensing job to start the workflow."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={14} />
          New spectacle job
        </button>
      )}
    </div>
  );
}
