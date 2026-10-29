// import { useEffect, useMemo, useState } from "react";
// import {
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
//   [patient?.firstName, patient?.middleName, patient?.lastName]
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

// const emptyContactLensEye = () => ({
//   lensCategory: "soft",
//   brandMaterialDk: "",
//   baseCurveSag: "",
//   overallDiameter: "",
//   powerSph: "",
//   powerCyl: "",
//   powerAxis: "",
//   powerAdd: "",
//   peripheralHapticCurves: "",
//   flatK: "",
//   steepK: "",
//   kAxis: "",
//   ectasiaConeType: "",
//   hvid: "",
//   pupilPhotopic: "",
//   pupilMesopic: "",
//   lidsLashes: "",
//   conjunctivaSclera: "",
//   corneaStatus: "",
//   tbutSec: "",
//   tbutQuality: "normal",
//   softCentration: "centered",
//   softDecenterDetail: "",
//   softMovement: "optimal",
//   softPushUp: "normal",
//   softLag: "normal",
//   rgpApicalPattern: "alignment",
//   rgpMidPeripheral: "adequate",
//   rgpEdgeLift: "optimal",
//   rgpCentration: "centered",
//   rgpWettability: "good",
//   scleralCentralVaultInitial: "",
//   scleralCentralVaultSettlement: "",
//   scleralSettlementHours: "",
//   scleralLimbalClearance: "adequate",
//   scleralLandingZone: "alignment",
//   scleralLandingZoneAngles: "spherical",
//   scleralSurfaceWettability: "clean",
//   overRefractionSph: "",
//   overRefractionCyl: "",
//   overRefractionAxis: "",
//   finalAidedVA: "",
// });

// const emptyContactLensForm = () => ({
//   primaryIndication: "refractive",
//   selectedLensTypes: {
//     soft: false,
//     rgp: false,
//     scleral: false,
//   },
//   wearHistory: {
//     lensTypeMaterial: "",
//     wearSchedule: "",
//     replacement: "",
//     wearTimeHours: "",
//     avgWearTimeHours: "",
//     comfortOD: "",
//     comfortOS: "",
//   },
//   careSolution: "",
//   right: emptyContactLensEye(),
//   left: emptyContactLensEye(),
//   binocularAidedVA: "",
//   clinicalDiagnosis: "",
//   finalOrderOD: "",
//   finalOrderOS: "",
//   fillingSolution: "",
//   disinfectionSystem: "",
//   instructions: {
//     insertionRemovalVerified: false,
//     noTapWaterWarning: false,
//     bubbleTroubleshooting: false,
//   },
//   followUpSchedule: "1_week",
//   followUpDate: "",
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
//   {
//     value: "binocular_vision",
//     label: "Binocular Vision",
//     description: "Dedicated binocular, accommodative and vergence assessment.",
//     icon: Eye,
//   },
//   {
//     value: "contact_lenses",
//     label: "Contact Lenses",
//     description: "Comprehensive Contact Lens evaluation (Soft, RGP & Scleral).",
//     icon: Glasses,
//   },
//   {
//     value: "low_vision",
//     label: "Low Vision",
//     description: "Low vision assessment, aids and management planning.",
//     icon: Eye,
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
//       aidedNear: "",
//     },
//     left: {
//       unaidedDistance: "",
//       aidedDistance: "",
//       pinhole: "",
//       near: "",
//       aidedNear: "",
//     },
//     both: {
//       unaidedDistance: "",
//       aidedDistance: "",
//       near: "",
//       aidedNear: "",
//     },
//     notes: "",
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
//     subjectiveSlots: Array.from({ length: 4 }, () => ({
//       right: emptyEye(),
//       left: emptyEye(),
//     })),
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
//     date: dateInputValue(),
//     time: "",
//     workUpBy: "",
//     occupation: "",
//     regNo: "",
//     phone: "",
//     email: "",
//     place: "",
//     chiefComplaints: "",
//     refractionNote: "",
//     sensory: {
//       stereopsisNear: "",
//       wfdtDistance: "",
//       wfdtIntermediate: "",
//       wfdtNear: "",
//     },
//     motor: {
//       eomOD: "",
//       eomOS: "",
//       saccades: "",
//       pursuits: "",
//       coverTestMethod: "",
//       coverDistance: "",
//       coverNear: "",
//       phoriaHorizontalDistance: "",
//       phoriaHorizontalNear: "",
//       phoriaVerticalDistance: "",
//       phoriaVerticalNear: "",
//       gradientACA: "",
//     },
//     accommodation: {
//       npcAccommodativeSubjective: "",
//       npcAccommodativeObjective: "",
//       npcAccommodativeBreak: "",
//       npcAccommodativeRecovery: "",
//       npcRGSubjective: "",
//       npcRGObjective: "",
//       npcRGBreak: "",
//       npcRGRecovery: "",
//       npaOD: "",
//       npaOS: "",
//       npaOU: "",
//       aaOD: "",
//       aaOS: "",
//       aaOU: "",
//       hofstetterMinimumAA: "",
//       memOD: "",
//       memOS: "",
//       nra: "",
//       pra: "",
//     },
//     fusional: {
//       nfvDistanceBlur: "",
//       nfvDistanceBreak: "",
//       nfvDistanceRecovery: "",
//       nfvNearBlur: "",
//       nfvNearBreak: "",
//       nfvNearRecovery: "",
//       pfvDistanceBlur: "",
//       pfvDistanceBreak: "",
//       pfvDistanceRecovery: "",
//       pfvNearBlur: "",
//       pfvNearBreak: "",
//       pfvNearRecovery: "",
//       comments: "",
//       interpretation: "",
//     },
//     vergenceFacility: {
//       cpm: "",
//       comments: "",
//       interpretation: "",
//     },
//     accommodativeFacility: {
//       lensPower: "+/-2.00 DS",
//       testDistance: "",
//       amplitude: "",
//       scaledFacility: "",
//       odCPM: "",
//       osCPM: "",
//       ouCPM: "",
//       comments: "",
//       interpretation: "",
//     },
//     cissScore: "",
//     fixationDisparity: "",
//     otherTests: "",
//     finalGlassRx: {
//       od: emptyEye(),
//       os: emptyEye(),
//       addOD: "",
//       addOS: "",
//       prismOD: "",
//       prismOS: "",
//     },
//     diagnosis: "",
//     advice: "",
//     followUp: "",
//     notes: "",
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

//   contactLenses: emptyContactLensForm(),

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
//     lensRows: [emptyDispensingLens("R"), emptyDispensingLens("L")],
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
//   const requestedType = searchParams.get("type") || "";

//   const validRequestedTypes = [
//     "comprehensive",
//     "short_consult",
//     "binocular_vision",
//     "low_vision",
//     "contact_lenses",
//   ];

//   const isDirectConsultation = validRequestedTypes.includes(requestedType);
//   const [patient, setPatient] = useState(null);
//   const [previousConsultations, setPreviousConsultations] = useState([]);
//   const [loadingPatient, setLoadingPatient] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [consultationStarted, setConsultationStarted] =
//     useState(isDirectConsultation);

//   const [showTypeSelector, setShowTypeSelector] =
//     useState(!isDirectConsultation);
//   const [dirty, setDirty] = useState(false);
//   const [draftSaved, setDraftSaved] = useState(false);

//   const [form, setForm] = useState(() => ({
//     ...initialForm,
//     consultationType: isDirectConsultation
//       ? requestedType
//       : initialForm.consultationType,
//   }));

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
//             "Unable to load patient record.",
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
//     [patient?.dateOfBirth],
//   );

//   const selectedType = useMemo(
//     () =>
//       consultationTypes.find((item) => item.value === form.consultationType) ||
//       consultationTypes[0],
//     [form.consultationType],
//   );

//   const isComprehensive = form.consultationType === "comprehensive";
//   const isShortConsult = form.consultationType === "short_consult";
//   const isBinocularVision = form.consultationType === "binocular_vision";
//   const isContactLenses = form.consultationType === "contact_lenses";
//   const isLowVision = form.consultationType === "low_vision";
//   const isSpecializedConsult =
//     isBinocularVision || isContactLenses || isLowVision;

//   const lensTotal = useMemo(() => {
//     return form.dispensing.lensRows.reduce(
//       (sum, row) => sum + (Number(row.lensPrice) || 0),
//       0,
//     );
//   }, [form.dispensing.lensRows]);

//   const frameValue = Number(form.dispensing.toReorder) || 0;
//   const frameDiscount = Number(form.dispensing.frameDiscount) || 0;
//   const overallDiscount = Number(form.dispensing.overallDiscount) || 0;
//   const grandTotal = Math.max(
//     0,
//     frameValue + lensTotal - frameDiscount - overallDiscount,
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

//   const updateRefractionField = (prescriptionType, eye, field, value) => {
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
//           : test,
//       ),
//     }));
//   };

//   const removeTest = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       additionalTests: current.additionalTests.filter(
//         (_, testIndex) => testIndex !== index,
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
//           : item,
//       ),
//     }));
//   };

//   const removeDiagnosis = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       diagnosis: current.diagnosis.filter(
//         (_, diagnosisIndex) => diagnosisIndex !== index,
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
//         itemIndex === index ? { ...item, [field]: value } : item,
//       ),
//     }));
//   };

//   const removeTherapeutic = (index) => {
//     setDirty(true);
//     setForm((current) => ({
//       ...current,
//       therapeutics:
//         current.therapeutics.length > 1
//           ? current.therapeutics.filter((_, itemIndex) => itemIndex !== index)
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
//           rowIndex === index ? { ...row, [field]: value } : row,
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
//             current.dispensing.lensRows.length % 2 === 0 ? "R" : "L",
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
//                 (_, rowIndex) => rowIndex !== index,
//               )
//             : current.dispensing.lensRows,
//       },
//     }));
//   };

//   const updateAddon = (section, key, value) => {
//     if (key === "__replace") {
//       updateForm(section, value);
//       return;
//     }

//     updateNested(section, key, value);
//   };

//   const handleSaveDraft = () => {
//     try {
//       localStorage.setItem(
//         `opticare-consultation-draft-${patientId}`,
//         JSON.stringify(form),
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
//       `Bill prepared for ₹${grandTotal.toFixed(2)}. Connect this button to your billing API when billing is enabled.`,
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
//             }${item.notes ? ` - ${item.notes}` : ""}`,
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
//             .join(" | "),
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

//         medication: therapeuticText || form.medications || "",

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
//           (test) => !["Visual Field", "Colour Vision"].includes(test.name),
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

//         subjectiveRxSlots: form.refraction.subjectiveSlots || [],

//         givenRx: {
//           right: form.refraction.final.right,
//           left: form.refraction.final.left,
//           note: "",
//         },

//         pd: form.refraction.pd,

//         recallDue: form.recall.enabled ? form.recall.date || null : null,

//         recallLetter: form.recall.type || "",

//         notes: [
//           form.ocularHistory ? `Ocular history: ${form.ocularHistory}` : "",
//           form.systemicHistory
//             ? `Systemic history: ${form.systemicHistory}`
//             : "",
//           form.familyHistory ? `Family history: ${form.familyHistory}` : "",
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
//         // Optical dispensing is intentionally handled by the
//         // independent Spectacle / Contact Lens workflows.

//         therapeutics: form.therapeutics,
//         recall: form.recall,
//       };

//       const response = await createConsultation(payload);

//       if (!response) {
//         throw new Error("Consultation could not be saved.");
//       }

//       try {
//         localStorage.removeItem(`opticare-consultation-draft-${patientId}`);
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
//           "Unable to save consultation.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const safeNavigateBack = () => {
//     if (dirty && !saving) {
//       const confirmed = window.confirm(
//         "You have unsaved changes. Leave this consultation?",
//       );
//       if (!confirmed) return;
//     }

//     navigate(`/patients/${patientId}`);
//   };

//   if (loadingPatient) {
//     return (
//       <div className="flex min-h-[65vh] items-center justify-center bg-slate-50">
//         <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-500 shadow-sm">
//           <Loader2 size={18} className="animate-spin text-blue-600" />
//           Loading patient record...
//         </div>
//       </div>
//     );
//   }

//   if (!patient) {
//     return (
//       <div className="mx-auto max-w-3xl px-3 py-8">
//         <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
//           <div className="flex min-h-[58px] items-center justify-between gap-3 px-3 py-2 sm:px-3 lg:px-4">
//             <div className="flex min-w-0 items-center gap-3">
//               <div className="min-w-0">
//                 <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-600">
//                   Clinical workspace
//                 </div>
//                 <h1 className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">
//                   New Consultation
//                 </h1>
//               </div>
//             </div>

//             <div className="flex shrink-0 items-center gap-2">
//               {dirty && consultationStarted && (
//                 <span className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[12px] font-semibold text-amber-700 md:inline-flex">
//                   <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
//                   Unsaved
//                 </span>
//               )}

//               <button
//                 type="button"
//                 onClick={handleSaveDraft}
//                 disabled={!consultationStarted || saving}
//                 className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
//                 className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
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
//           <div className="px-3 pt-3 sm:px-3 lg:px-4">
//             {error && (
//               <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
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
//               <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
//                 <Check size={14} />
//                 {success}
//               </div>
//             )}

//             {billingMessage && (
//               <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700">
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
//             className="px-3 pb-28 pt-3 sm:px-3 lg:px-4"
//           >
//             {/* =================================================
//                 VISIT CONTROL STRIP
//             ================================================== */}
//             <div className="mb-3 rounded-lg border border-slate-200 bg-white shadow-sm">
//               <div className="grid items-center gap-0 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
//                 <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
//                   <div className="mb-1 text-[12px] font-bold text-slate-500">
//                     Consultation Type <span className="text-red-500">*</span>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={changeConsultationType}
//                     className="inline-flex h-8 items-center gap-2 rounded border border-blue-300 bg-blue-50 px-3 text-[12px] font-bold text-blue-700 hover:bg-blue-100"
//                   >
//                     <Check size={13} />
//                     {selectedType.label}
//                     <ChevronDown size={13} />
//                   </button>
//                 </div>

//                 <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
//                   <div className="flex items-center justify-between gap-2">
//                     <div className="text-[12px] font-bold text-slate-500">
//                       Recall
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         updateNested("recall", "enabled", !form.recall.enabled)
//                       }
//                       className={`rounded px-2 py-1 text-[12px] font-bold ${
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
//                             updateNested("recall", "date", event.target.value)
//                           }
//                           className="h-8 w-full rounded border border-slate-200 bg-white pl-6 pr-2 text-[12px] outline-none focus:border-blue-400"
//                         />
//                       </div>

//                       <select
//                         value={form.recall.type}
//                         onChange={(event) =>
//                           updateNested("recall", "type", event.target.value)
//                         }
//                         className="h-8 min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 text-[12px] outline-none focus:border-blue-400"
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
//                     onChange={(value) => updateForm("consultationDate", value)}
//                   />
//                 </div>

//                 <div className="px-3 py-2.5">
//                   <div className="mb-1 text-[12px] font-bold text-slate-500">
//                     Optometrist
//                   </div>
//                   <div className="flex h-8 items-center justify-between rounded border border-slate-200 bg-slate-50 px-2.5 text-[12px] font-semibold text-slate-700">
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
//                 <ClinicalPanel number="01" title="Open Box" icon={FileText}>
//                   <TextArea
//                     label="Clinical entry"
//                     value={form.shortConsult.openBox}
//                     onChange={(value) =>
//                       updateNested("shortConsult", "openBox", value)
//                     }
//                     rows={14}
//                     placeholder="Enter the consultation findings, complaint, clinical comments or focused assessment..."
//                   />
//                 </ClinicalPanel>

//                 <ClinicalPanel number="02" title="Refraction" icon={Glasses}>
//                   <RefractionTable
//                     title="Refraction"
//                     data={form.refraction.final}
//                     onChange={(eye, field, value) =>
//                       updateRefractionField("final", eye, field, value)
//                     }
//                   />

//                   <div className="mt-3 grid gap-2 sm:grid-cols-3">
//                     <Input
//                       label="PD Right"
//                       value={form.refraction.pd.right}
//                       onChange={(value) =>
//                         updateDeep("refraction", "pd", "right", value)
//                       }
//                     />
//                     <Input
//                       label="PD Left"
//                       value={form.refraction.pd.left}
//                       onChange={(value) =>
//                         updateDeep("refraction", "pd", "left", value)
//                       }
//                     />
//                     <Input
//                       label="PD Total"
//                       value={form.refraction.pd.total}
//                       onChange={(value) =>
//                         updateDeep("refraction", "pd", "total", value)
//                       }
//                     />
//                   </div>
//                 </ClinicalPanel>
//               </div>
//             ) : isSpecializedConsult ? (
//               <SpecializedConsultationSection
//                 type={form.consultationType}
//                 form={form}
//                 patient={patient}
//                 age={age}
//                 onChange={updateAddon}
//               />
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
//                       onChange={(value) => updateForm("symptoms", value)}
//                       rows={3}
//                       placeholder="Enter presenting symptoms..."
//                     />

//                     <div className="mt-3 grid gap-2 md:grid-cols-2">
//                       <TextArea
//                         label="Ocular History"
//                         value={form.ocularHistory}
//                         onChange={(value) => updateForm("ocularHistory", value)}
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
//                         onChange={(value) => updateForm("allergies", value)}
//                         rows={3}
//                         placeholder="Enter allergies..."
//                       />

//                       <TextArea
//                         label="Current Medications"
//                         value={form.medications}
//                         onChange={(value) => updateForm("medications", value)}
//                         rows={3}
//                         placeholder="Enter medications..."
//                       />
//                     </div>
//                   </ClinicalPanel>

//                   <ClinicalPanel number="02" title="Visual Acuity" icon={Eye}>
//                     <VisualAcuityTable
//                       data={form.visualAcuity}
//                       onChange={(eye, field, value) =>
//                         updateDeep("visualAcuity", eye, field, value)
//                       }
//                       onNotesChange={(value) =>
//                         updateNested("visualAcuity", "notes", value)
//                       }
//                     />
//                   </ClinicalPanel>
//                 </div>

//                 {/* =================================================
//                     ROW 2
//                 ================================================== */}
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel number="03" title="Refraction" icon={Glasses}>
//                     <RefractionTabs
//                       form={{
//                         ...form,
//                         onSubjectiveSlotsChange: (slots) =>
//                           updateNested("refraction", "subjectiveSlots", slots),
//                       }}
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
//                     title="Slit Lamp Examination"
//                     icon={Eye}
//                   >
//                     <SlitLampTable
//                       data={form.slitLamp}
//                       onChange={(eye, field, value) =>
//                         updateEyeField("slitLamp", eye, field, value)
//                       }
//                     />
//                   </ClinicalPanel>
//                 </div>

//                 {/* =================================================
//                     ROW 3
//                 ================================================== */}
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="04"
//                     title="Binocular / Ocular Motility"
//                     icon={Eye}
//                   >
//                     <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-500">
//                       Detailed sensory, motor, accommodation, vergence, CISS and
//                       final binocular vision assessment is recorded in the
//                       specialist evaluation.
//                     </div>
//                     <div className="mt-3 grid gap-2 sm:grid-cols-3">
//                       <div className="rounded border border-slate-200 bg-white px-3 py-2">
//                         <div className="text-[12px] font-bold uppercase text-slate-400">
//                           Stereopsis
//                         </div>
//                         <div className="mt-1 text-[12px] font-semibold text-slate-700">
//                           {form.binocularVision.sensory.stereopsisNear ||
//                             "Not recorded"}
//                         </div>
//                       </div>
//                       <div className="rounded border border-slate-200 bg-white px-3 py-2">
//                         <div className="text-[12px] font-bold uppercase text-slate-400">
//                           Cover test
//                         </div>
//                         <div className="mt-1 text-[12px] font-semibold text-slate-700">
//                           {form.binocularVision.motor.coverDistance ||
//                             "Not recorded"}
//                         </div>
//                       </div>
//                       <div className="rounded border border-slate-200 bg-white px-3 py-2">
//                         <div className="text-[12px] font-bold uppercase text-slate-400">
//                           CISS
//                         </div>
//                         <div className="mt-1 text-[12px] font-semibold text-slate-700">
//                           {form.binocularVision.cissScore || "Not recorded"}
//                         </div>
//                       </div>
//                     </div>
//                   </ClinicalPanel>

//                   <ClinicalPanel
//                     number="07"
//                     title="Fundus Examination"
//                     icon={Eye}
//                   >
//                     <FundusTable
//                       data={form.fundus}
//                       onChange={(eye, field, value) =>
//                         updateEyeField("fundus", eye, field, value)
//                       }
//                     />
//                   </ClinicalPanel>
//                 </div>

//                 {/* =================================================
//                     ROW 4
//                 ================================================== */}
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="05"
//                     title="Additional Tests"
//                     icon={Stethoscope}
//                     action={
//                       <button
//                         type="button"
//                         onClick={addTest}
//                         className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
//                       >
//                         <Plus size={12} />
//                         Add Test
//                       </button>
//                     }
//                   >
//                     {form.additionalTests.length === 0 ? (
//                       <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-center text-[12px] text-slate-400">
//                         No additional tests
//                       </div>
//                     ) : (
//                       <div className="overflow-x-auto">
//                         <table className="w-full min-w-[650px] border-collapse text-[12px]">
//                           <thead>
//                             <tr className="bg-slate-50 text-left text-[12px] font-bold text-slate-500">
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
//                             {form.additionalTests.map((test, index) => (
//                               <tr key={index}>
//                                 <td className="border border-slate-200 p-1">
//                                   <select
//                                     value={test.name}
//                                     onChange={(event) =>
//                                       updateTest(
//                                         index,
//                                         "name",
//                                         event.target.value,
//                                       )
//                                     }
//                                     className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[12px] outline-none focus:border-blue-400"
//                                   >
//                                     {testTypes.map((type) => (
//                                       <option key={type} value={type}>
//                                         {type}
//                                       </option>
//                                     ))}
//                                   </select>
//                                 </td>
//                                 <td className="border border-slate-200 p-1">
//                                   <input
//                                     value={test.result || ""}
//                                     onChange={(event) =>
//                                       updateTest(
//                                         index,
//                                         "result",
//                                         event.target.value,
//                                       )
//                                     }
//                                     className="h-8 w-full rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
//                                   />
//                                 </td>
//                                 <td className="border border-slate-200 p-1">
//                                   <input
//                                     value={test.remarks || ""}
//                                     onChange={(event) =>
//                                       updateTest(
//                                         index,
//                                         "remarks",
//                                         event.target.value,
//                                       )
//                                     }
//                                     className="h-8 w-full rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
//                                   />
//                                 </td>
//                                 <td className="border border-slate-200 p-1 text-center">
//                                   <button
//                                     type="button"
//                                     onClick={() => removeTest(index)}
//                                     className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
//                                   >
//                                     <Trash2 size={13} />
//                                   </button>
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     )}
//                   </ClinicalPanel>

//                   <ClinicalPanel
//                     number="08"
//                     title="Diagnosis"
//                     icon={HeartPulse}
//                     action={
//                       <button
//                         type="button"
//                         onClick={addDiagnosis}
//                         className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
//                       >
//                         <Plus size={12} />
//                         Add
//                       </button>
//                     }
//                   >
//                     {form.diagnosis.length === 0 ? (
//                       <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-center text-[12px] text-slate-400">
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
//                                 updateDiagnosis(index, "condition", value)
//                               }
//                               placeholder="Search or enter diagnosis..."
//                             />
//                             <Select
//                               label="Laterality"
//                               value={item.eye}
//                               options={["OD", "OS", "OU", "N/A"]}
//                               onChange={(value) =>
//                                 updateDiagnosis(index, "eye", value)
//                               }
//                             />
//                             <Input
//                               label="Remarks"
//                               value={item.notes}
//                               onChange={(value) =>
//                                 updateDiagnosis(index, "notes", value)
//                               }
//                             />
//                             <button
//                               type="button"
//                               onClick={() => removeDiagnosis(index)}
//                               className="mt-4 flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-white text-red-500 hover:bg-red-50"
//                             >
//                               <Trash2 size={13} />
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </ClinicalPanel>
//                 </div>
//                 <div className="mt-3 grid gap-3 lg:grid-cols-2">
//                   <ClinicalPanel
//                     number="09"
//                     title="Advise / Management Plan"
//                     icon={FileText}
//                   >
//                     <div className="grid gap-2 sm:grid-cols-2">
//                       {adviceOptions.map(([key, label]) => (
//                         <label
//                           key={key}
//                           className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2 text-[12px] font-medium ${
//                             form.advice[key]
//                               ? "border-blue-200 bg-blue-50 text-blue-700"
//                               : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                           }`}
//                         >
//                           <input
//                             type="checkbox"
//                             checked={form.advice[key]}
//                             onChange={(event) =>
//                               updateNested("advice", key, event.target.checked)
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
//                           updateNested("advice", "custom", value)
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
//                     className="inline-flex h-7 items-center gap-1 rounded border border-blue-200 bg-white px-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
//                   >
//                     <Plus size={12} />
//                     Add
//                   </button>
//                 }
//               >
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[650px] border-collapse text-[12px]">
//                     <thead>
//                       <tr className="bg-slate-50 text-left text-[12px] font-bold text-slate-500">
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
//                                     event.target.value,
//                                   )
//                                 }
//                                 className="h-8 w-full rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
//                               />
//                             </td>
//                           ))}

//                           <td className="border border-slate-200 p-1 text-center">
//                             <button
//                               type="button"
//                               onClick={() => removeTherapeutic(index)}
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

//               <ClinicalPanel number="11" title="Recall" icon={CalendarDays}>
//                 <div className="grid gap-2 sm:grid-cols-2">
//                   <Input
//                     label="Recall Date"
//                     type="date"
//                     value={form.recall.date}
//                     onChange={(value) => updateNested("recall", "date", value)}
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
//                     onChange={(value) => updateNested("recall", "type", value)}
//                   />
//                 </div>

//                 <div className="mt-2">
//                   <TextArea
//                     label="Recall Letter / Message"
//                     value={form.recall.message}
//                     onChange={(value) =>
//                       updateNested("recall", "message", value)
//                     }
//                     rows={4}
//                     placeholder="Recall instruction or patient message..."
//                   />
//                 </div>
//               </ClinicalPanel>
//             </div>
//             {/* =================================================
//                 MOBILE / BOTTOM SAVE BAR
//             ================================================== */}
//             <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur lg:static lg:mt-3 lg:border lg:rounded-lg lg:shadow-sm">
//               <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-1 sm:px-2">
//                 <div className="hidden min-w-0 sm:block">
//                   <div className="truncate text-[12px] font-bold text-slate-700">
//                     {selectedType.label}
//                   </div>
//                   <div className="truncate text-[12px] text-slate-400">
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
//                     className="h-9 rounded border border-slate-300 bg-white px-3 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
//                   >
//                     Cancel
//                   </button>

//                   <button
//                     type="submit"
//                     disabled={saving}
//                     className="inline-flex h-9 items-center gap-1.5 rounded bg-blue-600 px-3 text-[12px] font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
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
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    PATIENT HEADER
// ========================================================= */

// function PatientHeader({ patient, age, previousConsultations }) {
//   return (
//     <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-3 lg:px-4">
//       <div className="grid items-center gap-0 lg:grid-cols-[1.5fr_repeat(5,1fr)]">
//         <div className="flex items-center gap-3 border-b border-slate-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3">
//           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
//             <UserRound size={22} />
//           </div>

//           <div className="min-w-0">
//             <div className="truncate text-sm font-bold text-slate-900 sm:text-base">
//               {fullName(patient) || "Unnamed Patient"}
//             </div>
//             <div className="mt-0.5 text-[12px] font-medium text-slate-500">
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

//         <PatientMini label="Gender" value={patient.gender || "—"} />

//         <PatientMini label="Phone" value={patient.phone || "—"} />

//         <PatientMini
//           label="Last Consultation"
//           value={
//             patient.lastConsultationAt
//               ? formatDate(patient.lastConsultationAt)
//               : previousConsultations?.[0]?.consultationDate
//                 ? formatDate(previousConsultations[0].consultationDate)
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
//       <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
//         {label}
//       </div>
//       <div className="mt-1 truncate text-[12px] font-semibold text-slate-700">
//         {value || "—"}
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    CONSULTATION TYPE MODAL
// ========================================================= */

// function ConsultationTypeModal({ currentType, onSelect, onClose, canClose }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm">
//       <div className="w-full max-w-2xl rounded-xl bg-white p-3 shadow-xl">
//         <div className="mb-3 flex items-center justify-between">
//           <h2 className="text-lg font-bold text-slate-900">
//             Select Consultation Type
//           </h2>
//           {canClose && (
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-slate-400 hover:text-slate-600"
//               aria-label="Close consultation type selector"
//             >
//               <X size={20} />
//             </button>
//           )}
//         </div>

//         <div className="grid gap-3 sm:grid-cols-2">
//           {consultationTypes.map((item) => {
//             const Icon = item.icon;
//             const isSelected = currentType === item.value;

//             return (
//               <button
//                 key={item.value}
//                 type="button"
//                 onClick={() => onSelect(item.value)}
//                 className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
//                   isSelected
//                     ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
//                     : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
//                 }`}
//               >
//                 <div
//                   className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
//                     isSelected
//                       ? "bg-blue-600 text-white"
//                       : "bg-slate-100 text-slate-600"
//                   }`}
//                 >
//                   <Icon size={18} />
//                 </div>
//                 <div>
//                   <div className="font-bold text-slate-900">{item.label}</div>
//                   <div className="mt-0.5 text-xs text-slate-500">
//                     {item.description}
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    CLINICAL PANEL
// ========================================================= */

// function ClinicalPanel({ number, title, icon: Icon, action, children }) {
//   return (
//     <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
//       <div className="flex min-h-[34px] items-center justify-between gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
//         <div className="flex items-center gap-2">
//           <span className="text-[12px] font-bold text-blue-700">{number}.</span>
//           <Icon size={13} className="text-blue-600" />
//           <h2 className="text-[12px] font-bold text-blue-700">{title}</h2>
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

//   const subjectiveSlots =
//     form.refraction.subjectiveSlots?.length === 4
//       ? form.refraction.subjectiveSlots
//       : Array.from(
//           { length: 4 },
//           (_, index) =>
//             form.refraction.subjectiveSlots?.[index] || {
//               right: emptyEye(),
//               left: emptyEye(),
//             },
//         );

//   const updateSubjectiveSlot = (slotIndex, eye, field, value) => {
//     const nextSlots = subjectiveSlots.map((slot, index) =>
//       index === slotIndex
//         ? {
//             ...slot,
//             [eye]: {
//               ...slot[eye],
//               [field]: value,
//             },
//           }
//         : slot,
//     );

//     // Keep the existing single subjectiveRx object synchronized with
//     // the most recently edited subjective table so the existing API
//     // contract continues to work.
//     onChange("subjective", eye, field, value);

//     if (typeof form.onSubjectiveSlotsChange === "function") {
//       form.onSubjectiveSlotsChange(nextSlots);
//     }
//   };

//   return (
//     <div>
//       <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
//         {tabs.map(([value, label]) => (
//           <button
//             key={value}
//             type="button"
//             onClick={() => setActive(value)}
//             className={`h-8 rounded border text-[12px] font-bold transition ${
//               active === value
//                 ? "border-blue-600 bg-blue-600 text-white"
//                 : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//             }`}
//           >
//             {label}
//           </button>
//         ))}
//       </div>

//       <div className="mt-2">
//         {active === "subjective" ? (
//           <div className="grid gap-3 xl:grid-cols-2">
//             {subjectiveSlots.map((slot, index) => (
//               <div
//                 key={index}
//                 className="overflow-hidden rounded border border-blue-100 bg-white"
//               >
//                 <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-2.5 py-1.5">
//                   <div className="text-[12px] font-bold text-blue-700">
//                     Subjective Refraction {index + 1}
//                   </div>
//                   <span className="text-[12px] font-medium text-slate-500">
//                     Trial {index + 1}
//                   </span>
//                 </div>

//                 <div className="overflow-x-auto p-1.5">
//                   <RefractionTable
//                     data={slot}
//                     onChange={(eye, field, value) =>
//                       updateSubjectiveSlot(index, eye, field, value)
//                     }
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <RefractionTable
//               title={tabs.find(([value]) => value === active)?.[1]}
//               data={form.refraction[active]}
//               onChange={(eye, field, value) =>
//                 onChange(active, eye, field, value)
//               }
//             />
//           </div>
//         )}
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
//     <table className="w-full min-w-[760px] border-collapse text-[12px]">
//       <thead>
//         <tr className="bg-slate-50 text-left text-[12px] font-bold text-slate-600">
//           <th className="w-20 border border-slate-200 px-2 py-2">Eye</th>
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
//             <th className="border border-slate-200 bg-white px-2 py-1.5 text-left text-[12px] font-semibold text-slate-700">
//               {label}
//             </th>

//             {fields.map(([field]) => (
//               <td key={field} className="border border-slate-200 p-1">
//                 <input
//                   value={data?.[eye]?.[field] || ""}
//                   onChange={(event) => onChange(eye, field, event.target.value)}
//                   className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-center text-[12px] outline-none focus:border-blue-400"
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
//       <table className="w-full min-w-[580px] border-collapse text-[12px]">
//         <thead>
//           <tr className="bg-slate-50">
//             <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[12px] font-bold text-slate-600">
//               Parameter
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
//               Right (OD)
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
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
//                       onChange(eye, field, event.target.value)
//                     }
//                     className="h-7 w-full rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
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
//       <table className="w-full min-w-[580px] border-collapse text-[12px]">
//         <thead>
//           <tr className="bg-slate-50">
//             <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[12px] font-bold text-slate-600">
//               Parameter
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
//               Right (OD)
//             </th>
//             <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
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
//                       onChange(eye, field, event.target.value)
//                     }
//                     className="h-7 w-full rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
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
//     <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
//       <div className="flex min-h-[34px] items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
//         <div className="flex items-center gap-2">
//           <span className="text-[12px] font-bold text-blue-700">09.</span>
//           <Glasses size={13} className="text-blue-600" />
//           <h2 className="text-[12px] font-bold text-blue-700">
//             Dispensing (Spectacles)
//           </h2>
//         </div>

//         <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
//           <input
//             type="checkbox"
//             checked={form.dispensing.spectacleRequired}
//             onChange={(event) =>
//               updateNested(
//                 "dispensing",
//                 "spectacleRequired",
//                 event.target.checked,
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
//             onChange={(value) => updateNested("dispensing", "frameCode", value)}
//           />

//           <Input
//             label="Description"
//             value={form.dispensing.frameDescription}
//             onChange={(value) =>
//               updateNested("dispensing", "frameDescription", value)
//             }
//           />

//           <MoneyInput
//             label="To Reorder"
//             value={form.dispensing.toReorder}
//             onChange={(value) => updateNested("dispensing", "toReorder", value)}
//           />

//           <MoneyInput
//             label="Fr Discount"
//             value={form.dispensing.frameDiscount}
//             onChange={(value) =>
//               updateNested("dispensing", "frameDiscount", value)
//             }
//           />
//         </div>

//         <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
//           <Input
//             label="Frame Size"
//             value={form.dispensing.frameSize}
//             onChange={(value) => updateNested("dispensing", "frameSize", value)}
//           />

//           <Input
//             label="Depth"
//             value={form.dispensing.depth}
//             onChange={(value) => updateNested("dispensing", "depth", value)}
//           />

//           <Input
//             label="ED"
//             value={form.dispensing.ed}
//             onChange={(value) => updateNested("dispensing", "ed", value)}
//           />

//           <Select
//             label="Type"
//             value={form.dispensing.frameType}
//             options={["MM", "Plastic", "Metal", "Acetate", "Other"]}
//             onChange={(value) => updateNested("dispensing", "frameType", value)}
//           />

//           <Input
//             label="Other"
//             value={form.dispensing.other}
//             onChange={(value) => updateNested("dispensing", "other", value)}
//           />

//           <MoneyInput
//             label="Fitting ₹"
//             value={form.dispensing.fitting}
//             onChange={(value) => updateNested("dispensing", "fitting", value)}
//           />

//           <MoneyInput
//             label="Frame Discount"
//             value={form.dispensing.overallDiscount}
//             onChange={(value) =>
//               updateNested("dispensing", "overallDiscount", value)
//             }
//           />
//         </div>

//         {/* LENS ORDER TABLE */}
//         <div className="mt-3 overflow-x-auto rounded border border-slate-200">
//           <table className="w-full min-w-[1350px] border-collapse text-[12px]">
//             <thead>
//               <tr className="bg-slate-50 text-center font-bold text-slate-600">
//                 <th className="border border-slate-200 px-2 py-2">Eye</th>
//                 <th className="border border-slate-200 px-2 py-2">Lens Code</th>
//                 <th className="min-w-[180px] border border-slate-200 px-2 py-2">
//                   Lens Description
//                   <br />
//                   <span className="font-normal">(S = Stock, G = Grind)</span>
//                 </th>
//                 <th className="border border-slate-200 px-2 py-2">Lens Size</th>
//                 <th className="border border-slate-200 px-2 py-2">Seg Size</th>
//                 <th className="border border-slate-200 px-2 py-2">Seg Ht</th>
//                 <th className="border border-slate-200 px-2 py-2">OC Ht</th>
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
//                 <th className="border border-slate-200 px-2 py-2">BC</th>
//                 <th className="border border-slate-200 px-2 py-2">Lens Sup</th>
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
//                         updateLens(index, "lensCode", event.target.value)
//                       }
//                       className="h-8 w-full rounded border border-slate-200 bg-white px-1.5 text-[12px] outline-none focus:border-blue-400"
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
//                         updateLens(index, "lensDescription", event.target.value)
//                       }
//                       className="h-8 w-full rounded border border-slate-200 px-2 text-[12px] text-blue-600 outline-none focus:border-blue-400"
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
//                     <td key={field} className="border border-slate-200 p-1">
//                       <input
//                         value={row[field] || ""}
//                         onChange={(event) =>
//                           updateLens(index, field, event.target.value)
//                         }
//                         placeholder={placeholder}
//                         className="h-8 w-full rounded border border-slate-200 px-1.5 text-center text-[12px] outline-none focus:border-blue-400"
//                       />
//                     </td>
//                   ))}

//                   <td className="border border-slate-200 p-1">
//                     <input
//                       value={row.lensSupplier}
//                       onChange={(event) =>
//                         updateLens(index, "lensSupplier", event.target.value)
//                       }
//                       placeholder="ESS"
//                       className="h-8 w-full rounded border border-slate-200 px-1.5 text-center text-[12px] outline-none focus:border-blue-400"
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
//                           event.target.value,
//                         )
//                       }
//                       className="h-8 w-full rounded border border-slate-200 px-1.5 text-[12px] outline-none focus:border-blue-400"
//                     />
//                   </td>

//                   <td className="border border-slate-200 p-1">
//                     <div className="relative">
//                       <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
//                         ₹
//                       </span>
//                       <input
//                         type="number"
//                         min="0"
//                         value={row.lensPrice}
//                         onChange={(event) =>
//                           updateLens(index, "lensPrice", event.target.value)
//                         }
//                         className="h-8 w-full rounded border border-slate-200 pl-4 pr-1.5 text-right text-[12px] outline-none focus:border-blue-400"
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
//             className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-white px-3 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
//           >
//             <Plus size={12} />
//             Add Lens Row
//           </button>

//           <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-4">
//             <MoneySummary label="Frame" value={frameValue} />
//             <MoneySummary label="Lenses" value={lensTotal} />
//             <MoneySummary label="Total" value={grandTotal} emphasized />
//             <div className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5">
//               <div className="text-[12px] font-bold uppercase text-slate-400">
//                 GST
//               </div>
//               <input
//                 value={form.dispensing.gst}
//                 onChange={(event) =>
//                   updateNested("dispensing", "gst", event.target.value)
//                 }
//                 placeholder="GST"
//                 className="mt-0.5 h-6 w-full bg-transparent text-right text-[12px] font-bold outline-none"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
//           <Input
//             label="Bill No"
//             value={form.dispensing.billNo}
//             onChange={(value) => updateNested("dispensing", "billNo", value)}
//           />

//           <button
//             type="button"
//             onClick={onCreateBill}
//             className="mt-3 inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-50"
//           >
//             Create Bill
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// }

// function MoneySummary({ label, value, emphasized = false }) {
//   return (
//     <div
//       className={`rounded border px-3 py-1.5 ${
//         emphasized
//           ? "border-blue-200 bg-blue-50"
//           : "border-slate-200 bg-slate-50"
//       }`}
//     >
//       <div className="text-[12px] font-bold uppercase text-slate-400">
//         {label}
//       </div>
//       <div
//         className={`mt-0.5 text-right text-[12px] font-bold ${
//           emphasized ? "text-blue-700" : "text-slate-700"
//         }`}
//       >
//         ₹ {Number(value || 0).toFixed(2)}
//       </div>
//     </div>
//   );
// }

// function MoneyInput({ label, value, onChange }) {
//   return (
//     <label className="block">
//       <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>
//       <div className="relative">
//         <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
//           ₹
//         </span>
//         <input
//           type="number"
//           min="0"
//           value={value || ""}
//           onChange={(event) => onChange(event.target.value)}
//           className="h-8 w-full rounded border border-slate-200 bg-white pl-4 pr-2 text-[12px] outline-none focus:border-blue-400"
//         />
//       </div>
//     </label>
//   );
// }

// function ContactLensesSection({ contactLenses, onChange }) {
//   const updateLensField = (field, value) => {
//     onChange({
//       ...contactLenses,
//       [field]: value,
//     });
//   };

//   const updateWearHistory = (field, value) => {
//     onChange({
//       ...contactLenses,
//       wearHistory: {
//         ...contactLenses.wearHistory,
//         [field]: value,
//       },
//     });
//   };

//   const updateEye = (eyeKey, field, value) => {
//     onChange({
//       ...contactLenses,
//       [eyeKey]: {
//         ...contactLenses[eyeKey],
//         [field]: value,
//       },
//     });
//   };

//   const updateInstruction = (field, value) => {
//     onChange({
//       ...contactLenses,
//       instructions: {
//         ...contactLenses.instructions,
//         [field]: value,
//       },
//     });
//   };

//   return (
//     <div className="space-y-3">
//       <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-3">
//         <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
//           <div className="flex items-center gap-2">
//             <Glasses className="text-blue-600" size={20} />
//             <h2 className="text-base font-bold text-slate-900 sm:text-lg">
//               Comprehensive Contact Lens Clinical Evaluation Sheet
//             </h2>
//           </div>
//           <div
//             className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
//             aria-label="Contact lens types selected for this consultation"
//           >
//             {[
//               { key: "soft", label: "Soft" },
//               { key: "rgp", label: "RGP" },
//               { key: "scleral", label: "Scleral" },
//             ].map(({ key, label }) => (
//               <label
//                 key={key}
//                 className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap"
//               >
//                 <input
//                   type="checkbox"
//                   checked={Boolean(contactLenses.selectedLensTypes?.[key])}
//                   onChange={(event) =>
//                     onChange({
//                       ...contactLenses,
//                       selectedLensTypes: {
//                         ...(contactLenses.selectedLensTypes || {}),
//                         [key]: event.target.checked,
//                       },
//                     })
//                   }
//                   className="h-3.5 w-3.5 rounded border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
//                 />
//                 <span>{label}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         {/* 1. CLINICAL HISTORY & BASELINE WEAR */}
//         <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
//           <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
//             1. Clinical History & Baseline Wear
//           </h3>
//           <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Primary Indication
//               </label>
//               <select
//                 value={contactLenses.primaryIndication}
//                 onChange={(e) => updateLensField("primaryIndication", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               >
//                 <option value="refractive">Refractive Error</option>
//                 <option value="keratoconus">Keratoconus / Ectasia</option>
//                 <option value="post_surgical">Post-Surgical / Graft</option>
//                 <option value="ocular_surface">Ocular Surface Disease</option>
//                 <option value="presbyopia">Presbyopia</option>
//               </select>
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Previous Lens Type / Material
//               </label>
//               <input
//                 type="text"
//                 placeholder="e.g. Biofinity / Boston XO"
//                 value={contactLenses.wearHistory.lensTypeMaterial}
//                 onChange={(e) => updateWearHistory("lensTypeMaterial", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Wear Schedule / Replacement
//               </label>
//               <input
//                 type="text"
//                 placeholder="Daily / Monthly"
//                 value={contactLenses.wearHistory.wearSchedule}
//                 onChange={(e) => updateWearHistory("wearSchedule", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Current Care Solution
//               </label>
//               <input
//                 type="text"
//                 placeholder="e.g. Biotrue / AOSept"
//                 value={contactLenses.careSolution}
//                 onChange={(e) => updateLensField("careSolution", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Wear Time (hrs/day)
//               </label>
//               <input
//                 type="text"
//                 placeholder="Current WT / Avg WT"
//                 value={contactLenses.wearHistory.wearTimeHours}
//                 onChange={(e) => updateWearHistory("wearTimeHours", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Comfort OD (0-10)
//               </label>
//               <input
//                 type="number"
//                 min="0"
//                 max="10"
//                 placeholder="10"
//                 value={contactLenses.wearHistory.comfortOD}
//                 onChange={(e) => updateWearHistory("comfortOD", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">
//                 Comfort OS (0-10)
//               </label>
//               <input
//                 type="number"
//                 min="0"
//                 max="10"
//                 placeholder="10"
//                 value={contactLenses.wearHistory.comfortOS}
//                 onChange={(e) => updateWearHistory("comfortOS", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* EYE-BY-EYE EVALUATION (OD & OS) */}
//         {["right", "left"].map((eyeKey) => {
//           const eyeData = contactLenses[eyeKey];
//           const isRight = eyeKey === "right";
//           const label = isRight ? "Right Eye (OD)" : "Left Eye (OS)";
//           const badgeColor = isRight ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";

//           return (
//             <div key={eyeKey} className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
//               <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
//                 <h3 className="text-sm font-bold text-slate-900">{label}</h3>
//                 <span className={`rounded px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
//                   {isRight ? "OD" : "OS"}
//                 </span>
//               </div>

//               {/* LENS TYPE SELECTOR FOR THIS EYE */}
//               <div className="mb-3 grid gap-3 sm:grid-cols-3">
//                 <div>
//                   <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-600">
//                     Lens Category
//                   </label>
//                   <select
//                     value={eyeData.lensCategory}
//                     onChange={(e) => updateEye(eyeKey, "lensCategory", e.target.value)}
//                     className="w-full rounded border border-blue-300 bg-blue-50/50 px-2.5 py-1.5 text-xs font-semibold text-blue-900 focus:border-blue-500 focus:outline-none"
//                   >
//                     <option value="soft">Soft Contact Lens</option>
//                     <option value="rgp">Corneal RGP Lens</option>
//                     <option value="scleral">Scleral Lens</option>
//                   </select>
//                 </div>
//               </div>

//               {/* TOPOGRAPHY / KERATOMETRY & OCULAR SURFACE */}
//               <div className="mb-3 rounded bg-slate-50 p-3">
//                 <h4 className="mb-2 text-xs font-bold text-slate-700">
//                   Corneal Topography / Keratometry & Anterior Segment
//                 </h4>
//                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Flat K / Steep K</label>
//                     <div className="flex gap-1">
//                       <input
//                         type="text"
//                         placeholder="Flat K"
//                         value={eyeData.flatK}
//                         onChange={(e) => updateEye(eyeKey, "flatK", e.target.value)}
//                         className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Steep K"
//                         value={eyeData.steepK}
//                         onChange={(e) => updateEye(eyeKey, "steepK", e.target.value)}
//                         className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">K Axis / Ectasia Type</label>
//                     <div className="flex gap-1">
//                       <input
//                         type="text"
//                         placeholder="Axis"
//                         value={eyeData.kAxis}
//                         onChange={(e) => updateEye(eyeKey, "kAxis", e.target.value)}
//                         className="w-1/3 rounded border border-slate-300 px-2 py-1 text-xs"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Ectasia/Cone"
//                         value={eyeData.ectasiaConeType}
//                         onChange={(e) => updateEye(eyeKey, "ectasiaConeType", e.target.value)}
//                         className="w-2/3 rounded border border-slate-300 px-2 py-1 text-xs"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">HVID / Pupil Size</label>
//                     <div className="flex gap-1">
//                       <input
//                         type="text"
//                         placeholder="HVID (mm)"
//                         value={eyeData.hvid}
//                         onChange={(e) => updateEye(eyeKey, "hvid", e.target.value)}
//                         className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Pupil (mm)"
//                         value={eyeData.pupilPhotopic}
//                         onChange={(e) => updateEye(eyeKey, "pupilPhotopic", e.target.value)}
//                         className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Tear Film / TBUT (sec)</label>
//                     <input
//                       type="text"
//                       placeholder="TBUT sec"
//                       value={eyeData.tbutSec}
//                       onChange={(e) => updateEye(eyeKey, "tbutSec", e.target.value)}
//                       className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>

//                   <div className="lg:col-span-2">
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Cornea & Conjunctiva Health</label>
//                     <input
//                       type="text"
//                       placeholder="Staining, scars, neovascularization, hyperemia..."
//                       value={eyeData.corneaStatus}
//                       onChange={(e) => updateEye(eyeKey, "corneaStatus", e.target.value)}
//                       className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>

//                   <div className="lg:col-span-2">
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Lids & Lashes (MGD/Bleph)</label>
//                     <input
//                       type="text"
//                       placeholder="Lid margin, meibomian glands..."
//                       value={eyeData.lidsLashes}
//                       onChange={(e) => updateEye(eyeKey, "lidsLashes", e.target.value)}
//                       className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* TRIAL LENS PARAMETERS */}
//               <div className="mb-3 rounded border border-slate-200 p-3">
//                 <h4 className="mb-2 text-xs font-bold text-slate-700">Trial Lens Parameters</h4>
//                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Brand / Material / Dk</label>
//                     <input
//                       type="text"
//                       placeholder="e.g. Zenlens / Boston XO2"
//                       value={eyeData.brandMaterialDk}
//                       onChange={(e) => updateEye(eyeKey, "brandMaterialDk", e.target.value)}
//                       className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>

//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Base Curve (BC) / Sag Depth</label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 8.6 mm / 4200 μm"
//                       value={eyeData.baseCurveSag}
//                       onChange={(e) => updateEye(eyeKey, "baseCurveSag", e.target.value)}
//                       className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>

//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Overall Diameter (OAD)</label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 14.2 / 16.5 mm"
//                       value={eyeData.overallDiameter}
//                       onChange={(e) => updateEye(eyeKey, "overallDiameter", e.target.value)}
//                       className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>

//                   <div>
//                     <label className="mb-1 block text-[12px] font-medium text-slate-600">Power (Sph / Cyl / Axis)</label>
//                     <div className="flex gap-1">
//                       <input
//                         type="text"
//                         placeholder="Sph"
//                         value={eyeData.powerSph}
//                         onChange={(e) => updateEye(eyeKey, "powerSph", e.target.value)}
//                         className="w-1/3 rounded border border-slate-300 px-1.5 py-1 text-xs"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Cyl"
//                         value={eyeData.powerCyl}
//                         onChange={(e) => updateEye(eyeKey, "powerCyl", e.target.value)}
//                         className="w-1/3 rounded border border-slate-300 px-1.5 py-1 text-xs"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Axis"
//                         value={eyeData.powerAxis}
//                         onChange={(e) => updateEye(eyeKey, "powerAxis", e.target.value)}
//                         className="w-1/3 rounded border border-slate-300 px-1.5 py-1 text-xs"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* DYNAMIC FIT EVALUATION */}
//               <div className="mb-3 rounded border border-blue-100 bg-blue-50/30 p-3">
//                 <h4 className="mb-2 text-xs font-bold text-blue-900">
//                   Fitting Assessment ({eyeData.lensCategory.toUpperCase()})
//                 </h4>

//                 {eyeData.lensCategory === "soft" && (
//                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Centration</label>
//                       <select
//                         value={eyeData.softCentration}
//                         onChange={(e) => updateEye(eyeKey, "softCentration", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="centered">Centered</option>
//                         <option value="decentered">Decentered</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Movement with Blink</label>
//                       <select
//                         value={eyeData.softMovement}
//                         onChange={(e) => updateEye(eyeKey, "softMovement", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="optimal">Optimal (0.2–0.5mm)</option>
//                         <option value="tight">Tight (&lt; 0.2mm)</option>
//                         <option value="loose">Loose (&gt; 0.5mm)</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Push-Up Test</label>
//                       <select
//                         value={eyeData.softPushUp}
//                         onChange={(e) => updateEye(eyeKey, "softPushUp", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="normal">Normal (45–50%)</option>
//                         <option value="tight">Slow Recovery (Tight)</option>
//                         <option value="loose">Instant Recovery (Loose)</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Lag</label>
//                       <select
//                         value={eyeData.softLag}
//                         onChange={(e) => updateEye(eyeKey, "softLag", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="normal">Normal</option>
//                         <option value="excessive">Excessive</option>
//                         <option value="minimal">Minimal</option>
//                       </select>
//                     </div>
//                   </div>
//                 )}

//                 {eyeData.lensCategory === "rgp" && (
//                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Fluorescein Pattern (Apical)</label>
//                       <select
//                         value={eyeData.rgpApicalPattern}
//                         onChange={(e) => updateEye(eyeKey, "rgpApicalPattern", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="alignment">Parallel / Alignment</option>
//                         <option value="clearance">Apical Clearance (Steep)</option>
//                         <option value="touch">Apical Touch (Flat)</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Edge Lift / Clearance</label>
//                       <select
//                         value={eyeData.rgpEdgeLift}
//                         onChange={(e) => updateEye(eyeKey, "rgpEdgeLift", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="optimal">Optimal (0.3–0.5mm)</option>
//                         <option value="narrow">Narrow / Tight</option>
//                         <option value="excessive">Excessive / Wide</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Centration & Dynamic Movement</label>
//                       <select
//                         value={eyeData.rgpCentration}
//                         onChange={(e) => updateEye(eyeKey, "rgpCentration", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="centered">Centered / Good Movement</option>
//                         <option value="high_riding">High-Riding</option>
//                         <option value="low_riding">Low-Riding</option>
//                       </select>
//                     </div>
//                   </div>
//                 )}

//                 {eyeData.lensCategory === "scleral" && (
//                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Central Vault Clearance (μm)</label>
//                       <div className="flex gap-1">
//                         <input
//                           type="text"
//                           placeholder="Initial μm"
//                           value={eyeData.scleralCentralVaultInitial}
//                           onChange={(e) => updateEye(eyeKey, "scleralCentralVaultInitial", e.target.value)}
//                           className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                         />
//                         <input
//                           type="text"
//                           placeholder="Settled μm"
//                           value={eyeData.scleralCentralVaultSettlement}
//                           onChange={(e) => updateEye(eyeKey, "scleralCentralVaultSettlement", e.target.value)}
//                           className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                         />
//                       </div>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Limbal Clearance</label>
//                       <select
//                         value={eyeData.scleralLimbalClearance}
//                         onChange={(e) => updateEye(eyeKey, "scleralLimbalClearance", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="adequate">Adequate (~50–100μm)</option>
//                         <option value="bearing">Limbal Bearing</option>
//                         <option value="high_vault">High Vault / Stagnation</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="mb-1 block text-[12px] font-medium text-slate-600">Landing Zone Alignment</label>
//                       <select
//                         value={eyeData.scleralLandingZone}
//                         onChange={(e) => updateEye(eyeKey, "scleralLandingZone", e.target.value)}
//                         className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                       >
//                         <option value="alignment">Alignment</option>
//                         <option value="impingement">Impingement / Compression</option>
//                         <option value="blanching">Vessel Blanching</option>
//                         <option value="edge_lift">Edge Lift</option>
//                       </select>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* OVER-REFRACTION & FINAL VA */}
//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                 <div>
//                   <label className="mb-1 block text-[12px] font-medium text-slate-600">Over-Refraction Sph</label>
//                   <input
//                     type="text"
//                     placeholder="e.g. +0.50"
//                     value={eyeData.overRefractionSph}
//                     onChange={(e) => updateEye(eyeKey, "overRefractionSph", e.target.value)}
//                     className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-[12px] font-medium text-slate-600">Over-Refraction Cyl / Axis</label>
//                   <div className="flex gap-1">
//                     <input
//                       type="text"
//                       placeholder="Cyl"
//                       value={eyeData.overRefractionCyl}
//                       onChange={(e) => updateEye(eyeKey, "overRefractionCyl", e.target.value)}
//                       className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Axis"
//                       value={eyeData.overRefractionAxis}
//                       onChange={(e) => updateEye(eyeKey, "overRefractionAxis", e.target.value)}
//                       className="w-1/2 rounded border border-slate-300 px-2 py-1 text-xs"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-[12px] font-medium text-slate-600">Final Aided VA</label>
//                   <input
//                     type="text"
//                     placeholder="e.g. 6/6 (20/20)"
//                     value={eyeData.finalAidedVA}
//                     onChange={(e) => updateEye(eyeKey, "finalAidedVA", e.target.value)}
//                     className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
//                   />
//                 </div>
//               </div>
//             </div>
//           );
//         })}

//         {/* FINAL ORDER & INSTRUCTIONS */}
//         <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
//           <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
//             5. Final Order Parameters & Patient Instructions
//           </h3>

//           <div className="grid gap-3 sm:grid-cols-2">
//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">Final Lens Order Parameters (OD)</label>
//               <textarea
//                 rows={2}
//                 placeholder="OD BC, Dia, Power, Sag, Toricity..."
//                 value={contactLenses.finalOrderOD}
//                 onChange={(e) => updateLensField("finalOrderOD", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="mb-1 block text-[12px] font-semibold text-slate-600">Final Lens Order Parameters (OS)</label>
//               <textarea
//                 rows={2}
//                 placeholder="OS BC, Dia, Power, Sag, Toricity..."
//                 value={contactLenses.finalOrderOS}
//                 onChange={(e) => updateLensField("finalOrderOS", e.target.value)}
//                 className="w-full rounded border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
//               />
//             </div>
//           </div>

//           <div className="mt-3 grid gap-3 sm:grid-cols-3">
//             <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
//               <input
//                 type="checkbox"
//                 checked={contactLenses.instructions.insertionRemovalVerified}
//                 onChange={(e) => updateInstruction("insertionRemovalVerified", e.target.checked)}
//                 className="rounded border-slate-300 text-blue-600"
//               />
//               Insertion & Removal Verified
//             </label>

//             <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
//               <input
//                 type="checkbox"
//                 checked={contactLenses.instructions.noTapWaterWarning}
//                 onChange={(e) => updateInstruction("noTapWaterWarning", e.target.checked)}
//                 className="rounded border-slate-300 text-blue-600"
//               />
//               No Tap Water Warning Given
//             </label>

//             <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
//               <input
//                 type="checkbox"
//                 checked={contactLenses.instructions.bubbleTroubleshooting}
//                 onChange={(e) => updateInstruction("bubbleTroubleshooting", e.target.checked)}
//                 className="rounded border-slate-300 text-blue-600"
//               />
//               Scleral Bubble Troubleshooting Checked
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    SPECIALIZED CONSULTATION WORKFLOW
// ========================================================= */

// function SpecializedConsultationSection({
//   type,
//   form,
//   patient,
//   age,
//   onChange,
// }) {
//   const item = consultationTypes.find((entry) => entry.value === type);

//   if (!item) return null;

//   const Icon = item.icon;

//   return (
//     <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3 py-2.5">
//         <Icon size={14} className="text-blue-600" />
//         <div>
//           <div className="text-[12px] font-bold uppercase tracking-wider text-blue-600">
//             Consultation Type
//           </div>
//           <h2 className="text-[12px] font-bold text-blue-700">{item.label}</h2>
//         </div>
//       </div>

//       <div className="p-3">
//         {type === "contact_lenses" && (
//           <ContactLensesSection
//             contactLenses={form.contactLenses}
//             onChange={(updatedLenses) =>
//               onChange("contactLenses", "__replace", updatedLenses)
//             }
//           />
//         )}

//         {type === "binocular_vision" && (
//           <div className="space-y-3">
//             <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[12px] leading-5 text-blue-800">
//               <strong>Binocular Vision Evaluation.</strong> Record the dedicated
//               binocular, accommodative and vergence assessment for this
//               consultation.
//             </div>

//             <ClinicalPanel
//               number="01"
//               title="Date / Time / Work-up done by"
//               icon={CalendarDays}
//             >
//               <div className="grid gap-3 md:grid-cols-3">
//                 <Input
//                   label="Date"
//                   type="date"
//                   value={form.binocularVision.date}
//                   onChange={(value) =>
//                     onChange("binocularVision", "date", value)
//                   }
//                 />
//                 <Input
//                   label="Time"
//                   type="time"
//                   value={form.binocularVision.time}
//                   onChange={(value) =>
//                     onChange("binocularVision", "time", value)
//                   }
//                 />
//                 <Input
//                   label="Work-up done by"
//                   value={form.binocularVision.workUpBy}
//                   onChange={(value) =>
//                     onChange("binocularVision", "workUpBy", value)
//                   }
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel number="02" title="Patient details" icon={UserRound}>
//               <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
//                 <Input
//                   label="Name"
//                   value={fullName(patient) || "—"}
//                   onChange={() => {}}
//                 />
//                 <Input
//                   label="Age / Gender"
//                   value={`${age ?? "—"} / ${patient?.gender || "—"}`}
//                   onChange={() => {}}
//                 />
//                 <Input
//                   label="Occupation"
//                   value={form.binocularVision.occupation}
//                   onChange={(value) =>
//                     onChange("binocularVision", "occupation", value)
//                   }
//                 />
//                 <Input
//                   label="Reg. No"
//                   value={
//                     form.binocularVision.regNo || patient?.patientNumber || ""
//                   }
//                   onChange={(value) =>
//                     onChange("binocularVision", "regNo", value)
//                   }
//                 />
//                 <Input
//                   label="Phone"
//                   value={form.binocularVision.phone || patient?.phone || ""}
//                   onChange={(value) =>
//                     onChange("binocularVision", "phone", value)
//                   }
//                 />
//                 <Input
//                   label="Email"
//                   value={form.binocularVision.email || patient?.email || ""}
//                   onChange={(value) =>
//                     onChange("binocularVision", "email", value)
//                   }
//                 />
//                 <Input
//                   label="Place"
//                   value={form.binocularVision.place}
//                   onChange={(value) =>
//                     onChange("binocularVision", "place", value)
//                   }
//                 />
//               </div>
//               <div className="mt-3">
//                 <TextArea
//                   label="Chief complaints"
//                   value={form.binocularVision.chiefComplaints}
//                   onChange={(value) =>
//                     onChange("binocularVision", "chiefComplaints", value)
//                   }
//                   rows={4}
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel number="05" title="Refraction" icon={Glasses}>
//               <div className="grid gap-3 md:grid-cols-2">
//                 <Input
//                   label="OD — Sphere / Cylinder / Axis / VA"
//                   value={
//                     form.refraction.final.right
//                       ? [
//                           form.refraction.final.right.sphere,
//                           form.refraction.final.right.cylinder,
//                           form.refraction.final.right.axis,
//                           form.refraction.final.right.va,
//                         ]
//                           .filter(Boolean)
//                           .join(" / ")
//                       : ""
//                   }
//                   onChange={() => {}}
//                 />
//                 <Input
//                   label="OS — Sphere / Cylinder / Axis / VA"
//                   value={
//                     form.refraction.final.left
//                       ? [
//                           form.refraction.final.left.sphere,
//                           form.refraction.final.left.cylinder,
//                           form.refraction.final.left.axis,
//                           form.refraction.final.left.va,
//                         ]
//                           .filter(Boolean)
//                           .join(" / ")
//                       : ""
//                   }
//                   onChange={() => {}}
//                 />
//               </div>
//               <div className="mt-3">
//                 <TextArea
//                   label="Note"
//                   value={form.binocularVision.refractionNote}
//                   onChange={(value) =>
//                     onChange("binocularVision", "refractionNote", value)
//                   }
//                   rows={3}
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel number="09" title="Sensory Evaluation" icon={Eye}>
//               <div className="grid gap-3 md:grid-cols-2">
//                 <Input
//                   label="Stereopsis (Near)"
//                   value={form.binocularVision.sensory.stereopsisNear}
//                   onChange={(value) =>
//                     onChange("binocularVision", "sensory", {
//                       ...form.binocularVision.sensory,
//                       stereopsisNear: value,
//                     })
//                   }
//                 />
//                 <Input
//                   label="WFDT — Distance"
//                   value={form.binocularVision.sensory.wfdtDistance}
//                   onChange={(value) =>
//                     onChange("binocularVision", "sensory", {
//                       ...form.binocularVision.sensory,
//                       wfdtDistance: value,
//                     })
//                   }
//                 />
//                 <Input
//                   label="WFDT — Intermediate"
//                   value={form.binocularVision.sensory.wfdtIntermediate}
//                   onChange={(value) =>
//                     onChange("binocularVision", "sensory", {
//                       ...form.binocularVision.sensory,
//                       wfdtIntermediate: value,
//                     })
//                   }
//                 />
//                 <Input
//                   label="WFDT — Near"
//                   value={form.binocularVision.sensory.wfdtNear}
//                   onChange={(value) =>
//                     onChange("binocularVision", "sensory", {
//                       ...form.binocularVision.sensory,
//                       wfdtNear: value,
//                     })
//                   }
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel number="09A" title="Motor Evaluation" icon={Eye}>
//               <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                 {[
//                   ["EOM OD", "eomOD"],
//                   ["EOM OS", "eomOS"],
//                   ["Saccades", "saccades"],
//                   ["Pursuits", "pursuits"],
//                   ["Cover test method", "coverTestMethod"],
//                   ["Cover test — Distance", "coverDistance"],
//                   ["Cover test — Near", "coverNear"],
//                   ["Phoria Horizontal — D", "phoriaHorizontalDistance"],
//                   ["Phoria Horizontal — N", "phoriaHorizontalNear"],
//                   ["Phoria Vertical — D", "phoriaVerticalDistance"],
//                   ["Phoria Vertical — N", "phoriaVerticalNear"],
//                   ["Gradient AC/A ratio", "gradientACA"],
//                 ].map(([label, key]) => (
//                   <Input
//                     key={key}
//                     label={label}
//                     value={form.binocularVision.motor[key]}
//                     onChange={(value) =>
//                       onChange("binocularVision", "motor", {
//                         ...form.binocularVision.motor,
//                         [key]: value,
//                       })
//                     }
//                   />
//                 ))}
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel number="09B" title="Accommodation" icon={Eye}>
//               <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                 {[
//                   ["NPC — Subjective", "npcAccommodativeSubjective"],
//                   ["NPC — Objective", "npcAccommodativeObjective"],
//                   ["NPC — Break", "npcAccommodativeBreak"],
//                   ["NPC — Recovery", "npcAccommodativeRecovery"],
//                   ["NPC R/G — Subjective", "npcRGSubjective"],
//                   ["NPC R/G — Objective", "npcRGObjective"],
//                   ["NPC R/G — Break", "npcRGBreak"],
//                   ["NPC R/G — Recovery", "npcRGRecovery"],
//                   ["NPA OD — cm", "npaOD"],
//                   ["NPA OS — cm", "npaOS"],
//                   ["NPA OU — cm", "npaOU"],
//                   ["AA OD — D", "aaOD"],
//                   ["AA OS — D", "aaOS"],
//                   ["AA OU — D", "aaOU"],
//                   ["Hofstetter Minimum AA — D", "hofstetterMinimumAA"],
//                   ["MEM OD — DS", "memOD"],
//                   ["MEM OS — DS", "memOS"],
//                   ["NRA — DS", "nra"],
//                   ["PRA — DS", "pra"],
//                 ].map(([label, key]) => (
//                   <Input
//                     key={key}
//                     label={label}
//                     value={form.binocularVision.accommodation[key]}
//                     onChange={(value) =>
//                       onChange("binocularVision", "accommodation", {
//                         ...form.binocularVision.accommodation,
//                         [key]: value,
//                       })
//                     }
//                   />
//                 ))}
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel
//               number="09C"
//               title="Fusional Vergence Amplitudes — Step Vergence"
//               icon={Eye}
//             >
//               <div className="overflow-x-auto rounded border border-slate-200">
//                 <table className="w-full min-w-[720px] border-collapse text-[12px]">
//                   <thead className="bg-slate-50 text-left font-bold text-slate-500">
//                     <tr>
//                       <th className="border border-slate-200 p-2">Type</th>
//                       <th className="border border-slate-200 p-2">Range</th>
//                       <th className="border border-slate-200 p-2">Blur</th>
//                       <th className="border border-slate-200 p-2">Break</th>
//                       <th className="border border-slate-200 p-2">Recovery</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {[
//                       [
//                         "NFV",
//                         "D",
//                         "nfvDistanceBlur",
//                         "nfvDistanceBreak",
//                         "nfvDistanceRecovery",
//                       ],
//                       [
//                         "NFV",
//                         "N",
//                         "nfvNearBlur",
//                         "nfvNearBreak",
//                         "nfvNearRecovery",
//                       ],
//                       [
//                         "PFV",
//                         "D",
//                         "pfvDistanceBlur",
//                         "pfvDistanceBreak",
//                         "pfvDistanceRecovery",
//                       ],
//                       [
//                         "PFV",
//                         "N",
//                         "pfvNearBlur",
//                         "pfvNearBreak",
//                         "pfvNearRecovery",
//                       ],
//                     ].map(([typeName, range, blur, breakKey, recovery]) => (
//                       <tr key={`${typeName}-${range}`}>
//                         <td className="border border-slate-200 p-2 font-bold">
//                           {typeName}
//                         </td>
//                         <td className="border border-slate-200 p-2 font-bold">
//                           {range}
//                         </td>
//                         {[blur, breakKey, recovery].map((key) => (
//                           <td key={key} className="border border-slate-200 p-1">
//                             <input
//                               value={form.binocularVision.fusional[key]}
//                               onChange={(event) =>
//                                 onChange("binocularVision", "fusional", {
//                                   ...form.binocularVision.fusional,
//                                   [key]: event.target.value,
//                                 })
//                               }
//                               className="h-8 w-full rounded border border-slate-200 px-2 outline-none focus:border-blue-400"
//                             />
//                           </td>
//                         ))}
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               <div className="mt-3 grid gap-3 md:grid-cols-2">
//                 <TextArea
//                   label="Comments"
//                   value={form.binocularVision.fusional.comments}
//                   onChange={(value) =>
//                     onChange("binocularVision", "fusional", {
//                       ...form.binocularVision.fusional,
//                       comments: value,
//                     })
//                   }
//                   rows={3}
//                 />
//                 <TextArea
//                   label="Interpretation"
//                   value={form.binocularVision.fusional.interpretation}
//                   onChange={(value) =>
//                     onChange("binocularVision", "fusional", {
//                       ...form.binocularVision.fusional,
//                       interpretation: value,
//                     })
//                   }
//                   rows={3}
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel
//               number="09D"
//               title="Vergence Facility — 12 BO / 3 BI Flippers"
//               icon={Eye}
//             >
//               <div className="grid gap-3 md:grid-cols-3">
//                 <Input
//                   label="CPM"
//                   value={form.binocularVision.vergenceFacility.cpm}
//                   onChange={(value) =>
//                     onChange("binocularVision", "vergenceFacility", {
//                       ...form.binocularVision.vergenceFacility,
//                       cpm: value,
//                     })
//                   }
//                 />
//                 <TextArea
//                   label="Comments"
//                   value={form.binocularVision.vergenceFacility.comments}
//                   onChange={(value) =>
//                     onChange("binocularVision", "vergenceFacility", {
//                       ...form.binocularVision.vergenceFacility,
//                       comments: value,
//                     })
//                   }
//                   rows={2}
//                 />
//                 <TextArea
//                   label="Interpretation"
//                   value={form.binocularVision.vergenceFacility.interpretation}
//                   onChange={(value) =>
//                     onChange("binocularVision", "vergenceFacility", {
//                       ...form.binocularVision.vergenceFacility,
//                       interpretation: value,
//                     })
//                   }
//                   rows={2}
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel
//               number="09E"
//               title="Accommodative Facility"
//               icon={Eye}
//             >
//               <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
//                 {[
//                   ["Lens / Flipper", "lensPower"],
//                   ["Test distance — cm", "testDistance"],
//                   ["Amplitude", "amplitude"],
//                   ["Scaled facility", "scaledFacility"],
//                   ["OD — CPM", "odCPM"],
//                   ["OS — CPM", "osCPM"],
//                   ["OU — CPM", "ouCPM"],
//                 ].map(([label, key]) => (
//                   <Input
//                     key={key}
//                     label={label}
//                     value={form.binocularVision.accommodativeFacility[key]}
//                     onChange={(value) =>
//                       onChange("binocularVision", "accommodativeFacility", {
//                         ...form.binocularVision.accommodativeFacility,
//                         [key]: value,
//                       })
//                     }
//                   />
//                 ))}
//               </div>
//               <div className="mt-3 grid gap-3 md:grid-cols-2">
//                 <TextArea
//                   label="Comments"
//                   value={form.binocularVision.accommodativeFacility.comments}
//                   onChange={(value) =>
//                     onChange("binocularVision", "accommodativeFacility", {
//                       ...form.binocularVision.accommodativeFacility,
//                       comments: value,
//                     })
//                   }
//                   rows={3}
//                 />
//                 <TextArea
//                   label="Interpretation"
//                   value={
//                     form.binocularVision.accommodativeFacility.interpretation
//                   }
//                   onChange={(value) =>
//                     onChange("binocularVision", "accommodativeFacility", {
//                       ...form.binocularVision.accommodativeFacility,
//                       interpretation: value,
//                     })
//                   }
//                   rows={3}
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel
//               number="09F"
//               title="Additional Findings"
//               icon={FileText}
//             >
//               <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                 <Input
//                   label="CISS Score"
//                   value={form.binocularVision.cissScore}
//                   onChange={(value) =>
//                     onChange("binocularVision", "cissScore", value)
//                   }
//                 />
//                 <Input
//                   label="Fixation Disparity"
//                   value={form.binocularVision.fixationDisparity}
//                   onChange={(value) =>
//                     onChange("binocularVision", "fixationDisparity", value)
//                   }
//                 />
//                 <Input
//                   label="Any other test(s)"
//                   value={form.binocularVision.otherTests}
//                   onChange={(value) =>
//                     onChange("binocularVision", "otherTests", value)
//                   }
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel number="10" title="Final Glass Rx" icon={Glasses}>
//               <div className="grid gap-3 md:grid-cols-2">
//                 <div className="rounded border border-slate-200 p-3">
//                   <div className="mb-2 text-[12px] font-bold uppercase text-slate-400">
//                     OD
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     {["sphere", "cylinder", "axis", "add", "va"].map((key) => (
//                       <Input
//                         key={key}
//                         label={key.toUpperCase()}
//                         value={form.binocularVision.finalGlassRx.od[key]}
//                         onChange={(value) =>
//                           onChange("binocularVision", "finalGlassRx", {
//                             ...form.binocularVision.finalGlassRx,
//                             od: {
//                               ...form.binocularVision.finalGlassRx.od,
//                               [key]: value,
//                             },
//                           })
//                         }
//                       />
//                     ))}
//                   </div>
//                 </div>
//                 <div className="rounded border border-slate-200 p-3">
//                   <div className="mb-2 text-[12px] font-bold uppercase text-slate-400">
//                     OS
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     {["sphere", "cylinder", "axis", "add", "va"].map((key) => (
//                       <Input
//                         key={key}
//                         label={key.toUpperCase()}
//                         value={form.binocularVision.finalGlassRx.os[key]}
//                         onChange={(value) =>
//                           onChange("binocularVision", "finalGlassRx", {
//                             ...form.binocularVision.finalGlassRx,
//                             os: {
//                               ...form.binocularVision.finalGlassRx.os,
//                               [key]: value,
//                             },
//                           })
//                         }
//                       />
//                     ))}
//                   </div>
//                 </div>
//               </div>
//               <div className="mt-3 grid gap-3 md:grid-cols-4">
//                 <Input
//                   label="ADD OD"
//                   value={form.binocularVision.finalGlassRx.addOD}
//                   onChange={(value) =>
//                     onChange("binocularVision", "finalGlassRx", {
//                       ...form.binocularVision.finalGlassRx,
//                       addOD: value,
//                     })
//                   }
//                 />
//                 <Input
//                   label="ADD OS"
//                   value={form.binocularVision.finalGlassRx.addOS}
//                   onChange={(value) =>
//                     onChange("binocularVision", "finalGlassRx", {
//                       ...form.binocularVision.finalGlassRx,
//                       addOS: value,
//                     })
//                   }
//                 />
//                 <Input
//                   label="Prism OD"
//                   value={form.binocularVision.finalGlassRx.prismOD}
//                   onChange={(value) =>
//                     onChange("binocularVision", "finalGlassRx", {
//                       ...form.binocularVision.finalGlassRx,
//                       prismOD: value,
//                     })
//                   }
//                 />
//                 <Input
//                   label="Prism OS"
//                   value={form.binocularVision.finalGlassRx.prismOS}
//                   onChange={(value) =>
//                     onChange("binocularVision", "finalGlassRx", {
//                       ...form.binocularVision.finalGlassRx,
//                       prismOS: value,
//                     })
//                   }
//                 />
//               </div>
//             </ClinicalPanel>

//             <ClinicalPanel
//               number="11"
//               title="Diagnosis / Impression"
//               icon={HeartPulse}
//             >
//               <TextArea
//                 label="SIGN / OBSERVATION / ASSESSMENT / PLANNING"
//                 value={form.binocularVision.diagnosis}
//                 onChange={(value) =>
//                   onChange("binocularVision", "diagnosis", value)
//                 }
//                 rows={6}
//               />
//             </ClinicalPanel>

//             <ClinicalPanel
//               number="12"
//               title="Advice / Follow-up"
//               icon={FileText}
//             >
//               <div className="grid gap-3 md:grid-cols-2">
//                 <TextArea
//                   label="Advice"
//                   value={form.binocularVision.advice}
//                   onChange={(value) =>
//                     onChange("binocularVision", "advice", value)
//                   }
//                   rows={6}
//                 />
//                 <div className="space-y-3">
//                   <Input
//                     label="Follow-up"
//                     type="date"
//                     value={form.binocularVision.followUp}
//                     onChange={(value) =>
//                       onChange("binocularVision", "followUp", value)
//                     }
//                   />
//                   <TextArea
//                     label="Notes"
//                     value={form.binocularVision.notes}
//                     onChange={(value) =>
//                       onChange("binocularVision", "notes", value)
//                     }
//                     rows={4}
//                   />
//                 </div>
//               </div>
//             </ClinicalPanel>
//           </div>
//         )}

//         {type === "low_vision" && (
//           <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//             <Input
//               label="Distance VA"
//               value={form.lowVision.distanceVA}
//               onChange={(value) => onChange("lowVision", "distanceVA", value)}
//             />
//             <Input
//               label="Near VA"
//               value={form.lowVision.nearVA}
//               onChange={(value) => onChange("lowVision", "nearVA", value)}
//             />
//             <Input
//               label="Contrast"
//               value={form.lowVision.contrast}
//               onChange={(value) => onChange("lowVision", "contrast", value)}
//             />
//             <Input
//               label="Visual Field"
//               value={form.lowVision.visualField}
//               onChange={(value) => onChange("lowVision", "visualField", value)}
//             />
//             <Input
//               label="Magnification"
//               value={form.lowVision.magnification}
//               onChange={(value) =>
//                 onChange("lowVision", "magnification", value)
//               }
//             />
//             <Input
//               label="Assistive Device"
//               value={form.lowVision.assistiveDevice}
//               onChange={(value) =>
//                 onChange("lowVision", "assistiveDevice", value)
//               }
//             />
//             <div className="sm:col-span-2 lg:col-span-3">
//               <TextArea
//                 label="Advice"
//                 value={form.lowVision.advice}
//                 onChange={(value) => onChange("lowVision", "advice", value)}
//                 rows={4}
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }

// /* =========================================================
//    INPUTS
// ========================================================= */

// function VisualAcuityTable({ data = {}, onChange, onNotesChange }) {
//   const eyes = [
//     { key: "right", label: "Right Eye (OD)" },
//     { key: "left", label: "Left Eye (OS)" },
//     { key: "both", label: "Both Eyes (OU)" },
//   ];

//   const renderTable = (title, farField, nearField) => (
//     <div className="min-w-0 overflow-hidden rounded border border-slate-200">
//       <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-bold uppercase tracking-wide text-slate-600">
//         {title}
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[340px] border-collapse text-[12px]">
//           <thead>
//             <tr className="bg-white text-left text-[12px] font-bold text-slate-500">
//               <th className="w-[42%] border-b border-r border-slate-200 px-3 py-2">Eye</th>
//               <th className="border-b border-r border-slate-200 px-2 py-2">Far</th>
//               <th className="border-b border-slate-200 px-2 py-2">Near</th>
//             </tr>
//           </thead>
//           <tbody>
//             {eyes.map((eye) => {
//               const eyeData = data?.[eye.key] || {};
//               return (
//                 <tr key={eye.key}>
//                   <td className="border-r border-b border-slate-200 bg-slate-50/60 px-3 py-2 font-semibold text-slate-600">
//                     {eye.label}
//                   </td>
//                   <td className="border-r border-b border-slate-200 p-1.5">
//                     <input
//                       value={eyeData[farField] || ""}
//                       onChange={(event) => onChange(eye.key, farField, event.target.value)}
//                       aria-label={`${title} ${eye.label} far visual acuity`}
//                       placeholder="e.g. 6/6"
//                       className="h-8 w-full min-w-0 rounded border border-slate-200 bg-white px-2 text-[12px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//                     />
//                   </td>
//                   <td className="border-b border-slate-200 p-1.5">
//                     <input
//                       value={eyeData[nearField] || ""}
//                       onChange={(event) => onChange(eye.key, nearField, event.target.value)}
//                       aria-label={`${title} ${eye.label} near visual acuity`}
//                       placeholder="e.g. N6"
//                       className="h-8 w-full min-w-0 rounded border border-slate-200 bg-white px-2 text-[12px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//                     />
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-3">
//       <div className="grid gap-3 2xl:grid-cols-2">
//         {renderTable("Unaided Visual Acuity", "unaidedDistance", "near")}
//         {renderTable("Aided Visual Acuity", "aidedDistance", "aidedNear")}
//       </div>
//       <TextArea
//         label="Visual Acuity Notes"
//         value={data?.notes || ""}
//         onChange={onNotesChange}
//         rows={3}
//         placeholder="Enter visual acuity observations or remarks..."
//       />
//     </div>
//   );
// }

// function Input({ label, value, onChange, placeholder = "", type = "text" }) {
//   return (
//     <label className="block min-w-0">
//       <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>

//       <input
//         type={type}
//         value={value || ""}
//         onChange={(event) => onChange(event.target.value)}
//         placeholder={placeholder}
//         className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//       />
//     </label>
//   );
// }

// function TextArea({ label, value, onChange, placeholder = "", rows = 4 }) {
//   return (
//     <label className="block min-w-0">
//       <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>

//       <textarea
//         rows={rows}
//         value={value || ""}
//         onChange={(event) => onChange(event.target.value)}
//         placeholder={placeholder}
//         className="w-full resize-y rounded border border-slate-200 bg-white px-2.5 py-2 text-[12px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//       />
//     </label>
//   );
// }

// function Select({ label, value, onChange, options = [] }) {
//   return (
//     <label className="block min-w-0">
//       <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-slate-400">
//         {label}
//       </span>

//       <select
//         value={value || ""}
//         onChange={(event) => onChange(event.target.value)}
//         className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
//       >
//         <option value="">Select...</option>
//         {options.map((option) => (
//           <option
//             key={typeof option === "string" ? option : option.value}
//             value={typeof option === "string" ? option : option.value}
//           >
//             {typeof option === "string" ? option : option.label}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }

// /* =========================================================
//    SERIALIZATION
// ========================================================= */

// const isBlankClinicalValue = (value) => {
//   if (value === null || value === undefined) return true;

//   if (typeof value === "string") {
//     return value.trim() === "";
//   }

//   if (Array.isArray(value)) {
//     return (
//       value.length === 0 ||
//       value.every(isBlankClinicalValue)
//     );
//   }

//   if (typeof value === "object") {
//     const entries = Object.values(value);

//     return (
//       entries.length === 0 ||
//       entries.every(isBlankClinicalValue)
//     );
//   }

//   return false;
// };

// const clinicalFieldLabel = (key) => {
//   const knownLabels = {
//     anteriorChamber: "Anterior Chamber",
//     cdRatio: "C/D Ratio",
//     nearVa: "Near VA",
//     right: "Right Eye",
//     left: "Left Eye",
//     od: "OD",
//     os: "OS",
//     ou: "OU",
//     va: "VA",
//   };

//   if (knownLabels[key]) return knownLabels[key];

//   return String(key)
//     .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
//     .replace(/[_-]+/g, " ")
//     .replace(/^./, (character) => character.toUpperCase())
//     .trim();
// };

// /**
//  * Convert clinical values into readable text for legacy text fields.
//  * Keep the original structured objects in the payload as well.
//  */
// const toClinicalText = (value) => {
//   if (isBlankClinicalValue(value)) return "";

//   if (typeof value === "boolean") {
//     return value ? "Yes" : "No";
//   }

//   if (Array.isArray(value)) {
//     return value
//       .map(toClinicalText)
//       .filter(Boolean)
//       .join(", ");
//   }

//   if (typeof value === "object") {
//     return Object.entries(value)
//       .filter(([, nestedValue]) =>
//         !isBlankClinicalValue(nestedValue),
//       )
//       .map(
//         ([key, nestedValue]) =>
//           `${clinicalFieldLabel(key)}: ${toClinicalText(nestedValue)}`,
//       )
//       .join(" • ");
//   }

//   return String(value).trim();
// };

// function formatSlitLamp(slitLamp) {
//   if (!slitLamp || typeof slitLamp !== "object") return "";

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
//       const right = toClinicalText(slitLamp.right?.[field]);
//       const left = toClinicalText(slitLamp.left?.[field]);

//       if (!right && !left) return "";

//       return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
//     })
//     .filter(Boolean)
//     .join("\n");
// }

// function formatFundus(fundus) {
//   if (!fundus || typeof fundus !== "object") return "";

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
//       const right = toClinicalText(fundus.right?.[field]);
//       const left = toClinicalText(fundus.left?.[field]);

//       if (!right && !left) return "";

//       return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
//     })
//     .filter(Boolean)
//     .join("\n");
// }

import { useEffect, useMemo, useState } from "react";
import {
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
  [patient?.firstName, patient?.middleName, patient?.lastName]
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

const emptyContactLensEye = () => ({
  lensCategory: "soft",
  brandMaterialDk: "",
  baseCurveSag: "",
  overallDiameter: "",
  powerSph: "",
  powerCyl: "",
  powerAxis: "",
  powerAdd: "",
  peripheralHapticCurves: "",
  flatK: "",
  steepK: "",
  kAxis: "",
  ectasiaConeType: "",
  hvid: "",
  pupilPhotopic: "",
  pupilMesopic: "",
  lidsLashes: "",
  conjunctivaSclera: "",
  corneaStatus: "",
  tbutSec: "",
  tbutQuality: "normal",
  softCentration: "centered",
  softDecenterDetail: "",
  softMovement: "optimal",
  softPushUp: "normal",
  softLag: "normal",
  rgpApicalPattern: "alignment",
  rgpMidPeripheral: "adequate",
  rgpEdgeLift: "optimal",
  rgpCentration: "centered",
  rgpWettability: "good",
  scleralCentralVaultInitial: "",
  scleralCentralVaultSettlement: "",
  scleralSettlementHours: "",
  scleralLimbalClearance: "adequate",
  scleralLandingZone: "alignment",
  scleralLandingZoneAngles: "spherical",
  scleralSurfaceWettability: "clean",
  overRefractionSph: "",
  overRefractionCyl: "",
  overRefractionAxis: "",
  finalAidedVA: "",
});

const emptyContactLensForm = () => ({
  primaryIndication: "refractive",
  selectedLensTypes: {
    soft: false,
    rgp: false,
    scleral: false,
  },
  wearHistory: {
    lensTypeMaterial: "",
    wearSchedule: "",
    replacement: "",
    wearTimeHours: "",
    avgWearTimeHours: "",
    comfortOD: "",
    comfortOS: "",
  },
  careSolution: "",
  right: emptyContactLensEye(),
  left: emptyContactLensEye(),
  binocularAidedVA: "",
  clinicalDiagnosis: "",
  finalOrderOD: "",
  finalOrderOS: "",
  fillingSolution: "",
  disinfectionSystem: "",
  instructions: {
    insertionRemovalVerified: false,
    noTapWaterWarning: false,
    bubbleTroubleshooting: false,
  },
  followUpSchedule: "1_week",
  followUpDate: "",
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
  {
    value: "binocular_vision",
    label: "Binocular Vision",
    description: "Dedicated binocular, accommodative and vergence assessment.",
    icon: Eye,
  },
  {
    value: "contact_lenses",
    label: "Contact Lenses",
    description: "Comprehensive Contact Lens evaluation (Soft, RGP & Scleral).",
    icon: Glasses,
  },
  {
    value: "low_vision",
    label: "Low Vision",
    description: "Low vision assessment, aids and management planning.",
    icon: Eye,
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
      aidedNear: "",
    },
    left: {
      unaidedDistance: "",
      aidedDistance: "",
      pinhole: "",
      near: "",
      aidedNear: "",
    },
    both: {
      unaidedDistance: "",
      aidedDistance: "",
      near: "",
      aidedNear: "",
    },
    notes: "",
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
    date: dateInputValue(),
    time: "",
    workUpBy: "",
    occupation: "",
    regNo: "",
    phone: "",
    email: "",
    place: "",
    chiefComplaints: "",
    refractionNote: "",
    sensory: {
      stereopsisNear: "",
      wfdtDistance: "",
      wfdtIntermediate: "",
      wfdtNear: "",
    },
    motor: {
      eomOD: "",
      eomOS: "",
      saccades: "",
      pursuits: "",
      coverTestMethod: "",
      coverDistance: "",
      coverNear: "",
      phoriaHorizontalDistance: "",
      phoriaHorizontalNear: "",
      phoriaVerticalDistance: "",
      phoriaVerticalNear: "",
      gradientACA: "",
    },
    accommodation: {
      npcAccommodativeSubjective: "",
      npcAccommodativeObjective: "",
      npcAccommodativeBreak: "",
      npcAccommodativeRecovery: "",
      npcRGSubjective: "",
      npcRGObjective: "",
      npcRGBreak: "",
      npcRGRecovery: "",
      npaOD: "",
      npaOS: "",
      npaOU: "",
      aaOD: "",
      aaOS: "",
      aaOU: "",
      hofstetterMinimumAA: "",
      memOD: "",
      memOS: "",
      nra: "",
      pra: "",
    },
    fusional: {
      nfvDistanceBlur: "",
      nfvDistanceBreak: "",
      nfvDistanceRecovery: "",
      nfvNearBlur: "",
      nfvNearBreak: "",
      nfvNearRecovery: "",
      pfvDistanceBlur: "",
      pfvDistanceBreak: "",
      pfvDistanceRecovery: "",
      pfvNearBlur: "",
      pfvNearBreak: "",
      pfvNearRecovery: "",
      comments: "",
      interpretation: "",
    },
    vergenceFacility: {
      cpm: "",
      comments: "",
      interpretation: "",
    },
    accommodativeFacility: {
      lensPower: "+/-2.00 DS",
      testDistance: "",
      amplitude: "",
      scaledFacility: "",
      odCPM: "",
      osCPM: "",
      ouCPM: "",
      comments: "",
      interpretation: "",
    },
    cissScore: "",
    fixationDisparity: "",
    otherTests: "",
    finalGlassRx: {
      od: emptyEye(),
      os: emptyEye(),
      addOD: "",
      addOS: "",
      prismOD: "",
      prismOS: "",
    },
    diagnosis: "",
    advice: "",
    followUp: "",
    notes: "",
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

  contactLenses: emptyContactLensForm(),

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
    lensRows: [emptyDispensingLens("R"), emptyDispensingLens("L")],
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
  const requestedType = searchParams.get("type") || "";

  const validRequestedTypes = [
    "comprehensive",
    "short_consult",
    "binocular_vision",
    "low_vision",
    "contact_lenses",
  ];

  const isDirectConsultation = validRequestedTypes.includes(requestedType);
  const [patient, setPatient] = useState(null);
  const [previousConsultations, setPreviousConsultations] = useState([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [consultationStarted, setConsultationStarted] =
    useState(isDirectConsultation);

  const [showTypeSelector, setShowTypeSelector] =
    useState(!isDirectConsultation);
  const [dirty, setDirty] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const [form, setForm] = useState(() => ({
    ...initialForm,
    consultationType: isDirectConsultation
      ? requestedType
      : initialForm.consultationType,
  }));

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
            "Unable to load patient record.",
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
    [patient?.dateOfBirth],
  );

  const selectedType = useMemo(
    () =>
      consultationTypes.find((item) => item.value === form.consultationType) ||
      consultationTypes[0],
    [form.consultationType],
  );

  const isComprehensive = form.consultationType === "comprehensive";
  const isShortConsult = form.consultationType === "short_consult";
  const isBinocularVision = form.consultationType === "binocular_vision";
  const isContactLenses = form.consultationType === "contact_lenses";
  const isLowVision = form.consultationType === "low_vision";
  const isSpecializedConsult =
    isBinocularVision || isContactLenses || isLowVision;

  const lensTotal = useMemo(() => {
    return form.dispensing.lensRows.reduce(
      (sum, row) => sum + (Number(row.lensPrice) || 0),
      0,
    );
  }, [form.dispensing.lensRows]);

  const frameValue = Number(form.dispensing.toReorder) || 0;
  const frameDiscount = Number(form.dispensing.frameDiscount) || 0;
  const overallDiscount = Number(form.dispensing.overallDiscount) || 0;
  const grandTotal = Math.max(
    0,
    frameValue + lensTotal - frameDiscount - overallDiscount,
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

  const updateRefractionField = (prescriptionType, eye, field, value) => {
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
          : test,
      ),
    }));
  };

  const removeTest = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      additionalTests: current.additionalTests.filter(
        (_, testIndex) => testIndex !== index,
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
          : item,
      ),
    }));
  };

  const removeDiagnosis = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      diagnosis: current.diagnosis.filter(
        (_, diagnosisIndex) => diagnosisIndex !== index,
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
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeTherapeutic = (index) => {
    setDirty(true);
    setForm((current) => ({
      ...current,
      therapeutics:
        current.therapeutics.length > 1
          ? current.therapeutics.filter((_, itemIndex) => itemIndex !== index)
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
          rowIndex === index ? { ...row, [field]: value } : row,
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
            current.dispensing.lensRows.length % 2 === 0 ? "R" : "L",
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
                (_, rowIndex) => rowIndex !== index,
              )
            : current.dispensing.lensRows,
      },
    }));
  };

  const updateAddon = (section, key, value) => {
    if (key === "__replace") {
      updateForm(section, value);
      return;
    }

    updateNested(section, key, value);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        `opticare-consultation-draft-${patientId}`,
        JSON.stringify(form),
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
      `Bill prepared for ₹${grandTotal.toFixed(2)}. Connect this button to your billing API when billing is enabled.`,
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
            }${item.notes ? ` - ${item.notes}` : ""}`,
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
            .join(" | "),
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

        medication: therapeuticText || form.medications || "",

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
          (test) => !["Visual Field", "Colour Vision"].includes(test.name),
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

        recallDue: form.recall.enabled ? form.recall.date || null : null,

        recallLetter: form.recall.type || "",

        notes: [
          form.ocularHistory ? `Ocular history: ${form.ocularHistory}` : "",
          form.systemicHistory
            ? `Systemic history: ${form.systemicHistory}`
            : "",
          form.familyHistory ? `Family history: ${form.familyHistory}` : "",
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
        // Optical dispensing is intentionally handled by the
        // independent Spectacle / Contact Lens workflows.

        therapeutics: form.therapeutics,
        recall: form.recall,
      };

      const response = await createConsultation(payload);

      if (!response) {
        throw new Error("Consultation could not be saved.");
      }

      try {
        localStorage.removeItem(`opticare-consultation-draft-${patientId}`);
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
          "Unable to save consultation.",
      );
    } finally {
      setSaving(false);
    }
  };

  const safeNavigateBack = () => {
    if (dirty && !saving) {
      const confirmed = window.confirm(
        "You have unsaved changes. Leave this consultation?",
      );
      if (!confirmed) return;
    }

    navigate(`/patients/${patientId}`);
  };

  if (loadingPatient) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Loading patient record...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error || "Patient record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* =====================================================
            TOP TOOLBAR
        ====================================================== */}
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-[#f8fbff]/95 backdrop-blur">
          <div className="flex min-h-[58px] items-center justify-between gap-3 px-3 py-2 sm:px-3 lg:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Clinical workspace
                </div>
                <h1 className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                  New Consultation
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {dirty && consultationStarted && (
                <span className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-700 md:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!consultationStarted || saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
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
          <div className="px-3 pt-3 sm:px-3 lg:px-4">
            {error && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
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
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                <Check size={14} />
                {success}
              </div>
            )}

            {billingMessage && (
              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700">
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
            className="px-3 pb-28 pt-3 sm:px-3 lg:px-4"
          >
            {/* =================================================
                VISIT CONTROL STRIP
            ================================================== */}
            <div className="mb-3 rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid items-center gap-0 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
                <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
                  <div className="mb-1 text-[12px] font-bold text-slate-500">
                    Consultation Type <span className="text-red-500">*</span>
                  </div>

                  <button
                    type="button"
                    onClick={changeConsultationType}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 text-[13px] font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <Check size={13} />
                    {selectedType.label}
                    <ChevronDown size={13} />
                  </button>
                </div>

                <div className="border-b border-slate-200 px-3 py-2.5 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-bold text-slate-500">
                      Recall
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateNested("recall", "enabled", !form.recall.enabled)
                      }
                      className={`rounded-lg px-2 py-1 text-[12px] font-bold ${
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
                            updateNested("recall", "date", event.target.value)
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-xs outline-none focus:border-blue-400"
                        />
                      </div>

                      <select
                        value={form.recall.type}
                        onChange={(event) =>
                          updateNested("recall", "type", event.target.value)
                        }
                        className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
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
                    onChange={(value) => updateForm("consultationDate", value)}
                  />
                </div>

                <div className="px-3 py-2.5">
                  <div className="mb-1 text-[12px] font-bold text-slate-500">
                    Optometrist
                  </div>
                  <div className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700">
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
                <ClinicalPanel number="01" title="Open Box" icon={FileText}>
                  <TextArea
                    label="Clinical entry"
                    value={form.shortConsult.openBox}
                    onChange={(value) =>
                      updateNested("shortConsult", "openBox", value)
                    }
                    rows={14}
                    placeholder="Enter the consultation findings, complaint, clinical comments or focused assessment..."
                  />
                </ClinicalPanel>

                <ClinicalPanel number="02" title="Refraction" icon={Glasses}>
                  <RefractionTable
                    title="Refraction"
                    data={form.refraction.final}
                    onChange={(eye, field, value) =>
                      updateRefractionField("final", eye, field, value)
                    }
                  />

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Input
                      label="PD Right"
                      value={form.refraction.pd.right}
                      onChange={(value) =>
                        updateDeep("refraction", "pd", "right", value)
                      }
                    />
                    <Input
                      label="PD Left"
                      value={form.refraction.pd.left}
                      onChange={(value) =>
                        updateDeep("refraction", "pd", "left", value)
                      }
                    />
                    <Input
                      label="PD Total"
                      value={form.refraction.pd.total}
                      onChange={(value) =>
                        updateDeep("refraction", "pd", "total", value)
                      }
                    />
                  </div>
                </ClinicalPanel>
              </div>
            ) : isSpecializedConsult ? (
              <SpecializedConsultationSection
                type={form.consultationType}
                form={form}
                patient={patient}
                age={age}
                onChange={updateAddon}
              />
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
                      onChange={(value) => updateForm("symptoms", value)}
                      rows={3}
                      placeholder="Enter presenting symptoms..."
                    />

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <TextArea
                        label="Ocular History"
                        value={form.ocularHistory}
                        onChange={(value) => updateForm("ocularHistory", value)}
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
                        onChange={(value) => updateForm("allergies", value)}
                        rows={3}
                        placeholder="Enter allergies..."
                      />

                      <TextArea
                        label="Current Medications"
                        value={form.medications}
                        onChange={(value) => updateForm("medications", value)}
                        rows={3}
                        placeholder="Enter medications..."
                      />
                    </div>
                  </ClinicalPanel>

                  <ClinicalPanel number="02" title="Visual Acuity" icon={Eye}>
                    <VisualAcuityTable
                      data={form.visualAcuity}
                      onChange={(eye, field, value) =>
                        updateDeep("visualAcuity", eye, field, value)
                      }
                      onNotesChange={(value) =>
                        updateNested("visualAcuity", "notes", value)
                      }
                    />
                  </ClinicalPanel>
                </div>

                {/* =================================================
                    ROW 2
                ================================================== */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel number="03" title="Refraction" icon={Glasses}>
                    <RefractionTabs
                      form={{
                        ...form,
                        onSubjectiveSlotsChange: (slots) =>
                          updateNested("refraction", "subjectiveSlots", slots),
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
                    title="Slit Lamp Examination"
                    icon={Eye}
                  >
                    <SlitLampTable
                      data={form.slitLamp}
                      onChange={(eye, field, value) =>
                        updateEyeField("slitLamp", eye, field, value)
                      }
                    />
                  </ClinicalPanel>
                </div>

                {/* =================================================
                    ROW 3
                ================================================== */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="04"
                    title="Binocular / Ocular Motility"
                    icon={Eye}
                  >
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                      Detailed sensory, motor, accommodation, vergence, CISS and
                      final binocular vision assessment is recorded in the
                      specialist evaluation.
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="text-[12px] font-bold uppercase text-slate-400">
                          Stereopsis
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-700">
                          {form.binocularVision.sensory.stereopsisNear ||
                            "Not recorded"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="text-[12px] font-bold uppercase text-slate-400">
                          Cover test
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-700">
                          {form.binocularVision.motor.coverDistance ||
                            "Not recorded"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="text-[12px] font-bold uppercase text-slate-400">
                          CISS
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-700">
                          {form.binocularVision.cissScore || "Not recorded"}
                        </div>
                      </div>
                    </div>
                  </ClinicalPanel>

                  <ClinicalPanel
                    number="07"
                    title="Fundus Examination"
                    icon={Eye}
                  >
                    <FundusTable
                      data={form.fundus}
                      onChange={(eye, field, value) =>
                        updateEyeField("fundus", eye, field, value)
                      }
                    />
                  </ClinicalPanel>
                </div>

                {/* =================================================
                    ROW 4
                ================================================== */}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="05"
                    title="Additional Tests"
                    icon={Stethoscope}
                    action={
                      <button
                        type="button"
                        onClick={addTest}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        <Plus size={12} />
                        Add Test
                      </button>
                    }
                  >
                    {form.additionalTests.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
                        No additional tests
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-left text-[12px] font-bold text-slate-500">
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
                            {form.additionalTests.map((test, index) => (
                              <tr key={index}>
                                <td className="border border-slate-200 p-1">
                                  <select
                                    value={test.name}
                                    onChange={(event) =>
                                      updateTest(
                                        index,
                                        "name",
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
                                  >
                                    {testTypes.map((type) => (
                                      <option key={type} value={type}>
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
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
                                  />
                                </td>
                                <td className="border border-slate-200 p-1">
                                  <input
                                    value={test.remarks || ""}
                                    onChange={(event) =>
                                      updateTest(
                                        index,
                                        "remarks",
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
                                  />
                                </td>
                                <td className="border border-slate-200 p-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeTest(index)}
                                    className="inline-flex h-9 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </ClinicalPanel>

                  <ClinicalPanel
                    number="08"
                    title="Diagnosis"
                    icon={HeartPulse}
                    action={
                      <button
                        type="button"
                        onClick={addDiagnosis}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    }
                  >
                    {form.diagnosis.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
                        No diagnosis added
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {form.diagnosis.map((item, index) => (
                          <div
                            key={index}
                            className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-[1fr_120px_1fr_30px]"
                          >
                            <Input
                              label="Diagnosis"
                              value={item.condition}
                              onChange={(value) =>
                                updateDiagnosis(index, "condition", value)
                              }
                              placeholder="Search or enter diagnosis..."
                            />
                            <Select
                              label="Laterality"
                              value={item.eye}
                              options={["OD", "OS", "OU", "N/A"]}
                              onChange={(value) =>
                                updateDiagnosis(index, "eye", value)
                              }
                            />
                            <Input
                              label="Remarks"
                              value={item.notes}
                              onChange={(value) =>
                                updateDiagnosis(index, "notes", value)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeDiagnosis(index)}
                              className="mt-4 flex h-9 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ClinicalPanel>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <ClinicalPanel
                    number="09"
                    title="Advise / Management Plan"
                    icon={FileText}
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      {adviceOptions.map(([key, label]) => (
                        <label
                          key={key}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium ${
                            form.advice[key]
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.advice[key]}
                            onChange={(event) =>
                              updateNested("advice", key, event.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded-lg border-slate-300 text-blue-600"
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
                          updateNested("advice", "custom", value)
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
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[12px] font-bold text-slate-500">
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
                                    event.target.value,
                                  )
                                }
                                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
                              />
                            </td>
                          ))}

                          <td className="border border-slate-200 p-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeTherapeutic(index)}
                              className="inline-flex h-9 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
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

              <ClinicalPanel number="11" title="Recall" icon={CalendarDays}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    label="Recall Date"
                    type="date"
                    value={form.recall.date}
                    onChange={(value) => updateNested("recall", "date", value)}
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
                    onChange={(value) => updateNested("recall", "type", value)}
                  />
                </div>

                <div className="mt-2">
                  <TextArea
                    label="Recall Letter / Message"
                    value={form.recall.message}
                    onChange={(value) =>
                      updateNested("recall", "message", value)
                    }
                    rows={4}
                    placeholder="Recall instruction or patient message..."
                  />
                </div>
              </ClinicalPanel>
            </div>
            {/* =================================================
                MOBILE / BOTTOM SAVE BAR
            ================================================== */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur lg:static lg:mt-3 lg:border lg:rounded-lg lg:shadow-sm">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-1 sm:px-2">
                <div className="hidden min-w-0 sm:block">
                  <div className="truncate text-xs font-bold text-slate-700">
                    {selectedType.label}
                  </div>
                  <div className="truncate text-[12px] text-slate-400">
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
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
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
      </div>
    </div>
  );
}

/* =========================================================
   PATIENT HEADER
========================================================= */

function PatientHeader({ patient, age, previousConsultations }) {
  return (
    <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-3 lg:px-4">
      <div className="grid items-center gap-0 lg:grid-cols-[1.5fr_repeat(5,1fr)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
            <UserRound size={22} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {fullName(patient) || "Unnamed Patient"}
            </div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">
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

        <PatientMini label="Gender" value={patient.gender || "—"} />

        <PatientMini label="Phone" value={patient.phone || "—"} />

        <PatientMini
          label="Last Consultation"
          value={
            patient.lastConsultationAt
              ? formatDate(patient.lastConsultationAt)
              : previousConsultations?.[0]?.consultationDate
                ? formatDate(previousConsultations[0].consultationDate)
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
      <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/* =========================================================
   CONSULTATION TYPE MODAL
========================================================= */

function ConsultationTypeModal({ currentType, onSelect, onClose, canClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Select Consultation Type
          </h2>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close consultation type selector"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {consultationTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = currentType === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelect(item.value)}
                className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{item.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CLINICAL PANEL
========================================================= */

function ClinicalPanel({ number, title, icon: Icon, action, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-sm">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-blue-50 px-1.5 text-[12px] font-bold text-blue-700 ring-1 ring-blue-100">
            {number}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-slate-200">
            <Icon size={16} />
          </span>
          <h2 className="truncate text-sm font-bold tracking-tight text-slate-800">{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="space-y-3 p-3 sm:p-3">{children}</div>
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
      : Array.from(
          { length: 4 },
          (_, index) =>
            form.refraction.subjectiveSlots?.[index] || {
              right: emptyEye(),
              left: emptyEye(),
            },
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
        : slot,
    );

    // Keep the existing single subjectiveRx object synchronized with
    // the most recently edited subjective table so the existing API
    // contract continues to work.
    onChange("subjective", eye, field, value);

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
            className={`h-9 rounded-lg border text-xs font-bold transition ${
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
                className="overflow-hidden rounded-lg border border-blue-100 bg-white"
              >
                <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-2.5 py-1.5">
                  <div className="text-xs font-bold text-blue-700">
                    Subjective Refraction {index + 1}
                  </div>
                  <span className="text-[12px] font-medium text-slate-500">
                    Trial {index + 1}
                  </span>
                </div>

                <div className="overflow-x-auto p-1.5">
                  <RefractionTable
                    data={slot}
                    onChange={(eye, field, value) =>
                      updateSubjectiveSlot(index, eye, field, value)
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
    <table className="w-full min-w-[760px] border-collapse text-xs">
      <thead>
        <tr className="bg-slate-50 text-left text-[12px] font-bold text-slate-600">
          <th className="w-20 border border-slate-200 px-2 py-2">Eye</th>
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
            <th className="border border-slate-200 bg-white px-2 py-1.5 text-left text-xs font-semibold text-slate-700">
              {label}
            </th>

            {fields.map(([field]) => (
              <td key={field} className="border border-slate-200 p-1">
                <input
                  value={data?.[eye]?.[field] || ""}
                  onChange={(event) => onChange(eye, field, event.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-xs outline-none focus:border-blue-400"
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
      <table className="w-full min-w-[580px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[12px] font-bold text-slate-600">
              Parameter
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
              Right (OD)
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
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
                      onChange(eye, field, event.target.value)
                    }
                    className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
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
      <table className="w-full min-w-[580px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-32 border border-slate-200 px-2 py-2 text-left text-[12px] font-bold text-slate-600">
              Parameter
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
              Right (OD)
            </th>
            <th className="border border-slate-200 px-2 py-2 text-center text-[12px] font-bold text-slate-600">
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
                      onChange(eye, field, event.target.value)
                    }
                    className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[34px] items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-700">09.</span>
          <Glasses size={13} className="text-blue-600" />
          <h2 className="text-[13px] font-bold text-blue-700">
            Dispensing (Spectacles)
          </h2>
        </div>

        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.dispensing.spectacleRequired}
            onChange={(event) =>
              updateNested(
                "dispensing",
                "spectacleRequired",
                event.target.checked,
              )
            }
            className="h-3.5 w-3.5 rounded-lg border-slate-300 text-blue-600"
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
            onChange={(value) => updateNested("dispensing", "frameCode", value)}
          />

          <Input
            label="Description"
            value={form.dispensing.frameDescription}
            onChange={(value) =>
              updateNested("dispensing", "frameDescription", value)
            }
          />

          <MoneyInput
            label="To Reorder"
            value={form.dispensing.toReorder}
            onChange={(value) => updateNested("dispensing", "toReorder", value)}
          />

          <MoneyInput
            label="Fr Discount"
            value={form.dispensing.frameDiscount}
            onChange={(value) =>
              updateNested("dispensing", "frameDiscount", value)
            }
          />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          <Input
            label="Frame Size"
            value={form.dispensing.frameSize}
            onChange={(value) => updateNested("dispensing", "frameSize", value)}
          />

          <Input
            label="Depth"
            value={form.dispensing.depth}
            onChange={(value) => updateNested("dispensing", "depth", value)}
          />

          <Input
            label="ED"
            value={form.dispensing.ed}
            onChange={(value) => updateNested("dispensing", "ed", value)}
          />

          <Select
            label="Type"
            value={form.dispensing.frameType}
            options={["MM", "Plastic", "Metal", "Acetate", "Other"]}
            onChange={(value) => updateNested("dispensing", "frameType", value)}
          />

          <Input
            label="Other"
            value={form.dispensing.other}
            onChange={(value) => updateNested("dispensing", "other", value)}
          />

          <MoneyInput
            label="Fitting ₹"
            value={form.dispensing.fitting}
            onChange={(value) => updateNested("dispensing", "fitting", value)}
          />

          <MoneyInput
            label="Frame Discount"
            value={form.dispensing.overallDiscount}
            onChange={(value) =>
              updateNested("dispensing", "overallDiscount", value)
            }
          />
        </div>

        {/* LENS ORDER TABLE */}
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[1350px] border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50 text-center font-bold text-slate-600">
                <th className="border border-slate-200 px-2 py-2">Eye</th>
                <th className="border border-slate-200 px-2 py-2">Lens Code</th>
                <th className="min-w-[180px] border border-slate-200 px-2 py-2">
                  Lens Description
                  <br />
                  <span className="font-normal">(S = Stock, G = Grind)</span>
                </th>
                <th className="border border-slate-200 px-2 py-2">Lens Size</th>
                <th className="border border-slate-200 px-2 py-2">Seg Size</th>
                <th className="border border-slate-200 px-2 py-2">Seg Ht</th>
                <th className="border border-slate-200 px-2 py-2">OC Ht</th>
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
                <th className="border border-slate-200 px-2 py-2">BC</th>
                <th className="border border-slate-200 px-2 py-2">Lens Sup</th>
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
                        updateLens(index, "lensCode", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[12px] outline-none focus:border-blue-400"
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
                        updateLens(index, "lensDescription", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[12px] text-blue-600 outline-none focus:border-blue-400"
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
                    <td key={field} className="border border-slate-200 p-1">
                      <input
                        value={row[field] || ""}
                        onChange={(event) =>
                          updateLens(index, field, event.target.value)
                        }
                        placeholder={placeholder}
                        className="h-9 w-full rounded-lg border border-slate-200 px-1.5 text-center text-[12px] outline-none focus:border-blue-400"
                      />
                    </td>
                  ))}

                  <td className="border border-slate-200 p-1">
                    <input
                      value={row.lensSupplier}
                      onChange={(event) =>
                        updateLens(index, "lensSupplier", event.target.value)
                      }
                      placeholder="ESS"
                      className="h-9 w-full rounded-lg border border-slate-200 px-1.5 text-center text-[12px] outline-none focus:border-blue-400"
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
                          event.target.value,
                        )
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 px-1.5 text-[12px] outline-none focus:border-blue-400"
                    />
                  </td>

                  <td className="border border-slate-200 p-1">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={row.lensPrice}
                        onChange={(event) =>
                          updateLens(index, "lensPrice", event.target.value)
                        }
                        className="h-9 w-full rounded-lg border border-slate-200 pl-4 pr-1.5 text-right text-[12px] outline-none focus:border-blue-400"
                      />
                    </div>
                  </td>

                  <td className="border border-slate-200 p-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeLens(index)}
                      className="inline-flex h-9 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
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
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
          >
            <Plus size={12} />
            Add Lens Row
          </button>

          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-4">
            <MoneySummary label="Frame" value={frameValue} />
            <MoneySummary label="Lenses" value={lensTotal} />
            <MoneySummary label="Total" value={grandTotal} emphasized />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="text-[12px] font-bold uppercase text-slate-400">
                GST
              </div>
              <input
                value={form.dispensing.gst}
                onChange={(event) =>
                  updateNested("dispensing", "gst", event.target.value)
                }
                placeholder="GST"
                className="mt-0.5 h-6 w-full bg-transparent text-right text-xs font-bold outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          <Input
            label="Bill No"
            value={form.dispensing.billNo}
            onChange={(value) => updateNested("dispensing", "billNo", value)}
          />

          <button
            type="button"
            onClick={onCreateBill}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Create Bill
          </button>
        </div>
      </div>
    </section>
  );
}

function MoneySummary({ label, value, emphasized = false }) {
  return (
    <div
      className={`rounded-lg border px-3 py-1.5 ${
        emphasized
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-[12px] font-bold uppercase text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 text-right text-[13px] font-bold ${
          emphasized ? "text-blue-700" : "text-slate-700"
        }`}
      >
        ₹ {Number(value || 0).toFixed(2)}
      </div>
    </div>
  );
}

function MoneyInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          ₹
        </span>
        <input
          type="number"
          min="0"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-4 pr-2 text-xs outline-none focus:border-blue-400"
        />
      </div>
    </label>
  );
}

function ContactLensesSection({ contactLenses, onChange }) {
  const updateLensField = (field, value) => {
    onChange({
      ...contactLenses,
      [field]: value,
    });
  };

  const updateWearHistory = (field, value) => {
    onChange({
      ...contactLenses,
      wearHistory: {
        ...contactLenses.wearHistory,
        [field]: value,
      },
    });
  };

  const updateEye = (eyeKey, field, value) => {
    onChange({
      ...contactLenses,
      [eyeKey]: {
        ...contactLenses[eyeKey],
        [field]: value,
      },
    });
  };

  const updateInstruction = (field, value) => {
    onChange({
      ...contactLenses,
      instructions: {
        ...contactLenses.instructions,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-3">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Glasses className="text-blue-600" size={20} />
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Comprehensive Contact Lens Clinical Evaluation Sheet
            </h2>
          </div>
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
            aria-label="Contact lens types selected for this consultation"
          >
            {[
              { key: "soft", label: "Soft" },
              { key: "rgp", label: "RGP" },
              { key: "scleral", label: "Scleral" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap"
              >
                <input
                  type="checkbox"
                  checked={Boolean(contactLenses.selectedLensTypes?.[key])}
                  onChange={(event) =>
                    onChange({
                      ...contactLenses,
                      selectedLensTypes: {
                        ...(contactLenses.selectedLensTypes || {}),
                        [key]: event.target.checked,
                      },
                    })
                  }
                  className="h-3.5 w-3.5 rounded-lg border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 1. CLINICAL HISTORY & BASELINE WEAR */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Clinical History & Baseline Wear
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Primary Indication
              </label>
              <select
                value={contactLenses.primaryIndication}
                onChange={(e) => updateLensField("primaryIndication", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="refractive">Refractive Error</option>
                <option value="keratoconus">Keratoconus / Ectasia</option>
                <option value="post_surgical">Post-Surgical / Graft</option>
                <option value="ocular_surface">Ocular Surface Disease</option>
                <option value="presbyopia">Presbyopia</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Previous Lens Type / Material
              </label>
              <input
                type="text"
                placeholder="e.g. Biofinity / Boston XO"
                value={contactLenses.wearHistory.lensTypeMaterial}
                onChange={(e) => updateWearHistory("lensTypeMaterial", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Wear Schedule / Replacement
              </label>
              <input
                type="text"
                placeholder="Daily / Monthly"
                value={contactLenses.wearHistory.wearSchedule}
                onChange={(e) => updateWearHistory("wearSchedule", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Current Care Solution
              </label>
              <input
                type="text"
                placeholder="e.g. Biotrue / AOSept"
                value={contactLenses.careSolution}
                onChange={(e) => updateLensField("careSolution", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Wear Time (hrs/day)
              </label>
              <input
                type="text"
                placeholder="Current WT / Avg WT"
                value={contactLenses.wearHistory.wearTimeHours}
                onChange={(e) => updateWearHistory("wearTimeHours", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Comfort OD (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                placeholder="10"
                value={contactLenses.wearHistory.comfortOD}
                onChange={(e) => updateWearHistory("comfortOD", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">
                Comfort OS (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                placeholder="10"
                value={contactLenses.wearHistory.comfortOS}
                onChange={(e) => updateWearHistory("comfortOS", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* EYE-BY-EYE EVALUATION (OD & OS) */}
        {["right", "left"].map((eyeKey) => {
          const eyeData = contactLenses[eyeKey];
          const isRight = eyeKey === "right";
          const label = isRight ? "Right Eye (OD)" : "Left Eye (OS)";
          const badgeColor = isRight ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";

          return (
            <div key={eyeKey} className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900">{label}</h3>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
                  {isRight ? "OD" : "OS"}
                </span>
              </div>

              {/* LENS TYPE SELECTOR FOR THIS EYE */}
              <div className="mb-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[13px] font-bold uppercase tracking-wider text-slate-600">
                    Lens Category
                  </label>
                  <select
                    value={eyeData.lensCategory}
                    onChange={(e) => updateEye(eyeKey, "lensCategory", e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-blue-50/50 px-2.5 py-1.5 text-xs font-semibold text-blue-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="soft">Soft Contact Lens</option>
                    <option value="rgp">Corneal RGP Lens</option>
                    <option value="scleral">Scleral Lens</option>
                  </select>
                </div>
              </div>

              {/* TOPOGRAPHY / KERATOMETRY & OCULAR SURFACE */}
              <div className="mb-3 rounded-lg bg-slate-50 p-3">
                <h4 className="mb-2 text-xs font-bold text-slate-700">
                  Corneal Topography / Keratometry & Anterior Segment
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Flat K / Steep K</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Flat K"
                        value={eyeData.flatK}
                        onChange={(e) => updateEye(eyeKey, "flatK", e.target.value)}
                        className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Steep K"
                        value={eyeData.steepK}
                        onChange={(e) => updateEye(eyeKey, "steepK", e.target.value)}
                        className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">K Axis / Ectasia Type</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Axis"
                        value={eyeData.kAxis}
                        onChange={(e) => updateEye(eyeKey, "kAxis", e.target.value)}
                        className="w-1/3 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Ectasia/Cone"
                        value={eyeData.ectasiaConeType}
                        onChange={(e) => updateEye(eyeKey, "ectasiaConeType", e.target.value)}
                        className="w-2/3 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">HVID / Pupil Size</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="HVID (mm)"
                        value={eyeData.hvid}
                        onChange={(e) => updateEye(eyeKey, "hvid", e.target.value)}
                        className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Pupil (mm)"
                        value={eyeData.pupilPhotopic}
                        onChange={(e) => updateEye(eyeKey, "pupilPhotopic", e.target.value)}
                        className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Tear Film / TBUT (sec)</label>
                    <input
                      type="text"
                      placeholder="TBUT sec"
                      value={eyeData.tbutSec}
                      onChange={(e) => updateEye(eyeKey, "tbutSec", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Cornea & Conjunctiva Health</label>
                    <input
                      type="text"
                      placeholder="Staining, scars, neovascularization, hyperemia..."
                      value={eyeData.corneaStatus}
                      onChange={(e) => updateEye(eyeKey, "corneaStatus", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Lids & Lashes (MGD/Bleph)</label>
                    <input
                      type="text"
                      placeholder="Lid margin, meibomian glands..."
                      value={eyeData.lidsLashes}
                      onChange={(e) => updateEye(eyeKey, "lidsLashes", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* TRIAL LENS PARAMETERS */}
              <div className="mb-3 rounded-lg border border-slate-200 p-3">
                <h4 className="mb-2 text-xs font-bold text-slate-700">Trial Lens Parameters</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Brand / Material / Dk</label>
                    <input
                      type="text"
                      placeholder="e.g. Zenlens / Boston XO2"
                      value={eyeData.brandMaterialDk}
                      onChange={(e) => updateEye(eyeKey, "brandMaterialDk", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Base Curve (BC) / Sag Depth</label>
                    <input
                      type="text"
                      placeholder="e.g. 8.6 mm / 4200 μm"
                      value={eyeData.baseCurveSag}
                      onChange={(e) => updateEye(eyeKey, "baseCurveSag", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Overall Diameter (OAD)</label>
                    <input
                      type="text"
                      placeholder="e.g. 14.2 / 16.5 mm"
                      value={eyeData.overallDiameter}
                      onChange={(e) => updateEye(eyeKey, "overallDiameter", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Power (Sph / Cyl / Axis)</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Sph"
                        value={eyeData.powerSph}
                        onChange={(e) => updateEye(eyeKey, "powerSph", e.target.value)}
                        className="w-1/3 rounded-lg border border-slate-300 px-1.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Cyl"
                        value={eyeData.powerCyl}
                        onChange={(e) => updateEye(eyeKey, "powerCyl", e.target.value)}
                        className="w-1/3 rounded-lg border border-slate-300 px-1.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Axis"
                        value={eyeData.powerAxis}
                        onChange={(e) => updateEye(eyeKey, "powerAxis", e.target.value)}
                        className="w-1/3 rounded-lg border border-slate-300 px-1.5 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC FIT EVALUATION */}
              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                <h4 className="mb-2 text-xs font-bold text-blue-900">
                  Fitting Assessment ({eyeData.lensCategory.toUpperCase()})
                </h4>

                {eyeData.lensCategory === "soft" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Centration</label>
                      <select
                        value={eyeData.softCentration}
                        onChange={(e) => updateEye(eyeKey, "softCentration", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="centered">Centered</option>
                        <option value="decentered">Decentered</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Movement with Blink</label>
                      <select
                        value={eyeData.softMovement}
                        onChange={(e) => updateEye(eyeKey, "softMovement", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="optimal">Optimal (0.2–0.5mm)</option>
                        <option value="tight">Tight (&lt; 0.2mm)</option>
                        <option value="loose">Loose (&gt; 0.5mm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Push-Up Test</label>
                      <select
                        value={eyeData.softPushUp}
                        onChange={(e) => updateEye(eyeKey, "softPushUp", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="normal">Normal (45–50%)</option>
                        <option value="tight">Slow Recovery (Tight)</option>
                        <option value="loose">Instant Recovery (Loose)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Lag</label>
                      <select
                        value={eyeData.softLag}
                        onChange={(e) => updateEye(eyeKey, "softLag", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="normal">Normal</option>
                        <option value="excessive">Excessive</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                  </div>
                )}

                {eyeData.lensCategory === "rgp" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Fluorescein Pattern (Apical)</label>
                      <select
                        value={eyeData.rgpApicalPattern}
                        onChange={(e) => updateEye(eyeKey, "rgpApicalPattern", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="alignment">Parallel / Alignment</option>
                        <option value="clearance">Apical Clearance (Steep)</option>
                        <option value="touch">Apical Touch (Flat)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Edge Lift / Clearance</label>
                      <select
                        value={eyeData.rgpEdgeLift}
                        onChange={(e) => updateEye(eyeKey, "rgpEdgeLift", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="optimal">Optimal (0.3–0.5mm)</option>
                        <option value="narrow">Narrow / Tight</option>
                        <option value="excessive">Excessive / Wide</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Centration & Dynamic Movement</label>
                      <select
                        value={eyeData.rgpCentration}
                        onChange={(e) => updateEye(eyeKey, "rgpCentration", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="centered">Centered / Good Movement</option>
                        <option value="high_riding">High-Riding</option>
                        <option value="low_riding">Low-Riding</option>
                      </select>
                    </div>
                  </div>
                )}

                {eyeData.lensCategory === "scleral" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Central Vault Clearance (μm)</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Initial μm"
                          value={eyeData.scleralCentralVaultInitial}
                          onChange={(e) => updateEye(eyeKey, "scleralCentralVaultInitial", e.target.value)}
                          className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Settled μm"
                          value={eyeData.scleralCentralVaultSettlement}
                          onChange={(e) => updateEye(eyeKey, "scleralCentralVaultSettlement", e.target.value)}
                          className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Limbal Clearance</label>
                      <select
                        value={eyeData.scleralLimbalClearance}
                        onChange={(e) => updateEye(eyeKey, "scleralLimbalClearance", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="adequate">Adequate (~50–100μm)</option>
                        <option value="bearing">Limbal Bearing</option>
                        <option value="high_vault">High Vault / Stagnation</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Landing Zone Alignment</label>
                      <select
                        value={eyeData.scleralLandingZone}
                        onChange={(e) => updateEye(eyeKey, "scleralLandingZone", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="alignment">Alignment</option>
                        <option value="impingement">Impingement / Compression</option>
                        <option value="blanching">Vessel Blanching</option>
                        <option value="edge_lift">Edge Lift</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* OVER-REFRACTION & FINAL VA */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Over-Refraction Sph</label>
                  <input
                    type="text"
                    placeholder="e.g. +0.50"
                    value={eyeData.overRefractionSph}
                    onChange={(e) => updateEye(eyeKey, "overRefractionSph", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Over-Refraction Cyl / Axis</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Cyl"
                      value={eyeData.overRefractionCyl}
                      onChange={(e) => updateEye(eyeKey, "overRefractionCyl", e.target.value)}
                      className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Axis"
                      value={eyeData.overRefractionAxis}
                      onChange={(e) => updateEye(eyeKey, "overRefractionAxis", e.target.value)}
                      className="w-1/2 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Final Aided VA</label>
                  <input
                    type="text"
                    placeholder="e.g. 6/6 (20/20)"
                    value={eyeData.finalAidedVA}
                    onChange={(e) => updateEye(eyeKey, "finalAidedVA", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* FINAL ORDER & INSTRUCTIONS */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
            5. Final Order Parameters & Patient Instructions
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">Final Lens Order Parameters (OD)</label>
              <textarea
                rows={2}
                placeholder="OD BC, Dia, Power, Sag, Toricity..."
                value={contactLenses.finalOrderOD}
                onChange={(e) => updateLensField("finalOrderOD", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-600">Final Lens Order Parameters (OS)</label>
              <textarea
                rows={2}
                placeholder="OS BC, Dia, Power, Sag, Toricity..."
                value={contactLenses.finalOrderOS}
                onChange={(e) => updateLensField("finalOrderOS", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={contactLenses.instructions.insertionRemovalVerified}
                onChange={(e) => updateInstruction("insertionRemovalVerified", e.target.checked)}
                className="rounded-lg border-slate-300 text-blue-600"
              />
              Insertion & Removal Verified
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={contactLenses.instructions.noTapWaterWarning}
                onChange={(e) => updateInstruction("noTapWaterWarning", e.target.checked)}
                className="rounded-lg border-slate-300 text-blue-600"
              />
              No Tap Water Warning Given
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={contactLenses.instructions.bubbleTroubleshooting}
                onChange={(e) => updateInstruction("bubbleTroubleshooting", e.target.checked)}
                className="rounded-lg border-slate-300 text-blue-600"
              />
              Scleral Bubble Troubleshooting Checked
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SPECIALIZED CONSULTATION WORKFLOW
========================================================= */

function SpecializedConsultationSection({
  type,
  form,
  patient,
  age,
  onChange,
}) {
  const item = consultationTypes.find((entry) => entry.value === type);

  if (!item) return null;

  const Icon = item.icon;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-[#f4f9ff] px-3 py-2.5">
        <Icon size={14} className="text-blue-600" />
        <div>
          <div className="text-[12px] font-bold uppercase tracking-wider text-blue-600">
            Consultation Type
          </div>
          <h2 className="text-[12px] font-bold text-blue-700">{item.label}</h2>
        </div>
      </div>

      <div className="p-3">
        {type === "contact_lenses" && (
          <ContactLensesSection
            contactLenses={form.contactLenses}
            onChange={(updatedLenses) =>
              onChange("contactLenses", "__replace", updatedLenses)
            }
          />
        )}

        {type === "binocular_vision" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
              <strong>Binocular Vision Evaluation.</strong> Record the dedicated
              binocular, accommodative and vergence assessment for this
              consultation.
            </div>

            <ClinicalPanel
              number="01"
              title="Date / Time / Work-up done by"
              icon={CalendarDays}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label="Date"
                  type="date"
                  value={form.binocularVision.date}
                  onChange={(value) =>
                    onChange("binocularVision", "date", value)
                  }
                />
                <Input
                  label="Time"
                  type="time"
                  value={form.binocularVision.time}
                  onChange={(value) =>
                    onChange("binocularVision", "time", value)
                  }
                />
                <Input
                  label="Work-up done by"
                  value={form.binocularVision.workUpBy}
                  onChange={(value) =>
                    onChange("binocularVision", "workUpBy", value)
                  }
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel number="02" title="Patient details" icon={UserRound}>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Name"
                  value={fullName(patient) || "—"}
                  onChange={() => {}}
                />
                <Input
                  label="Age / Gender"
                  value={`${age ?? "—"} / ${patient?.gender || "—"}`}
                  onChange={() => {}}
                />
                <Input
                  label="Occupation"
                  value={form.binocularVision.occupation}
                  onChange={(value) =>
                    onChange("binocularVision", "occupation", value)
                  }
                />
                <Input
                  label="Reg. No"
                  value={
                    form.binocularVision.regNo || patient?.patientNumber || ""
                  }
                  onChange={(value) =>
                    onChange("binocularVision", "regNo", value)
                  }
                />
                <Input
                  label="Phone"
                  value={form.binocularVision.phone || patient?.phone || ""}
                  onChange={(value) =>
                    onChange("binocularVision", "phone", value)
                  }
                />
                <Input
                  label="Email"
                  value={form.binocularVision.email || patient?.email || ""}
                  onChange={(value) =>
                    onChange("binocularVision", "email", value)
                  }
                />
                <Input
                  label="Place"
                  value={form.binocularVision.place}
                  onChange={(value) =>
                    onChange("binocularVision", "place", value)
                  }
                />
              </div>
              <div className="mt-3">
                <TextArea
                  label="Chief complaints"
                  value={form.binocularVision.chiefComplaints}
                  onChange={(value) =>
                    onChange("binocularVision", "chiefComplaints", value)
                  }
                  rows={4}
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel number="05" title="Refraction" icon={Glasses}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="OD — Sphere / Cylinder / Axis / VA"
                  value={
                    form.refraction.final.right
                      ? [
                          form.refraction.final.right.sphere,
                          form.refraction.final.right.cylinder,
                          form.refraction.final.right.axis,
                          form.refraction.final.right.va,
                        ]
                          .filter(Boolean)
                          .join(" / ")
                      : ""
                  }
                  onChange={() => {}}
                />
                <Input
                  label="OS — Sphere / Cylinder / Axis / VA"
                  value={
                    form.refraction.final.left
                      ? [
                          form.refraction.final.left.sphere,
                          form.refraction.final.left.cylinder,
                          form.refraction.final.left.axis,
                          form.refraction.final.left.va,
                        ]
                          .filter(Boolean)
                          .join(" / ")
                      : ""
                  }
                  onChange={() => {}}
                />
              </div>
              <div className="mt-3">
                <TextArea
                  label="Note"
                  value={form.binocularVision.refractionNote}
                  onChange={(value) =>
                    onChange("binocularVision", "refractionNote", value)
                  }
                  rows={3}
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel number="09" title="Sensory Evaluation" icon={Eye}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Stereopsis (Near)"
                  value={form.binocularVision.sensory.stereopsisNear}
                  onChange={(value) =>
                    onChange("binocularVision", "sensory", {
                      ...form.binocularVision.sensory,
                      stereopsisNear: value,
                    })
                  }
                />
                <Input
                  label="WFDT — Distance"
                  value={form.binocularVision.sensory.wfdtDistance}
                  onChange={(value) =>
                    onChange("binocularVision", "sensory", {
                      ...form.binocularVision.sensory,
                      wfdtDistance: value,
                    })
                  }
                />
                <Input
                  label="WFDT — Intermediate"
                  value={form.binocularVision.sensory.wfdtIntermediate}
                  onChange={(value) =>
                    onChange("binocularVision", "sensory", {
                      ...form.binocularVision.sensory,
                      wfdtIntermediate: value,
                    })
                  }
                />
                <Input
                  label="WFDT — Near"
                  value={form.binocularVision.sensory.wfdtNear}
                  onChange={(value) =>
                    onChange("binocularVision", "sensory", {
                      ...form.binocularVision.sensory,
                      wfdtNear: value,
                    })
                  }
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel number="09A" title="Motor Evaluation" icon={Eye}>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  ["EOM OD", "eomOD"],
                  ["EOM OS", "eomOS"],
                  ["Saccades", "saccades"],
                  ["Pursuits", "pursuits"],
                  ["Cover test method", "coverTestMethod"],
                  ["Cover test — Distance", "coverDistance"],
                  ["Cover test — Near", "coverNear"],
                  ["Phoria Horizontal — D", "phoriaHorizontalDistance"],
                  ["Phoria Horizontal — N", "phoriaHorizontalNear"],
                  ["Phoria Vertical — D", "phoriaVerticalDistance"],
                  ["Phoria Vertical — N", "phoriaVerticalNear"],
                  ["Gradient AC/A ratio", "gradientACA"],
                ].map(([label, key]) => (
                  <Input
                    key={key}
                    label={label}
                    value={form.binocularVision.motor[key]}
                    onChange={(value) =>
                      onChange("binocularVision", "motor", {
                        ...form.binocularVision.motor,
                        [key]: value,
                      })
                    }
                  />
                ))}
              </div>
            </ClinicalPanel>

            <ClinicalPanel number="09B" title="Accommodation" icon={Eye}>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  ["NPC — Subjective", "npcAccommodativeSubjective"],
                  ["NPC — Objective", "npcAccommodativeObjective"],
                  ["NPC — Break", "npcAccommodativeBreak"],
                  ["NPC — Recovery", "npcAccommodativeRecovery"],
                  ["NPC R/G — Subjective", "npcRGSubjective"],
                  ["NPC R/G — Objective", "npcRGObjective"],
                  ["NPC R/G — Break", "npcRGBreak"],
                  ["NPC R/G — Recovery", "npcRGRecovery"],
                  ["NPA OD — cm", "npaOD"],
                  ["NPA OS — cm", "npaOS"],
                  ["NPA OU — cm", "npaOU"],
                  ["AA OD — D", "aaOD"],
                  ["AA OS — D", "aaOS"],
                  ["AA OU — D", "aaOU"],
                  ["Hofstetter Minimum AA — D", "hofstetterMinimumAA"],
                  ["MEM OD — DS", "memOD"],
                  ["MEM OS — DS", "memOS"],
                  ["NRA — DS", "nra"],
                  ["PRA — DS", "pra"],
                ].map(([label, key]) => (
                  <Input
                    key={key}
                    label={label}
                    value={form.binocularVision.accommodation[key]}
                    onChange={(value) =>
                      onChange("binocularVision", "accommodation", {
                        ...form.binocularVision.accommodation,
                        [key]: value,
                      })
                    }
                  />
                ))}
              </div>
            </ClinicalPanel>

            <ClinicalPanel
              number="09C"
              title="Fusional Vergence Amplitudes — Step Vergence"
              icon={Eye}
            >
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[720px] border-collapse text-xs">
                  <thead className="bg-slate-50 text-left font-bold text-slate-500">
                    <tr>
                      <th className="border border-slate-200 p-2">Type</th>
                      <th className="border border-slate-200 p-2">Range</th>
                      <th className="border border-slate-200 p-2">Blur</th>
                      <th className="border border-slate-200 p-2">Break</th>
                      <th className="border border-slate-200 p-2">Recovery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "NFV",
                        "D",
                        "nfvDistanceBlur",
                        "nfvDistanceBreak",
                        "nfvDistanceRecovery",
                      ],
                      [
                        "NFV",
                        "N",
                        "nfvNearBlur",
                        "nfvNearBreak",
                        "nfvNearRecovery",
                      ],
                      [
                        "PFV",
                        "D",
                        "pfvDistanceBlur",
                        "pfvDistanceBreak",
                        "pfvDistanceRecovery",
                      ],
                      [
                        "PFV",
                        "N",
                        "pfvNearBlur",
                        "pfvNearBreak",
                        "pfvNearRecovery",
                      ],
                    ].map(([typeName, range, blur, breakKey, recovery]) => (
                      <tr key={`${typeName}-${range}`}>
                        <td className="border border-slate-200 p-2 font-bold">
                          {typeName}
                        </td>
                        <td className="border border-slate-200 p-2 font-bold">
                          {range}
                        </td>
                        {[blur, breakKey, recovery].map((key) => (
                          <td key={key} className="border border-slate-200 p-1">
                            <input
                              value={form.binocularVision.fusional[key]}
                              onChange={(event) =>
                                onChange("binocularVision", "fusional", {
                                  ...form.binocularVision.fusional,
                                  [key]: event.target.value,
                                })
                              }
                              className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none focus:border-blue-400"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextArea
                  label="Comments"
                  value={form.binocularVision.fusional.comments}
                  onChange={(value) =>
                    onChange("binocularVision", "fusional", {
                      ...form.binocularVision.fusional,
                      comments: value,
                    })
                  }
                  rows={3}
                />
                <TextArea
                  label="Interpretation"
                  value={form.binocularVision.fusional.interpretation}
                  onChange={(value) =>
                    onChange("binocularVision", "fusional", {
                      ...form.binocularVision.fusional,
                      interpretation: value,
                    })
                  }
                  rows={3}
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel
              number="09D"
              title="Vergence Facility — 12 BO / 3 BI Flippers"
              icon={Eye}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label="CPM"
                  value={form.binocularVision.vergenceFacility.cpm}
                  onChange={(value) =>
                    onChange("binocularVision", "vergenceFacility", {
                      ...form.binocularVision.vergenceFacility,
                      cpm: value,
                    })
                  }
                />
                <TextArea
                  label="Comments"
                  value={form.binocularVision.vergenceFacility.comments}
                  onChange={(value) =>
                    onChange("binocularVision", "vergenceFacility", {
                      ...form.binocularVision.vergenceFacility,
                      comments: value,
                    })
                  }
                  rows={2}
                />
                <TextArea
                  label="Interpretation"
                  value={form.binocularVision.vergenceFacility.interpretation}
                  onChange={(value) =>
                    onChange("binocularVision", "vergenceFacility", {
                      ...form.binocularVision.vergenceFacility,
                      interpretation: value,
                    })
                  }
                  rows={2}
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel
              number="09E"
              title="Accommodative Facility"
              icon={Eye}
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Lens / Flipper", "lensPower"],
                  ["Test distance — cm", "testDistance"],
                  ["Amplitude", "amplitude"],
                  ["Scaled facility", "scaledFacility"],
                  ["OD — CPM", "odCPM"],
                  ["OS — CPM", "osCPM"],
                  ["OU — CPM", "ouCPM"],
                ].map(([label, key]) => (
                  <Input
                    key={key}
                    label={label}
                    value={form.binocularVision.accommodativeFacility[key]}
                    onChange={(value) =>
                      onChange("binocularVision", "accommodativeFacility", {
                        ...form.binocularVision.accommodativeFacility,
                        [key]: value,
                      })
                    }
                  />
                ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextArea
                  label="Comments"
                  value={form.binocularVision.accommodativeFacility.comments}
                  onChange={(value) =>
                    onChange("binocularVision", "accommodativeFacility", {
                      ...form.binocularVision.accommodativeFacility,
                      comments: value,
                    })
                  }
                  rows={3}
                />
                <TextArea
                  label="Interpretation"
                  value={
                    form.binocularVision.accommodativeFacility.interpretation
                  }
                  onChange={(value) =>
                    onChange("binocularVision", "accommodativeFacility", {
                      ...form.binocularVision.accommodativeFacility,
                      interpretation: value,
                    })
                  }
                  rows={3}
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel
              number="09F"
              title="Additional Findings"
              icon={FileText}
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="CISS Score"
                  value={form.binocularVision.cissScore}
                  onChange={(value) =>
                    onChange("binocularVision", "cissScore", value)
                  }
                />
                <Input
                  label="Fixation Disparity"
                  value={form.binocularVision.fixationDisparity}
                  onChange={(value) =>
                    onChange("binocularVision", "fixationDisparity", value)
                  }
                />
                <Input
                  label="Any other test(s)"
                  value={form.binocularVision.otherTests}
                  onChange={(value) =>
                    onChange("binocularVision", "otherTests", value)
                  }
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel number="10" title="Final Glass Rx" icon={Glasses}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 text-[12px] font-bold uppercase text-slate-400">
                    OD
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["sphere", "cylinder", "axis", "add", "va"].map((key) => (
                      <Input
                        key={key}
                        label={key.toUpperCase()}
                        value={form.binocularVision.finalGlassRx.od[key]}
                        onChange={(value) =>
                          onChange("binocularVision", "finalGlassRx", {
                            ...form.binocularVision.finalGlassRx,
                            od: {
                              ...form.binocularVision.finalGlassRx.od,
                              [key]: value,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 text-[12px] font-bold uppercase text-slate-400">
                    OS
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["sphere", "cylinder", "axis", "add", "va"].map((key) => (
                      <Input
                        key={key}
                        label={key.toUpperCase()}
                        value={form.binocularVision.finalGlassRx.os[key]}
                        onChange={(value) =>
                          onChange("binocularVision", "finalGlassRx", {
                            ...form.binocularVision.finalGlassRx,
                            os: {
                              ...form.binocularVision.finalGlassRx.os,
                              [key]: value,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Input
                  label="ADD OD"
                  value={form.binocularVision.finalGlassRx.addOD}
                  onChange={(value) =>
                    onChange("binocularVision", "finalGlassRx", {
                      ...form.binocularVision.finalGlassRx,
                      addOD: value,
                    })
                  }
                />
                <Input
                  label="ADD OS"
                  value={form.binocularVision.finalGlassRx.addOS}
                  onChange={(value) =>
                    onChange("binocularVision", "finalGlassRx", {
                      ...form.binocularVision.finalGlassRx,
                      addOS: value,
                    })
                  }
                />
                <Input
                  label="Prism OD"
                  value={form.binocularVision.finalGlassRx.prismOD}
                  onChange={(value) =>
                    onChange("binocularVision", "finalGlassRx", {
                      ...form.binocularVision.finalGlassRx,
                      prismOD: value,
                    })
                  }
                />
                <Input
                  label="Prism OS"
                  value={form.binocularVision.finalGlassRx.prismOS}
                  onChange={(value) =>
                    onChange("binocularVision", "finalGlassRx", {
                      ...form.binocularVision.finalGlassRx,
                      prismOS: value,
                    })
                  }
                />
              </div>
            </ClinicalPanel>

            <ClinicalPanel
              number="11"
              title="Diagnosis / Impression"
              icon={HeartPulse}
            >
              <TextArea
                label="SIGN / OBSERVATION / ASSESSMENT / PLANNING"
                value={form.binocularVision.diagnosis}
                onChange={(value) =>
                  onChange("binocularVision", "diagnosis", value)
                }
                rows={6}
              />
            </ClinicalPanel>

            <ClinicalPanel
              number="12"
              title="Advice / Follow-up"
              icon={FileText}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <TextArea
                  label="Advice"
                  value={form.binocularVision.advice}
                  onChange={(value) =>
                    onChange("binocularVision", "advice", value)
                  }
                  rows={6}
                />
                <div className="space-y-3">
                  <Input
                    label="Follow-up"
                    type="date"
                    value={form.binocularVision.followUp}
                    onChange={(value) =>
                      onChange("binocularVision", "followUp", value)
                    }
                  />
                  <TextArea
                    label="Notes"
                    value={form.binocularVision.notes}
                    onChange={(value) =>
                      onChange("binocularVision", "notes", value)
                    }
                    rows={4}
                  />
                </div>
              </div>
            </ClinicalPanel>
          </div>
        )}

        {type === "low_vision" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Distance VA"
              value={form.lowVision.distanceVA}
              onChange={(value) => onChange("lowVision", "distanceVA", value)}
            />
            <Input
              label="Near VA"
              value={form.lowVision.nearVA}
              onChange={(value) => onChange("lowVision", "nearVA", value)}
            />
            <Input
              label="Contrast"
              value={form.lowVision.contrast}
              onChange={(value) => onChange("lowVision", "contrast", value)}
            />
            <Input
              label="Visual Field"
              value={form.lowVision.visualField}
              onChange={(value) => onChange("lowVision", "visualField", value)}
            />
            <Input
              label="Magnification"
              value={form.lowVision.magnification}
              onChange={(value) =>
                onChange("lowVision", "magnification", value)
              }
            />
            <Input
              label="Assistive Device"
              value={form.lowVision.assistiveDevice}
              onChange={(value) =>
                onChange("lowVision", "assistiveDevice", value)
              }
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <TextArea
                label="Advice"
                value={form.lowVision.advice}
                onChange={(value) => onChange("lowVision", "advice", value)}
                rows={4}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   INPUTS
========================================================= */

function VisualAcuityTable({ data = {}, onChange, onNotesChange }) {
  const eyes = [
    { key: "right", label: "Right Eye (OD)" },
    { key: "left", label: "Left Eye (OS)" },
    { key: "both", label: "Both Eyes (OU)" },
  ];

  const renderTable = (title, farField, nearField) => (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px] border-collapse text-xs">
          <thead>
            <tr className="bg-white text-left text-[12px] font-bold text-slate-500">
              <th className="w-[42%] border-b border-r border-slate-200 px-3 py-2">Eye</th>
              <th className="border-b border-r border-slate-200 px-2 py-2">Far</th>
              <th className="border-b border-slate-200 px-2 py-2">Near</th>
            </tr>
          </thead>
          <tbody>
            {eyes.map((eye) => {
              const eyeData = data?.[eye.key] || {};
              return (
                <tr key={eye.key}>
                  <td className="border-r border-b border-slate-200 bg-slate-50/60 px-3 py-2 font-semibold text-slate-600">
                    {eye.label}
                  </td>
                  <td className="border-r border-b border-slate-200 p-1.5">
                    <input
                      value={eyeData[farField] || ""}
                      onChange={(event) => onChange(eye.key, farField, event.target.value)}
                      aria-label={`${title} ${eye.label} far visual acuity`}
                      placeholder="e.g. 6/6"
                      className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    />
                  </td>
                  <td className="border-b border-slate-200 p-1.5">
                    <input
                      value={eyeData[nearField] || ""}
                      onChange={(event) => onChange(eye.key, nearField, event.target.value)}
                      aria-label={`${title} ${eye.label} near visual acuity`}
                      placeholder="e.g. N6"
                      className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 2xl:grid-cols-2">
        {renderTable("Unaided Visual Acuity", "unaidedDistance", "near")}
        {renderTable("Aided Visual Acuity", "aidedDistance", "aidedNear")}
      </div>
      <TextArea
        label="Visual Acuity Notes"
        value={data?.notes || ""}
        onChange={onNotesChange}
        rows={3}
        placeholder="Enter visual acuity observations or remarks..."
      />
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = "", rows = 4 }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* =========================================================
   SERIALIZATION
========================================================= */

const isBlankClinicalValue = (value) => {
  if (value === null || value === undefined) return true;

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return (
      value.length === 0 ||
      value.every(isBlankClinicalValue)
    );
  }

  if (typeof value === "object") {
    const entries = Object.values(value);

    return (
      entries.length === 0 ||
      entries.every(isBlankClinicalValue)
    );
  }

  return false;
};

const clinicalFieldLabel = (key) => {
  const knownLabels = {
    anteriorChamber: "Anterior Chamber",
    cdRatio: "C/D Ratio",
    nearVa: "Near VA",
    right: "Right Eye",
    left: "Left Eye",
    od: "OD",
    os: "OS",
    ou: "OU",
    va: "VA",
  };

  if (knownLabels[key]) return knownLabels[key];

  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();
};

/**
 * Convert clinical values into readable text for legacy text fields.
 * Keep the original structured objects in the payload as well.
 */
const toClinicalText = (value) => {
  if (isBlankClinicalValue(value)) return "";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map(toClinicalText)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, nestedValue]) =>
        !isBlankClinicalValue(nestedValue),
      )
      .map(
        ([key, nestedValue]) =>
          `${clinicalFieldLabel(key)}: ${toClinicalText(nestedValue)}`,
      )
      .join(" • ");
  }

  return String(value).trim();
};

function formatSlitLamp(slitLamp) {
  if (!slitLamp || typeof slitLamp !== "object") return "";

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
      const right = toClinicalText(slitLamp.right?.[field]);
      const left = toClinicalText(slitLamp.left?.[field]);

      if (!right && !left) return "";

      return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
    })
    .filter(Boolean)
    .join("\n");
}

function formatFundus(fundus) {
  if (!fundus || typeof fundus !== "object") return "";

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
      const right = toClinicalText(fundus.right?.[field]);
      const left = toClinicalText(fundus.left?.[field]);

      if (!right && !left) return "";

      return `${label}: OD ${right || "—"} | OS ${left || "—"}`;
    })
    .filter(Boolean)
    .join("\n");
}



