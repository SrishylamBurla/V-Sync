// import { useEffect, useMemo, useState } from "react";
// import {
//   Activity,
//   CalendarDays,
//   Check,
//   CheckCircle2,
//   ClipboardList,
//   Clock3,
//   Eye,
//   FileText,
//   Glasses,
//   Hash,
//   Loader2,
//   Pencil,
//   Save,
//   Stethoscope,
//   UserRound,
//   X,
// } from "lucide-react";
// import { useNavigate, useParams } from "react-router-dom";

// import {
//   getConsultation,
//   updateConsultation,
// } from "../consultation.api";

// const getPatientName = (patient) => {
//   if (!patient) return "Unknown Patient";

//   return [
//     patient.firstName,
//     patient.middleName,
//     patient.lastName,
//   ]
//     .filter(Boolean)
//     .join(" ")
//     .trim() || "Unknown Patient";
// };

// const formatDate = (value) => {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const formatDateTime = (value) => {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }

//   return date.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const isEmptyValue = (value) => {
//   if (value === null || value === undefined) return true;
//   if (typeof value === "string") return value.trim() === "";

//   if (Array.isArray(value)) {
//     return value.length === 0 || value.every(isEmptyValue);
//   }

//   if (typeof value === "object") {
//     const values = Object.values(value);
//     return values.length === 0 || values.every(isEmptyValue);
//   }

//   return false;
// };

// const FIELD_LABELS = {
//   right: "Right Eye",
//   left: "Left Eye",
//   od: "OD",
//   os: "OS",
//   ou: "OU",
//   va: "VA",
//   nearVa: "Near VA",
//   pd: "PD",
//   cdRatio: "C/D Ratio",
//   npc: "NPC",
//   npa: "NPA",
//   aa: "AA",
//   nra: "NRA",
//   pra: "PRA",
//   mem: "MEM",
//   oct: "OCT",
//   lids: "Lids",
//   conjunctiva: "Conjunctiva",
//   cornea: "Cornea",
//   anteriorChamber: "Anterior Chamber",
//   iris: "Iris",
//   lens: "Lens",
//   disc: "Optic Disc",
//   macula: "Macula",
//   vessels: "Vessels",
//   retina: "Retina",
//   other: "Other Findings",
//   stereopsisNear: "Near Stereopsis",
//   wfdtDistance: "Worth Four Dot — Distance",
//   wfdtIntermediate: "Worth Four Dot — Intermediate",
//   wfdtNear: "Worth Four Dot — Near",
//   cissScore: "CISS Score",
//   coverDistance: "Cover Test — Distance",
//   coverNear: "Cover Test — Near",
//   nfvDistanceBlur: "NFV Distance — Blur",
//   nfvDistanceBreak: "NFV Distance — Break",
//   nfvDistanceRecovery: "NFV Distance — Recovery",
//   pfvDistanceBlur: "PFV Distance — Blur",
//   pfvDistanceBreak: "PFV Distance — Break",
//   pfvDistanceRecovery: "PFV Distance — Recovery",
// };

// const humanizeKey = (key) => {
//   if (FIELD_LABELS[key]) return FIELD_LABELS[key];

//   return String(key)
//     .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
//     .replace(/[_-]+/g, " ")
//     .replace(/^./, (character) => character.toUpperCase())
//     .trim();
// };

// const parseStructuredString = (value) => {
//   if (typeof value !== "string") return value;

//   const trimmed = value.trim();
//   if (!trimmed) return value;

//   // Parse JSON stored as a string, while leaving ordinary clinical notes untouched.
//   if (
//     (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
//     (trimmed.startsWith("[") && trimmed.endsWith("]"))
//   ) {
//     try {
//       return JSON.parse(trimmed);
//     } catch {
//       // Continue to legacy text parsing below.
//     }
//   }

//   // Parse text that wraps JSON objects in eye labels, e.g.
//   // "Right: {...} • Left: {...}".
//   const eyePattern =
//     /(?:^|\s*[•|]\s*)(Right|Left|OD|OS)\s*:\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/gi;
//   const eyeEntries = [];
//   let match;

//   while ((match = eyePattern.exec(trimmed)) !== null) {
//     try {
//       const key = match[1].toLowerCase();
//       eyeEntries.push([
//         key === "right" || key === "od" ? "right" : "left",
//         JSON.parse(match[2]),
//       ]);
//     } catch {
//       // If one segment is malformed, preserve the original string.
//       return value;
//     }
//   }

//   if (eyeEntries.length > 0) {
//     return Object.fromEntries(eyeEntries);
//   }

//   return value;
// };

// const formatValue = (value) => {
//   const normalized = parseStructuredString(value);

//   if (isEmptyValue(normalized)) return "—";
//   if (typeof normalized === "boolean") return normalized ? "Yes" : "No";
//   if (typeof normalized === "object") return "—";
//   return String(normalized);
// };

// const statusLabel = (status) => {
//   const normalized = String(status || "completed")
//     .trim()
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (character) => character.toUpperCase());

//   return normalized || "Completed";
// };

// const typeLabel = (type) => {
//   switch (type) {
//     case "comprehensive":
//       return "Comprehensive";
//     case "short_consult":
//       return "Short Consultation";
//     case "binocular_vision":
//       return "Binocular Vision";
//     case "low_vision":
//       return "Low Vision";
//     case "contact_lenses":
//       return "Contact Lens";
//     default:
//       return type || "Consultation";
//   }
// };

// const sectionIdFromTitle = (title) =>
//   `consultation-${String(title || "")
//     .toLowerCase()
//     .replace(/&/g, "and")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-|-$/g, "")}`;

// function SummaryItem({
//   icon: Icon,
//   label,
//   value,
// }) {
//   return (
//     <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
//       <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
//         <Icon size={13} />
//       </div>
//       <div className="min-w-0">
//         <div className="text-[8px] font-bold uppercase tracking-[0.11em] text-slate-400">
//           {label}
//         </div>
//         <div className="mt-1 truncate text-[10px] font-bold text-slate-700" title={String(value ?? "")}>
//           {value || "—"}
//         </div>
//       </div>
//     </div>
//   );
// }

// function Section({
//   title,
//   icon: Icon,
//   children,
// }) {
//   return (
//     <section
//       id={sectionIdFromTitle(title)}
//       className="min-w-0 scroll-mt-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.035)]"
//     >
//       <div className="flex min-h-12 items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5 sm:px-4">
//         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-[0_1px_1px_rgba(15,23,42,0.03)]">
//           <Icon size={15} />
//         </div>

//         <div className="min-w-0 flex-1">
//           <h2 className="text-[12px] font-bold tracking-tight text-slate-800">
//             {title}
//           </h2>
//         </div>
//         <span className="hidden text-[8px] font-bold uppercase tracking-[0.14em] text-slate-300 sm:inline">
//           Clinical record
//         </span>
//       </div>

//       <div className="min-w-0 p-3.5 sm:p-4">
//         {children}
//       </div>
//     </section>
//   );
// }

// function ValueDisplay({
//   value,
//   depth = 0,
// }) {
//   value = parseStructuredString(value);

//   if (isEmptyValue(value)) {
//     return (
//       <span className="text-sm text-slate-300">
//         —
//       </span>
//     );
//   }

//   if (typeof value === "boolean") {
//     return (
//       <span className="text-sm font-medium text-slate-700">
//         {value ? "Yes" : "No"}
//       </span>
//     );
//   }

//   if (typeof value !== "object") {
//     return (
//       <span className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
//         {String(value)}
//       </span>
//     );
//   }

//   if (depth > 5) {
//     return (
//       <span className="whitespace-pre-wrap break-words text-sm text-slate-600">
//         Details recorded
//       </span>
//     );
//   }

//   if (Array.isArray(value)) {
//     const items = value.filter((item) => !isEmptyValue(item));

//     if (!items.length) {
//       return <span className="text-sm text-slate-300">—</span>;
//     }

//     const containsObjects = items.some(
//       (item) => typeof item === "object" && item !== null,
//     );

//     if (!containsObjects) {
//       return (
//         <div className="flex flex-wrap gap-1.5">
//           {items.map((item, index) => (
//             <span
//               key={`${String(item)}-${index}`}
//               className="inline-flex max-w-full items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
//             >
//               <span className="break-words">{String(item)}</span>
//             </span>
//           ))}
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-2">
//         {items.map((item, index) => {
//           if (item === null || typeof item !== "object") {
//             return (
//               <div
//                 key={`item-${index}`}
//                 className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
//               >
//                 <ValueDisplay value={item} depth={depth + 1} />
//               </div>
//             );
//           }

//           const titleKey = ["name", "title", "test", "testName"].find(
//             (key) =>
//               typeof item[key] === "string" &&
//               item[key].trim(),
//           );
//           const title = titleKey ? item[titleKey] : `Record ${index + 1}`;
//           const details = Object.fromEntries(
//             Object.entries(item).filter(
//               ([key, entryValue]) =>
//                 key !== titleKey && !isEmptyValue(entryValue),
//             ),
//           );

//           return (
//             <div
//               key={`${title}-${index}`}
//               className="rounded-lg border border-slate-200 bg-white p-3"
//             >
//               <div className="mb-2 text-xs font-semibold text-slate-800">
//                 {title}
//               </div>
//               {Object.keys(details).length > 0 ? (
//                 <ValueDisplay value={details} depth={depth + 1} />
//               ) : (
//                 <span className="text-xs text-slate-400">
//                   No result recorded
//                 </span>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     );
//   }

//   const entries = Object.entries(value).filter(
//     ([, entryValue]) => !isEmptyValue(entryValue),
//   );

//   if (!entries.length) {
//     return <span className="text-sm text-slate-300">—</span>;
//   }

//   const eyeKeys = new Set(["right", "left", "od", "os"]);
//   const isEyeGrouped = entries.some(([key]) =>
//     eyeKeys.has(String(key).toLowerCase()),
//   );

//   if (isEyeGrouped) {
//     return (
//       <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//         {entries.map(([key, entryValue]) => (
//           <div
//             key={key}
//             className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
//           >
//             <div className="mb-2 flex items-center gap-2">
//               <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
//               <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
//                 {humanizeKey(key)}
//               </h4>
//             </div>
//             <ValueDisplay value={entryValue} depth={depth + 1} />
//           </div>
//         ))}
//       </div>
//     );
//   }

//   return (
//     <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
//       {entries.map(([key, entryValue]) => {
//         const nested =
//           typeof entryValue === "object" &&
//           entryValue !== null;

//         return (
//           <div
//             key={key}
//             className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 ${
//               nested ? "sm:col-span-2" : ""
//             }`}
//           >
//             <dt className="mb-1 text-[9px] font-bold uppercase tracking-[0.09em] text-slate-400">
//               {humanizeKey(key)}
//             </dt>
//             <dd className="min-w-0">
//               <ValueDisplay
//                 value={entryValue}
//                 depth={depth + 1}
//               />
//             </dd>
//           </div>
//         );
//       })}
//     </dl>
//   );
// }

// function Field({
//   label,
//   value,
// }) {
//   return (
//     <div className="min-w-0">
//       <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
//         {label}
//       </div>

//       <div className="min-w-0">
//         <ValueDisplay value={value} />
//       </div>
//     </div>
//   );
// }

// function PrescriptionTable({
//   title,
//   prescription,
// }) {
//   if (!prescription) return null;

//   return (
//     <div className="overflow-hidden rounded-xl border border-slate-200">
//       <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
//         <h3 className="text-sm font-semibold text-slate-800">
//           {title}
//         </h3>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm">
//           <thead>
//             <tr className="border-b border-slate-200 bg-white text-left text-xs text-slate-400">
//               <th className="px-4 py-3">Eye</th>
//               <th className="px-4 py-3">Sphere</th>
//               <th className="px-4 py-3">Cylinder</th>
//               <th className="px-4 py-3">Axis</th>
//               <th className="px-4 py-3">VA</th>
//               <th className="px-4 py-3">Near VA</th>
//               <th className="px-4 py-3">Add</th>
//               <th className="px-4 py-3">Prism</th>
//               <th className="px-4 py-3">Base</th>
//             </tr>
//           </thead>

//           <tbody>
//             {["right", "left"].map((eye) => {
//               const row = prescription?.[eye] || {};

//               return (
//                 <tr
//                   key={eye}
//                   className="border-b border-slate-100 last:border-0"
//                 >
//                   <td className="px-4 py-3 font-semibold text-slate-700">
//                     {eye === "right" ? "OD" : "OS"}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.sphere)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.cylinder)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.axis)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.va)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.nearVa)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.add)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.prism)}
//                   </td>

//                   <td className="px-4 py-3">
//                     {formatValue(row.base)}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// const EDITABLE_GROUPS = [
//   {
//     title: "Consultation Information",
//     icon: ClipboardList,
//     fields: [
//       ["consultationType", "Consultation Type"],
//       ["consultationDate", "Consultation Date"],
//       ["reasonForVisit", "Reason for Visit"],
//       ["symptoms", "Symptoms"],
//       ["medicalHistory", "Medical History"],
//       ["ocularHistory", "Ocular History"],
//       ["familyHistory", "Family History"],
//       ["medication", "Medication"],
//       ["allergy", "Allergies"],
//       ["pupils", "Pupillary Findings"],
//     ],
//   },
//   {
//     title: "Visual Acuity & Prescription",
//     icon: Glasses,
//     fields: [
//       ["visualAcuity", "Visual Acuity"],
//       ["previousRx", "Previous Prescription"],
//       ["objectiveRx", "Objective Prescription"],
//       ["subjectiveRx", "Subjective Prescription"],
//       ["finalRx", "Final Prescription"],
//       ["givenRx", "Given Prescription"],
//       ["pd", "Pupillary Distance (PD)"],
//       ["refractionNotes", "Refraction Notes"],
//     ],
//   },
//   {
//     title: "Clinical Management & Tests",
//     icon: Stethoscope,
//     fields: [
//       ["slitLamp", "Slit Lamp"],
//       ["fundus", "Fundus"],
//       ["ophthalmoscopy", "Ophthalmoscopy"],
//       ["biomicroscopy", "Biomicroscopy"],
//       ["visualField", "Visual Field"],
//       ["colourVision", "Colour Vision"],
//       ["otherTests", "Other Tests"],
//     ],
//   },
//   {
//     title: "Specialist Assessments",
//     icon: Eye,
//     fields: [
//       ["binocularVision", "Binocular Vision"],
//       ["lowVision", "Low Vision"],
//       ["contactLens", "Contact Lens"],
//       ["contactLenses", "Contact Lenses (Legacy)"],
//       ["dispensing", "Dispensing Details"],
//     ],
//   },
//   {
//     title: "Diagnosis & Treatment",
//     icon: ClipboardList,
//     fields: [
//       ["diagnosis", "Diagnosis"],
//       ["advice", "Advice / Management Plan"],
//       ["therapeutics", "Therapeutics"],
//     ],
//   },
//   {
//     title: "Clinical Notes & Recall",
//     icon: FileText,
//     fields: [
//       ["clinicalNotes", "Clinical Notes"],
//       ["patientInstructions", "Patient Instructions"],
//       ["internalNotes", "Internal Notes"],
//       ["notes", "Additional Notes"],
//       ["recall", "Recall Details"],
//       ["recallDue", "Recall Due Date"],
//       ["recallLetter", "Recall Letter"],
//     ],
//   },
// ];

// const EDITABLE_FIELDS = EDITABLE_GROUPS.flatMap((group) =>
//   group.fields.map(([key]) => key),
// );

// const cloneValue = (value) => {
//   if (value === undefined) return undefined;

//   try {
//     return JSON.parse(JSON.stringify(value));
//   } catch {
//     return value;
//   }
// };

// const normalizeStructuredForEdit = (value) => {
//   const parsed = parseStructuredString(value);

//   if (parsed !== value) {
//     return normalizeStructuredForEdit(parsed);
//   }

//   if (Array.isArray(value)) {
//     return value.map(normalizeStructuredForEdit);
//   }

//   if (value && typeof value === "object") {
//     return Object.fromEntries(
//       Object.entries(value).map(([key, child]) => [
//         key,
//         normalizeStructuredForEdit(child),
//       ]),
//     );
//   }

//   return value;
// };

// const dateInputValue = (value) => {
//   if (!value) return "";
//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return /^\d{4}-\d{2}-\d{2}$/.test(String(value))
//       ? String(value)
//       : "";
//   }

//   const local = new Date(
//     date.getTime() - date.getTimezoneOffset() * 60000,
//   );

//   return local.toISOString().slice(0, 10);
// };

// const emptyPrescriptionEye = () => ({
//   sphere: "",
//   cylinder: "",
//   axis: "",
//   va: "",
//   nearVa: "",
//   add: "",
//   inter: "",
//   prism: "",
//   base: "",
// });

// const STRUCTURED_EDIT_FIELDS = new Set([
//   "visualAcuity",
//   "previousRx",
//   "objectiveRx",
//   "subjectiveRx",
//   "finalRx",
//   "givenRx",
//   "pd",
//   "slitLamp",
//   "fundus",
//   "otherTests",
//   "diagnosis",
//   "advice",
//   "binocularVision",
//   "lowVision",
//   "contactLens",
//   "contactLenses",
//   "dispensing",
//   "therapeutics",
//   "recall",
// ]);

// const createEditableRecord = (record) => {
//   const editable = {};

//   EDITABLE_FIELDS.forEach((key) => {
//     if (record[key] !== undefined) {
//       const cloned = cloneValue(record[key]);
//       editable[key] = STRUCTURED_EDIT_FIELDS.has(key)
//         ? normalizeStructuredForEdit(cloned)
//         : cloned;
//     }
//   });

//   editable.consultationType =
//     editable.consultationType || "comprehensive";
//   editable.consultationDate =
//     dateInputValue(editable.consultationDate);

//   // Ensure the prescription tables can be edited even when a record
//   // has no prescription saved yet.
//   ["previousRx", "objectiveRx", "subjectiveRx", "finalRx", "givenRx"].forEach(
//     (key) => {
//       const current = editable[key] && typeof editable[key] === "object"
//         ? editable[key]
//         : {};

//       editable[key] = {
//         ...current,
//         right: {
//           ...emptyPrescriptionEye(),
//           ...(current.right && typeof current.right === "object"
//             ? current.right
//             : {}),
//         },
//         left: {
//           ...emptyPrescriptionEye(),
//           ...(current.left && typeof current.left === "object"
//             ? current.left
//             : {}),
//         },
//         note: current.note ?? "",
//       };
//     },
//   );

//   ["otherTests", "diagnosis", "therapeutics"].forEach((key) => {
//     if (!Array.isArray(editable[key])) {
//       editable[key] = [];
//     }
//   });

//   if (!editable.recall || typeof editable.recall !== "object") {
//     editable.recall = {};
//   }

//   editable.recall = {
//     ...editable.recall,
//     due: dateInputValue(
//       editable.recall.due ||
//       editable.recall.date ||
//       editable.recallDue,
//     ),
//     message:
//       editable.recall.message ??
//       editable.recallLetter ??
//       "",
//     type: editable.recall.type ?? "",
//     sendReminder: Boolean(editable.recall.sendReminder),
//   };

//   editable.recallDue = dateInputValue(
//     editable.recallDue || editable.recall.due,
//   );
//   editable.recallLetter =
//     editable.recallLetter ?? editable.recall.message ?? "";

//   return editable;
// };

// const blankLike = (value) => {
//   if (Array.isArray(value)) return [];
//   if (typeof value === "boolean") return false;
//   if (typeof value === "number") return "";
//   if (value && typeof value === "object") {
//     return Object.fromEntries(
//       Object.entries(value).map(([key, child]) => [key, blankLike(child)]),
//     );
//   }
//   return "";
// };

// const createArrayItem = (rootKey, template) => {
//   if (template !== undefined && template !== null) {
//     return blankLike(template);
//   }

//   switch (rootKey) {
//     case "diagnosis":
//       return { name: "", code: "", notes: "" };
//     case "advice":
//       return { text: "", category: "" };
//     case "otherTests":
//       return { name: "", result: "" };
//     case "therapeutics":
//       return {
//         medication: "",
//         dosage: "",
//         frequency: "",
//         duration: "",
//         instructions: "",
//       };
//     default:
//       return "";
//   }
// };

// const updateAtPath = (source, path, nextValue) => {
//   if (path.length === 0) return nextValue;

//   const [key, ...remaining] = path;
//   const base = Array.isArray(source)
//     ? [...source]
//     : { ...(source && typeof source === "object" ? source : {}) };

//   base[key] = updateAtPath(
//     source && source[key] !== undefined
//       ? source[key]
//       : undefined,
//     remaining,
//     nextValue,
//   );

//   return base;
// };

// const formatDateForPayload = (value) => {
//   if (!value) return null;
//   const parsed = new Date(`${value}T00:00:00`);

//   return Number.isNaN(parsed.getTime())
//     ? null
//     : parsed.toISOString();
// };

// function EditableValue({
//   label,
//   value,
//   path,
//   rootKey,
//   onChange,
//   depth = 0,
// }) {
//   const normalizedValue = parseStructuredString(value);

//   if (Array.isArray(normalizedValue)) {
//     return (
//       <div className="space-y-2">
//         {normalizedValue.length === 0 && (
//           <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
//             No records added yet.
//           </div>
//         )}

//         {normalizedValue.map((item, index) => (
//           <div
//             key={`${rootKey}-${index}`}
//             className="rounded-lg border border-slate-200 bg-white p-3"
//           >
//             <div className="mb-2 flex items-center justify-between gap-2">
//               <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
//                 {label} {index + 1}
//               </span>
//               <button
//                 type="button"
//                 onClick={() =>
//                   onChange(
//                     path,
//                     normalizedValue.filter((_, itemIndex) => itemIndex !== index),
//                   )
//                 }
//                 className="rounded-md px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"
//               >
//                 Remove
//               </button>
//             </div>

//             <EditableValue
//               label={`${label} ${index + 1}`}
//               value={item}
//               path={[...path, index]}
//               rootKey={rootKey}
//               onChange={onChange}
//               depth={depth + 1}
//             />
//           </div>
//         ))}

//         <button
//           type="button"
//           onClick={() =>
//             onChange(
//               path,
//               [
//                 ...normalizedValue,
//                 createArrayItem(
//                   rootKey,
//                   normalizedValue[0],
//                 ),
//               ],
//             )
//           }
//           className="inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
//         >
//           + Add {label.replace(/s$/, "")}
//         </button>
//       </div>
//     );
//   }

//   if (normalizedValue && typeof normalizedValue === "object") {
//     const entries = Object.entries(normalizedValue);

//     if (!entries.length) {
//       return (
//         <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
//           No structured fields available for this section.
//         </div>
//       );
//     }

//     return (
//       <div
//         className={`grid min-w-0 grid-cols-1 gap-3 ${
//           depth === 0 ? "xl:grid-cols-2" : "sm:grid-cols-2"
//         }`}
//       >
//         {entries.map(([key, childValue]) => {
//           const childPath = [...path, key];
//           const nested =
//             childValue !== null &&
//             typeof childValue === "object";

//           return (
//             <div
//               key={key}
//               className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3 ${
//                 nested ? "sm:col-span-2" : ""
//               }`}
//             >
//               <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
//                 {humanizeKey(key)}
//               </label>
//               <EditableValue
//                 label={humanizeKey(key)}
//                 value={childValue}
//                 path={childPath}
//                 rootKey={rootKey}
//                 onChange={onChange}
//                 depth={depth + 1}
//               />
//             </div>
//           );
//         })}
//       </div>
//     );
//   }

//   const key = path[path.length - 1];
//   const stringValue =
//     normalizedValue === null || normalizedValue === undefined
//       ? ""
//       : String(normalizedValue);

//   const controlClass =
//     "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

//   if (typeof normalizedValue === "boolean") {
//     return (
//       <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700">
//         <input
//           type="checkbox"
//           checked={normalizedValue}
//           onChange={(event) => onChange(path, event.target.checked)}
//           className="h-4 w-4 rounded border-slate-300 text-blue-600"
//         />
//         {normalizedValue ? "Enabled" : "Disabled"}
//       </label>
//     );
//   }

//   if (key === "consultationType") {
//     return (
//       <select
//         value={stringValue}
//         onChange={(event) => onChange(path, event.target.value)}
//         className={controlClass}
//       >
//         <option value="comprehensive">Comprehensive</option>
//         <option value="short_consult">Short Consultation</option>
//         <option value="binocular_vision">Binocular Vision</option>
//         <option value="low_vision">Low Vision</option>
//         <option value="contact_lenses">Contact Lenses</option>
//       </select>
//     );
//   }

//   if (
//     ["consultationDate", "recallDue", "due", "date"].includes(key)
//   ) {
//     return (
//       <input
//         type="date"
//         value={dateInputValue(stringValue)}
//         onChange={(event) => onChange(path, event.target.value)}
//         className={controlClass}
//       />
//     );
//   }

//   const longText =
//     stringValue.length > 90 ||
//     /notes|symptoms|history|advice|instructions|interpretation|comments|remarks|message|ophthalmoscopy|biomicroscopy/i.test(
//       key || "",
//     );

//   return longText ? (
//     <textarea
//       value={stringValue}
//       onChange={(event) => onChange(path, event.target.value)}
//       rows={Math.min(6, Math.max(2, Math.ceil(stringValue.length / 70)))}
//       className={`${controlClass} resize-y`}
//       placeholder={`Enter ${humanizeKey(key || label).toLowerCase()}...`}
//     />
//   ) : (
//     <input
//       type="text"
//       value={stringValue}
//       onChange={(event) => onChange(path, event.target.value)}
//       className={controlClass}
//       placeholder={`Enter ${humanizeKey(key || label).toLowerCase()}...`}
//     />
//   );
// }

// function ConsultationEditor({
//   data,
//   onChange,
// }) {
//   return (
//     <div className="space-y-4">
//       <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
//         <div className="text-sm font-semibold text-blue-900">
//           Edit consultation record
//         </div>
//         <p className="mt-1 text-xs leading-5 text-blue-700">
//           Update clinical fields below. Workflow status is managed separately and is not changed when saving these edits.
//         </p>
//       </div>

//       {EDITABLE_GROUPS.map((group) => {
//         const Icon = group.icon;

//         return (
//           <section
//             id={sectionIdFromTitle(group.title)}
//             key={group.title}
//             className="scroll-mt-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.035)]"
//           >
//             <header className="flex min-h-12 items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
//               <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
//                 <Icon size={15} />
//               </span>
//               <h2 className="text-[12px] font-bold text-slate-800">
//                 {group.title}
//               </h2>
//             </header>

//             <div className="grid min-w-0 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
//               {group.fields.map(([key, label]) => {
//                 const value = data[key];
//                 const nested =
//                   value !== null &&
//                   typeof value === "object";

//                 return (
//                   <div
//                     key={key}
//                     className={`min-w-0 ${
//                       nested ? "lg:col-span-2" : ""
//                     }`}
//                   >
//                     <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
//                       {label}
//                     </div>
//                     <EditableValue
//                       label={label}
//                       value={value}
//                       path={[key]}
//                       rootKey={key}
//                       onChange={onChange}
//                     />
//                   </div>
//                 );
//               })}
//             </div>
//           </section>
//         );
//       })}
//     </div>
//   );
// }

// export default function ConsultationDetailsPage() {
//   const { id: consultationId } = useParams();
//   const navigate = useNavigate();

//   const [consultation, setConsultation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isEditing, setIsEditing] = useState(false);
//   const [editData, setEditData] = useState(null);
//   const [editDirty, setEditDirty] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [saveError, setSaveError] = useState("");
//   const [saveSuccess, setSaveSuccess] = useState("");
//   const [activeSection, setActiveSection] = useState("consultation-information");

//   useEffect(() => {
//     let mounted = true;

//     const load = async () => {
//       if (!consultationId) {
//         setError("Consultation ID is missing.");
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         setError("");

//         const response =
//           await getConsultation(consultationId);

//         const data =
//           response?.data?.consultation ||
//           response?.data ||
//           response?.consultation ||
//           null;

//         if (!data) {
//           throw new Error(
//             "Consultation record not found.",
//           );
//         }

//         if (mounted) {
//           setConsultation(data);
//         }
//       } catch (err) {
//         if (!mounted) return;

//         setError(
//           err?.response?.data?.message ||
//             err?.message ||
//             "Unable to load consultation.",
//         );
//       } finally {
//         if (mounted) {
//           setLoading(false);
//         }
//       }
//     };

//     load();

//     return () => {
//       mounted = false;
//     };
//   }, [consultationId]);

//   const patient = consultation?.patientId;

//   const patientName = useMemo(
//     () => getPatientName(patient),
//     [patient],
//   );

//   const startEditing = () => {
//     setEditData(createEditableRecord(consultation));
//     setEditDirty(false);
//     setSaveError("");
//     setSaveSuccess("");
//     setIsEditing(true);
//   };

//   const cancelEditing = () => {
//     if (
//       editDirty &&
//       !window.confirm("Discard the changes made to this consultation?")
//     ) {
//       return;
//     }

//     setIsEditing(false);
//     setEditData(null);
//     setEditDirty(false);
//     setSaveError("");
//   };

//   const handleEditChange = (path, value) => {
//     setEditData((current) => updateAtPath(current || {}, path, value));
//     setEditDirty(true);
//     setSaveError("");
//     setSaveSuccess("");
//   };

//   const handleSaveEdits = async () => {
//     if (!consultationId || !editData || saving) return;

//     try {
//       setSaving(true);
//       setSaveError("");
//       setSaveSuccess("");

//       const payload = {};
//       EDITABLE_FIELDS.forEach((key) => {
//         if (editData[key] !== undefined) {
//           payload[key] = cloneValue(editData[key]);
//         }
//       });

//       payload.consultationDate = formatDateForPayload(
//         editData.consultationDate,
//       );

//       if ("recallDue" in payload) {
//         payload.recallDue = formatDateForPayload(
//           editData.recallDue,
//         );
//       }

//       if (payload.recall && typeof payload.recall === "object") {
//         payload.recall = {
//           ...payload.recall,
//           due: formatDateForPayload(
//             payload.recall.due || payload.recall.date || editData.recallDue,
//           ),
//           message:
//             payload.recall.message ??
//             editData.recallLetter ??
//             "",
//         };
//         delete payload.recall.date;
//       }

//       // Support older records whose recall fields were saved separately.
//       if (
//         !payload.recallLetter &&
//         payload.recall?.message
//       ) {
//         payload.recallLetter = payload.recall.message;
//       }

//       const response = await updateConsultation(
//         consultationId,
//         payload,
//       );

//       const updated =
//         response?.data?.consultation ||
//         response?.data ||
//         response?.consultation ||
//         null;

//       setConsultation(
//         updated && updated._id
//           ? updated
//           : { ...consultation, ...payload },
//       );
//       setIsEditing(false);
//       setEditData(null);
//       setEditDirty(false);
//       setSaveSuccess("Consultation updated successfully.");
//     } catch (err) {
//       setSaveError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to save consultation changes.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const sectionNavItems = !consultation
//     ? []
//     : isEditing
//       ? EDITABLE_GROUPS.map((group) => ({
//         title: group.title,
//         label: group.title
//           .replace("Consultation Information", "Overview")
//           .replace("Visual Acuity & Prescription", "Prescription")
//           .replace("Clinical Management & Tests", "Examinations")
//           .replace("Specialist Assessments", "Specialist")
//           .replace("Diagnosis & Treatment", "Treatment")
//           .replace("Clinical Notes & Recall", "Notes"),
//         icon: group.icon,
//       }))
//     : [
//         {
//           title: "Consultation Information",
//           label: "Overview",
//           icon: ClipboardList,
//         },
//         ...(consultation.visualAcuity
//           ? [{ title: "Visual Acuity", label: "Visual acuity", icon: Eye }]
//           : []),
//         {
//           title: "Refraction & Prescription",
//           label: "Prescription",
//           icon: Glasses,
//         },
//         ...(consultation.binocularVision
//           ? [{ title: "Binocular Vision", label: "Binocular vision", icon: Eye }]
//           : []),
//         {
//           title: "Clinical Management & Tests",
//           label: "Examinations",
//           icon: Stethoscope,
//         },
//         ...(consultation.lowVision
//           ? [{ title: "Low Vision Management", label: "Low vision", icon: Eye }]
//           : []),
//         ...((consultation.contactLens || consultation.contactLenses)
//           ? [{
//               title: "Contact Lens Management",
//               label: "Contact lenses",
//               icon: Glasses,
//             }]
//           : []),
//         ...(consultation.dispensing
//           ? [{ title: "Dispensing", label: "Dispensing", icon: Activity }]
//           : []),
//         {
//           title: "Clinical Notes & Instructions",
//           label: "Notes & recall",
//           icon: FileText,
//         },
//         ];

//   const navigateToSection = (title) => {
//     const id = sectionIdFromTitle(title);
//     setActiveSection(id);
//     document.getElementById(id)?.scrollIntoView({
//       behavior: "smooth",
//       block: "start",
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f7fb]">
//         <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-sm">
//           <Loader2
//             size={20}
//             className="animate-spin"
//           />
//           Loading consultation...
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-[60vh] bg-[#f4f7fb] p-6">
//         <div className="mx-auto max-w-5xl">
          

//           <div className="rounded-xl border border-rose-200 bg-white p-6 text-rose-700 shadow-sm">
//             {error}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!consultation) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-[#f4f7fb] text-slate-800">
//       {/* APPLICATION WORKSPACE HEADER */}
//       <div className="border-b border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
//         <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-5 lg:px-6">
          

//           <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
//             <span>Clinical workspace</span>
//             <span className="text-slate-300">/</span>
//             <span>Patient records</span>
//             <span className="text-slate-300">/</span>
//             <span className="text-blue-600">Consultation</span>
//           </div>

//           <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//             <div className="flex min-w-0 items-start gap-3">
//               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-sm">
//                 <Stethoscope size={19} />
//               </div>

//               <div className="min-w-0">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <h1 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
//                     Consultation Details
//                   </h1>

//                   <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
//                     {typeLabel(
//                       consultation.consultationType,
//                     )}
//                   </span>

//                   <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
//                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//                     {statusLabel(consultation.status)}
//                   </span>
//                 </div>

//                 <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
//                   <span className="inline-flex items-center gap-1.5">
//                     <UserRound size={14} />
//                     {patientName}
//                   </span>

//                   <span>
//                     Patient ID:{" "}
//                     {patient?.patientNumber || "—"}
//                   </span>

//                   <span className="inline-flex items-center gap-1.5">
//                     <CalendarDays size={14} />
//                     {formatDate(
//                       consultation.consultationDate,
//                     )}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-wrap items-center gap-2">
//               {isEditing ? (
//                 <>
//                   <button
//                     type="button"
//                     onClick={cancelEditing}
//                     disabled={saving}
//                     className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
//                   >
//                     <X size={15} />
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleSaveEdits}
//                     disabled={saving}
//                     className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
//                   >
//                     {saving ? (
//                       <Loader2 size={15} className="animate-spin" />
//                     ) : (
//                       <Save size={15} />
//                     )}
//                     {saving ? "Saving..." : "Save Changes"}
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   <button
//                     type="button"
//                     onClick={startEditing}
//                     className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-700"
//                   >
//                     <Pencil size={15} />
//                     Edit Consultation
//                   </button>
//                   {patient?._id && (
//                     <button
//                       type="button"
//                       onClick={() =>
//                         navigate(`/patients/${patient._id}`)
//                       }
//                       className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
//                     >
//                       <UserRound size={15} />
//                       Open Patient
//                     </button>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>

//           <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
//             <SummaryItem
//               icon={Hash}
//               label="Patient number"
//               value={patient?.patientNumber || "Not assigned"}
//             />
//             <SummaryItem
//               icon={CalendarDays}
//               label="Visit date"
//               value={formatDate(consultation.consultationDate)}
//             />
//             <SummaryItem
//               icon={UserRound}
//               label="Clinician"
//               value={
//                 consultation.optometristId
//                   ? `${consultation.optometristId.firstName || ""} ${consultation.optometristId.lastName || ""}`.trim() || "Clinical team"
//                   : "Clinical team"
//               }
//             />
//             <SummaryItem
//               icon={Clock3}
//               label="Last updated"
//               value={formatDateTime(consultation.updatedAt || consultation.createdAt)}
//             />
//           </div>
//         </div>
//       </div>

//       {(saveError || saveSuccess) && (
//         <div className="mx-auto max-w-[1800px] px-3 pt-3 sm:px-5 lg:px-6">
//           {saveError && (
//             <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
//               {saveError}
//             </div>
//           )}
//           {saveSuccess && (
//             <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
//               <Check size={15} />
//               {saveSuccess}
//             </div>
//           )}
//         </div>
//       )}

//       {/* RECORD WORKSPACE */}
//       <div className="mx-auto max-w-[1800px] px-3 py-4 sm:px-5 lg:px-6">
//         <nav
//           aria-label="Consultation sections"
//           className="mb-4 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.025)]"
//         >
//           <div className="flex gap-1 overflow-x-auto">
//             {sectionNavItems.map((item) => {
//               const Icon = item.icon;
//               const id = sectionIdFromTitle(item.title);
//               const active = activeSection === id;

//               return (
//                 <button
//                   key={item.title}
//                   type="button"
//                   onClick={() => navigateToSection(item.title)}
//                   className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold transition ${
//                     active
//                       ? "border-slate-900 bg-slate-900 text-white shadow-sm"
//                       : "border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800"
//                   }`}
//                   aria-current={active ? "location" : undefined}
//                 >
//                   <Icon size={12} />
//                   {item.label}
//                 </button>
//               );
//             })}
//           </div>
//         </nav>

//         <div className="space-y-3.5">
//           {isEditing ? (
//             <>
//               <ConsultationEditor
//                 data={editData || {}}
//                 onChange={handleEditChange}
//               />
//               <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur">
//                 <div className="text-[10px] font-medium text-slate-500">
//                   {editDirty ? "You have unsaved changes" : "No unsaved changes"}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={cancelEditing}
//                     disabled={saving}
//                     className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
//                   >
//                     <X size={14} />
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleSaveEdits}
//                     disabled={saving || !editDirty}
//                     className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
//                     {saving ? "Saving..." : "Save Changes"}
//                   </button>
//                 </div>
//               </div>
//             </>
//           ) : (
//           <>
//         {/* BASIC */}
//         <Section
//           title="Consultation Information"
//           icon={ClipboardList}
//         >
//           <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
//             <Field
//               label="Consultation Date"
//               value={formatDateTime(
//                 consultation.consultationDate,
//               )}
//             />

//             <Field
//               label="Consultation Type"
//               value={typeLabel(
//                 consultation.consultationType,
//               )}
//             />

//             <Field
//               label="Optometrist / Doctor"
//               value={
//                 consultation.optometristId
//                   ? `${consultation.optometristId.firstName || ""} ${
//                       consultation.optometristId.lastName || ""
//                     }`.trim()
//                   : "—"
//               }
//             />

//             <Field
//               label="Status"
//               value={statusLabel(consultation.status)}
//             />

//             <Field
//               label="Reason for Visit"
//               value={consultation.reasonForVisit}
//             />

//             <Field
//               label="Symptoms"
//               value={consultation.symptoms}
//             />

//             <Field
//               label="Medical History"
//               value={consultation.medicalHistory}
//             />

//             <Field
//               label="Ocular History"
//               value={consultation.ocularHistory}
//             />
//           </div>
//         </Section>

//         {/* VISUAL ACUITY */}
//         {consultation.visualAcuity && (
//           <Section
//             title="Visual Acuity"
//             icon={Eye}
//           >
//             <Field
//               label="Visual Acuity"
//               value={consultation.visualAcuity}
//             />
//           </Section>
//         )}

//         {/* REFRACTION */}
//         <Section
//           title="Refraction & Prescription"
//           icon={Glasses}
//         >
//           <div className="space-y-5">
//             <PrescriptionTable
//               title="Previous Rx"
//               prescription={consultation.previousRx}
//             />

//             <PrescriptionTable
//               title="Objective Rx"
//               prescription={consultation.objectiveRx}
//             />

//             <PrescriptionTable
//               title="Subjective Rx"
//               prescription={consultation.subjectiveRx}
//             />

//             <PrescriptionTable
//               title="Final Rx"
//               prescription={consultation.finalRx}
//             />

//             <PrescriptionTable
//               title="Given Rx"
//               prescription={consultation.givenRx}
//             />

//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               <Field
//                 label="PD"
//                 value={consultation.pd}
//               />

//               <Field
//                 label="Refraction Notes"
//                 value={
//                   consultation.refractionNotes
//                 }
//               />
//             </div>
//           </div>
//         </Section>

//         {/* BINOCULAR */}
//         {consultation.binocularVision && (
//           <Section
//             title="Binocular Vision"
//             icon={Eye}
//           >
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               {Object.entries(
//                 consultation.binocularVision,
//               ).map(([key, value]) => (
//                 <Field
//                   key={key}
//                   label={key}
//                   value={value}
//                 />
//               ))}
//             </div>
//           </Section>
//         )}

//         {/* TESTS */}
//         <Section
//           title="Clinical Management & Tests"
//           icon={Stethoscope}
//         >
//           <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//             <Field
//               label="Slit Lamp"
//               value={consultation.slitLamp}
//             />

//             <Field
//               label="Fundus"
//               value={consultation.fundus}
//             />

//             <Field
//               label="Ophthalmoscopy"
//               value={
//                 consultation.ophthalmoscopy
//               }
//             />

//             <Field
//               label="Biomicroscopy"
//               value={
//                 consultation.biomicroscopy
//               }
//             />

//             <Field
//               label="Visual Field"
//               value={
//                 consultation.visualField
//               }
//             />

//             <Field
//               label="Colour Vision"
//               value={
//                 consultation.colourVision
//               }
//             />

//             <Field
//               label="Other Tests"
//               value={consultation.otherTests}
//             />

//             <Field
//               label="Diagnosis"
//               value={consultation.diagnosis}
//             />

//             <Field
//               label="Advice"
//               value={consultation.advice}
//             />

//             <Field
//               label="Therapeutics"
//               value={
//                 consultation.therapeutics
//               }
//             />
//           </div>
//         </Section>

//         {/* LOW VISION */}
//         {consultation.lowVision && (
//           <Section
//             title="Low Vision Management"
//             icon={Eye}
//           >
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               {Object.entries(
//                 consultation.lowVision,
//               ).map(([key, value]) => (
//                 <Field
//                   key={key}
//                   label={key}
//                   value={value}
//                 />
//               ))}
//             </div>
//           </Section>
//         )}

//         {/* CONTACT LENS */}
//         {(consultation.contactLens ||
//           consultation.contactLenses) && (
//           <Section
//             title="Contact Lens Management"
//             icon={Eye}
//           >
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               {Object.entries(
//                 consultation.contactLens ||
//                   consultation.contactLenses ||
//                   {},
//               ).map(([key, value]) => (
//                 <Field
//                   key={key}
//                   label={key}
//                   value={value}
//                 />
//               ))}
//             </div>
//           </Section>
//         )}

//         {/* DISPENSING */}
//         {consultation.dispensing && (
//           <Section
//             title="Dispensing"
//             icon={Glasses}
//           >
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               {Object.entries(
//                 consultation.dispensing,
//               ).map(([key, value]) => (
//                 <Field
//                   key={key}
//                   label={key}
//                   value={value}
//                 />
//               ))}
//             </div>
//           </Section>
//         )}

//         {/* NOTES */}
//         <Section
//           title="Clinical Notes & Instructions"
//           icon={FileText}
//         >
//           <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//             <Field
//               label="Clinical Notes"
//               value={consultation.clinicalNotes}
//             />

//             <Field
//               label="Patient Instructions"
//               value={
//                 consultation.patientInstructions
//               }
//             />

//             <Field
//               label="Internal Notes"
//               value={consultation.internalNotes}
//             />

//             <Field
//               label="Notes"
//               value={consultation.notes}
//             />

//             <Field
//               label="Recall Due"
//               value={formatDate(
//                 consultation.recallDue ||
//                   consultation.recall?.due,
//               )}
//             />

//             <Field
//               label="Recall Letter"
//               value={
//                 consultation.recallLetter ||
//                 consultation.recall?.message
//               }
//             />
//           </div>
//         </Section>

//         {/* FOOTER */}
//         <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
//           <div className="text-xs text-slate-400">
//             Created:{" "}
//             {formatDateTime(
//               consultation.createdAt,
//             )}
//           </div>

//           <div className="text-xs text-slate-400">
//             Updated:{" "}
//             {formatDateTime(
//               consultation.updatedAt,
//             )}
//           </div>
//         </div>
//           </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Glasses,
  Hash,
  Loader2,
  Pencil,
  Save,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getConsultation,
  updateConsultation,
} from "../consultation.api";

const getPatientName = (patient) => {
  if (!patient) return "Unknown Patient";

  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unknown Patient";
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";

  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyValue);
  }

  if (typeof value === "object") {
    const values = Object.values(value);
    return values.length === 0 || values.every(isEmptyValue);
  }

  return false;
};

const FIELD_LABELS = {
  right: "Right Eye",
  left: "Left Eye",
  od: "OD",
  os: "OS",
  ou: "OU",
  va: "VA",
  nearVa: "Near VA",
  pd: "PD",
  cdRatio: "C/D Ratio",
  npc: "NPC",
  npa: "NPA",
  aa: "AA",
  nra: "NRA",
  pra: "PRA",
  mem: "MEM",
  oct: "OCT",
  lids: "Lids",
  conjunctiva: "Conjunctiva",
  cornea: "Cornea",
  anteriorChamber: "Anterior Chamber",
  iris: "Iris",
  lens: "Lens",
  disc: "Optic Disc",
  macula: "Macula",
  vessels: "Vessels",
  retina: "Retina",
  other: "Other Findings",
  stereopsisNear: "Near Stereopsis",
  wfdtDistance: "Worth Four Dot — Distance",
  wfdtIntermediate: "Worth Four Dot — Intermediate",
  wfdtNear: "Worth Four Dot — Near",
  cissScore: "CISS Score",
  coverDistance: "Cover Test — Distance",
  coverNear: "Cover Test — Near",
  nfvDistanceBlur: "NFV Distance — Blur",
  nfvDistanceBreak: "NFV Distance — Break",
  nfvDistanceRecovery: "NFV Distance — Recovery",
  pfvDistanceBlur: "PFV Distance — Blur",
  pfvDistanceBreak: "PFV Distance — Break",
  pfvDistanceRecovery: "PFV Distance — Recovery",
};

const humanizeKey = (key) => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];

  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();
};

const parseStructuredString = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  // Parse JSON stored as a string, while leaving ordinary clinical notes untouched.
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Continue to legacy text parsing below.
    }
  }

  // Parse text that wraps JSON objects in eye labels, e.g.
  // "Right: {...} • Left: {...}".
  const eyePattern =
    /(?:^|\s*[•|]\s*)(Right|Left|OD|OS)\s*:\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/gi;
  const eyeEntries = [];
  let match;

  while ((match = eyePattern.exec(trimmed)) !== null) {
    try {
      const key = match[1].toLowerCase();
      eyeEntries.push([
        key === "right" || key === "od" ? "right" : "left",
        JSON.parse(match[2]),
      ]);
    } catch {
      // If one segment is malformed, preserve the original string.
      return value;
    }
  }

  if (eyeEntries.length > 0) {
    return Object.fromEntries(eyeEntries);
  }

  return value;
};

const formatValue = (value) => {
  const normalized = parseStructuredString(value);

  if (isEmptyValue(normalized)) return "—";
  if (typeof normalized === "boolean") return normalized ? "Yes" : "No";
  if (typeof normalized === "object") return "—";
  return String(normalized);
};

const statusLabel = (status) => {
  const normalized = String(status || "completed")
    .trim()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return normalized || "Completed";
};

const typeLabel = (type) => {
  switch (type) {
    case "comprehensive":
      return "Comprehensive";
    case "short_consult":
      return "Short Consultation";
    case "binocular_vision":
      return "Binocular Vision";
    case "low_vision":
      return "Low Vision";
    case "contact_lenses":
      return "Contact Lens";
    default:
      return type || "Consultation";
  }
};

const sectionIdFromTitle = (title) =>
  `consultation-${String(title || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

function SummaryItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-md border border-slate-100 bg-slate-50/70 px-2.5 py-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
        <Icon size={13} />
      </div>
      <div className="min-w-0">
        <div className="text-[8px] font-bold uppercase tracking-[0.11em] text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 truncate text-[10px] font-bold text-slate-700" title={String(value ?? "")}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}) {
  return (
    <section
      id={sectionIdFromTitle(title)}
      className="min-w-0 scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.035)]"
    >
      <div className="flex min-h-10 items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
          <Icon size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[11px] font-bold tracking-tight text-slate-800">
            {title}
          </h2>
        </div>
        <span className="hidden text-[8px] font-bold uppercase tracking-[0.14em] text-slate-300 sm:inline">
          Clinical record
        </span>
      </div>

      <div className="min-w-0 p-2.5 sm:p-3">
        {children}
      </div>
    </section>
  );
}

function ValueDisplay({
  value,
  depth = 0,
}) {
  value = parseStructuredString(value);

  if (isEmptyValue(value)) {
    return (
      <span className="text-[11px] text-slate-300">
        —
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span className="text-[11px] font-medium text-slate-700">
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (typeof value !== "object") {
    return (
      <span className="whitespace-pre-wrap break-words text-[11px] leading-4 text-slate-700">
        {String(value)}
      </span>
    );
  }

  if (depth > 5) {
    return (
      <span className="whitespace-pre-wrap break-words text-[11px] text-slate-600">
        Details recorded
      </span>
    );
  }

  if (Array.isArray(value)) {
    const items = value.filter((item) => !isEmptyValue(item));

    if (!items.length) {
      return <span className="text-[11px] text-slate-300">—</span>;
    }

    const containsObjects = items.some(
      (item) => typeof item === "object" && item !== null,
    );

    if (!containsObjects) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <span
              key={`${String(item)}-${index}`}
              className="inline-flex max-w-full items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600"
            >
              <span className="break-words">{String(item)}</span>
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => {
          if (item === null || typeof item !== "object") {
            return (
              <div
                key={`item-${index}`}
                className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5"
              >
                <ValueDisplay value={item} depth={depth + 1} />
              </div>
            );
          }

          const titleKey = ["name", "title", "test", "testName"].find(
            (key) =>
              typeof item[key] === "string" &&
              item[key].trim(),
          );
          const title = titleKey ? item[titleKey] : `Record ${index + 1}`;
          const details = Object.fromEntries(
            Object.entries(item).filter(
              ([key, entryValue]) =>
                key !== titleKey && !isEmptyValue(entryValue),
            ),
          );

          return (
            <div
              key={`${title}-${index}`}
              className="rounded-md border border-slate-200 bg-white p-2.5"
            >
              <div className="mb-1.5 text-[11px] font-semibold text-slate-800">
                {title}
              </div>
              {Object.keys(details).length > 0 ? (
                <ValueDisplay value={details} depth={depth + 1} />
              ) : (
                <span className="text-xs text-slate-400">
                  No result recorded
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const entries = Object.entries(value).filter(
    ([, entryValue]) => !isEmptyValue(entryValue),
  );

  if (!entries.length) {
    return <span className="text-[11px] text-slate-300">—</span>;
  }

  const eyeKeys = new Set(["right", "left", "od", "os"]);
  const isEyeGrouped = entries.some(([key]) =>
    eyeKeys.has(String(key).toLowerCase()),
  );

  if (isEyeGrouped) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entries.map(([key, entryValue]) => (
          <div
            key={key}
            className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {humanizeKey(key)}
              </h4>
            </div>
            <ValueDisplay value={entryValue} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map(([key, entryValue]) => {
        const nested =
          typeof entryValue === "object" &&
          entryValue !== null;

        return (
          <div
            key={key}
            className={`min-w-0 rounded-md border border-slate-100 bg-slate-50/60 px-2.5 py-2 ${
              nested ? "sm:col-span-2" : ""
            }`}
          >
            <dt className="mb-1 text-[9px] font-bold uppercase tracking-[0.09em] text-slate-400">
              {humanizeKey(key)}
            </dt>
            <dd className="min-w-0">
              <ValueDisplay
                value={entryValue}
                depth={depth + 1}
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Field({
  label,
  value,
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>

      <div className="min-w-0">
        <ValueDisplay value={value} />
      </div>
    </div>
  );
}

function PrescriptionTable({
  title,
  prescription,
}) {
  if (!prescription) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="text-[11px] font-semibold text-slate-800">
          {title}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-left text-[9px] text-slate-400">
              <th className="px-2.5 py-1.5">Eye</th>
              <th className="px-2.5 py-1.5">Sphere</th>
              <th className="px-2.5 py-1.5">Cylinder</th>
              <th className="px-2.5 py-1.5">Axis</th>
              <th className="px-2.5 py-1.5">VA</th>
              <th className="px-2.5 py-1.5">Near VA</th>
              <th className="px-2.5 py-1.5">Add</th>
              <th className="px-2.5 py-1.5">Prism</th>
              <th className="px-2.5 py-1.5">Base</th>
            </tr>
          </thead>

          <tbody>
            {["right", "left"].map((eye) => {
              const row = prescription?.[eye] || {};

              return (
                <tr
                  key={eye}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-2.5 py-1.5 font-semibold text-slate-700">
                    {eye === "right" ? "OD" : "OS"}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.sphere)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.cylinder)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.axis)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.va)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.nearVa)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.add)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.prism)}
                  </td>

                  <td className="px-2.5 py-1.5">
                    {formatValue(row.base)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EDITABLE_GROUPS = [
  {
    title: "Consultation Information",
    icon: ClipboardList,
    fields: [
      ["consultationType", "Consultation Type"],
      ["consultationDate", "Consultation Date"],
      ["reasonForVisit", "Reason for Visit"],
      ["symptoms", "Symptoms"],
      ["medicalHistory", "Medical History"],
      ["ocularHistory", "Ocular History"],
      ["familyHistory", "Family History"],
      ["medication", "Medication"],
      ["allergy", "Allergies"],
      ["pupils", "Pupillary Findings"],
    ],
  },
  {
    title: "Visual Acuity & Prescription",
    icon: Glasses,
    fields: [
      ["visualAcuity", "Visual Acuity"],
      ["previousRx", "Previous Prescription"],
      ["objectiveRx", "Objective Prescription"],
      ["subjectiveRx", "Subjective Prescription"],
      ["finalRx", "Final Prescription"],
      ["givenRx", "Given Prescription"],
      ["pd", "Pupillary Distance (PD)"],
      ["refractionNotes", "Refraction Notes"],
    ],
  },
  {
    title: "Clinical Management & Tests",
    icon: Stethoscope,
    fields: [
      ["slitLamp", "Slit Lamp"],
      ["fundus", "Fundus"],
      ["ophthalmoscopy", "Ophthalmoscopy"],
      ["biomicroscopy", "Biomicroscopy"],
      ["visualField", "Visual Field"],
      ["colourVision", "Colour Vision"],
      ["otherTests", "Other Tests"],
    ],
  },
  {
    title: "Specialist Assessments",
    icon: Eye,
    fields: [
      ["binocularVision", "Binocular Vision"],
      ["lowVision", "Low Vision"],
      ["contactLens", "Contact Lens"],
      ["contactLenses", "Contact Lenses (Legacy)"],
      ["dispensing", "Dispensing Details"],
    ],
  },
  {
    title: "Diagnosis & Treatment",
    icon: ClipboardList,
    fields: [
      ["diagnosis", "Diagnosis"],
      ["advice", "Advice / Management Plan"],
      ["therapeutics", "Therapeutics"],
    ],
  },
  {
    title: "Clinical Notes & Recall",
    icon: FileText,
    fields: [
      ["clinicalNotes", "Clinical Notes"],
      ["patientInstructions", "Patient Instructions"],
      ["internalNotes", "Internal Notes"],
      ["notes", "Additional Notes"],
      ["recall", "Recall Details"],
      ["recallDue", "Recall Due Date"],
      ["recallLetter", "Recall Letter"],
    ],
  },
];

const EDITABLE_FIELDS = EDITABLE_GROUPS.flatMap((group) =>
  group.fields.map(([key]) => key),
);

const cloneValue = (value) => {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const normalizeStructuredForEdit = (value) => {
  const parsed = parseStructuredString(value);

  if (parsed !== value) {
    return normalizeStructuredForEdit(parsed);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeStructuredForEdit);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        normalizeStructuredForEdit(child),
      ]),
    );
  }

  return value;
};

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? String(value)
      : "";
  }

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );

  return local.toISOString().slice(0, 10);
};

const emptyPrescriptionEye = () => ({
  sphere: "",
  cylinder: "",
  axis: "",
  va: "",
  nearVa: "",
  add: "",
  inter: "",
  prism: "",
  base: "",
});

const STRUCTURED_EDIT_FIELDS = new Set([
  "visualAcuity",
  "previousRx",
  "objectiveRx",
  "subjectiveRx",
  "finalRx",
  "givenRx",
  "pd",
  "slitLamp",
  "fundus",
  "otherTests",
  "diagnosis",
  "advice",
  "binocularVision",
  "lowVision",
  "contactLens",
  "contactLenses",
  "dispensing",
  "therapeutics",
  "recall",
]);

const createEditableRecord = (record) => {
  const editable = {};

  EDITABLE_FIELDS.forEach((key) => {
    if (record[key] !== undefined) {
      const cloned = cloneValue(record[key]);
      editable[key] = STRUCTURED_EDIT_FIELDS.has(key)
        ? normalizeStructuredForEdit(cloned)
        : cloned;
    }
  });

  editable.consultationType =
    editable.consultationType || "comprehensive";
  editable.consultationDate =
    dateInputValue(editable.consultationDate);

  // Ensure the prescription tables can be edited even when a record
  // has no prescription saved yet.
  ["previousRx", "objectiveRx", "subjectiveRx", "finalRx", "givenRx"].forEach(
    (key) => {
      const current = editable[key] && typeof editable[key] === "object"
        ? editable[key]
        : {};

      editable[key] = {
        ...current,
        right: {
          ...emptyPrescriptionEye(),
          ...(current.right && typeof current.right === "object"
            ? current.right
            : {}),
        },
        left: {
          ...emptyPrescriptionEye(),
          ...(current.left && typeof current.left === "object"
            ? current.left
            : {}),
        },
        note: current.note ?? "",
      };
    },
  );

  ["otherTests", "diagnosis", "therapeutics"].forEach((key) => {
    if (!Array.isArray(editable[key])) {
      editable[key] = [];
    }
  });

  if (!editable.recall || typeof editable.recall !== "object") {
    editable.recall = {};
  }

  editable.recall = {
    ...editable.recall,
    due: dateInputValue(
      editable.recall.due ||
      editable.recall.date ||
      editable.recallDue,
    ),
    message:
      editable.recall.message ??
      editable.recallLetter ??
      "",
    type: editable.recall.type ?? "",
    sendReminder: Boolean(editable.recall.sendReminder),
  };

  editable.recallDue = dateInputValue(
    editable.recallDue || editable.recall.due,
  );
  editable.recallLetter =
    editable.recallLetter ?? editable.recall.message ?? "";

  return editable;
};

const blankLike = (value) => {
  if (Array.isArray(value)) return [];
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return "";
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, blankLike(child)]),
    );
  }
  return "";
};

const createArrayItem = (rootKey, template) => {
  if (template !== undefined && template !== null) {
    return blankLike(template);
  }

  switch (rootKey) {
    case "diagnosis":
      return { name: "", code: "", notes: "" };
    case "advice":
      return { text: "", category: "" };
    case "otherTests":
      return { name: "", result: "" };
    case "therapeutics":
      return {
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      };
    default:
      return "";
  }
};

const updateAtPath = (source, path, nextValue) => {
  if (path.length === 0) return nextValue;

  const [key, ...remaining] = path;
  const base = Array.isArray(source)
    ? [...source]
    : { ...(source && typeof source === "object" ? source : {}) };

  base[key] = updateAtPath(
    source && source[key] !== undefined
      ? source[key]
      : undefined,
    remaining,
    nextValue,
  );

  return base;
};

const formatDateForPayload = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString();
};

function EditableValue({
  label,
  value,
  path,
  rootKey,
  onChange,
  depth = 0,
}) {
  const normalizedValue = parseStructuredString(value);

  if (Array.isArray(normalizedValue)) {
    return (
      <div className="space-y-2">
        {normalizedValue.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
            No records added yet.
          </div>
        )}

        {normalizedValue.map((item, index) => (
          <div
            key={`${rootKey}-${index}`}
            className="rounded-md border border-slate-200 bg-white p-2.5"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {label} {index + 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    path,
                    normalizedValue.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                className="rounded-md px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>

            <EditableValue
              label={`${label} ${index + 1}`}
              value={item}
              path={[...path, index]}
              rootKey={rootKey}
              onChange={onChange}
              depth={depth + 1}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            onChange(
              path,
              [
                ...normalizedValue,
                createArrayItem(
                  rootKey,
                  normalizedValue[0],
                ),
              ],
            )
          }
          className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          + Add {label.replace(/s$/, "")}
        </button>
      </div>
    );
  }

  if (normalizedValue && typeof normalizedValue === "object") {
    const entries = Object.entries(normalizedValue);

    if (!entries.length) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
          No structured fields available for this section.
        </div>
      );
    }

    return (
      <div
        className={`grid min-w-0 grid-cols-1 gap-3 ${
          depth === 0 ? "xl:grid-cols-2" : "sm:grid-cols-2"
        }`}
      >
        {entries.map(([key, childValue]) => {
          const childPath = [...path, key];
          const nested =
            childValue !== null &&
            typeof childValue === "object";

          return (
            <div
              key={key}
              className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3 ${
                nested ? "sm:col-span-2" : ""
              }`}
            >
              <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {humanizeKey(key)}
              </label>
              <EditableValue
                label={humanizeKey(key)}
                value={childValue}
                path={childPath}
                rootKey={rootKey}
                onChange={onChange}
                depth={depth + 1}
              />
            </div>
          );
        })}
      </div>
    );
  }

  const key = path[path.length - 1];
  const stringValue =
    normalizedValue === null || normalizedValue === undefined
      ? ""
      : String(normalizedValue);

  const controlClass =
    "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

  if (typeof normalizedValue === "boolean") {
    return (
      <label className="inline-flex min-h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700">
        <input
          type="checkbox"
          checked={normalizedValue}
          onChange={(event) => onChange(path, event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        {normalizedValue ? "Enabled" : "Disabled"}
      </label>
    );
  }

  if (key === "consultationType") {
    return (
      <select
        value={stringValue}
        onChange={(event) => onChange(path, event.target.value)}
        className={controlClass}
      >
        <option value="comprehensive">Comprehensive</option>
        <option value="short_consult">Short Consultation</option>
        <option value="binocular_vision">Binocular Vision</option>
        <option value="low_vision">Low Vision</option>
        <option value="contact_lenses">Contact Lenses</option>
      </select>
    );
  }

  if (
    ["consultationDate", "recallDue", "due", "date"].includes(key)
  ) {
    return (
      <input
        type="date"
        value={dateInputValue(stringValue)}
        onChange={(event) => onChange(path, event.target.value)}
        className={controlClass}
      />
    );
  }

  const longText =
    stringValue.length > 90 ||
    /notes|symptoms|history|advice|instructions|interpretation|comments|remarks|message|ophthalmoscopy|biomicroscopy/i.test(
      key || "",
    );

  return longText ? (
    <textarea
      value={stringValue}
      onChange={(event) => onChange(path, event.target.value)}
      rows={Math.min(6, Math.max(2, Math.ceil(stringValue.length / 70)))}
      className={`${controlClass} resize-y`}
      placeholder={`Enter ${humanizeKey(key || label).toLowerCase()}...`}
    />
  ) : (
    <input
      type="text"
      value={stringValue}
      onChange={(event) => onChange(path, event.target.value)}
      className={controlClass}
      placeholder={`Enter ${humanizeKey(key || label).toLowerCase()}...`}
    />
  );
}

function ConsultationEditor({
  data,
  onChange,
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2">
        <div className="text-xs font-semibold text-blue-900">
          Edit consultation record
        </div>
        <p className="mt-0.5 text-[11px] leading-4 text-blue-700">
          Update clinical fields below. Workflow status is managed separately and is not changed when saving these edits.
        </p>
      </div>

      {EDITABLE_GROUPS.map((group) => {
        const Icon = group.icon;

        return (
          <section
            id={sectionIdFromTitle(group.title)}
            key={group.title}
            className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.035)]"
          >
            <header className="flex min-h-10 items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
                <Icon size={15} />
              </span>
              <h2 className="text-[12px] font-bold text-slate-800">
                {group.title}
              </h2>
            </header>

            <div className="grid min-w-0 grid-cols-1 gap-3 p-3 lg:grid-cols-2">
              {group.fields.map(([key, label]) => {
                const value = data[key];
                const nested =
                  value !== null &&
                  typeof value === "object";

                return (
                  <div
                    key={key}
                    className={`min-w-0 ${
                      nested ? "lg:col-span-2" : ""
                    }`}
                  >
                    <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      {label}
                    </div>
                    <EditableValue
                      label={label}
                      value={value}
                      path={[key]}
                      rootKey={key}
                      onChange={onChange}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function ConsultationDetailsPage() {
  const { id: consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editDirty, setEditDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("consultation-information");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!consultationId) {
        setError("Consultation ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getConsultation(consultationId);

        const data =
          response?.data?.consultation ||
          response?.data ||
          response?.consultation ||
          null;

        if (!data) {
          throw new Error(
            "Consultation record not found.",
          );
        }

        if (mounted) {
          setConsultation(data);
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load consultation.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [consultationId]);

  const patient = consultation?.patientId;

  const patientName = useMemo(
    () => getPatientName(patient),
    [patient],
  );

  const startEditing = () => {
    setEditData(createEditableRecord(consultation));
    setEditDirty(false);
    setSaveError("");
    setSaveSuccess("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (
      editDirty &&
      !window.confirm("Discard the changes made to this consultation?")
    ) {
      return;
    }

    setIsEditing(false);
    setEditData(null);
    setEditDirty(false);
    setSaveError("");
  };

  const handleEditChange = (path, value) => {
    setEditData((current) => updateAtPath(current || {}, path, value));
    setEditDirty(true);
    setSaveError("");
    setSaveSuccess("");
  };

  const handleSaveEdits = async () => {
    if (!consultationId || !editData || saving) return;

    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess("");

      const payload = {};
      EDITABLE_FIELDS.forEach((key) => {
        if (editData[key] !== undefined) {
          payload[key] = cloneValue(editData[key]);
        }
      });

      payload.consultationDate = formatDateForPayload(
        editData.consultationDate,
      );

      if ("recallDue" in payload) {
        payload.recallDue = formatDateForPayload(
          editData.recallDue,
        );
      }

      if (payload.recall && typeof payload.recall === "object") {
        payload.recall = {
          ...payload.recall,
          due: formatDateForPayload(
            payload.recall.due || payload.recall.date || editData.recallDue,
          ),
          message:
            payload.recall.message ??
            editData.recallLetter ??
            "",
        };
        delete payload.recall.date;
      }

      // Support older records whose recall fields were saved separately.
      if (
        !payload.recallLetter &&
        payload.recall?.message
      ) {
        payload.recallLetter = payload.recall.message;
      }

      const response = await updateConsultation(
        consultationId,
        payload,
      );

      const updated =
        response?.data?.consultation ||
        response?.data ||
        response?.consultation ||
        null;

      setConsultation(
        updated && updated._id
          ? updated
          : { ...consultation, ...payload },
      );
      setIsEditing(false);
      setEditData(null);
      setEditDirty(false);
      setSaveSuccess("Consultation updated successfully.");
    } catch (err) {
      setSaveError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save consultation changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const sectionNavItems = !consultation
    ? []
    : isEditing
      ? EDITABLE_GROUPS.map((group) => ({
        title: group.title,
        label: group.title
          .replace("Consultation Information", "Overview")
          .replace("Visual Acuity & Prescription", "Prescription")
          .replace("Clinical Management & Tests", "Examinations")
          .replace("Specialist Assessments", "Specialist")
          .replace("Diagnosis & Treatment", "Treatment")
          .replace("Clinical Notes & Recall", "Notes"),
        icon: group.icon,
      }))
    : [
        {
          title: "Consultation Information",
          label: "Overview",
          icon: ClipboardList,
        },
        ...(consultation.visualAcuity
          ? [{ title: "Visual Acuity", label: "Visual acuity", icon: Eye }]
          : []),
        {
          title: "Refraction & Prescription",
          label: "Prescription",
          icon: Glasses,
        },
        ...(consultation.binocularVision
          ? [{ title: "Binocular Vision", label: "Binocular vision", icon: Eye }]
          : []),
        {
          title: "Clinical Management & Tests",
          label: "Examinations",
          icon: Stethoscope,
        },
        ...(consultation.lowVision
          ? [{ title: "Low Vision Management", label: "Low vision", icon: Eye }]
          : []),
        ...((consultation.contactLens || consultation.contactLenses)
          ? [{
              title: "Contact Lens Management",
              label: "Contact lenses",
              icon: Glasses,
            }]
          : []),
        ...(consultation.dispensing
          ? [{ title: "Dispensing", label: "Dispensing", icon: Activity }]
          : []),
        {
          title: "Clinical Notes & Instructions",
          label: "Notes & recall",
          icon: FileText,
        },
        ];

  const navigateToSection = (title) => {
    const id = sectionIdFromTitle(title);
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f7fb]">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-sm">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading consultation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-[#f4f7fb] p-6">
        <div className="mx-auto max-w-5xl">
          

          <div className="rounded-xl border border-rose-200 bg-white p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800">
      {/* APPLICATION WORKSPACE HEADER */}
      <div className="border-b border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-5 lg:px-6">
          

          <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
            <span>Clinical workspace</span>
            <span className="text-slate-300">/</span>
            <span>Patient records</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600">Consultation</span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-sm">
                <Stethoscope size={19} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                    Consultation Details
                  </h1>

                  <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
                    {typeLabel(
                      consultation.consultationType,
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {statusLabel(consultation.status)}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound size={14} />
                    {patientName}
                  </span>

                  <span>
                    Patient ID:{" "}
                    {patient?.patientNumber || "—"}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {formatDate(
                      consultation.consultationDate,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X size={15} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={saving}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-700"
                  >
                    <Pencil size={15} />
                    Edit Consultation
                  </button>
                  {patient?._id && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/patients/${patient._id}`)
                      }
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <UserRound size={15} />
                      Open Patient
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5 sm:grid-cols-4">
            <SummaryItem
              icon={Hash}
              label="Patient number"
              value={patient?.patientNumber || "Not assigned"}
            />
            <SummaryItem
              icon={CalendarDays}
              label="Visit date"
              value={formatDate(consultation.consultationDate)}
            />
            <SummaryItem
              icon={UserRound}
              label="Clinician"
              value={
                consultation.optometristId
                  ? `${consultation.optometristId.firstName || ""} ${consultation.optometristId.lastName || ""}`.trim() || "Clinical team"
                  : "Clinical team"
              }
            />
            <SummaryItem
              icon={Clock3}
              label="Last updated"
              value={formatDateTime(consultation.updatedAt || consultation.createdAt)}
            />
          </div>
        </div>
      </div>

      {(saveError || saveSuccess) && (
        <div className="mx-auto max-w-[1800px] px-3 pt-3 sm:px-5 lg:px-6">
          {saveError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <Check size={15} />
              {saveSuccess}
            </div>
          )}
        </div>
      )}

      {/* RECORD WORKSPACE */}
      <div className="mx-auto max-w-[1800px] px-3 py-3 sm:px-4 lg:px-5">
        <nav
          aria-label="Consultation sections"
          className="mb-3 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.025)]"
        >
          <div className="flex gap-1 overflow-x-auto">
            {sectionNavItems.map((item) => {
              const Icon = item.icon;
              const id = sectionIdFromTitle(item.title);
              const active = activeSection === id;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigateToSection(item.title)}
                  className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-[10px] font-bold transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                  aria-current={active ? "location" : undefined}
                >
                  <Icon size={12} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-2.5">
          {isEditing ? (
            <>
              <ConsultationEditor
                data={editData || {}}
                onChange={handleEditChange}
              />
              <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur">
                <div className="text-[10px] font-medium text-slate-500">
                  {editDirty ? "You have unsaved changes" : "No unsaved changes"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={saving || !editDirty}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </>
          ) : (
          <>
        {/* BASIC */}
        <Section
          title="Consultation Information"
          icon={ClipboardList}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Consultation Date"
              value={formatDateTime(
                consultation.consultationDate,
              )}
            />

            <Field
              label="Consultation Type"
              value={typeLabel(
                consultation.consultationType,
              )}
            />

            <Field
              label="Optometrist / Doctor"
              value={
                consultation.optometristId
                  ? `${consultation.optometristId.firstName || ""} ${
                      consultation.optometristId.lastName || ""
                    }`.trim()
                  : "—"
              }
            />

            <Field
              label="Status"
              value={statusLabel(consultation.status)}
            />

            <Field
              label="Reason for Visit"
              value={consultation.reasonForVisit}
            />

            <Field
              label="Symptoms"
              value={consultation.symptoms}
            />

            <Field
              label="Medical History"
              value={consultation.medicalHistory}
            />

            <Field
              label="Ocular History"
              value={consultation.ocularHistory}
            />
          </div>
        </Section>

        {/* VISUAL ACUITY */}
        {consultation.visualAcuity && (
          <Section
            title="Visual Acuity"
            icon={Eye}
          >
            <Field
              label="Visual Acuity"
              value={consultation.visualAcuity}
            />
          </Section>
        )}

        {/* REFRACTION */}
        <Section
          title="Refraction & Prescription"
          icon={Glasses}
        >
          <div className="space-y-3">
            <PrescriptionTable
              title="Previous Rx"
              prescription={consultation.previousRx}
            />

            <PrescriptionTable
              title="Objective Rx"
              prescription={consultation.objectiveRx}
            />

            <PrescriptionTable
              title="Subjective Rx"
              prescription={consultation.subjectiveRx}
            />

            <PrescriptionTable
              title="Final Rx"
              prescription={consultation.finalRx}
            />

            <PrescriptionTable
              title="Given Rx"
              prescription={consultation.givenRx}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="PD"
                value={consultation.pd}
              />

              <Field
                label="Refraction Notes"
                value={
                  consultation.refractionNotes
                }
              />
            </div>
          </div>
        </Section>

        {/* BINOCULAR */}
        {consultation.binocularVision && (
          <Section
            title="Binocular Vision"
            icon={Eye}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(
                consultation.binocularVision,
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* TESTS */}
        <Section
          title="Clinical Management & Tests"
          icon={Stethoscope}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              label="Slit Lamp"
              value={consultation.slitLamp}
            />

            <Field
              label="Fundus"
              value={consultation.fundus}
            />

            <Field
              label="Ophthalmoscopy"
              value={
                consultation.ophthalmoscopy
              }
            />

            <Field
              label="Biomicroscopy"
              value={
                consultation.biomicroscopy
              }
            />

            <Field
              label="Visual Field"
              value={
                consultation.visualField
              }
            />

            <Field
              label="Colour Vision"
              value={
                consultation.colourVision
              }
            />

            <Field
              label="Other Tests"
              value={consultation.otherTests}
            />

            <Field
              label="Diagnosis"
              value={consultation.diagnosis}
            />

            <Field
              label="Advice"
              value={consultation.advice}
            />

            <Field
              label="Therapeutics"
              value={
                consultation.therapeutics
              }
            />
          </div>
        </Section>

        {/* LOW VISION */}
        {consultation.lowVision && (
          <Section
            title="Low Vision Management"
            icon={Eye}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(
                consultation.lowVision,
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* CONTACT LENS */}
        {(consultation.contactLens ||
          consultation.contactLenses) && (
          <Section
            title="Contact Lens Management"
            icon={Eye}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(
                consultation.contactLens ||
                  consultation.contactLenses ||
                  {},
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* DISPENSING */}
        {consultation.dispensing && (
          <Section
            title="Dispensing"
            icon={Glasses}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(
                consultation.dispensing,
              ).map(([key, value]) => (
                <Field
                  key={key}
                  label={key}
                  value={value}
                />
              ))}
            </div>
          </Section>
        )}

        {/* NOTES */}
        <Section
          title="Clinical Notes & Instructions"
          icon={FileText}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              label="Clinical Notes"
              value={consultation.clinicalNotes}
            />

            <Field
              label="Patient Instructions"
              value={
                consultation.patientInstructions
              }
            />

            <Field
              label="Internal Notes"
              value={consultation.internalNotes}
            />

            <Field
              label="Notes"
              value={consultation.notes}
            />

            <Field
              label="Recall Due"
              value={formatDate(
                consultation.recallDue ||
                  consultation.recall?.due,
              )}
            />

            <Field
              label="Recall Letter"
              value={
                consultation.recallLetter ||
                consultation.recall?.message
              }
            />
          </div>
        </Section>

        {/* FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs text-slate-400">
            Created:{" "}
            {formatDateTime(
              consultation.createdAt,
            )}
          </div>

          <div className="text-xs text-slate-400">
            Updated:{" "}
            {formatDateTime(
              consultation.updatedAt,
            )}
          </div>
        </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}