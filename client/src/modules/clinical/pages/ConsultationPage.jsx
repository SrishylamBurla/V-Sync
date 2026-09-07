// import { useEffect, useMemo, useState } from "react";
// import {
//   ArrowLeft,
//   CalendarDays,
//   Check,
//   ChevronDown,
//   ClipboardPlus,
//   Eye,
//   FileText,
//   Glasses,
//   HeartPulse,
//   History,
//   Loader2,
//   Plus,
//   Save,
//   Search,
//   Stethoscope,
//   Trash2,
//   UserRound,
//   X,
// } from "lucide-react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// import { getPatient } from "../../patients/patient.api";
// import {
//   createConsultation,
//   getPatientConsultations,
// } from "../consultation.api";

// /* =========================================================
//    HELPERS
// ========================================================= */

// const fullName = (patient) =>
//   [
//     patient?.firstName,
//     patient?.middleName,
//     patient?.lastName,
//   ]
//     .filter(Boolean)
//     .join(" ");

// const formatDate = (value) => {
//   if (!value) return "—";

//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) return "—";

//   return parsed.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const dateInputValue = (value = new Date()) => {
//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) return "";
//   const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
//   return local.toISOString().slice(0, 10);
// };

// const calculateAge = (dateOfBirth) => {
//   if (!dateOfBirth) return null;

//   const birth = new Date(dateOfBirth);
//   if (Number.isNaN(birth.getTime())) return null;

//   const today = new Date();
//   let age = today.getFullYear() - birth.getFullYear();
//   const monthDifference = today.getMonth() - birth.getMonth();

//   if (
//     monthDifference < 0 ||
//     (monthDifference === 0 && today.getDate() < birth.getDate())
//   ) {
//     age--;
//   }

//   return age >= 0 ? age : null;
// };

// const emptyEye = () => ({
//   sphere: "",
//   cylinder: "",
//   axis: "",
//   add: "",
//   inter: "",
//   hPrism: "",
//   vPrism: "",
//   va: "",
//   nearVa: "",
// });

// const emptySlitLampEye = () => ({
//   lids: "",
//   conjunctiva: "",
//   cornea: "",
//   anteriorChamber: "",
//   iris: "",
//   lens: "",
//   other: "",
// });

// const emptyFundusEye = () => ({
//   disc: "",
//   cdRatio: "",
//   macula: "",
//   vessels: "",
//   retina: "",
//   other: "",
// });

// const emptyDispensingLens = (eye) => ({
//   eye,
//   lensCode: "",
//   lensDescription: "",
//   lensSize: "",
//   segSize: "",
//   segHeight: "",
//   ocHeight: "",
//   horizontalDecentration: "",
//   verticalDecentration: "",
//   baseCurve: "",
//   lensSupplier: "",
//   supplierOrderDate: "",
//   lensPrice: "",
// });

// const consultationTypes = [
//   {
//     value: "comprehensive",
//     label: "Comprehensive",
//     description:
//       "Full eye examination with history, refraction, ocular examination, diagnosis and advice.",
//     icon: Eye,
//   },
//   {
//     value: "short_consult",
//     label: "Short Consult",
//     description:
//       "Quick focused consultation with an open clinical box and refraction slots.",
//     icon: ClipboardPlus,
//   },
// ];

// const specializedTypes = [
//   {
//     value: "contact_lenses",
//     label: "Contact Lenses",
//     shortLabel: "CL",
//     icon: Glasses,
//     description: "Contact lens assessment and fitting.",
//   },
//   {
//     value: "binocular_vision",
//     label: "Binocular Vision",
//     shortLabel: "BV",
//     icon: Eye,
//     description: "Binocular vision and accommodation assessment.",
//   },
//   {
//     value: "low_vision",
//     label: "Low Vision",
//     shortLabel: "LV",
//     icon: Eye,
//     description: "Low vision assessment and management.",
//   },
// ];

// const testTypes = [
//   "Visual Field",
//   "Colour Vision",
//   "Pupillary Reflex",
//   "Contrast Sensitivity",
//   "Amsler Grid",
//   "Schirmer Test",
//   "TBUT",
//   "Keratometry",
//   "OCT",
//   "Tonometry",
//   "Other",
// ];

// const adviceOptions = [
//   ["distanceWork", "Distance work"],
//   ["nearWork", "Near work"],
//   ["screenBreaks", "20-20-20 screen breaks"],
//   ["hygiene", "Eye hygiene"],
//   ["sunProtection", "UV protection"],
//   ["followUp", "Follow-up advised"],
//   ["spectacleWear", "Spectacle wear"],
//   ["contactLensCare", "Contact lens care"],
// ];

// const initialForm = {
//   consultationType: "comprehensive",
//   consultationDate: dateInputValue(),

//   symptoms: "",
//   ocularHistory: "",
//   systemicHistory: "",
//   familyHistory: "",
//   allergies: "",
//   medications: "",

//   visualAcuity: {
//     right: {
//       unaidedDistance: "",
//       aidedDistance: "",
//       pinhole: "",
//       near: "",
//     },
//     left: {
//       unaidedDistance: "",
//       aidedDistance: "",
//       pinhole: "",
//       near: "",
//     },
//   },

//   refraction: {
//     previous: {
//       right: emptyEye(),
//       left: emptyEye(),
//     },
//     objective: {
//       right: emptyEye(),
//       left: emptyEye(),
//     },
//     subjective: {
//       right: emptyEye(),
//       left: emptyEye(),
//     },
//     final: {
//       right: emptyEye(),
//       left: emptyEye(),
//     },
//     pd: {
//       right: "",
//       left: "",
//       total: "",
//     },
//   },

//   binocularVision: {
//     coverTestDistance: "",
//     coverTestNear: "",
//     npc: "",
//     worthFourDot: "",
//     stereopsis: "",
//     vergenceBI: "",
//     vergenceBO: "",
//     accommodation: "",
//     findings: "",
//   },

//   lowVision: {
//     distanceVA: "",
//     nearVA: "",
//     contrast: "",
//     visualField: "",
//     magnification: "",
//     assistiveDevice: "",
//     advice: "",
//   },

//   contactLenses: {
//     lensType: "",
//     brand: "",
//     baseCurve: "",
//     diameter: "",
//     rightPower: "",
//     leftPower: "",
//     replacement: "",
//     wearSchedule: "",
//     solution: "",
//     advice: "",
//   },

//   additionalTests: [],

//   slitLamp: {
//     right: emptySlitLampEye(),
//     left: emptySlitLampEye(),
//   },

//   fundus: {
//     right: emptyFundusEye(),
//     left: emptyFundusEye(),
//   },

//   diagnosis: [],

//   advice: {
//     distanceWork: false,
//     nearWork: false,
//     screenBreaks: false,
//     hygiene: false,
//     sunProtection: false,
//     followUp: false,
//     spectacleWear: false,
//     contactLensCare: false,
//     custom: "",
//   },

//   dispensing: {
//     spectacleRequired: false,
//     frameCode: "",
//     frameDescription: "",
//     frameSize: "",
//     depth: "",
//     ed: "",
//     frameType: "",
//     other: "",
//     fitting: "",
//     toReorder: "",
//     frameDiscount: "",
//     overallDiscount: "",
//     gst: "",
//     billNo: "",
//     lensRows: [
//       emptyDispensingLens("R"),
//       emptyDispensingLens("L"),
//     ],
//   },

//   therapeutics: [
//     {
//       medication: "",
//       dosage: "",
//       frequency: "",
//       duration: "",
//       instructions: "",
//     },
//   ],

//   recall: {
//     enabled: false,
//     date: "",
//     type: "Routine Review",
//     message: "",
//   },

//   shortConsult: {
//     openBox: "",
//   },
// };

// export default function ConsultationPage() {
//   const { patientId: routePatientId } = useParams();
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();

//   // Supports:
//   // /patients/:patientId/consultations/new
//   // /consultations/new?patientId=...
//   const patientId = routePatientId || searchParams.get("patientId") || "";

//   const [patient, setPatient] = useState(null);
//   const [previousConsultations, setPreviousConsultations] = useState([]);
//   const [loadingPatient, setLoadingPatient] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [consultationStarted, setConsultationStarted] = useState(false);
//   const [showTypeSelector, setShowTypeSelector] = useState(true);
//   const [dirty, setDirty] = useState(false);
//   const [draftSaved, setDraftSaved] = useState(false);

//   const [form, setForm] = useState(initialForm);

//   const [addonModal, setAddonModal] = useState(null);
//   const [billingMessage, setBillingMessage] = useState("");

//   useEffect(() => {
//     let mounted = true;

//     const loadPatient = async () => {
//       if (!patientId) {
//         setError("No patient was selected.");
//         setLoadingPatient(false);
//         return;
//       }

//       try {
//         setLoadingPatient(true);
//         setError("");

//         const response = await getPatient(patientId);
//         const patientData =
//           response?.data?.patient ||
//           response?.data ||
//           response?.patient ||
//           null;

//         if (!patientData) {
//           throw new Error("Patient record not found.");
//         }

//         if (!mounted) return;

//         setPatient(patientData);

//         try {
//           const consultationsResponse =
//             await getPatientConsultations(patientId);

//           const rows = Array.isArray(consultationsResponse?.data)
//             ? consultationsResponse.data
//             : Array.isArray(consultationsResponse?.data?.consultations)
//               ? consultationsResponse.data.consultations
//               : [];

//           if (mounted) setPreviousConsultations(rows);
//         } catch {
//           if (mounted) setPreviousConsultations([]);
//         }
//       } catch (err) {
//         if (!mounted) return;

//         setError(
//           err?.response?.data?.message ||
//             err?.message ||
//             "Unable to load patient record."
//         );
//       } finally {
//         if (mounted) setLoadingPatient(false);
//       }
//     };

//     loadPatient();

//     return () => {
//       mounted = false;
//     };
//   }, [patientId]);

//   useEffect(() => {
//     const handleBeforeUnload = (event) => {
//       if (!dirty || saving) return;
//       event.preventDefault();
//       event.returnValue = "";
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [dirty, saving]);

//   const age = useMemo(
//     () => calculateAge(patient?.dateOfBirth),
//     [patient?.dateOfBirth]
//   );

//   const selectedType = useMemo(
//     () =>
//       consultationTypes.find(
//         (item) => item.value === form.consultationType
//       ) || consultationTypes[0],
//     [form.consultationType]
//   );

//   const isComprehensive = form.consultationType === "comprehensive";
//   const isShortConsult = form.consultationType === "short_consult";

//   const lensTotal = useMemo(() => {
//     return form.dispensing.lensRows.reduce(
//       (sum, row) => sum + (Number(row.lensPrice) || 0),
//       0
//     );
//   }, [form.dispensing.lensRows]);

//   const frameValue = Number(form.dispensing.toReorder) || 0;
//   const frameDiscount = Number(form.dispensing.frameDiscount) || 0;
//   const overallDiscount = Number(form.dispensing.overallDiscount) || 0;
//   const grandTotal = Math.max(
//     0,
//     frameValue + lensTotal - frameDiscount - overallDiscount
//   );

//   const updateForm = (key, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       [key]: value,
//     }));
//   };

//   const updateNested = (section, key, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       [section]: {
//         ...current[section],
//         [key]: value,
//       },
//     }));
//   };

//   const updateDeep = (section, subsection, key, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       [section]: {
//         ...current[section],
//         [subsection]: {
//           ...current[section][subsection],
//           [key]: value,
//         },
//       },
//     }));
//   };

//   const updateEyeField = (section, eye, field, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       [section]: {
//         ...current[section],
//         [eye]: {
//           ...current[section][eye],
//           [field]: value,
//         },
//       },
//     }));
//   };

//   const updateRefractionField = (
//     prescriptionType,
//     eye,
//     field,
//     value
//   ) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       refraction: {
//         ...current.refraction,
//         [prescriptionType]: {
//           ...current.refraction[prescriptionType],
//           [eye]: {
//             ...current.refraction[prescriptionType][eye],
//             [field]: value,
//           },
//         },
//       },
//     }));
//   };

//   const startConsultation = (type) => {
//     setForm((current) => ({
//       ...current,
//       consultationType: type,
//     }));

//     setConsultationStarted(true);
//     setShowTypeSelector(false);
//     setError("");
//     setDirty(false);
//   };

//   const changeConsultationType = () => {
//     setShowTypeSelector(true);
//   };

//   const addTest = () => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       additionalTests: [
//         ...current.additionalTests,
//         {
//           name: "Visual Field",
//           result: "",
//           remarks: "",
//         },
//       ],
//     }));
//   };

//   const updateTest = (index, field, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       additionalTests: current.additionalTests.map((test, testIndex) =>
//         testIndex === index
//           ? {
//               ...test,
//               [field]: value,
//             }
//           : test
//       ),
//     }));
//   };

//   const removeTest = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       additionalTests: current.additionalTests.filter(
//         (_, testIndex) => testIndex !== index
//       ),
//     }));
//   };

//   const addDiagnosis = () => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       diagnosis: [
//         ...current.diagnosis,
//         {
//           condition: "",
//           eye: "OU",
//           notes: "",
//         },
//       ],
//     }));
//   };

//   const updateDiagnosis = (index, field, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       diagnosis: current.diagnosis.map((item, diagnosisIndex) =>
//         diagnosisIndex === index
//           ? {
//               ...item,
//               [field]: value,
//             }
//           : item
//       ),
//     }));
//   };

//   const removeDiagnosis = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       diagnosis: current.diagnosis.filter(
//         (_, diagnosisIndex) => diagnosisIndex !== index
//       ),
//     }));
//   };

//   const addTherapeutic = () => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       therapeutics: [
//         ...current.therapeutics,
//         {
//           medication: "",
//           dosage: "",
//           frequency: "",
//           duration: "",
//           instructions: "",
//         },
//       ],
//     }));
//   };

//   const updateTherapeutic = (index, field, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       therapeutics: current.therapeutics.map((item, itemIndex) =>
//         itemIndex === index
//           ? { ...item, [field]: value }
//           : item
//       ),
//     }));
//   };

//   const removeTherapeutic = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       therapeutics:
//         current.therapeutics.length > 1
//           ? current.therapeutics.filter(
//               (_, itemIndex) => itemIndex !== index
//             )
//           : current.therapeutics,
//     }));
//   };

//   const updateDispensingLens = (index, field, value) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       dispensing: {
//         ...current.dispensing,
//         lensRows: current.dispensing.lensRows.map((row, rowIndex) =>
//           rowIndex === index
//             ? { ...row, [field]: value }
//             : row
//         ),
//       },
//     }));
//   };

//   const addDispensingLens = () => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       dispensing: {
//         ...current.dispensing,
//         lensRows: [
//           ...current.dispensing.lensRows,
//           emptyDispensingLens(
//             current.dispensing.lensRows.length % 2 === 0 ? "R" : "L"
//           ),
//         ],
//       },
//     }));
//   };

//   const removeDispensingLens = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       dispensing: {
//         ...current.dispensing,
//         lensRows:
//           current.dispensing.lensRows.length > 1
//             ? current.dispensing.lensRows.filter(
//                 (_, rowIndex) => rowIndex !== index
//               )
//             : current.dispensing.lensRows,
//       },
//     }));
//   };

//   const updateAddon = (section, key, value) => {
//     updateNested(section, key, value);
//   };

//   const handleSaveDraft = () => {
//     try {
//       localStorage.setItem(
//         `opticare-consultation-draft-${patientId}`,
//         JSON.stringify(form)
//       );
//       setDraftSaved(true);
//       setDirty(false);
//       setSuccess("Draft saved on this device.");
//       setTimeout(() => setSuccess(""), 2200);
//     } catch {
//       setError("Unable to save draft on this device.");
//     }
//   };

//   const handleCreateBill = () => {
//     setBillingMessage(
//       `Bill prepared for ₹${grandTotal.toFixed(2)}. Connect this button to your billing API when billing is enabled.`
//     );
//     setTimeout(() => setBillingMessage(""), 3500);
//   };

//   const handleSave = async (event) => {
//     event.preventDefault();

//     if (!patientId) {
//       setError("Patient is required.");
//       return;
//     }

//     if (!consultationStarted) {
//       setError("Please select a consultation type.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");
//       setSuccess("");

//       const slitLampText = formatSlitLamp(form.slitLamp);
//       const fundusText = formatFundus(form.fundus);

//       const diagnosisText = form.diagnosis
//         .map(
//           (item) =>
//             `${item.condition || ""}${
//               item.eye ? ` (${item.eye})` : ""
//             }${item.notes ? ` - ${item.notes}` : ""}`
//         )
//         .filter(Boolean)
//         .join("\n");

//       const adviceText = [
//         ...adviceOptions
//           .filter(([key]) => form.advice[key])
//           .map(([, label]) => label),
//         form.advice.custom,
//       ]
//         .filter(Boolean)
//         .join("\n");

//       const therapeuticText = form.therapeutics
//         .map((item) =>
//           [
//             item.medication,
//             item.dosage,
//             item.frequency,
//             item.duration,
//             item.instructions,
//           ]
//             .filter(Boolean)
//             .join(" | ")
//         )
//         .filter(Boolean)
//         .join("\n");

//       const payload = {
//         patientId,
//         consultationDate: form.consultationDate
//           ? new Date(`${form.consultationDate}T00:00:00`).toISOString()
//           : new Date().toISOString(),

//         consultationType: form.consultationType,

//         symptoms:
//           isShortConsult && form.shortConsult.openBox
//             ? form.shortConsult.openBox
//             : form.symptoms,

//         medication:
//           therapeuticText || form.medications || "",

//         allergy: form.allergies,

//         pupils:
//           form.additionalTests
//             .filter((test) => test.name === "Pupillary Reflex")
//             .map((test) => test.result)
//             .filter(Boolean)
//             .join("\n") || "",

//         ophthalmoscopy: fundusText,
//         biomicroscopy: slitLampText,

//         visualField: form.additionalTests
//           .filter((test) => test.name === "Visual Field")
//           .map((test) => test.result)
//           .filter(Boolean)
//           .join("\n"),

//         colourVision: form.additionalTests
//           .filter((test) => test.name === "Colour Vision")
//           .map((test) => test.result)
//           .filter(Boolean)
//           .join("\n"),

//         otherTests: form.additionalTests.filter(
//           (test) =>
//             !["Visual Field", "Colour Vision"].includes(test.name)
//         ),

//         previousRx: {
//           right: form.refraction.previous.right,
//           left: form.refraction.previous.left,
//           note: "",
//         },

//         subjectiveRx: {
//           right: form.refraction.subjective.right,
//           left: form.refraction.subjective.left,
//           note: "",
//         },

//         givenRx: {
//           right: form.refraction.final.right,
//           left: form.refraction.final.left,
//           note: "",
//         },

//         pd: form.refraction.pd,

//         recallDue: form.recall.enabled
//           ? form.recall.date || null
//           : null,

//         recallLetter: form.recall.type || "",

//         notes: [
//           form.ocularHistory
//             ? `Ocular history: ${form.ocularHistory}`
//             : "",
//           form.systemicHistory
//             ? `Systemic history: ${form.systemicHistory}`
//             : "",
//           form.familyHistory
//             ? `Family history: ${form.familyHistory}`
//             : "",
//           diagnosisText ? `Diagnosis:\n${diagnosisText}` : "",
//           adviceText ? `Advice:\n${adviceText}` : "",
//         ]
//           .filter(Boolean)
//           .join("\n\n"),

//         visualAcuity: form.visualAcuity,
//         refraction: form.refraction,
//         binocularVision: form.binocularVision,
//         lowVision: form.lowVision,
//         contactLenses: form.contactLenses,
//         slitLamp: form.slitLamp,
//         fundus: form.fundus,
//         diagnosis: form.diagnosis,
//         advice: form.advice,
//         prescription: {
//           type:
//             form.dispensing.spectacleRequired
//               ? "spectacle"
//               : "none",
//           note: "",
//         },
//         dispensing: form.dispensing,
//         therapeutics: form.therapeutics,
//         recall: form.recall,
//       };

//       const response = await createConsultation(payload);

//       if (!response) {
//         throw new Error("Consultation could not be saved.");
//       }

//       try {
//         localStorage.removeItem(
//           `opticare-consultation-draft-${patientId}`
//         );
//       } catch {
//         // Ignore local draft cleanup failures.
//       }

//       setDirty(false);
//       setSuccess("Consultation saved successfully.");

//       setTimeout(() => {
//         navigate(`/patients/${patientId}`);
//       }, 900);
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to save consultation."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const safeNavigateBack = () => {
//     if (dirty && !saving) {
//       const confirmed = window.confirm(
//         "You have unsaved changes. Leave this consultation?"
//       );
//       if (!confirmed) return;
//     }

//     navigate(`/patients/${patientId}`);
//   };

//   if (loadingPatient) {
//     return (
//       <div className="flex min-h-[65vh] items-center justify-center bg-slate-50">
//         <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-sm">
//           <Loader2 size={18} className="animate-spin text-blue-600" />
//           Loading patient record...
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
//     <div className="min-h-screen bg-[#f4f8fc] text-slate-800">
//       <div className="mx-auto w-full max-w-[1600px]">
//         {/* =====================================================
//             TOP TOOLBAR
//         ====================================================== */}
//         <div className="sticky top-0 z-40 border-b border-slate-200 bg-[#f8fbff]/95 backdrop-blur">
//           <div className="flex min-h-[58px] items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-7">
//             <div className="flex min-w-0 items-center gap-3">
//               <button
//                 type="button"
//                 onClick={safeNavigateBack}
//                 className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
//                 title="Back to patient"
//               >
//                 <ArrowLeft size={16} />
//               </button>

//               <div className="min-w-0">
//                 <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
//                   Clinical workspace
//                 </div>
//                 <h1 className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">
//                   New Consultation
//                 </h1>
//               </div>
//             </div>

//             <div className="flex shrink-0 items-center gap-2">
//               {dirty && consultationStarted && (
//                 <span className="hidden items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-semibold text-amber-700 md:inline-flex">
//                   <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
//                   Unsaved
//                 </span>
//               )}

//               <button
//                 type="button"
//                 onClick={handleSaveDraft}
//                 disabled={!consultationStarted || saving}
//                 className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 <Save size={14} />
//                 <span className="hidden sm:inline">
//                   {draftSaved ? "Draft Saved" : "Save Draft"}
//                 </span>
//               </button>

//               <button
//                 type="submit"
//                 form="consultation-form"
//                 disabled={!consultationStarted || saving}
//                 className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
//               >
//                 {saving ? (
//                   <Loader2 size={14} className="animate-spin" />
//                 ) : (
//                   <Save size={14} />
//                 )}
//                 <span className="hidden sm:inline">
//                   {saving ? "Saving..." : "Save Consultation"}
//                 </span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* =====================================================
//             ALERTS
//         ====================================================== */}
//         {(error || success || billingMessage) && (
//           <div className="px-3 pt-3 sm:px-5 lg:px-7">
//             {error && (
//               <div className="flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
//                 <span>{error}</span>
//                 <button
//                   type="button"
//                   onClick={() => setError("")}
//                   className="text-red-400 hover:text-red-700"
//                 >
//                   <X size={14} />
//                 </button>
//               </div>
//             )}

//             {success && (
//               <div className="mt-2 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
//                 <Check size={14} />
//                 {success}
//               </div>
//             )}

//             {billingMessage && (
//               <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700">
//                 {billingMessage}
//               </div>
//             )}
//           </div>
//         )}

//         {/* =====================================================
//             PATIENT HEADER
//         ====================================================== */}
//         <PatientHeader
//           patient={patient}
//           age={age}
//           previousConsultations={previousConsultations}
//         />

//         {/* =====================================================
//             CONSULTATION TYPE MODAL
//         ====================================================== */}
//         {showTypeSelector && (
//           <ConsultationTypeModal
//             currentType={form.consultationType}
//             onSelect={startConsultation}
//             onClose={() => {
//               if (consultationStarted) {
//                 setShowTypeSelector(false);
//               }
//             }}
//             canClose={consultationStarted}
//           />
//         )}

//         {/* =====================================================
//             MAIN CONSULTATION
//         ====================================================== */}
//         {consultationStarted && (
//           <form
//             id="consultation-form"
//             onSubmit={handleSave}
//             className="px-3 pb-28 pt-3 sm:px-5 lg:px-7"
//           >
//             {/* =================================================
//                 VISIT CONTROL STRIP
//             ================================================== */}
//             <div className="mb-3 rounded-md border border-slate-200 bg-white shadow-sm">
//               <div className="grid items-center gap-0 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
//                 <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
//                   <div className="mb-1 text-[9px] font-bold text-slate-500">
//                     Consultation Type <span className="text-red-500">*</span>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={changeConsultationType}
//                     className="inline-flex h-8 items-center gap-2 rounded border border-blue-300 bg-blue-50 px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
//                   >
//                     <Check size={13} />
//                     {selectedType.label}
//                     <ChevronDown size={13} />
//                   </button>
//                 </div>

//                 <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
//                   <div className="flex items-center justify-between gap-2">
//                     <div className="text-[9px] font-bold text-slate-500">
//                       Recall
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         updateNested(
//                           "recall",
//                           "enabled",
//                           !form.recall.enabled
//                         )
//                       }
//                       className={`rounded px-2 py-1 text-[9px] font-bold ${
//                         form.recall.enabled
//                           ? "bg-blue-50 text-blue-700"
//                           : "border border-slate-200 bg-white text-slate-500"
//                       }`}
//                     >
//                       {form.recall.enabled ? "Enabled" : "Add Recall"}
//                     </button>
//                   </div>

//                   {form.recall.enabled && (
//                     <div className="mt-1.5 flex items-center gap-2">
//                       <div className="relative min-w-0 flex-1">
//                         <CalendarDays
//                           size={13}
//                           className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
//                         />
//                         <input
//                           type="date"
//                           value={form.recall.date}
//                           onChange={(event) =>
//                             updateNested(
//                               "recall",
//                               "date",
//                               event.target.value
//                             )
//                           }
//                           className="h-8 w-full rounded border border-slate-200 bg-white pl-8 pr-2 text-[10px] outline-none focus:border-blue-400"
//                         />
//                       </div>

//                       <select
//                         value={form.recall.type}
//                         onChange={(event) =>
//                           updateNested(
//                             "recall",
//                             "type",
//                             event.target.value
//                           )
//                         }
//                         className="h-8 min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 text-[10px] outline-none focus:border-blue-400"
//                       >
//                         <option>Routine Review</option>
//                         <option>Prescription Review</option>
//                         <option>Contact Lens Review</option>
//                         <option>Clinical Follow-up</option>
//                         <option>Other</option>
//                       </select>
//                     </div>
//                   )}
//                 </div>

//                 <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
//                   <Input
//                     label="Consult Date"
//                     type="date"
//                     value={form.consultationDate}
//                     onChange={(value) =>
//                       updateForm("consultationDate", value)
//                     }
//                   />
//                 </div>

//                 <div className="px-3 py-2.5">
//                   <div className="mb-1 text-[9px] font-bold text-slate-500">
//                     Optometrist
//                   </div>
//                   <div className="flex h-8 items-center justify-between rounded border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-semibold text-slate-700">
//                     <span>
//                       {patient?.assignedOptometristName ||
//                         patient?.lastOptometristName ||
//                         "Current clinician"}
//                     </span>
//                     <ChevronDown size={13} className="text-slate-400" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* =================================================
//                 SHORT CONSULT
//             ================================================== */}
//             {isShortConsult ? (
//               <div className="grid gap-3 lg:grid-cols-2">
//                 <ClinicalPanel
//                   number="01"
//                   title="Open Box"
//                   icon={FileText}
//                 >
//                   <TextArea
//                     label="Clinical entry"
//                     value={form.shortConsult.openBox}
//                     onChange={(value) =>
//                       updateNested(
//                         "shortConsult",
//                         "openBox",
//                         value
//                       )
//                     }
//                     rows={14}
//                     placeholder="Enter the consultation findings, complaint, clinical comments or focused assessment..."
//                   />
//                 </ClinicalPanel>

//                 <ClinicalPanel
//                   number="02"
//                   title="Refraction"
//                   icon={Glasses}
//                 >
//                   <RefractionTable
//                     title="Refraction"
//                     data={form.refraction.final}
//                     onChange={(eye, field, value) =>
//                       updateRefractionField(
//                         "final",
//                         eye,
//                         field,
//                         value
//                       )
//                     }
//                   />

//                   <div className="mt-3 grid gap-2 sm:grid-cols-3">
//                     <Input
//                       label="PD Right"
//                       value={form.refraction.pd.right}
//                       onChange={(value) =>
//                         updateDeep(
//                           "refraction",
//                           "pd",
//                           "right",
//                           value
//                         )
//                       }
//                     />
//                     <Input
//                       label="PD Left"
//                       value={form.refraction.pd.left}
//                       onChange={(value) =>
//                         updateDeep(
//                           "refraction",
//                           "pd",
//                           "left",
//                           value
//                         )
//                       }
//                     />
//                     <Input
//                       label="PD Total"
//                       value={form.refraction.pd.total}
//                       onChange={(value) =>
//                         updateDeep(
//                           "refraction",
//                           "pd",
//                           "total",
//                           value
//                         )
//                       }
//                     />
//                   </div>
//                 </ClinicalPanel>
//               </div>
//             ) : (
//               <>
//                 {/* =================================================
//                     ROW 1
//                 ================================================== */}
//                 <div className="grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="01"
//                     title="Symptoms & History"
//                     icon={History}
//                   >
//                     <TextArea
//                       label="Presenting Symptoms"
//                       value={form.symptoms}
//                       onChange={(value) =>
//                         updateForm("symptoms", value)
//                       }
//                       rows={3}
//                       placeholder="Enter presenting symptoms..."
//                     />

//                     <div className="mt-3 grid gap-2 md:grid-cols-2">
//                       <TextArea
//                         label="Ocular History"
//                         value={form.ocularHistory}
//                         onChange={(value) =>
//                           updateForm("ocularHistory", value)
//                         }
//                         rows={3}
//                         placeholder="Enter ocular history..."
//                       />

//                       <TextArea
//                         label="Systemic History"
//                         value={form.systemicHistory}
//                         onChange={(value) =>
//                           updateForm("systemicHistory", value)
//                         }
//                         rows={3}
//                         placeholder="Enter systemic history..."
//                       />

//                       <TextArea
//                         label="Allergies"
//                         value={form.allergies}
//                         onChange={(value) =>
//                           updateForm("allergies", value)
//                         }
//                         rows={3}
//                         placeholder="Enter allergies..."
//                       />

//                       <TextArea
//                         label="Current Medications"
//                         value={form.medications}
//                         onChange={(value) =>
//                           updateForm("medications", value)
//                         }
//                         rows={3}
//                         placeholder="Enter medications..."
//                       />
//                     </div>
//                   </ClinicalPanel>

//                   <ClinicalPanel
//                     number="05"
//                     title="Slit Lamp Examination"
//                     icon={Eye}
//                   >
//                     <SlitLampTable
//                       data={form.slitLamp}
//                       onChange={(eye, field, value) =>
//                         updateEyeField(
//                           "slitLamp",
//                           eye,
//                           field,
//                           value
//                         )
//                       }
//                     />
//                   </ClinicalPanel>
//                 </div>

//                 {/* =================================================
//                     ROW 2
//                 ================================================== */}
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="02"
//                     title="Refraction"
//                     icon={Glasses}
//                   >
//                     <RefractionTabs
//                       form={form}
//                       onChange={updateRefractionField}
//                       onPdChange={(side, value) =>
//                         updateNested("refraction", "pd", {
//                           ...form.refraction.pd,
//                           [side]: value,
//                         })
//                       }
//                     />
//                   </ClinicalPanel>

//                   <ClinicalPanel
//                     number="06"
//                     title="Fundus Examination"
//                     icon={Eye}
//                   >
//                     <FundusTable
//                       data={form.fundus}
//                       onChange={(eye, field, value) =>
//                         updateEyeField(
//                           "fundus",
//                           eye,
//                           field,
//                           value
//                         )
//                       }
//                     />
//                   </ClinicalPanel>
//                 </div>

//                 {/* =================================================
//                     ROW 3
//                 ================================================== */}
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="03"
//                     title="Ocular Motility (EOM)"
//                     icon={Eye}
//                   >
//                     <div className="grid gap-2 sm:grid-cols-2">
//                       <Input
//                         label="Cover Test — Distance"
//                         value={
//                           form.binocularVision.coverTestDistance
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "coverTestDistance",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="Cover Test — Near"
//                         value={
//                           form.binocularVision.coverTestNear
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "coverTestNear",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="NPC"
//                         value={form.binocularVision.npc}
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "npc",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="Worth 4 Dot"
//                         value={
//                           form.binocularVision.worthFourDot
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "worthFourDot",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="Stereopsis"
//                         value={
//                           form.binocularVision.stereopsis
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "stereopsis",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="Vergence BI"
//                         value={
//                           form.binocularVision.vergenceBI
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "vergenceBI",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="Vergence BO"
//                         value={
//                           form.binocularVision.vergenceBO
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "vergenceBO",
//                             value
//                           )
//                         }
//                       />
//                       <Input
//                         label="Accommodation"
//                         value={
//                           form.binocularVision.accommodation
//                         }
//                         onChange={(value) =>
//                           updateNested(
//                             "binocularVision",
//                             "accommodation",
//                             value
//                           )
//                         }
//                       />
//                     </div>
//                   </ClinicalPanel>

//                   <ClinicalPanel
//                     number="07"
//                     title="Diagnosis"
//                     icon={HeartPulse}
//                     action={
//                       <button
//                         type="button"
//                         onClick={addDiagnosis}
//                         className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
//                       >
//                         <Plus size={12} />
//                         Add
//                       </button>
//                     }
//                   >
//                     {form.diagnosis.length === 0 ? (
//                       <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] text-slate-400">
//                         No diagnosis added
//                       </div>
//                     ) : (
//                       <div className="space-y-2">
//                         {form.diagnosis.map((item, index) => (
//                           <div
//                             key={index}
//                             className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1fr_120px_1fr_30px]"
//                           >
//                             <Input
//                               label="Diagnosis"
//                               value={item.condition}
//                               onChange={(value) =>
//                                 updateDiagnosis(
//                                   index,
//                                   "condition",
//                                   value
//                                 )
//                               }
//                               placeholder="Search or enter diagnosis..."
//                             />
//                             <Select
//                               label="Laterality"
//                               value={item.eye}
//                               options={[
//                                 "OD",
//                                 "OS",
//                                 "OU",
//                                 "N/A",
//                               ]}
//                               onChange={(value) =>
//                                 updateDiagnosis(
//                                   index,
//                                   "eye",
//                                   value
//                                 )
//                               }
//                             />
//                             <Input
//                               label="Remarks"
//                               value={item.notes}
//                               onChange={(value) =>
//                                 updateDiagnosis(
//                                   index,
//                                   "notes",
//                                   value
//                                 )
//                               }
//                             />
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 removeDiagnosis(index)
//                               }
//                               className="mt-5 flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-white text-red-500 hover:bg-red-50"
//                             >
//                               <Trash2 size={13} />
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </ClinicalPanel>
//                 </div>

//                 {/* =================================================
//                     ROW 4
//                 ================================================== */}
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="04"
//                     title="Additional Tests"
//                     icon={Stethoscope}
//                     action={
//                       <button
//                         type="button"
//                         onClick={addTest}
//                         className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
//                       >
//                         <Plus size={12} />
//                         Add Test
//                       </button>
//                     }
//                   >
//                     {form.additionalTests.length === 0 ? (
//                       <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] text-slate-400">
//                         No additional tests
//                       </div>
//                     ) : (
//                       <div className="overflow-x-auto">
//                         <table className="w-full min-w-[650px] border-collapse text-[10px]">
//                           <thead>
//                             <tr className="bg-slate-50 text-left text-[9px] font-bold text-slate-500">
//                               <th className="border border-slate-200 px-2 py-2">
//                                 Test Type
//                               </th>
//                               <th className="border border-slate-200 px-2 py-2">
//                                 Result
//                               </th>
//                               <th className="border border-slate-200 px-2 py-2">
//                                 Remarks
//                               </th>
//                               <th className="w-10 border border-slate-200 px-2 py-2 text-center">
//                                 Action
//                               </th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {form.additionalTests.map(
//                               (test, index) => (
//                                 <tr key={index}>
//                                   <td className="border border-slate-200 p-1">
//                                     <select
//                                       value={test.name}
//                                       onChange={(event) =>
//                                         updateTest(
//                                           index,
//                                           "name",
//                                           event.target.value
//                                         )
//                                       }
//                                       className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[10px] outline-none focus:border-blue-400"
//                                     >
//                                       {testTypes.map((type) => (
//                                         <option
//                                           key={type}
//                                           value={type}
//                                         >
//                                           {type}
//                                         </option>
//                                       ))}
//                                     </select>
//                                   </td>
//                                   <td className="border border-slate-200 p-1">
//                                     <input
//                                       value={test.result || ""}
//                                       onChange={(event) =>
//                                         updateTest(
//                                           index,
//                                           "result",
//                                           event.target.value
//                                         )
//                                       }
//                                       className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
//                                     />
//                                   </td>
//                                   <td className="border border-slate-200 p-1">
//                                     <input
//                                       value={test.remarks || ""}
//                                       onChange={(event) =>
//                                         updateTest(
//                                           index,
//                                           "remarks",
//                                           event.target.value
//                                         )
//                                       }
//                                       className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
//                                     />
//                                   </td>
//                                   <td className="border border-slate-200 p-1 text-center">
//                                     <button
//                                       type="button"
//                                       onClick={() =>
//                                         removeTest(index)
//                                       }
//                                       className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
//                                     >
//                                       <Trash2 size={13} />
//                                     </button>
//                                   </td>
//                                 </tr>
//                               )
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     )}
//                   </ClinicalPanel>

//                   <ClinicalPanel
//                     number="08"
//                     title="Advise / Management Plan"
//                     icon={FileText}
//                   >
//                     <div className="grid gap-2 sm:grid-cols-2">
//                       {adviceOptions.map(([key, label]) => (
//                         <label
//                           key={key}
//                           className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2 text-[10px] font-medium ${
//                             form.advice[key]
//                               ? "border-blue-200 bg-blue-50 text-blue-700"
//                               : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                           }`}
//                         >
//                           <input
//                             type="checkbox"
//                             checked={form.advice[key]}
//                             onChange={(event) =>
//                               updateNested(
//                                 "advice",
//                                 key,
//                                 event.target.checked
//                               )
//                             }
//                             className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
//                           />
//                           {label}
//                         </label>
//                       ))}
//                     </div>

//                     <div className="mt-2">
//                       <TextArea
//                         label="Additional Advice"
//                         value={form.advice.custom}
//                         onChange={(value) =>
//                           updateNested(
//                             "advice",
//                             "custom",
//                             value
//                           )
//                         }
//                         rows={5}
//                         placeholder="Enter advice or management plan..."
//                       />
//                     </div>
//                   </ClinicalPanel>
//                 </div>
//               </>
//             )}

//             {/* =================================================
//                 DISPENSING
//             ================================================== */}
//             <div className="mt-3">
//               <DispensingPanel
//                 form={form}
//                 updateNested={updateNested}
//                 updateLens={updateDispensingLens}
//                 addLens={addDispensingLens}
//                 removeLens={removeDispensingLens}
//                 frameValue={frameValue}
//                 lensTotal={lensTotal}
//                 grandTotal={grandTotal}
//                 onCreateBill={handleCreateBill}
//               />
//             </div>

//             {/* =================================================
//                 THERAPEUTICS + RECALL
//             ================================================== */}
//             <div className="mt-3 grid gap-3 lg:grid-cols-2">
//               <ClinicalPanel
//                 number="10"
//                 title="Therapeutics"
//                 icon={HeartPulse}
//                 action={
//                   <button
//                     type="button"
//                     onClick={addTherapeutic}
//                     className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
//                   >
//                     <Plus size={12} />
//                     Add
//                   </button>
//                 }
//               >
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[650px] border-collapse text-[10px]">
//                     <thead>
//                       <tr className="bg-slate-50 text-left text-[9px] font-bold text-slate-500">
//                         <th className="border border-slate-200 px-2 py-2">
//                           Medication
//                         </th>
//                         <th className="border border-slate-200 px-2 py-2">
//                           Dosage
//                         </th>
//                         <th className="border border-slate-200 px-2 py-2">
//                           Frequency
//                         </th>
//                         <th className="border border-slate-200 px-2 py-2">
//                           Duration
//                         </th>
//                         <th className="border border-slate-200 px-2 py-2">
//                           Instructions
//                         </th>
//                         <th className="w-10 border border-slate-200 px-2 py-2" />
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {form.therapeutics.map((item, index) => (
//                         <tr key={index}>
//                           {[
//                             ["medication", "Medication"],
//                             ["dosage", "Dosage"],
//                             ["frequency", "Frequency"],
//                             ["duration", "Duration"],
//                             ["instructions", "Instructions"],
//                           ].map(([field, placeholder]) => (
//                             <td
//                               key={field}
//                               className="border border-slate-200 p-1"
//                             >
//                               <input
//                                 value={item[field] || ""}
//                                 placeholder={placeholder}
//                                 onChange={(event) =>
//                                   updateTherapeutic(
//                                     index,
//                                     field,
//                                     event.target.value
//                                   )
//                                 }
//                                 className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
//                               />
//                             </td>
//                           ))}

//                           <td className="border border-slate-200 p-1 text-center">
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 removeTherapeutic(index)
//                               }
//                               className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
//                             >
//                               <Trash2 size={13} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </ClinicalPanel>

//               <ClinicalPanel
//                 number="11"
//                 title="Recall"
//                 icon={CalendarDays}
//               >
//                 <div className="grid gap-2 sm:grid-cols-2">
//                   <Input
//                     label="Recall Date"
//                     type="date"
//                     value={form.recall.date}
//                     onChange={(value) =>
//                       updateNested(
//                         "recall",
//                         "date",
//                         value
//                       )
//                     }
//                   />

//                   <Select
//                     label="Recall Type"
//                     value={form.recall.type}
//                     options={[
//                       "Routine Review",
//                       "Prescription Review",
//                       "Contact Lens Review",
//                       "Clinical Follow-up",
//                       "Other",
//                     ]}
//                     onChange={(value) =>
//                       updateNested(
//                         "recall",
//                         "type",
//                         value
//                       )
//                     }
//                   />
//                 </div>

//                 <div className="mt-2">
//                   <TextArea
//                     label="Recall Letter / Message"
//                     value={form.recall.message}
//                     onChange={(value) =>
//                       updateNested(
//                         "recall",
//                         "message",
//                         value
//                       )
//                     }
//                     rows={4}
//                     placeholder="Recall instruction or patient message..."
//                   />
//                 </div>
//               </ClinicalPanel>
//             </div>

//             {/* =================================================
//                 ADDITIONAL CONSULTS
//             ================================================== */}
//             <div className="mt-3 rounded-md border border-slate-200 bg-white shadow-sm">
//               <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
//                 <div className="mr-2 text-[11px] font-bold text-slate-700">
//                   Additional Consult
//                 </div>

//                 {specializedTypes.map((item) => {
//                   const Icon = item.icon;

//                   return (
//                     <button
//                       key={item.value}
//                       type="button"
//                       onClick={() => setAddonModal(item.value)}
//                       className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-blue-200 bg-white px-3 text-[10px] font-bold text-blue-600 transition hover:bg-blue-50"
//                     >
//                       <Plus size={13} />
//                       <Icon size={13} />
//                       {item.label} ({item.shortLabel})
//                     </button>
//                   );
//                 })}

//                 <div className="sm:ml-auto text-[9px] text-slate-400">
//                   Add CL / BV / LV assessment without leaving this consultation.
//                 </div>
//               </div>
//             </div>

//             {/* =================================================
//                 MOBILE / BOTTOM SAVE BAR
//             ================================================== */}
//             <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur lg:static lg:mt-3 lg:border lg:rounded-md lg:shadow-sm">
//               <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-1 sm:px-2">
//                 <div className="hidden min-w-0 sm:block">
//                   <div className="truncate text-[10px] font-bold text-slate-700">
//                     {selectedType.label}
//                   </div>
//                   <div className="truncate text-[9px] text-slate-400">
//                     {fullName(patient)} ·{" "}
//                     {patient.patientNumber || "No patient number"}
//                     {dirty ? " · Unsaved changes" : ""}
//                   </div>
//                 </div>

//                 <div className="ml-auto flex items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={safeNavigateBack}
//                     disabled={saving}
//                     className="h-9 rounded border border-slate-300 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
//                   >
//                     Cancel
//                   </button>

//                   <button
//                     type="submit"
//                     disabled={saving}
//                     className="inline-flex h-9 items-center gap-1.5 rounded bg-blue-600 px-4 text-[10px] font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
//                   >
//                     {saving ? (
//                       <Loader2 size={13} className="animate-spin" />
//                     ) : (
//                       <Save size={13} />
//                     )}
//                     Save Consultation
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </form>
//         )}

//         {/* =====================================================
//             ADD-ON CONSULTATION MODAL
//         ====================================================== */}
//         {addonModal && (
//           <AddonConsultModal
//             type={addonModal}
//             form={form}
//             onClose={() => setAddonModal(null)}
//             onChange={updateAddon}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    PATIENT HEADER
// ========================================================= */

// function PatientHeader({
//   patient,
//   age,
//   previousConsultations,
// }) {
//   return (
//     <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-5 lg:px-7">
//       <div className="grid items-center gap-0 lg:grid-cols-[1.5fr_repeat(5,1fr)]">
//         <div className="flex items-center gap-3 border-b border-slate-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
//           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
//             <UserRound size={22} />
//           </div>

//           <div className="min-w-0">
//             <div className="truncate text-sm font-bold text-slate-900 sm:text-base">
//               {fullName(patient) || "Unnamed Patient"}
//             </div>
//             <div className="mt-0.5 text-[10px] font-medium text-slate-500">
//               {patient.patientNumber || "Patient"}
//             </div>
//           </div>
//         </div>

//         <PatientMini
//           label="DOB"
//           value={
//             patient.dateOfBirth
//               ? `${formatDate(patient.dateOfBirth)}${
//                   age !== null ? ` (Age ${age})` : ""
//                 }`
//               : "Not recorded"
//           }
//         />

//         <PatientMini
//           label="Gender"
//           value={patient.gender || "—"}
//         />

//         <PatientMini
//           label="Phone"
//           value={patient.phone || "—"}
//         />

//         <PatientMini
//           label="Last Consultation"
//           value={
//             patient.lastConsultationAt
//               ? formatDate(patient.lastConsultationAt)
//               : previousConsultations?.[0]?.consultationDate
//                 ? formatDate(
//                     previousConsultations[0].consultationDate
//                   )
//                 : "No previous visit"
//           }
//         />

//         <PatientMini
//           label="Branch"
//           value={
//             patient.registeredBranchName ||
//             patient.branchName ||
//             "Current branch"
//           }
//         />
//       </div>
//     </div>
//   );
// }

// function PatientMini({ label, value }) {
//   return (
//     <div className="border-b border-slate-100 px-3 py-2.5 lg:border-b-0 lg:border-r last:lg:border-r-0">
//       <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
//         {label}
//       </div>
//       <div className="mt-1 truncate text-[10px] font-semibold text-slate-700">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    CONSULTATION TYPE MODAL
// ========================================================= */

// function ConsultationTypeModal({
//   currentType,
//   onSelect,
//   onClose,
//   canClose,
// }) {
//   const [selected, setSelected] = useState(currentType || "comprehensive");

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (event.key === "Escape" && canClose) {
//         onClose();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () =>
//       window.removeEventListener("keydown", handleKeyDown);
//   }, [canClose, onClose]);

//   return (
//     <div
//       className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="consultation-type-title"
//       onMouseDown={(event) => {
//         if (event.target === event.currentTarget && canClose) {
//           onClose();
//         }
//       }}
//     >
//       <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
//         <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
//           <div>
//             <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
//               New Consultation
//             </div>
//             <h2
//               id="consultation-type-title"
//               className="mt-1 text-lg font-bold text-slate-900"
//             >
//               Select consultation type
//             </h2>
//             <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-500">
//               Start with the main workflow. Contact Lens, Binocular Vision and
//               Low Vision assessments can be added from the bottom of the page.
//             </p>
//           </div>

//           {canClose && (
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
//             >
//               <X size={15} />
//             </button>
//           )}
//         </div>

//         <div className="grid gap-3 p-5 sm:grid-cols-2">
//           {consultationTypes.map((item) => {
//             const Icon = item.icon;
//             const active = selected === item.value;

//             return (
//               <button
//                 key={item.value}
//                 type="button"
//                 onClick={() => setSelected(item.value)}
//                 className={`relative rounded-lg border p-5 text-left transition ${
//                   active
//                     ? "border-blue-500 bg-blue-50 shadow-sm"
//                     : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
//                 }`}
//               >
//                 <div className="flex items-start justify-between gap-3">
//                   <div
//                     className={`flex h-10 w-10 items-center justify-center rounded-lg ${
//                       active
//                         ? "bg-blue-600 text-white"
//                         : "bg-slate-100 text-slate-500"
//                     }`}
//                   >
//                     <Icon size={19} />
//                   </div>

//                   <span
//                     className={`flex h-5 w-5 items-center justify-center rounded-full border ${
//                       active
//                         ? "border-blue-600 bg-blue-600 text-white"
//                         : "border-slate-300 text-transparent"
//                     }`}
//                   >
//                     <Check size={12} />
//                   </span>
//                 </div>

//                 <div className="mt-4 text-sm font-bold text-slate-900">
//                   {item.label}
//                 </div>
//                 <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
//                   {item.description}
//                 </p>

//                 <div className="mt-4 text-[9px] font-bold uppercase tracking-wider text-blue-600">
//                   {item.value === "comprehensive"
//                     ? "Single page full examination"
//                     : "Open box + refraction"}
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
//           <div className="text-[9px] text-slate-400">
//             Additional consults can be added later.
//           </div>

//           <div className="flex gap-2">
//             {canClose && (
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="h-9 rounded border border-slate-300 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
//               >
//                 Cancel
//               </button>
//             )}

//             <button
//               type="button"
//               onClick={() => onSelect(selected)}
//               className="inline-flex h-9 items-center gap-1.5 rounded bg-blue-600 px-5 text-[10px] font-bold text-white hover:bg-blue-700"
//             >
//               <Check size={13} />
//               Start Consultation
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    CLINICAL PANEL
// ========================================================= */

// function ClinicalPanel({
//   number,
//   title,
//   icon: Icon,
//   action,
//   children,
// }) {
//   return (
//     <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
//       <div className="flex min-h-[34px] items-center justify-between gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
//         <div className="flex items-center gap-2">
//           <span className="text-[10px] font-bold text-blue-700">
//             {number}.
//           </span>
//           <Icon size={13} className="text-blue-600" />
//           <h2 className="text-[11px] font-bold text-blue-700">
//             {title}
//           </h2>
//         </div>

//         {action}
//       </div>

//       <div className="p-3">{children}</div>
//     </section>
//   );
// }

// /* =========================================================
//    REFRACTION
// ========================================================= */

// function RefractionTabs({ form, onChange, onPdChange }) {
//   const [active, setActive] = useState("previous");

//   const tabs = [
//     ["previous", "Previous Rx"],
//     ["objective", "Objective (Auto)"],
//     ["subjective", "Subjective"],
//     ["final", "Final Rx"],
//   ];

//   return (
//     <div>
//       <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
//         {tabs.map(([value, label]) => (
//           <button
//             key={value}
//             type="button"
//             onClick={() => setActive(value)}
//             className={`h-8 rounded border text-[10px] font-bold transition ${
//               active === value
//                 ? "border-blue-600 bg-blue-600 text-white"
//                 : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//             }`}
//           >
//             {label}
//           </button>
//         ))}
//       </div>

//       <div className="mt-2 overflow-x-auto">
//         <RefractionTable
//           title={tabs.find(([value]) => value === active)?.[1]}
//           data={form.refraction[active]}
//           onChange={(eye, field, value) =>
//             onChange(active, eye, field, value)
//           }
//         />
//       </div>

//       <div className="mt-2 grid gap-2 sm:grid-cols-3">
//         <Input
//           label="PD Right"
//           value={form.refraction.pd.right}
//           onChange={(value) => onPdChange("right", value)}
//         />
//         <Input
//           label="PD Left"
//           value={form.refraction.pd.left}
//           onChange={(value) => onPdChange("left", value)}
//         />
//         <Input
//           label="PD Total"
//           value={form.refraction.pd.total}
//           onChange={(value) => onPdChange("total", value)}
//         />
//       </div>
//     </div>
//   );
// }

// function RefractionTable({ data, onChange }) {
//   const fields = [
//     ["sphere", "Sphere"],
//     ["cylinder", "Cyl"],
//     ["axis", "Axis"],
//     ["add", "Add"],
//     ["inter", "Inter"],
//     ["hPrism", "H Prism"],
//     ["vPrism", "V Prism"],
//   ];

//   return (
//     <table className="w-full min-w-[760px] border-collapse text-[10px]">
//       <thead>
//         <tr className="bg-slate-50 text-left text-[9px] font-bold text-slate-600">
//           <th className="w-20 border border-slate-200 px-2 py-2">
//             Eye
//           </th>
//           {fields.map(([, label]) => (
//             <th
//               key={label}
//               className="border border-slate-200 px-1.5 py-2 text-center"
//             >
//               {label}
//             </th>
//           ))}
//         </tr>
//       </thead>

//       <tbody>
//         {[
//           ["right", "Right (OD)"],
//           ["left", "Left (OS)"],
//         ].map(([eye, label]) => (
//           <tr key={eye}>
//             <th className="border border-slate-200 bg-white px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700">
//               {label}
//             </th>

//             {fields.map(([field]) => (
//               <td
//                 key={field}
//                 className="border border-slate-200 p-1"
//               >
//                 <input
//                   value={data?.[eye]?.[field] || ""}
//                   onChange={(event) =>
//                     onChange(
//                       eye,
//                       field,
//                       event.target.value
//                     )
//                   }
//                   className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-center text-[10px] outline-none focus:border-blue-400"
//                 />
//               </td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// /* =========================================================
//    SLIT LAMP
// ========================================================= */

// function SlitLampTable({ data, onChange }) {
//   const fields = [
//     ["lids", "Lids"],
//     ["conjunctiva", "Conjunctiva"],
//     ["cornea", "Cornea"],
//     ["anteriorChamber", "Anterior Chamber"],
//     ["iris", "Iris"],
//     ["lens", "Lens"],
//     ["other", "Other"],
//   ];

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[580px] border-collapse text-[10px]">
//         <thead>
//           <tr className="bg-slate-50">
//             <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[9px] font-bold text-slate-600">
//               Parameter
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
//               Right (OD)
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
//               Left (OS)
//             </th>
//           </tr>
//         </thead>

//         <tbody>
//           {fields.map(([field, label]) => (
//             <tr key={field}>
//               <th className="border border-slate-200 bg-white px-2 py-1.5 text-left font-semibold text-slate-600">
//                 {label}
//               </th>

//               {["right", "left"].map((eye) => (
//                 <td key={eye} className="border border-slate-200 p-1">
//                   <input
//                     value={data?.[eye]?.[field] || ""}
//                     onChange={(event) =>
//                       onChange(
//                         eye,
//                         field,
//                         event.target.value
//                       )
//                     }
//                     className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
//                   />
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* =========================================================
//    FUNDUS
// ========================================================= */

// function FundusTable({ data, onChange }) {
//   const fields = [
//     ["disc", "Disc"],
//     ["cdRatio", "C/D Ratio"],
//     ["macula", "Macula"],
//     ["vessels", "Vessels"],
//     ["retina", "Retina"],
//     ["other", "Other"],
//   ];

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[580px] border-collapse text-[10px]">
//         <thead>
//           <tr className="bg-slate-50">
//             <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[9px] font-bold text-slate-600">
//               Parameter
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
//               Right (OD)
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
//               Left (OS)
//             </th>
//           </tr>
//         </thead>

//         <tbody>
//           {fields.map(([field, label]) => (
//             <tr key={field}>
//               <th className="border border-slate-200 bg-white px-2 py-1.5 text-left font-semibold text-slate-600">
//                 {label}
//               </th>

//               {["right", "left"].map((eye) => (
//                 <td key={eye} className="border border-slate-200 p-1">
//                   <input
//                     value={data?.[eye]?.[field] || ""}
//                     onChange={(event) =>
//                       onChange(
//                         eye,
//                         field,
//                         event.target.value
//                       )
//                     }
//                     className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
//                   />
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* =========================================================
//    DISPENSING
// ========================================================= */

// function DispensingPanel({
//   form,
//   updateNested,
//   updateLens,
//   addLens,
//   removeLens,
//   frameValue,
//   lensTotal,
//   grandTotal,
//   onCreateBill,
// }) {
//   return (
//     <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
//       <div className="flex min-h-[34px] items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
//         <div className="flex items-center gap-2">
//           <span className="text-[10px] font-bold text-blue-700">
//             09.
//           </span>
//           <Glasses size={13} className="text-blue-600" />
//           <h2 className="text-[11px] font-bold text-blue-700">
//             Dispensing (Spectacles)
//           </h2>
//         </div>

//         <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-600">
//           <input
//             type="checkbox"
//             checked={form.dispensing.spectacleRequired}
//             onChange={(event) =>
//               updateNested(
//                 "dispensing",
//                 "spectacleRequired",
//                 event.target.checked
//               )
//             }
//             className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
//           />
//           Spectacle Required
//         </label>
//       </div>

//       <div className="p-3">
//         {/* FRAME DETAILS — mirrors the supplied dispensing layout */}
//         <div className="grid gap-2 lg:grid-cols-[1fr_2.2fr_1fr_1fr]">
//           <Input
//             label="Frame Code"
//             value={form.dispensing.frameCode}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "frameCode",
//                 value
//               )
//             }
//           />

//           <Input
//             label="Description"
//             value={form.dispensing.frameDescription}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "frameDescription",
//                 value
//               )
//             }
//           />

//           <MoneyInput
//             label="To Reorder"
//             value={form.dispensing.toReorder}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "toReorder",
//                 value
//               )
//             }
//           />

//           <MoneyInput
//             label="Fr Discount"
//             value={form.dispensing.frameDiscount}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "frameDiscount",
//                 value
//               )
//             }
//           />
//         </div>

//         <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
//           <Input
//             label="Frame Size"
//             value={form.dispensing.frameSize}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "frameSize",
//                 value
//               )
//             }
//           />

//           <Input
//             label="Depth"
//             value={form.dispensing.depth}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "depth",
//                 value
//               )
//             }
//           />

//           <Input
//             label="ED"
//             value={form.dispensing.ed}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "ed",
//                 value
//               )
//             }
//           />

//           <Select
//             label="Type"
//             value={form.dispensing.frameType}
//             options={["MM", "Plastic", "Metal", "Acetate", "Other"]}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "frameType",
//                 value
//               )
//             }
//           />

//           <Input
//             label="Other"
//             value={form.dispensing.other}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "other",
//                 value
//               )
//             }
//           />

//           <MoneyInput
//             label="Fitting ₹"
//             value={form.dispensing.fitting}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "fitting",
//                 value
//               )
//             }
//           />

//           <MoneyInput
//             label="Frame Discount"
//             value={form.dispensing.overallDiscount}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "overallDiscount",
//                 value
//               )
//             }
//           />
//         </div>

//         {/* LENS ORDER TABLE */}
//         <div className="mt-3 overflow-x-auto rounded border border-slate-200">
//           <table className="w-full min-w-[1350px] border-collapse text-[9px]">
//             <thead>
//               <tr className="bg-slate-50 text-center font-bold text-slate-600">
//                 <th className="border border-slate-200 px-2 py-2">
//                   Eye
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Lens Code
//                 </th>
//                 <th className="min-w-[180px] border border-slate-200 px-2 py-2">
//                   Lens Description
//                   <br />
//                   <span className="font-normal">
//                     (S = Stock, G = Grind)
//                   </span>
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Lens Size
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Seg Size
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Seg Ht
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   OC Ht
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Hor
//                   <br />
//                   Decen
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Ver
//                   <br />
//                   Decen
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   BC
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Lens Sup
//                 </th>
//                 <th className="min-w-[120px] border border-slate-200 px-2 py-2">
//                   Supplier
//                   <br />
//                   Order Date
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">
//                   Lens Price
//                 </th>
//                 <th className="w-9 border border-slate-200 px-2 py-2">
//                   Action
//                 </th>
//               </tr>
//             </thead>

//             <tbody>
//               {form.dispensing.lensRows.map((row, index) => (
//                 <tr key={`${row.eye}-${index}`}>
//                   <td className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-bold text-slate-700">
//                     {row.eye}
//                   </td>

//                   <td className="border border-slate-200 p-1">
//                     <select
//                       value={row.lensCode}
//                       onChange={(event) =>
//                         updateLens(
//                           index,
//                           "lensCode",
//                           event.target.value
//                         )
//                       }
//                       className="h-8 w-full rounded border border-slate-200 bg-white px-1.5 text-[9px] outline-none focus:border-blue-400"
//                     >
//                       <option value="">Select</option>
//                       <option value="SVTRAN">SVTRAN</option>
//                       <option value="SV">SV</option>
//                       <option value="PROG">PROG</option>
//                       <option value="BIF">BIF</option>
//                       <option value="CL">CL</option>
//                     </select>
//                   </td>

//                   <td className="border border-slate-200 p-1">
//                     <input
//                       value={row.lensDescription}
//                       onChange={(event) =>
//                         updateLens(
//                           index,
//                           "lensDescription",
//                           event.target.value
//                         )
//                       }
//                       className="h-8 w-full rounded border border-slate-200 px-2 text-[9px] text-blue-600 outline-none focus:border-blue-400"
//                       placeholder="Lens description"
//                     />
//                   </td>

//                   {[
//                     ["lensSize", "75"],
//                     ["segSize", ""],
//                     ["segHeight", ""],
//                     ["ocHeight", ""],
//                     ["horizontalDecentration", ""],
//                     ["verticalDecentration", ""],
//                     ["baseCurve", ""],
//                   ].map(([field, placeholder]) => (
//                     <td
//                       key={field}
//                       className="border border-slate-200 p-1"
//                     >
//                       <input
//                         value={row[field] || ""}
//                         onChange={(event) =>
//                           updateLens(
//                             index,
//                             field,
//                             event.target.value
//                           )
//                         }
//                         placeholder={placeholder}
//                         className="h-8 w-full rounded border border-slate-200 px-1.5 text-center text-[9px] outline-none focus:border-blue-400"
//                       />
//                     </td>
//                   ))}

//                   <td className="border border-slate-200 p-1">
//                     <input
//                       value={row.lensSupplier}
//                       onChange={(event) =>
//                         updateLens(
//                           index,
//                           "lensSupplier",
//                           event.target.value
//                         )
//                       }
//                       placeholder="ESS"
//                       className="h-8 w-full rounded border border-slate-200 px-1.5 text-center text-[9px] outline-none focus:border-blue-400"
//                     />
//                   </td>

//                   <td className="border border-slate-200 p-1">
//                     <input
//                       type="date"
//                       value={row.supplierOrderDate}
//                       onChange={(event) =>
//                         updateLens(
//                           index,
//                           "supplierOrderDate",
//                           event.target.value
//                         )
//                       }
//                       className="h-8 w-full rounded border border-slate-200 px-1.5 text-[9px] outline-none focus:border-blue-400"
//                     />
//                   </td>

//                   <td className="border border-slate-200 p-1">
//                     <div className="relative">
//                       <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
//                         ₹
//                       </span>
//                       <input
//                         type="number"
//                         min="0"
//                         value={row.lensPrice}
//                         onChange={(event) =>
//                           updateLens(
//                             index,
//                             "lensPrice",
//                             event.target.value
//                           )
//                         }
//                         className="h-8 w-full rounded border border-slate-200 pl-5 pr-1.5 text-right text-[9px] outline-none focus:border-blue-400"
//                       />
//                     </div>
//                   </td>

//                   <td className="border border-slate-200 p-1 text-center">
//                     <button
//                       type="button"
//                       onClick={() => removeLens(index)}
//                       className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
//                     >
//                       <Trash2 size={13} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
//           <button
//             type="button"
//             onClick={addLens}
//             className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-white px-3 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
//           >
//             <Plus size={12} />
//             Add Lens Row
//           </button>

//           <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-4">
//             <MoneySummary label="Frame" value={frameValue} />
//             <MoneySummary label="Lenses" value={lensTotal} />
//             <MoneySummary
//               label="Total"
//               value={grandTotal}
//               emphasized
//             />
//             <div className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5">
//               <div className="text-[8px] font-bold uppercase text-slate-400">
//                 GST
//               </div>
//               <input
//                 value={form.dispensing.gst}
//                 onChange={(event) =>
//                   updateNested(
//                     "dispensing",
//                     "gst",
//                     event.target.value
//                   )
//                 }
//                 placeholder="GST"
//                 className="mt-0.5 h-6 w-full bg-transparent text-right text-[10px] font-bold outline-none"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
//           <Input
//             label="Bill No"
//             value={form.dispensing.billNo}
//             onChange={(value) =>
//               updateNested(
//                 "dispensing",
//                 "billNo",
//                 value
//               )
//             }
//           />

//           <button
//             type="button"
//             onClick={onCreateBill}
//             className="mt-4 inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-4 text-[9px] font-bold text-slate-700 hover:bg-slate-50"
//           >
//             Create Bill
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// }

// function MoneySummary({
//   label,
//   value,
//   emphasized = false,
// }) {
//   return (
//     <div
//       className={`rounded border px-3 py-1.5 ${
//         emphasized
//           ? "border-blue-200 bg-blue-50"
//           : "border-slate-200 bg-slate-50"
//       }`}
//     >
//       <div className="text-[8px] font-bold uppercase text-slate-400">
//         {label}
//       </div>
//       <div
//         className={`mt-0.5 text-right text-[11px] font-bold ${
//           emphasized ? "text-blue-700" : "text-slate-700"
//         }`}
//       >
//         ₹ {Number(value || 0).toFixed(2)}
//       </div>
//     </div>
//   );
// }

// function MoneyInput({
//   label,
//   value,
//   onChange,
// }) {
//   return (
//     <label className="block">
//       <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>
//       <div className="relative">
//         <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
//           ₹
//         </span>
//         <input
//           type="number"
//           min="0"
//           value={value || ""}
//           onChange={(event) => onChange(event.target.value)}
//           className="h-8 w-full rounded border border-slate-200 bg-white pl-6 pr-2 text-[10px] outline-none focus:border-blue-400"
//         />
//       </div>
//     </label>
//   );
// }

// /* =========================================================
//    ADD-ON CONSULT MODAL
// ========================================================= */

// function AddonConsultModal({
//   type,
//   form,
//   onClose,
//   onChange,
// }) {
//   const item = specializedTypes.find(
//     (entry) => entry.value === type
//   );

//   if (!item) return null;

//   const Icon = item.icon;

//   return (
//     <div
//       className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
//       role="dialog"
//       aria-modal="true"
//     >
//       <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
//         <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
//               <Icon size={17} />
//             </div>
//             <div>
//               <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
//                 Additional Consult
//               </div>
//               <h2 className="text-base font-bold text-slate-900">
//                 {item.label}
//               </h2>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"
//           >
//             <X size={15} />
//           </button>
//         </div>

//         <div className="max-h-[72vh] overflow-y-auto p-5">
//           {type === "contact_lenses" && (
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               <Input
//                 label="Lens Type"
//                 value={form.contactLenses.lensType}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "lensType",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Brand"
//                 value={form.contactLenses.brand}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "brand",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Base Curve"
//                 value={form.contactLenses.baseCurve}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "baseCurve",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Diameter"
//                 value={form.contactLenses.diameter}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "diameter",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="OD Power"
//                 value={form.contactLenses.rightPower}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "rightPower",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="OS Power"
//                 value={form.contactLenses.leftPower}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "leftPower",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Replacement"
//                 value={form.contactLenses.replacement}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "replacement",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Wear Schedule"
//                 value={form.contactLenses.wearSchedule}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "wearSchedule",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Solution"
//                 value={form.contactLenses.solution}
//                 onChange={(value) =>
//                   onChange(
//                     "contactLenses",
//                     "solution",
//                     value
//                   )
//                 }
//               />
//               <div className="sm:col-span-2 lg:col-span-3">
//                 <TextArea
//                   label="Advice"
//                   value={form.contactLenses.advice}
//                   onChange={(value) =>
//                     onChange(
//                       "contactLenses",
//                       "advice",
//                       value
//                     )
//                   }
//                   rows={4}
//                 />
//               </div>
//             </div>
//           )}

//           {type === "binocular_vision" && (
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               <Input
//                 label="Cover Test — Distance"
//                 value={
//                   form.binocularVision.coverTestDistance
//                 }
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "coverTestDistance",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Cover Test — Near"
//                 value={form.binocularVision.coverTestNear}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "coverTestNear",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="NPC"
//                 value={form.binocularVision.npc}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "npc",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Worth 4 Dot"
//                 value={form.binocularVision.worthFourDot}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "worthFourDot",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Stereopsis"
//                 value={form.binocularVision.stereopsis}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "stereopsis",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Vergence BI"
//                 value={form.binocularVision.vergenceBI}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "vergenceBI",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Vergence BO"
//                 value={form.binocularVision.vergenceBO}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "vergenceBO",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Accommodation"
//                 value={form.binocularVision.accommodation}
//                 onChange={(value) =>
//                   onChange(
//                     "binocularVision",
//                     "accommodation",
//                     value
//                   )
//                 }
//               />
//               <div className="sm:col-span-2 lg:col-span-3">
//                 <TextArea
//                   label="Findings"
//                   value={form.binocularVision.findings}
//                   onChange={(value) =>
//                     onChange(
//                       "binocularVision",
//                       "findings",
//                       value
//                     )
//                   }
//                   rows={4}
//                 />
//               </div>
//             </div>
//           )}

//           {type === "low_vision" && (
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               <Input
//                 label="Distance VA"
//                 value={form.lowVision.distanceVA}
//                 onChange={(value) =>
//                   onChange(
//                     "lowVision",
//                     "distanceVA",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Near VA"
//                 value={form.lowVision.nearVA}
//                 onChange={(value) =>
//                   onChange(
//                     "lowVision",
//                     "nearVA",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Contrast"
//                 value={form.lowVision.contrast}
//                 onChange={(value) =>
//                   onChange(
//                     "lowVision",
//                     "contrast",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Visual Field"
//                 value={form.lowVision.visualField}
//                 onChange={(value) =>
//                   onChange(
//                     "lowVision",
//                     "visualField",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Magnification"
//                 value={form.lowVision.magnification}
//                 onChange={(value) =>
//                   onChange(
//                     "lowVision",
//                     "magnification",
//                     value
//                   )
//                 }
//               />
//               <Input
//                 label="Assistive Device"
//                 value={form.lowVision.assistiveDevice}
//                 onChange={(value) =>
//                   onChange(
//                     "lowVision",
//                     "assistiveDevice",
//                     value
//                   )
//                 }
//               />
//               <div className="sm:col-span-2 lg:col-span-3">
//                 <TextArea
//                   label="Advice"
//                   value={form.lowVision.advice}
//                   onChange={(value) =>
//                     onChange(
//                       "lowVision",
//                       "advice",
//                       value
//                     )
//                   }
//                   rows={4}
//                 />
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
//           <button
//             type="button"
//             onClick={onClose}
//             className="h-9 rounded border border-slate-300 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    INPUTS
// ========================================================= */

// function Input({
//   label,
//   value,
//   onChange,
//   placeholder = "",
//   type = "text",
// }) {
//   return (
//     <label className="block min-w-0">
//       <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>

//       <input
//         type={type}
//         value={value || ""}
//         onChange={(event) => onChange(event.target.value)}
//         placeholder={placeholder}
//         className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//       />
//     </label>
//   );
// }

// function TextArea({
//   label,
//   value,
//   onChange,
//   placeholder = "",
//   rows = 4,
// }) {
//   return (
//     <label className="block min-w-0">
//       <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>

//       <textarea
//         rows={rows}
//         value={value || ""}
//         onChange={(event) => onChange(event.target.value)}
//         placeholder={placeholder}
//         className="w-full resize-y rounded border border-slate-200 bg-white px-2.5 py-2 text-[10px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//       />
//     </label>
//   );
// }

// function Select({
//   label,
//   value,
//   onChange,
//   options = [],
// }) {
//   return (
//     <label className="block min-w-0">
//       <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>

//       <select
//         value={value || ""}
//         onChange={(event) => onChange(event.target.value)}
//         className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//       >
//         <option value="">Select...</option>
//         {options.map((option) => (
//           <option
//             key={
//               typeof option === "string"
//                 ? option
//                 : option.value
//             }
//             value={
//               typeof option === "string"
//                 ? option
//                 : option.value
//             }
//           >
//             {typeof option === "string"
//               ? option
//               : option.label}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }

// /* =========================================================
//    SERIALIZATION
// ========================================================= */

// function formatSlitLamp(slitLamp) {
//   if (!slitLamp) return "";

//   const fields = [
//     ["lids", "Lids"],
//     ["conjunctiva", "Conjunctiva"],
//     ["cornea", "Cornea"],
//     ["anteriorChamber", "Anterior Chamber"],
//     ["iris", "Iris"],
//     ["lens", "Lens"],
//     ["other", "Other"],
//   ];

//   return fields
//     .map(([field, label]) => {
//       const right = slitLamp.right?.[field];
//       const left = slitLamp.left?.[field];

//       if (!right && !left) return "";

//       return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
//     })
//     .filter(Boolean)
//     .join("\n");
// }

// function formatFundus(fundus) {
//   if (!fundus) return "";

//   const fields = [
//     ["disc", "Disc"],
//     ["cdRatio", "C/D Ratio"],
//     ["macula", "Macula"],
//     ["vessels", "Vessels"],
//     ["retina", "Retina"],
//     ["other", "Other"],
//   ];

//   return fields
//     .map(([field, label]) => {
//       const right = fundus.right?.[field];
//       const left = fundus.left?.[field];

//       if (!right && !left) return "";

//       return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
//     })
//     .filter(Boolean)
//     .join("\n");
// }

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardPlus,
  Eye,
  FileText,
  Glasses,
  HeartPulse,
  History,
  Loader2,
  Plus,
  Save,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getPatient } from "../../patients/patient.api";
import {
  createConsultation,
  getPatientConsultations,
} from "../consultation.api";

/* =========================================================
   HELPERS
========================================================= */

const fullName = (patient) =>
  [
    patient?.firstName,
    patient?.middleName,
    patient?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

const formatDate = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateInputValue = (value = new Date()) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
};

const emptyEye = () => ({
  sphere: "",
  cylinder: "",
  axis: "",
  add: "",
  inter: "",
  hPrism: "",
  vPrism: "",
  va: "",
  nearVa: "",
});

const emptySlitLampEye = () => ({
  lids: "",
  conjunctiva: "",
  cornea: "",
  anteriorChamber: "",
  iris: "",
  lens: "",
  other: "",
});

const emptyFundusEye = () => ({
  disc: "",
  cdRatio: "",
  macula: "",
  vessels: "",
  retina: "",
  other: "",
});

const emptyDispensingLens = (eye) => ({
  eye,
  lensCode: "",
  lensDescription: "",
  lensSize: "",
  segSize: "",
  segHeight: "",
  ocHeight: "",
  horizontalDecentration: "",
  verticalDecentration: "",
  baseCurve: "",
  lensSupplier: "",
  supplierOrderDate: "",
  lensPrice: "",
});

const consultationTypes = [
  {
    value: "comprehensive",
    label: "Comprehensive",
    description:
      "Full eye examination with history, refraction, ocular examination, diagnosis and advice.",
    icon: Eye,
  },
  {
    value: "short_consult",
    label: "Short Consult",
    description:
      "Quick focused consultation with an open clinical box and refraction slots.",
    icon: ClipboardPlus,
  },
];

const specializedTypes = [
  {
    value: "contact_lenses",
    label: "Contact Lenses",
    shortLabel: "CL",
    icon: Glasses,
    description: "Contact lens assessment and fitting.",
  },
  {
    value: "binocular_vision",
    label: "Binocular Vision",
    shortLabel: "BV",
    icon: Eye,
    description: "Binocular vision and accommodation assessment.",
  },
  {
    value: "low_vision",
    label: "Low Vision",
    shortLabel: "LV",
    icon: Eye,
    description: "Low vision assessment and management.",
  },
];

const testTypes = [
  "Visual Field",
  "Colour Vision",
  "Pupillary Reflex",
  "Contrast Sensitivity",
  "Amsler Grid",
  "Schirmer Test",
  "TBUT",
  "Keratometry",
  "OCT",
  "Tonometry",
  "Other",
];

const adviceOptions = [
  ["distanceWork", "Distance work"],
  ["nearWork", "Near work"],
  ["screenBreaks", "20-20-20 screen breaks"],
  ["hygiene", "Eye hygiene"],
  ["sunProtection", "UV protection"],
  ["followUp", "Follow-up advised"],
  ["spectacleWear", "Spectacle wear"],
  ["contactLensCare", "Contact lens care"],
];

const initialForm = {
  consultationType: "comprehensive",
  consultationDate: dateInputValue(),

  symptoms: "",
  ocularHistory: "",
  systemicHistory: "",
  familyHistory: "",
  allergies: "",
  medications: "",

  visualAcuity: {
    right: {
      unaidedDistance: "",
      aidedDistance: "",
      pinhole: "",
      near: "",
    },
    left: {
      unaidedDistance: "",
      aidedDistance: "",
      pinhole: "",
      near: "",
    },
  },

  refraction: {
    previous: {
      right: emptyEye(),
      left: emptyEye(),
    },
    objective: {
      right: emptyEye(),
      left: emptyEye(),
    },
    subjective: {
      right: emptyEye(),
      left: emptyEye(),
    },
    subjectiveSlots: Array.from({ length: 4 }, () => ({
      right: emptyEye(),
      left: emptyEye(),
    })),
    final: {
      right: emptyEye(),
      left: emptyEye(),
    },
    pd: {
      right: "",
      left: "",
      total: "",
    },
  },

  binocularVision: {
    coverTestDistance: "",
    coverTestNear: "",
    npc: "",
    worthFourDot: "",
    stereopsis: "",
    vergenceBI: "",
    vergenceBO: "",
    accommodation: "",
    findings: "",
  },

  lowVision: {
    distanceVA: "",
    nearVA: "",
    contrast: "",
    visualField: "",
    magnification: "",
    assistiveDevice: "",
    advice: "",
  },

  contactLenses: {
    lensType: "",
    brand: "",
    baseCurve: "",
    diameter: "",
    rightPower: "",
    leftPower: "",
    replacement: "",
    wearSchedule: "",
    solution: "",
    advice: "",
  },

  additionalTests: [],

  slitLamp: {
    right: emptySlitLampEye(),
    left: emptySlitLampEye(),
  },

  fundus: {
    right: emptyFundusEye(),
    left: emptyFundusEye(),
  },

  diagnosis: [],

  advice: {
    distanceWork: false,
    nearWork: false,
    screenBreaks: false,
    hygiene: false,
    sunProtection: false,
    followUp: false,
    spectacleWear: false,
    contactLensCare: false,
    custom: "",
  },

  dispensing: {
    spectacleRequired: false,
    frameCode: "",
    frameDescription: "",
    frameSize: "",
    depth: "",
    ed: "",
    frameType: "",
    other: "",
    fitting: "",
    toReorder: "",
    frameDiscount: "",
    overallDiscount: "",
    gst: "",
    billNo: "",
    lensRows: [
      emptyDispensingLens("R"),
      emptyDispensingLens("L"),
    ],
  },

  therapeutics: [
    {
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ],

  recall: {
    enabled: false,
    date: "",
    type: "Routine Review",
    message: "",
  },

  shortConsult: {
    openBox: "",
  },
};

export default function ConsultationPage() {
  const { patientId: routePatientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Supports:
  // /patients/:patientId/consultations/new
  // /consultations/new?patientId=...
  const patientId = routePatientId || searchParams.get("patientId") || "";

  const [patient, setPatient] = useState(null);
  const [previousConsultations, setPreviousConsultations] = useState([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [consultationStarted, setConsultationStarted] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [addonModal, setAddonModal] = useState(null);
  const [billingMessage, setBillingMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadPatient = async () => {
      if (!patientId) {
        setError("No patient was selected.");
        setLoadingPatient(false);
        return;
      }

      try {
        setLoadingPatient(true);
        setError("");

        const response = await getPatient(patientId);
        const patientData =
          response?.data?.patient ||
          response?.data ||
          response?.patient ||
          null;

        if (!patientData) {
          throw new Error("Patient record not found.");
        }

        if (!mounted) return;

        setPatient(patientData);

        try {
          const consultationsResponse =
            await getPatientConsultations(patientId);

          const rows = Array.isArray(consultationsResponse?.data)
            ? consultationsResponse.data
            : Array.isArray(consultationsResponse?.data?.consultations)
              ? consultationsResponse.data.consultations
              : [];

          if (mounted) setPreviousConsultations(rows);
        } catch {
          if (mounted) setPreviousConsultations([]);
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load patient record."
        );
      } finally {
        if (mounted) setLoadingPatient(false);
      }
    };

    loadPatient();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty || saving) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, saving]);

  const age = useMemo(
    () => calculateAge(patient?.dateOfBirth),
    [patient?.dateOfBirth]
  );

  const selectedType = useMemo(
    () =>
      consultationTypes.find(
        (item) => item.value === form.consultationType
      ) || consultationTypes[0],
    [form.consultationType]
  );

  const isComprehensive = form.consultationType === "comprehensive";
  const isShortConsult = form.consultationType === "short_consult";

  const lensTotal = useMemo(() => {
    return form.dispensing.lensRows.reduce(
      (sum, row) => sum + (Number(row.lensPrice) || 0),
      0
    );
  }, [form.dispensing.lensRows]);

  const frameValue = Number(form.dispensing.toReorder) || 0;
  const frameDiscount = Number(form.dispensing.frameDiscount) || 0;
  const overallDiscount = Number(form.dispensing.overallDiscount) || 0;
  const grandTotal = Math.max(
    0,
    frameValue + lensTotal - frameDiscount - overallDiscount
  );

  const updateForm = (key, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateNested = (section, key, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const updateDeep = (section, subsection, key, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [subsection]: {
          ...current[section][subsection],
          [key]: value,
        },
      },
    }));
  };

  const updateEyeField = (section, eye, field, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [eye]: {
          ...current[section][eye],
          [field]: value,
        },
      },
    }));
  };

  const updateRefractionField = (
    prescriptionType,
    eye,
    field,
    value
  ) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      refraction: {
        ...current.refraction,
        [prescriptionType]: {
          ...current.refraction[prescriptionType],
          [eye]: {
            ...current.refraction[prescriptionType][eye],
            [field]: value,
          },
        },
      },
    }));
  };

  const startConsultation = (type) => {
    setForm((current) => ({
      ...current,
      consultationType: type,
    }));

    setConsultationStarted(true);
    setShowTypeSelector(false);
    setError("");
    setDirty(false);
  };

  const changeConsultationType = () => {
    setShowTypeSelector(true);
  };

  const addTest = () => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      additionalTests: [
        ...current.additionalTests,
        {
          name: "Visual Field",
          result: "",
          remarks: "",
        },
      ],
    }));
  };

  const updateTest = (index, field, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      additionalTests: current.additionalTests.map((test, testIndex) =>
        testIndex === index
          ? {
              ...test,
              [field]: value,
            }
          : test
      ),
    }));
  };

  const removeTest = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      additionalTests: current.additionalTests.filter(
        (_, testIndex) => testIndex !== index
      ),
    }));
  };

  const addDiagnosis = () => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      diagnosis: [
        ...current.diagnosis,
        {
          condition: "",
          eye: "OU",
          notes: "",
        },
      ],
    }));
  };

  const updateDiagnosis = (index, field, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      diagnosis: current.diagnosis.map((item, diagnosisIndex) =>
        diagnosisIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const removeDiagnosis = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      diagnosis: current.diagnosis.filter(
        (_, diagnosisIndex) => diagnosisIndex !== index
      ),
    }));
  };

  const addTherapeutic = () => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      therapeutics: [
        ...current.therapeutics,
        {
          medication: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ],
    }));
  };

  const updateTherapeutic = (index, field, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      therapeutics: current.therapeutics.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const removeTherapeutic = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      therapeutics:
        current.therapeutics.length > 1
          ? current.therapeutics.filter(
              (_, itemIndex) => itemIndex !== index
            )
          : current.therapeutics,
    }));
  };

  const updateDispensingLens = (index, field, value) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      dispensing: {
        ...current.dispensing,
        lensRows: current.dispensing.lensRows.map((row, rowIndex) =>
          rowIndex === index
            ? { ...row, [field]: value }
            : row
        ),
      },
    }));
  };

  const addDispensingLens = () => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      dispensing: {
        ...current.dispensing,
        lensRows: [
          ...current.dispensing.lensRows,
          emptyDispensingLens(
            current.dispensing.lensRows.length % 2 === 0 ? "R" : "L"
          ),
        ],
      },
    }));
  };

  const removeDispensingLens = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      dispensing: {
        ...current.dispensing,
        lensRows:
          current.dispensing.lensRows.length > 1
            ? current.dispensing.lensRows.filter(
                (_, rowIndex) => rowIndex !== index
              )
            : current.dispensing.lensRows,
      },
    }));
  };

  const updateAddon = (section, key, value) => {
    updateNested(section, key, value);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        `opticare-consultation-draft-${patientId}`,
        JSON.stringify(form)
      );
      setDraftSaved(true);
      setDirty(false);
      setSuccess("Draft saved on this device.");
      setTimeout(() => setSuccess(""), 2200);
    } catch {
      setError("Unable to save draft on this device.");
    }
  };

  const handleCreateBill = () => {
    setBillingMessage(
      `Bill prepared for ₹${grandTotal.toFixed(2)}. Connect this button to your billing API when billing is enabled.`
    );
    setTimeout(() => setBillingMessage(""), 3500);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!patientId) {
      setError("Patient is required.");
      return;
    }

    if (!consultationStarted) {
      setError("Please select a consultation type.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const slitLampText = formatSlitLamp(form.slitLamp);
      const fundusText = formatFundus(form.fundus);

      const diagnosisText = form.diagnosis
        .map(
          (item) =>
            `${item.condition || ""}${
              item.eye ? ` (${item.eye})` : ""
            }${item.notes ? ` - ${item.notes}` : ""}`
        )
        .filter(Boolean)
        .join("\n");

      const adviceText = [
        ...adviceOptions
          .filter(([key]) => form.advice[key])
          .map(([, label]) => label),
        form.advice.custom,
      ]
        .filter(Boolean)
        .join("\n");

      const therapeuticText = form.therapeutics
        .map((item) =>
          [
            item.medication,
            item.dosage,
            item.frequency,
            item.duration,
            item.instructions,
          ]
            .filter(Boolean)
            .join(" | ")
        )
        .filter(Boolean)
        .join("\n");

      const payload = {
        patientId,
        consultationDate: form.consultationDate
          ? new Date(`${form.consultationDate}T00:00:00`).toISOString()
          : new Date().toISOString(),

        consultationType: form.consultationType,

        symptoms:
          isShortConsult && form.shortConsult.openBox
            ? form.shortConsult.openBox
            : form.symptoms,

        medication:
          therapeuticText || form.medications || "",

        allergy: form.allergies,

        pupils:
          form.additionalTests
            .filter((test) => test.name === "Pupillary Reflex")
            .map((test) => test.result)
            .filter(Boolean)
            .join("\n") || "",

        ophthalmoscopy: fundusText,
        biomicroscopy: slitLampText,

        visualField: form.additionalTests
          .filter((test) => test.name === "Visual Field")
          .map((test) => test.result)
          .filter(Boolean)
          .join("\n"),

        colourVision: form.additionalTests
          .filter((test) => test.name === "Colour Vision")
          .map((test) => test.result)
          .filter(Boolean)
          .join("\n"),

        otherTests: form.additionalTests.filter(
          (test) =>
            !["Visual Field", "Colour Vision"].includes(test.name)
        ),

        previousRx: {
          right: form.refraction.previous.right,
          left: form.refraction.previous.left,
          note: "",
        },

        subjectiveRx: {
          right: form.refraction.subjective.right,
          left: form.refraction.subjective.left,
          note: "",
        },

        subjectiveRxSlots: form.refraction.subjectiveSlots || [],

        givenRx: {
          right: form.refraction.final.right,
          left: form.refraction.final.left,
          note: "",
        },

        pd: form.refraction.pd,

        recallDue: form.recall.enabled
          ? form.recall.date || null
          : null,

        recallLetter: form.recall.type || "",

        notes: [
          form.ocularHistory
            ? `Ocular history: ${form.ocularHistory}`
            : "",
          form.systemicHistory
            ? `Systemic history: ${form.systemicHistory}`
            : "",
          form.familyHistory
            ? `Family history: ${form.familyHistory}`
            : "",
          diagnosisText ? `Diagnosis:\n${diagnosisText}` : "",
          adviceText ? `Advice:\n${adviceText}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),

        visualAcuity: form.visualAcuity,
        refraction: form.refraction,
        binocularVision: form.binocularVision,
        lowVision: form.lowVision,
        contactLenses: form.contactLenses,
        slitLamp: form.slitLamp,
        fundus: form.fundus,
        diagnosis: form.diagnosis,
        advice: form.advice,
        prescription: {
          type:
            form.dispensing.spectacleRequired
              ? "spectacle"
              : "none",
          note: "",
        },
        dispensing: form.dispensing,
        therapeutics: form.therapeutics,
        recall: form.recall,
      };

      const response = await createConsultation(payload);

      if (!response) {
        throw new Error("Consultation could not be saved.");
      }

      try {
        localStorage.removeItem(
          `opticare-consultation-draft-${patientId}`
        );
      } catch {
        // Ignore local draft cleanup failures.
      }

      setDirty(false);
      setSuccess("Consultation saved successfully.");

      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 900);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save consultation."
      );
    } finally {
      setSaving(false);
    }
  };

  const safeNavigateBack = () => {
    if (dirty && !saving) {
      const confirmed = window.confirm(
        "You have unsaved changes. Leave this consultation?"
      );
      if (!confirmed) return;
    }

    navigate(`/patients/${patientId}`);
  };

  if (loadingPatient) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Loading patient record...
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
    <div className="min-h-screen bg-[#f4f8fc] text-slate-800">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* =====================================================
            TOP TOOLBAR
        ====================================================== */}
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-[#f8fbff]/95 backdrop-blur">
          <div className="flex min-h-[58px] items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={safeNavigateBack}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                title="Back to patient"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Clinical workspace
                </div>
                <h1 className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                  New Consultation
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {dirty && consultationStarted && (
                <span className="hidden items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-semibold text-amber-700 md:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!consultationStarted || saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} />
                <span className="hidden sm:inline">
                  {draftSaved ? "Draft Saved" : "Save Draft"}
                </span>
              </button>

              <button
                type="submit"
                form="consultation-form"
                disabled={!consultationStarted || saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span className="hidden sm:inline">
                  {saving ? "Saving..." : "Save Consultation"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            ALERTS
        ====================================================== */}
        {(error || success || billingMessage) && (
          <div className="px-3 pt-3 sm:px-5 lg:px-7">
            {error && (
              <div className="flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {success && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                <Check size={14} />
                {success}
              </div>
            )}

            {billingMessage && (
              <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700">
                {billingMessage}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            PATIENT HEADER
        ====================================================== */}
        <PatientHeader
          patient={patient}
          age={age}
          previousConsultations={previousConsultations}
        />

        {/* =====================================================
            CONSULTATION TYPE MODAL
        ====================================================== */}
        {showTypeSelector && (
          <ConsultationTypeModal
            currentType={form.consultationType}
            onSelect={startConsultation}
            onClose={() => {
              if (consultationStarted) {
                setShowTypeSelector(false);
              }
            }}
            canClose={consultationStarted}
          />
        )}

        {/* =====================================================
            MAIN CONSULTATION
        ====================================================== */}
        {consultationStarted && (
          <form
            id="consultation-form"
            onSubmit={handleSave}
            className="px-3 pb-28 pt-3 sm:px-5 lg:px-7"
          >
            {/* =================================================
                VISIT CONTROL STRIP
            ================================================== */}
            <div className="mb-3 rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="grid items-center gap-0 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
                <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
                  <div className="mb-1 text-[9px] font-bold text-slate-500">
                    Consultation Type <span className="text-red-500">*</span>
                  </div>

                  <button
                    type="button"
                    onClick={changeConsultationType}
                    className="inline-flex h-8 items-center gap-2 rounded border border-blue-300 bg-blue-50 px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <Check size={13} />
                    {selectedType.label}
                    <ChevronDown size={13} />
                  </button>
                </div>

                <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[9px] font-bold text-slate-500">
                      Recall
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateNested(
                          "recall",
                          "enabled",
                          !form.recall.enabled
                        )
                      }
                      className={`rounded px-2 py-1 text-[9px] font-bold ${
                        form.recall.enabled
                          ? "bg-blue-50 text-blue-700"
                          : "border border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {form.recall.enabled ? "Enabled" : "Add Recall"}
                    </button>
                  </div>

                  {form.recall.enabled && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <CalendarDays
                          size={13}
                          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={form.recall.date}
                          onChange={(event) =>
                            updateNested(
                              "recall",
                              "date",
                              event.target.value
                            )
                          }
                          className="h-8 w-full rounded border border-slate-200 bg-white pl-8 pr-2 text-[10px] outline-none focus:border-blue-400"
                        />
                      </div>

                      <select
                        value={form.recall.type}
                        onChange={(event) =>
                          updateNested(
                            "recall",
                            "type",
                            event.target.value
                          )
                        }
                        className="h-8 min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 text-[10px] outline-none focus:border-blue-400"
                      >
                        <option>Routine Review</option>
                        <option>Prescription Review</option>
                        <option>Contact Lens Review</option>
                        <option>Clinical Follow-up</option>
                        <option>Other</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
                  <Input
                    label="Consult Date"
                    type="date"
                    value={form.consultationDate}
                    onChange={(value) =>
                      updateForm("consultationDate", value)
                    }
                  />
                </div>

                <div className="px-3 py-2.5">
                  <div className="mb-1 text-[9px] font-bold text-slate-500">
                    Optometrist
                  </div>
                  <div className="flex h-8 items-center justify-between rounded border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-semibold text-slate-700">
                    <span>
                      {patient?.assignedOptometristName ||
                        patient?.lastOptometristName ||
                        "Current clinician"}
                    </span>
                    <ChevronDown size={13} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                SHORT CONSULT
            ================================================== */}
            {isShortConsult ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <ClinicalPanel
                  number="01"
                  title="Open Box"
                  icon={FileText}
                >
                  <TextArea
                    label="Clinical entry"
                    value={form.shortConsult.openBox}
                    onChange={(value) =>
                      updateNested(
                        "shortConsult",
                        "openBox",
                        value
                      )
                    }
                    rows={14}
                    placeholder="Enter the consultation findings, complaint, clinical comments or focused assessment..."
                  />
                </ClinicalPanel>

                <ClinicalPanel
                  number="02"
                  title="Refraction"
                  icon={Glasses}
                >
                  <RefractionTable
                    title="Refraction"
                    data={form.refraction.final}
                    onChange={(eye, field, value) =>
                      updateRefractionField(
                        "final",
                        eye,
                        field,
                        value
                      )
                    }
                  />

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Input
                      label="PD Right"
                      value={form.refraction.pd.right}
                      onChange={(value) =>
                        updateDeep(
                          "refraction",
                          "pd",
                          "right",
                          value
                        )
                      }
                    />
                    <Input
                      label="PD Left"
                      value={form.refraction.pd.left}
                      onChange={(value) =>
                        updateDeep(
                          "refraction",
                          "pd",
                          "left",
                          value
                        )
                      }
                    />
                    <Input
                      label="PD Total"
                      value={form.refraction.pd.total}
                      onChange={(value) =>
                        updateDeep(
                          "refraction",
                          "pd",
                          "total",
                          value
                        )
                      }
                    />
                  </div>
                </ClinicalPanel>
              </div>
            ) : (
              <>
                {/* =================================================
                    ROW 1
                ================================================== */}
                <div className="grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="01"
                    title="Symptoms & History"
                    icon={History}
                  >
                    <TextArea
                      label="Presenting Symptoms"
                      value={form.symptoms}
                      onChange={(value) =>
                        updateForm("symptoms", value)
                      }
                      rows={3}
                      placeholder="Enter presenting symptoms..."
                    />

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <TextArea
                        label="Ocular History"
                        value={form.ocularHistory}
                        onChange={(value) =>
                          updateForm("ocularHistory", value)
                        }
                        rows={3}
                        placeholder="Enter ocular history..."
                      />

                      <TextArea
                        label="Systemic History"
                        value={form.systemicHistory}
                        onChange={(value) =>
                          updateForm("systemicHistory", value)
                        }
                        rows={3}
                        placeholder="Enter systemic history..."
                      />

                      <TextArea
                        label="Allergies"
                        value={form.allergies}
                        onChange={(value) =>
                          updateForm("allergies", value)
                        }
                        rows={3}
                        placeholder="Enter allergies..."
                      />

                      <TextArea
                        label="Current Medications"
                        value={form.medications}
                        onChange={(value) =>
                          updateForm("medications", value)
                        }
                        rows={3}
                        placeholder="Enter medications..."
                      />
                    </div>
                  </ClinicalPanel>

                  <ClinicalPanel
                    number="05"
                    title="Slit Lamp Examination"
                    icon={Eye}
                  >
                    <SlitLampTable
                      data={form.slitLamp}
                      onChange={(eye, field, value) =>
                        updateEyeField(
                          "slitLamp",
                          eye,
                          field,
                          value
                        )
                      }
                    />
                  </ClinicalPanel>
                </div>

                {/* =================================================
                    ROW 2
                ================================================== */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="02"
                    title="Refraction"
                    icon={Glasses}
                  >
                    <RefractionTabs
                      form={{
                        ...form,
                        onSubjectiveSlotsChange: (slots) =>
                          updateNested(
                            "refraction",
                            "subjectiveSlots",
                            slots
                          ),
                      }}
                      onChange={updateRefractionField}
                      onPdChange={(side, value) =>
                        updateNested("refraction", "pd", {
                          ...form.refraction.pd,
                          [side]: value,
                        })
                      }
                    />
                  </ClinicalPanel>

                  <ClinicalPanel
                    number="06"
                    title="Fundus Examination"
                    icon={Eye}
                  >
                    <FundusTable
                      data={form.fundus}
                      onChange={(eye, field, value) =>
                        updateEyeField(
                          "fundus",
                          eye,
                          field,
                          value
                        )
                      }
                    />
                  </ClinicalPanel>
                </div>

                {/* =================================================
                    ROW 3
                ================================================== */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="03"
                    title="Ocular Motility (EOM)"
                    icon={Eye}
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        label="Cover Test — Distance"
                        value={
                          form.binocularVision.coverTestDistance
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "coverTestDistance",
                            value
                          )
                        }
                      />
                      <Input
                        label="Cover Test — Near"
                        value={
                          form.binocularVision.coverTestNear
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "coverTestNear",
                            value
                          )
                        }
                      />
                      <Input
                        label="NPC"
                        value={form.binocularVision.npc}
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "npc",
                            value
                          )
                        }
                      />
                      <Input
                        label="Worth 4 Dot"
                        value={
                          form.binocularVision.worthFourDot
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "worthFourDot",
                            value
                          )
                        }
                      />
                      <Input
                        label="Stereopsis"
                        value={
                          form.binocularVision.stereopsis
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "stereopsis",
                            value
                          )
                        }
                      />
                      <Input
                        label="Vergence BI"
                        value={
                          form.binocularVision.vergenceBI
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "vergenceBI",
                            value
                          )
                        }
                      />
                      <Input
                        label="Vergence BO"
                        value={
                          form.binocularVision.vergenceBO
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "vergenceBO",
                            value
                          )
                        }
                      />
                      <Input
                        label="Accommodation"
                        value={
                          form.binocularVision.accommodation
                        }
                        onChange={(value) =>
                          updateNested(
                            "binocularVision",
                            "accommodation",
                            value
                          )
                        }
                      />
                    </div>
                  </ClinicalPanel>

                  <ClinicalPanel
                    number="07"
                    title="Diagnosis"
                    icon={HeartPulse}
                    action={
                      <button
                        type="button"
                        onClick={addDiagnosis}
                        className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    }
                  >
                    {form.diagnosis.length === 0 ? (
                      <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] text-slate-400">
                        No diagnosis added
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {form.diagnosis.map((item, index) => (
                          <div
                            key={index}
                            className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1fr_120px_1fr_30px]"
                          >
                            <Input
                              label="Diagnosis"
                              value={item.condition}
                              onChange={(value) =>
                                updateDiagnosis(
                                  index,
                                  "condition",
                                  value
                                )
                              }
                              placeholder="Search or enter diagnosis..."
                            />
                            <Select
                              label="Laterality"
                              value={item.eye}
                              options={[
                                "OD",
                                "OS",
                                "OU",
                                "N/A",
                              ]}
                              onChange={(value) =>
                                updateDiagnosis(
                                  index,
                                  "eye",
                                  value
                                )
                              }
                            />
                            <Input
                              label="Remarks"
                              value={item.notes}
                              onChange={(value) =>
                                updateDiagnosis(
                                  index,
                                  "notes",
                                  value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeDiagnosis(index)
                              }
                              className="mt-5 flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-white text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ClinicalPanel>
                </div>

                {/* =================================================
                    ROW 4
                ================================================== */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="04"
                    title="Additional Tests"
                    icon={Stethoscope}
                    action={
                      <button
                        type="button"
                        onClick={addTest}
                        className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        <Plus size={12} />
                        Add Test
                      </button>
                    }
                  >
                    {form.additionalTests.length === 0 ? (
                      <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] text-slate-400">
                        No additional tests
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-slate-50 text-left text-[9px] font-bold text-slate-500">
                              <th className="border border-slate-200 px-2 py-2">
                                Test Type
                              </th>
                              <th className="border border-slate-200 px-2 py-2">
                                Result
                              </th>
                              <th className="border border-slate-200 px-2 py-2">
                                Remarks
                              </th>
                              <th className="w-10 border border-slate-200 px-2 py-2 text-center">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.additionalTests.map(
                              (test, index) => (
                                <tr key={index}>
                                  <td className="border border-slate-200 p-1">
                                    <select
                                      value={test.name}
                                      onChange={(event) =>
                                        updateTest(
                                          index,
                                          "name",
                                          event.target.value
                                        )
                                      }
                                      className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[10px] outline-none focus:border-blue-400"
                                    >
                                      {testTypes.map((type) => (
                                        <option
                                          key={type}
                                          value={type}
                                        >
                                          {type}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="border border-slate-200 p-1">
                                    <input
                                      value={test.result || ""}
                                      onChange={(event) =>
                                        updateTest(
                                          index,
                                          "result",
                                          event.target.value
                                        )
                                      }
                                      className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
                                    />
                                  </td>
                                  <td className="border border-slate-200 p-1">
                                    <input
                                      value={test.remarks || ""}
                                      onChange={(event) =>
                                        updateTest(
                                          index,
                                          "remarks",
                                          event.target.value
                                        )
                                      }
                                      className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
                                    />
                                  </td>
                                  <td className="border border-slate-200 p-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeTest(index)
                                      }
                                      className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </ClinicalPanel>

                  <ClinicalPanel
                    number="08"
                    title="Advise / Management Plan"
                    icon={FileText}
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      {adviceOptions.map(([key, label]) => (
                        <label
                          key={key}
                          className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2 text-[10px] font-medium ${
                            form.advice[key]
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.advice[key]}
                            onChange={(event) =>
                              updateNested(
                                "advice",
                                key,
                                event.target.checked
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                          />
                          {label}
                        </label>
                      ))}
                    </div>

                    <div className="mt-2">
                      <TextArea
                        label="Additional Advice"
                        value={form.advice.custom}
                        onChange={(value) =>
                          updateNested(
                            "advice",
                            "custom",
                            value
                          )
                        }
                        rows={5}
                        placeholder="Enter advice or management plan..."
                      />
                    </div>
                  </ClinicalPanel>
                </div>
              </>
            )}

            {/* =================================================
                DISPENSING
            ================================================== */}
            <div className="mt-3">
              <DispensingPanel
                form={form}
                updateNested={updateNested}
                updateLens={updateDispensingLens}
                addLens={addDispensingLens}
                removeLens={removeDispensingLens}
                frameValue={frameValue}
                lensTotal={lensTotal}
                grandTotal={grandTotal}
                onCreateBill={handleCreateBill}
              />
            </div>

            {/* =================================================
                THERAPEUTICS + RECALL
            ================================================== */}
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <ClinicalPanel
                number="10"
                title="Therapeutics"
                icon={HeartPulse}
                action={
                  <button
                    type="button"
                    onClick={addTherapeutic}
                    className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[9px] font-bold text-slate-500">
                        <th className="border border-slate-200 px-2 py-2">
                          Medication
                        </th>
                        <th className="border border-slate-200 px-2 py-2">
                          Dosage
                        </th>
                        <th className="border border-slate-200 px-2 py-2">
                          Frequency
                        </th>
                        <th className="border border-slate-200 px-2 py-2">
                          Duration
                        </th>
                        <th className="border border-slate-200 px-2 py-2">
                          Instructions
                        </th>
                        <th className="w-10 border border-slate-200 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.therapeutics.map((item, index) => (
                        <tr key={index}>
                          {[
                            ["medication", "Medication"],
                            ["dosage", "Dosage"],
                            ["frequency", "Frequency"],
                            ["duration", "Duration"],
                            ["instructions", "Instructions"],
                          ].map(([field, placeholder]) => (
                            <td
                              key={field}
                              className="border border-slate-200 p-1"
                            >
                              <input
                                value={item[field] || ""}
                                placeholder={placeholder}
                                onChange={(event) =>
                                  updateTherapeutic(
                                    index,
                                    field,
                                    event.target.value
                                  )
                                }
                                className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
                              />
                            </td>
                          ))}

                          <td className="border border-slate-200 p-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                removeTherapeutic(index)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClinicalPanel>

              <ClinicalPanel
                number="11"
                title="Recall"
                icon={CalendarDays}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    label="Recall Date"
                    type="date"
                    value={form.recall.date}
                    onChange={(value) =>
                      updateNested(
                        "recall",
                        "date",
                        value
                      )
                    }
                  />

                  <Select
                    label="Recall Type"
                    value={form.recall.type}
                    options={[
                      "Routine Review",
                      "Prescription Review",
                      "Contact Lens Review",
                      "Clinical Follow-up",
                      "Other",
                    ]}
                    onChange={(value) =>
                      updateNested(
                        "recall",
                        "type",
                        value
                      )
                    }
                  />
                </div>

                <div className="mt-2">
                  <TextArea
                    label="Recall Letter / Message"
                    value={form.recall.message}
                    onChange={(value) =>
                      updateNested(
                        "recall",
                        "message",
                        value
                      )
                    }
                    rows={4}
                    placeholder="Recall instruction or patient message..."
                  />
                </div>
              </ClinicalPanel>
            </div>

            {/* =================================================
                ADDITIONAL CONSULTS
            ================================================== */}
            <div className="mt-3 rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
                <div className="mr-2 text-[11px] font-bold text-slate-700">
                  Additional Consult
                </div>

                {specializedTypes.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAddonModal(item.value)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-blue-200 bg-white px-3 text-[10px] font-bold text-blue-600 transition hover:bg-blue-50"
                    >
                      <Plus size={13} />
                      <Icon size={13} />
                      {item.label} ({item.shortLabel})
                    </button>
                  );
                })}

                <div className="sm:ml-auto text-[9px] text-slate-400">
                  Add CL / BV / LV assessment without leaving this consultation.
                </div>
              </div>
            </div>

            {/* =================================================
                MOBILE / BOTTOM SAVE BAR
            ================================================== */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur lg:static lg:mt-3 lg:border lg:rounded-md lg:shadow-sm">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-1 sm:px-2">
                <div className="hidden min-w-0 sm:block">
                  <div className="truncate text-[10px] font-bold text-slate-700">
                    {selectedType.label}
                  </div>
                  <div className="truncate text-[9px] text-slate-400">
                    {fullName(patient)} ·{" "}
                    {patient.patientNumber || "No patient number"}
                    {dirty ? " · Unsaved changes" : ""}
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={safeNavigateBack}
                    disabled={saving}
                    className="h-9 rounded border border-slate-300 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-9 items-center gap-1.5 rounded bg-blue-600 px-4 text-[10px] font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    Save Consultation
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* =====================================================
            ADD-ON CONSULTATION MODAL
        ====================================================== */}
        {addonModal && (
          <AddonConsultModal
            type={addonModal}
            form={form}
            onClose={() => setAddonModal(null)}
            onChange={updateAddon}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PATIENT HEADER
========================================================= */

function PatientHeader({
  patient,
  age,
  previousConsultations,
}) {
  return (
    <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-5 lg:px-7">
      <div className="grid items-center gap-0 lg:grid-cols-[1.5fr_repeat(5,1fr)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
            <UserRound size={22} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {fullName(patient) || "Unnamed Patient"}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">
              {patient.patientNumber || "Patient"}
            </div>
          </div>
        </div>

        <PatientMini
          label="DOB"
          value={
            patient.dateOfBirth
              ? `${formatDate(patient.dateOfBirth)}${
                  age !== null ? ` (Age ${age})` : ""
                }`
              : "Not recorded"
          }
        />

        <PatientMini
          label="Gender"
          value={patient.gender || "—"}
        />

        <PatientMini
          label="Phone"
          value={patient.phone || "—"}
        />

        <PatientMini
          label="Last Consultation"
          value={
            patient.lastConsultationAt
              ? formatDate(patient.lastConsultationAt)
              : previousConsultations?.[0]?.consultationDate
                ? formatDate(
                    previousConsultations[0].consultationDate
                  )
                : "No previous visit"
          }
        />

        <PatientMini
          label="Branch"
          value={
            patient.registeredBranchName ||
            patient.branchName ||
            "Current branch"
          }
        />
      </div>
    </div>
  );
}

function PatientMini({ label, value }) {
  return (
    <div className="border-b border-slate-100 px-3 py-2.5 lg:border-b-0 lg:border-r last:lg:border-r-0">
      <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-[10px] font-semibold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/* =========================================================
   CONSULTATION TYPE MODAL
========================================================= */

function ConsultationTypeModal({
  currentType,
  onSelect,
  onClose,
  canClose,
}) {
  const [selected, setSelected] = useState(currentType || "comprehensive");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && canClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [canClose, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-type-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && canClose) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
              New Consultation
            </div>
            <h2
              id="consultation-type-title"
              className="mt-1 text-lg font-bold text-slate-900"
            >
              Select consultation type
            </h2>
            <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-500">
              Start with the main workflow. Contact Lens, Binocular Vision and
              Low Vision assessments can be added from the bottom of the page.
            </p>
          </div>

          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {consultationTypes.map((item) => {
            const Icon = item.icon;
            const active = selected === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelected(item.value)}
                className={`relative rounded-lg border p-5 text-left transition ${
                  active
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 text-transparent"
                    }`}
                  >
                    <Check size={12} />
                  </span>
                </div>

                <div className="mt-4 text-sm font-bold text-slate-900">
                  {item.label}
                </div>
                <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-4 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                  {item.value === "comprehensive"
                    ? "Single page full examination"
                    : "Open box + refraction"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="text-[9px] text-slate-400">
            Additional consults can be added later.
          </div>

          <div className="flex gap-2">
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded border border-slate-300 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelect(selected)}
              className="inline-flex h-9 items-center gap-1.5 rounded bg-blue-600 px-5 text-[10px] font-bold text-white hover:bg-blue-700"
            >
              <Check size={13} />
              Start Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CLINICAL PANEL
========================================================= */

function ClinicalPanel({
  number,
  title,
  icon: Icon,
  action,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[34px] items-center justify-between gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-700">
            {number}.
          </span>
          <Icon size={13} className="text-blue-600" />
          <h2 className="text-[11px] font-bold text-blue-700">
            {title}
          </h2>
        </div>

        {action}
      </div>

      <div className="p-3">{children}</div>
    </section>
  );
}

/* =========================================================
   REFRACTION
========================================================= */

function RefractionTabs({ form, onChange, onPdChange }) {
  const [active, setActive] = useState("previous");

  const tabs = [
    ["previous", "Previous Rx"],
    ["objective", "Objective (Auto)"],
    ["subjective", "Subjective"],
    ["final", "Final Rx"],
  ];

  const subjectiveSlots =
    form.refraction.subjectiveSlots?.length === 4
      ? form.refraction.subjectiveSlots
      : Array.from({ length: 4 }, (_, index) =>
          form.refraction.subjectiveSlots?.[index] || {
            right: emptyEye(),
            left: emptyEye(),
          }
        );

  const updateSubjectiveSlot = (slotIndex, eye, field, value) => {
    const nextSlots = subjectiveSlots.map((slot, index) =>
      index === slotIndex
        ? {
            ...slot,
            [eye]: {
              ...slot[eye],
              [field]: value,
            },
          }
        : slot
    );

    // Keep the existing single subjectiveRx object synchronized with
    // the most recently edited subjective table so the existing API
    // contract continues to work.
    onChange(
      "subjective",
      eye,
      field,
      value
    );

    if (typeof form.onSubjectiveSlotsChange === "function") {
      form.onSubjectiveSlotsChange(nextSlots);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActive(value)}
            className={`h-8 rounded border text-[10px] font-bold transition ${
              active === value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {active === "subjective" ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {subjectiveSlots.map((slot, index) => (
              <div
                key={index}
                className="overflow-hidden rounded border border-blue-100 bg-white"
              >
                <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-2.5 py-1.5">
                  <div className="text-[10px] font-bold text-blue-700">
                    Subjective Refraction {index + 1}
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">
                    Trial {index + 1}
                  </span>
                </div>

                <div className="overflow-x-auto p-1.5">
                  <RefractionTable
                    data={slot}
                    onChange={(eye, field, value) =>
                      updateSubjectiveSlot(
                        index,
                        eye,
                        field,
                        value
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <RefractionTable
              title={tabs.find(([value]) => value === active)?.[1]}
              data={form.refraction[active]}
              onChange={(eye, field, value) =>
                onChange(active, eye, field, value)
              }
            />
          </div>
        )}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <Input
          label="PD Right"
          value={form.refraction.pd.right}
          onChange={(value) => onPdChange("right", value)}
        />
        <Input
          label="PD Left"
          value={form.refraction.pd.left}
          onChange={(value) => onPdChange("left", value)}
        />
        <Input
          label="PD Total"
          value={form.refraction.pd.total}
          onChange={(value) => onPdChange("total", value)}
        />
      </div>
    </div>
  );
}

function RefractionTable({ data, onChange }) {
  const fields = [
    ["sphere", "Sphere"],
    ["cylinder", "Cyl"],
    ["axis", "Axis"],
    ["add", "Add"],
    ["inter", "Inter"],
    ["hPrism", "H Prism"],
    ["vPrism", "V Prism"],
  ];

  return (
    <table className="w-full min-w-[760px] border-collapse text-[10px]">
      <thead>
        <tr className="bg-slate-50 text-left text-[9px] font-bold text-slate-600">
          <th className="w-20 border border-slate-200 px-2 py-2">
            Eye
          </th>
          {fields.map(([, label]) => (
            <th
              key={label}
              className="border border-slate-200 px-1.5 py-2 text-center"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {[
          ["right", "Right (OD)"],
          ["left", "Left (OS)"],
        ].map(([eye, label]) => (
          <tr key={eye}>
            <th className="border border-slate-200 bg-white px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700">
              {label}
            </th>

            {fields.map(([field]) => (
              <td
                key={field}
                className="border border-slate-200 p-1"
              >
                <input
                  value={data?.[eye]?.[field] || ""}
                  onChange={(event) =>
                    onChange(
                      eye,
                      field,
                      event.target.value
                    )
                  }
                  className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-center text-[10px] outline-none focus:border-blue-400"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* =========================================================
   SLIT LAMP
========================================================= */

function SlitLampTable({ data, onChange }) {
  const fields = [
    ["lids", "Lids"],
    ["conjunctiva", "Conjunctiva"],
    ["cornea", "Cornea"],
    ["anteriorChamber", "Anterior Chamber"],
    ["iris", "Iris"],
    ["lens", "Lens"],
    ["other", "Other"],
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[580px] border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[9px] font-bold text-slate-600">
              Parameter
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
              Right (OD)
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
              Left (OS)
            </th>
          </tr>
        </thead>

        <tbody>
          {fields.map(([field, label]) => (
            <tr key={field}>
              <th className="border border-slate-200 bg-white px-2 py-1.5 text-left font-semibold text-slate-600">
                {label}
              </th>

              {["right", "left"].map((eye) => (
                <td key={eye} className="border border-slate-200 p-1">
                  <input
                    value={data?.[eye]?.[field] || ""}
                    onChange={(event) =>
                      onChange(
                        eye,
                        field,
                        event.target.value
                      )
                    }
                    className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   FUNDUS
========================================================= */

function FundusTable({ data, onChange }) {
  const fields = [
    ["disc", "Disc"],
    ["cdRatio", "C/D Ratio"],
    ["macula", "Macula"],
    ["vessels", "Vessels"],
    ["retina", "Retina"],
    ["other", "Other"],
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[580px] border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[9px] font-bold text-slate-600">
              Parameter
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
              Right (OD)
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[9px] font-bold text-slate-600">
              Left (OS)
            </th>
          </tr>
        </thead>

        <tbody>
          {fields.map(([field, label]) => (
            <tr key={field}>
              <th className="border border-slate-200 bg-white px-2 py-1.5 text-left font-semibold text-slate-600">
                {label}
              </th>

              {["right", "left"].map((eye) => (
                <td key={eye} className="border border-slate-200 p-1">
                  <input
                    value={data?.[eye]?.[field] || ""}
                    onChange={(event) =>
                      onChange(
                        eye,
                        field,
                        event.target.value
                      )
                    }
                    className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   DISPENSING
========================================================= */

function DispensingPanel({
  form,
  updateNested,
  updateLens,
  addLens,
  removeLens,
  frameValue,
  lensTotal,
  grandTotal,
  onCreateBill,
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[34px] items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-700">
            09.
          </span>
          <Glasses size={13} className="text-blue-600" />
          <h2 className="text-[11px] font-bold text-blue-700">
            Dispensing (Spectacles)
          </h2>
        </div>

        <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.dispensing.spectacleRequired}
            onChange={(event) =>
              updateNested(
                "dispensing",
                "spectacleRequired",
                event.target.checked
              )
            }
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
          />
          Spectacle Required
        </label>
      </div>

      <div className="p-3">
        {/* FRAME DETAILS — mirrors the supplied dispensing layout */}
        <div className="grid gap-2 lg:grid-cols-[1fr_2.2fr_1fr_1fr]">
          <Input
            label="Frame Code"
            value={form.dispensing.frameCode}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "frameCode",
                value
              )
            }
          />

          <Input
            label="Description"
            value={form.dispensing.frameDescription}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "frameDescription",
                value
              )
            }
          />

          <MoneyInput
            label="To Reorder"
            value={form.dispensing.toReorder}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "toReorder",
                value
              )
            }
          />

          <MoneyInput
            label="Fr Discount"
            value={form.dispensing.frameDiscount}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "frameDiscount",
                value
              )
            }
          />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          <Input
            label="Frame Size"
            value={form.dispensing.frameSize}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "frameSize",
                value
              )
            }
          />

          <Input
            label="Depth"
            value={form.dispensing.depth}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "depth",
                value
              )
            }
          />

          <Input
            label="ED"
            value={form.dispensing.ed}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "ed",
                value
              )
            }
          />

          <Select
            label="Type"
            value={form.dispensing.frameType}
            options={["MM", "Plastic", "Metal", "Acetate", "Other"]}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "frameType",
                value
              )
            }
          />

          <Input
            label="Other"
            value={form.dispensing.other}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "other",
                value
              )
            }
          />

          <MoneyInput
            label="Fitting ₹"
            value={form.dispensing.fitting}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "fitting",
                value
              )
            }
          />

          <MoneyInput
            label="Frame Discount"
            value={form.dispensing.overallDiscount}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "overallDiscount",
                value
              )
            }
          />
        </div>

        {/* LENS ORDER TABLE */}
        <div className="mt-3 overflow-x-auto rounded border border-slate-200">
          <table className="w-full min-w-[1350px] border-collapse text-[9px]">
            <thead>
              <tr className="bg-slate-50 text-center font-bold text-slate-600">
                <th className="border border-slate-200 px-2 py-2">
                  Eye
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Lens Code
                </th>
                <th className="min-w-[180px] border border-slate-200 px-2 py-2">
                  Lens Description
                  <br />
                  <span className="font-normal">
                    (S = Stock, G = Grind)
                  </span>
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Lens Size
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Seg Size
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Seg Ht
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  OC Ht
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Hor
                  <br />
                  Decen
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Ver
                  <br />
                  Decen
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  BC
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Lens Sup
                </th>
                <th className="min-w-[120px] border border-slate-200 px-2 py-2">
                  Supplier
                  <br />
                  Order Date
                </th>
                <th className="border border-slate-200 px-2 py-2">
                  Lens Price
                </th>
                <th className="w-9 border border-slate-200 px-2 py-2">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {form.dispensing.lensRows.map((row, index) => (
                <tr key={`${row.eye}-${index}`}>
                  <td className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-bold text-slate-700">
                    {row.eye}
                  </td>

                  <td className="border border-slate-200 p-1">
                    <select
                      value={row.lensCode}
                      onChange={(event) =>
                        updateLens(
                          index,
                          "lensCode",
                          event.target.value
                        )
                      }
                      className="h-8 w-full rounded border border-slate-200 bg-white px-1.5 text-[9px] outline-none focus:border-blue-400"
                    >
                      <option value="">Select</option>
                      <option value="SVTRAN">SVTRAN</option>
                      <option value="SV">SV</option>
                      <option value="PROG">PROG</option>
                      <option value="BIF">BIF</option>
                      <option value="CL">CL</option>
                    </select>
                  </td>

                  <td className="border border-slate-200 p-1">
                    <input
                      value={row.lensDescription}
                      onChange={(event) =>
                        updateLens(
                          index,
                          "lensDescription",
                          event.target.value
                        )
                      }
                      className="h-8 w-full rounded border border-slate-200 px-2 text-[9px] text-blue-600 outline-none focus:border-blue-400"
                      placeholder="Lens description"
                    />
                  </td>

                  {[
                    ["lensSize", "75"],
                    ["segSize", ""],
                    ["segHeight", ""],
                    ["ocHeight", ""],
                    ["horizontalDecentration", ""],
                    ["verticalDecentration", ""],
                    ["baseCurve", ""],
                  ].map(([field, placeholder]) => (
                    <td
                      key={field}
                      className="border border-slate-200 p-1"
                    >
                      <input
                        value={row[field] || ""}
                        onChange={(event) =>
                          updateLens(
                            index,
                            field,
                            event.target.value
                          )
                        }
                        placeholder={placeholder}
                        className="h-8 w-full rounded border border-slate-200 px-1.5 text-center text-[9px] outline-none focus:border-blue-400"
                      />
                    </td>
                  ))}

                  <td className="border border-slate-200 p-1">
                    <input
                      value={row.lensSupplier}
                      onChange={(event) =>
                        updateLens(
                          index,
                          "lensSupplier",
                          event.target.value
                        )
                      }
                      placeholder="ESS"
                      className="h-8 w-full rounded border border-slate-200 px-1.5 text-center text-[9px] outline-none focus:border-blue-400"
                    />
                  </td>

                  <td className="border border-slate-200 p-1">
                    <input
                      type="date"
                      value={row.supplierOrderDate}
                      onChange={(event) =>
                        updateLens(
                          index,
                          "supplierOrderDate",
                          event.target.value
                        )
                      }
                      className="h-8 w-full rounded border border-slate-200 px-1.5 text-[9px] outline-none focus:border-blue-400"
                    />
                  </td>

                  <td className="border border-slate-200 p-1">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={row.lensPrice}
                        onChange={(event) =>
                          updateLens(
                            index,
                            "lensPrice",
                            event.target.value
                          )
                        }
                        className="h-8 w-full rounded border border-slate-200 pl-5 pr-1.5 text-right text-[9px] outline-none focus:border-blue-400"
                      />
                    </div>
                  </td>

                  <td className="border border-slate-200 p-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeLens(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={addLens}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-white px-3 text-[9px] font-bold text-blue-600 hover:bg-blue-50"
          >
            <Plus size={12} />
            Add Lens Row
          </button>

          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-4">
            <MoneySummary label="Frame" value={frameValue} />
            <MoneySummary label="Lenses" value={lensTotal} />
            <MoneySummary
              label="Total"
              value={grandTotal}
              emphasized
            />
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="text-[8px] font-bold uppercase text-slate-400">
                GST
              </div>
              <input
                value={form.dispensing.gst}
                onChange={(event) =>
                  updateNested(
                    "dispensing",
                    "gst",
                    event.target.value
                  )
                }
                placeholder="GST"
                className="mt-0.5 h-6 w-full bg-transparent text-right text-[10px] font-bold outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          <Input
            label="Bill No"
            value={form.dispensing.billNo}
            onChange={(value) =>
              updateNested(
                "dispensing",
                "billNo",
                value
              )
            }
          />

          <button
            type="button"
            onClick={onCreateBill}
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-4 text-[9px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Create Bill
          </button>
        </div>
      </div>
    </section>
  );
}

function MoneySummary({
  label,
  value,
  emphasized = false,
}) {
  return (
    <div
      className={`rounded border px-3 py-1.5 ${
        emphasized
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-[8px] font-bold uppercase text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 text-right text-[11px] font-bold ${
          emphasized ? "text-blue-700" : "text-slate-700"
        }`}
      >
        ₹ {Number(value || 0).toFixed(2)}
      </div>
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
          ₹
        </span>
        <input
          type="number"
          min="0"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full rounded border border-slate-200 bg-white pl-6 pr-2 text-[10px] outline-none focus:border-blue-400"
        />
      </div>
    </label>
  );
}

/* =========================================================
   ADD-ON CONSULT MODAL
========================================================= */

function AddonConsultModal({
  type,
  form,
  onClose,
  onChange,
}) {
  const item = specializedTypes.find(
    (entry) => entry.value === type
  );

  if (!item) return null;

  const Icon = item.icon;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={17} />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                Additional Consult
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {item.label}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          {type === "contact_lenses" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Lens Type"
                value={form.contactLenses.lensType}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "lensType",
                    value
                  )
                }
              />
              <Input
                label="Brand"
                value={form.contactLenses.brand}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "brand",
                    value
                  )
                }
              />
              <Input
                label="Base Curve"
                value={form.contactLenses.baseCurve}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "baseCurve",
                    value
                  )
                }
              />
              <Input
                label="Diameter"
                value={form.contactLenses.diameter}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "diameter",
                    value
                  )
                }
              />
              <Input
                label="OD Power"
                value={form.contactLenses.rightPower}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "rightPower",
                    value
                  )
                }
              />
              <Input
                label="OS Power"
                value={form.contactLenses.leftPower}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "leftPower",
                    value
                  )
                }
              />
              <Input
                label="Replacement"
                value={form.contactLenses.replacement}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "replacement",
                    value
                  )
                }
              />
              <Input
                label="Wear Schedule"
                value={form.contactLenses.wearSchedule}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "wearSchedule",
                    value
                  )
                }
              />
              <Input
                label="Solution"
                value={form.contactLenses.solution}
                onChange={(value) =>
                  onChange(
                    "contactLenses",
                    "solution",
                    value
                  )
                }
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <TextArea
                  label="Advice"
                  value={form.contactLenses.advice}
                  onChange={(value) =>
                    onChange(
                      "contactLenses",
                      "advice",
                      value
                    )
                  }
                  rows={4}
                />
              </div>
            </div>
          )}

          {type === "binocular_vision" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Cover Test — Distance"
                value={
                  form.binocularVision.coverTestDistance
                }
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "coverTestDistance",
                    value
                  )
                }
              />
              <Input
                label="Cover Test — Near"
                value={form.binocularVision.coverTestNear}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "coverTestNear",
                    value
                  )
                }
              />
              <Input
                label="NPC"
                value={form.binocularVision.npc}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "npc",
                    value
                  )
                }
              />
              <Input
                label="Worth 4 Dot"
                value={form.binocularVision.worthFourDot}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "worthFourDot",
                    value
                  )
                }
              />
              <Input
                label="Stereopsis"
                value={form.binocularVision.stereopsis}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "stereopsis",
                    value
                  )
                }
              />
              <Input
                label="Vergence BI"
                value={form.binocularVision.vergenceBI}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "vergenceBI",
                    value
                  )
                }
              />
              <Input
                label="Vergence BO"
                value={form.binocularVision.vergenceBO}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "vergenceBO",
                    value
                  )
                }
              />
              <Input
                label="Accommodation"
                value={form.binocularVision.accommodation}
                onChange={(value) =>
                  onChange(
                    "binocularVision",
                    "accommodation",
                    value
                  )
                }
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <TextArea
                  label="Findings"
                  value={form.binocularVision.findings}
                  onChange={(value) =>
                    onChange(
                      "binocularVision",
                      "findings",
                      value
                    )
                  }
                  rows={4}
                />
              </div>
            </div>
          )}

          {type === "low_vision" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Distance VA"
                value={form.lowVision.distanceVA}
                onChange={(value) =>
                  onChange(
                    "lowVision",
                    "distanceVA",
                    value
                  )
                }
              />
              <Input
                label="Near VA"
                value={form.lowVision.nearVA}
                onChange={(value) =>
                  onChange(
                    "lowVision",
                    "nearVA",
                    value
                  )
                }
              />
              <Input
                label="Contrast"
                value={form.lowVision.contrast}
                onChange={(value) =>
                  onChange(
                    "lowVision",
                    "contrast",
                    value
                  )
                }
              />
              <Input
                label="Visual Field"
                value={form.lowVision.visualField}
                onChange={(value) =>
                  onChange(
                    "lowVision",
                    "visualField",
                    value
                  )
                }
              />
              <Input
                label="Magnification"
                value={form.lowVision.magnification}
                onChange={(value) =>
                  onChange(
                    "lowVision",
                    "magnification",
                    value
                  )
                }
              />
              <Input
                label="Assistive Device"
                value={form.lowVision.assistiveDevice}
                onChange={(value) =>
                  onChange(
                    "lowVision",
                    "assistiveDevice",
                    value
                  )
                }
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <TextArea
                  label="Advice"
                  value={form.lowVision.advice}
                  onChange={(value) =>
                    onChange(
                      "lowVision",
                      "advice",
                      value
                    )
                  }
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded border border-slate-300 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INPUTS
========================================================= */

function Input({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded border border-slate-200 bg-white px-2.5 py-2 text-[10px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options = [],
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option
            key={
              typeof option === "string"
                ? option
                : option.value
            }
            value={
              typeof option === "string"
                ? option
                : option.value
            }
          >
            {typeof option === "string"
              ? option
              : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* =========================================================
   SERIALIZATION
========================================================= */

function formatSlitLamp(slitLamp) {
  if (!slitLamp) return "";

  const fields = [
    ["lids", "Lids"],
    ["conjunctiva", "Conjunctiva"],
    ["cornea", "Cornea"],
    ["anteriorChamber", "Anterior Chamber"],
    ["iris", "Iris"],
    ["lens", "Lens"],
    ["other", "Other"],
  ];

  return fields
    .map(([field, label]) => {
      const right = slitLamp.right?.[field];
      const left = slitLamp.left?.[field];

      if (!right && !left) return "";

      return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
    })
    .filter(Boolean)
    .join("\n");
}

function formatFundus(fundus) {
  if (!fundus) return "";

  const fields = [
    ["disc", "Disc"],
    ["cdRatio", "C/D Ratio"],
    ["macula", "Macula"],
    ["vessels", "Vessels"],
    ["retina", "Retina"],
    ["other", "Other"],
  ];

  return fields
    .map(([field, label]) => {
      const right = fundus.right?.[field];
      const left = fundus.left?.[field];

      if (!right && !left) return "";

      return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
    })
    .filter(Boolean)
    .join("\n");
}
