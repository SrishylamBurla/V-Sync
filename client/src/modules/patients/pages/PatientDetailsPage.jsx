// import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
// import {
//   ArrowLeft,
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   ClipboardPlus,
//   ContactRound,
//   Download,
//   Edit3,
//   FileText,
//   Glasses,
//   History,
//   Loader2,
//   Plus,
//   Receipt,
//   RefreshCw,
//   Stethoscope,
//   Trash2,
//   Upload,
//   UserRound,
//   Wallet,
//   X,
// } from "lucide-react";
// import { useNavigate, useParams } from "react-router-dom";

// import { getPatient, updatePatient } from "../patient.api";
// import {
//   uploadPatientDocument,
//   getPatientDocuments,
//   deletePatientDocument,
//   openPatientDocument,
// } from "../patient.documents.api.js";
// import {
//   getPatientConsultations,
//   getConsultation,
// } from "../../clinical/consultation.api";
// import { getPatientSpectacles } from "../../optical/spectacle.api";
// import { getPatientContactLenses } from "../../contactLenses/contactLens.api";
// import { getDispensingList } from "../../dispensing/dispensing.api";
// import { getInvoices } from "../../billing/billing.api";
// import { getAppointments } from "../../appointments/appointment.api";

// const fullName = (patient) =>
//   [patient?.firstName, patient?.middleName, patient?.lastName]
//     .filter(Boolean)
//     .join(" ");

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

// const formatMoney = (value) =>
//   `₹${Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// const calculateAge = (dob) => {
//   if (!dob) return null;

//   const birth = new Date(dob);
//   if (Number.isNaN(birth.getTime())) return null;

//   const now = new Date();
//   let age = now.getFullYear() - birth.getFullYear();
//   const month = now.getMonth() - birth.getMonth();

//   if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) {
//     age -= 1;
//   }

//   return age >= 0 ? age : null;
// };

// const roleLabel = (value = "") =>
//   String(value)
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (character) => character.toUpperCase());

// const getPatientData = (response) =>
//   response?.data?.patient || response?.data || response?.patient || null;

// const getRows = (response) =>
//   Array.isArray(response?.data)
//     ? response.data
//     : Array.isArray(response?.data?.data)
//       ? response.data.data
//       : [];

// const consultationLabel = (item) => {
//   if (item?.consultationType === "specialized") {
//     return roleLabel(item.specializedType || "specialized");
//   }

//   return item?.consultationType === "short_consult"
//     ? "Short Consultation"
//     : "Comprehensive";
// };

// const consultationTone = (item) => {
//   if (item?.consultationType === "specialized") return "violet";
//   if (item?.consultationType === "short_consult") return "amber";
//   return "blue";
// };

// const initialEdit = {
//   firstName: "",
//   middleName: "",
//   lastName: "",
//   dateOfBirth: "",
//   gender: "",
//   phone: "",
//   alternatePhone: "",
//   email: "",
//   source: "",
//   notes: "",
// };

// const sections = [
//   ["overview", "Overview"],
//   ["consultations", "Consultations"],
//   ["optical", "Dispensing"],
//   ["appointments", "Appointments"],
//   ["billing", "Billing"],
//   ["documents", "Documents"],
// ];

// const DEFAULT_PAGE_SIZE = 8;

// function usePaginatedRows(rows = [], pageSize = DEFAULT_PAGE_SIZE) {
//   const [page, setPage] = useState(1);
//   const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

//   useEffect(() => {
//     setPage((current) => Math.min(current, totalPages));
//   }, [totalPages]);

//   const safePage = Math.min(page, totalPages);
//   const start = (safePage - 1) * pageSize;

//   return {
//     page: safePage,
//     setPage,
//     totalPages,
//     pageRows: rows.slice(start, start + pageSize),
//     startIndex: start,
//   };
// }

// export default function PatientDetailsPage() {
//   const { patientId } = useParams();
//   const navigate = useNavigate();

//   const [patient, setPatient] = useState(null);
//   const [consultations, setConsultations] = useState([]);
//   const [spectacles, setSpectacles] = useState([]);
//   const [contactLenses, setContactLenses] = useState([]);
//   const [dispensing, setDispensing] = useState([]);
//   const [invoices, setInvoices] = useState([]);
//   const [appointments, setAppointments] = useState([]);
//   const [documents, setDocuments] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");
//   const [activeSection, setActiveSection] = useState("overview");

//   const [selectedConsultation, setSelectedConsultation] = useState(null);
//   const [loadingConsultation, setLoadingConsultation] = useState(false);

//   const [editOpen, setEditOpen] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [editForm, setEditForm] = useState(initialEdit);

//   const [documentOpen, setDocumentOpen] = useState(false);
//   const [documentFiles, setDocumentFiles] = useState([]);
//   const [documentCategory, setDocumentCategory] = useState("other");
//   const [documentNote, setDocumentNote] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const [documentAction, setDocumentAction] = useState("");

//   const age = useMemo(
//     () => calculateAge(patient?.dateOfBirth),
//     [patient?.dateOfBirth],
//   );

//   const completedComprehensive = useMemo(
//     () =>
//       consultations.some(
//         (item) =>
//           item.consultationType === "comprehensive" &&
//           (item.status === "completed" || !item.status),
//       ),
//     [consultations],
//   );

//   const specializedHistory = useMemo(
//     () =>
//       consultations.filter((item) => item.consultationType === "specialized"),
//     [consultations],
//   );

//   const latestConsultation = consultations[0] || null;

//   const outstanding = invoices.reduce(
//     (sum, invoice) => sum + Number(invoice.balance || 0),
//     0,
//   );

//   const totalPaid = invoices.reduce(
//     (sum, invoice) => sum + Number(invoice.paidAmount || 0),
//     0,
//   );

//   const upcomingAppointments = useMemo(() => {
//     const now = new Date();

//     return appointments
//       .filter((item) => {
//         if (!item?.appointmentDate) return false;
//         const date = new Date(item.appointmentDate);
//         return !Number.isNaN(date.getTime()) && date >= now;
//       })
//       .sort(
//         (a, b) =>
//           new Date(a.appointmentDate).getTime() -
//           new Date(b.appointmentDate).getTime(),
//       );
//   }, [appointments]);

//   const load = useCallback(
//     async ({ silent = false } = {}) => {
//       if (!patientId) return;

//       if (silent) setRefreshing(true);
//       else setLoading(true);

//       setError("");

//       try {
//         const results = await Promise.allSettled([
//           getPatient(patientId),
//           getPatientConsultations(patientId),
//           getPatientSpectacles(patientId),
//           getPatientContactLenses(patientId),
//           getDispensingList({ patientId }),
//           getInvoices({ patientId }),
//           getAppointments({ patientId }),
//           getPatientDocuments(patientId),
//         ]);

//         const patientResult = results[0];

//         if (patientResult.status === "rejected") {
//           throw patientResult.reason;
//         }

//         const patientData = getPatientData(patientResult.value);

//         if (!patientData) {
//           throw new Error("Patient record not found");
//         }

//         setPatient(patientData);

//         setEditForm({
//           ...initialEdit,
//           firstName: patientData.firstName || "",
//           middleName: patientData.middleName || "",
//           lastName: patientData.lastName || "",
//           dateOfBirth: patientData.dateOfBirth
//             ? new Date(patientData.dateOfBirth).toISOString().slice(0, 10)
//             : "",
//           gender: patientData.gender || "",
//           phone: patientData.phone || "",
//           alternatePhone: patientData.alternatePhone || "",
//           email: patientData.email || "",
//           source: patientData.source || "",
//           notes: patientData.notes || "",
//         });

//         const value = (index) =>
//           results[index].status === "fulfilled" ? results[index].value : null;

//         const consultationRows = getRows(value(1));
//         const spectacleRows = getRows(value(2));
//         const contactRows = getRows(value(3));
//         const dispensingRows = getRows(value(4));
//         const invoiceRows = getRows(value(5));
//         const appointmentRows = getRows(value(6));
//         const documentRows = Array.isArray(value(7))
//           ? value(7)
//           : getRows(value(7));

//         setConsultations(consultationRows);
//         setSpectacles(spectacleRows);
//         setContactLenses(contactRows);
//         setDispensing(dispensingRows);
//         setInvoices(invoiceRows);
//         setAppointments(appointmentRows);
//         setDocuments(documentRows);
//       } catch (err) {
//         setError(
//           err?.response?.data?.message ||
//             err?.message ||
//             "Unable to load patient workspace",
//         );
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     [patientId],
//   );

//   useEffect(() => {
//     const timer = window.setTimeout(() => {
//       void load();
//     }, 0);

//     return () => window.clearTimeout(timer);
//   }, [load]);

//   const startConsultation = () =>
//     navigate(`/patients/${patientId}/consultations/new`);

//   const startSpecialized = (specialty) => {
//     if (!completedComprehensive) {
//       setError(
//         "Complete a Comprehensive Consultation before starting a specialized consultation.",
//       );
//       return;
//     }

//     navigate(
//       `/patients/${patientId}/consultations/new?type=specialized&specializedType=${specialty}`,
//     );
//   };

//   const openConsultation = async (consultation) => {
//     setLoadingConsultation(true);
//     setError("");

//     try {
//       const response = await getConsultation(consultation._id);

//       setSelectedConsultation(
//         response?.data?.consultation ||
//           response?.data ||
//           response?.consultation ||
//           consultation,
//       );
//     } catch {
//       setSelectedConsultation(consultation);
//     } finally {
//       setLoadingConsultation(false);
//     }
//   };

//   const savePatient = async (event) => {
//     event.preventDefault();

//     setSaving(true);
//     setError("");

//     try {
//       const response = await updatePatient(patientId, {
//         ...editForm,
//         firstName: editForm.firstName.trim(),
//         middleName: editForm.middleName.trim(),
//         lastName: editForm.lastName.trim(),
//         phone: editForm.phone.trim(),
//         alternatePhone: editForm.alternatePhone.trim(),
//         email: editForm.email.trim().toLowerCase(),
//         notes: editForm.notes.trim(),
//       });

//       const updated = getPatientData(response);

//       if (updated) {
//         setPatient(updated);
//       }

//       setEditOpen(false);
//     } catch (err) {
//       setError(
//         err?.response?.data?.message || "Unable to update patient",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const uploadDocuments = async (event) => {
//     event.preventDefault();

//     if (!documentFiles.length || uploading) return;

//     setUploading(true);
//     setError("");

//     try {
//       for (const file of documentFiles) {
//         await uploadPatientDocument(patientId, {
//           file,
//           category: documentCategory,
//           note: documentNote.trim(),
//         });
//       }

//       setDocumentFiles([]);
//       setDocumentNote("");
//       setDocumentOpen(false);

//       await load({ silent: true });
//     } catch (err) {
//       setError(
//         err?.response?.data?.message || "Unable to upload document",
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   const removeDocument = async (documentId) => {
//     if (!documentId || documentAction) return;

//     if (!window.confirm("Delete this patient document?")) return;

//     setDocumentAction(`delete:${documentId}`);

//     try {
//       await deletePatientDocument(patientId, documentId);
//       await load({ silent: true });
//     } catch (err) {
//       setError(
//         err?.response?.data?.message || "Unable to delete document",
//       );
//     } finally {
//       setDocumentAction("");
//     }
//   };

//   const openDocument = async (document) => {
//     if (!document?._id || documentAction) return;

//     setDocumentAction(`open:${document._id}`);

//     try {
//       await openPatientDocument(patientId, document);
//     } catch (err) {
//       setError(
//         err?.response?.data?.message || "Unable to open document",
//       );
//     } finally {
//       setDocumentAction("");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f8fb]">
//         <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
//           <Loader2 size={18} className="animate-spin text-blue-600" />
//           Loading patient workspace...
//         </div>
//       </div>
//     );
//   }

//   if (!patient) {
//     return (
//       <div className="mx-auto max-w-3xl px-4 py-16">
//         <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
//           {error || "Patient record not found."}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#f6f8fb] pb-12 text-slate-800">
//       <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-4 lg:px-5">
//         {/* Top toolbar */}
//         <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
//           <button
//             type="button"
//             onClick={() => navigate(-1)}
//             className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
//           >
//             <ArrowLeft
//               size={15}
//               className="transition-transform group-hover:-translate-x-0.5"
//             />
//             Back
//           </button>

//           <div className="flex flex-wrap gap-2">
//             <button
//               type="button"
//               onClick={() => void load({ silent: true })}
//               disabled={refreshing}
//               className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
//             >
//               <RefreshCw
//                 size={14}
//                 className={refreshing ? "animate-spin" : ""}
//               />
//               Refresh
//             </button>

//             <button
//               type="button"
//               onClick={() => setDocumentOpen(true)}
//               className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
//             >
//               <Upload size={14} />
//               Documents
//             </button>

//             <button
//               type="button"
//               onClick={() => setEditOpen(true)}
//               className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
//             >
//               <Edit3 size={14} />
//               Edit patient
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700 shadow-sm">
//             <span>{error}</span>

//             <button
//               type="button"
//               onClick={() => setError("")}
//               className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
//               aria-label="Dismiss error"
//             >
//               <X size={14} />
//             </button>
//           </div>
//         )}

//         {/* Patient header */}
//         <header className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
//           <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 px-4 py-4 sm:px-5">
//             <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />
//             <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-violet-100/30 blur-3xl" />

//             <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
//               {/* Identity */}
//               <div className="flex min-w-0 items-start gap-4">
//                 <div className="relative">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-700 text-lg font-bold text-white shadow-xl shadow-slate-900/15">
//                     {(patient.firstName?.[0] || "P").toUpperCase()}
//                     {(patient.lastName?.[0] || "").toUpperCase()}
//                   </div>

//                   <span
//                     className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full border-[3px] border-white ${
//                       patient.status === "inactive"
//                         ? "bg-amber-500"
//                         : "bg-emerald-500"
//                     }`}
//                   />
//                 </div>

//                 <div className="min-w-0">
//                   <div className="flex flex-wrap items-center gap-2">
//                     <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700">
//                       Patient
//                     </span>

//                     {patient.patientNumber && (
//                       <span className="font-mono text-[10px] font-semibold text-slate-400">
//                         #{patient.patientNumber}
//                       </span>
//                     )}
//                   </div>

//                   <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
//                     {fullName(patient) || "Unnamed Patient"}
//                   </h1>

//                   <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
//                     {age !== null && (
//                       <span className="font-medium">{age} years</span>
//                     )}

//                     {patient.gender && (
//                       <>
//                         <span className="text-slate-300">•</span>
//                         <span>{roleLabel(patient.gender)}</span>
//                       </>
//                     )}

//                     {patient.phone && (
//                       <>
//                         <span className="text-slate-300">•</span>
//                         <span>{patient.phone}</span>
//                       </>
//                     )}
//                   </div>

//                   <div className="mt-2 flex flex-wrap gap-1.5">
//                     <Badge
//                       label={
//                         patient.status === "inactive"
//                           ? "Inactive"
//                           : "Active"
//                       }
//                       tone={
//                         patient.status === "inactive" ? "amber" : "green"
//                       }
//                     />

//                     <Badge
//                       label={`${consultations.length} consultations`}
//                       tone="blue"
//                     />

//                     <Badge
//                       label={`${invoices.length} invoices`}
//                       tone="violet"
//                     />

//                     {outstanding > 0 && (
//                       <Badge
//                         label={`${formatMoney(outstanding)} outstanding`}
//                         tone="amber"
//                       />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Quick actions */}
//               <div className="grid w-full gap-1.5 sm:grid-cols-2 xl:w-[560px] xl:grid-cols-4">
//                 <QuickAction
//                   icon={ClipboardPlus}
//                   label="Start Consultation"
//                   onClick={startConsultation}
//                   primary
//                 />

//                 <QuickAction
//                   icon={Glasses}
//                   label="New Spectacle Job"
//                   onClick={() =>
//                     navigate(`/dispensing/spectacles/new/${patientId}`)
//                   }
//                 />

//                 <QuickAction
//                   icon={ContactRound}
//                   label="Contact Lens"
//                   onClick={() =>
//                     navigate(`/dispensing/contact-lenses/new?patientId=${patientId}`)
//                   }
//                 />

//                 <QuickAction
//                   icon={Receipt}
//                   label="Create Bill"
//                   onClick={() =>
//                     navigate(`/billing?patientId=${patientId}`)
//                   }
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Section navigation */}
//           <nav className="flex gap-0.5 overflow-x-auto border-t border-slate-200 bg-white px-2 py-1.5 sm:px-3">
//             {sections.map(([id, label]) => (
//               <button
//                 key={id}
//                 type="button"
//                 onClick={() => setActiveSection(id)}
//                 className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[9px] font-bold transition-all duration-200 ${
//                   activeSection === id
//                     ? "bg-slate-950 text-white shadow-sm"
//                     : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
//                 }`}
//               >
//                 <span>{label}</span>
//                 {id !== "overview" && (
//                   <span
//                     className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[8px] ${
//                       activeSection === id
//                         ? "bg-white/15 text-white"
//                         : "bg-slate-100 text-slate-400"
//                     }`}
//                   >
//                     {id === "consultations"
//                       ? consultations.length
//                       : id === "optical"
//                         ? spectacles.length + contactLenses.length
//                         : id === "dispensing"
//                           ? dispensing.length
//                           : id === "appointments"
//                             ? appointments.length
//                             : id === "billing"
//                               ? invoices.length
//                               : documents.length}
//                   </span>
//                 )}
//               </button>
//             ))}
//           </nav>
//         </header>

//         <main className="mt-3 space-y-2">
//           {/* Overview */}
//           {activeSection === "overview" && (
//             <section className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
//             <Panel title="Patient overview" icon={UserRound}>
//               <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
//                 <Info
//                   label="Date of birth"
//                   value={formatDate(patient.dateOfBirth)}
//                 />

//                 <Info
//                   label="Age"
//                   value={age === null ? "—" : `${age} years`}
//                 />

//                 <Info
//                   label="Gender"
//                   value={
//                     patient.gender ? roleLabel(patient.gender) : "—"
//                   }
//                 />

//                 <Info label="Phone" value={patient.phone || "—"} />

//                 <Info
//                   label="Alternate phone"
//                   value={patient.alternatePhone || "—"}
//                 />

//                 <Info label="Email" value={patient.email || "—"} />

//                 <Info
//                   label="Source"
//                   value={
//                     patient.source ? roleLabel(patient.source) : "—"
//                   }
//                 />

//                 <Info
//                   label="Last consultation"
//                   value={formatDate(
//                     patient.lastConsultationAt ||
//                       latestConsultation?.consultationDate,
//                   )}
//                 />

//                 <Info
//                   label="Next recall"
//                   value={formatDate(patient.nextRecallAt)}
//                 />
//               </div>

//               {patient.notes && (
//                 <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
//                   <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
//                     Patient notes
//                   </div>

//                   <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
//                     {patient.notes}
//                   </p>
//                 </div>
//               )}
//             </Panel>

//             <Panel title="Care pathway" icon={Stethoscope}>
//               <div className="space-y-2">
//                 <PathStep
//                   done={completedComprehensive}
//                   title="Comprehensive Consultation"
//                   description={
//                     completedComprehensive
//                       ? "Completed — specialized consultations are unlocked."
//                       : "Required before specialized consultations."
//                   }
//                 />

//                 <PathStep
//                   done={specializedHistory.some(
//                     (x) => x.specializedType === "contact_lenses",
//                   )}
//                   title="Contact Lens"
//                   description="Specialized consultation and fitting workflow."
//                   onClick={() =>
//                     navigate(`/dispensing/contact-lenses/new?patientId=${patientId}`)
//                   }
//                 />

//                 <PathStep
//                   done={specializedHistory.some(
//                     (x) => x.specializedType === "binocular_vision",
//                   )}
//                   title="Binocular Vision"
//                   description="Specialized binocular vision assessment."
//                   onClick={() => startSpecialized("binocular_vision")}
//                   disabled={!completedComprehensive}
//                 />

//                 <PathStep
//                   done={specializedHistory.some(
//                     (x) => x.specializedType === "low_vision",
//                   )}
//                   title="Low Vision"
//                   description="Specialized low vision assessment."
//                   onClick={() => startSpecialized("low_vision")}
//                   disabled={!completedComprehensive}
//                 />
//               </div>
//             </Panel>
//             </section>
//           )}

//           {/* Consultation history */}
//           {activeSection === "consultations" && (
//             <section>
//             <Panel
//               title="Consultation history"
//               icon={History}
//               action={
//                 <button
//                   type="button"
//                   onClick={startConsultation}
//                   className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
//                 >
//                   <Plus size={13} />
//                   New consultation
//                 </button>
//               }
//             >
//               {consultations.length === 0 ? (
//                 <Empty
//                   title="No consultations yet"
//                   description="Start the patient's first Comprehensive Consultation."
//                   action={startConsultation}
//                 />
//               ) : (
//                 <div className="space-y-3">
//                   <RecordList
//                     rows={consultations}
//                     pageSize={6}
//                     gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
//                     render={(item, index) => (
//                       <button
//                         type="button"
//                         onClick={() => void openConsultation(item)}
//                         className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
//                           index === 0
//                             ? "border-blue-200 bg-blue-50/70 shadow-sm"
//                             : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
//                         }`}
//                       >
//                         <div className="flex items-center justify-between gap-2">
//                           <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
//                             {index === 0 ? "Latest on page" : "Consultation"}
//                           </span>
//                           <ChevronRight size={13} className="text-slate-300 transition-transform group-hover:translate-x-0.5" />
//                         </div>

//                         <div className="mt-3 text-sm font-bold tracking-tight text-slate-950">
//                           {formatDate(item.consultationDate)}
//                         </div>

//                         <div
//                           className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${toneClass(
//                             consultationTone(item),
//                           )}`}
//                         >
//                           {consultationLabel(item)}
//                         </div>

//                         <div className="mt-3 text-[9px] text-slate-400">
//                           {item.optometristId
//                             ? [
//                                 item.optometristId.firstName,
//                                 item.optometristId.lastName,
//                               ]
//                                 .filter(Boolean)
//                                 .join(" ")
//                             : "Clinical team"}
//                         </div>
//                       </button>
//                     )}
//                   />

//                   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//                     <Stat
//                       label="Total consultations"
//                       value={consultations.length}
//                     />

//                     <Stat
//                       label="Comprehensive"
//                       value={
//                         consultations.filter(
//                           (x) =>
//                             x.consultationType === "comprehensive",
//                         ).length
//                       }
//                     />

//                     <Stat
//                       label="Specialized"
//                       value={specializedHistory.length}
//                     />

//                     <Stat
//                       label="Latest"
//                       value={formatDate(
//                         latestConsultation?.consultationDate,
//                       )}
//                     />
//                   </div>
//                 </div>
//               )}
//             </Panel>
//             </section>
//           )}

//           {/* Dispensing */}
//           {activeSection === "optical" && (
//             <section className="grid gap-3 xl:grid-cols-2">
//             <Panel
//               title="Spectacle history"
//               icon={Glasses}
//               action={
//                 <button
//                   type="button"
//                   onClick={() =>
//                     navigate(`/dispensing/spectacles/new/${patientId}`)
//                   }
//                   className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
//                 >
//                   New job
//                 </button>
//               }
//             >
//               <RecordList
//                 rows={spectacles}
//                 empty="No spectacle jobs for this patient."
//                 render={(item) => (
//                   <button
//                     type="button"
//                     onClick={() =>
//                       navigate(`/dispensing/spectacles/${item._id}`)
//                     }
//                     className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
//                   >
//                     <div className="flex min-w-0 items-center gap-3">
//                       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
//                         <Glasses size={16} />
//                       </div>

//                       <div className="min-w-0">
//                         <div className="truncate text-xs font-bold text-slate-900">
//                           {item.jobNumber || "Spectacle Job"}
//                         </div>

//                         <div className="mt-1 text-[10px] text-slate-400">
//                           {formatDate(item.jobDate)} ·{" "}
//                           {item.frame?.description ||
//                             item.frame?.code ||
//                             "Frame pending"}
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex shrink-0 items-center gap-3">
//                       <div className="text-right">
//                         <div className="text-xs font-bold text-slate-800">
//                           {formatMoney(
//                             Number(item.frame?.price || 0) +
//                               Number(item.lens?.price || 0) +
//                               (item.extras || []).reduce(
//                                 (a, x) => a + Number(x.price || 0),
//                                 0,
//                               ) -
//                               Number(item.discount || 0),
//                           )}
//                         </div>

//                         <Status status={item.status} />
//                       </div>

//                       <ChevronRight
//                         size={15}
//                         className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
//                       />
//                     </div>
//                   </button>
//                 )}
//               />
//             </Panel>

//             <Panel
//               title="Contact lens history"
//               icon={ContactRound}
//               action={
//                 <button
//                   type="button"
//                   onClick={() =>
//                     navigate(`/dispensing/contact-lenses/new?patientId=${patientId}`)
//                   }
//                   className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
//                 >
//                   New order
//                 </button>
//               }
//             >
//               <RecordList
//                 rows={contactLenses}
//                 empty="No contact lens orders for this patient."
//                 render={(item) => (
//                   <button
//                     type="button"
//                     onClick={() =>
//                       navigate(`/dispensing/contact-lenses/${item._id}`)
//                     }
//                     className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
//                   >
//                     <div className="flex min-w-0 items-center gap-3">
//                       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
//                         <ContactRound size={16} />
//                       </div>

//                       <div className="min-w-0">
//                         <div className="truncate text-xs font-bold text-slate-900">
//                           {item.orderNumber || "Contact Lens Order"}
//                         </div>

//                         <div className="mt-1 text-[10px] text-slate-400">
//                           {formatDate(item.orderDate)} ·{" "}
//                           {item.brand || item.lensType || "Lens"}
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex shrink-0 items-center gap-3">
//                       <div className="text-right">
//                         <div className="text-xs font-bold text-slate-800">
//                           {formatMoney(item.total)}
//                         </div>

//                         <Status status={item.status} />
//                       </div>

//                       <ChevronRight
//                         size={15}
//                         className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
//                       />
//                     </div>
//                   </button>
//                 )}
//               />
//             </Panel>
//             </section>
//           )}

//           {/* Appointments */}
//           {activeSection === "appointments" && (
//             <section>
//             <Panel
//               title="Appointments"
//               icon={CalendarDays}
//               action={
//                 <button
//                   type="button"
//                   onClick={() =>
//                     navigate(
//                       `/appointments/book?patientId=${patientId}`,
//                     )
//                   }
//                   className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
//                 >
//                   <Plus size={13} />
//                   Book appointment
//                 </button>
//               }
//             >
//               {upcomingAppointments.length > 0 && (
//                 <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
//                   <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
//                     Next appointment
//                   </div>

//                   <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
//                     <div>
//                       <div className="text-sm font-bold text-slate-900">
//                         {formatDate(
//                           upcomingAppointments[0].appointmentDate,
//                         )}
//                       </div>

//                       <div className="mt-1 text-xs text-slate-500">
//                         {new Date(
//                           upcomingAppointments[0].appointmentDate,
//                         ).toLocaleTimeString("en-IN", {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}{" "}
//                         ·{" "}
//                         {upcomingAppointments[0].type ||
//                           "Eye Examination"}
//                       </div>
//                     </div>

//                     <Status
//                       status={
//                         upcomingAppointments[0].status || "scheduled"
//                       }
//                     />
//                   </div>
//                 </div>
//               )}

//               <RecordList
//                 rows={[...appointments].sort(
//                   (a, b) =>
//                     new Date(b.appointmentDate || 0).getTime() -
//                     new Date(a.appointmentDate || 0).getTime(),
//                 )}
//                 empty="No appointments for this patient."
//                 render={(item) => (
//                   <button
//                     type="button"
//                     onClick={() =>
//                       navigate(`/appointments/${item._id}`)
//                     }
//                     className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
//                   >
//                     <div className="flex min-w-0 items-center gap-3">
//                       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
//                         <CalendarDays size={16} />
//                       </div>

//                       <div className="min-w-0">
//                         <div className="truncate text-xs font-bold text-slate-900">
//                           {formatDate(item.appointmentDate)}
//                         </div>

//                         <div className="mt-1 text-[10px] text-slate-400">
//                           {item.type || "Eye Examination"} ·{" "}
//                           {item.reason || "Routine visit"}
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex shrink-0 items-center gap-3">
//                       <div className="text-right">
//                         <div className="text-xs font-bold text-slate-700">
//                           {item.appointmentDate
//                             ? new Date(
//                                 item.appointmentDate,
//                               ).toLocaleTimeString("en-IN", {
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                               })
//                             : "—"}
//                         </div>

//                         <Status status={item.status} />
//                       </div>

//                       <ChevronRight
//                         size={15}
//                         className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
//                       />
//                     </div>
//                   </button>
//                 )}
//               />
//             </Panel>
//             </section>
//           )}

//           {/* Billing */}
//           {activeSection === "billing" && (
//             <section>
//             <Panel
//               title="Billing & payments"
//               icon={Wallet}
//               action={
//                 <button
//                   type="button"
//                   onClick={() =>
//                     navigate(`/billing?patientId=${patientId}`)
//                   }
//                   className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
//                 >
//                   <Plus size={13} />
//                   Create bill
//                 </button>
//               }
//             >
//               <div className="mb-3 grid gap-2 sm:grid-cols-3">
//                 <Stat label="Invoices" value={invoices.length} />

//                 <Stat
//                   label="Paid"
//                   value={formatMoney(totalPaid)}
//                 />

//                 <Stat
//                   label="Outstanding"
//                   value={formatMoney(outstanding)}
//                   warning={outstanding > 0}
//                 />
//               </div>

//               <RecordList
//                 rows={invoices}
//                 empty="No invoices for this patient."
//                 render={(item) => (
//                   <button
//                     type="button"
//                     onClick={() =>
//                       navigate(`/billing/${item._id}`)
//                     }
//                     className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
//                   >
//                     <div className="flex min-w-0 items-center gap-3">
//                       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
//                         <Wallet size={16} />
//                       </div>

//                       <div className="min-w-0">
//                         <div className="truncate text-xs font-bold text-slate-900">
//                           {item.invoiceNumber || "Invoice"}
//                         </div>

//                         <div className="mt-1 text-[10px] text-slate-400">
//                           {formatDate(item.invoiceDate)} ·{" "}
//                           {item.items?.length || 0} item(s)
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex shrink-0 items-center gap-3">
//                       <div className="text-right">
//                         <div className="text-xs font-bold text-slate-800">
//                           {formatMoney(item.total)}
//                         </div>

//                         <div className="mt-1 text-[9px] font-semibold text-slate-500">
//                           Paid {formatMoney(item.paidAmount)} · Balance{" "}
//                           {formatMoney(item.balance)}
//                         </div>

//                         <Status status={item.status} />
//                       </div>

//                       <ChevronRight
//                         size={15}
//                         className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
//                       />
//                     </div>
//                   </button>
//                 )}
//               />
//             </Panel>
//             </section>
//           )}

//           {/* Documents */}
//           {activeSection === "documents" && (
//             <section>
//             <Panel
//               title="Documents"
//               icon={FileText}
//               action={
//                 <button
//                   type="button"
//                   onClick={() => setDocumentOpen(true)}
//                   className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100"
//                 >
//                   Upload
//                 </button>
//               }
//             >
//               <RecordList
//                 rows={documents}
//                 empty="No documents uploaded for this patient."
//                 render={(item) => (
//                   <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50/60">
//                     <div className="flex min-w-0 items-center gap-3">
//                       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
//                         <FileText size={15} />
//                       </div>

//                       <div className="min-w-0">
//                         <div className="truncate text-xs font-bold text-slate-900">
//                           {item.originalName ||
//                             item.filename ||
//                             "Patient document"}
//                         </div>

//                         <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-slate-400">
//                           <span>
//                             {roleLabel(item.category || "other")}
//                           </span>

//                           <span>·</span>

//                           <span>
//                             {formatDate(
//                               item.createdAt || item.uploadedAt,
//                             )}
//                           </span>
//                         </div>

//                         {item.note && (
//                           <div className="mt-1 truncate text-[10px] text-slate-500">
//                             {item.note}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex shrink-0 gap-1.5">
//                       <button
//                         type="button"
//                         onClick={() => void openDocument(item)}
//                         disabled={
//                           documentAction === `open:${item._id}`
//                         }
//                         className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
//                         aria-label="Open document"
//                       >
//                         {documentAction === `open:${item._id}` ? (
//                           <Loader2
//                             size={14}
//                             className="animate-spin"
//                           />
//                         ) : (
//                           <Download size={14} />
//                         )}
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => void removeDocument(item._id)}
//                         disabled={
//                           documentAction === `delete:${item._id}`
//                         }
//                         className="rounded-xl border border-red-100 p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
//                         aria-label="Delete document"
//                       >
//                         {documentAction === `delete:${item._id}` ? (
//                           <Loader2
//                             size={14}
//                             className="animate-spin"
//                           />
//                         ) : (
//                           <Trash2 size={14} />
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               />
//             </Panel>
//             </section>
//           )}
//         </main>
//       </div>

//       {selectedConsultation && (
//         <ConsultationModal
//           consultation={selectedConsultation}
//           loading={loadingConsultation}
//           onClose={() => setSelectedConsultation(null)}
//         />
//       )}

//       {editOpen && (
//         <Modal
//           title="Edit patient"
//           onClose={() => !saving && setEditOpen(false)}
//         >
//           <form onSubmit={savePatient} className="space-y-3">
//             <div className="grid gap-4 sm:grid-cols-2">
//               <Field
//                 label="First name"
//                 value={editForm.firstName}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, firstName: v })
//                 }
//                 required
//               />

//               <Field
//                 label="Middle name"
//                 value={editForm.middleName}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, middleName: v })
//                 }
//               />

//               <Field
//                 label="Last name"
//                 value={editForm.lastName}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, lastName: v })
//                 }
//                 required
//               />

//               <Field
//                 label="Date of birth"
//                 type="date"
//                 value={editForm.dateOfBirth}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, dateOfBirth: v })
//                 }
//               />

//               <Field
//                 label="Gender"
//                 value={editForm.gender}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, gender: v })
//                 }
//                 options={["male", "female", "other"]}
//               />

//               <Field
//                 label="Phone"
//                 value={editForm.phone}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, phone: v })
//                 }
//               />

//               <Field
//                 label="Alternate phone"
//                 value={editForm.alternatePhone}
//                 onChange={(v) =>
//                   setEditForm({
//                     ...editForm,
//                     alternatePhone: v,
//                   })
//                 }
//               />

//               <Field
//                 label="Email"
//                 type="email"
//                 value={editForm.email}
//                 onChange={(v) =>
//                   setEditForm({ ...editForm, email: v })
//                 }
//               />
//             </div>

//             <Field
//               label="Notes"
//               type="textarea"
//               value={editForm.notes}
//               onChange={(v) =>
//                 setEditForm({ ...editForm, notes: v })
//               }
//             />

//             <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
//               <button
//                 type="button"
//                 onClick={() => setEditOpen(false)}
//                 disabled={saving}
//                 className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 disabled={saving}
//                 className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
//               >
//                 {saving && (
//                   <Loader2 size={14} className="animate-spin" />
//                 )}
//                 Save changes
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}

//       {documentOpen && (
//         <Modal
//           title="Upload patient documents"
//           onClose={() => !uploading && setDocumentOpen(false)}
//         >
//           <form onSubmit={uploadDocuments} className="space-y-3">
//             <Field
//               label="Category"
//               value={documentCategory}
//               onChange={setDocumentCategory}
//               options={[
//                 "prescription",
//                 "report",
//                 "invoice",
//                 "photo",
//                 "other",
//               ]}
//             />

//             <label className="block">
//               <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
//                 Files
//               </span>

//               <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-3 transition hover:border-blue-300 hover:bg-blue-50/30">
//                 <input
//                   type="file"
//                   multiple
//                   onChange={(e) =>
//                     setDocumentFiles(
//                       Array.from(e.target.files || []),
//                     )
//                   }
//                   className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
//                 />

//                 {documentFiles.length > 0 && (
//                   <div className="mt-3 text-[10px] font-medium text-slate-500">
//                     {documentFiles.length} file
//                     {documentFiles.length === 1 ? "" : "s"} selected
//                   </div>
//                 )}
//               </div>
//             </label>

//             <Field
//               label="Note"
//               value={documentNote}
//               onChange={setDocumentNote}
//             />

//             <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
//               <button
//                 type="button"
//                 onClick={() => setDocumentOpen(false)}
//                 disabled={uploading}
//                 className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 disabled={!documentFiles.length || uploading}
//                 className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 {uploading && (
//                   <Loader2 size={14} className="animate-spin" />
//                 )}
//                 Upload
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// }

// function Panel({ title, icon: Icon, action, children }) {
//   return (
//     <section className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
//       <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
//         <div className="flex items-center gap-2">
//           <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 text-slate-600 ring-1 ring-slate-200/70">
//             <Icon size={14} strokeWidth={1.8} />
//           </div>

//           <h2 className="text-xs font-bold tracking-tight text-slate-900">
//             {title}
//           </h2>
//         </div>

//         {action}
//       </div>

//       <div className="p-4">{children}</div>
//     </section>
//   );
// }

// function QuickAction({
//   icon: Icon,
//   label,
//   onClick,
//   primary = false,
//   disabled = false,
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={disabled}
//       className={`group relative inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-2.5 text-[9px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
//         primary
//           ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-800"
//           : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
//       }`}
//     >
//       <span
//         className={`flex h-6 w-6 items-center justify-center rounded-md ${
//           primary
//             ? "bg-white/10"
//             : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
//         }`}
//       >
//         <Icon size={14} />
//       </span>

//       {label}
//     </button>
//   );
// }

// function PathStep({
//   done,
//   title,
//   description,
//   onClick,
//   disabled,
// }) {
//   const content = (
//     <>
//       <div
//         className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
//           done
//             ? "bg-emerald-100 text-emerald-700"
//             : "bg-slate-100 text-slate-400"
//         }`}
//       >
//         {done ? "✓" : "•"}
//       </div>

//       <div className="min-w-0 flex-1">
//         <div className="text-xs font-bold text-slate-900">
//           {title}
//         </div>

//         <div className="mt-1 text-[10px] leading-5 text-slate-400">
//           {description}
//         </div>
//       </div>

//       {onClick && (
//         <ChevronRight
//           size={15}
//           className="mt-1 shrink-0 text-slate-300"
//         />
//       )}
//     </>
//   );

//   if (!onClick) {
//     return (
//       <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
//         {content}
//       </div>
//     );
//   }

//   return (
//     <button
//       type="button"
//       disabled={disabled}
//       onClick={onClick}
//       className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
//     >
//       {content}
//     </button>
//   );
// }

// function Stat({ label, value, warning = false }) {
//   return (
//     <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3">
//       <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
//         {label}
//       </div>

//       <div
//         className={`mt-2 text-base font-bold tracking-tight ${
//           warning ? "text-amber-700" : "text-slate-950"
//         }`}
//       >
//         {value}
//       </div>
//     </div>
//   );
// }

// function Info({ label, value }) {
//   return (
//     <div className="min-w-0">
//       <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
//         {label}
//       </div>

//       <div className="mt-1 break-words text-[12px] font-semibold leading-5 text-slate-700">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// function Badge({ label, tone = "slate" }) {
//   return (
//     <span
//       className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-bold ${toneClass(
//         tone,
//       )}`}
//     >
//       {label}
//     </span>
//   );
// }

// function toneClass(tone) {
//   switch (tone) {
//     case "green":
//       return "border-emerald-100 bg-emerald-50 text-emerald-700";

//     case "blue":
//       return "border-blue-100 bg-blue-50 text-blue-700";

//     case "violet":
//       return "border-violet-100 bg-violet-50 text-violet-700";

//     case "amber":
//       return "border-amber-100 bg-amber-50 text-amber-700";

//     default:
//       return "border-slate-200 bg-slate-100 text-slate-600";
//   }
// }

// function Status({ status }) {
//   const normalized = String(status || "pending").toLowerCase();

//   const isPositive = [
//     "paid",
//     "collected",
//     "ready",
//     "completed",
//     "confirmed",
//   ].includes(normalized);

//   const isWarning = [
//     "partially_paid",
//     "notified",
//     "pending",
//     "scheduled",
//   ].includes(normalized);

//   return (
//     <span
//       className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${
//         isPositive
//           ? "border-emerald-100 bg-emerald-50 text-emerald-700"
//           : isWarning
//             ? "border-amber-100 bg-amber-50 text-amber-700"
//             : "border-slate-200 bg-slate-100 text-slate-500"
//       }`}
//     >
//       {roleLabel(normalized)}
//     </span>
//   );
// }

// function RecordList({
//   rows,
//   empty,
//   render,
//   pageSize = DEFAULT_PAGE_SIZE,
//   gridClassName = "space-y-2.5",
// }) {
//   const safeRows = Array.isArray(rows) ? rows : [];
//   const { page, setPage, totalPages, pageRows, startIndex } =
//     usePaginatedRows(safeRows, pageSize);

//   if (!safeRows.length) {
//     return (
//       <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-9 text-center text-xs text-slate-400">
//         {empty}
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className={gridClassName}>
//         {pageRows.map((row, index) => (
//           <div key={row._id || `${startIndex + index}`}>
//             {render(row, startIndex + index)}
//           </div>
//         ))}
//       </div>

//       {totalPages > 1 && (
//         <Pagination
//           page={page}
//           totalPages={totalPages}
//           totalItems={safeRows.length}
//           pageSize={pageSize}
//           onPageChange={setPage}
//         />
//       )}
//     </div>
//   );
// }

// function Pagination({
//   page,
//   totalPages,
//   totalItems,
//   pageSize,
//   onPageChange,
// }) {
//   const start = (page - 1) * pageSize + 1;
//   const end = Math.min(page * pageSize, totalItems);

//   const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
//     .filter(
//       (number) =>
//         number === 1 ||
//         number === totalPages ||
//         Math.abs(number - page) <= 1,
//     );

//   const compactPages = [];
//   pageNumbers.forEach((number, index) => {
//     if (index > 0 && number - pageNumbers[index - 1] > 1) {
//       compactPages.push(`ellipsis-${number}`);
//     }
//     compactPages.push(number);
//   });

//   return (
//     <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
//       <div className="text-[10px] font-medium text-slate-400">
//         Showing <span className="font-bold text-slate-600">{start}</span>–
//         <span className="font-bold text-slate-600">{end}</span> of{" "}
//         <span className="font-bold text-slate-600">{totalItems}</span>
//       </div>

//       <div className="flex items-center gap-1">
//         <button
//           type="button"
//           onClick={() => onPageChange(Math.max(1, page - 1))}
//           disabled={page === 1}
//           className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
//           aria-label="Previous page"
//         >
//           <ChevronLeft size={14} />
//         </button>

//         {compactPages.map((item) =>
//           typeof item === "string" ? (
//             <span key={item} className="flex h-8 w-6 items-center justify-center text-[10px] text-slate-400">
//               …
//             </span>
//           ) : (
//             <button
//               key={item}
//               type="button"
//               onClick={() => onPageChange(item)}
//               className={`h-8 min-w-8 rounded-lg px-2 text-[10px] font-bold transition ${
//                 item === page
//                   ? "bg-slate-950 text-white"
//                   : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
//               }`}
//             >
//               {item}
//             </button>
//           ),
//         )}

//         <button
//           type="button"
//           onClick={() => onPageChange(Math.min(totalPages, page + 1))}
//           disabled={page === totalPages}
//           className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
//           aria-label="Next page"
//         >
//           <ChevronRight size={14} />
//         </button>
//       </div>
//     </div>
//   );
// }

// function Empty({ title, description, action }) {
//   return (
//     <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-7 text-center">
//       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
//         <FileText size={19} />
//       </div>

//       <div className="mt-3 text-xs font-bold text-slate-800">
//         {title}
//       </div>

//       <div className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
//         {description}
//       </div>

//       {action && (
//         <button
//           type="button"
//           onClick={action}
//           className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
//         >
//           <Plus size={14} />
//           Start now
//         </button>
//       )}
//     </div>
//   );
// }

// function ConsultationModal({
//   consultation,
//   loading,
//   onClose,
// }) {
//   const rx = consultation?.givenRx || consultation?.finalRx || {};

//   return (
//     <Modal
//       title={`${consultationLabel(consultation)} · ${formatDate(
//         consultation.consultationDate,
//       )}`}
//       onClose={onClose}
//     >
//       <div className="space-y-3">
//         {loading ? (
//           <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
//             <Loader2 size={15} className="animate-spin" />
//             Loading consultation...
//           </div>
//         ) : (
//           <>
//             <div className="grid gap-3 sm:grid-cols-3">
//               <Info
//                 label="Type"
//                 value={consultationLabel(consultation)}
//               />

//               <Info
//                 label="Clinician"
//                 value={
//                   [
//                     consultation.optometristId?.firstName,
//                     consultation.optometristId?.lastName,
//                   ]
//                     .filter(Boolean)
//                     .join(" ") || "Clinical team"
//                 }
//               />

//               <Info
//                 label="Status"
//                 value={roleLabel(
//                   consultation.status || "completed",
//                 )}
//               />
//             </div>

//             <div className="overflow-hidden rounded-xl border border-slate-200">
//               <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
//                 Prescription
//               </div>

//               <div className="grid grid-cols-3 text-xs">
//                 <div className="border-r border-slate-200 p-2.5 font-bold">
//                   Eye
//                 </div>

//                 <div className="border-r border-slate-200 p-2.5 font-bold">
//                   OD
//                 </div>

//                 <div className="p-2.5 font-bold">OS</div>

//                 {["sphere", "cylinder", "axis", "va", "add"].map(
//                   (key) => (
//                     <Fragment key={key}>
//                       <div className="border-r border-t border-slate-200 p-2 text-slate-500">
//                         {roleLabel(key)}
//                       </div>

//                       <div className="border-r border-t border-slate-200 p-3">
//                         {rx.right?.[key] || "—"}
//                       </div>

//                       <div className="border-t border-slate-200 p-3">
//                         {rx.left?.[key] || "—"}
//                       </div>
//                     </Fragment>
//                   ),
//                 )}
//               </div>
//             </div>

//             <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
//               <Info
//                 label="Notes"
//                 value={
//                   consultation.notes ||
//                   consultation.clinicalNotes ||
//                   "No clinical notes recorded."
//                 }
//               />
//             </div>
//           </>
//         )}
//       </div>
//     </Modal>
//   );
// }

// function Modal({ title, onClose, children }) {
//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-5">
//       <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
//         <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
//           <h2 className="text-base font-bold tracking-tight text-slate-900">
//             {title}
//           </h2>

//           <button
//             type="button"
//             onClick={onClose}
//             className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
//             aria-label="Close"
//           >
//             <X size={15} />
//           </button>
//         </div>

//         <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-4">
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// }

// function Field({
//   label,
//   value,
//   onChange,
//   type = "text",
//   options,
//   required = false,
// }) {
//   const labelClass =
//     "mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400";

//   const inputClass =
//     "w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

//   if (options) {
//     return (
//       <label className="block">
//         <span className={labelClass}>{label}</span>

//         <select
//           required={required}
//           value={value || ""}
//           onChange={(e) => onChange(e.target.value)}
//           className={`h-9 ${inputClass}`}
//         >
//           <option value="">Select {label}</option>

//           {options.map((option) => (
//             <option key={option} value={option}>
//               {roleLabel(option)}
//             </option>
//           ))}
//         </select>
//       </label>
//     );
//   }

//   if (type === "textarea") {
//     return (
//       <label className="block">
//         <span className={labelClass}>{label}</span>

//         <textarea
//           required={required}
//           value={value || ""}
//           onChange={(e) => onChange(e.target.value)}
//           rows={3}
//           className={`resize-none py-2 ${inputClass}`}
//         />
//       </label>
//     );
//   }

//   return (
//     <label className="block">
//       <span className={labelClass}>{label}</span>

//       <input
//         required={required}
//         type={type}
//         value={value || ""}
//         onChange={(e) => onChange(e.target.value)}
//         className={`h-9 ${inputClass}`}
//       />
//     </label>
//   );
// }

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  ContactRound,
  Download,
  Edit3,
  FileText,
  Glasses,
  History,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Stethoscope,
  Trash2,
  Upload,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getPatient, updatePatient } from "../patient.api";

import {
  uploadPatientDocument,
  getPatientDocuments,
  deletePatientDocument,
  openPatientDocument,
} from "../patient.documents.api.js";

import {
  getPatientConsultations,
  getConsultation,
} from "../../clinical/consultation.api";

import { getPatientSpectacles } from "../../optical/spectacle.api";
import { getPatientContactLenses } from "../../contactLenses/contactLens.api";

import { getDispensingList } from "../../dispensing/dispensing.api";
import { getInvoices } from "../../billing/billing.api";
import { getAppointments } from "../../appointments/appointment.api";

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

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

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const calculateAge = (dob) => {
  if (!dob) return null;

  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const month = now.getMonth() - birth.getMonth();

  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const roleLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getPatientData = (response) =>
  response?.data?.patient || response?.data || response?.patient || null;

const getRows = (response) =>
  Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : [];

const consultationLabel = (item) => {
  const type = String(item?.consultationType || "").toLowerCase();

  if (type === "short_consult") {
    return "Short Consultation";
  }

  if (type === "comprehensive") {
    return "Comprehensive Consultation";
  }

  if (
    type === "binocular_vision" ||
    item?.specializedType === "binocular_vision"
  ) {
    return "Binocular Vision";
  }

  if (type === "low_vision" || item?.specializedType === "low_vision") {
    return "Low Vision";
  }

  if (
    type === "contact_lens" ||
    type === "contact_lenses" ||
    item?.specializedType === "contact_lens" ||
    item?.specializedType === "contact_lenses"
  ) {
    return "Contact Lens Consultation";
  }

  if (type === "specialized") {
    return roleLabel(item.specializedType || "specialized");
  }

  return "Consultation";
};

const consultationTone = (item) => {
  const type = String(item?.consultationType || "").toLowerCase();

  if (
    type === "binocular_vision" ||
    type === "low_vision" ||
    type === "contact_lens" ||
    type === "contact_lenses" ||
    type === "specialized"
  ) {
    return "violet";
  }

  if (type === "short_consult") {
    return "amber";
  }

  return "blue";
};

const initialEdit = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  source: "",
  notes: "",
};

const sections = [
  ["overview", "Overview"],
  ["consultations", "Consultations"],
  ["optical", "Dispensing"],
  ["appointments", "Appointments"],
  ["billing", "Billing"],
  ["documents", "Documents"],
];

const DEFAULT_PAGE_SIZE = 8;

function usePaginatedRows(rows = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    totalPages,
    pageRows: rows.slice(start, start + pageSize),
    startIndex: start,
  };
}

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);

  const [consultations, setConsultations] = useState([]);
  const [spectacles, setSpectacles] = useState([]);
  const [contactLenses, setContactLenses] = useState([]);
  const [dispensing, setDispensing] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [loadingConsultation, setLoadingConsultation] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState(initialEdit);

  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentCategory, setDocumentCategory] = useState("other");
  const [documentNote, setDocumentNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documentAction, setDocumentAction] = useState("");

  const age = useMemo(
    () => calculateAge(patient?.dateOfBirth),
    [patient?.dateOfBirth],
  );

  const completedComprehensive = useMemo(
    () =>
      consultations.some(
        (item) =>
          item.consultationType === "comprehensive" &&
          (item.status === "completed" || !item.status),
      ),
    [consultations],
  );

  const shortConsultations = useMemo(
    () =>
      consultations.filter((item) => item.consultationType === "short_consult"),
    [consultations],
  );

  const binocularVisionHistory = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.consultationType === "binocular_vision" ||
          item.specializedType === "binocular_vision",
      ),
    [consultations],
  );

  const lowVisionHistory = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.consultationType === "low_vision" ||
          item.specializedType === "low_vision",
      ),
    [consultations],
  );

  const contactLensConsultationHistory = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.consultationType === "contact_lens" ||
          item.consultationType === "contact_lenses" ||
          item.specializedType === "contact_lens" ||
          item.specializedType === "contact_lenses",
      ),
    [consultations],
  );

  const latestConsultation = consultations[0] || null;

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance || 0),
    0,
  );

  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.paidAmount || 0),
    0,
  );

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((item) => {
        if (!item?.appointmentDate) return false;

        const date = new Date(item.appointmentDate);

        return !Number.isNaN(date.getTime()) && date >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime(),
      );
  }, [appointments]);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!patientId) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const results = await Promise.allSettled([
          getPatient(patientId),
          getPatientConsultations(patientId),
          getPatientSpectacles(patientId),
          getPatientContactLenses(patientId),
          getDispensingList({ patientId }),
          getInvoices({ patientId }),
          getAppointments({ patientId }),
          getPatientDocuments(patientId),
        ]);

        const patientResult = results[0];

        if (patientResult.status === "rejected") {
          throw patientResult.reason;
        }

        const patientData = getPatientData(patientResult.value);

        if (!patientData) {
          throw new Error("Patient record not found");
        }

        setPatient(patientData);

        setEditForm({
          ...initialEdit,
          firstName: patientData.firstName || "",
          middleName: patientData.middleName || "",
          lastName: patientData.lastName || "",
          dateOfBirth: patientData.dateOfBirth
            ? new Date(patientData.dateOfBirth).toISOString().slice(0, 10)
            : "",
          gender: patientData.gender || "",
          phone: patientData.phone || "",
          alternatePhone: patientData.alternatePhone || "",
          email: patientData.email || "",
          source: patientData.source || "",
          notes: patientData.notes || "",
        });

        const value = (index) =>
          results[index].status === "fulfilled" ? results[index].value : null;

        const consultationRows = getRows(value(1));

        const spectacleRows = getRows(value(2));

        const contactRows = getRows(value(3));

        const dispensingRows = getRows(value(4));

        const invoiceRows = getRows(value(5));

        const appointmentRows = getRows(value(6));

        const documentRows = Array.isArray(value(7))
          ? value(7)
          : getRows(value(7));

        setConsultations(consultationRows);

        setSpectacles(spectacleRows);

        setContactLenses(contactRows);

        setDispensing(dispensingRows);

        setInvoices(invoiceRows);

        setAppointments(appointmentRows);

        setDocuments(documentRows);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load patient workspace",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  /*
   * ----------------------------------------------------------
   * CONSULTATION NAVIGATION
   * ----------------------------------------------------------
   *
   * These are clinical consultation pages.
   *
   * They are intentionally NOT routed through dispensing.
   */

  const startComprehensiveConsultation = () => {
    navigate(`/patients/${patientId}/consultations/new?type=comprehensive`);
  };

  const startShortConsultation = () => {
    navigate(`/patients/${patientId}/consultations/new?type=short_consult`);
  };

  const startBinocularVisionConsultation = () => {
    navigate(`/patients/${patientId}/consultations/binocular-vision`);
  };

  const startLowVisionConsultation = () => {
    navigate(`/patients/${patientId}/consultations/low-vision`);
  };

  const startContactLensConsultation = () => {
    navigate(`/patients/${patientId}/consultations/contact-lens`);
  };

  /*
   * ----------------------------------------------------------
   * DISPENSING NAVIGATION
   * ----------------------------------------------------------
   *
   * These are orders/jobs.
   *
   * They must NEVER open a consultation page.
   */

  const startSpectacleJob = () => {
    navigate(`/dispensing/spectacles/new/${patientId}`);
  };

  const startContactLensOrder = () => {
    navigate(`/dispensing/contact-lenses/new?patientId=${patientId}`);
  };

  const startConsultation = () => {
    startComprehensiveConsultation();
  };

  const openConsultation = async (consultation) => {
    setLoadingConsultation(true);
    setError("");

    try {
      const response = await getConsultation(consultation._id);

      setSelectedConsultation(
        response?.data?.consultation ||
          response?.data ||
          response?.consultation ||
          consultation,
      );
    } catch {
      setSelectedConsultation(consultation);
    } finally {
      setLoadingConsultation(false);
    }
  };

  const savePatient = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await updatePatient(patientId, {
        ...editForm,
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        alternatePhone: editForm.alternatePhone.trim(),
        email: editForm.email.trim().toLowerCase(),
        notes: editForm.notes.trim(),
      });

      const updated = getPatientData(response);

      if (updated) {
        setPatient(updated);
      }

      setEditOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update patient");
    } finally {
      setSaving(false);
    }
  };

  const uploadDocuments = async (event) => {
    event.preventDefault();

    if (!documentFiles.length || uploading) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of documentFiles) {
        await uploadPatientDocument(patientId, {
          file,
          category: documentCategory,
          note: documentNote.trim(),
        });
      }

      setDocumentFiles([]);
      setDocumentNote("");
      setDocumentOpen(false);

      await load({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to upload document");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (documentId) => {
    if (!documentId || documentAction) {
      return;
    }

    if (!window.confirm("Delete this patient document?")) {
      return;
    }

    setDocumentAction(`delete:${documentId}`);

    try {
      await deletePatientDocument(patientId, documentId);

      await load({
        silent: true,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete document");
    } finally {
      setDocumentAction("");
    }
  };

  const openDocument = async (document) => {
    if (!document?._id || documentAction) {
      return;
    }

    setDocumentAction(`open:${document._id}`);

    try {
      await openPatientDocument(patientId, document);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to open document");
    } finally {
      setDocumentAction("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f8fb]">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Loading patient workspace...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Patient record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-12 text-slate-800">
      <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-4 lg:px-5">
        {/* ================================================== */}
        {/* TOP TOOLBAR */}
        {/* ================================================== */}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void load({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setDocumentOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Upload size={14} />
              Documents
            </button>

            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Edit3 size={14} />
              Edit patient
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700 shadow-sm">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* PATIENT HEADER */}
        {/* ================================================== */}

        <header className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 px-4 py-4 sm:px-5">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-violet-100/30 blur-3xl" />

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* Identity */}

              <div className="flex min-w-0 items-start gap-4">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-700 text-lg font-bold text-white shadow-xl shadow-slate-900/15">
                    {(patient.firstName?.[0] || "P").toUpperCase()}
                    {(patient.lastName?.[0] || "").toUpperCase()}
                  </div>

                  <span
                    className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full border-[3px] border-white ${
                      patient.status === "inactive"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700">
                      Patient
                    </span>

                    {patient.patientNumber && (
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        #{patient.patientNumber}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {fullName(patient) || "Unnamed Patient"}
                  </h1>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                    {age !== null && (
                      <span className="font-medium">{age} years</span>
                    )}

                    {patient.gender && (
                      <>
                        <span className="text-slate-300">•</span>

                        <span>{roleLabel(patient.gender)}</span>
                      </>
                    )}

                    {patient.phone && (
                      <>
                        <span className="text-slate-300">•</span>

                        <span>{patient.phone}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge
                      label={
                        patient.status === "inactive" ? "Inactive" : "Active"
                      }
                      tone={patient.status === "inactive" ? "amber" : "green"}
                    />

                    <Badge
                      label={`${consultations.length} consultations`}
                      tone="blue"
                    />

                    <Badge
                      label={`${invoices.length} invoices`}
                      tone="violet"
                    />

                    {outstanding > 0 && (
                      <Badge
                        label={`${formatMoney(outstanding)} outstanding`}
                        tone="amber"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* QUICK ACTIONS */}
              {/* ================================================== */}

              <div className="grid w-full gap-1.5 sm:grid-cols-2 xl:w-[560px] xl:grid-cols-4">
                {/* Clinical consultation */}
                <QuickAction
                  icon={ClipboardPlus}
                  label="Start Consultation"
                  onClick={startComprehensiveConsultation}
                  primary
                />

                {/* Spectacle ORDER/JOB */}
                <QuickAction
                  icon={Glasses}
                  label="New Spectacle Job"
                  onClick={startSpectacleJob}
                />

                {/* Contact Lens ORDER */}
                <QuickAction
                  icon={ContactRound}
                  label="Contact Lens Order"
                  onClick={startContactLensOrder}
                />

                <QuickAction
                  icon={Receipt}
                  label="Create Bill"
                  onClick={() => navigate(`/billing?patientId=${patientId}`)}
                />
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* SECTION NAVIGATION */}
          {/* ================================================== */}

          <nav className="flex gap-0.5 overflow-x-auto border-t border-slate-200 bg-white px-2 py-1.5 sm:px-3">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[9px] font-bold transition-all duration-200 ${
                  activeSection === id
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{label}</span>

                {id !== "overview" && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[8px] ${
                      activeSection === id
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {id === "consultations"
                      ? consultations.length
                      : id === "optical"
                        ? spectacles.length + contactLenses.length
                        : id === "appointments"
                          ? appointments.length
                          : id === "billing"
                            ? invoices.length
                            : documents.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <main className="mt-3 space-y-2">
          {/* ================================================== */}
          {/* OVERVIEW */}
          {/* ================================================== */}

          {activeSection === "overview" && (
            <section className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
              <Panel title="Patient overview" icon={UserRound}>
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Info
                    label="Date of birth"
                    value={formatDate(patient.dateOfBirth)}
                  />

                  <Info
                    label="Age"
                    value={age === null ? "—" : `${age} years`}
                  />

                  <Info
                    label="Gender"
                    value={patient.gender ? roleLabel(patient.gender) : "—"}
                  />

                  <Info label="Phone" value={patient.phone || "—"} />

                  <Info
                    label="Alternate phone"
                    value={patient.alternatePhone || "—"}
                  />

                  <Info label="Email" value={patient.email || "—"} />

                  <Info
                    label="Source"
                    value={patient.source ? roleLabel(patient.source) : "—"}
                  />

                  <Info
                    label="Last consultation"
                    value={formatDate(
                      patient.lastConsultationAt ||
                        latestConsultation?.consultationDate,
                    )}
                  />

                  <Info
                    label="Next recall"
                    value={formatDate(patient.nextRecallAt)}
                  />
                </div>

                {patient.notes && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Patient notes
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                      {patient.notes}
                    </p>
                  </div>
                )}
              </Panel>

              {/* ================================================== */}
              {/* CARE PATHWAY */}
              {/* ================================================== */}
              <Panel title="Care pathway" icon={Stethoscope}>
                <div className="space-y-3">
                  {/* =====================================================
        PRIMARY CONSULTATION
    ===================================================== */}

                  <PathStep
                    done={completedComprehensive}
                    title="Comprehensive Consultation"
                    description={
                      completedComprehensive
                        ? "Completed. Additional clinical consultations are available."
                        : "Full clinical examination, refraction, diagnosis and advice."
                    }
                    onClick={
                      completedComprehensive ? undefined : startConsultation
                    }
                  />

                  <PathStep
                    done={consultations.some(
                      (item) => item.consultationType === "short_consult",
                    )}
                    title="Short Consultation"
                    description="Focused clinical consultation for repeat or limited visits."
                    onClick={startConsultation}
                  />

                  {/* =====================================================
        SPECIALIZED CLINICAL CONSULTATIONS
    ===================================================== */}

                  <div className="pt-3">
                    <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Specialized clinical consultations
                    </div>

                    <div className="space-y-2">
                      <PathStep
                        done={consultations.some(
                          (item) =>
                            item.consultationType === "specialized" &&
                            item.specializedType === "binocular_vision",
                        )}
                        title="Binocular Vision"
                        description="Binocular, accommodation and vergence assessment."
                        onClick={() => startSpecialized("binocular_vision")}
                        disabled={!completedComprehensive}
                      />

                      <PathStep
                        done={consultations.some(
                          (item) =>
                            item.consultationType === "specialized" &&
                            item.specializedType === "low_vision",
                        )}
                        title="Low Vision"
                        description="Low vision assessment, aids and management."
                        onClick={() => startSpecialized("low_vision")}
                        disabled={!completedComprehensive}
                      />

                      <PathStep
                        done={consultations.some(
                          (item) =>
                            item.consultationType === "specialized" &&
                            item.specializedType === "contact_lenses",
                        )}
                        title="Contact Lens Consultation"
                        description="Clinical contact lens assessment and fitting."
                        onClick={() => startSpecialized("contact_lenses")}
                        disabled={!completedComprehensive}
                      />
                    </div>
                  </div>

                  {/* =====================================================
        DISPENSING
    ===================================================== */}

                  <div className="pt-3">
                    <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Dispensing
                    </div>

                    <div className="space-y-2">
                      <PathStep
                        title="Spectacle Job"
                        description="Create a spectacle dispensing job from a clinical prescription."
                        onClick={() =>
                          navigate(`/dispensing/spectacles/new/${patientId}`)
                        }
                      />

                      <PathStep
                        title="Contact Lens Job"
                        description="Create a contact lens dispensing order."
                        onClick={() =>
                          navigate(
                            `/dispensing/contact-lenses/new/${patientId}`,
                          )
                        }
                      />

                      <PathStep
                        title="Sundries"
                        description="Add optical accessories and other dispensing items."
                        onClick={() =>
                          navigate(
                            `/dispensing/sundries?patientId=${patientId}`,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* CONSULTATION HISTORY */}
          {/* ================================================== */}

          {activeSection === "consultations" && (
            <section>
              <Panel
                title="Consultation history"
                icon={History}
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startShortConsultation}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={13} />
                      Short
                    </button>

                    <button
                      type="button"
                      onClick={startComprehensiveConsultation}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Plus size={13} />
                      New consultation
                    </button>
                  </div>
                }
              >
                {consultations.length === 0 ? (
                  <Empty
                    title="No consultations yet"
                    description="Start the patient's first clinical consultation."
                    action={startComprehensiveConsultation}
                  />
                ) : (
                  <div className="space-y-3">
                    <RecordList
                      rows={consultations}
                      pageSize={6}
                      gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                      render={(item, index) => (
                        <button
                          type="button"
                          onClick={() => void openConsultation(item)}
                          className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                            index === 0
                              ? "border-blue-200 bg-blue-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              {index === 0 ? "Latest" : "Consultation"}
                            </span>

                            <ChevronRight
                              size={13}
                              className="text-slate-300 transition-transform group-hover:translate-x-0.5"
                            />
                          </div>

                          <div className="mt-3 text-sm font-bold tracking-tight text-slate-950">
                            {formatDate(item.consultationDate)}
                          </div>

                          <div
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${toneClass(
                              consultationTone(item),
                            )}`}
                          >
                            {consultationLabel(item)}
                          </div>

                          <div className="mt-3 text-[9px] text-slate-400">
                            {item.optometristId
                              ? [
                                  item.optometristId.firstName,
                                  item.optometristId.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ")
                              : "Clinical team"}
                          </div>
                        </button>
                      )}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <Stat label="Total" value={consultations.length} />

                      <Stat
                        label="Comprehensive"
                        value={
                          consultations.filter(
                            (x) => x.consultationType === "comprehensive",
                          ).length
                        }
                      />

                      <Stat label="Short" value={shortConsultations.length} />

                      <Stat
                        label="Specialized"
                        value={
                          binocularVisionHistory.length +
                          lowVisionHistory.length +
                          contactLensConsultationHistory.length
                        }
                      />

                      <Stat
                        label="Latest"
                        value={formatDate(latestConsultation?.consultationDate)}
                      />
                    </div>
                  </div>
                )}
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* DISPENSING */}
          {/* ================================================== */}

          {activeSection === "optical" && (
            <section className="grid gap-3 xl:grid-cols-2">
              {/* ================================================== */}
              {/* SPECTACLE HISTORY */}
              {/* ================================================== */}

              <Panel
                title="Spectacle history"
                icon={Glasses}
                action={
                  <button
                    type="button"
                    onClick={startSpectacleJob}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    New spectacle job
                  </button>
                }
              >
                <RecordList
                  rows={spectacles}
                  empty="No spectacle jobs for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dispensing/spectacles/${item._id}`)
                      }
                      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Glasses size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.jobNumber || "Spectacle Job"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {formatDate(item.jobDate)} ·{" "}
                            {item.frame?.description ||
                              item.frame?.code ||
                              "Frame pending"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {formatMoney(
                              Number(item.frame?.price || 0) +
                                Number(item.lens?.price || 0) +
                                (item.extras || []).reduce(
                                  (a, x) => a + Number(x.price || 0),
                                  0,
                                ) -
                                Number(item.discount || 0),
                            )}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>

              {/* ================================================== */}
              {/* CONTACT LENS ORDERS */}
              {/* ================================================== */}

              <Panel
                title="Contact lens orders"
                icon={ContactRound}
                action={
                  <button
                    type="button"
                    onClick={startContactLensOrder}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    New contact lens order
                  </button>
                }
              >
                <RecordList
                  rows={contactLenses}
                  empty="No contact lens orders for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dispensing/contact-lenses/${item._id}`)
                      }
                      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <ContactRound size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.orderNumber || "Contact Lens Order"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {formatDate(item.orderDate)} ·{" "}
                            {item.brand || item.lensType || "Lens"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {formatMoney(item.total)}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* APPOINTMENTS */}
          {/* ================================================== */}

          {activeSection === "appointments" && (
            <section>
              <Panel
                title="Appointments"
                icon={CalendarDays}
                action={
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/appointments/book?patientId=${patientId}`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Plus size={13} />
                    Book appointment
                  </button>
                }
              >
                {upcomingAppointments.length > 0 && (
                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
                      Next appointment
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {formatDate(upcomingAppointments[0].appointmentDate)}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(
                            upcomingAppointments[0].appointmentDate,
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {upcomingAppointments[0].type || "Eye Examination"}
                        </div>
                      </div>

                      <Status
                        status={upcomingAppointments[0].status || "scheduled"}
                      />
                    </div>
                  </div>
                )}

                <RecordList
                  rows={[...appointments].sort(
                    (a, b) =>
                      new Date(b.appointmentDate || 0).getTime() -
                      new Date(a.appointmentDate || 0).getTime(),
                  )}
                  empty="No appointments for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/appointments/${item._id}`)}
                      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <CalendarDays size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {formatDate(item.appointmentDate)}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {item.type || "Eye Examination"} ·{" "}
                            {item.reason || "Routine visit"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-700">
                            {item.appointmentDate
                              ? new Date(
                                  item.appointmentDate,
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* BILLING */}
          {/* ================================================== */}

          {activeSection === "billing" && (
            <section>
              <Panel
                title="Billing & payments"
                icon={Wallet}
                action={
                  <button
                    type="button"
                    onClick={() => navigate(`/billing?patientId=${patientId}`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Plus size={13} />
                    Create bill
                  </button>
                }
              >
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  <Stat label="Invoices" value={invoices.length} />

                  <Stat label="Paid" value={formatMoney(totalPaid)} />

                  <Stat
                    label="Outstanding"
                    value={formatMoney(outstanding)}
                    warning={outstanding > 0}
                  />
                </div>

                <RecordList
                  rows={invoices}
                  empty="No invoices for this patient."
                  render={(item) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/billing/${item._id}`)}
                      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <Wallet size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.invoiceNumber || "Invoice"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {formatDate(item.invoiceDate)} ·{" "}
                            {item.items?.length || 0} item(s)
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {formatMoney(item.total)}
                          </div>

                          <div className="mt-1 text-[9px] font-semibold text-slate-500">
                            Paid {formatMoney(item.paidAmount)} · Balance{" "}
                            {formatMoney(item.balance)}
                          </div>

                          <Status status={item.status} />
                        </div>

                        <ChevronRight
                          size={15}
                          className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                        />
                      </div>
                    </button>
                  )}
                />
              </Panel>
            </section>
          )}

          {/* ================================================== */}
          {/* DOCUMENTS */}
          {/* ================================================== */}

          {activeSection === "documents" && (
            <section>
              <Panel
                title="Documents"
                icon={FileText}
                action={
                  <button
                    type="button"
                    onClick={() => setDocumentOpen(true)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    Upload
                  </button>
                }
              >
                <RecordList
                  rows={documents}
                  empty="No documents uploaded for this patient."
                  render={(item) => (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50/60">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <FileText size={15} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {item.originalName ||
                              item.filename ||
                              "Patient document"}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                            <span>{roleLabel(item.category || "other")}</span>

                            <span>·</span>

                            <span>
                              {formatDate(item.createdAt || item.uploadedAt)}
                            </span>
                          </div>

                          {item.note && (
                            <div className="mt-1 truncate text-[10px] text-slate-500">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openDocument(item)}
                          disabled={documentAction === `open:${item._id}`}
                          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                          aria-label="Open document"
                        >
                          {documentAction === `open:${item._id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void removeDocument(item._id)}
                          disabled={documentAction === `delete:${item._id}`}
                          className="rounded-xl border border-red-100 p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label="Delete document"
                        >
                          {documentAction === `delete:${item._id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                />
              </Panel>
            </section>
          )}
        </main>
      </div>

      {/* ================================================== */}
      {/* CONSULTATION MODAL */}
      {/* ================================================== */}

      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          loading={loadingConsultation}
          onClose={() => setSelectedConsultation(null)}
        />
      )}

      {/* ================================================== */}
      {/* EDIT PATIENT */}
      {/* ================================================== */}

      {editOpen && (
        <Modal
          title="Edit patient"
          onClose={() => !saving && setEditOpen(false)}
        >
          <form onSubmit={savePatient} className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                value={editForm.firstName}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    firstName: v,
                  })
                }
                required
              />

              <Field
                label="Middle name"
                value={editForm.middleName}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    middleName: v,
                  })
                }
              />

              <Field
                label="Last name"
                value={editForm.lastName}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    lastName: v,
                  })
                }
                required
              />

              <Field
                label="Date of birth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    dateOfBirth: v,
                  })
                }
              />

              <Field
                label="Gender"
                value={editForm.gender}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    gender: v,
                  })
                }
                options={["male", "female", "other"]}
              />

              <Field
                label="Phone"
                value={editForm.phone}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    phone: v,
                  })
                }
              />

              <Field
                label="Alternate phone"
                value={editForm.alternatePhone}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    alternatePhone: v,
                  })
                }
              />

              <Field
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(v) =>
                  setEditForm({
                    ...editForm,
                    email: v,
                  })
                }
              />
            </div>

            <Field
              label="Notes"
              type="textarea"
              value={editForm.notes}
              onChange={(v) =>
                setEditForm({
                  ...editForm,
                  notes: v,
                })
              }
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================================================== */}
      {/* DOCUMENT UPLOAD */}
      {/* ================================================== */}

      {documentOpen && (
        <Modal
          title="Upload patient documents"
          onClose={() => !uploading && setDocumentOpen(false)}
        >
          <form onSubmit={uploadDocuments} className="space-y-3">
            <Field
              label="Category"
              value={documentCategory}
              onChange={setDocumentCategory}
              options={["prescription", "report", "invoice", "photo", "other"]}
            />

            <label className="block">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Files
              </span>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-3 transition hover:border-blue-300 hover:bg-blue-50/30">
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setDocumentFiles(Array.from(e.target.files || []))
                  }
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                />

                {documentFiles.length > 0 && (
                  <div className="mt-3 text-[10px] font-medium text-slate-500">
                    {documentFiles.length} file
                    {documentFiles.length === 1 ? "" : "s"} selected
                  </div>
                )}
              </div>
            </label>

            <Field
              label="Note"
              value={documentNote}
              onChange={setDocumentNote}
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setDocumentOpen(false)}
                disabled={uploading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!documentFiles.length || uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading && <Loader2 size={14} className="animate-spin" />}
                Upload
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   PANEL
============================================================ */

function Panel({ title, icon: Icon, action, children }) {
  return (
    <section className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 text-slate-600 ring-1 ring-slate-200/70">
            <Icon size={14} strokeWidth={1.8} />
          </div>

          <h2 className="text-xs font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>

        {action}
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon: Icon,
  label,
  onClick,
  primary = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-2.5 text-[9px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md ${
          primary
            ? "bg-white/10"
            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
        }`}
      >
        <Icon size={14} />
      </span>

      {label}
    </button>
  );
}

/* ============================================================
   CARE PATHWAY STEP
============================================================ */

function PathStep({ done, title, description, onClick, disabled = false }) {
  const content = (
    <>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? "✓" : "•"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-900">{title}</div>

        <div className="mt-1 text-[10px] leading-5 text-slate-400">
          {description}
        </div>
      </div>

      {onClick && (
        <ChevronRight
          size={15}
          className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </>
  );

  if (!onClick) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      {content}
    </button>
  );
}

/* ============================================================
   STAT
============================================================ */

function Stat({ label, value, warning = false }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div
        className={`mt-2 text-base font-bold tracking-tight ${
          warning ? "text-amber-700" : "text-slate-950"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   INFO
============================================================ */

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words text-[12px] font-semibold leading-5 text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/* ============================================================
   BADGE
============================================================ */

function Badge({ label, tone = "slate" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-bold ${toneClass(
        tone,
      )}`}
    >
      {label}
    </span>
  );
}

function toneClass(tone) {
  switch (tone) {
    case "green":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "blue":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "violet":
      return "border-violet-100 bg-violet-50 text-violet-700";

    case "amber":
      return "border-amber-100 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

/* ============================================================
   STATUS
============================================================ */

function Status({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const isPositive = [
    "paid",
    "collected",
    "ready",
    "completed",
    "confirmed",
  ].includes(normalized);

  const isWarning = [
    "partially_paid",
    "notified",
    "pending",
    "scheduled",
  ].includes(normalized);

  return (
    <span
      className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${
        isPositive
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : isWarning
            ? "border-amber-100 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      {roleLabel(normalized)}
    </span>
  );
}

/* ============================================================
   RECORD LIST
============================================================ */

function RecordList({
  rows,
  empty,
  render,
  pageSize = DEFAULT_PAGE_SIZE,
  gridClassName = "space-y-2.5",
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const { page, setPage, totalPages, pageRows, startIndex } = usePaginatedRows(
    safeRows,
    pageSize,
  );

  if (!safeRows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-9 text-center text-xs text-slate-400">
        {empty}
      </div>
    );
  }

  return (
    <div>
      <div className={gridClassName}>
        {pageRows.map((row, index) => (
          <div key={row._id || `${startIndex + index}`}>
            {render(row, startIndex + index)}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={safeRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ============================================================
   PAGINATION
============================================================ */

function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const start = (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalItems);

  const pageNumbers = Array.from(
    {
      length: totalPages,
    },
    (_, index) => index + 1,
  ).filter(
    (number) =>
      number === 1 || number === totalPages || Math.abs(number - page) <= 1,
  );

  const compactPages = [];

  pageNumbers.forEach((number, index) => {
    if (index > 0 && number - pageNumbers[index - 1] > 1) {
      compactPages.push(`ellipsis-${number}`);
    }

    compactPages.push(number);
  });

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[10px] font-medium text-slate-400">
        Showing <span className="font-bold text-slate-600">{start}</span>–
        <span className="font-bold text-slate-600">{end}</span> of{" "}
        <span className="font-bold text-slate-600">{totalItems}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {compactPages.map((item) =>
          typeof item === "string" ? (
            <span
              key={item}
              className="flex h-8 w-6 items-center justify-center text-[10px] text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`h-8 min-w-8 rounded-lg px-2 text-[10px] font-bold transition ${
                item === page
                  ? "bg-slate-950 text-white"
                  : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function Empty({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-7 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <FileText size={19} />
      </div>

      <div className="mt-3 text-xs font-bold text-slate-800">{title}</div>

      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </div>

      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={14} />
          Start now
        </button>
      )}
    </div>
  );
}

/* ============================================================
   CONSULTATION MODAL
============================================================ */

function ConsultationModal({ consultation, loading, onClose }) {
  const rx = consultation?.givenRx || consultation?.finalRx || {};

  return (
    <Modal
      title={`${consultationLabel(consultation)} · ${formatDate(
        consultation.consultationDate,
      )}`}
      onClose={onClose}
    >
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            Loading consultation...
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Type" value={consultationLabel(consultation)} />

              <Info
                label="Clinician"
                value={
                  [
                    consultation.optometristId?.firstName,
                    consultation.optometristId?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Clinical team"
                }
              />

              <Info
                label="Status"
                value={roleLabel(consultation.status || "completed")}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Prescription
              </div>

              <div className="grid grid-cols-3 text-xs">
                <div className="border-r border-slate-200 p-2.5 font-bold">
                  Eye
                </div>

                <div className="border-r border-slate-200 p-2.5 font-bold">
                  OD
                </div>

                <div className="p-2.5 font-bold">OS</div>

                {["sphere", "cylinder", "axis", "va", "add"].map((key) => (
                  <Fragment key={key}>
                    <div className="border-r border-t border-slate-200 p-2 text-slate-500">
                      {roleLabel(key)}
                    </div>

                    <div className="border-r border-t border-slate-200 p-3">
                      {rx.right?.[key] || "—"}
                    </div>

                    <div className="border-t border-slate-200 p-3">
                      {rx.left?.[key] || "—"}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <Info
                label="Notes"
                value={
                  consultation.notes ||
                  consultation.clinicalNotes ||
                  "No clinical notes recorded."
                }
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   MODAL
============================================================ */

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-5">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  required = false,
}) {
  const labelClass =
    "mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400";

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

  if (options) {
    return (
      <label className="block">
        <span className={labelClass}>{label}</span>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} h-10`}
        >
          <option value="">Select</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {roleLabel(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block">
        <span className={labelClass}>{label}</span>

        <textarea
          value={value}
          required={required}
          rows={5}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} py-2.5`}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} h-10`}
      />
    </label>
  );
}
