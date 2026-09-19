// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   ContactRound,
//   ExternalLink,
//   Glasses,
//   PackageCheck,
//   Plus,
//   RefreshCw,
//   Search,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import { getDispensingList } from "../spectacle.api";
// import { getContactLenses } from "../../contactLenses/contactLens.api";

// const statuses = ["draft", "ordered", "not_ready", "ready", "notified", "collected", "cancelled"];

// const label = (value) =>
//   String(value || "")
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (character) => character.toUpperCase());

// const patientName = (patient) =>
//   [patient?.firstName, patient?.middleName, patient?.lastName]
//     .filter(Boolean)
//     .join(" ") || "Unknown patient";

// const money = (value) =>
//   Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// export default function OpticalManagementPage() {
//   const navigate = useNavigate();
//   const [jobs, setJobs] = useState([]);
//   const [contactOrders, setContactOrders] = useState([]);
//   const [query, setQuery] = useState("");
//   const [status, setStatus] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const [dispensingResult, contactResult] = await Promise.allSettled([
//         getDispensingList(status ? { status } : {}),
//         getContactLenses(status ? { status } : {}),
//       ]);

//       const dispensingResponse = dispensingResult.status === "fulfilled" ? dispensingResult.value : null;
//       const contactResponse = contactResult.status === "fulfilled" ? contactResult.value : null;

//       setJobs(dispensingResponse?.data || []);
//       setContactOrders(contactResponse?.data || []);

//       const failures = [dispensingResult, contactResult].filter((result) => result.status === "rejected");
//       if (failures.length) {
//         setError(failures[0].reason?.response?.data?.message || failures[0].reason?.message || "Some optical records could not be loaded.");
//       }
//     } catch (requestError) {
//       setError(
//         requestError?.response?.data?.message ||
//           requestError?.message ||
//           "Unable to load the optical workspace.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [status]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   const spectacleJobs = useMemo(
//     () => jobs,
//     [jobs],
//   );

//   const filteredSpectacles = useMemo(() => filterRows(spectacleJobs, query), [spectacleJobs, query]);
//   const filteredContacts = useMemo(() => filterRows(contactOrders, query), [contactOrders, query]);

//   const totalOpen = jobs.filter((job) => !["collected", "cancelled"].includes(job.status)).length;
//   const ready = jobs.filter((job) => job.status === "ready").length;
//   const collected = jobs.filter((job) => job.status === "collected").length;

//   return (
//     <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-5 sm:py-7">
//       <div className="mx-auto max-w-[1600px] px-3 sm:px-5 lg:px-7">
//         <header className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
//           <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
//             <div>
//               <div className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-600">Optical workspace</div>
//               <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Optical Management</h1>
//               <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Manage spectacle jobs, contact lens dispensing and optical production. Clinical consultations remain in Clinical Management.</p>
//             </div>
//             <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500">OPTICAL</div>
//           </div>
//         </header>
//       actions={
//         <>
//           <button
//             type="button"
//             onClick={load}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
//           >
//             <RefreshCw size={14} /> Refresh
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate("/optical/contact-lenses/new")}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
//           >
//             <ContactRound size={14} /> Contact lens order
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate("/patients") }
//             className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
//           >
//             <Plus size={14} /> Select patient for spectacle job
//           </button>
//         </>
//       }
    
//       {error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{error}</div>}

//       <Section number="01" title="Optical overview">
//         <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//           <Metric icon={Glasses} label="Open jobs" value={totalOpen} />
//           <Metric icon={PackageCheck} label="Ready" value={ready} />
//           <Metric icon={ContactRound} label="Contact lens orders" value={contactOrders.length} />
//           <Metric icon={Glasses} label="Collected" value={collected} />
//         </div>

//       </Section>

//       <Section number="02" title="Spectacle jobs" description="Production jobs remain separate from the clinical consultation record.">
//         <div className="mb-5 flex flex-col gap-3 sm:flex-row">
//           <div className="relative flex-1">
//             <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               value={query}
//               onChange={(event) => setQuery(event.target.value)}
//               placeholder="Search job, patient, phone, frame or lens..."
//               className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
//             />
//           </div>
//           <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
//             <option value="">All statuses</option>
//             {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
//           </select>
//         </div>

//         {loading ? <LoadingState /> : (
//           <Table
//             rows={filteredSpectacles}
//             empty="No spectacle jobs found."
//             columns={[
//               { key: "job", label: "Job", render: (row) => <button type="button" onClick={() => navigate(`/optical/spectacles/${row._id}`)} className="font-semibold text-slate-900 hover:text-blue-700">{row.recordNumber}</button> },
//               { key: "patient", label: "Patient", render: (row) => <button type="button" onClick={() => navigate(`/patients/${row.patientId?._id}`)} className="text-left"><span className="block font-semibold text-slate-800">{patientName(row.patientId)}</span><span className="text-[10px] text-slate-400">{row.patientId?.patientNumber || "—"}</span></button> },
//               { key: "frame", label: "Frame", render: (row) => row.frame?.code || row.frameItemId?.code || "—" },
//               { key: "lens", label: "Lens", render: (row) => row.lens?.code || row.lensItemId?.code || "—" },
//               { key: "due", label: "Due", render: (row) => formatDate(row.dueDate || row.specDueDate || row.labDueDate) },
//               { key: "total", label: "Total", align: "right", render: (row) => `₹${money(row.amount)}` },
//               { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
//             ]}
//           />
//         )}
//       </Section>

//       <Section number="03" title="Contact lens orders" description="Contact lens dispensing remains its own optical workflow and record type.">
//         <Table
//           rows={filteredContacts}
//           empty="No contact lens orders found."
//           columns={[
//             { key: "order", label: "Order", render: (row) => <button type="button" onClick={() => navigate(`/optical/contact-lenses/${row._id}`)} className="font-semibold text-slate-900 hover:text-blue-700">{row.orderNumber}</button> },
//             { key: "patient", label: "Patient", render: (row) => patientName(row.patientId) },
//             { key: "lens", label: "Lens", render: (row) => `${row.brand || "—"}${row.model ? ` · ${row.model}` : ""}` },
//             { key: "qty", label: "Qty", render: (row) => row.quantity || 1 },
//             { key: "total", label: "Total", align: "right", render: (row) => `₹${money(row.total)}` },
//             { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
//           ]}
//         />
//       </Section>

//       <Section number="04" title="Optical workflows">
//         <div className="grid gap-3 sm:grid-cols-3">
//           <WorkflowCard icon={Glasses} title="Spectacle dispensing" description="Create a spectacle job from the patient record." onClick={() => navigate("/patients")} />
//           <WorkflowCard icon={ContactRound} title="Contact lenses" description="Create or review contact lens orders and fitting." onClick={() => navigate("/optical/contact-lenses")} />
//           <WorkflowCard icon={PackageCheck} title="Dispensing queue" description="Move optical jobs through order, ready and collection stages." onClick={() => navigate("/dispensing")} />
//         </div>
//       </Section>
//       </div>
//     </div>
//   );
// }

// function filterRows(rows, query) {
//   const term = query.trim().toLowerCase();
//   if (!term) return rows;
//   return rows.filter((row) => [row.recordNumber, row.jobNumber, row.orderNumber, patientName(row.patientId), row.patientId?.patientNumber, row.patientId?.phone, row.brand, row.model, row.frame?.code, row.lens?.code].filter(Boolean).join(" ").toLowerCase().includes(term));
// }

// function formatDate(value) {
//   if (!value) return "—";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "—";
//   return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
// }

// function Metric({ icon: Icon, label: title, value }) {
//   return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-400"><Icon size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">{title}</span></div><div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div></div>;
// }

// function StatusBadge({ value }) {
//   return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{label(value)}</span>;
// }

// function WorkflowCard({ icon: Icon, title, description, onClick }) {
//   return <button type="button" onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon size={16} /></span><span className="mt-3 block text-xs font-bold text-slate-800">{title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-400">{description}</span><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 group-hover:text-slate-900">Open <ExternalLink size={11} /></span></button>;
// }

// function LoadingState() {
//   return <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"><RefreshCw size={14} className="animate-spin" />Loading optical records...</div>;
// }

// function Section({ number, title, description, children }) {
//   return (
//     <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//       <div className="border-b border-slate-200 px-5 py-4">
//         <div className="flex items-center gap-2">
//           {number && <span className="text-[10px] font-bold text-emerald-600">{number}</span>}
//           <h2 className="text-sm font-bold text-slate-900">{title}</h2>
//         </div>
//         {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
//       </div>
//       <div className="p-4 sm:p-5">{children}</div>
//     </section>
//   );
// }

// function Table({ rows, columns, empty }) {
//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[900px] text-left text-xs">
//         <thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
//           {columns.map((column) => <th key={column.key} className={`px-3 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>{column.label}</th>)}
//         </tr></thead>
//         <tbody>
//           {rows.length ? rows.map((row, index) => <tr key={row._id || row.id || index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">{columns.map((column) => <td key={column.key} className={`px-3 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>) : <tr><td colSpan={columns.length} className="py-14 text-center text-xs text-slate-400">{empty}</td></tr>}
//         </tbody>
//       </table>
//     </div>
//   );
// }


import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ContactRound,
  ExternalLink,
  Glasses,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDispensingList } from "../spectacle.api";
import { getContactLenses } from "../../contactLenses/contactLens.api";

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

  const spectacleJobs = useMemo(
    () => jobs,
    [jobs],
  );

  const filteredSpectacles = useMemo(() => filterRows(spectacleJobs, query), [spectacleJobs, query]);
  const filteredContacts = useMemo(() => filterRows(contactOrders, query), [contactOrders, query]);

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
                onClick={() => navigate("/patients")}
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

      <Section number="02" title="Spectacle jobs" description="Production jobs remain separate from the clinical consultation record.">
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
              { key: "job", label: "Job", render: (row) => <button type="button" onClick={() => navigate(`/optical/spectacles/${row._id}`)} className="font-semibold text-slate-900 hover:text-blue-700">{row.recordNumber}</button> },
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

      <Section number="03" title="Contact lens orders" description="Contact lens dispensing remains its own optical workflow and record type.">
        <Table
          rows={filteredContacts}
          empty="No contact lens orders found."
          columns={[
            { key: "order", label: "Order", render: (row) => <button type="button" onClick={() => navigate(`/optical/contact-lenses/${row._id}`)} className="font-semibold text-slate-900 hover:text-blue-700">{row.orderNumber}</button> },
            { key: "patient", label: "Patient", render: (row) => patientName(row.patientId) },
            { key: "lens", label: "Lens", render: (row) => `${row.brand || "—"}${row.model ? ` · ${row.model}` : ""}` },
            { key: "qty", label: "Qty", render: (row) => row.quantity || 1 },
            { key: "total", label: "Total", align: "right", render: (row) => `₹${money(row.total)}` },
            { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
          ]}
        />
      </Section>

      <Section number="04" title="Optical workflows">
        <div className="grid gap-3 sm:grid-cols-3">
          <WorkflowCard icon={Glasses} title="Spectacle dispensing" description="Create a spectacle job from the patient record." onClick={() => navigate("/patients")} />
          <WorkflowCard icon={ContactRound} title="Contact lenses" description="Create or review contact lens orders and fitting." onClick={() => navigate("/optical/contact-lenses")} />
          <WorkflowCard icon={PackageCheck} title="Dispensing queue" description="Move optical jobs through order, ready and collection stages." onClick={() => navigate("/dispensing")} />
        </div>
      </Section>
      </div>
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
