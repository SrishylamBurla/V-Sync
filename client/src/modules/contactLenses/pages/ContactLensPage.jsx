// import { useEffect, useMemo, useState } from "react";
// import { Plus, Search, RefreshCw } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import { getContactLenses } from "../contactLens.api";

// import {
//   DocumentShell,
//   Section,
//   Table,
// } from "../../../components/common/DocumentUI";

// const name = (p) =>
//   [p?.firstName, p?.middleName, p?.lastName]
//     .filter(Boolean)
//     .join(" ") || "Unknown patient";

// const statuses = [
//   "draft",
//   "ordered",
//   "ready",
//   "notified",
//   "collected",
//   "cancelled",
// ];

// const label = (value) =>
//   String(value || "")
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (c) => c.toUpperCase());

// export default function ContactLensPage() {
//   const nav = useNavigate();

//   const [rows, setRows] = useState([]);
//   const [q, setQ] = useState("");
//   const [status, setStatus] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const load = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const response = await getContactLenses(
//         status ? { status } : {},
//       );

//       setRows(response?.data || []);
//     } catch (e) {
//       setError(
//         e?.response?.data?.message ||
//           e?.message ||
//           "Unable to load contact lens orders",
//       );
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, [status]);

//   const filtered = useMemo(() => {
//     const search = q.trim().toLowerCase();

//     if (!search) return rows;

//     return rows.filter((x) => {
//       const searchable = [
//         x?.orderNumber,
//         name(x?.patientId),
//         x?.patientId?.patientNumber,
//         x?.patientId?.phone,
//         x?.patientId?.mobile,
//         x?.brand,
//         x?.model,
//         x?.orderType,
//         x?.status,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchable.includes(search);
//     });
//   }, [rows, q]);

//   const counts = useMemo(() => {
//     return Object.fromEntries(
//       statuses.map((s) => [
//         s,
//         rows.filter((row) => row?.status === s).length,
//       ]),
//     );
//   }, [rows]);

//   return (
//     <DocumentShell
//       eyebrow="Dispensing workspace"
//       title="Contact Lens Jobs"
//       subtitle="Manage contact lens orders from creation through collection."
//       code="CONTACT LENS"
//       actions={
//         <div className="flex flex-wrap items-center gap-2">
//           <button
//             type="button"
//             onClick={load}
//             disabled={loading}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             <RefreshCw
//               size={14}
//               className={loading ? "animate-spin" : ""}
//             />
//             Refresh
//           </button>

//           <button
//             type="button"
//             onClick={() =>
//               nav("/dispensing/contact-lenses/new")
//             }
//             className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
//           >
//             <Plus size={14} />
//             New contact lens job
//           </button>
//         </div>
//       }
//     >
//       {error && (
//         <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {/* =========================
//           01 — JOB REGISTER
//       ========================== */}
//       <Section
//         number="01"
//         title="Contact lens job register"
//         description="View and manage contact lens dispensing jobs for your practice."
//       >
//         <div className="mb-5 grid gap-3 md:grid-cols-[1fr_190px]">
//           <div className="relative">
//             <Search
//               size={15}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />

//             <input
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               placeholder="Search job, patient, phone, brand or model..."
//               className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
//             />
//           </div>

//           <select
//             value={status}
//             onChange={(e) => setStatus(e.target.value)}
//             className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
//           >
//             <option value="">All statuses</option>

//             {statuses.map((s) => (
//               <option key={s} value={s}>
//                 {label(s)}
//               </option>
//             ))}
//           </select>
//         </div>

//         {loading ? (
//           <div className="py-12 text-center text-sm text-slate-400">
//             Loading contact lens jobs...
//           </div>
//         ) : (
//           <Table
//             columns={[
//               {
//                 key: "order",
//                 label: "Job",
//                 render: (r) => (
//                   <button
//                     type="button"
//                     onClick={() =>
//                       nav(
//                         `/dispensing/contact-lenses/${r?._id}`,
//                       )
//                     }
//                     className="font-semibold text-slate-900 hover:underline"
//                   >
//                     {r?.orderNumber || "—"}
//                   </button>
//                 ),
//               },

//               {
//                 key: "patient",
//                 label: "Patient",
//                 render: (r) => {
//                   const patientId = r?.patientId?._id;

//                   return patientId ? (
//                     <button
//                       type="button"
//                       onClick={() =>
//                         nav(`/patients/${patientId}`)
//                       }
//                       className="text-left"
//                     >
//                       <span className="block font-semibold text-slate-800 hover:underline">
//                         {name(r?.patientId)}
//                       </span>

//                       <span className="text-[10px] text-slate-400">
//                         {r?.patientId?.patientNumber || "No patient number"}
//                         {r?.patientId?.phone
//                           ? ` · ${r.patientId.phone}`
//                           : ""}
//                       </span>
//                     </button>
//                   ) : (
//                     <div>
//                       <span className="block font-semibold text-slate-800">
//                         {name(r?.patientId)}
//                       </span>

//                       <span className="text-[10px] text-slate-400">
//                         No patient information
//                       </span>
//                     </div>
//                   );
//                 },
//               },

//               {
//                 key: "type",
//                 label: "Type",
//                 render: (r) => (
//                   <span className="text-xs text-slate-600">
//                     {label(r?.orderType)}
//                   </span>
//                 ),
//               },

//               {
//                 key: "lens",
//                 label: "Lens",
//                 render: (r) => (
//                   <div>
//                     <span className="block font-medium text-slate-700">
//                       {r?.brand || "—"}
//                     </span>

//                     {r?.model && (
//                       <span className="text-[10px] text-slate-400">
//                         {r.model}
//                       </span>
//                     )}
//                   </div>
//                 ),
//               },

//               {
//                 key: "qty",
//                 label: "Qty",
//                 render: (r) => r?.quantity ?? "—",
//               },

//               {
//                 key: "total",
//                 label: "Total",
//                 render: (r) =>
//                   `₹${Number(r?.total || 0).toFixed(2)}`,
//               },

//               {
//                 key: "status",
//                 label: "Status",
//                 render: (r) => (
//                   <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
//                     {label(r?.status)}
//                   </span>
//                 ),
//               },
//             ]}
//             rows={filtered}
//             empty="No contact lens jobs found."
//           />
//         )}
//       </Section>

//       {/* =========================
//           02 — WORKFLOW SUMMARY
//       ========================== */}
//       <Section
//         number="02"
//         title="Workflow summary"
//         description="Current contact lens jobs grouped by dispensing status."
//       >
//         <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
//           {statuses.map((s) => {
//             const active = status === s;

//             return (
//               <button
//                 key={s}
//                 type="button"
//                 onClick={() =>
//                   setStatus(active ? "" : s)
//                 }
//                 className={`rounded-xl border p-4 text-left transition ${
//                   active
//                     ? "border-slate-900 bg-slate-900 text-white"
//                     : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
//                 }`}
//               >
//                 <div
//                   className={`text-[10px] font-bold uppercase tracking-wider ${
//                     active
//                       ? "text-slate-300"
//                       : "text-slate-400"
//                   }`}
//                 >
//                   {label(s)}
//                 </div>

//                 <div className="mt-2 text-2xl font-bold">
//                   {counts[s] || 0}
//                 </div>

//                 <div
//                   className={`mt-1 text-[10px] ${
//                     active
//                       ? "text-slate-400"
//                       : "text-slate-400"
//                   }`}
//                 >
//                   Contact lens jobs
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </Section>

//       {/* =========================
//           03 — WORKFLOW
//       ========================== */}
//       <Section
//         number="03"
//         title="Dispensing workflow"
//         description="Contact lens jobs move through the dispensing process."
//       >
//         <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
//           <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
//             Draft
//           </span>

//           <span>→</span>

//           <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
//             Ordered
//           </span>

//           <span>→</span>

//           <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
//             Ready
//           </span>

//           <span>→</span>

//           <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
//             Notified
//           </span>

//           <span>→</span>

//           <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
//             Collected
//           </span>
//         </div>
//       </Section>
//     </DocumentShell>
//   );
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getContactLenses } from "../contactLens.api";

const PAGE_SIZE = 20;

const STATUSES = [
  "draft",
  "ordered",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const getPatientName = (patient) => {
  if (!patient) return "Unknown patient";

  if (typeof patient === "string") return patient;

  return (
    [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown patient"
  );
};

const getPatientId = (patient) => {
  if (!patient) return "";

  if (typeof patient === "string") return patient;

  return patient._id || patient.id || "";
};

const getPatientNumber = (patient) => {
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

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const statusClass = (status) => {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-600";

    case "ordered":
      return "bg-blue-50 text-blue-700";

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

export default function ContactLensPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (status) {
        params.status = status;
      }

      const response = await getContactLenses(params);

      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.orders)
            ? response.data.orders
            : Array.isArray(response?.orders)
              ? response.orders
              : [];

      setOrders(rows);
    } catch (err) {
      setOrders([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load contact lens orders.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      const patient = order.patientId || order.patient;

      const searchable = [
        order.orderNumber,
        order.orderType,
        order.brand,
        order.model,
        order.status,
        getPatientName(patient),
        getPatientNumber(patient),
        patient?.phone,
        patient?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [orders, search]);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      draft: orders.filter((x) => x.status === "draft").length,
      ordered: orders.filter((x) => x.status === "ordered").length,
      ready: orders.filter((x) => x.status === "ready").length,
      collected: orders.filter((x) => x.status === "collected").length,
    };
  }, [orders]);

  const openPatient = (patient) => {
    const id = getPatientId(patient);

    if (!id) return;

    navigate(`/patients/${id}`);
  };

  const openOrder = (order) => {
    if (!order?._id) return;

    navigate(`/dispensing/contact-lenses/${order._id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 py-5 sm:py-7">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                <Eye size={13} />
                Dispensing
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Contact Lenses
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage contact lens orders, patient dispensing records and
                collection workflow from one dedicated workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/dispensing/contact-lenses/new")
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600"
              >
                <Plus size={15} />
                New contact lens
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-5">
          <SummaryItem
            label="Total"
            value={summary.total}
          />

          <SummaryItem
            label="Draft"
            value={summary.draft}
          />

          <SummaryItem
            label="Ordered"
            value={summary.ordered}
          />

          <SummaryItem
            label="Ready"
            value={summary.ready}
          />

          <SummaryItem
            label="Collected"
            value={summary.collected}
          />
        </div>
      </header>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{error}</div>

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
              placeholder="Search order, patient, patient number, brand or model..."
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
                  {formatStatus(item)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          REGISTER
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Dispensing register
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Contact lens orders
            </h2>
          </div>

          <div className="text-xs text-slate-500">
            {filteredOrders.length} record
            {filteredOrders.length === 1 ? "" : "s"}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[380px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={17} className="animate-spin" />
              Loading contact lens orders...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            search={search}
            onCreate={() =>
              navigate("/dispensing/contact-lenses/new")
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-5 py-3">
                    Order
                  </th>

                  <th className="px-5 py-3">
                    Patient
                  </th>

                  <th className="px-5 py-3">
                    Lens
                  </th>

                  <th className="px-5 py-3">
                    Type
                  </th>

                  <th className="px-5 py-3">
                    Qty
                  </th>

                  <th className="px-5 py-3">
                    Order date
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const patient = order.patientId || order.patient;

                  return (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
                    >
                      {/* ORDER */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openOrder(order)}
                          className="text-left"
                        >
                          <div className="text-sm font-bold text-slate-900 hover:text-violet-700">
                            {order.orderNumber || "Order"}
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {order._id}
                          </div>
                        </button>
                      </td>

                      {/* PATIENT */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openPatient(patient)}
                          className="group flex items-center gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-xs font-bold text-violet-700">
                            {getPatientName(patient)
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((item) => item[0])
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-700">
                              {getPatientName(patient)}
                            </div>

                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {getPatientNumber(patient) ||
                                "No patient number"}
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* LENS */}

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {order.brand || "—"}
                        </div>

                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {order.model || "Model not recorded"}
                        </div>
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600">
                          {order.orderType
                            ? order.orderType.replaceAll("_", " ")
                            : "Contact lens"}
                        </span>
                      </td>

                      {/* QUANTITY */}

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {order.quantity ?? "—"}
                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {formatDate(
                          order.createdAt ||
                            order.orderDate ||
                            order.date,
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                            order.status,
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openOrder(order)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        >
                          View order
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
            <div className="text-xs text-slate-400">
              Showing {filteredOrders.length} contact lens order
              {filteredOrders.length === 1 ? "" : "s"}
            </div>

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
                disabled={orders.length < PAGE_SIZE}
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

/* ============================================================
   SUMMARY ITEM
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
   EMPTY STATE
============================================================ */

function EmptyState({ search, onCreate }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Eye size={25} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {search
          ? "No contact lens orders found"
          : "No contact lens orders yet"}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {search
          ? "Try a different patient, order number, brand, model or status."
          : "Create a contact lens order after selecting the required patient."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={14} />
          Create contact lens order
        </button>
      )}
    </div>
  );
}