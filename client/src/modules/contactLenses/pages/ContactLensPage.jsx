// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import {
//   Eye,
//   Filter,
//   Loader2,
//   Plus,
//   RefreshCw,
//   Search,
//   X,
//   Printer,
//   UserRound,
//   Check,
//   ChevronDown,
//   Trash2,
//   Save,
//   FileText,
//   ClipboardList,
//   IndianRupee,
//   Layers
// } from "lucide-react";

// /* ==========================================================================
//    API CONTRACT / MOCK LAYER (Replaces direct imports if used stand-alone)
//    Replace or hook directly to your:
//    - ../contactLens.api
//    - ../spectacle.api
//    - ../../inventory/inventory.api
//    - ../../patients/patient.api
//    ========================================================================== */

// // Utility functions
// const PAGE_SIZE = 20;

// const STATUSES = [
//   "draft",
//   "ordered",
//   "ready",
//   "notified",
//   "collected",
//   "cancelled",
// ];

// const getPatientName = (patient) => {
//   if (!patient) return "Unknown patient";
//   if (typeof patient === "string") return patient;
//   return (
//     [patient.firstName, patient.middleName, patient.lastName]
//       .filter(Boolean)
//       .join(" ") || "Unknown patient"
//   );
// };

// const getPatientId = (patient) => {
//   if (!patient) return "";
//   if (typeof patient === "string") return patient;
//   return patient._id || patient.id || "";
// };

// const getPatientNumber = (patient) => {
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

// const formatStatus = (status) => {
//   if (!status) return "Unknown";
//   return status
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// };

// const statusClass = (status) => {
//   switch (status) {
//     case "draft":
//       return "bg-slate-100 text-slate-600";
//     case "ordered":
//       return "bg-blue-50 text-blue-700";
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

// const eye = () => ({
//   sphere: "",
//   cylinder: "",
//   axis: "",
//   va: "",
//   add: "",
//   bc: "",
//   dia: "",
//   flatK: "",
//   steepK: "",
//   sagittalDepth: "",
//   vaultInitial: "",
//   vaultSettled: "",
//   limbalClearance: "",
//   landingZone: "alignment",
// });

// /* ==========================================================================
//    1. CONTACT LENS REGISTER / LIST PAGE
//    ========================================================================== */

// export function ContactLensPage({ onNavigate }) {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("");
//   const [page, setPage] = useState(1);

//   const loadOrders = useCallback(async () => {
//     setLoading(true);
//     setError("");
//     try {
//       // API call: getContactLenses({ page, limit: PAGE_SIZE, status })
//       const response = await fetch(`/api/contact-lenses?page=${page}&limit=${PAGE_SIZE}&status=${status}`)
//         .then(res => res.ok ? res.json() : [])
//         .catch(() => []);
      
//       const rows = Array.isArray(response)
//         ? response
//         : Array.isArray(response?.data)
//           ? response.data
//           : Array.isArray(response?.data?.orders)
//             ? response.data.orders
//             : Array.isArray(response?.orders)
//               ? response.orders
//               : [];

//       setOrders(rows);
//     } catch (err) {
//       setOrders([]);
//       setError(err?.message || "Unable to load contact lens orders.");
//     } finally {
//       setLoading(false);
//     }
//   }, [page, status]);

//   useEffect(() => {
//     loadOrders();
//   }, [loadOrders]);

//   useEffect(() => {
//     setPage(1);
//   }, [search, status]);

//   const filteredOrders = useMemo(() => {
//     const query = search.trim().toLowerCase();
//     if (!query) return orders;

//     return orders.filter((order) => {
//       const patient = order.patientId || order.patient;
//       const searchable = [
//         order.orderNumber,
//         order.orderType,
//         order.lensCategory,
//         order.brand,
//         order.model,
//         order.status,
//         getPatientName(patient),
//         getPatientNumber(patient),
//         patient?.phone,
//         patient?.email,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchable.includes(query);
//     });
//   }, [orders, search]);

//   const summary = useMemo(() => {
//     return {
//       total: orders.length,
//       draft: orders.filter((x) => x.status === "draft").length,
//       ordered: orders.filter((x) => x.status === "ordered").length,
//       ready: orders.filter((x) => x.status === "ready").length,
//       collected: orders.filter((x) => x.status === "collected").length,
//     };
//   }, [orders]);

//   return (
//     <div className="mx-auto w-full max-w-[1600px] space-y-6 py-5 sm:py-7">
//       <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//         <div className="bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 sm:p-7">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
//             <div>
//               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
//                 <Eye size={13} />
//                 Dispensing & Fitting Workspace
//               </div>
//               <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
//                 Contact Lens Clinical Orders
//               </h1>
//               <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
//                 Manage Soft, RGP, and Scleral lens fitting assessments, trial logs, and dispensing orders.
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <button
//                 type="button"
//                 onClick={loadOrders}
//                 disabled={loading}
//                 className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
//                 Refresh
//               </button>

//               <button
//                 type="button"
//                 onClick={() => onNavigate("new")}
//                 className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600"
//               >
//                 <Plus size={15} />
//                 New Contact Lens Fitting
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-5">
//           <SummaryItem label="Total" value={summary.total} />
//           <SummaryItem label="Draft" value={summary.draft} />
//           <SummaryItem label="Ordered" value={summary.ordered} />
//           <SummaryItem label="Ready" value={summary.ready} />
//           <SummaryItem label="Collected" value={summary.collected} />
//         </div>
//       </header>

//       {error && (
//         <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           <div>{error}</div>
//           <button type="button" onClick={() => setError("")} className="rounded-lg p-1 hover:bg-red-100">
//             <X size={15} />
//           </button>
//         </div>
//       )}

//       <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//         <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
//           <div className="relative flex-1">
//             <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search order, patient, patient number, modality, brand or model..."
//               className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
//             />
//           </div>

//           <div className="relative">
//             <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <select
//               value={status}
//               onChange={(e) => {
//                 setStatus(e.target.value);
//                 setPage(1);
//               }}
//               className="h-11 min-w-[190px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
//             >
//               <option value="">All statuses</option>
//               {STATUSES.map((item) => (
//                 <option key={item} value={item}>
//                   {formatStatus(item)}
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
//               Dispensing Register
//             </div>
//             <h2 className="mt-1 text-xl font-bold text-slate-900">
//               Contact Lens Orders
//             </h2>
//           </div>
//           <div className="text-xs text-slate-500">
//             {filteredOrders.length} record{filteredOrders.length === 1 ? "" : "s"}
//           </div>
//         </header>

//         {loading ? (
//           <div className="flex min-h-[380px] items-center justify-center">
//             <div className="flex items-center gap-2 text-sm text-slate-400">
//               <Loader2 size={17} className="animate-spin" />
//               Loading contact lens orders...
//             </div>
//           </div>
//         ) : filteredOrders.length === 0 ? (
//           <EmptyState search={search} onCreate={() => onNavigate("new")} />
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1100px] text-left">
//               <thead>
//                 <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
//                   <th className="px-5 py-3">Order</th>
//                   <th className="px-5 py-3">Patient</th>
//                   <th className="px-5 py-3">Category</th>
//                   <th className="px-5 py-3">Lens</th>
//                   <th className="px-5 py-3">Qty</th>
//                   <th className="px-5 py-3">Order Date</th>
//                   <th className="px-5 py-3">Status</th>
//                   <th className="px-5 py-3 text-right">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrders.map((order) => {
//                   const patient = order.patientId || order.patient;
//                   return (
//                     <tr
//                       key={order._id}
//                       className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
//                     >
//                       <td className="px-5 py-4">
//                         <button
//                           type="button"
//                           onClick={() => onNavigate("details", order._id)}
//                           className="text-left"
//                         >
//                           <div className="text-sm font-bold text-slate-900 hover:text-violet-700">
//                             {order.orderNumber || "Order"}
//                           </div>
//                           <div className="mt-0.5 text-[10px] text-slate-400">
//                             {order._id}
//                           </div>
//                         </button>
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="group flex items-center gap-3 text-left">
//                           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-xs font-bold text-violet-700">
//                             {getPatientName(patient)
//                               .split(" ")
//                               .filter(Boolean)
//                               .slice(0, 2)
//                               .map((item) => item[0])
//                               .join("")
//                               .toUpperCase()}
//                           </div>
//                           <div className="min-w-0">
//                             <div className="truncate text-sm font-semibold text-slate-800">
//                               {getPatientName(patient)}
//                             </div>
//                             <div className="mt-0.5 text-[10px] text-slate-400">
//                               {getPatientNumber(patient) || "No patient number"}
//                             </div>
//                           </div>
//                         </div>
//                       </td>

//                       <td className="px-5 py-4">
//                         <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
//                           order.lensCategory === "scleral" 
//                             ? "bg-purple-100 text-purple-700" 
//                             : order.lensCategory === "rgp" 
//                             ? "bg-amber-100 text-amber-800" 
//                             : "bg-blue-100 text-blue-700"
//                         }`}>
//                           {order.lensCategory || "Soft"}
//                         </span>
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="text-sm font-semibold text-slate-800">
//                           {order.brand || "—"}
//                         </div>
//                         <div className="mt-0.5 text-[11px] text-slate-400">
//                           {order.model || "Model not recorded"}
//                         </div>
//                       </td>

//                       <td className="px-5 py-4 text-sm font-semibold text-slate-700">
//                         {order.quantity ?? "—"}
//                       </td>

//                       <td className="px-5 py-4 text-xs font-medium text-slate-600">
//                         {formatDate(order.createdAt || order.orderDate || order.date)}
//                       </td>

//                       <td className="px-5 py-4">
//                         <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(order.status)}`}>
//                           {formatStatus(order.status)}
//                         </span>
//                       </td>

//                       <td className="px-5 py-4 text-right">
//                         <button
//                           type="button"
//                           onClick={() => onNavigate("details", order._id)}
//                           className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
//                         >
//                           View Order
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
//               Showing {filteredOrders.length} contact lens order{filteredOrders.length === 1 ? "" : "s"}
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
//                 disabled={orders.length < PAGE_SIZE}
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

// function SummaryItem({ label, value }) {
//   return (
//     <div className="border-r border-slate-200 px-5 py-4 last:border-r-0">
//       <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
//         {label}
//       </div>
//       <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
//     </div>
//   );
// }

// function EmptyState({ search, onCreate }) {
//   return (
//     <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
//       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
//         <Eye size={25} />
//       </div>
//       <h3 className="mt-4 text-sm font-bold text-slate-800">
//         {search ? "No contact lens orders found" : "No contact lens orders yet"}
//       </h3>
//       <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
//         {search
//           ? "Try a different patient, order number, brand, model or status."
//           : "Create a contact lens order after selecting the required patient."}
//       </p>
//       {!search && (
//         <button
//           type="button"
//           onClick={onCreate}
//           className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
//         >
//           <Plus size={14} />
//           Create Contact Lens Order
//         </button>
//       )}
//     </div>
//   );
// }

// /* ==========================================================================
//    2. NEW CONTACT LENS FITTING & CLINICAL ORDER CREATION PAGE
//    ========================================================================== */

// export function NewContactLensPage({ onNavigate }) {
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const [lensCategory, setLensCategory] = useState("soft"); // soft | rgp | scleral
//   const [patientSearch, setPatientSearch] = useState("");
//   const [showPatientResults, setShowPatientResults] = useState(false);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [patients, setPatients] = useState([]);

//   const [form, setForm] = useState({
//     orderNumber: `CL-${Math.floor(100000 + Math.random() * 900000)}`,
//     orderDate: new Date().toISOString().slice(0, 10),
//     dueDate: "",
//     orderType: "daily", // daily, monthly, custom_rgp, custom_scleral
//     status: "draft",
//     brand: "",
//     model: "",
//     replacement: "Monthly",
//     solutionPrescribed: "Multi-Purpose Solution",
//     salineFilling: "Preservative-Free Saline",
    
//     // Clinical Eye Rx Data
//     right: eye(),
//     left: eye(),
    
//     // Fitting Metrics
//     fittingParams: {
//       movementOD: "0.5mm",
//       movementOS: "0.5mm",
//       centrationOD: "Centered",
//       centrationOS: "Centered",
//       pushUpOD: "50%",
//       pushUpOS: "50%",
//       scleralVaultOD: "300",
//       scleralVaultOS: "300",
//       landingZoneOD: "Toric",
//       landingZoneOS: "Toric",
//       limbalClearanceOD: "Optimal (50μm)",
//       limbalClearanceOS: "Optimal (50μm)",
//     },

//     quantity: 1,
//     unitPrice: 0,
//     discount: 0,
//     notes: "",
//   });

//   const handleEyeChange = (eyeSide, field, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [eyeSide]: {
//         ...prev[eyeSide],
//         [field]: value,
//       },
//     }));
//   };

//   const handleSave = async () => {
//     setSaving(true);
//     try {
//       // POST to /api/contact-lenses
//       console.log("Saving lens order", { ...form, lensCategory, patientId: selectedPatient?._id });
//       setTimeout(() => {
//         setSaving(false);
//         onNavigate("list");
//       }, 600);
//     } catch (err) {
//       setError("Failed to create contact lens order.");
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="mx-auto w-full max-w-[1400px] space-y-6 py-5">
//       {/* Header */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
//         <div>
//           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
//             Clinical Assessment & Fitting
//           </span>
//           <h1 className="text-2xl font-bold text-slate-900">New Contact Lens Order</h1>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => onNavigate("list")}
//             className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             disabled={saving}
//             className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
//           >
//             <Save size={14} />
//             {saving ? "Saving..." : "Save Order"}
//           </button>
//         </div>
//       </div>

//       {/* Modality Selector */}
//       <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
//         {[
//           { id: "soft", label: "Soft Contact Lens", desc: "Daily / Monthly / Toric Hydrogel" },
//           { id: "rgp", label: "Rigid Gas Permeable (RGP)", desc: "Corneal RGP / Ortho-K" },
//           { id: "scleral", label: "Scleral & Mini-Scleral", desc: "Ectasia / Vault / Landing Zones" },
//         ].map((m) => (
//           <button
//             key={m.id}
//             type="button"
//             onClick={() => setLensCategory(m.id)}
//             className={`flex flex-col text-left p-3 rounded-xl transition ${
//               lensCategory === m.id
//                 ? "bg-violet-50 border-2 border-violet-600 text-violet-950"
//                 : "border border-transparent hover:bg-slate-50 text-slate-600"
//             }`}
//           >
//             <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
//             <span className="mt-1 text-[10px] text-slate-400">{m.desc}</span>
//           </button>
//         ))}
//       </div>

//       {/* Patient Selection & General Details */}
//       <div className="grid gap-6 md:grid-cols-3">
//         <Panel number="1" title="Patient & General Info">
//           <div className="space-y-3">
//             <label className="block">
//               <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">Patient Search</span>
//               <input
//                 type="text"
//                 placeholder="Search patient name or mobile..."
//                 value={patientSearch}
//                 onChange={(e) => setPatientSearch(e.target.value)}
//                 className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-400"
//               />
//             </label>
//             <div className="grid grid-cols-2 gap-2">
//               <CompactField label="Brand / Manufacturer" value={form.brand} onChange={(v) => setForm(p => ({...p, brand: v}))} />
//               <CompactField label="Model / Design" value={form.model} onChange={(v) => setForm(p => ({...p, model: v}))} />
//             </div>
//             <div className="grid grid-cols-2 gap-2">
//               <CompactField label="Replacement" value={form.replacement} onChange={(v) => setForm(p => ({...p, replacement: v}))} />
//               <CompactField label="Order Date" type="date" value={form.orderDate} onChange={(v) => setForm(p => ({...p, orderDate: v}))} />
//             </div>
//           </div>
//         </Panel>

//         {/* Refraction & Parameters */}
//         <Panel number="2" title="Parameters & Refraction" className="md:col-span-2">
//           <div className="space-y-3">
//             <PrescriptionRow eyeName="right" values={form.right} onChange={handleEyeChange} />
//             <PrescriptionRow eyeName="left" values={form.left} onChange={handleEyeChange} />
//           </div>
//         </Panel>
//       </div>

//       {/* Modality Specific Evaluation Panel */}
//       <Panel number="3" title={`${lensCategory.toUpperCase()} Clinical Fitting Evaluation`}>
//         {lensCategory === "soft" && (
//           <div className="grid grid-cols-2 gap-4 text-xs">
//             <div className="space-y-2 border-r border-slate-100 pr-4">
//               <h4 className="font-bold text-slate-700">Right Eye (OD)</h4>
//               <CompactField label="Base Curve (BC)" value={form.right.bc} onChange={(v) => handleEyeChange("right", "bc", v)} placeholder="e.g. 8.6" />
//               <CompactField label="Diameter (DIA)" value={form.right.dia} onChange={(v) => handleEyeChange("right", "dia", v)} placeholder="e.g. 14.2" />
//             </div>
//             <div className="space-y-2">
//               <h4 className="font-bold text-slate-700">Left Eye (OS)</h4>
//               <CompactField label="Base Curve (BC)" value={form.left.bc} onChange={(v) => handleEyeChange("left", "bc", v)} placeholder="e.g. 8.6" />
//               <CompactField label="Diameter (DIA)" value={form.left.dia} onChange={(v) => handleEyeChange("left", "dia", v)} placeholder="e.g. 14.2" />
//             </div>
//           </div>
//         )}

//         {lensCategory === "rgp" && (
//           <div className="grid grid-cols-2 gap-4 text-xs">
//             <div className="space-y-2 border-r border-slate-100 pr-4">
//               <h4 className="font-bold text-slate-700">Right Eye (OD Corneal)</h4>
//               <div className="grid grid-cols-2 gap-2">
//                 <CompactField label="Flat K" value={form.right.flatK} onChange={(v) => handleEyeChange("right", "flatK", v)} placeholder="D / mm" />
//                 <CompactField label="Steep K" value={form.right.steepK} onChange={(v) => handleEyeChange("right", "steepK", v)} placeholder="D / mm" />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <h4 className="font-bold text-slate-700">Left Eye (OS Corneal)</h4>
//               <div className="grid grid-cols-2 gap-2">
//                 <CompactField label="Flat K" value={form.left.flatK} onChange={(v) => handleEyeChange("left", "flatK", v)} placeholder="D / mm" />
//                 <CompactField label="Steep K" value={form.left.steepK} onChange={(v) => handleEyeChange("left", "steepK", v)} placeholder="D / mm" />
//               </div>
//             </div>
//           </div>
//         )}

//         {lensCategory === "scleral" && (
//           <div className="grid grid-cols-2 gap-4 text-xs">
//             <div className="space-y-2 border-r border-slate-100 pr-4">
//               <h4 className="font-bold text-slate-700">Right Eye Scleral Profile</h4>
//               <div className="grid grid-cols-2 gap-2">
//                 <CompactField label="Sagittal Depth (SAG)" value={form.right.sagittalDepth} onChange={(v) => handleEyeChange("right", "sagittalDepth", v)} placeholder="μm" />
//                 <CompactField label="Initial Vault" value={form.right.vaultInitial} onChange={(v) => handleEyeChange("right", "vaultInitial", v)} placeholder="μm" />
//               </div>
//               <CompactField label="Landing Zone Alignment" value={form.right.landingZone} onChange={(v) => handleEyeChange("right", "landingZone", v)} />
//             </div>
//             <div className="space-y-2">
//               <h4 className="font-bold text-slate-700">Left Eye Scleral Profile</h4>
//               <div className="grid grid-cols-2 gap-2">
//                 <CompactField label="Sagittal Depth (SAG)" value={form.left.sagittalDepth} onChange={(v) => handleEyeChange("left", "sagittalDepth", v)} placeholder="μm" />
//                 <CompactField label="Initial Vault" value={form.left.vaultInitial} onChange={(v) => handleEyeChange("left", "vaultInitial", v)} placeholder="μm" />
//               </div>
//               <CompactField label="Landing Zone Alignment" value={form.left.landingZone} onChange={(v) => handleEyeChange("left", "landingZone", v)} />
//             </div>
//           </div>
//         )}
//       </Panel>
//     </div>
//   );
// }

// function CompactField({ label, value, onChange, type = "text", placeholder = "" }) {
//   return (
//     <label className="block">
//       <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">{label}</span>
//       <input
//         type={type}
//         value={value ?? ""}
//         placeholder={placeholder}
//         onChange={(e) => onChange(e.target.value)}
//         className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 outline-none transition focus:border-slate-400"
//       />
//     </label>
//   );
// }

// function Panel({ number, title, children, className = "" }) {
//   return (
//     <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
//       <div className="flex min-h-10 items-center gap-2 border-b border-slate-100 px-3 py-2">
//         <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[8px] font-bold text-slate-500">
//           {number}
//         </span>
//         <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
//           {title}
//         </h2>
//       </div>
//       <div className="p-3">{children}</div>
//     </section>
//   );
// }

// function PrescriptionRow({ eyeName, values, onChange }) {
//   const fields = [
//     ["sphere", "SPH"],
//     ["cylinder", "CYL"],
//     ["axis", "AXIS"],
//     ["va", "VA"],
//     ["add", "ADD"],
//   ];

//   return (
//     <div className="grid grid-cols-[45px_repeat(5,minmax(50px,1fr))] gap-1.5">
//       <div className="flex items-center">
//         <span
//           className={`flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold ${
//             eyeName === "right" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
//           }`}
//         >
//           {eyeName === "right" ? "OD" : "OS"}
//         </span>
//       </div>
//       {fields.map(([key, label]) => (
//         <input
//           key={key}
//           value={values?.[key] || ""}
//           onChange={(e) => onChange(eyeName, key, e.target.value)}
//           placeholder={label}
//           className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-center text-[9px] font-medium text-slate-700 outline-none focus:border-slate-400"
//         />
//       ))}
//     </div>
//   );
// }

// /* ==========================================================================
//    3. CONTACT LENS DETAILS & SPECIFICATION PAGE
//    ========================================================================== */

// export function ContactLensDetailsPage({ orderId, onNavigate }) {
//   const [item, setItem] = useState(null);
//   const [error, setError] = useState("");

//   const load = useCallback(() => {
//     // API GET /api/contact-lenses/:id
//     fetch(`/api/contact-lenses/${orderId}`)
//       .then((r) => r.ok ? r.json() : null)
//       .then((data) => {
//         if (data) setItem(data);
//         else {
//           // Fallback view state
//           setItem({
//             _id: orderId || "CL-849202",
//             orderNumber: "CL-849202",
//             status: "ordered",
//             patientId: { firstName: "Jane", lastName: "Doe", patientNumber: "P-94812", phone: "+91 9876543210" },
//             orderType: "custom_scleral",
//             brand: "Zenlens",
//             model: "Scleral 16.0",
//             replacement: "Annual",
//             orderDate: new Date().toISOString(),
//             quantity: 2,
//             unitPrice: 18000,
//             total: 36000,
//             right: { sphere: "-4.50", cylinder: "-1.25", axis: "180", bc: "7.80", dia: "16.0", vaultInitial: "350μm" },
//             left: { sphere: "-5.00", cylinder: "-1.50", axis: "175", bc: "7.75", dia: "16.0", vaultInitial: "340μm" },
//             notes: "Keratoconus Grade II. Regular insertion with preservative-free saline required."
//           });
//         }
//       })
//       .catch(() => setError("Unable to load order details"));
//   }, [orderId]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   if (!item) {
//     return (
//       <div className="p-8 text-center text-sm text-slate-500">
//         {error || "Loading order details..."}
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto w-full max-w-[1200px] space-y-6 py-6">
//       <div className="flex items-center justify-between border-b border-slate-200 pb-4">
//         <div>
//           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
//             Contact Lens Clinical Specification
//           </span>
//           <h1 className="text-2xl font-bold text-slate-900">
//             {getPatientName(item.patientId)} · {item.orderNumber}
//           </h1>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={() => window.print()}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold print:hidden"
//           >
//             <Printer size={14} />
//             Print Sheet
//           </button>
//           <button
//             onClick={() => onNavigate("list")}
//             className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white print:hidden"
//           >
//             Back to Register
//           </button>
//         </div>
//       </div>

//       {/* Prescription Breakdown */}
//       <div className="grid gap-4 md:grid-cols-2">
//         {[
//           ["RIGHT EYE (OD)", item.right],
//           ["LEFT EYE (OS)", item.left],
//         ].map(([label, eyeObj]) => (
//           <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</h3>
//             <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
//               <div><span className="text-slate-400">SPH:</span> <strong className="text-slate-800">{eyeObj?.sphere || "—"}</strong></div>
//               <div><span className="text-slate-400">CYL:</span> <strong className="text-slate-800">{eyeObj?.cylinder || "—"}</strong></div>
//               <div><span className="text-slate-400">AXIS:</span> <strong className="text-slate-800">{eyeObj?.axis || "—"}</strong></div>
//               <div><span className="text-slate-400">BC:</span> <strong className="text-slate-800">{eyeObj?.bc || "—"}</strong></div>
//               <div><span className="text-slate-400">DIA:</span> <strong className="text-slate-800">{eyeObj?.dia || "—"}</strong></div>
//               <div><span className="text-slate-400">VAULT:</span> <strong className="text-slate-800">{eyeObj?.vaultInitial || "—"}</strong></div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ==========================================================================
//    MAIN APP ROUTER ROOT
//    ========================================================================== */

// export default function ContactLensWorkspace() {
//   const [route, setRoute] = useState("list"); // list | new | details
//   const [selectedId, setSelectedId] = useState(null);

//   const handleNavigate = (targetRoute, id = null) => {
//     setSelectedId(id);
//     setRoute(targetRoute);
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 font-sans antialiased text-slate-900">
//       {route === "list" && <ContactLensPage onNavigate={handleNavigate} />}
//       {route === "new" && <NewContactLensPage onNavigate={handleNavigate} />}
//       {route === "details" && <ContactLensDetailsPage orderId={selectedId} onNavigate={handleNavigate} />}
//     </div>
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


