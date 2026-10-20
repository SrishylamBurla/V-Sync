// import { useEffect, useMemo, useState } from "react";
// import {
//   CheckCircle2,
//   Search,
//   Save,
//   UserRound,
// } from "lucide-react";
// import {
//   useNavigate,
//   useParams,
//   useSearchParams,
// } from "react-router-dom";

// import { createContactLens } from "../contactLens.api";
// import { getPatients } from "../../patients/patient.api";
// import { getContactLensCodes } from "../../catalogue/catalogue.api";

// import {
//   DocumentShell,
//   Section,
//   Field,
//   InfoGrid,
// } from "../../../components/common/DocumentUI";

// const emptyEye = () => ({
//   power: "",
//   sphere: "",
//   cylinder: "",
//   axis: "",
//   bc: "",
//   dia: "",
//   add: "",
//   colour: "",
// });

// const patientName = (patient) =>
//   [
//     patient?.firstName,
//     patient?.middleName,
//     patient?.lastName,
//   ]
//     .filter(Boolean)
//     .join(" ");

// const getRows = (response) => {
//   if (Array.isArray(response?.data)) {
//     return response.data;
//   }

//   if (Array.isArray(response?.data?.patients)) {
//     return response.data.patients;
//   }

//   return [];
// };

// export default function NewContactLensPage() {
//   const navigate = useNavigate();

//   const { patientId: routePatientId } = useParams();
//   const [searchParams] = useSearchParams();

//   const initialPatientId =
//     routePatientId ||
//     searchParams.get("patientId") ||
//     "";

//   const [patients, setPatients] = useState([]);
//   const [patientSearch, setPatientSearch] = useState("");
//   const [selectedPatient, setSelectedPatient] = useState(null);

//   const [catalogue, setCatalogue] = useState([]);

//   const [loadingPatients, setLoadingPatients] = useState(false);
//   const [loadingCatalogue, setLoadingCatalogue] = useState(false);

//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     patientId: initialPatientId,

//     orderType: "order_only",

//     lensType: "Soft",
//     brand: "",
//     model: "",
//     supplier: "",

//     right: emptyEye(),
//     left: emptyEye(),

//     replacement: "Monthly",

//     quantity: 1,
//     unitPrice: 0,
//     discount: 0,

//     dueDate: "",
//     notes: "",
//   });

//   // ------------------------------------------------------------
//   // LOAD PATIENT
//   // ------------------------------------------------------------

//   useEffect(() => {
//     if (!initialPatientId) return;

//     let active = true;

//     getPatients({
//       search: initialPatientId,
//       limit: 20,
//     })
//       .then((response) => {
//         if (!active) return;

//         const rows = getRows(response);

//         const found = rows.find(
//           (item) => item._id === initialPatientId,
//         );

//         if (found) {
//           setSelectedPatient(found);
//           setForm((current) => ({
//             ...current,
//             patientId: found._id,
//           }));
//         }
//       })
//       .catch(() => {});

//     return () => {
//       active = false;
//     };
//   }, [initialPatientId]);

//   // ------------------------------------------------------------
//   // SEARCH PATIENTS
//   // ------------------------------------------------------------

//   useEffect(() => {
//     if (!patientSearch.trim()) {
//       setPatients([]);
//       return;
//     }

//     let active = true;

//     const timer = setTimeout(async () => {
//       try {
//         setLoadingPatients(true);

//         const response = await getPatients({
//           search: patientSearch.trim(),
//           limit: 20,
//         });

//         if (active) {
//           setPatients(getRows(response));
//         }
//       } catch {
//         if (active) {
//           setPatients([]);
//         }
//       } finally {
//         if (active) {
//           setLoadingPatients(false);
//         }
//       }
//     }, 250);

//     return () => {
//       active = false;
//       clearTimeout(timer);
//     };
//   }, [patientSearch]);

//   // ------------------------------------------------------------
//   // LOAD CONTACT LENS CATALOGUE
//   // ------------------------------------------------------------

//   useEffect(() => {
//     let active = true;

//     const loadCatalogue = async () => {
//       try {
//         setLoadingCatalogue(true);

//         const response = await getContactLensCodes();

//         if (active) {
//           setCatalogue(
//             Array.isArray(response?.data)
//               ? response.data
//               : [],
//           );
//         }
//       } catch {
//         if (active) {
//           setCatalogue([]);
//         }
//       } finally {
//         if (active) {
//           setLoadingCatalogue(false);
//         }
//       }
//     };

//     void loadCatalogue();

//     return () => {
//       active = false;
//     };
//   }, []);

//   // ------------------------------------------------------------
//   // TOTAL
//   // ------------------------------------------------------------

//   const total = useMemo(() => {
//     const subtotal =
//       Number(form.quantity || 1) *
//       Number(form.unitPrice || 0);

//     return Math.max(
//       0,
//       subtotal - Number(form.discount || 0),
//     );
//   }, [
//     form.quantity,
//     form.unitPrice,
//     form.discount,
//   ]);

//   // ------------------------------------------------------------
//   // SELECT PATIENT
//   // ------------------------------------------------------------

//   const selectPatient = (patient) => {
//     setSelectedPatient(patient);

//     setForm((current) => ({
//       ...current,
//       patientId: patient._id,
//     }));

//     setPatientSearch("");
//     setPatients([]);
//     setError("");
//   };

//   // ------------------------------------------------------------
//   // SELECT CATALOGUE
//   // ------------------------------------------------------------

//   const selectCatalogueLens = (id) => {
//     const item = catalogue.find(
//       (entry) => entry._id === id,
//     );

//     if (!item) return;

//     setForm((current) => ({
//       ...current,

//       lensType:
//         item.lensType ||
//         current.lensType,

//       brand:
//         item.brand ||
//         current.brand,

//       model:
//         item.model ||
//         current.model,

//       supplier:
//         item.supplierId?.name ||
//         item.supplierId ||
//         current.supplier,

//       unitPrice:
//         Number(item.sellingPrice || 0),

//       catalogueId: item._id,
//     }));
//   };

//   // ------------------------------------------------------------
//   // UPDATE EYE
//   // ------------------------------------------------------------

//   const updateEye = (
//     eye,
//     field,
//     value,
//   ) => {
//     setForm((current) => ({
//       ...current,

//       [eye]: {
//         ...current[eye],
//         [field]: value,
//       },
//     }));
//   };

//   // ------------------------------------------------------------
//   // SAVE JOB
//   // ------------------------------------------------------------

//   const save = async (event) => {
//     event.preventDefault();

//     if (!form.patientId) {
//       setError("Please select a patient.");
//       return;
//     }

//     setSaving(true);
//     setError("");

//     try {
//       const response =
//         await createContactLens({
//           ...form,
//           orderType: "order_only",
//           total,
//         });

//       const created =
//         response?.data ||
//         response;

//       if (created?._id) {
//         navigate(
//           `/dispensing/contact-lenses/${created._id}`,
//         );
//         return;
//       }

//       navigate("/dispensing/contact-lenses");
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           "Unable to create contact lens job.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <DocumentShell
//       eyebrow="Dispensing"
//       title="New Contact Lens Job"
//       subtitle="Create a contact lens dispensing job for an existing patient."
//       code="CONTACT LENS JOB"
//       actions={
//         <>
          

//           <button
//             type="submit"
//             form="contact-lens-job-form"
//             disabled={saving}
//             className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
//           >
//             <Save size={14} />
//             {saving ? "Creating..." : "Create Job"}
//           </button>
//         </>
//       }
//     >
//       {error && (
//         <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       <form
//         id="contact-lens-job-form"
//         onSubmit={save}
//       >
//         {/* =====================================================
//             PATIENT
//         ===================================================== */}

//         <Section
//           number="01"
//           title="Patient"
//           description="Every dispensing job must belong to a patient."
//         >
//           {!selectedPatient ? (
//             <div className="relative">
//               <Field
//                 label="Search patient"
//                 value={patientSearch}
//                 onChange={setPatientSearch}
//                 placeholder="Name, phone or patient number..."
//               />

//               {loadingPatients && (
//                 <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-400">
//                   Searching patients...
//                 </div>
//               )}

//               {!loadingPatients &&
//                 patientSearch &&
//                 patients.length > 0 && (
//                   <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
//                     {patients.map((patient) => (
//                       <button
//                         key={patient._id}
//                         type="button"
//                         onClick={() =>
//                           selectPatient(patient)
//                         }
//                         className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
//                       >
//                         <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
//                           <UserRound size={15} />
//                         </div>

//                         <div>
//                           <div className="text-sm font-semibold text-slate-800">
//                             {patientName(patient)}
//                           </div>

//                           <div className="mt-0.5 text-[10px] text-slate-400">
//                             {patient.patientNumber ||
//                               "No patient number"}{" "}
//                             ·{" "}
//                             {patient.phone ||
//                               "No phone"}
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 )}

//               {!loadingPatients &&
//                 patientSearch &&
//                 patients.length === 0 && (
//                   <div className="mt-2 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
//                     No patients found.
//                   </div>
//                 )}
//             </div>
//           ) : (
//             <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
//               <div className="flex items-center justify-between gap-4">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
//                     <CheckCircle2 size={18} />
//                   </div>

//                   <div>
//                     <div className="text-sm font-bold text-slate-900">
//                       {patientName(selectedPatient)}
//                     </div>

//                     <div className="mt-1 text-[10px] text-slate-500">
//                       {selectedPatient.patientNumber ||
//                         "No patient number"}{" "}
//                       ·{" "}
//                       {selectedPatient.phone ||
//                         "No phone"}
//                     </div>
//                   </div>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setSelectedPatient(null)
//                   }
//                   className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600"
//                 >
//                   Change
//                 </button>
//               </div>
//             </div>
//           )}
//         </Section>

//         {/* =====================================================
//             ORDER
//         ===================================================== */}

//         <Section
//           number="02"
//           title="Lens order"
//           description="Select the dispensing lens and order parameters."
//         >
//           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

//             <Field
//               label="Catalogue lens"
//               value=""
//               onChange={selectCatalogueLens}
//               options={[
//                 {
//                   value: "",
//                   label: loadingCatalogue
//                     ? "Loading catalogue..."
//                     : "Select catalogue lens",
//                 },

//                 ...catalogue.map(
//                   (item) => ({
//                     value: item._id,
//                     label: `${item.code || "—"} · ${
//                       item.brand || ""
//                     } ${item.model || ""}`,
//                   }),
//                 ),
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
//         ===================================================== */}

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
//             ].map((field) => (
//               <Field
//                 key={field}
//                 label={field.toUpperCase()}
//                 value={form.right[field]}
//                 onChange={(value) =>
//                   updateEye(
//                     "right",
//                     field,
//                     value,
//                   )
//                 }
//               />
//             ))}
//           </div>
//         </Section>

//         {/* =====================================================
//             LEFT EYE
//         ===================================================== */}

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
//             ].map((field) => (
//               <Field
//                 key={field}
//                 label={field.toUpperCase()}
//                 value={form.left[field]}
//                 onChange={(value) =>
//                   updateEye(
//                     "left",
//                     field,
//                     value,
//                   )
//                 }
//               />
//             ))}
//           </div>
//         </Section>

//         {/* =====================================================
//             PRICING
//         ===================================================== */}

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
//                   unitPrice: Number(value || 0),
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
//                   discount: Number(value || 0),
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
//         ===================================================== */}

//         <Section
//           number="06"
//           title="Notes"
//         >
//           <Field
//             label="Job notes"
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
//     </DocumentShell>
//   );
// }

// import React, { useState, useMemo, useEffect } from "react";
// import {
//   Eye,
//   Filter,
//   Search,
//   Plus,
//   RefreshCw,
//   User,
//   Calculator,
//   FileText,
//   Check,
//   Trash2,
//   Calendar,
//   Layers,
//   ChevronRight,
//   ShieldAlert,
//   Printer,
//   X,
//   Sparkles,
//   Info,
//   DollarSign,
//   ClipboardList,
//   CheckCircle2,
//   Sliders,
//   Clock,
//   ArrowRight,
//   Droplet
// } from "lucide-react";

// // ==========================================
// // MOCK INITIAL DATA & CONSTANTS
// // ==========================================

// const INITIAL_PATIENTS = [
//   { id: "P-101", patientNumber: "PAT-2026-001", firstName: "Eleanor", lastName: "Vance", age: 34, gender: "Female", phone: "+1 (555) 234-5678", email: "eleanor.vance@example.com", occupation: "Graphic Designer", medHistory: "Mild dry eye syndrome, seasonal allergies" },
//   { id: "P-102", patientNumber: "PAT-2026-002", firstName: "Marcus", lastName: "Brody", age: 48, gender: "Male", phone: "+1 (555) 876-5432", email: "m.brody@example.com", occupation: "Architect", medHistory: "Keratoconus (OD Stage 2), Hypertensive" },
//   { id: "P-103", patientNumber: "PAT-2026-003", firstName: "Sophia", lastName: "Chen", age: 29, gender: "Female", phone: "+1 (555) 345-6789", email: "sophia.chen@example.com", occupation: "Software Engineer", medHistory: "High Myopia (-7.50DS)" },
//   { id: "P-104", patientNumber: "PAT-2026-004", firstName: "David", lastName: "Gandy", age: 52, gender: "Male", phone: "+1 (555) 901-2345", email: "gandy.d@example.com", occupation: "Pilot", medHistory: "Presbyopia, Mild blepharitis" }
// ];

// const INVENTORY_LENSES = [
//   { id: "L-01", code: "ACU-OAS-1D", brand: "Acuvue", model: "Oasys 1-Day Spherical", type: "soft", category: "Daily Disposable", BC: "8.5", Dia: "14.3", sellingPrice: 42.00, stock: 120 },
//   { id: "L-02", code: "BIO-TOR-M", brand: "Biofinity", model: "Toric Monthly", type: "soft", category: "Monthly", BC: "8.7", Dia: "14.5", sellingPrice: 65.00, stock: 45 },
//   { id: "L-03", code: "MEN-Z-RGP", brand: "Menicon", model: "Z-RGP Custom Corneal", type: "rgp", category: "Rigid Permeable", BC: "7.60", Dia: "9.6", sellingPrice: 180.00, stock: 12 },
//   { id: "L-04", code: "B&L-ZEN-SCL", brand: "Zenlens", model: "Scleral 16.0mm Diagnostic", type: "scleral", category: "Scleral Haptic", BC: "7.30 / Sag 4800", Dia: "16.0", sellingPrice: 450.00, stock: 8 },
//   { id: "L-05", code: "PRO-1D-MLT", brand: "Proclear", model: "1-Day Multifocal", type: "soft", category: "Daily Multifocal", BC: "8.7", Dia: "14.2", sellingPrice: 58.00, stock: 60 }
// ];

// const INITIAL_ORDERS = [
//   {
//     id: "CL-8091",
//     orderNumber: "CL-2026-8091",
//     patientId: "P-102",
//     patientName: "Marcus Brody",
//     patientNumber: "PAT-2026-002",
//     lensType: "scleral",
//     brand: "Zenlens Scleral 16.0mm",
//     orderType: "Scleral Custom Fit",
//     quantity: 2,
//     orderDate: "2026-10-18",
//     status: "ordered",
//     fitter: "Dr. Aris Thorne",
//     rx: {
//       od: { sph: "-4.50", cyl: "-2.25", axis: "095", va: "20/20-", add: "", flatK: "46.25", steepK: "49.50", kAxis: "095", hvid: "11.8", vault: "380" },
//       os: { sph: "-3.75", cyl: "-1.50", axis: "085", va: "20/25", add: "", flatK: "44.50", steepK: "46.75", kAxis: "085", hvid: "11.8", vault: "340" }
//     },
//     fitAssessment: {
//       scleralVaultOD: "380 μm",
//       scleralVaultOS: "340 μm",
//       landingZoneOD: "Toric 2 / Alignment 360",
//       landingZoneOS: "Spherical Alignment",
//       limbalClearance: "Adequate (~60μm)",
//       midDayFogging: "None reported"
//     },
//     price: 900.00,
//     discount: 50.00,
//     totalPrice: 850.00
//   },
//   {
//     id: "CL-8092",
//     orderNumber: "CL-2026-8092",
//     patientId: "P-101",
//     patientName: "Eleanor Vance",
//     patientNumber: "PAT-2026-001",
//     lensType: "soft",
//     brand: "Acuvue Oasys 1-Day",
//     orderType: "Soft Daily Disposable",
//     quantity: 4,
//     orderDate: "2026-10-19",
//     status: "ready",
//     fitter: "Dr. Sarah Jenkins",
//     rx: {
//       od: { sph: "-2.50", cyl: "DS", axis: "", va: "20/15", add: "", flatK: "43.00", steepK: "43.50", kAxis: "180", hvid: "11.6", vault: "" },
//       os: { sph: "-2.75", cyl: "DS", axis: "", va: "20/15", add: "", flatK: "43.25", steepK: "43.75", kAxis: "175", hvid: "11.6", vault: "" }
//     },
//     fitAssessment: {
//       centration: "Centered OD/OS",
//       movement: "0.4mm with blink",
//       pushUp: "50% Soft recovery",
//       lag: "Minimal"
//     },
//     price: 168.00,
//     discount: 0,
//     totalPrice: 168.00
//   },
//   {
//     id: "CL-8093",
//     orderNumber: "CL-2026-8093",
//     patientId: "P-104",
//     patientName: "David Gandy",
//     patientNumber: "PAT-2026-004",
//     lensType: "rgp",
//     brand: "Menicon Z-RGP Custom",
//     orderType: "Rigid Corneal",
//     quantity: 2,
//     orderDate: "2026-10-20",
//     status: "trial_fitted",
//     fitter: "Dr. Aris Thorne",
//     rx: {
//       od: { sph: "+1.75", cyl: "-1.25", axis: "010", va: "20/20", add: "+2.00", flatK: "42.50", steepK: "44.00", kAxis: "010", hvid: "11.5", vault: "" },
//       os: { sph: "+2.00", cyl: "-1.00", axis: "170", va: "20/20", add: "+2.00", flatK: "42.75", steepK: "43.75", kAxis: "170", hvid: "11.5", vault: "" }
//     },
//     fitAssessment: {
//       patternOD: "Parallel Light Touch",
//       patternOS: "Apical Alignment",
//       edgeLift: "0.4mm Uniform",
//       wettability: "Grade 1 (Excellent)"
//     },
//     price: 360.00,
//     discount: 20.00,
//     totalPrice: 340.00
//   }
// ];

// const emptyEyeRx = () => ({
//   sph: "", cyl: "", axis: "", va: "20/20", add: "",
//   flatK: "", steepK: "", kAxis: "", hvid: "11.5", pupil: "3.5",
//   tbut: "10", stain: "Grade 0"
// });

// const defaultFormData = () => ({
//   orderNumber: `CL-${Math.floor(1000 + Math.random() * 9000)}`,
//   jobDate: new Date().toISOString().slice(0, 10),
//   dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
//   status: "draft",
//   fitterName: "Dr. Aris Thorne",
//   patientId: "",
//   patientName: "",
//   patientNumber: "",
//   lensCategory: "soft", // soft, rgp, scleral
  
//   // Clinical Refraction & Topography
//   rxOD: emptyEyeRx(),
//   rxOS: emptyEyeRx(),

//   // Anterior Segment & Fit Details
//   anteriorSegment: {
//     lidsOD: "Normal / Clear MGD",
//     lidsOS: "Normal / Clear MGD",
//     conjunctivaOD: "Quiet",
//     conjunctivaOS: "Quiet",
//     corneaOD: "Clear",
//     corneaOS: "Clear",
//     ectasiaProfile: "None / Normal Contour"
//   },

//   // Fit Assessment dynamic parameters
//   softFit: {
//     centrationOD: "Centered", centrationOS: "Centered",
//     movementOD: "0.3mm", movementOS: "0.3mm",
//     pushUpOD: "50%", pushUpOS: "50%",
//     lagOD: "Normal", lagOS: "Normal"
//   },
//   rgpFit: {
//     apicalOD: "Parallel / Alignment", apicalOS: "Parallel / Alignment",
//     midPeripheralOD: "Adequate", midPeripheralOS: "Adequate",
//     edgeLiftOD: "0.4mm", edgeLiftOS: "0.4mm",
//     dynamicOD: "Centered High-Riding", dynamicOS: "Centered High-Riding",
//     wettability: "Good"
//   },
//   scleralFit: {
//     initialVaultOD: "350", initialVaultOS: "350",
//     settledVaultOD: "250", settledVaultOS: "250",
//     settlementTimeHrs: "2",
//     limbalClearanceOD: "Adequate (~60μm)", limbalClearanceOS: "Adequate (~60μm)",
//     landingZoneOD: "360 Alignment", landingZoneOS: "360 Alignment",
//     hapticToricity: "Spherical",
//     fillingSolution: "Preservative-Free 0.9% Saline",
//     debrisFogging: "None"
//   },

//   // Over Refraction & Lens Spec
//   overRefractionOD: { sph: "0.00", cyl: "DS", axis: "", va: "20/20" },
//   overRefractionOS: { sph: "0.00", cyl: "DS", axis: "", va: "20/20" },
  
//   lensSpecOD: { brand: "Acuvue Oasys", BC: "8.5", Dia: "14.3", power: "-2.50", notes: "" },
//   lensSpecOS: { brand: "Acuvue Oasys", BC: "8.5", Dia: "14.3", power: "-2.75", notes: "" },

//   // Solutions & Compliance
//   careSolution: "Multi-Purpose Hydrogen Peroxide",
//   complianceVerified: {
//     insertionRemoval: true,
//     hygieneProtocol: true,
//     noTapWaterWarning: true,
//     scleralPlungerTech: false
//   },

//   // Financials & Line items
//   extras: [],
//   basePrice: 150.00,
//   discount: 0.00,
//   notes: ""
// });

// export default function App() {
//   const [activeTab, setActiveTab] = useState("register"); // 'register', 'form', 'calculator'
//   const [orders, setOrders] = useState(INITIAL_ORDERS);
//   const [patients] = useState(INITIAL_PATIENTS);
//   const [inventory] = useState(INVENTORY_LENSES);

//   // Filters & Pagination for Register
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [lensTypeFilter, setLensTypeFilter] = useState("");
//   const [page, setPage] = useState(1);
//   const PAGE_SIZE = 6;

//   // Form State
//   const [formData, setFormData] = useState(defaultFormData());
//   const [editingOrderId, setEditingOrderId] = useState(null);
//   const [patientSearch, setPatientSearch] = useState("");
//   const [showPatientDropdown, setShowPatientDropdown] = useState(false);
//   const [inventorySearch, setInventorySearch] = useState("");
//   const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);

//   // Print Modal
//   const [printModalOrder, setPrintModalOrder] = useState(null);

//   // Status Classes helper
//   const statusClass = (status) => {
//     switch (status) {
//       case "draft": return "bg-slate-100 text-slate-700 border-slate-200";
//       case "assessment": return "bg-amber-50 text-amber-700 border-amber-200";
//       case "trial_fitted": return "bg-purple-50 text-purple-700 border-purple-200";
//       case "ordered": return "bg-blue-50 text-blue-700 border-blue-200";
//       case "ready": return "bg-emerald-50 text-emerald-700 border-emerald-200";
//       case "dispensed": return "bg-indigo-50 text-indigo-700 border-indigo-200";
//       default: return "bg-slate-100 text-slate-600 border-slate-200";
//     }
//   };

//   const formatStatus = (s) => (s ? s.replace("_", " ").toUpperCase() : "UNKNOWN");

//   // Summary Metrics
//   const summary = useMemo(() => {
//     return {
//       total: orders.length,
//       draft: orders.filter((x) => x.status === "draft").length,
//       trialFitted: orders.filter((x) => x.status === "trial_fitted").length,
//       ordered: orders.filter((x) => x.status === "ordered").length,
//       ready: orders.filter((x) => x.status === "ready").length,
//       dispensed: orders.filter((x) => x.status === "dispensed").length,
//     };
//   }, [orders]);

//   // Filtered Orders
//   const filteredOrders = useMemo(() => {
//     const q = search.toLowerCase().trim();
//     return orders.filter((order) => {
//       const matchQuery =
//         !q ||
//         [order.orderNumber, order.patientName, order.patientNumber, order.brand, order.fitter]
//           .join(" ")
//           .toLowerCase()
//           .includes(q);
//       const matchStatus = !statusFilter || order.status === statusFilter;
//       const matchLensType = !lensTypeFilter || order.lensType === lensTypeFilter;
//       return matchQuery && matchStatus && matchLensType;
//     });
//   }, [orders, search, statusFilter, lensTypeFilter]);

//   const paginatedOrders = useMemo(() => {
//     const start = (page - 1) * PAGE_SIZE;
//     return filteredOrders.slice(start, start + PAGE_SIZE);
//   }, [filteredOrders, page]);

//   // Handlers
//   const handleCreateNew = () => {
//     setFormData(defaultFormData());
//     setEditingOrderId(null);
//     setActiveTab("form");
//   };

//   const handleEditOrder = (order) => {
//     setEditingOrderId(order.id);
//     // Populate form data based on existing order or defaults
//     setFormData({
//       ...defaultFormData(),
//       ...order,
//       rxOD: order.rx?.od ? { ...emptyEyeRx(), ...order.rx.od } : emptyEyeRx(),
//       rxOS: order.rx?.os ? { ...emptyEyeRx(), ...order.rx.os } : emptyEyeRx(),
//       lensCategory: order.lensType || "soft",
//       basePrice: order.price || 150,
//       discount: order.discount || 0
//     });
//     setActiveTab("form");
//   };

//   const handleSelectPatient = (patient) => {
//     setFormData((prev) => ({
//       ...prev,
//       patientId: patient.id,
//       patientName: `${patient.firstName} ${patient.lastName}`,
//       patientNumber: patient.patientNumber
//     }));
//     setPatientSearch("");
//     setShowPatientDropdown(false);
//   };

//   const handleSelectInventoryLens = (item) => {
//     setFormData((prev) => ({
//       ...prev,
//       lensCategory: item.type,
//       lensSpecOD: { ...prev.lensSpecOD, brand: `${item.brand} ${item.model}`, BC: item.BC, Dia: item.Dia },
//       lensSpecOS: { ...prev.lensSpecOS, brand: `${item.brand} ${item.model}`, BC: item.BC, Dia: item.Dia },
//       basePrice: item.sellingPrice * 2
//     }));
//     setInventorySearch("");
//     setShowInventoryDropdown(false);
//   };

//   const handleSaveForm = (e) => {
//     e.preventDefault();
//     if (!formData.patientName) {
//       alert("Please select or assign a patient to this clinical record.");
//       return;
//     }

//     const calculatedTotal = Math.max(0, Number(formData.basePrice) - Number(formData.discount));

//     const newRecord = {
//       id: editingOrderId || `CL-${Math.floor(1000 + Math.random() * 9000)}`,
//       orderNumber: formData.orderNumber,
//       patientId: formData.patientId || "P-TEMP",
//       patientName: formData.patientName,
//       patientNumber: formData.patientNumber || "PAT-NEW",
//       lensType: formData.lensCategory,
//       brand: formData.lensSpecOD.brand || "Custom Prescription",
//       orderType: `${formData.lensCategory.toUpperCase()} Clinical Fitting`,
//       quantity: 2,
//       orderDate: formData.jobDate,
//       status: formData.status,
//       fitter: formData.fitterName,
//       rx: {
//         od: formData.rxOD,
//         os: formData.rxOS
//       },
//       fitAssessment: {
//         vaultOD: formData.scleralFit.initialVaultOD,
//         vaultOS: formData.scleralFit.initialVaultOS,
//         notes: formData.notes
//       },
//       price: Number(formData.basePrice),
//       discount: Number(formData.discount),
//       totalPrice: calculatedTotal
//     };

//     if (editingOrderId) {
//       setOrders((prev) => prev.map((o) => (o.id === editingOrderId ? newRecord : o)));
//     } else {
//       setOrders((prev) => [newRecord, ...prev]);
//     }

//     setActiveTab("register");
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-violet-100 selection:text-violet-900 pb-12">
//       {/* =====================================================
//           APP HEADER & WORKSPACE BANNER
//       ===================================================== */}
//       <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
//         <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
//           <div className="flex h-16 items-center justify-between gap-4">
//             {/* Logo / Title */}
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-200">
//                 <Eye className="h-5 w-5" />
//               </div>
//               <div>
//                 <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
//                   OptiFit<span className="text-violet-600">.CL</span>
//                 </h1>
//                 <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
//                   Contact Lens Clinical Documentation & Dispensing Suite
//                 </p>
//               </div>
//             </div>

//             {/* Navigation Tabs */}
//             <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
//               <button
//                 onClick={() => setActiveTab("register")}
//                 className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
//                   activeTab === "register"
//                     ? "bg-white text-violet-700 shadow-xs"
//                     : "text-slate-600 hover:text-slate-900"
//                 }`}
//               >
//                 <ClipboardList className="h-3.5 w-3.5" />
//                 <span>Orders Register</span>
//               </button>

//               <button
//                 onClick={handleCreateNew}
//                 className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
//                   activeTab === "form"
//                     ? "bg-white text-violet-700 shadow-xs"
//                     : "text-slate-600 hover:text-slate-900"
//                 }`}
//               >
//                 <Plus className="h-3.5 w-3.5" />
//                 <span>New Fitting Sheet</span>
//               </button>

//               <button
//                 onClick={() => setActiveTab("calculator")}
//                 className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
//                   activeTab === "calculator"
//                     ? "bg-white text-violet-700 shadow-xs"
//                     : "text-slate-600 hover:text-slate-900"
//                 }`}
//               >
//                 <Calculator className="h-3.5 w-3.5" />
//                 <span className="hidden md:inline">Vault Calculator</span>
//               </button>
//             </nav>
//           </div>
//         </div>
//       </header>

//       {/* Main Container */}
//       <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 pt-6">
//         {/* =====================================================
//             TAB 1: ORDERS REGISTER
//         ===================================================== */}
//         {activeTab === "register" && (
//           <div className="space-y-6">
//             {/* Top Banner & Quick Metrics */}
//             <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
//               <div className="bg-gradient-to-r from-violet-50 via-white to-blue-50 p-6">
//                 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                   <div>
//                     <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/80 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
//                       <Sparkles className="h-3 w-3" />
//                       Optometry Clinical Portal
//                     </div>
//                     <h2 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
//                       Contact Lens Workspace
//                     </h2>
//                     <p className="mt-1 text-xs text-slate-600 max-w-xl">
//                       Manage soft, gas permeable (RGP), and scleral lens trials, clinical fitting records, over-refractions, and dispensing status.
//                     </p>
//                   </div>

//                   <div className="flex flex-wrap gap-2">
//                     <button
//                       onClick={() => setOrders([...orders])}
//                       className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
//                     >
//                       <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
//                       Refresh Data
//                     </button>
//                     <button
//                       onClick={handleCreateNew}
//                       className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
//                     >
//                       <Plus className="h-4 w-4" />
//                       New Clinical Exam
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Summary Metrics Bar */}
//               <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
//                 <div className="p-4 text-center sm:text-left">
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Exams</span>
//                   <div className="mt-1 text-xl font-black text-slate-900">{summary.total}</div>
//                 </div>
//                 <div className="p-4 text-center sm:text-left">
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Draft / Pending</span>
//                   <div className="mt-1 text-xl font-black text-slate-700">{summary.draft}</div>
//                 </div>
//                 <div className="p-4 text-center sm:text-left">
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Trial Fitted</span>
//                   <div className="mt-1 text-xl font-black text-purple-700">{summary.trialFitted}</div>
//                 </div>
//                 <div className="p-4 text-center sm:text-left">
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Ordered</span>
//                   <div className="mt-1 text-xl font-black text-blue-700">{summary.ordered}</div>
//                 </div>
//                 <div className="p-4 text-center sm:text-left">
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Ready in Lab</span>
//                   <div className="mt-1 text-xl font-black text-emerald-700">{summary.ready}</div>
//                 </div>
//                 <div className="p-4 text-center sm:text-left">
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Dispensed</span>
//                   <div className="mt-1 text-xl font-black text-indigo-700">{summary.dispensed}</div>
//                 </div>
//               </div>
//             </section>

//             {/* Controls / Filter Section */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//                 <input
//                   type="text"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search by patient name, record #, brand, or clinician..."
//                   className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
//                 />
//               </div>

//               <div className="flex items-center gap-2">
//                 {/* Status Filter */}
//                 <div className="relative">
//                   <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
//                   <select
//                     value={statusFilter}
//                     onChange={(e) => setStatusFilter(e.target.value)}
//                     className="rounded-lg border border-slate-200 bg-white pl-8 pr-7 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 cursor-pointer"
//                   >
//                     <option value="">All Statuses</option>
//                     <option value="draft">Draft</option>
//                     <option value="trial_fitted">Trial Fitted</option>
//                     <option value="ordered">Ordered</option>
//                     <option value="ready">Ready</option>
//                     <option value="dispensed">Dispensed</option>
//                   </select>
//                 </div>

//                 {/* Lens Type Filter */}
//                 <select
//                   value={lensTypeFilter}
//                   onChange={(e) => setLensTypeFilter(e.target.value)}
//                   className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 cursor-pointer"
//                 >
//                   <option value="">All Modalities</option>
//                   <option value="soft">Soft Lens</option>
//                   <option value="rgp">RGP Corneal</option>
//                   <option value="scleral">Scleral Haptic</option>
//                 </select>
//               </div>
//             </div>

//             {/* Table Register */}
//             <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[950px] text-left text-xs">
//                   <thead>
//                     <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                       <th className="px-5 py-3.5">Job / Order</th>
//                       <th className="px-5 py-3.5">Patient Details</th>
//                       <th className="px-5 py-3.5">Lens Modality</th>
//                       <th className="px-5 py-3.5">Prescribed Lens</th>
//                       <th className="px-5 py-3.5">Fitting Clinician</th>
//                       <th className="px-5 py-3.5">Date</th>
//                       <th className="px-5 py-3.5">Status</th>
//                       <th className="px-5 py-3.5 text-right">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {paginatedOrders.length === 0 ? (
//                       <tr>
//                         <td colSpan={8} className="py-12 text-center text-slate-400">
//                           <Eye className="mx-auto h-8 w-8 text-slate-300" />
//                           <p className="mt-2 text-xs font-medium text-slate-500">No contact lens records found matching your query.</p>
//                         </td>
//                       </tr>
//                     ) : (
//                       paginatedOrders.map((order) => (
//                         <tr key={order.id} className="hover:bg-slate-50/80 transition">
//                           <td className="px-5 py-3.5 font-bold text-slate-900">
//                             {order.orderNumber}
//                             <div className="text-[10px] font-normal text-slate-400">{order.id}</div>
//                           </td>
//                           <td className="px-5 py-3.5">
//                             <div className="font-semibold text-slate-800">{order.patientName}</div>
//                             <div className="text-[10px] text-slate-400">{order.patientNumber}</div>
//                           </td>
//                           <td className="px-5 py-3.5">
//                             <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
//                               order.lensType === "scleral" ? "bg-amber-100 text-amber-800" :
//                               order.lensType === "rgp" ? "bg-purple-100 text-purple-800" :
//                               "bg-blue-100 text-blue-800"
//                             }`}>
//                               {order.lensType}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3.5 font-medium text-slate-700">
//                             {order.brand}
//                           </td>
//                           <td className="px-5 py-3.5 text-slate-600">
//                             {order.fitter}
//                           </td>
//                           <td className="px-5 py-3.5 text-slate-500">
//                             {order.orderDate}
//                           </td>
//                           <td className="px-5 py-3.5">
//                             <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusClass(order.status)}`}>
//                               {formatStatus(order.status)}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3.5 text-right space-x-1">
//                             <button
//                               onClick={() => setPrintModalOrder(order)}
//                               title="Print Sheet"
//                               className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition inline-flex"
//                             >
//                               <Printer className="h-3.5 w-3.5" />
//                             </button>
//                             <button
//                               onClick={() => handleEditOrder(order)}
//                               className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100 transition inline-flex items-center gap-1"
//                             >
//                               Edit Exam
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Pagination Footer */}
//               <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
//                 <span className="text-xs text-slate-500">
//                   Showing {paginatedOrders.length} of {filteredOrders.length} entries
//                 </span>
//                 <div className="flex items-center gap-1">
//                   <button
//                     disabled={page === 1}
//                     onClick={() => setPage((p) => Math.max(1, p - 1))}
//                     className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 disabled:opacity-40"
//                   >
//                     Prev
//                   </button>
//                   <span className="px-2 text-xs font-bold text-slate-700">{page}</span>
//                   <button
//                     disabled={page * PAGE_SIZE >= filteredOrders.length}
//                     onClick={() => setPage((p) => p + 1)}
//                     className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 disabled:opacity-40"
//                   >
//                     Next
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* =====================================================
//             TAB 2: CLINICAL DOCUMENTATION & FITTING FORM
//         ===================================================== */}
//         {activeTab === "form" && (
//           <form onSubmit={handleSaveForm} className="space-y-6 pb-12">
//             {/* Header Action Bar */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
//               <div className="flex items-center gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setActiveTab("register")}
//                   className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
//                 >
//                   <X className="h-4 w-4" />
//                 </button>
//                 <div>
//                   <h2 className="text-lg font-bold text-slate-900">
//                     {editingOrderId ? `Edit Record #${formData.orderNumber}` : "New Contact Lens Clinical Assessment"}
//                   </h2>
//                   <p className="text-xs text-slate-500">Document preliminary corneal metrics, fitting behavior, and final prescription parameters.</p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 <select
//                   value={formData.status}
//                   onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//                   className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-500"
//                 >
//                   <option value="draft">Status: Draft</option>
//                   <option value="trial_fitted">Status: Trial Fitted</option>
//                   <option value="ordered">Status: Ordered</option>
//                   <option value="ready">Status: Ready in Lab</option>
//                   <option value="dispensed">Status: Dispensed</option>
//                 </select>

//                 <button
//                   type="submit"
//                   className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition"
//                 >
//                   <Check className="h-4 w-4" />
//                   Save Examination
//                 </button>
//               </div>
//             </div>

//             {/* Section 1: Patient & Clinical History */}
//             <FormPanel number="1" title="Patient Selection & Clinical History">
//               <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
//                 {/* Patient Search Picker */}
//                 <div className="relative">
//                   <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                     Patient Search *
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       placeholder="Type patient name or ID..."
//                       value={formData.patientName || patientSearch}
//                       onChange={(e) => {
//                         setPatientSearch(e.target.value);
//                         setFormData((prev) => ({ ...prev, patientName: e.target.value }));
//                         setShowPatientDropdown(true);
//                       }}
//                       onFocus={() => setShowPatientDropdown(true)}
//                       className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-violet-500"
//                     />
//                     <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
//                   </div>

//                   {showPatientDropdown && (
//                     <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
//                       {patients.map((p) => (
//                         <button
//                           key={p.id}
//                           type="button"
//                           onClick={() => handleSelectPatient(p)}
//                           className="flex w-full flex-col px-3 py-2 text-left hover:bg-violet-50 transition border-b border-slate-100 last:border-0"
//                         >
//                           <span className="text-xs font-bold text-slate-800">{p.firstName} {p.lastName}</span>
//                           <span className="text-[10px] text-slate-400">{p.patientNumber} • {p.phone}</span>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                     Fitting Optometrist
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.fitterName}
//                     onChange={(e) => setFormData({ ...formData, fitterName: e.target.value })}
//                     className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                     Exam Date
//                   </label>
//                   <input
//                     type="date"
//                     value={formData.jobDate}
//                     onChange={(e) => setFormData({ ...formData, jobDate: e.target.value })}
//                     className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
//                   />
//                 </div>
//               </div>
//             </FormPanel>

//             {/* Section 2: Baseline Refraction & Corneal Parameters */}
//             <FormPanel number="2" title="Baseline Ocular Refraction & Topography">
//               <div className="space-y-4">
//                 {/* Table for OD & OS Refraction */}
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-left text-xs">
//                     <thead>
//                       <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
//                         <th className="py-2 px-2">Eye</th>
//                         <th className="py-2 px-2">SPH</th>
//                         <th className="py-2 px-2">CYL</th>
//                         <th className="py-2 px-2">AXIS</th>
//                         <th className="py-2 px-2">VA</th>
//                         <th className="py-2 px-2">ADD</th>
//                         <th className="py-2 px-2">Flat K (D)</th>
//                         <th className="py-2 px-2">Steep K (D)</th>
//                         <th className="py-2 px-2">K-Axis</th>
//                         <th className="py-2 px-2">HVID (mm)</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {/* OD Row */}
//                       <tr>
//                         <td className="py-2 px-2 font-black text-violet-700">OD (Right)</td>
//                         {["sph", "cyl", "axis", "va", "add", "flatK", "steepK", "kAxis", "hvid"].map((f) => (
//                           <td key={f} className="py-2 px-1">
//                             <input
//                               type="text"
//                               value={formData.rxOD[f] || ""}
//                               onChange={(e) =>
//                                 setFormData({
//                                   ...formData,
//                                   rxOD: { ...formData.rxOD, [f]: e.target.value }
//                                 })
//                               }
//                               className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-center font-medium outline-none focus:border-violet-500"
//                             />
//                           </td>
//                         ))}
//                       </tr>
//                       {/* OS Row */}
//                       <tr>
//                         <td className="py-2 px-2 font-black text-indigo-700">OS (Left)</td>
//                         {["sph", "cyl", "axis", "va", "add", "flatK", "steepK", "kAxis", "hvid"].map((f) => (
//                           <td key={f} className="py-2 px-1">
//                             <input
//                               type="text"
//                               value={formData.rxOS[f] || ""}
//                               onChange={(e) =>
//                                 setFormData({
//                                   ...formData,
//                                   rxOS: { ...formData.rxOS, [f]: e.target.value }
//                                 })
//                               }
//                               className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-center font-medium outline-none focus:border-violet-500"
//                             />
//                           </td>
//                         ))}
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </FormPanel>

//             {/* Section 3: Modality & Fit Evaluation */}
//             <FormPanel number="3" title="Lens Fitting Category & Slit Lamp Assessment">
//               {/* Category Selector Tabs */}
//               <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit">
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, lensCategory: "soft" })}
//                   className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
//                     formData.lensCategory === "soft" ? "bg-white text-violet-700 shadow-xs" : "text-slate-600"
//                   }`}
//                 >
//                   Soft Contact Lens
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, lensCategory: "rgp" })}
//                   className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
//                     formData.lensCategory === "rgp" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600"
//                   }`}
//                 >
//                   RGP Corneal
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, lensCategory: "scleral" })}
//                   className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
//                     formData.lensCategory === "scleral" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600"
//                   }`}
//                 >
//                   Scleral Lens
//                 </button>
//               </div>

//               {/* Inventory Fast Selection */}
//               <div className="relative mb-4">
//                 <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                   Quick Select Trial Lens from Inventory
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Search brand, model, base curve..."
//                   value={inventorySearch}
//                   onChange={(e) => {
//                     setInventorySearch(e.target.value);
//                     setShowInventoryDropdown(true);
//                   }}
//                   className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
//                 />
//                 {showInventoryDropdown && (
//                   <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
//                     {inventory.map((item) => (
//                       <button
//                         key={item.id}
//                         type="button"
//                         onClick={() => handleSelectInventoryLens(item)}
//                         className="flex w-full justify-between px-3 py-2 text-left hover:bg-slate-50 text-xs border-b border-slate-100"
//                       >
//                         <span className="font-bold">{item.brand} {item.model}</span>
//                         <span className="text-slate-400">BC: {item.BC} | Dia: {item.Dia} | ${item.sellingPrice}</span>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* DYNAMIC FIT PARAMETERS BASED ON LENS CATEGORY */}
//               {formData.lensCategory === "soft" && (
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-violet-50/50 p-4 rounded-xl border border-violet-100">
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Centration (OD/OS)</label>
//                     <input
//                       type="text"
//                       value={formData.softFit.centrationOD}
//                       onChange={(e) => setFormData({ ...formData, softFit: { ...formData.softFit, centrationOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Movement w/ Blink (mm)</label>
//                     <input
//                       type="text"
//                       value={formData.softFit.movementOD}
//                       onChange={(e) => setFormData({ ...formData, softFit: { ...formData.softFit, movementOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Push-Up Test Tightness %</label>
//                     <input
//                       type="text"
//                       value={formData.softFit.pushUpOD}
//                       onChange={(e) => setFormData({ ...formData, softFit: { ...formData.softFit, pushUpOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Ocular Lag</label>
//                     <input
//                       type="text"
//                       value={formData.softFit.lagOD}
//                       onChange={(e) => setFormData({ ...formData, softFit: { ...formData.softFit, lagOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                 </div>
//               )}

//               {formData.lensCategory === "rgp" && (
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Apical Fluorescein Pattern</label>
//                     <select
//                       value={formData.rgpFit.apicalOD}
//                       onChange={(e) => setFormData({ ...formData, rgpFit: { ...formData.rgpFit, apicalOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     >
//                       <option value="Parallel / Alignment">Parallel / Alignment</option>
//                       <option value="Apical Clearance (Steep)">Apical Clearance (Steep)</option>
//                       <option value="Apical Touch (Flat)">Apical Touch (Flat)</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Edge Lift / Clearance</label>
//                     <input
//                       type="text"
//                       value={formData.rgpFit.edgeLiftOD}
//                       onChange={(e) => setFormData({ ...formData, rgpFit: { ...formData.rgpFit, edgeLiftOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Dynamic Position & Riding</label>
//                     <input
//                       type="text"
//                       value={formData.rgpFit.dynamicOD}
//                       onChange={(e) => setFormData({ ...formData, rgpFit: { ...formData.rgpFit, dynamicOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                 </div>
//               )}

//               {formData.lensCategory === "scleral" && (
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Initial Central Vault OD/OS (μm)</label>
//                     <input
//                       type="text"
//                       value={formData.scleralFit.initialVaultOD}
//                       onChange={(e) => setFormData({ ...formData, scleralFit: { ...formData.scleralFit, initialVaultOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Settled Vault after 2-4 hrs (μm)</label>
//                     <input
//                       type="text"
//                       value={formData.scleralFit.settledVaultOD}
//                       onChange={(e) => setFormData({ ...formData, scleralFit: { ...formData.scleralFit, settledVaultOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[10px] font-bold text-slate-500">Landing Zone / Haptics</label>
//                     <input
//                       type="text"
//                       value={formData.scleralFit.landingZoneOD}
//                       onChange={(e) => setFormData({ ...formData, scleralFit: { ...formData.scleralFit, landingZoneOD: e.target.value } })}
//                       className="w-full mt-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
//                     />
//                   </div>
//                 </div>
//               )}
//             </FormPanel>

//             {/* Section 4: Final Prescribed Specifications & Financials */}
//             <FormPanel number="4" title="Final Prescribed Specifications & Billing">
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 {/* Specifications */}
//                 <div className="space-y-3">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lens Specification Parameters</h4>
//                   <div className="grid grid-cols-3 gap-2">
//                     <div>
//                       <label className="block text-[10px] font-bold text-slate-400">OD Power</label>
//                       <input
//                         type="text"
//                         value={formData.lensSpecOD.power}
//                         onChange={(e) => setFormData({ ...formData, lensSpecOD: { ...formData.lensSpecOD, power: e.target.value } })}
//                         className="w-full rounded border border-slate-200 p-1 text-xs"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-[10px] font-bold text-slate-400">OD Base Curve</label>
//                       <input
//                         type="text"
//                         value={formData.lensSpecOD.BC}
//                         onChange={(e) => setFormData({ ...formData, lensSpecOD: { ...formData.lensSpecOD, BC: e.target.value } })}
//                         className="w-full rounded border border-slate-200 p-1 text-xs"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-[10px] font-bold text-slate-400">OD Diameter</label>
//                       <input
//                         type="text"
//                         value={formData.lensSpecOD.Dia}
//                         onChange={(e) => setFormData({ ...formData, lensSpecOD: { ...formData.lensSpecOD, Dia: e.target.value } })}
//                         className="w-full rounded border border-slate-200 p-1 text-xs"
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-3 gap-2">
//                     <div>
//                       <label className="block text-[10px] font-bold text-slate-400">OS Power</label>
//                       <input
//                         type="text"
//                         value={formData.lensSpecOS.power}
//                         onChange={(e) => setFormData({ ...formData, lensSpecOS: { ...formData.lensSpecOS, power: e.target.value } })}
//                         className="w-full rounded border border-slate-200 p-1 text-xs"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-[10px] font-bold text-slate-400">OS Base Curve</label>
//                       <input
//                         type="text"
//                         value={formData.lensSpecOS.BC}
//                         onChange={(e) => setFormData({ ...formData, lensSpecOS: { ...formData.lensSpecOS, BC: e.target.value } })}
//                         className="w-full rounded border border-slate-200 p-1 text-xs"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-[10px] font-bold text-slate-400">OS Diameter</label>
//                       <input
//                         type="text"
//                         value={formData.lensSpecOS.Dia}
//                         onChange={(e) => setFormData({ ...formData, lensSpecOS: { ...formData.lensSpecOS, Dia: e.target.value } })}
//                         className="w-full rounded border border-slate-200 p-1 text-xs"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Billing Ledger */}
//                 <div className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Dispensing Financial Ledger</h4>
//                   <div className="flex justify-between items-center text-xs">
//                     <span className="text-slate-600">Base Fitting & Lens Price:</span>
//                     <input
//                       type="number"
//                       value={formData.basePrice}
//                       onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
//                       className="w-24 text-right rounded border border-slate-200 px-2 py-0.5"
//                     />
//                   </div>
//                   <div className="flex justify-between items-center text-xs">
//                     <span className="text-slate-600">Discount ($):</span>
//                     <input
//                       type="number"
//                       value={formData.discount}
//                       onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
//                       className="w-24 text-right rounded border border-slate-200 px-2 py-0.5"
//                     />
//                   </div>
//                   <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold text-sm text-slate-900">
//                     <span>Total Net Amount:</span>
//                     <span className="text-violet-700">${Math.max(0, Number(formData.basePrice) - Number(formData.discount)).toFixed(2)}</span>
//                   </div>
//                 </div>
//               </div>
//             </FormPanel>
//           </form>
//         )}

//         {/* =====================================================
//             TAB 3: INTERACTIVE VAULT & OVER-REFRACTION CALCULATOR
//         ===================================================== */}
//         {activeTab === "calculator" && <InteractiveVaultCalculator />}
//       </main>

//       {/* =====================================================
//           PRINTABLE DOCUMENT MODAL
//       ===================================================== */}
//       {printModalOrder && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
//           <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl space-y-6">
//             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
//               <div>
//                 <h3 className="text-xl font-bold text-slate-900">Contact Lens Clinical Sheet</h3>
//                 <p className="text-xs text-slate-500">Record ID: {printModalOrder.orderNumber}</p>
//               </div>
//               <button
//                 onClick={() => setPrintModalOrder(null)}
//                 className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             <div className="space-y-4 text-xs">
//               <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
//                 <div><strong>Patient:</strong> {printModalOrder.patientName}</div>
//                 <div><strong>Date:</strong> {printModalOrder.orderDate}</div>
//                 <div><strong>Lens Category:</strong> {printModalOrder.lensType?.toUpperCase()}</div>
//                 <div><strong>Fitter:</strong> {printModalOrder.fitter}</div>
//               </div>

//               <div>
//                 <h4 className="font-bold text-slate-800 mb-2">Corneal & Refractive Data</h4>
//                 <table className="w-full border border-slate-200 text-center">
//                   <thead className="bg-slate-100">
//                     <tr>
//                       <th className="p-1.5 border">Eye</th>
//                       <th className="p-1.5 border">SPH</th>
//                       <th className="p-1.5 border">CYL</th>
//                       <th className="p-1.5 border">AXIS</th>
//                       <th className="p-1.5 border">Flat K</th>
//                       <th className="p-1.5 border">Steep K</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       <td className="p-1.5 border font-bold">OD</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.od?.sph || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.od?.cyl || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.od?.axis || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.od?.flatK || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.od?.steepK || "—"}</td>
//                     </tr>
//                     <tr>
//                       <td className="p-1.5 border font-bold">OS</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.os?.sph || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.os?.cyl || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.os?.axis || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.os?.flatK || "—"}</td>
//                       <td className="p-1.5 border">{printModalOrder.rx?.os?.steepK || "—"}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>

//               <div className="border-t border-slate-200 pt-4 flex justify-between">
//                 <div>
//                   <p className="font-bold">Total Amount Paid / Due: ${printModalOrder.totalPrice?.toFixed(2)}</p>
//                 </div>
//                 <button
//                   onClick={() => window.print()}
//                   className="rounded-lg bg-violet-600 px-4 py-2 text-white font-bold inline-flex items-center gap-2"
//                 >
//                   <Printer className="h-4 w-4" /> Print Document
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ============================================================
// // HELPER COMPONENTS
// // ============================================================

// function FormPanel({ number, title, children }) {
//   return (
//     <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
//       <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
//         <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">
//           {number}
//         </span>
//         <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">{title}</h3>
//       </div>
//       <div className="p-5">{children}</div>
//     </section>
//   );
// }

// function InteractiveVaultCalculator() {
//   const [initialVault, setInitialVault] = useState(350);
//   const [settlementRate, setSettlementRate] = useState(120); // typical μm decay
//   const [vertexDistance, setVertexDistance] = useState(12);
//   const [spectacleSph, setSpectacleSph] = useState("-6.50");

//   const settledVault = Math.max(0, initialVault - settlementRate);

//   // Simple Vertex Power Adjustment: F_contact = F_spec / (1 - d * F_spec)
//   const adjustedContactPower = useMemo(() => {
//     const F = parseFloat(spectacleSph);
//     if (isNaN(F) || F === 0) return "0.00";
//     const d = vertexDistance / 1000;
//     const Fc = F / (1 - d * F);
//     return Fc.toFixed(2);
//   }, [spectacleSph, vertexDistance]);

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto">
//       <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
//         <div>
//           <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
//             <Calculator className="h-5 w-5 text-violet-600" />
//             Scleral Lens Vault Settlement & Vertex Calculator
//           </h2>
//           <p className="text-xs text-slate-500 mt-1">
//             Simulate 2-4 hour tear reservoir settling and effective power vertex adjustments for high refractive errors.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Vault Decay Card */}
//           <div className="rounded-xl bg-amber-50/60 p-4 border border-amber-200 space-y-4">
//             <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">Scleral Fluid Vault Settlement</h3>
//             <div>
//               <label className="text-[11px] font-bold text-slate-600">Initial Insertion Clearance (μm)</label>
//               <input
//                 type="number"
//                 value={initialVault}
//                 onChange={(e) => setInitialVault(Number(e.target.value))}
//                 className="w-full mt-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
//               />
//             </div>
//             <div>
//               <label className="text-[11px] font-bold text-slate-600">Expected Haptic Settlement (μm)</label>
//               <input
//                 type="number"
//                 value={settlementRate}
//                 onChange={(e) => setSettlementRate(Number(e.target.value))}
//                 className="w-full mt-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
//               />
//             </div>
//             <div className="border-t border-amber-200 pt-3">
//               <span className="text-xs text-slate-600">Estimated Settled Clearance:</span>
//               <div className="text-2xl font-black text-amber-900">{settledVault} μm</div>
//               <span className="text-[10px] text-amber-700 font-medium">Ideal target range: 100 - 150 μm over apex</span>
//             </div>
//           </div>

//           {/* Vertex Distance Adjustment Card */}
//           <div className="rounded-xl bg-violet-50/60 p-4 border border-violet-200 space-y-4">
//             <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800">Vertex Distance Power Compensation</h3>
//             <div>
//               <label className="text-[11px] font-bold text-slate-600">Spectacle Sphere Power (D)</label>
//               <input
//                 type="text"
//                 value={spectacleSph}
//                 onChange={(e) => setSpectacleSph(e.target.value)}
//                 className="w-full mt-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
//               />
//             </div>
//             <div>
//               <label className="text-[11px] font-bold text-slate-600">Vertex Distance (mm)</label>
//               <input
//                 type="number"
//                 value={vertexDistance}
//                 onChange={(e) => setVertexDistance(Number(e.target.value))}
//                 className="w-full mt-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
//               />
//             </div>
//             <div className="border-t border-violet-200 pt-3">
//               <span className="text-xs text-slate-600">Effective Contact Lens Power:</span>
//               <div className="text-2xl font-black text-violet-900">{adjustedContactPower} D</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Search,
  User,
  Eye,
  FileText,
  Calculator,
  Droplet,
  Check,
  Loader2,
} from "lucide-react";

import {
  createContactLens,
  getLatestContactLensConsultation,
} from "../contactLens.api";

import { getInventory } from "../../inventory/inventory.api";
import { getPatients } from "../../patients/patient.api";

// Helper for initial empty eye parameters
const emptyEyeRx = () => ({
  sph: "",
  cyl: "",
  axis: "",
  va: "20/20",
  add: "",
  flatK: "",
  steepK: "",
  bc: "",
  dia: "",
  sagittalDepth: "",
  vaultInitial: "",
  vaultSettled: "",
  limbalClearance: "Adequate (~60μm)",
  landingZone: "Alignment 360",
});

const defaultFormData = () => ({
  orderNumber: `CL-${Math.floor(1000 + Math.random() * 9000)}`,
  jobDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  status: "draft",
  fitterName: "",
  patientId: "",
  selectedPatient: null,
  patientName: "",
  patientNumber: "",
  lensCategory: "soft", // 'soft' | 'rgp' | 'scleral'
  brand: "",
  model: "",
  replacement: "Monthly",

  // Clinical Eyes Data
  rxOD: emptyEyeRx(),
  rxOS: emptyEyeRx(),

  // Dynamic Fit Matrix
  softFit: {
    centrationOD: "Centered",
    centrationOS: "Centered",
    movementOD: "0.3mm",
    movementOS: "0.3mm",
    pushUpOD: "50%",
    pushUpOS: "50%",
    lagOD: "Normal",
    lagOS: "Normal",
  },
  rgpFit: {
    apicalOD: "Parallel / Alignment",
    apicalOS: "Parallel / Alignment",
    midPeripheralOD: "Adequate",
    midPeripheralOS: "Adequate",
    edgeLiftOD: "0.4mm",
    edgeLiftOS: "0.4mm",
    dynamicOD: "Centered",
    dynamicOS: "Centered",
    wettability: "Good",
  },
  scleralFit: {
    initialVaultOD: "350",
    initialVaultOS: "350",
    settledVaultOD: "250",
    settledVaultOS: "250",
    settlementTimeHrs: "2",
    limbalClearanceOD: "Adequate (~60μm)",
    limbalClearanceOS: "Adequate (~60μm)",
    landingZoneOD: "360 Alignment",
    landingZoneOS: "360 Alignment",
    fillingSolution: "Preservative-Free 0.9% Saline",
    debrisFogging: "None",
  },

  // Over Refraction
  overRefractionOD: { sph: "0.00", cyl: "DS", axis: "", va: "20/20" },
  overRefractionOS: { sph: "0.00", cyl: "DS", axis: "", va: "20/20" },

  // Care Solutions
  careSolution: "Multi-Purpose Disinfection Solution",

  // Pricing
  basePrice: 150.0,
  discount: 0.0,
  quantity: 2,
  extras: [],
  notes: "",
});

export default function NewContactLensJobPage({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState(defaultFormData());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Patient live search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Inventory live search
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryResults, setInventoryResults] = useState([]);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);

  // Search Patients API
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getPatients({ page: 1, limit: 10, search: patientSearch });
        const list = res?.data?.patients || res?.patients || res?.data || [];
        setPatientResults(Array.isArray(list) ? list : []);
      } catch (e) {
        setPatientResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Search Inventory API
  useEffect(() => {
    if (!inventorySearch.trim()) {
      setInventoryResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getInventory({ page: 1, limit: 10, search: inventorySearch });
        const list = res?.data?.items || res?.items || res?.data || [];
        setInventoryResults(Array.isArray(list) ? list : []);
      } catch (e) {
        setInventoryResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inventorySearch]);

  // Handle Patient Select & Auto-fill Consultation
  const handleSelectPatient = async (patient) => {
    const pId = patient._id || patient.id;
    const fullName = [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(" ");

    setFormData((prev) => ({
      ...prev,
      patientId: pId,
      selectedPatient: patient,
      patientName: fullName || "Unnamed patient",
      patientNumber: patient.patientNumber || patient.registrationNumber || "",
    }));
    setPatientSearch(fullName);
    setShowPatientDropdown(false);

    try {
      const consult = await getLatestContactLensConsultation(pId);
      if (consult?.data?.refraction) {
        const ref = consult.data.refraction;
        setFormData((prev) => ({
          ...prev,
          rxOD: { ...prev.rxOD, ...ref.right },
          rxOS: { ...prev.rxOS, ...ref.left },
        }));
      }
    } catch (e) {
      // Consultation auto-fill optional
    }
  };

  // Handle Inventory Item Select
  const handleSelectInventoryLens = (item) => {
    setFormData((prev) => ({
      ...prev,
      lensCategory: item.type || prev.lensCategory,
      brand: item.brand || "",
      model: item.model || item.description || "",
      rxOD: { ...prev.rxOD, bc: item.BC || item.bc || "", dia: item.Dia || item.dia || "" },
      rxOS: { ...prev.rxOS, bc: item.BC || item.bc || "", dia: item.Dia || item.dia || "" },
      basePrice: item.sellingPrice ? item.sellingPrice * 2 : prev.basePrice,
    }));
    setInventorySearch("");
    setShowInventoryDropdown(false);
  };

  // Add Custom Extra Line Item
  const handleAddExtra = () => {
    setFormData((prev) => ({
      ...prev,
      extras: [...prev.extras, { description: "", price: 0 }],
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      setError("Please search and select a patient to associate with this order.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        orderNumber: formData.orderNumber,
        patientId: formData.patientId,
        orderType: `${formData.lensCategory}_fitting`,
        lensCategory: formData.lensCategory,
        brand: formData.brand,
        model: formData.model,
        status: formData.status,
        right: formData.rxOD,
        left: formData.rxOS,
        unitPrice: Number(formData.basePrice),
        discount: Number(formData.discount),
        quantity: Number(formData.quantity || 2),
        total: Math.max(0, Number(formData.basePrice) - Number(formData.discount)),
        notes: formData.notes,
        softFit: formData.softFit,
        rgpFit: formData.rgpFit,
        scleralFit: formData.scleralFit,
        extras: formData.extras,
      };

      await createContactLens(payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save contact lens order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[1400px] space-y-6 py-5">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              New Contact Lens Fitting Sheet
            </h2>
            <p className="text-xs text-slate-500">
              Record preliminary examination, corneal parameters, and trial fitting specs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-500"
          >
            <option value="draft">Status: Draft</option>
            <option value="trial_fitted">Status: Trial Fitted</option>
            <option value="ordered">Status: Ordered</option>
          </select>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Order Job"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="p-1 hover:bg-red-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* LENS MODALITY SELECTOR */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: "soft", label: "Soft Contact Lens", desc: "Daily / Monthly / Toric Hydrogel" },
          { id: "rgp", label: "Rigid Gas Permeable (RGP)", desc: "Corneal RGP / Ortho-K" },
          { id: "scleral", label: "Scleral & Mini-Scleral", desc: "Ectasia / Vault / Landing Zones" },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setFormData({ ...formData, lensCategory: m.id })}
            className={`flex flex-col text-left p-3 rounded-xl transition ${
              formData.lensCategory === m.id
                ? "bg-violet-50 border-2 border-violet-600 text-violet-950"
                : "border border-transparent hover:bg-slate-50 text-slate-600"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
            <span className="mt-1 text-[10px] text-slate-400">{m.desc}</span>
          </button>
        ))}
      </div>

      {/* PATIENT & LENS SPECIFICATION */}
      <div className="grid gap-6 md:grid-cols-3">
        <Panel number="1" title="Patient & Stock Lens Lookup">
          <div className="space-y-3">
            {/* Patient Search */}
            <div className="relative">
              <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">
                Patient Search
              </span>
              <input
                type="text"
                placeholder="Type patient name or mobile..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-400"
              />
              {showPatientDropdown && patientResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                  {patientResults.map((p) => (
                    <button
                      key={p._id || p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="font-semibold text-slate-800">
                        {[p.firstName, p.lastName].filter(Boolean).join(" ")}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.patientNumber || p.phone}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Lens Search */}
            <div className="relative">
              <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">
                Select from Trial / Stock Inventory
              </span>
              <input
                type="text"
                placeholder="Type brand, model or code..."
                value={inventorySearch}
                onChange={(e) => {
                  setInventorySearch(e.target.value);
                  setShowInventoryDropdown(true);
                }}
                onFocus={() => setShowInventoryDropdown(true)}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-400"
              />
              {showInventoryDropdown && inventoryResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                  {inventoryResults.map((inv) => (
                    <button
                      key={inv._id || inv.id}
                      type="button"
                      onClick={() => handleSelectInventoryLens(inv)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="font-semibold text-slate-800">
                        {inv.brand} - {inv.model || inv.description}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        BC: {inv.BC || "—"} | DIA: {inv.Dia || "—"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CompactField
                label="Brand"
                value={formData.brand}
                onChange={(v) => setFormData({ ...formData, brand: v })}
              />
              <CompactField
                label="Model / Material"
                value={formData.model}
                onChange={(v) => setFormData({ ...formData, model: v })}
              />
            </div>
          </div>
        </Panel>

        {/* KERATOMETRY & REFRACTION */}
        <Panel number="2" title="Keratometry & Spectacle Refraction" className="md:col-span-2">
          <div className="space-y-3">
            <PrescriptionRow
              eyeName="right"
              values={formData.rxOD}
              onChange={(side, f, val) =>
                setFormData((p) => ({
                  ...p,
                  rxOD: { ...p.rxOD, [f]: val },
                }))
              }
            />
            <PrescriptionRow
              eyeName="left"
              values={formData.rxOS}
              onChange={(side, f, val) =>
                setFormData((p) => ({
                  ...p,
                  rxOS: { ...p.rxOS, [f]: val },
                }))
              }
            />
          </div>
        </Panel>
      </div>

      {/* MODALITY CLINICAL EVALUATION MATRIX */}
      <Panel number="3" title={`${formData.lensCategory.toUpperCase()} Clinical Assessment Parameters`}>
        {formData.lensCategory === "soft" && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 border-r border-slate-100 pr-4">
              <h4 className="font-bold text-slate-700">Right Eye (OD Soft)</h4>
              <div className="grid grid-cols-2 gap-2">
                <CompactField
                  label="Base Curve (BC)"
                  value={formData.rxOD.bc}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOD: { ...p.rxOD, bc: v } }))}
                  placeholder="8.6"
                />
                <CompactField
                  label="Diameter (DIA)"
                  value={formData.rxOD.dia}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOD: { ...p.rxOD, dia: v } }))}
                  placeholder="14.2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700">Left Eye (OS Soft)</h4>
              <div className="grid grid-cols-2 gap-2">
                <CompactField
                  label="Base Curve (BC)"
                  value={formData.rxOS.bc}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOS: { ...p.rxOS, bc: v } }))}
                  placeholder="8.6"
                />
                <CompactField
                  label="Diameter (DIA)"
                  value={formData.rxOS.dia}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOS: { ...p.rxOS, dia: v } }))}
                  placeholder="14.2"
                />
              </div>
            </div>
          </div>
        )}

        {formData.lensCategory === "rgp" && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 border-r border-slate-100 pr-4">
              <h4 className="font-bold text-slate-700">Right Eye (OD RGP Corneal)</h4>
              <div className="grid grid-cols-2 gap-2">
                <CompactField
                  label="Flat K"
                  value={formData.rxOD.flatK}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOD: { ...p.rxOD, flatK: v } }))}
                  placeholder="D / mm"
                />
                <CompactField
                  label="Steep K"
                  value={formData.rxOD.steepK}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOD: { ...p.rxOD, steepK: v } }))}
                  placeholder="D / mm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700">Left Eye (OS RGP Corneal)</h4>
              <div className="grid grid-cols-2 gap-2">
                <CompactField
                  label="Flat K"
                  value={formData.rxOS.flatK}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOS: { ...p.rxOS, flatK: v } }))}
                  placeholder="D / mm"
                />
                <CompactField
                  label="Steep K"
                  value={formData.rxOS.steepK}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOS: { ...p.rxOS, steepK: v } }))}
                  placeholder="D / mm"
                />
              </div>
            </div>
          </div>
        )}

        {formData.lensCategory === "scleral" && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 border-r border-slate-100 pr-4">
              <h4 className="font-bold text-slate-700">Right Eye Scleral Profile</h4>
              <div className="grid grid-cols-2 gap-2">
                <CompactField
                  label="Sagittal Depth (SAG)"
                  value={formData.rxOD.sagittalDepth}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOD: { ...p.rxOD, sagittalDepth: v } }))}
                  placeholder="μm"
                />
                <CompactField
                  label="Initial Vault"
                  value={formData.scleralFit.initialVaultOD}
                  onChange={(v) => setFormData((p) => ({ ...p, scleralFit: { ...p.scleralFit, initialVaultOD: v } }))}
                  placeholder="μm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700">Left Eye Scleral Profile</h4>
              <div className="grid grid-cols-2 gap-2">
                <CompactField
                  label="Sagittal Depth (SAG)"
                  value={formData.rxOS.sagittalDepth}
                  onChange={(v) => setFormData((p) => ({ ...p, rxOS: { ...p.rxOS, sagittalDepth: v } }))}
                  placeholder="μm"
                />
                <CompactField
                  label="Initial Vault"
                  value={formData.scleralFit.initialVaultOS}
                  onChange={(v) => setFormData((p) => ({ ...p, scleralFit: { ...p.scleralFit, initialVaultOS: v } }))}
                  placeholder="μm"
                />
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* PRICING & CLINICAL NOTES */}
      <Panel number="4" title="Billing Ledger & Clinical Notes">
        <div className="grid grid-cols-3 gap-3">
          <CompactField
            label="Base Price (₹)"
            type="number"
            value={formData.basePrice}
            onChange={(v) => setFormData({ ...formData, basePrice: v })}
          />
          <CompactField
            label="Discount (₹)"
            type="number"
            value={formData.discount}
            onChange={(v) => setFormData({ ...formData, discount: v })}
          />
          <div className="block">
            <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">Total Charged</span>
            <div className="h-8 flex items-center px-2.5 rounded-md bg-slate-100 font-bold text-xs text-slate-800">
              ₹{Math.max(0, Number(formData.basePrice) - Number(formData.discount)).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">Special Instructions / Follow-up Notes</span>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Record insertion/removal training notes, preservative-free solution directions, or follow-up schedule..."
            className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-slate-400"
          />
        </div>
      </Panel>
    </form>
  );
}

/* HELPER COMPONENTS */
function CompactField({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold uppercase text-slate-400">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function Panel({ number, title, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex min-h-10 items-center gap-2 border-b border-slate-100 px-3 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[8px] font-bold text-slate-500">
          {number}
        </span>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
          {title}
        </h2>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function PrescriptionRow({ eyeName, values, onChange }) {
  const fields = [
    ["sph", "SPH"],
    ["cyl", "CYL"],
    ["axis", "AXIS"],
    ["va", "VA"],
    ["add", "ADD"],
  ];

  return (
    <div className="grid grid-cols-[45px_repeat(5,minmax(50px,1fr))] gap-1.5">
      <div className="flex items-center">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold ${
            eyeName === "right" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {eyeName === "right" ? "OD" : "OS"}
        </span>
      </div>
      {fields.map(([key, label]) => (
        <input
          key={key}
          value={values?.[key] || ""}
          onChange={(e) => onChange(eyeName, key, e.target.value)}
          placeholder={label}
          className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-center text-[9px] font-medium text-slate-700 outline-none focus:border-slate-400"
        />
      ))}
    </div>
  );
}