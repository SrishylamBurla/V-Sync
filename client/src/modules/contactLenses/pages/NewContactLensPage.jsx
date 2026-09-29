// // import { useEffect, useState } from "react";
// // import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// // import { Save } from "lucide-react";
// // import {
// //   createContactLens,
// //   getLatestContactLensConsultation,
// // } from "../contactLens.api";
// // import { getPatients } from "../../patients/patient.api";
// // import { getContactLensCodes } from "../../catalogue/catalogue.api";
// // import {
// //   DocumentShell,
// //   Section,
// //   Field,
// //   InfoGrid,
// // } from "../../../components/common/DocumentUI";
// // const eye = () => ({
// //   power: "",
// //   sphere: "",
// //   cylinder: "",
// //   axis: "",
// //   bc: "",
// //   dia: "",
// //   add: "",
// //   colour: "",
// // });
// // const name = (p) =>
// //   [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
// // export default function NewContactLensPage() {
// //   const { patientId: routePatientId } = useParams();
// //   const [searchParams] = useSearchParams();
// //   const initial = routePatientId || searchParams.get("patientId") || "";
// //   const nav = useNavigate();
// //   const [patients, setPatients] = useState([]);
// //   const [search, setSearch] = useState("");
// //   const [error, setError] = useState("");
// //   const [selected, setSelected] = useState(initial || "");
// //   const [consult, setConsult] = useState(null);
// //   const [catalogue, setCatalogue] = useState([]);
// //   const [form, setForm] = useState({
// //     patientId: initial || "",
// //     consultationId: "",
// //     orderType: "order_only",
// //     lensType: "Soft",
// //     brand: "",
// //     model: "",
// //     supplier: "",
// //     right: eye(),
// //     left: eye(),
// //     replacement: "Monthly",
// //     quantity: 1,
// //     unitPrice: 0,
// //     discount: 0,
// //     dueDate: "",
// //     notes: "",
// //   });
// //   useEffect(() => {
// //     getPatients({ limit: 20, search })
// //       .then((r) => setPatients(r?.data || []))
// //       .catch(() => {});
// //   }, [search]);
// //   useEffect(() => {
// //     getContactLensCodes()
// //       .then((r) => setCatalogue(r?.data || []))
// //       .catch(() => {});
// //   }, []);
// //   useEffect(() => {
// //     if (selected)
// //       getLatestContactLensConsultation(selected)
// //         .then((r) => {
// //           setConsult(r?.data || null);
// //           if (r?.data) setForm((f) => ({ ...f, consultationId: r.data._id }));
// //         })
// //         .catch(() => {});
// //   }, [selected]);
// //   const total = Math.max(
// //     0,
// //     Number(form.quantity || 1) * Number(form.unitPrice || 0) -
// //       Number(form.discount || 0),
// //   );
// //   const save = async (e) => {
// //     e.preventDefault();
// //     if (!form.patientId) {
// //       setError("Please select a patient");
// //       return;
// //     }
// //     if (form.orderType === "order_only" && !consult) {
// //       setError("Complete the contact-lens consultation before creating this job.");
// //       return;
// //     }
// //     try {
// //       const r = await createContactLens({ ...form, total });
// //       nav(`/dispensing/contact-lenses/${r?.data?._id}`);
// //     } catch (e) {
// //       setError(e?.response?.data?.message || "Unable to create order");
// //     }
// //   };
// //   const setEye = (side, key, value) =>
// //     setForm((f) => ({ ...f, [side]: { ...f[side], [key]: value } }));
// //   return (
// //     <DocumentShell
// //       eyebrow="Dispensing"
// //       title="New Contact Lens Job"
// //       subtitle="Create the dispensing job from the patient's completed contact-lens consultation."
// //       code="NEW CONTACT LENS"
// //       actions={
// //         <button
// //           form="cl-form"
// //           disabled={Boolean(form.patientId) && !consult && form.orderType === "order_only"}
// //           className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
// //         >
// //           <Save size={14} />
// //           Create job
// //         </button>
// //       }
// //     >
// //       {error && (
// //         <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
// //           {error}
// //         </div>
// //       )}
// //       <form id="cl-form" onSubmit={save}>
// //         <Section number="01" title="Patient">
// //           <div className="relative">
// //             <Field
// //               label="Search patient"
// //               value={search}
// //               onChange={setSearch}
// //               placeholder="Name, phone or patient number..."
// //             />
// //             {search && patients.length > 0 && (
// //               <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
// //                 {patients.slice(0, 8).map((p) => (
// //                   <button
// //                     type="button"
// //                     key={p._id}
// //                     onClick={() => {
// //                       setSelected(p._id);
// //                       setForm((f) => ({ ...f, patientId: p._id }));
// //                       setSearch("");
// //                     }}
// //                     className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
// //                   >
// //                     <b>{name(p)}</b>
// //                     <span className="ml-3 text-xs text-slate-400">
// //                       {p.patientNumber} · {p.phone || "No phone"}
// //                     </span>
// //                   </button>
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //           {selected && !consult && (
// //             <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
// //               <div className="font-bold">Contact-lens consultation required</div>
// //               <p className="mt-1 leading-5">Complete the clinical contact-lens consultation first. This page is only for creating the dispensing job.</p>
// //               <button
// //                 type="button"
// //                 onClick={() => nav(`/patients/${selected}/consultations/new?type=specialized&specializedType=contact_lenses`)}
// //                 className="mt-2 font-bold underline underline-offset-2"
// //               >Open contact-lens consultation</button>
// //             </div>
// //           )}
// //           {selected && (
// //             <div className="mt-4">
// //               <InfoGrid
// //                 items={[
// //                   { label: "Patient ID", value: form.patientId },
// //                   {
// //                     label: "Consultation",
// //                     value: consult?.consultationDate
// //                       ? new Date(consult.consultationDate).toLocaleDateString(
// //                           "en-IN",
// //                         )
// //                       : "No contact-lens consultation",
// //                   },
// //                   {
// //                     label: "Clinician",
// //                     value:
// //                       [
// //                         consult?.optometristId?.firstName,
// //                         consult?.optometristId?.lastName,
// //                       ]
// //                         .filter(Boolean)
// //                         .join(" ") || "—",
// //                   },
// //                 ]}
// //               />
// //             </div>
// //           )}
// //         </Section>
// //         <Section number="02" title="Order details">
// //           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
// //             <Field
// //               label="Order type"
// //               value={form.orderType}
// //               onChange={(v) => setForm({ ...form, orderType: v })}
// //               options={[
// //                 "order_only",
// //                 "repeat_order",
// //               ]}
// //             />
// //             <Field
// //               label="Catalogue lens"
// //               value=""
// //               onChange={(v) => {
// //                 const x = catalogue.find((c) => c._id === v);
// //                 if (x)
// //                   setForm((f) => ({
// //                     ...f,
// //                     lensType: x.lensType,
// //                     brand: x.brand,
// //                     model: x.model,
// //                     supplier: x.supplierId?.name || x.supplierId || "",
// //                     unitPrice: Number(x.sellingPrice || 0),
// //                     catalogueId: x._id,
// //                   }));
// //               }}
// //               options={[
// //                 { value: "", label: "Select catalogue lens" },
// //                 ...catalogue.map((c) => ({
// //                   value: c._id,
// //                   label: `${c.code} · ${c.brand} ${c.model}`,
// //                 })),
// //               ]}
// //             />
// //             <Field
// //               label="Lens type"
// //               value={form.lensType}
// //               onChange={(v) => setForm({ ...form, lensType: v })}
// //               options={[
// //                 "Soft",
// //                 "RGP",
// //                 "Toric",
// //                 "Multifocal",
// //                 "Cosmetic",
// //                 "Other",
// //               ]}
// //             />
// //             <Field
// //               label="Brand"
// //               value={form.brand}
// //               onChange={(v) => setForm({ ...form, brand: v })}
// //             />
// //             <Field
// //               label="Model"
// //               value={form.model}
// //               onChange={(v) => setForm({ ...form, model: v })}
// //             />
// //             <Field
// //               label="Supplier"
// //               value={form.supplier}
// //               onChange={(v) => setForm({ ...form, supplier: v })}
// //             />
// //             <Field
// //               label="Replacement"
// //               value={form.replacement}
// //               onChange={(v) => setForm({ ...form, replacement: v })}
// //               options={[
// //                 "Daily",
// //                 "Fortnightly",
// //                 "Monthly",
// //                 "3 Monthly",
// //                 "6 Monthly",
// //                 "Yearly",
// //                 "Other",
// //               ]}
// //             />
// //             <Field
// //               label="Quantity"
// //               type="number"
// //               value={form.quantity}
// //               onChange={(v) => setForm({ ...form, quantity: Number(v) })}
// //             />
// //             <Field
// //               label="Due date"
// //               type="date"
// //               value={form.dueDate}
// //               onChange={(v) => setForm({ ...form, dueDate: v })}
// //             />
// //           </div>
// //         </Section>
// //         <Section number="03" title="Right eye">
// //           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
// //             {[
// //               "power",
// //               "sphere",
// //               "cylinder",
// //               "axis",
// //               "bc",
// //               "dia",
// //               "add",
// //               "colour",
// //             ].map((k) => (
// //               <Field
// //                 key={k}
// //                 label={k.toUpperCase()}
// //                 value={form.right[k]}
// //                 onChange={(v) => setEye("right", k, v)}
// //               />
// //             ))}
// //           </div>
// //         </Section>
// //         <Section number="04" title="Left eye">
// //           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
// //             {[
// //               "power",
// //               "sphere",
// //               "cylinder",
// //               "axis",
// //               "bc",
// //               "dia",
// //               "add",
// //               "colour",
// //             ].map((k) => (
// //               <Field
// //                 key={k}
// //                 label={k.toUpperCase()}
// //                 value={form.left[k]}
// //                 onChange={(v) => setEye("left", k, v)}
// //               />
// //             ))}
// //           </div>
// //         </Section>
// //         <Section number="05" title="Pricing">
// //           <div className="grid gap-4 sm:grid-cols-3">
// //             <Field
// //               label="Unit price"
// //               type="number"
// //               value={form.unitPrice}
// //               onChange={(v) => setForm({ ...form, unitPrice: Number(v) })}
// //             />
// //             <Field
// //               label="Discount"
// //               type="number"
// //               value={form.discount}
// //               onChange={(v) => setForm({ ...form, discount: Number(v) })}
// //             />
// //             <Field label="Total" value={`₹${total.toFixed(2)}`} disabled />
// //           </div>
// //         </Section>
// //         <Section number="06" title="Notes">
// //           <Field
// //             label="Order notes"
// //             type="textarea"
// //             value={form.notes}
// //             onChange={(v) => setForm({ ...form, notes: v })}
// //           />
// //         </Section>
// //       </form>
// //     </DocumentShell>
// //   );
// // }
// import { useEffect, useMemo, useState } from "react";
// import {
//   Check,
//   ChevronDown,
//   Loader2,
//   Search,
//   Save,
//   UserRound,
//   X,
// } from "lucide-react";
// import {
//   useNavigate,
//   useParams,
//   useSearchParams,
// } from "react-router-dom";

// import {
//   createContactLens,
//   getLatestContactLensConsultation,
// } from "../contactLens.api";

// import { getPatients } from "../../patients/patient.api";
// import { getContactLensCodes } from "../../catalogue/catalogue.api";

// import {
//   DocumentShell,
//   Section,
//   Field,
//   InfoGrid,
// } from "../../../components/common/DocumentUI";

// const eye = () => ({
//   power: "",
//   sphere: "",
//   cylinder: "",
//   axis: "",
//   bc: "",
//   dia: "",
//   add: "",
//   colour: "",
// });

// const name = (patient) =>
//   [
//     patient?.firstName,
//     patient?.middleName,
//     patient?.lastName,
//   ]
//     .filter(Boolean)
//     .join(" ");

// const getPatientRows = (response) => {
//   if (Array.isArray(response?.data?.patients)) {
//     return response.data.patients;
//   }

//   if (Array.isArray(response?.data)) {
//     return response.data;
//   }

//   if (Array.isArray(response?.patients)) {
//     return response.patients;
//   }

//   return [];
// };

// const getCatalogueRows = (response) => {
//   if (Array.isArray(response?.data)) {
//     return response.data;
//   }

//   if (Array.isArray(response?.data?.data)) {
//     return response.data.data;
//   }

//   return [];
// };

// export default function NewContactLensPage() {
//   const navigate = useNavigate();

//   const { patientId: routePatientId } = useParams();
//   const [searchParams] = useSearchParams();

//   const initialPatientId =
//     routePatientId || searchParams.get("patientId") || "";

//   const [patients, setPatients] = useState([]);
//   const [catalogue, setCatalogue] = useState([]);

//   const [search, setSearch] = useState("");
//   const [selectedPatient, setSelectedPatient] = useState(null);

//   const [consult, setConsult] = useState(null);

//   const [loadingPatients, setLoadingPatients] = useState(false);
//   const [loadingConsultation, setLoadingConsultation] = useState(false);
//   const [loadingCatalogue, setLoadingCatalogue] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const [patientSelectorOpen, setPatientSelectorOpen] = useState(
//     !initialPatientId,
//   );

//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     patientId: initialPatientId,
//     consultationId: "",

//     orderType: "order_only",

//     lensType: "Soft",
//     brand: "",
//     model: "",
//     supplier: "",

//     right: eye(),
//     left: eye(),

//     replacement: "Monthly",

//     quantity: 1,
//     unitPrice: 0,
//     discount: 0,

//     dueDate: "",
//     notes: "",
//   });

//   // ==========================================================
//   // LOAD PATIENTS
//   // ==========================================================

//   useEffect(() => {
//     let cancelled = false;

//     const timer = setTimeout(async () => {
//       setLoadingPatients(true);

//       try {
//         const response = await getPatients({
//           limit: 20,
//           search: search.trim(),
//         });

//         if (!cancelled) {
//           setPatients(getPatientRows(response));
//         }
//       } catch {
//         if (!cancelled) {
//           setPatients([]);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoadingPatients(false);
//         }
//       }
//     }, 250);

//     return () => {
//       cancelled = true;
//       clearTimeout(timer);
//     };
//   }, [search]);

//   // ==========================================================
//   // LOAD CATALOGUE
//   // ==========================================================

//   useEffect(() => {
//     let cancelled = false;

//     const loadCatalogue = async () => {
//       setLoadingCatalogue(true);

//       try {
//         const response = await getContactLensCodes();

//         if (!cancelled) {
//           setCatalogue(getCatalogueRows(response));
//         }
//       } catch {
//         if (!cancelled) {
//           setCatalogue([]);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoadingCatalogue(false);
//         }
//       }
//     };

//     loadCatalogue();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // ==========================================================
//   // RESOLVE PATIENT FROM URL
//   // ==========================================================

//   useEffect(() => {
//     if (!initialPatientId) return;

//     let cancelled = false;

//     const resolvePatient = async () => {
//       try {
//         const response = await getPatients({
//           limit: 20,
//           search: initialPatientId,
//         });

//         const rows = getPatientRows(response);

//         const found = rows.find(
//           (patient) => patient?._id === initialPatientId,
//         );

//         if (!cancelled && found) {
//           setSelectedPatient(found);
//           setPatientSelectorOpen(false);
//         }
//       } catch {
//         // The patient can still be used through the supplied patientId.
//       }
//     };

//     resolvePatient();

//     return () => {
//       cancelled = true;
//     };
//   }, [initialPatientId]);

//   // ==========================================================
//   // LOAD LATEST CONTACT-LENS CONSULTATION
//   // ==========================================================

//   useEffect(() => {
//     if (!form.patientId) {
//       setConsult(null);
//       setForm((current) => ({
//         ...current,
//         consultationId: "",
//       }));
//       return;
//     }

//     let cancelled = false;

//     const loadConsultation = async () => {
//       setLoadingConsultation(true);

//       try {
//         const response =
//           await getLatestContactLensConsultation(form.patientId);

//         const consultation = response?.data || null;

//         if (!cancelled) {
//           setConsult(consultation);

//           setForm((current) => ({
//             ...current,
//             consultationId: consultation?._id || "",
//           }));
//         }
//       } catch {
//         if (!cancelled) {
//           setConsult(null);

//           setForm((current) => ({
//             ...current,
//             consultationId: "",
//           }));
//         }
//       } finally {
//         if (!cancelled) {
//           setLoadingConsultation(false);
//         }
//       }
//     };

//     loadConsultation();

//     return () => {
//       cancelled = true;
//     };
//   }, [form.patientId]);

//   // ==========================================================
//   // FILTER PATIENT RESULTS
//   // ==========================================================

//   const patientResults = useMemo(() => {
//     const term = search.trim().toLowerCase();

//     if (!term) {
//       return patients;
//     }

//     return patients.filter((patient) => {
//       const searchable = [
//         name(patient),
//         patient?.patientNumber,
//         patient?.phone,
//         patient?.alternatePhone,
//         patient?.email,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchable.includes(term);
//     });
//   }, [patients, search]);

//   // ==========================================================
//   // TOTAL
//   // ==========================================================

//   const total = Math.max(
//     0,
//     Number(form.quantity || 1) *
//       Number(form.unitPrice || 0) -
//       Number(form.discount || 0),
//   );

//   // ==========================================================
//   // PATIENT SELECTION
//   // ==========================================================

//   const selectPatient = (patient) => {
//     if (!patient?._id) return;

//     setSelectedPatient(patient);

//     setForm((current) => ({
//       ...current,
//       patientId: patient._id,
//       consultationId: "",
//     }));

//     setConsult(null);
//     setSearch("");
//     setError("");
//     setPatientSelectorOpen(false);
//   };

//   const clearPatient = () => {
//     setSelectedPatient(null);

//     setForm((current) => ({
//       ...current,
//       patientId: "",
//       consultationId: "",
//     }));

//     setConsult(null);
//     setSearch("");
//     setError("");
//     setPatientSelectorOpen(true);
//   };

//   // ==========================================================
//   // SET EYE
//   // ==========================================================

//   const setEye = (side, key, value) => {
//     setForm((current) => ({
//       ...current,
//       [side]: {
//         ...current[side],
//         [key]: value,
//       },
//     }));
//   };

//   // ==========================================================
//   // SAVE
//   // ==========================================================

//   const save = async (event) => {
//     event.preventDefault();

//     setError("");

//     if (!form.patientId) {
//       setError("Please select a patient before creating the contact lens job.");
//       setPatientSelectorOpen(true);
//       return;
//     }

//     if (
//       form.orderType === "order_only" &&
//       !consult
//     ) {
//       setError(
//         "Complete the contact-lens consultation before creating this dispensing job.",
//       );
//       return;
//     }

//     setSaving(true);

//     try {
//       const response = await createContactLens({
//         ...form,
//         total,
//       });

//       navigate(
//         `/dispensing/contact-lenses/${response?.data?._id}`,
//       );
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           "Unable to create contact lens order.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================================
//   // CATALOGUE SELECT
//   // ==========================================================

//   const handleCatalogueChange = (value) => {
//     const item = catalogue.find(
//       (catalogueItem) => catalogueItem?._id === value,
//     );

//     if (!item) {
//       setForm((current) => ({
//         ...current,
//         catalogueId: "",
//       }));

//       return;
//     }

//     setForm((current) => ({
//       ...current,

//       catalogueId: item._id,

//       lensType: item.lensType || current.lensType,
//       brand: item.brand || "",
//       model: item.model || "",
//       supplier:
//         item.supplierId?.name ||
//         item.supplierId ||
//         "",

//       unitPrice: Number(
//         item.sellingPrice || 0,
//       ),
//     }));
//   };

//   // ==========================================================
//   // RENDER
//   // ==========================================================

//   return (
//     <DocumentShell
//       eyebrow="Dispensing"
//       title="New Contact Lens Job"
//       subtitle="Create a contact lens dispensing order for the selected patient."
//       code="NEW CONTACT LENS"
//       actions={
//         <button
//           type="submit"
//           form="cl-form"
//           disabled={
//             saving ||
//             !form.patientId ||
//             (form.orderType === "order_only" &&
//               !consult)
//           }
//           className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
//         >
//           {saving ? (
//             <Loader2
//               size={14}
//               className="animate-spin"
//             />
//           ) : (
//             <Save size={14} />
//           )}

//           {saving ? "Creating..." : "Create job"}
//         </button>
//       }
//     >
//       {error && (
//         <div className="m-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           <div>
//             <div className="font-semibold">
//               Unable to continue
//             </div>

//             <div className="mt-0.5 text-xs leading-5">
//               {error}
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={() => setError("")}
//             className="rounded-lg p-1 text-red-500 hover:bg-red-100"
//           >
//             <X size={15} />
//           </button>
//         </div>
//       )}

//       <form
//         id="cl-form"
//         onSubmit={save}
//       >
//         {/* =====================================================
//             PATIENT
//         ====================================================== */}

//         <Section
//           number="01"
//           title="Patient"
//         >
//           {!form.patientId ? (
//             <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
//               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                 <div>
//                   <div className="flex items-center gap-2">
//                     <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
//                       <UserRound size={17} />
//                     </div>

//                     <div>
//                       <div className="text-sm font-bold text-slate-900">
//                         No patient selected
//                       </div>

//                       <div className="mt-0.5 text-xs text-slate-500">
//                         Select the patient for this contact lens order.
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setPatientSelectorOpen(true)
//                   }
//                   className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
//                 >
//                   <Search size={14} />
//                   Select patient
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4">
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                 <div className="flex min-w-0 items-center gap-3">
//                   <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm">
//                     {(
//                       (selectedPatient?.firstName?.[0] || "") +
//                       (selectedPatient?.lastName?.[0] || "")
//                     ).toUpperCase() || "P"}
//                   </div>

//                   <div className="min-w-0">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <span className="truncate text-sm font-bold text-slate-900">
//                         {name(selectedPatient) ||
//                           "Selected patient"}
//                       </span>

//                       <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
//                         Selected
//                       </span>
//                     </div>

//                     <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
//                       <span>
//                         {selectedPatient?.patientNumber ||
//                           form.patientId}
//                       </span>

//                       {selectedPatient?.phone && (
//                         <span>
//                           {selectedPatient.phone}
//                         </span>
//                       )}

//                       {selectedPatient?.email && (
//                         <span className="truncate">
//                           {selectedPatient.email}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex shrink-0 gap-2">
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setPatientSelectorOpen(true)
//                     }
//                     className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
//                   >
//                     <Search size={13} />
//                     Change
//                   </button>

//                   <button
//                     type="button"
//                     onClick={clearPatient}
//                     className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
//                   >
//                     <X size={13} />
//                     Clear
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {form.patientId && (
//             <div className="mt-4">
//               {loadingConsultation ? (
//                 <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
//                   <Loader2
//                     size={14}
//                     className="animate-spin"
//                   />
//                   Checking latest contact-lens consultation...
//                 </div>
//               ) : consult ? (
//                 <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
//                   <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
//                     <Check size={14} />
//                     Contact-lens consultation available
//                   </div>

//                   <p className="mt-1 text-[11px] leading-5 text-emerald-700">
//                     The latest contact-lens clinical consultation has been linked
//                     to this dispensing job.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
//                   <div className="font-bold">
//                     Contact-lens consultation required
//                   </div>

//                   <p className="mt-1 leading-5">
//                     Complete the clinical contact-lens consultation first.
//                     This page is for creating the dispensing job.
//                   </p>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       navigate(
//                         `/patients/${form.patientId}/consultations/new?type=specialized&specializedType=contact_lenses`,
//                       )
//                     }
//                     className="mt-2 font-bold underline underline-offset-2"
//                   >
//                     Open contact-lens consultation
//                   </button>
//                 </div>
//               )}

//               <div className="mt-4">
//                 <InfoGrid
//                   items={[
//                     {
//                       label: "Patient",
//                       value:
//                         name(selectedPatient) ||
//                         form.patientId,
//                     },
//                     {
//                       label: "Patient number",
//                       value:
//                         selectedPatient?.patientNumber ||
//                         "—",
//                     },
//                     {
//                       label: "Consultation",
//                       value: consult?.consultationDate
//                         ? new Date(
//                             consult.consultationDate,
//                           ).toLocaleDateString(
//                             "en-IN",
//                           )
//                         : "No contact-lens consultation",
//                     },
//                     {
//                       label: "Clinician",
//                       value:
//                         [
//                           consult?.optometristId?.firstName,
//                           consult?.optometristId?.lastName,
//                         ]
//                           .filter(Boolean)
//                           .join(" ") || "—",
//                     },
//                   ]}
//                 />
//               </div>
//             </div>
//           )}
//         </Section>

//         {/* =====================================================
//             ORDER DETAILS
//         ====================================================== */}

//         <Section
//           number="02"
//           title="Order details"
//         >
//           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//             <Field
//               label="Order type"
//               value={form.orderType}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   orderType: value,
//                 }))
//               }
//               options={[
//                 "order_only",
//                 "repeat_order",
//               ]}
//             />

//             <Field
//               label="Catalogue lens"
//               value={form.catalogueId || ""}
//               onChange={handleCatalogueChange}
//               disabled={loadingCatalogue}
//               options={[
//                 {
//                   value: "",
//                   label: loadingCatalogue
//                     ? "Loading catalogue..."
//                     : "Select catalogue lens",
//                 },
//                 ...catalogue.map((item) => ({
//                   value: item._id,
//                   label: [
//                     item.code,
//                     item.brand,
//                     item.model,
//                   ]
//                     .filter(Boolean)
//                     .join(" · "),
//                 })),
//               ]}
//             />

//             <Field
//               label="Lens type"
//               value={form.lensType}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   lensType: value,
//                 }))
//               }
//               options={[
//                 "Soft",
//                 "RGP",
//                 "Toric",
//                 "Multifocal",
//                 "Cosmetic",
//                 "Other",
//               ]}
//             />

//             <Field
//               label="Brand"
//               value={form.brand}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   brand: value,
//                 }))
//               }
//             />

//             <Field
//               label="Model"
//               value={form.model}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   model: value,
//                 }))
//               }
//             />

//             <Field
//               label="Supplier"
//               value={form.supplier}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   supplier: value,
//                 }))
//               }
//             />

//             <Field
//               label="Replacement"
//               value={form.replacement}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   replacement: value,
//                 }))
//               }
//               options={[
//                 "Daily",
//                 "Fortnightly",
//                 "Monthly",
//                 "3 Monthly",
//                 "6 Monthly",
//                 "Yearly",
//                 "Other",
//               ]}
//             />

//             <Field
//               label="Quantity"
//               type="number"
//               value={form.quantity}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   quantity: Math.max(
//                     1,
//                     Number(value || 1),
//                   ),
//                 }))
//               }
//             />

//             <Field
//               label="Due date"
//               type="date"
//               value={form.dueDate}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   dueDate: value,
//                 }))
//               }
//             />
//           </div>
//         </Section>

//         {/* =====================================================
//             RIGHT EYE
//         ====================================================== */}

//         <Section
//           number="03"
//           title="Right eye"
//         >
//           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//             {[
//               "power",
//               "sphere",
//               "cylinder",
//               "axis",
//               "bc",
//               "dia",
//               "add",
//               "colour",
//             ].map((key) => (
//               <Field
//                 key={key}
//                 label={key.toUpperCase()}
//                 value={form.right[key]}
//                 onChange={(value) =>
//                   setEye(
//                     "right",
//                     key,
//                     value,
//                   )
//                 }
//               />
//             ))}
//           </div>
//         </Section>

//         {/* =====================================================
//             LEFT EYE
//         ====================================================== */}

//         <Section
//           number="04"
//           title="Left eye"
//         >
//           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//             {[
//               "power",
//               "sphere",
//               "cylinder",
//               "axis",
//               "bc",
//               "dia",
//               "add",
//               "colour",
//             ].map((key) => (
//               <Field
//                 key={key}
//                 label={key.toUpperCase()}
//                 value={form.left[key]}
//                 onChange={(value) =>
//                   setEye(
//                     "left",
//                     key,
//                     value,
//                   )
//                 }
//               />
//             ))}
//           </div>
//         </Section>

//         {/* =====================================================
//             PRICING
//         ====================================================== */}

//         <Section
//           number="05"
//           title="Pricing"
//         >
//           <div className="grid gap-4 sm:grid-cols-3">
//             <Field
//               label="Unit price"
//               type="number"
//               value={form.unitPrice}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   unitPrice: Math.max(
//                     0,
//                     Number(value || 0),
//                   ),
//                 }))
//               }
//             />

//             <Field
//               label="Discount"
//               type="number"
//               value={form.discount}
//               onChange={(value) =>
//                 setForm((current) => ({
//                   ...current,
//                   discount: Math.max(
//                     0,
//                     Number(value || 0),
//                   ),
//                 }))
//               }
//             />

//             <Field
//               label="Total"
//               value={`₹${total.toFixed(2)}`}
//               disabled
//             />
//           </div>
//         </Section>

//         {/* =====================================================
//             NOTES
//         ====================================================== */}

//         <Section
//           number="06"
//           title="Notes"
//         >
//           <Field
//             label="Order notes"
//             type="textarea"
//             value={form.notes}
//             onChange={(value) =>
//               setForm((current) => ({
//                 ...current,
//                 notes: value,
//               }))
//             }
//           />
//         </Section>
//       </form>

//       {/* =======================================================
//           PATIENT SELECTOR
//       ======================================================== */}

//       {patientSelectorOpen && (
//         <div
//           className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="contact-lens-select-patient"
//           onMouseDown={(event) => {
//             if (event.target === event.currentTarget) {
//               setPatientSelectorOpen(false);
//             }
//           }}
//         >
//           <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
//             {/* Header */}

//             <header className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-5 sm:px-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
//                     Contact lens dispensing
//                   </div>

//                   <h2
//                     id="contact-lens-select-patient"
//                     className="mt-1 text-xl font-bold tracking-tight text-slate-900"
//                   >
//                     Select patient
//                   </h2>

//                   <p className="mt-1 text-xs leading-5 text-slate-500">
//                     Search by patient name, patient number or phone number.
//                   </p>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setPatientSelectorOpen(false)
//                   }
//                   className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
//                   aria-label="Close patient selector"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>

//               {/* Search */}

//               <div className="relative mt-5">
//                 <Search
//                   size={17}
//                   className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
//                 />

//                 <input
//                   autoFocus
//                   value={search}
//                   onChange={(event) =>
//                     setSearch(event.target.value)
//                   }
//                   placeholder="Search patient, phone or patient number..."
//                   className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
//                 />

//                 {search && (
//                   <button
//                     type="button"
//                     onClick={() => setSearch("")}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
//                   >
//                     <X size={14} />
//                   </button>
//                 )}
//               </div>
//             </header>

//             {/* Results */}

//             <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
//               {loadingPatients ? (
//                 <div className="flex min-h-[240px] items-center justify-center">
//                   <div className="flex items-center gap-2 text-xs text-slate-400">
//                     <Loader2
//                       size={16}
//                       className="animate-spin"
//                     />
//                     Searching patients...
//                   </div>
//                 </div>
//               ) : patientResults.length === 0 ? (
//                 <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
//                     <UserRound size={23} />
//                   </div>

//                   <div className="mt-4 text-sm font-bold text-slate-700">
//                     No patients found
//                   </div>

//                   <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
//                     Try searching with a different name, phone number or
//                     patient number.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {patientResults
//                     .slice(0, 12)
//                     .map((patient) => {
//                       const isSelected =
//                         patient?._id === form.patientId;

//                       const initials =
//                         (
//                           (patient?.firstName?.[0] ||
//                             "") +
//                           (patient?.lastName?.[0] ||
//                             "")
//                         ).toUpperCase() || "P";

//                       return (
//                         <button
//                           type="button"
//                           key={patient._id}
//                           onClick={() =>
//                             selectPatient(patient)
//                           }
//                           className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
//                             isSelected
//                               ? "border-violet-300 bg-violet-50"
//                               : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
//                           }`}
//                         >
//                           <div
//                             className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
//                               isSelected
//                                 ? "bg-violet-600 text-white"
//                                 : "bg-gradient-to-br from-violet-100 to-blue-100 text-violet-700"
//                             }`}
//                           >
//                             {initials}
//                           </div>

//                           <div className="min-w-0 flex-1">
//                             <div className="truncate text-sm font-bold text-slate-900">
//                               {name(patient) ||
//                                 "Unnamed patient"}
//                             </div>

//                             <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
//                               {patient?.patientNumber && (
//                                 <span>
//                                   {patient.patientNumber}
//                                 </span>
//                               )}

//                               {patient?.phone && (
//                                 <span>
//                                   {patient.phone}
//                                 </span>
//                               )}

//                               {patient?.email && (
//                                 <span className="max-w-[220px] truncate">
//                                   {patient.email}
//                                 </span>
//                               )}
//                             </div>
//                           </div>

//                           {isSelected && (
//                             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
//                               <Check size={15} />
//                             </div>
//                           )}
//                         </button>
//                       );
//                     })}
//                 </div>
//               )}
//             </div>

//             {/* Footer */}

//             <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
//               <span className="text-[10px] font-medium text-slate-400">
//                 {patientResults.length
//                   ? `${Math.min(
//                       patientResults.length,
//                       12,
//                     )} patients shown`
//                   : "No matching patients"}
//               </span>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setPatientSelectorOpen(false)
//                 }
//                 className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
//               >
//                 Cancel
//               </button>
//             </footer>
//           </div>
//         </div>
//       )}
//     </DocumentShell>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  Save,
  UserRound,
} from "lucide-react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { createContactLens } from "../contactLens.api";
import { getPatients } from "../../patients/patient.api";
import { getContactLensCodes } from "../../catalogue/catalogue.api";

import {
  DocumentShell,
  Section,
  Field,
  InfoGrid,
} from "../../../components/common/DocumentUI";

const emptyEye = () => ({
  power: "",
  sphere: "",
  cylinder: "",
  axis: "",
  bc: "",
  dia: "",
  add: "",
  colour: "",
});

const patientName = (patient) =>
  [
    patient?.firstName,
    patient?.middleName,
    patient?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

const getRows = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.patients)) {
    return response.data.patients;
  }

  return [];
};

export default function NewContactLensPage() {
  const navigate = useNavigate();

  const { patientId: routePatientId } = useParams();
  const [searchParams] = useSearchParams();

  const initialPatientId =
    routePatientId ||
    searchParams.get("patientId") ||
    "";

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [catalogue, setCatalogue] = useState([]);

  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    patientId: initialPatientId,

    orderType: "order_only",

    lensType: "Soft",
    brand: "",
    model: "",
    supplier: "",

    right: emptyEye(),
    left: emptyEye(),

    replacement: "Monthly",

    quantity: 1,
    unitPrice: 0,
    discount: 0,

    dueDate: "",
    notes: "",
  });

  // ------------------------------------------------------------
  // LOAD PATIENT
  // ------------------------------------------------------------

  useEffect(() => {
    if (!initialPatientId) return;

    let active = true;

    getPatients({
      search: initialPatientId,
      limit: 20,
    })
      .then((response) => {
        if (!active) return;

        const rows = getRows(response);

        const found = rows.find(
          (item) => item._id === initialPatientId,
        );

        if (found) {
          setSelectedPatient(found);
          setForm((current) => ({
            ...current,
            patientId: found._id,
          }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialPatientId]);

  // ------------------------------------------------------------
  // SEARCH PATIENTS
  // ------------------------------------------------------------

  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatients([]);
      return;
    }

    let active = true;

    const timer = setTimeout(async () => {
      try {
        setLoadingPatients(true);

        const response = await getPatients({
          search: patientSearch.trim(),
          limit: 20,
        });

        if (active) {
          setPatients(getRows(response));
        }
      } catch {
        if (active) {
          setPatients([]);
        }
      } finally {
        if (active) {
          setLoadingPatients(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [patientSearch]);

  // ------------------------------------------------------------
  // LOAD CONTACT LENS CATALOGUE
  // ------------------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadCatalogue = async () => {
      try {
        setLoadingCatalogue(true);

        const response = await getContactLensCodes();

        if (active) {
          setCatalogue(
            Array.isArray(response?.data)
              ? response.data
              : [],
          );
        }
      } catch {
        if (active) {
          setCatalogue([]);
        }
      } finally {
        if (active) {
          setLoadingCatalogue(false);
        }
      }
    };

    void loadCatalogue();

    return () => {
      active = false;
    };
  }, []);

  // ------------------------------------------------------------
  // TOTAL
  // ------------------------------------------------------------

  const total = useMemo(() => {
    const subtotal =
      Number(form.quantity || 1) *
      Number(form.unitPrice || 0);

    return Math.max(
      0,
      subtotal - Number(form.discount || 0),
    );
  }, [
    form.quantity,
    form.unitPrice,
    form.discount,
  ]);

  // ------------------------------------------------------------
  // SELECT PATIENT
  // ------------------------------------------------------------

  const selectPatient = (patient) => {
    setSelectedPatient(patient);

    setForm((current) => ({
      ...current,
      patientId: patient._id,
    }));

    setPatientSearch("");
    setPatients([]);
    setError("");
  };

  // ------------------------------------------------------------
  // SELECT CATALOGUE
  // ------------------------------------------------------------

  const selectCatalogueLens = (id) => {
    const item = catalogue.find(
      (entry) => entry._id === id,
    );

    if (!item) return;

    setForm((current) => ({
      ...current,

      lensType:
        item.lensType ||
        current.lensType,

      brand:
        item.brand ||
        current.brand,

      model:
        item.model ||
        current.model,

      supplier:
        item.supplierId?.name ||
        item.supplierId ||
        current.supplier,

      unitPrice:
        Number(item.sellingPrice || 0),

      catalogueId: item._id,
    }));
  };

  // ------------------------------------------------------------
  // UPDATE EYE
  // ------------------------------------------------------------

  const updateEye = (
    eye,
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,

      [eye]: {
        ...current[eye],
        [field]: value,
      },
    }));
  };

  // ------------------------------------------------------------
  // SAVE JOB
  // ------------------------------------------------------------

  const save = async (event) => {
    event.preventDefault();

    if (!form.patientId) {
      setError("Please select a patient.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await createContactLens({
          ...form,
          orderType: "order_only",
          total,
        });

      const created =
        response?.data ||
        response;

      if (created?._id) {
        navigate(
          `/dispensing/contact-lenses/${created._id}`,
        );
        return;
      }

      navigate("/dispensing/contact-lenses");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create contact lens job.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocumentShell
      eyebrow="Dispensing"
      title="New Contact Lens Job"
      subtitle="Create a contact lens dispensing job for an existing patient."
      code="CONTACT LENS JOB"
      actions={
        <>
          <button
            type="button"
            onClick={() =>
              navigate("/dispensing/contact-lenses")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            type="submit"
            form="contact-lens-job-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Creating..." : "Create Job"}
          </button>
        </>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        id="contact-lens-job-form"
        onSubmit={save}
      >
        {/* =====================================================
            PATIENT
        ===================================================== */}

        <Section
          number="01"
          title="Patient"
          description="Every dispensing job must belong to a patient."
        >
          {!selectedPatient ? (
            <div className="relative">
              <Field
                label="Search patient"
                value={patientSearch}
                onChange={setPatientSearch}
                placeholder="Name, phone or patient number..."
              />

              {loadingPatients && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-400">
                  Searching patients...
                </div>
              )}

              {!loadingPatients &&
                patientSearch &&
                patients.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {patients.map((patient) => (
                      <button
                        key={patient._id}
                        type="button"
                        onClick={() =>
                          selectPatient(patient)
                        }
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <UserRound size={15} />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {patientName(patient)}
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {patient.patientNumber ||
                              "No patient number"}{" "}
                            ·{" "}
                            {patient.phone ||
                              "No phone"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {!loadingPatients &&
                patientSearch &&
                patients.length === 0 && (
                  <div className="mt-2 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                    No patients found.
                  </div>
                )}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {patientName(selectedPatient)}
                    </div>

                    <div className="mt-1 text-[10px] text-slate-500">
                      {selectedPatient.patientNumber ||
                        "No patient number"}{" "}
                      ·{" "}
                      {selectedPatient.phone ||
                        "No phone"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPatient(null)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* =====================================================
            ORDER
        ===================================================== */}

        <Section
          number="02"
          title="Lens order"
          description="Select the dispensing lens and order parameters."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <Field
              label="Catalogue lens"
              value=""
              onChange={selectCatalogueLens}
              options={[
                {
                  value: "",
                  label: loadingCatalogue
                    ? "Loading catalogue..."
                    : "Select catalogue lens",
                },

                ...catalogue.map(
                  (item) => ({
                    value: item._id,
                    label: `${item.code || "—"} · ${
                      item.brand || ""
                    } ${item.model || ""}`,
                  }),
                ),
              ]}
            />

            <Field
              label="Lens type"
              value={form.lensType}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  lensType: value,
                }))
              }
              options={[
                "Soft",
                "RGP",
                "Toric",
                "Multifocal",
                "Cosmetic",
                "Other",
              ]}
            />

            <Field
              label="Brand"
              value={form.brand}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  brand: value,
                }))
              }
            />

            <Field
              label="Model"
              value={form.model}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  model: value,
                }))
              }
            />

            <Field
              label="Supplier"
              value={form.supplier}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  supplier: value,
                }))
              }
            />

            <Field
              label="Replacement"
              value={form.replacement}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  replacement: value,
                }))
              }
              options={[
                "Daily",
                "Fortnightly",
                "Monthly",
                "3 Monthly",
                "6 Monthly",
                "Yearly",
                "Other",
              ]}
            />

            <Field
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  quantity: Math.max(
                    1,
                    Number(value || 1),
                  ),
                }))
              }
            />

            <Field
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  dueDate: value,
                }))
              }
            />

          </div>
        </Section>

        {/* =====================================================
            RIGHT EYE
        ===================================================== */}

        <Section
          number="03"
          title="Right eye"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "power",
              "sphere",
              "cylinder",
              "axis",
              "bc",
              "dia",
              "add",
              "colour",
            ].map((field) => (
              <Field
                key={field}
                label={field.toUpperCase()}
                value={form.right[field]}
                onChange={(value) =>
                  updateEye(
                    "right",
                    field,
                    value,
                  )
                }
              />
            ))}
          </div>
        </Section>

        {/* =====================================================
            LEFT EYE
        ===================================================== */}

        <Section
          number="04"
          title="Left eye"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "power",
              "sphere",
              "cylinder",
              "axis",
              "bc",
              "dia",
              "add",
              "colour",
            ].map((field) => (
              <Field
                key={field}
                label={field.toUpperCase()}
                value={form.left[field]}
                onChange={(value) =>
                  updateEye(
                    "left",
                    field,
                    value,
                  )
                }
              />
            ))}
          </div>
        </Section>

        {/* =====================================================
            PRICING
        ===================================================== */}

        <Section
          number="05"
          title="Pricing"
        >
          <div className="grid gap-4 sm:grid-cols-3">

            <Field
              label="Unit price"
              type="number"
              value={form.unitPrice}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  unitPrice: Number(value || 0),
                }))
              }
            />

            <Field
              label="Discount"
              type="number"
              value={form.discount}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  discount: Number(value || 0),
                }))
              }
            />

            <Field
              label="Total"
              value={`₹${total.toFixed(2)}`}
              disabled
            />

          </div>
        </Section>

        {/* =====================================================
            NOTES
        ===================================================== */}

        <Section
          number="06"
          title="Notes"
        >
          <Field
            label="Job notes"
            type="textarea"
            value={form.notes}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                notes: value,
              }))
            }
          />
        </Section>
      </form>
    </DocumentShell>
  );
}