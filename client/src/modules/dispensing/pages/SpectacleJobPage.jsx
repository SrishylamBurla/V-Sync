// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   Filter,
//   Glasses,
//   Loader2,
//   Plus,
//   RefreshCw,
//   Search,
//   X,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import { getDispensingList } from "../dispensing.api";

// const PAGE_SIZE = 20;

// const STATUSES = [
//   "draft",
//   "ordered",
//   "not_ready",
//   "ready",
//   "notified",
//   "collected",
//   "cancelled",
// ];

// const patientName = (patient) => {
//   if (!patient) return "Unknown patient";
//   if (typeof patient === "string") return patient;

//   return (
//     [patient.firstName, patient.middleName, patient.lastName]
//       .filter(Boolean)
//       .join(" ") || "Unknown patient"
//   );
// };

// const patientId = (patient) => {
//   if (!patient) return "";
//   if (typeof patient === "string") return patient;
//   return patient._id || patient.id || "";
// };

// const patientNumber = (patient) => {
//   if (!patient || typeof patient === "string") return "";
//   return patient.patientNumber || patient.registrationNumber || "";
// };

// const formatDate = (value) => {
//   if (!value) return "—";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "—";

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const label = (value) =>
//   String(value || "")
//     .replaceAll("_", " ")
//     .replaceAll("-", " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());

// const statusClass = (status) => {
//   switch (status) {
//     case "draft":
//       return "bg-slate-100 text-slate-600";
//     case "ordered":
//       return "bg-blue-50 text-blue-700";
//     case "not_ready":
//       return "bg-orange-50 text-orange-700";
//     case "ready":
//       return "bg-amber-50 text-amber-700";
//     case "notified":
//       return "bg-violet-50 text-violet-700";
//     case "collected":
//       return "bg-emerald-50 text-emerald-700";
//     case "cancelled":
//       return "bg-red-50 text-red-700";
//     default:
//       return "bg-slate-100 text-slate-600";
//   }
// };

// const normalizeItemType = (value) => {
//   const type = String(value || "")
//     .toLowerCase()
//     .replaceAll("_", " ")
//     .replaceAll("-", " ")
//     .trim();

//   if (type.includes("contact")) return "contact_lens";
//   if (type.includes("sundry")) return "sundry";
//   return "spectacle";
// };

// const extractRows = (response) => {
//   if (Array.isArray(response)) return response;
//   if (Array.isArray(response?.data)) return response.data;
//   if (Array.isArray(response?.data?.jobs)) return response.data.jobs;
//   if (Array.isArray(response?.data?.dispensing)) return response.data.dispensing;
//   if (Array.isArray(response?.jobs)) return response.jobs;
//   if (Array.isArray(response?.dispensing)) return response.dispensing;
//   return [];
// };

// const recordNumber = (row) =>
//   row?.recordNumber ||
//   row?.jobNumber ||
//   row?.orderNumber ||
//   row?.dispensingNumber ||
//   "Spectacle job";

// const total = (row) => {
//   if (row?.total !== undefined && row?.total !== null) {
//     return Number(row.total || 0);
//   }

//   const frame = Number(row?.frame?.price || 0);
//   const lens = Number(row?.lens?.price || 0);
//   const extras = Array.isArray(row?.extras)
//     ? row.extras.reduce((sum, item) => sum + Number(item?.price || 0), 0)
//     : 0;
//   const discount = Number(row?.discount || 0);

//   return Math.max(0, frame + lens + extras - discount);
// };

// const money = (value) =>
//   `₹${Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// export default function SpectacleJobsPage() {
//   const navigate = useNavigate();

//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("");
//   const [page, setPage] = useState(1);

//   const loadJobs = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const params = { page, limit: PAGE_SIZE };
//       if (status) params.status = status;

//       const response = await getDispensingList(params);
//       const rows = extractRows(response).filter(
//         (row) => normalizeItemType(row?.itemType) === "spectacle",
//       );

//       setJobs(rows);
//     } catch (err) {
//       setJobs([]);
//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to load spectacle jobs.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [page, status]);

//   useEffect(() => {
//     void loadJobs();
//   }, [loadJobs]);

//   useEffect(() => {
//     setPage(1);
//   }, [search, status]);

//   const filteredJobs = useMemo(() => {
//     const query = search.trim().toLowerCase();
//     if (!query) return jobs;

//     return jobs.filter((job) => {
//       const patient = job?.patientId || job?.patient;
//       const searchable = [
//         recordNumber(job),
//         job?._id,
//         patientName(patient),
//         patientNumber(patient),
//         patient?.phone,
//         patient?.mobile,
//         patient?.email,
//         job?.status,
//         job?.brand,
//         job?.model,
//         job?.supplier,
//         job?.frame?.code,
//         job?.frame?.description,
//         job?.frame?.brand,
//         job?.frame?.model,
//         job?.lens?.code,
//         job?.lens?.description,
//         job?.lens?.supplier,
//         job?.lens?.brand,
//         job?.lens?.model,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchable.includes(query);
//     });
//   }, [jobs, search]);

//   const summary = useMemo(
//     () => ({
//       total: jobs.length,
//       draft: jobs.filter((x) => x.status === "draft").length,
//       ordered: jobs.filter((x) => x.status === "ordered").length,
//       notReady: jobs.filter((x) => x.status === "not_ready").length,
//       ready: jobs.filter((x) => x.status === "ready").length,
//       collected: jobs.filter((x) => x.status === "collected").length,
//     }),
//     [jobs],
//   );

//   const openPatient = (patient) => {
//     const id = patientId(patient);
//     if (id) navigate(`/patients/${id}`);
//   };

//   const openJob = (job) => {
//     // Always use the real dispensing document _id.
//     // Never use patientId, recordNumber or jobNumber here.
//     if (!job?._id) {
//       setError("This spectacle job does not contain a valid dispensing job ID.");
//       return;
//     }

//     navigate(`/dispensing/spectacles/${job._id}`);
//   };

//   const createJob = () => {
//     // Same architecture as ContactLensPage: patient selection is handled by NewSpectaclePage.
//     navigate("/dispensing/spectacles/new");
//   };

//   return (
//     <div className="mx-auto w-full max-w-[1600px] space-y-6 py-5 sm:py-7">
//       <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//         <div className="bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 sm:p-7">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
//             <div>
//               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
//                 <Glasses size={13} />
//                 Dispensing
//               </div>

//               <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
//                 Spectacle Jobs
//               </h1>

//               <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
//                 Manage spectacle dispensing jobs, patient prescriptions, frames,
//                 lenses and collection workflow from one dedicated workspace.
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <button
//                 type="button"
//                 onClick={() => void loadJobs()}
//                 disabled={loading}
//                 className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
//                 Refresh
//               </button>

//               <button
//                 type="button"
//                 onClick={createJob}
//                 className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600"
//               >
//                 <Plus size={15} />
//                 New spectacle job
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-6">
//           <SummaryItem label="Total" value={summary.total} />
//           <SummaryItem label="Draft" value={summary.draft} />
//           <SummaryItem label="Ordered" value={summary.ordered} />
//           <SummaryItem label="Not Ready" value={summary.notReady} />
//           <SummaryItem label="Ready" value={summary.ready} />
//           <SummaryItem label="Collected" value={summary.collected} />
//         </div>
//       </header>

//       {error && (
//         <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           <div>{error}</div>
//           <button
//             type="button"
//             onClick={() => setError("")}
//             className="rounded-lg p-1 hover:bg-red-100"
//             aria-label="Close error"
//           >
//             <X size={15} />
//           </button>
//         </div>
//       )}

//       <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//         <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
//           <div className="relative flex-1">
//             <Search
//               size={17}
//               className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />
//             <input
//               value={search}
//               onChange={(event) => setSearch(event.target.value)}
//               placeholder="Search job, patient, patient number, phone, frame or lens..."
//               className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
//             />
//           </div>

//           <div className="relative">
//             <Filter
//               size={15}
//               className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />
//             <select
//               value={status}
//               onChange={(event) => {
//                 setStatus(event.target.value);
//                 setPage(1);
//               }}
//               className="h-11 min-w-[190px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
//             >
//               <option value="">All statuses</option>
//               {STATUSES.map((item) => (
//                 <option key={item} value={item}>
//                   {label(item)}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </section>

//       <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//         <header className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
//           <div>
//             <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
//               Dispensing register
//             </div>
//             <h2 className="mt-1 text-xl font-bold text-slate-900">
//               Spectacle orders
//             </h2>
//           </div>
//           <div className="text-xs text-slate-500">
//             {filteredJobs.length} record{filteredJobs.length === 1 ? "" : "s"}
//           </div>
//         </header>

//         {loading ? (
//           <div className="flex min-h-[380px] items-center justify-center">
//             <div className="flex items-center gap-2 text-sm text-slate-400">
//               <Loader2 size={17} className="animate-spin" />
//               Loading spectacle jobs...
//             </div>
//           </div>
//         ) : filteredJobs.length === 0 ? (
//           <EmptyState search={search} onCreate={createJob} />
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1200px] text-left">
//               <thead>
//                 <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
//                   <th className="px-5 py-3">Job</th>
//                   <th className="px-5 py-3">Patient</th>
//                   <th className="px-5 py-3">Frame</th>
//                   <th className="px-5 py-3">Lens</th>
//                   <th className="px-5 py-3">Total</th>
//                   <th className="px-5 py-3">Due date</th>
//                   <th className="px-5 py-3">Status</th>
//                   <th className="px-5 py-3 text-right">Action</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredJobs.map((job) => {
//                   const patient = job?.patientId || job?.patient;

//                   return (
//                     <tr
//                       key={job._id}
//                       className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
//                     >
//                       <td className="px-5 py-4">
//                         <button type="button" onClick={() => openJob(job)} className="text-left">
//                           <div className="text-sm font-bold text-slate-900 hover:text-violet-700">
//                             {recordNumber(job)}
//                           </div>
//                           <div className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400">
//                             {job?._id || "No job ID"}
//                           </div>
//                         </button>
//                       </td>

//                       <td className="px-5 py-4">
//                         <button
//                           type="button"
//                           onClick={() => openPatient(patient)}
//                           className="group flex items-center gap-3 text-left"
//                         >
//                           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-xs font-bold text-violet-700">
//                             {patientName(patient)
//                               .split(" ")
//                               .filter(Boolean)
//                               .slice(0, 2)
//                               .map((item) => item[0])
//                               .join("")
//                               .toUpperCase()}
//                           </div>
//                           <div className="min-w-0">
//                             <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-700">
//                               {patientName(patient)}
//                             </div>
//                             <div className="mt-0.5 text-[10px] text-slate-400">
//                               {patientNumber(patient) || "No patient number"}
//                               {patient?.phone ? ` · ${patient.phone}` : ""}
//                             </div>
//                           </div>
//                         </button>
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="text-sm font-semibold text-slate-800">
//                           {job?.frame?.code || job?.frame?.brand || "—"}
//                         </div>
//                         <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">
//                           {job?.frame?.description || job?.frame?.model || "Frame not recorded"}
//                         </div>
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="text-sm font-semibold text-slate-800">
//                           {job?.lens?.code || job?.lens?.brand || "—"}
//                         </div>
//                         <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">
//                           {job?.lens?.description || job?.lens?.model || job?.lens?.supplier || "Lens not recorded"}
//                         </div>
//                       </td>

//                       <td className="px-5 py-4 text-sm font-semibold text-slate-700">
//                         {money(total(job))}
//                       </td>

//                       <td className="px-5 py-4 text-xs font-medium text-slate-600">
//                         {formatDate(job?.dueDate || job?.expectedDate || job?.deliveryDate)}
//                       </td>

//                       <td className="px-5 py-4">
//                         <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(job?.status)}`}>
//                           {label(job?.status)}
//                         </span>
//                       </td>

//                       <td className="px-5 py-4 text-right">
//                         <button
//                           type="button"
//                           onClick={() => openJob(job)}
//                           className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
//                         >
//                           View job
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {!loading && (
//           <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
//             <div className="text-xs text-slate-400">
//               Showing {filteredJobs.length} spectacle job{filteredJobs.length === 1 ? "" : "s"}
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 disabled={page <= 1}
//                 onClick={() => setPage((current) => Math.max(1, current - 1))}
//                 className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Previous
//               </button>

//               <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
//                 {page}
//               </span>

//               <button
//                 type="button"
//                 disabled={jobs.length < PAGE_SIZE}
//                 onClick={() => setPage((current) => current + 1)}
//                 className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Next
//               </button>
//             </div>
//           </footer>
//         )}
//       </section>
//     </div>
//   );
// }

// function SummaryItem({ label: title, value }) {
//   return (
//     <div className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
//       <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
//         {title}
//       </div>
//       <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
//     </div>
//   );
// }

// function EmptyState({ search, onCreate }) {
//   return (
//     <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
//       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
//         <Glasses size={25} />
//       </div>

//       <h3 className="mt-4 text-sm font-bold text-slate-800">
//         {search ? "No spectacle jobs found" : "No spectacle jobs yet"}
//       </h3>

//       <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
//         {search
//           ? "Try another patient name, patient number, job number, frame or lens search."
//           : "Create a new spectacle dispensing job to start the workflow."}
//       </p>

//       {!search && (
//         <button
//           type="button"
//           onClick={onCreate}
//           className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
//         >
//           <Plus size={14} />
//           New spectacle job
//         </button>
//       )}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getPatients, getPatient } from "../../patients/patient.api";
import { getSundries } from "../sundries.api";
import {
  createSundryJob,
  getSundryJobs,
  updateSundryJobStatus,
} from "../sundryJob.api";

const statuses = [
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const next = {
  ordered: "not_ready",
  not_ready: "ready",
  ready: "notified",
  notified: "collected",
};

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const patientData = (response) =>
  response?.data?.patient ||
  response?.data ||
  response?.patient ||
  null;

const patientListData = (response) => {
  if (Array.isArray(response?.data?.patients)) {
    return response.data.patients;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.patients)) {
    return response.patients;
  }

  return [];
};

export default function SundryJobsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const patientId = params.get("patientId") || "";
  const isPatientSpecific = Boolean(patientId);

  const [jobs, setJobs] = useState([]);
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patientQuery, setPatientQuery] = useState("");
  const [jobQuery, setJobQuery] = useState("");

  const [status, setStatus] = useState("");

  const [patientSelectorOpen, setPatientSelectorOpen] = useState(false);

  const [showCreate, setShowCreate] = useState(isPatientSpecific);

  const [form, setForm] = useState({
    patientId,
    inventoryItemId: "",
    quantity: 1,
    discount: 0,
    dueDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /*
   * Keep form patient ID synchronized with URL patientId.
   */
  useEffect(() => {
    setForm((current) => ({
      ...current,
      patientId,
    }));
  }, [patientId]);

  /*
   * Load sundry jobs and sundry inventory.
   */
  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const jobParams = {
        ...(status ? { status } : {}),
        ...(patientId ? { patientId } : {}),
      };

      const [jobsRes, itemsRes] = await Promise.all([
        getSundryJobs(jobParams),
        getSundries({ status: "active" }),
      ]);

      setJobs(
        Array.isArray(jobsRes?.data)
          ? jobsRes.data
          : []
      );

      setItems(
        Array.isArray(itemsRes?.data)
          ? itemsRes.data
          : Array.isArray(itemsRes)
            ? itemsRes
            : []
      );
    } catch (err) {
      console.error("Unable to load sundry jobs:", err);

      setJobs([]);
      setItems([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load sundry dispensing."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status, patientId]);

  /*
   * Patient-specific mode:
   * Load the patient from the URL.
   */
  useEffect(() => {
    if (!patientId) {
      setSelectedPatient(null);
      return;
    }

    let cancelled = false;

    const loadPatient = async () => {
      try {
        const response = await getPatient(patientId);

        if (!cancelled) {
          const patient = patientData(response);

          setSelectedPatient(patient);

          setForm((current) => ({
            ...current,
            patientId,
          }));
        }
      } catch (err) {
        console.error("Unable to load patient:", err);

        if (!cancelled) {
          setSelectedPatient(null);
        }
      }
    };

    void loadPatient();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  /*
   * Global patient search.
   *
   * Backend response:
   *
   * {
   *   success: true,
   *   data: {
   *     patients: [],
   *     pagination: {}
   *   }
   * }
   */
  useEffect(() => {
    if (!showCreate || patientId) {
      setPatients([]);
      setPatientsLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setPatientsLoading(true);

      try {
        const response = await getPatients({
          page: 1,
          limit: 20,
          search: patientQuery.trim(),
          status: "active",
        });

        if (!cancelled) {
          setPatients(patientListData(response));
        }
      } catch (err) {
        console.error("Unable to load patients:", err);

        if (!cancelled) {
          setPatients([]);
        }
      } finally {
        if (!cancelled) {
          setPatientsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [patientQuery, showCreate, patientId]);

  /*
   * Filter existing sundry jobs.
   */
  const filtered = useMemo(() => {
    const search = jobQuery.trim().toLowerCase();

    if (!search) {
      return jobs;
    }

    return jobs.filter((job) =>
      [
        job.jobNumber,
        job.item?.code,
        job.item?.description,
        job.item?.brand,
        job.item?.model,
        patientName(job.patientId),
        job.patientId?.patientNumber,
        job.patientId?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [jobs, jobQuery]);

  /*
   * Select patient from search results.
   */
  const selectPatient = (patient) => {
    setSelectedPatient(patient);

    setForm((current) => ({
      ...current,
      patientId: patient?._id || "",
    }));

    setPatientQuery("");
    setPatientSelectorOpen(false);
    setError("");
  };

  /*
   * Clear selected patient.
   */
  const clearPatient = () => {
    setSelectedPatient(null);

    setForm((current) => ({
      ...current,
      patientId: "",
    }));

    setPatientQuery("");
    setPatientSelectorOpen(true);
  };

  /*
   * Create sundry job.
   */
  const save = async (event) => {
    event.preventDefault();

    if (!form.patientId) {
      setError("Please select a patient.");
      return;
    }

    if (!form.inventoryItemId) {
      setError("Please select a sundry item.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createSundryJob({
        ...form,
        quantity: Number(form.quantity),
        discount: Number(form.discount),
      });

      if (isPatientSpecific) {
        setForm((current) => ({
          ...current,
          inventoryItemId: "",
          quantity: 1,
          discount: 0,
          dueDate: "",
          notes: "",
        }));
      } else {
        setShowCreate(false);

        setSelectedPatient(null);
        setPatientQuery("");

        setForm({
          patientId: "",
          inventoryItemId: "",
          quantity: 1,
          discount: 0,
          dueDate: "",
          notes: "",
        });
      }

      await load();
    } catch (err) {
      console.error("Unable to create sundry job:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create sundry job."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Advance job status.
   */
  const advance = async (job) => {
    if (!next[job?.status]) {
      return;
    }

    try {
      setError("");

      const response = await updateSundryJobStatus(
        job._id,
        next[job.status]
      );

      setJobs((rows) =>
        rows.map((row) =>
          row._id === job._id
            ? response?.data || row
            : row
        )
      );
    } catch (err) {
      console.error("Unable to update sundry status:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to update sundry status."
      );
    }
  };

  /*
   * Open new job form.
   */
  const openCreate = () => {
    setShowCreate(true);
    setError("");
    setPatientSelectorOpen(true);
  };

  /*
   * Close creation form.
   */
  const closeCreate = () => {
    if (isPatientSpecific) {
      return;
    }

    setShowCreate(false);
    setPatientSelectorOpen(false);
    setError("");

    setSelectedPatient(null);
    setPatientQuery("");

    setForm({
      patientId: "",
      inventoryItemId: "",
      quantity: 1,
      discount: 0,
      dueDate: "",
      notes: "",
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 py-5 sm:py-7">
      {/* Header */}
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
              <Boxes size={14} />
              Dispensing
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Sundry Jobs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {isPatientSpecific
                ? "Create and manage sundry dispensing records for this patient."
                : "Manage patient-specific sundry dispensing records."}
            </p>
          </div>

          {!isPatientSpecific && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus size={15} />
              New Sundry Job
            </button>
          )}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={save}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                New Sundry Job
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Select a patient and sundry item to create a dispensing job.
              </p>
            </div>

            {!isPatientSpecific && (
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Patient */}
            <div className="relative">
              {isPatientSpecific ? (
                <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <UserRound
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-700">
                      {selectedPatient
                        ? patientName(selectedPatient)
                        : "Loading patient..."}
                    </div>

                    {selectedPatient?.patientNumber && (
                      <div className="text-[10px] text-slate-400">
                        {selectedPatient.patientNumber}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {selectedPatient ? (
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3">
                      <UserRound
                        size={15}
                        className="shrink-0 text-violet-500"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">
                          {patientName(selectedPatient)}
                        </div>

                        <div className="truncate text-[10px] text-slate-500">
                          {selectedPatient.patientNumber ||
                            selectedPatient.phone ||
                            ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={clearPatient}
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setPatientSelectorOpen((current) => !current)
                      }
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-500 transition hover:border-slate-300"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <UserRound
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span>Select patient</span>
                      </span>

                      <ChevronDown
                        size={15}
                        className="shrink-0 text-slate-400"
                      />
                    </button>
                  )}

                  {patientSelectorOpen && !selectedPatient && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 p-2">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            autoFocus
                            value={patientQuery}
                            onChange={(event) =>
                              setPatientQuery(event.target.value)
                            }
                            placeholder="Search patient..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto">
                        {patientsLoading ? (
                          <div className="p-5 text-center text-xs text-slate-400">
                            Searching patients...
                          </div>
                        ) : patients.length === 0 ? (
                          <div className="p-5 text-center">
                            <UserRound
                              size={20}
                              className="mx-auto text-slate-300"
                            />

                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              No patients found
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              Try name, phone or patient number.
                            </p>
                          </div>
                        ) : (
                          patients.map((patient) => (
                            <button
                              key={patient._id}
                              type="button"
                              onClick={() => selectPatient(patient)}
                              className="flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-violet-50"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <UserRound size={14} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-slate-800">
                                  {patientName(patient)}
                                </div>

                                <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                  {patient.patientNumber ||
                                    patient.phone ||
                                    patient.email ||
                                    "Patient"}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sundry */}
            <select
              value={form.inventoryItemId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  inventoryItemId: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">Select sundry</option>

              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.code || "—"} ·{" "}
                  {item.description ||
                    item.brand ||
                    "Sundry"}{" "}
                  · ₹{item.sellingPrice || 0}
                </option>
              ))}
            </select>

            {/* Quantity */}
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Quantity"
            />

            {/* Due date */}
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Notes */}
          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            rows={2}
            placeholder="Notes (optional)"
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Sundry Job"}
            </button>

            {!isPatientSpecific && (
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Jobs */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          {/* Job search */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={jobQuery}
              onChange={(event) =>
                setJobQuery(event.target.value)
              }
              placeholder="Search sundry job, patient or item..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">All statuses</option>

            {statuses.map((currentStatus) => (
              <option
                key={currentStatus}
                value={currentStatus}
              >
                {label(currentStatus)}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold transition hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading sundry jobs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Boxes
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              {jobQuery
                ? "No matching sundry jobs found."
                : isPatientSpecific
                  ? "No sundry dispensing records found for this patient."
                  : "No sundry dispensing records found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">
                    Job
                  </th>

                  <th className="px-5 py-3">
                    Patient
                  </th>

                  <th className="px-5 py-3">
                    Sundry
                  </th>

                  <th className="px-5 py-3">
                    Qty
                  </th>

                  <th className="px-5 py-3">
                    Total
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Next
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((job) => (
                  <tr
                    key={job._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/60"
                  >
                    {/* Job */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dispensing/sundries/${job._id}`
                          )
                        }
                        className="font-bold text-slate-900 hover:text-violet-600 hover:underline"
                      >
                        {job.jobNumber}
                      </button>

                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {job.jobDate
                          ? new Date(
                              job.jobDate
                            ).toLocaleDateString("en-IN")
                          : ""}
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/patients/${job.patientId?._id}`
                          )
                        }
                        className="font-semibold hover:text-violet-600 hover:underline"
                      >
                        {patientName(job.patientId)}
                      </button>

                      <div className="text-[10px] text-slate-400">
                        {job.patientId?.patientNumber ||
                          job.patientId?.phone ||
                          ""}
                      </div>
                    </td>

                    {/* Sundry */}
                    <td className="px-5 py-4">
                      <div className="font-semibold">
                        {job.item?.description ||
                          job.item?.code ||
                          "Sundry"}
                      </div>

                      <div className="text-[10px] text-slate-400">
                        {job.item?.brand ||
                          job.item?.model ||
                          ""}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-4">
                      {job.quantity}
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 font-semibold">
                      ₹
                      {Number(
                        job.total || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                          job.status === "collected"
                            ? "bg-emerald-100 text-emerald-700"
                            : job.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : job.status === "ready"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        {label(job.status)}
                      </span>
                    </td>

                    {/* Next */}
                    <td className="px-5 py-4">
                      {next[job.status] ? (
                        <button
                          type="button"
                          onClick={() =>
                            void advance(job)
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-800"
                        >
                          <CheckCircle2 size={12} />
                          {label(next[job.status])}
                        </button>
                      ) : (
                        <span className="text-slate-300">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

