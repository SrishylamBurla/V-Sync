// import { useEffect, useMemo, useState } from "react";
// import {
//   Boxes,
//   CheckCircle2,
//   Plus,
//   RefreshCw,
//   Search,
//   UserRound,
// } from "lucide-react";
// import { useNavigate, useSearchParams } from "react-router-dom";

// import { getPatients, getPatient } from "../../patients/patient.api";
// import { getSundries } from "../sundries.api";
// import {
//   createSundryJob,
//   getSundryJobs,
//   updateSundryJobStatus,
// } from "../sundryJob.api";

// const statuses = [
//   "ordered",
//   "not_ready",
//   "ready",
//   "notified",
//   "collected",
//   "cancelled",
// ];

// const next = {
//   ordered: "not_ready",
//   not_ready: "ready",
//   ready: "notified",
//   notified: "collected",
// };

// const label = (value) =>
//   String(value || "")
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (character) => character.toUpperCase());

// const patientName = (patient) =>
//   [patient?.firstName, patient?.middleName, patient?.lastName]
//     .filter(Boolean)
//     .join(" ") || "Unknown patient";

// const patientData = (response) =>
//   response?.data?.patient ||
//   response?.data ||
//   response?.patient ||
//   null;

// export default function SundryJobsPage() {
//   const navigate = useNavigate();
//   const [params] = useSearchParams();

//   const patientId = params.get("patientId") || "";
//   const isPatientSpecific = Boolean(patientId);

//   const [jobs, setJobs] = useState([]);
//   const [items, setItems] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [selectedPatient, setSelectedPatient] = useState(null);

//   const [query, setQuery] = useState("");
//   const [status, setStatus] = useState("");

//   const [showCreate, setShowCreate] = useState(isPatientSpecific);

//   const [form, setForm] = useState({
//     patientId,
//     inventoryItemId: "",
//     quantity: 1,
//     discount: 0,
//     dueDate: "",
//     notes: "",
//   });

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const load = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const jobParams = {
//         ...(status ? { status } : {}),
//         ...(patientId ? { patientId } : {}),
//       };

//       const [jobsRes, itemsRes] = await Promise.all([
//         getSundryJobs(jobParams),
//         getSundries({ status: "active" }),
//       ]);

//       setJobs(Array.isArray(jobsRes?.data) ? jobsRes.data : []);
//       setItems(
//         Array.isArray(itemsRes?.data)
//           ? itemsRes.data
//           : Array.isArray(itemsRes)
//             ? itemsRes
//             : [],
//       );
//     } catch (err) {
//       setJobs([]);
//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to load sundry dispensing.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void load();
//   }, [status, patientId]);

//   /*
//    * When this page is opened from Patient Details, resolve the
//    * patient so the create form never shows an empty "Select patient".
//    */
//   useEffect(() => {
//     if (!patientId) {
//       setSelectedPatient(null);
//       return;
//     }

//     let cancelled = false;

//     const loadPatient = async () => {
//       try {
//         const response = await getPatient(patientId);
//         if (!cancelled) {
//           setSelectedPatient(patientData(response));
//         }
//       } catch {
//         if (!cancelled) {
//           setSelectedPatient(null);
//         }
//       }
//     };

//     void loadPatient();

//     return () => {
//       cancelled = true;
//     };
//   }, [patientId]);

//   /*
//    * Global creation mode still supports patient search.
//    * Patient-specific mode deliberately skips this search.
//    */
//   useEffect(() => {
//     if (!showCreate || patientId) return;

//     const timer = setTimeout(async () => {
//       try {
//         const response = await getPatients({
//           search: query,
//           limit: 20,
//         });

//         setPatients(
//           Array.isArray(response?.data) ? response.data : [],
//         );
//       } catch {
//         setPatients([]);
//       }
//     }, 250);

//     return () => clearTimeout(timer);
//   }, [query, showCreate, patientId]);

//   const filtered = useMemo(() => {
//     const search = query.trim().toLowerCase();

//     if (!search) {
//       return jobs;
//     }

//     return jobs.filter((job) =>
//       [
//         job.jobNumber,
//         job.item?.code,
//         job.item?.description,
//         job.item?.brand,
//         job.item?.model,
//         patientName(job.patientId),
//         job.patientId?.patientNumber,
//         job.patientId?.phone,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase()
//         .includes(search),
//     );
//   }, [jobs, query]);

//   const save = async (event) => {
//     event.preventDefault();

//     if (!form.patientId || !form.inventoryItemId) {
//       setError("Patient and sundry item are required.");
//       return;
//     }

//     setSaving(true);
//     setError("");

//     try {
//       await createSundryJob({
//         ...form,
//         quantity: Number(form.quantity),
//         discount: Number(form.discount),
//       });

//       if (isPatientSpecific) {
//         setForm((current) => ({
//           ...current,
//           inventoryItemId: "",
//           quantity: 1,
//           discount: 0,
//           dueDate: "",
//           notes: "",
//         }));
//       } else {
//         setShowCreate(false);
//         setForm({
//           patientId: "",
//           inventoryItemId: "",
//           quantity: 1,
//           discount: 0,
//           dueDate: "",
//           notes: "",
//         });
//       }

//       await load();
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to create sundry job.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const advance = async (job) => {
//     if (!next[job?.status]) return;

//     try {
//       setError("");

//       const response = await updateSundryJobStatus(
//         job._id,
//         next[job.status],
//       );

//       setJobs((rows) =>
//         rows.map((row) =>
//           row._id === job._id ? response?.data || row : row,
//         ),
//       );
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           "Unable to update sundry status.",
//       );
//     }
//   };

//   const openCreate = () => {
//     setShowCreate(true);
//     setError("");
//   };

//   return (
//     <div className="mx-auto w-full max-w-[1600px] space-y-5 py-5 sm:py-7">
//       <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//           <div>
//             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
//               <Boxes size={14} />
//               Dispensing
//             </div>

//             <h1 className="mt-2 text-2xl font-bold text-slate-950">
//               Sundry Jobs
//             </h1>

//             <p className="mt-1 text-sm text-slate-500">
//               {isPatientSpecific
//                 ? "Create and manage sundry dispensing records for this patient."
//                 : "Manage patient-specific sundry dispensing records."}
//             </p>
//           </div>

//           {!isPatientSpecific && (
//             <button
//               type="button"
//               onClick={openCreate}
//               className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white"
//             >
//               <Plus size={15} />
//               New Sundry Job
//             </button>
//           )}
//         </div>
//       </header>

//       {error && (
//         <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {showCreate && (
//         <form
//           onSubmit={save}
//           className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
//         >
//           <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
//             {isPatientSpecific ? (
//               <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
//                 <UserRound size={15} className="shrink-0 text-slate-400" />

//                 <div className="min-w-0">
//                   <div className="truncate font-semibold">
//                     {selectedPatient
//                       ? patientName(selectedPatient)
//                       : "Loading patient..."}
//                   </div>

//                   {selectedPatient?.patientNumber && (
//                     <div className="text-[10px] text-slate-400">
//                       {selectedPatient.patientNumber}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <select
//                 value={form.patientId}
//                 onChange={(event) =>
//                   setForm((current) => ({
//                     ...current,
//                     patientId: event.target.value,
//                   }))
//                 }
//                 className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
//               >
//                 <option value="">Select patient</option>

//                 {patients.map((patient) => (
//                   <option key={patient._id} value={patient._id}>
//                     {patientName(patient)} ·{" "}
//                     {patient.patientNumber || patient.phone || ""}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <select
//               value={form.inventoryItemId}
//               onChange={(event) =>
//                 setForm((current) => ({
//                   ...current,
//                   inventoryItemId: event.target.value,
//                 }))
//               }
//               className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
//             >
//               <option value="">Select sundry</option>

//               {items.map((item) => (
//                 <option key={item._id} value={item._id}>
//                   {item.code || "—"} ·{" "}
//                   {item.description || item.brand || "Sundry"} · ₹
//                   {item.sellingPrice || 0}
//                 </option>
//               ))}
//             </select>

//             <input
//               type="number"
//               min="1"
//               value={form.quantity}
//               onChange={(event) =>
//                 setForm((current) => ({
//                   ...current,
//                   quantity: event.target.value,
//                 }))
//               }
//               className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
//               placeholder="Quantity"
//             />

//             <input
//               type="date"
//               value={form.dueDate}
//               onChange={(event) =>
//                 setForm((current) => ({
//                   ...current,
//                   dueDate: event.target.value,
//                 }))
//               }
//               className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
//             />
//           </div>

//           {!patientId && (
//             <input
//               value={query}
//               onChange={(event) => setQuery(event.target.value)}
//               className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
//               placeholder="Search patient, then select above"
//             />
//           )}

//           <div className="mt-4 flex gap-2">
//             <button
//               type="submit"
//               disabled={saving}
//               className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
//             >
//               {saving ? "Saving..." : "Create Sundry Job"}
//             </button>

//             {!isPatientSpecific && (
//               <button
//                 type="button"
//                 onClick={() => setShowCreate(false)}
//                 className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
//               >
//                 Cancel
//               </button>
//             )}
//           </div>
//         </form>
//       )}

//       <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//         <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
//           <div className="relative flex-1">
//             <Search
//               size={15}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />

//             <input
//               value={query}
//               onChange={(event) => setQuery(event.target.value)}
//               placeholder="Search sundry job, patient or item..."
//               className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
//             />
//           </div>

//           <select
//             value={status}
//             onChange={(event) => setStatus(event.target.value)}
//             className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
//           >
//             <option value="">All statuses</option>

//             {statuses.map((currentStatus) => (
//               <option key={currentStatus} value={currentStatus}>
//                 {label(currentStatus)}
//               </option>
//             ))}
//           </select>

//           <button
//             type="button"
//             onClick={() => void load()}
//             className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold"
//           >
//             <RefreshCw size={14} />
//             Refresh
//           </button>
//         </div>

//         {loading ? (
//           <div className="p-10 text-center text-sm text-slate-400">
//             Loading sundry jobs...
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="p-10 text-center text-sm text-slate-400">
//             {isPatientSpecific
//               ? "No sundry dispensing records found for this patient."
//               : "No sundry dispensing records found."}
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-left">
//               <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
//                 <tr>
//                   <th className="px-5 py-3">Job</th>
//                   <th className="px-5 py-3">Patient</th>
//                   <th className="px-5 py-3">Sundry</th>
//                   <th className="px-5 py-3">Qty</th>
//                   <th className="px-5 py-3">Total</th>
//                   <th className="px-5 py-3">Status</th>
//                   <th className="px-5 py-3">Next</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filtered.map((job) => (
//                   <tr
//                     key={job._id}
//                     className="border-t border-slate-100"
//                   >
//                     <td className="px-5 py-4">
//                       <button
//                         type="button"
//                         onClick={() =>
//                           navigate(`/dispensing/sundries/${job._id}`)
//                         }
//                         className="font-bold text-slate-900 hover:underline"
//                       >
//                         {job.jobNumber}
//                       </button>
//                     </td>

//                     <td className="px-5 py-4">
//                       <button
//                         type="button"
//                         onClick={() =>
//                           navigate(`/patients/${job.patientId?._id}`)
//                         }
//                         className="font-semibold hover:underline"
//                       >
//                         {patientName(job.patientId)}
//                       </button>

//                       <div className="text-[10px] text-slate-400">
//                         {job.patientId?.patientNumber ||
//                           job.patientId?.phone ||
//                           ""}
//                       </div>
//                     </td>

//                     <td className="px-5 py-4">
//                       <div className="font-semibold">
//                         {job.item?.description ||
//                           job.item?.code ||
//                           "Sundry"}
//                       </div>

//                       <div className="text-[10px] text-slate-400">
//                         {job.item?.brand || job.item?.model || ""}
//                       </div>
//                     </td>

//                     <td className="px-5 py-4">{job.quantity}</td>

//                     <td className="px-5 py-4 font-semibold">
//                       ₹{Number(job.total || 0).toLocaleString("en-IN")}
//                     </td>

//                     <td className="px-5 py-4">
//                       <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase">
//                         {label(job.status)}
//                       </span>
//                     </td>

//                     <td className="px-5 py-4">
//                       {next[job.status] ? (
//                         <button
//                           type="button"
//                           onClick={() => void advance(job)}
//                           className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white"
//                         >
//                           <CheckCircle2 size={12} />
//                           {label(next[job.status])}
//                         </button>
//                       ) : (
//                         "—"
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </section>
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

