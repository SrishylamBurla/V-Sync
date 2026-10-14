// import { useEffect, useMemo, useState } from "react";
// import {
//   CalendarDays,
//   CheckCircle2,
//   Clock3,
//   ExternalLink,
//   History,
//   Phone,
//   Printer,
//   UserRound,
// } from "lucide-react";
// import { useNavigate, useParams } from "react-router-dom";
// import { getAppointment, getAppointmentClinicians, updateAppointment } from "../appointment.api";
// import { getPatientConsultations } from "../../clinical/consultation.api";

// const statusOptions = [
//   "booked",
//   "confirmed",
//   "here",
//   "examining",
//   "complete",
//   "cancelled",
//   "no_show",
// ];

// const statusLabel = (value = "") =>
//   value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

// const statusClass = {
//   booked: "bg-slate-100 text-slate-700 border-slate-200",
//   confirmed: "bg-blue-50 text-blue-700 border-blue-100",
//   here: "bg-amber-50 text-amber-700 border-amber-100",
//   examining: "bg-violet-50 text-violet-700 border-violet-100",
//   complete: "bg-emerald-50 text-emerald-700 border-emerald-100",
//   cancelled: "bg-red-50 text-red-700 border-red-100",
//   no_show: "bg-orange-50 text-orange-700 border-orange-100",
// };

// const fullName = (person) =>
//   [person?.firstName, person?.middleName, person?.lastName]
//     .filter(Boolean)
//     .join(" ");

// const formatDateTime = (value) =>
//   value
//     ? new Date(value).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "—";

// const formatDate = (value) =>
//   value
//     ? new Date(value).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//     : "—";

// const safeRows = (response) => {
//   const value = response?.data;
//   if (Array.isArray(value)) return value;
//   if (Array.isArray(value?.consultations)) return value.consultations;
//   if (Array.isArray(value?.data)) return value.data;
//   if (Array.isArray(response?.consultations)) return response.consultations;
//   return [];
// };

// export default function AppointmentDetailsPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [appointment, setAppointment] = useState(null);
//   const [consultations, setConsultations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [clinicalLoading, setClinicalLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [clinicians, setClinicians] = useState([]);
//   const [selectedClinicianId, setSelectedClinicianId] = useState("");
//   const [savingClinician, setSavingClinician] = useState(false);

//   useEffect(() => {
//     getAppointmentClinicians()
//       .then((response) => setClinicians(Array.isArray(response?.data) ? response.data : []))
//       .catch(() => setClinicians([]));
//   }, []);

//   useEffect(() => {
//     let active = true;

//     Promise.all([getAppointment(id)])
//       .then(async ([appointmentResponse]) => {
//         if (!active) return;

//         const record =
//           appointmentResponse?.data?.appointment ||
//           appointmentResponse?.data ||
//           appointmentResponse?.appointment ||
//           null;

//         setAppointment(record);
//         setSelectedClinicianId(record?.clinicianId?._id || record?.clinicianId || "");

//         const patientId = record?.patientId?._id || record?.patientId;
//         if (!patientId) {
//           setClinicalLoading(false);
//           return;
//         }

//         try {
//           const consultationResponse =
//             await getPatientConsultations(patientId);

//           if (active) {
//             setConsultations(safeRows(consultationResponse));
//           }
//         } catch {
//           if (active) setConsultations([]);
//         } finally {
//           if (active) setClinicalLoading(false);
//         }
//       })
//       .catch((err) => {
//         if (active) {
//           setError(
//             err?.response?.data?.message ||
//               "Unable to load appointment record."
//           );
//         }
//       })
//       .finally(() => {
//         if (active) setLoading(false);
//       });

//     return () => {
//       active = false;
//     };
//   }, [id]);

//   const saveClinician = async () => {
//     if (!appointment?._id || !selectedClinicianId) return;
//     setSavingClinician(true);
//     setError("");
//     try {
//       const response = await updateAppointment(appointment._id, {
//         clinicianId: selectedClinicianId,
//       });
//       const updated =
//         response?.data?.appointment ||
//         response?.data ||
//         response?.appointment ||
//         null;
//       setAppointment((current) => ({
//         ...current,
//         ...(updated || {}),
//         clinicianId:
//           updated?.clinicianId ||
//           clinicians.find((c) => c._id === selectedClinicianId) ||
//           selectedClinicianId,
//       }));
//     } catch (err) {
//       setError(err?.message || "Unable to update clinician assignment.");
//     } finally {
//       setSavingClinician(false);
//     }
//   };

//   const patient = appointment?.patientId;
//   const clinician = appointment?.clinicianId;

//   const latestConsultation = useMemo(
//     () => consultations[0] || null,
//     [consultations]
//   );

//   if (loading) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
//         Loading appointment record...
//       </div>
//     );
//   }

//   if (!appointment) {
//     return (
//       <div className="mx-auto max-w-5xl py-16">
//         <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
//           {error || "Appointment not found."}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 py-5 sm:py-7">
//       <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        

//         <div className="flex flex-wrap gap-2">
//           <button
//             type="button"
//             onClick={() =>
//               patient?._id && navigate(`/patients/${patient._id}`)
//             }
//             disabled={!patient?._id}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
//           >
//             <UserRound size={14} />
//             Patient record
//           </button>

//           <button
//             type="button"
//             onClick={() => window.print()}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
//           >
//             <Printer size={14} />
//             Print
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//         <header className="bg-gradient-to-br from-blue-50 via-white to-violet-50 px-5 py-6 sm:px-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">
//                 Appointment record
//               </div>
//               <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
//                 {appointment.appointmentNumber || "Appointment"}
//               </h1>
//               <p className="mt-1 text-sm text-slate-500">
//                 {fullName(patient) || "Patient"} ·{" "}
//                 {appointment.type || "Eye Examination"}
//               </p>
//             </div>

//             <div
//               className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-bold ${
//                 statusClass[appointment.status] || statusClass.booked
//               }`}
//             >
//               <span className="h-2 w-2 rounded-full bg-current opacity-70" />
//               {statusLabel(appointment.status)}
//             </div>
//           </div>
//         </header>

//         <div className="grid xl:grid-cols-[1.3fr_.7fr]">
//           <main className="divide-y divide-slate-200">
//             <section className="p-5 sm:p-7">
//               <SectionTitle
//                 icon={UserRound}
//                 eyebrow="01"
//                 title="Patient"
//               />

//               <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
//                 <Info label="Patient" value={fullName(patient)} />
//                 <Info label="Patient number" value={patient?.patientNumber} />
//                 <Info label="Date of birth" value={formatDate(patient?.dateOfBirth)} />
//                 <Info label="Phone" value={patient?.phone || patient?.mobile} />
//               </div>

//               <div className="mt-5 flex flex-wrap gap-2 print:hidden">
//                 {patient?._id && (
//                   <button
//                     type="button"
//                     onClick={() => navigate(`/patients/${patient._id}`)}
//                     className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"
//                   >
//                     <ExternalLink size={14} />
//                     Open patient record
//                   </button>
//                 )}

//                 {(patient?.phone || patient?.mobile) && (
//                   <a
//                     href={`tel:${patient.phone || patient.mobile}`}
//                     className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
//                   >
//                     <Phone size={14} />
//                     Call patient
//                   </a>
//                 )}
//               </div>
//             </section>

//             <section className="p-5 sm:p-7">
//               <SectionTitle
//                 icon={CalendarDays}
//                 eyebrow="02"
//                 title="Schedule"
//               />

//               <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
//                 <Info
//                   label="Appointment date"
//                   value={formatDateTime(appointment.appointmentDate)}
//                 />
//                 <Info
//                   label="Duration"
//                   value={`${appointment.durationMinutes || 30} minutes`}
//                 />
//                 <Info
//                   label="Visit type"
//                   value={appointment.type || "Eye Examination"}
//                 />
//                 <Info
//                   label="Optometrist"
//                   value={fullName(clinician) || "Unassigned"}
//                 />
//               </div>

//               <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
//                 <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//                   <div className="flex-1">
//                     <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
//                       Clinician assignment
//                     </div>
//                     <div className="mt-1 text-xs text-slate-500">
//                       Assign or change the optometrist / doctor responsible for this appointment.
//                     </div>
//                     <select
//                       value={selectedClinicianId}
//                       onChange={(e) => setSelectedClinicianId(e.target.value)}
//                       className="mt-3 h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 md:max-w-xl"
//                     >
//                       <option value="">Select clinician</option>
//                       {clinicians.map((c) => (
//                         <option key={c._id} value={c._id}>
//                           {fullName(c)} · {c.role || "Clinician"}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={saveClinician}
//                     disabled={
//                       savingClinician ||
//                       !selectedClinicianId ||
//                       selectedClinicianId === (appointment.clinicianId?._id || appointment.clinicianId)
//                     }
//                     className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     {savingClinician ? "Saving…" : "Save assignment"}
//                   </button>
//                 </div>
//               </div>

//               <div className="mt-5 grid gap-5 sm:grid-cols-2">
//                 <Info
//                   label="Reason"
//                   value={appointment.reason || "Routine visit"}
//                 />
//                 <Info
//                   label="Notes"
//                   value={appointment.notes || "No appointment notes"}
//                 />
//               </div>
//             </section>

//             <section className="p-5 sm:p-7">
//               <SectionTitle
//                 icon={History}
//                 eyebrow="03"
//                 title="Previous consultation & prescription"
//               />

//               {clinicalLoading ? (
//                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
//                   Loading clinical history...
//                 </div>
//               ) : !latestConsultation ? (
//                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
//                   No previous consultation recorded for this patient.
//                 </div>
//               ) : (
//                 <div className="space-y-5">
//                   <div className="grid gap-4 sm:grid-cols-4">
//                     <Mini
//                       label="Last consultation"
//                       value={formatDate(latestConsultation.consultationDate)}
//                     />
//                     <Mini
//                       label="Type"
//                       value={statusLabel(latestConsultation.consultationType)}
//                     />
//                     <Mini
//                       label="Clinician"
//                       value={fullName(latestConsultation.optometristId) || "—"}
//                     />
//                     <Mini
//                       label="Recall due"
//                       value={formatDate(latestConsultation.recallDue)}
//                     />
//                   </div>

//                   <PrescriptionTable consultation={latestConsultation} />

//                   <div className="grid gap-4 md:grid-cols-2">
//                     <ClinicalBlock
//                       title="Symptoms"
//                       value={latestConsultation.symptoms}
//                     />
//                     <ClinicalBlock
//                       title="Clinical notes"
//                       value={latestConsultation.notes}
//                     />
//                     <ClinicalBlock
//                       title="Medication / allergy"
//                       value={[
//                         latestConsultation.medication
//                           ? `Medication: ${latestConsultation.medication}`
//                           : "",
//                         latestConsultation.allergy
//                           ? `Allergy: ${latestConsultation.allergy}`
//                           : "",
//                       ]
//                         .filter(Boolean)
//                         .join("\n")}
//                     />
//                     <ClinicalBlock
//                       title="Examination"
//                       value={[
//                         latestConsultation.ophthalmoscopy,
//                         latestConsultation.biomicroscopy,
//                         latestConsultation.visualField,
//                         latestConsultation.colourVision,
//                       ]
//                         .filter(Boolean)
//                         .join("\n")}
//                     />
//                   </div>
//                 </div>
//               )}
//             </section>

//             <section className="p-5 sm:p-7">
//               <SectionTitle
//                 icon={History}
//                 eyebrow="04"
//                 title="Clinical history"
//               />

//               {consultations.length ? (
//                 <div className="overflow-x-auto rounded-2xl border border-slate-200">
//                   <table className="w-full min-w-[760px] text-left">
//                     <thead>
//                       <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
//                         <th className="px-4 py-3">Date</th>
//                         <th className="px-4 py-3">Clinician</th>
//                         <th className="px-4 py-3">Type</th>
//                         <th className="px-4 py-3">OD</th>
//                         <th className="px-4 py-3">OS</th>
//                         <th className="px-4 py-3">Recall</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {consultations.map((item) => (
//                         <tr
//                           key={item._id}
//                           className="border-b border-slate-100 last:border-0"
//                         >
//                           <td className="px-4 py-3 text-xs font-semibold text-slate-700">
//                             {formatDate(item.consultationDate)}
//                           </td>
//                           <td className="px-4 py-3 text-xs text-slate-600">
//                             {fullName(item.optometristId) || "—"}
//                           </td>
//                           <td className="px-4 py-3 text-xs text-slate-600">
//                             {statusLabel(item.consultationType)}
//                           </td>
//                           <td className="px-4 py-3 font-mono text-xs text-blue-700">
//                             {item.givenRx?.right?.sphere || "—"}
//                           </td>
//                           <td className="px-4 py-3 font-mono text-xs text-rose-700">
//                             {item.givenRx?.left?.sphere || "—"}
//                           </td>
//                           <td className="px-4 py-3 text-xs text-slate-600">
//                             {formatDate(item.recallDue)}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : null}
//             </section>

//             <section className="p-5 sm:p-7">
//               <SectionTitle
//                 icon={CheckCircle2}
//                 eyebrow="05"
//                 title="Appointment workflow"
//               />

//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                 {statusOptions.map((status) => {
//                   const active = appointment.status === status;

//                   return (
//                     <div
//                       key={status}
//                       className={`rounded-2xl border p-4 ${
//                         active
//                           ? "border-blue-200 bg-blue-50"
//                           : "border-slate-200 bg-slate-50"
//                       }`}
//                     >
//                       <div className="flex items-center gap-2">
//                         <span
//                           className={`h-2.5 w-2.5 rounded-full ${
//                             active ? "bg-blue-600" : "bg-slate-300"
//                           }`}
//                         />
//                         <span className="text-xs font-bold text-slate-700">
//                           {statusLabel(status)}
//                         </span>
//                       </div>

//                       {active && (
//                         <div className="mt-2 text-[10px] font-semibold text-blue-600">
//                           Current appointment status
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>

//               <p className="mt-4 text-xs leading-5 text-slate-400 print:hidden">
//                 Appointment status is controlled from the Dashboard. This
//                 record remains read-only for workflow status to keep status
//                 changes centralized.
//               </p>
//             </section>

//             <section className="p-5 sm:p-7">
//               <SectionTitle
//                 icon={Clock3}
//                 eyebrow="06"
//                 title="Record information"
//               />

//               <div className="grid gap-5 sm:grid-cols-3">
//                 <Info label="Created" value={formatDateTime(appointment.createdAt)} />
//                 <Info label="Last updated" value={formatDateTime(appointment.updatedAt)} />
//                 <Info label="Appointment ID" value={appointment._id} />
//               </div>
//             </section>
//           </main>

//           <aside className="bg-gradient-to-b from-slate-50 via-white to-blue-50 p-5 sm:p-7">
//             <div className="sticky top-6 space-y-4">
//               <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
//                 <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
//                   At a glance
//                 </div>

//                 <div className="mt-4 space-y-4">
//                   <Mini label="Patient" value={fullName(patient)} />
//                   <Mini label="Appointment" value={formatDateTime(appointment.appointmentDate)} />
//                   <Mini
//                     label="Clinician"
//                     value={
//                       fullName(clinician)
//                         ? `${fullName(clinician)}${clinician?.role ? ` · ${clinician.role}` : ""}`
//                         : "Unassigned"
//                     }
//                   />
//                   <Mini label="Status" value={statusLabel(appointment.status)} />
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-slate-200 bg-white p-5">
//                 <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
//                   Quick actions
//                 </div>

//                 <div className="mt-4 space-y-2 print:hidden">
//                   <button
//                     type="button"
//                     onClick={() =>
//                       patient?._id &&
//                       navigate(`/patients/${patient._id}/consultations/new`)
//                     }
//                     disabled={!patient?._id}
//                     className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white disabled:opacity-40"
//                   >
//                     Start consultation
//                     <ExternalLink size={14} />
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       patient?._id && navigate(`/patients/${patient._id}`)
//                     }
//                     disabled={!patient?._id}
//                     className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 disabled:opacity-40"
//                   >
//                     Open patient record
//                     <UserRound size={14} />
//                   </button>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
//                 <div className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">
//                   Clinical continuity
//                 </div>
//                 <p className="mt-2 text-xs leading-5 text-slate-600">
//                   Previous consultation and prescription information is shown
//                   here so the clinician can review the patient's last known
//                   clinical record before the visit.
//                 </p>
//               </div>
//             </div>
//           </aside>
//         </div>
//       </article>
//     </div>
//   );
// }

// function SectionTitle({ icon: Icon, eyebrow, title }) {
//   return (
//     <div className="mb-5 flex items-center gap-3">
//       <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
//         <Icon size={16} />
//       </div>
//       <div>
//         <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
//           {eyebrow}
//         </div>
//         <h2 className="mt-0.5 text-sm font-bold text-slate-900">{title}</h2>
//       </div>
//     </div>
//   );
// }

// function Info({ label, value }) {
//   return (
//     <div>
//       <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
//         {label}
//       </div>
//       <div className="mt-1 break-words text-sm font-semibold text-slate-700">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// function Mini({ label, value }) {
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white p-3">
//       <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
//         {label}
//       </div>
//       <div className="mt-1 break-words text-xs font-semibold text-slate-700">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// function ClinicalBlock({ title, value }) {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//       <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
//         {title}
//       </div>
//       <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// function PrescriptionTable({ consultation }) {
//   const right = consultation?.givenRx?.right || {};
//   const left = consultation?.givenRx?.left || {};
//   const columns = [
//     ["sphere", "Sphere"],
//     ["cylinder", "Cylinder"],
//     ["axis", "Axis"],
//     ["va", "VA"],
//     ["add", "Add"],
//     ["inter", "Inter"],
//     ["prism", "Prism"],
//     ["base", "Base"],
//   ];

//   return (
//     <div className="overflow-x-auto rounded-2xl border border-slate-200">
//       <table className="w-full min-w-[820px]">
//         <thead>
//           <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
//             <th className="px-4 py-3 text-left">Eye</th>
//             {columns.map(([, label]) => (
//               <th key={label} className="px-3 py-3 text-center">
//                 {label}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           <PrescriptionRow code="OD" values={right} tone="blue" columns={columns} />
//           <PrescriptionRow code="OS" values={left} tone="rose" columns={columns} />
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PrescriptionRow({ code, values, columns, tone }) {
//   return (
//     <tr className="border-b border-slate-100 last:border-0">
//       <th
//         className={`px-4 py-3 text-left text-xs font-bold ${
//           tone === "blue"
//             ? "bg-blue-50 text-blue-800"
//             : "bg-rose-50 text-rose-800"
//         }`}
//       >
//         {code}
//       </th>

//       {columns.map(([field]) => (
//         <td
//           key={field}
//           className="px-3 py-3 text-center font-mono text-xs text-slate-700"
//         >
//           {values?.[field] || "—"}
//         </td>
//       ))}
//     </tr>
//   );
// }
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  Eye,
  ExternalLink,
  FileText,
  Glasses,
  History,
  Loader2,
  Phone,
  Printer,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import { getAppointment, getAppointmentClinicians, updateAppointment } from "../appointment.api";

import { getConsultation, getPatientConsultations } from "../../clinical/consultation.api";



const statusOptions = [

  "booked",

  "confirmed",

  "here",

  "examining",

  "complete",

  "cancelled",

  "no_show",

];



const statusLabel = (value = "") =>

  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());



const statusClass = {

  booked: "bg-slate-100 text-slate-700 border-slate-200",

  confirmed: "bg-blue-50 text-blue-700 border-blue-100",

  here: "bg-amber-50 text-amber-700 border-amber-100",

  examining: "bg-violet-50 text-violet-700 border-violet-100",

  complete: "bg-emerald-50 text-emerald-700 border-emerald-100",

  cancelled: "bg-red-50 text-red-700 border-red-100",

  no_show: "bg-orange-50 text-orange-700 border-orange-100",

};



const fullName = (person) =>

  [person?.firstName, person?.middleName, person?.lastName]

    .filter(Boolean)

    .join(" ");



const formatDateTime = (value) =>

  value

    ? new Date(value).toLocaleString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

      })

    : "—";



const formatDate = (value) =>

  value

    ? new Date(value).toLocaleDateString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric",

      })

    : "—";



const safeRows = (response) => {
  const candidates = [
    response,
    response?.data,
    response?.consultations,
    response?.data?.consultations,
    response?.data?.data,
    response?.data?.data?.consultations,
  ];
  return candidates.find(Array.isArray) || [];
};



export default function AppointmentDetailsPage() {

  const { id } = useParams();

  const navigate = useNavigate();



  const [appointment, setAppointment] = useState(null);

  const [consultations, setConsultations] = useState([]);
  const [expandedConsultationId, setExpandedConsultationId] = useState(null);
  const [consultationDetailsById, setConsultationDetailsById] = useState({});
  const [loadingConsultationId, setLoadingConsultationId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [clinicalLoading, setClinicalLoading] = useState(true);

  const [error, setError] = useState("");

  const [clinicians, setClinicians] = useState([]);

  const [selectedClinicianId, setSelectedClinicianId] = useState("");

  const [savingClinician, setSavingClinician] = useState(false);



  useEffect(() => {

    getAppointmentClinicians()

      .then((response) => setClinicians(Array.isArray(response?.data) ? response.data : []))

      .catch(() => setClinicians([]));

  }, []);



  useEffect(() => {

    let active = true;



    Promise.all([getAppointment(id)])

      .then(async ([appointmentResponse]) => {

        if (!active) return;



        const record =

          appointmentResponse?.data?.appointment ||

          appointmentResponse?.data ||

          appointmentResponse?.appointment ||

          null;



        setAppointment(record);

        setSelectedClinicianId(record?.clinicianId?._id || record?.clinicianId || "");



        const patientId = record?.patientId?._id || record?.patientId;

        if (!patientId) {

          setClinicalLoading(false);

          return;

        }



        try {

          const consultationResponse =

            await getPatientConsultations(patientId);



          if (active) {

            setConsultations(safeRows(consultationResponse));

          }

        } catch {

          if (active) setConsultations([]);

        } finally {

          if (active) setClinicalLoading(false);

        }

      })

      .catch((err) => {

        if (active) {

          setError(

            err?.response?.data?.message ||

              "Unable to load appointment record."

          );

        }

      })

      .finally(() => {

        if (active) setLoading(false);

      });



    return () => {

      active = false;

    };

  }, [id]);



  const saveClinician = async () => {

    if (!appointment?._id || !selectedClinicianId) return;

    setSavingClinician(true);

    setError("");

    try {

      const response = await updateAppointment(appointment._id, {

        clinicianId: selectedClinicianId,

      });

      const updated =

        response?.data?.appointment ||

        response?.data ||

        response?.appointment ||

        null;

      setAppointment((current) => ({

        ...current,

        ...(updated || {}),

        clinicianId:

          updated?.clinicianId ||

          clinicians.find((c) => c._id === selectedClinicianId) ||

          selectedClinicianId,

      }));

    } catch (err) {

      setError(err?.message || "Unable to update clinician assignment.");

    } finally {

      setSavingClinician(false);

    }

  };



  const patient = appointment?.patientId;

  const clinician = appointment?.clinicianId;



  const sortedConsultations = useMemo(
    () =>
      [...consultations].sort((a, b) => {
        const dateA = new Date(a?.consultationDate || a?.createdAt || 0).getTime();
        const dateB = new Date(b?.consultationDate || b?.createdAt || 0).getTime();
        return dateB - dateA;
      }),
    [consultations],
  );

  const latestConsultation = sortedConsultations[0] || null;

  const toggleConsultationDetails = async (summary) => {
    const consultationId = summary?._id;
    if (!consultationId) return;

    if (expandedConsultationId === consultationId) {
      setExpandedConsultationId(null);
      return;
    }

    setExpandedConsultationId(consultationId);
    if (consultationDetailsById[consultationId]) return;

    setLoadingConsultationId(consultationId);
    try {
      const response = await getConsultation(consultationId);
      const detail =
        response?.data?.consultation ||
        response?.data?.data?.consultation ||
        response?.data ||
        response?.consultation ||
        (response?._id ? response : null);

      setConsultationDetailsById((current) => ({
        ...current,
        [consultationId]: detail || summary,
      }));
    } catch {
      // Keep the history item usable even if the detail endpoint fails.
      setConsultationDetailsById((current) => ({
        ...current,
        [consultationId]: summary,
      }));
    } finally {
      setLoadingConsultationId((current) =>
        current === consultationId ? null : current,
      );
    }
  };



  if (loading) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">

        Loading appointment record...

      </div>

    );

  }



  if (!appointment) {

    return (

      <div className="mx-auto max-w-5xl py-16">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

          {error || "Appointment not found."}

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-6 py-5 sm:py-7">

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">





        <div className="flex flex-wrap gap-2">

          <button

            type="button"

            onClick={() =>

              patient?._id && navigate(`/patients/${patient._id}`)

            }

            disabled={!patient?._id}

            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40"

          >

            <UserRound size={14} />

            Patient record

          </button>



          <button

            type="button"

            onClick={() => window.print()}

            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"

          >

            <Printer size={14} />

            Print

          </button>

        </div>

      </div>



      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}



      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        <header className="bg-gradient-to-br from-blue-50 via-white to-violet-50 px-5 py-6 sm:px-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">

                Appointment record

              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">

                {appointment.appointmentNumber || "Appointment"}

              </h1>

              <p className="mt-1 text-sm text-slate-500">

                {fullName(patient) || "Patient"} ·{" "}

                {appointment.type || "Eye Examination"}

              </p>

            </div>



            <div

              className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-bold ${

                statusClass[appointment.status] || statusClass.booked

              }`}

            >

              <span className="h-2 w-2 rounded-full bg-current opacity-70" />

              {statusLabel(appointment.status)}

            </div>

          </div>

        </header>



        <div className="grid xl:grid-cols-[1.3fr_.7fr]">

          <main className="divide-y divide-slate-200">

            <section className="p-5 sm:p-7">

              <SectionTitle

                icon={UserRound}

                eyebrow="01"

                title="Patient"

              />



              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <Info label="Patient" value={fullName(patient)} />

                <Info label="Patient number" value={patient?.patientNumber} />

                <Info label="Date of birth" value={formatDate(patient?.dateOfBirth)} />

                <Info label="Phone" value={patient?.phone || patient?.mobile} />

              </div>



              <div className="mt-5 flex flex-wrap gap-2 print:hidden">

                {patient?._id && (

                  <button

                    type="button"

                    onClick={() => navigate(`/patients/${patient._id}`)}

                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"

                  >

                    <ExternalLink size={14} />

                    Open patient record

                  </button>

                )}



                {(patient?.phone || patient?.mobile) && (

                  <a

                    href={`tel:${patient.phone || patient.mobile}`}

                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"

                  >

                    <Phone size={14} />

                    Call patient

                  </a>

                )}

              </div>

            </section>



            <section className="p-5 sm:p-7">

              <SectionTitle

                icon={CalendarDays}

                eyebrow="02"

                title="Schedule"

              />



              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <Info

                  label="Appointment date"

                  value={formatDateTime(appointment.appointmentDate)}

                />

                <Info

                  label="Duration"

                  value={`${appointment.durationMinutes || 30} minutes`}

                />

                <Info

                  label="Visit type"

                  value={appointment.type || "Eye Examination"}

                />

                <Info

                  label="Optometrist"

                  value={fullName(clinician) || "Unassigned"}

                />

              </div>



              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">

                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

                  <div className="flex-1">

                    <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">

                      Clinician assignment

                    </div>

                    <div className="mt-1 text-xs text-slate-500">

                      Assign or change the optometrist / doctor responsible for this appointment.

                    </div>

                    <select

                      value={selectedClinicianId}

                      onChange={(e) => setSelectedClinicianId(e.target.value)}

                      className="mt-3 h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 md:max-w-xl"

                    >

                      <option value="">Select clinician</option>

                      {clinicians.map((c) => (

                        <option key={c._id} value={c._id}>

                          {fullName(c)} · {c.role || "Clinician"}

                        </option>

                      ))}

                    </select>

                  </div>

                  <button

                    type="button"

                    onClick={saveClinician}

                    disabled={

                      savingClinician ||

                      !selectedClinicianId ||

                      selectedClinicianId === (appointment.clinicianId?._id || appointment.clinicianId)

                    }

                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"

                  >

                    {savingClinician ? "Saving…" : "Save assignment"}

                  </button>

                </div>

              </div>



              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <Info

                  label="Reason"

                  value={appointment.reason || "Routine visit"}

                />

                <Info

                  label="Notes"

                  value={appointment.notes || "No appointment notes"}

                />

              </div>

            </section>



            <section className="p-5 sm:p-7">

              <SectionTitle

                icon={History}

                eyebrow="03"

                title="Previous consultation & prescription"

              />



              {clinicalLoading ? (

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">

                  Loading clinical history...

                </div>

              ) : !latestConsultation ? (

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">

                  No previous consultation recorded for this patient.

                </div>

              ) : (

                <div className="space-y-5">

                  <div className="grid gap-4 sm:grid-cols-4">

                    <Mini

                      label="Last consultation"

                      value={formatDate(latestConsultation.consultationDate)}

                    />

                    <Mini

                      label="Type"

                      value={statusLabel(latestConsultation.consultationType)}

                    />

                    <Mini

                      label="Clinician"

                      value={fullName(latestConsultation.optometristId) || "—"}

                    />

                    <Mini

                      label="Recall due"

                      value={formatDate(latestConsultation.recallDue)}

                    />

                  </div>



                  <PrescriptionTable consultation={latestConsultation} />



                  <div className="grid gap-4 md:grid-cols-2">

                    <ClinicalBlock

                      title="Symptoms"

                      value={latestConsultation.symptoms}

                    />

                    <ClinicalBlock

                      title="Clinical notes"

                      value={latestConsultation.notes}

                    />

                    <ClinicalBlock

                      title="Medication / allergy"

                      value={[

                        latestConsultation.medication

                          ? `Medication: ${latestConsultation.medication}`

                          : "",

                        latestConsultation.allergy

                          ? `Allergy: ${latestConsultation.allergy}`

                          : "",

                      ]

                        .filter(Boolean)

                        .join("\n")}

                    />

                    <ClinicalBlock

                      title="Examination"

                      value={[

                        latestConsultation.ophthalmoscopy,

                        latestConsultation.biomicroscopy,

                        latestConsultation.visualField,

                        latestConsultation.colourVision,

                      ]

                        .filter(Boolean)

                        .join("\n")}

                    />

                  </div>

                </div>

              )}

            </section>



            <section className="p-4 sm:p-5">
              <SectionTitle
                icon={History}
                eyebrow="04"
                title="Clinical history & consultation records"
              />

              {clinicalLoading ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                  <Loader2 size={15} className="animate-spin" />
                  Loading consultation history...
                </div>
              ) : !sortedConsultations.length ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <History size={22} className="mx-auto text-slate-300" />
                  <div className="mt-2 text-xs font-semibold text-slate-600">
                    No consultation history found
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Previous clinical records will appear here once a consultation is saved for this patient.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                    <span className="text-[11px] text-slate-500">
                      {sortedConsultations.length} consultation record{sortedConsultations.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Select a record to view its full clinical details
                    </span>
                  </div>

                  {sortedConsultations.map((item, index) => {
                    const recordId = item?._id;
                    const isExpanded = expandedConsultationId === recordId;
                    const detail = consultationDetailsById[recordId] || item;
                    const givenRight = item?.givenRx?.right || item?.finalRx?.right || {};
                    const givenLeft = item?.givenRx?.left || item?.finalRx?.left || {};
                    const hasVisualAcuity = !isClinicalEmpty(
                      item?.visualAcuity ?? item?.visualAcuityData ?? item?.visualAcuities,
                    ) || Boolean(givenRight?.va || givenLeft?.va || givenRight?.nearVa || givenLeft?.nearVa);

                    return (
                      <article
                        key={recordId || `${item?.consultationDate || "consultation"}-${index}`}
                        className={`overflow-hidden rounded-xl border bg-white transition ${
                          isExpanded ? "border-blue-200 shadow-sm" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void toggleConsultationDetails(item)}
                          aria-expanded={isExpanded}
                          className="flex w-full flex-col gap-3 px-3 py-3 text-left sm:flex-row sm:items-center sm:justify-between sm:px-4"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              index === 0 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              <History size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800">
                                  {formatDate(item?.consultationDate || item?.createdAt)}
                                </span>
                                {index === 0 && (
                                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700">
                                    Latest
                                  </span>
                                )}
                                <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                                  {statusLabel(item?.consultationType || "consultation")}
                                </span>
                                {hasVisualAcuity && (
                                  <span className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                                    VA recorded
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                                <span>{fullName(item?.optometristId) || "Clinical team"}</span>
                                <span>
                                  OD {formatRxSummary(givenRight)}
                                </span>
                                <span>
                                  OS {formatRxSummary(givenLeft)}
                                </span>
                                <span>Recall {formatDate(item?.recallDue || item?.recall?.due)}</span>
                              </div>
                            </div>
                          </div>
                          <span className="ml-11 inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-blue-700 sm:ml-0">
                            {isExpanded ? "Hide details" : "View full record"}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4">
                            {loadingConsultationId === recordId ? (
                              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-4 text-xs text-slate-500">
                                <Loader2 size={14} className="animate-spin" />
                                Loading full consultation record...
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                  <Mini label="Consultation date" value={formatDate(detail?.consultationDate || item?.consultationDate)} />
                                  <Mini label="Consultation type" value={statusLabel(detail?.consultationType || item?.consultationType || "consultation")} />
                                  <Mini label="Clinician" value={fullName(detail?.optometristId || item?.optometristId) || "Clinical team"} />
                                  <Mini label="Recall due" value={formatDate(detail?.recallDue || detail?.recall?.due || item?.recallDue)} />
                                </div>

                                <ClinicalHistoryGroup
                                  title="Visit & medical history"
                                  icon={ClipboardList}
                                  record={detail}
                                  fields={[
                                    ["reasonForVisit", "Reason for visit"],
                                    ["symptoms", "Symptoms"],
                                    ["medicalHistory", "Medical history"],
                                    ["ocularHistory", "Ocular history"],
                                    ["familyHistory", "Family history"],
                                    ["medication", "Medication"],
                                    ["allergy", "Allergies"],
                                    ["pupils", "Pupillary findings"],
                                  ]}
                                />

                                <ClinicalHistoryGroup
                                  title="Visual acuity"
                                  icon={Eye}
                                  record={detail}
                                  fields={[
                                    ["visualAcuity", "Visual acuity"],
                                    ["visualAcuityData", "Visual acuity data"],
                                    ["visualAcuities", "Visual acuity records"],
                                    ["unaidedVisualAcuity", "Unaided visual acuity"],
                                    ["aidedVisualAcuity", "Aided visual acuity"],
                                    ["distanceVisualAcuity", "Distance visual acuity"],
                                    ["nearVisualAcuity", "Near visual acuity"],
                                  ]}
                                  fallback={
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                      <Mini label="OD distance VA" value={detail?.givenRx?.right?.va || detail?.finalRx?.right?.va || detail?.subjectiveRx?.right?.va} />
                                      <Mini label="OS distance VA" value={detail?.givenRx?.left?.va || detail?.finalRx?.left?.va || detail?.subjectiveRx?.left?.va} />
                                      <Mini label="OD near VA" value={detail?.givenRx?.right?.nearVa || detail?.finalRx?.right?.nearVa || detail?.subjectiveRx?.right?.nearVa} />
                                      <Mini label="OS near VA" value={detail?.givenRx?.left?.nearVa || detail?.finalRx?.left?.nearVa || detail?.subjectiveRx?.left?.nearVa} />
                                    </div>
                                  }
                                />

                                <ClinicalHistoryGroup
                                  title="Refraction & prescription"
                                  icon={Glasses}
                                  record={detail}
                                  fields={[
                                    ["previousRx", "Previous prescription"],
                                    ["objectiveRx", "Objective prescription"],
                                    ["subjectiveRx", "Subjective prescription"],
                                    ["finalRx", "Final prescription"],
                                    ["givenRx", "Given prescription"],
                                    ["pd", "Pupillary distance (PD)"],
                                    ["refractionNotes", "Refraction notes"],
                                  ]}
                                />

                                <ClinicalHistoryGroup
                                  title="Examination & tests"
                                  icon={Stethoscope}
                                  record={detail}
                                  fields={[
                                    ["slitLamp", "Slit lamp"],
                                    ["fundus", "Fundus"],
                                    ["ophthalmoscopy", "Ophthalmoscopy"],
                                    ["biomicroscopy", "Biomicroscopy"],
                                    ["visualField", "Visual field"],
                                    ["colourVision", "Colour vision"],
                                    ["otherTests", "Other tests"],
                                  ]}
                                />

                                <ClinicalHistoryGroup
                                  title="Specialist assessments"
                                  icon={Activity}
                                  record={detail}
                                  fields={[
                                    ["binocularVision", "Binocular vision"],
                                    ["lowVision", "Low vision"],
                                    ["contactLens", "Contact lens"],
                                    ["contactLenses", "Contact lenses"],
                                    ["dispensing", "Dispensing details"],
                                  ]}
                                />

                                <ClinicalHistoryGroup
                                  title="Diagnosis & management"
                                  icon={CheckCircle2}
                                  record={detail}
                                  fields={[
                                    ["diagnosis", "Diagnosis"],
                                    ["advice", "Advice / management plan"],
                                    ["therapeutics", "Therapeutics"],
                                  ]}
                                />

                                <ClinicalHistoryGroup
                                  title="Notes & recall"
                                  icon={FileText}
                                  record={detail}
                                  fields={[
                                    ["clinicalNotes", "Clinical notes"],
                                    ["patientInstructions", "Patient instructions"],
                                    ["internalNotes", "Internal notes"],
                                    ["notes", "Additional notes"],
                                    ["recall", "Recall details"],
                                    ["recallDue", "Recall due date"],
                                    ["recallLetter", "Recall letter"],
                                  ]}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="p-5 sm:p-7">

              <SectionTitle

                icon={CheckCircle2}

                eyebrow="05"

                title="Appointment workflow"

              />



              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {statusOptions.map((status) => {

                  const active = appointment.status === status;



                  return (

                    <div

                      key={status}

                      className={`rounded-2xl border p-4 ${

                        active

                          ? "border-blue-200 bg-blue-50"

                          : "border-slate-200 bg-slate-50"

                      }`}

                    >

                      <div className="flex items-center gap-2">

                        <span

                          className={`h-2.5 w-2.5 rounded-full ${

                            active ? "bg-blue-600" : "bg-slate-300"

                          }`}

                        />

                        <span className="text-xs font-bold text-slate-700">

                          {statusLabel(status)}

                        </span>

                      </div>



                      {active && (

                        <div className="mt-2 text-[10px] font-semibold text-blue-600">

                          Current appointment status

                        </div>

                      )}

                    </div>

                  );

                })}

              </div>



              <p className="mt-4 text-xs leading-5 text-slate-400 print:hidden">

                Appointment status is controlled from the Dashboard. This

                record remains read-only for workflow status to keep status

                changes centralized.

              </p>

            </section>



            <section className="p-5 sm:p-7">

              <SectionTitle

                icon={Clock3}

                eyebrow="06"

                title="Record information"

              />



              <div className="grid gap-5 sm:grid-cols-3">

                <Info label="Created" value={formatDateTime(appointment.createdAt)} />

                <Info label="Last updated" value={formatDateTime(appointment.updatedAt)} />

                <Info label="Appointment ID" value={appointment._id} />

              </div>

            </section>

          </main>



          <aside className="bg-gradient-to-b from-slate-50 via-white to-blue-50 p-5 sm:p-7">

            <div className="sticky top-6 space-y-4">

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">

                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">

                  At a glance

                </div>



                <div className="mt-4 space-y-4">

                  <Mini label="Patient" value={fullName(patient)} />

                  <Mini label="Appointment" value={formatDateTime(appointment.appointmentDate)} />

                  <Mini

                    label="Clinician"

                    value={

                      fullName(clinician)

                        ? `${fullName(clinician)}${clinician?.role ? ` · ${clinician.role}` : ""}`

                        : "Unassigned"

                    }

                  />

                  <Mini label="Status" value={statusLabel(appointment.status)} />

                </div>

              </div>



              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">

                  Quick actions

                </div>



                <div className="mt-4 space-y-2 print:hidden">

                  <button

                    type="button"

                    onClick={() =>

                      patient?._id &&

                      navigate(`/patients/${patient._id}/consultations/new`)

                    }

                    disabled={!patient?._id}

                    className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white disabled:opacity-40"

                  >

                    Start consultation

                    <ExternalLink size={14} />

                  </button>



                  <button

                    type="button"

                    onClick={() =>

                      patient?._id && navigate(`/patients/${patient._id}`)

                    }

                    disabled={!patient?._id}

                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 disabled:opacity-40"

                  >

                    Open patient record

                    <UserRound size={14} />

                  </button>

                </div>

              </div>



              <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">

                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">

                  Clinical continuity

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-600">

                  Previous consultation and prescription information is shown

                  here so the clinician can review the patient's last known

                  clinical record before the visit.

                </p>

              </div>

            </div>

          </aside>

        </div>

      </article>

    </div>

  );

}



const isClinicalEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0 || value.every(isClinicalEmpty);
  if (typeof value === "object") {
    const values = Object.values(value);
    return values.length === 0 || values.every(isClinicalEmpty);
  }
  return false;
};

const formatRxSummary = (rx = {}) => {
  const parts = [rx?.sphere, rx?.cylinder, rx?.axis]
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(String);
  return parts.length ? parts.join(" / ") : "—";
};

const prettyClinicalKey = (key = "") =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

function ClinicalHistoryGroup({ title, icon: Icon, record, fields, fallback }) {
  const visibleFields = fields
    .map(([key, label]) => ({ key, label, value: record?.[key] }))
    .filter(({ value }) => !isClinicalEmpty(value));

  if (!visibleFields.length && !fallback) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Icon size={13} />
        </span>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700">{title}</h3>
        <span className="ml-auto text-[9px] text-slate-400">{visibleFields.length || (fallback ? "VA" : "")} </span>
      </header>
      <div className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {visibleFields.map(({ key, label, value }) => (
          <div key={key} className={`min-w-0 rounded-md border border-slate-100 bg-slate-50/70 p-2 ${typeof value === "object" ? "sm:col-span-2" : ""}`}>
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
            <ClinicalValue value={value} />
          </div>
        ))}
        {!visibleFields.length && fallback ? (
          <div className="col-span-full">{fallback}</div>
        ) : null}
      </div>
    </section>
  );
}

function ClinicalValue({ value, depth = 0 }) {
  let normalized = value;
  if (typeof normalized === "string") {
    const trimmed = normalized.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try { normalized = JSON.parse(trimmed); } catch { /* Keep plain text as entered. */ }
    }
  }

  if (isClinicalEmpty(normalized)) {
    return <span className="text-[11px] text-slate-300">—</span>;
  }
  if (typeof normalized === "boolean") {
    return <span className="text-[11px] font-medium text-slate-700">{normalized ? "Yes" : "No"}</span>;
  }
  if (typeof normalized === "string" || typeof normalized === "number") {
    return <span className="whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-700">{String(normalized)}</span>;
  }
  if (depth >= 5) {
    return <span className="break-words text-[10px] text-slate-500">Additional structured details recorded</span>;
  }
  if (Array.isArray(normalized)) {
    return (
      <div className="space-y-1.5">
        {normalized.filter((item) => !isClinicalEmpty(item)).map((item, index) => (
          <div key={index} className="rounded-md border border-slate-100 bg-white p-2">
            <ClinicalValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(normalized).filter(([, child]) => !isClinicalEmpty(child));
  if (!entries.length) return <span className="text-[11px] text-slate-300">—</span>;

  return (
    <dl className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2">
      {entries.map(([key, child]) => (
        <div key={key} className={`min-w-0 rounded-md border border-slate-100 bg-white px-2 py-1.5 ${child && typeof child === "object" ? "sm:col-span-2" : ""}`}>
          <dt className="mb-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">{prettyClinicalKey(key)}</dt>
          <dd className="min-w-0"><ClinicalValue value={child} depth={depth + 1} /></dd>
        </div>
      ))}
    </dl>
  );
}


function SectionTitle({ icon: Icon, eyebrow, title }) {

  return (

    <div className="mb-5 flex items-center gap-3">

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

        <Icon size={16} />

      </div>

      <div>

        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">

          {eyebrow}

        </div>

        <h2 className="mt-0.5 text-sm font-bold text-slate-900">{title}</h2>

      </div>

    </div>

  );

}



function Info({ label, value }) {

  return (

    <div>

      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">

        {label}

      </div>

      <div className="mt-1 break-words text-sm font-semibold text-slate-700">

        {value || "—"}

      </div>

    </div>

  );

}



function Mini({ label, value }) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-3">

      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">

        {label}

      </div>

      <div className="mt-1 break-words text-xs font-semibold text-slate-700">

        {value || "—"}

      </div>

    </div>

  );

}



function ClinicalBlock({ title, value }) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">

        {title}

      </div>

      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

        {value || "—"}

      </div>

    </div>

  );

}



function PrescriptionTable({ consultation }) {

  const right = consultation?.givenRx?.right || {};

  const left = consultation?.givenRx?.left || {};

  const columns = [

    ["sphere", "Sphere"],

    ["cylinder", "Cylinder"],

    ["axis", "Axis"],

    ["va", "VA"],

    ["add", "Add"],

    ["inter", "Inter"],

    ["prism", "Prism"],

    ["base", "Base"],

  ];



  return (

    <div className="overflow-x-auto rounded-2xl border border-slate-200">

      <table className="w-full min-w-[820px]">

        <thead>

          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">

            <th className="px-4 py-3 text-left">Eye</th>

            {columns.map(([, label]) => (

              <th key={label} className="px-3 py-3 text-center">

                {label}

              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          <PrescriptionRow code="OD" values={right} tone="blue" columns={columns} />

          <PrescriptionRow code="OS" values={left} tone="rose" columns={columns} />

        </tbody>

      </table>

    </div>

  );

}



function PrescriptionRow({ code, values, columns, tone }) {

  return (

    <tr className="border-b border-slate-100 last:border-0">

      <th

        className={`px-4 py-3 text-left text-xs font-bold ${

          tone === "blue"

            ? "bg-blue-50 text-blue-800"

            : "bg-rose-50 text-rose-800"

        }`}

      >

        {code}

      </th>



      {columns.map(([field]) => (

        <td

          key={field}

          className="px-3 py-3 text-center font-mono text-xs text-slate-700"

        >

          {values?.[field] || "—"}

        </td>

      ))}

    </tr>

  );

}
