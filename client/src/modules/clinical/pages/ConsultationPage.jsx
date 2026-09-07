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

import { getPatient } from "../../patients/patient.api"
import {
  createConsultation,
  getPatientConsultations,
} from "../consultation.api"

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

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birth = new Date(dateOfBirth);

  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
};

const emptyEye = () => ({
  va: "",
  sphere: "",
  cylinder: "",
  axis: "",
  add: "",
  nearVa: "",
  prism: "",
  base: "",
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

const consultationTypes = [
  {
    value: "comprehensive",
    label: "Comprehensive",
    description:
      "Complete eye examination, refraction and clinical assessment.",
    icon: Eye,
  },
  {
    value: "short_consult",
    label: "Short Consult",
    description:
      "Quick consultation for routine or focused patient visits.",
    icon: ClipboardPlus,
  },
];

const specializedTypes = [
  {
    value: "binocular_vision",
    label: "Binocular Vision",
  },
  {
    value: "low_vision",
    label: "Low Vision",
  },
  {
    value: "contact_lenses",
    label: "Contact Lenses",
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

const initialForm = {
  consultationType: "comprehensive",

  symptoms: "",
  medicalHistory: "",
  ocularHistory: "",
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

  diagnosisNotes: "",

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

  prescription: {
    type: "spectacle",
    note: "",
  },

  dispensing: {
    spectacleRequired: false,
    frame: "",
    lensType: "",
    material: "",
    coating: "",
    pd: "",
    fittingHeight: "",
    frameSize: "",
    remarks: "",
  },

  therapeutics: {
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  },

  recall: {
    enabled: false,
    date: "",
    type: "",
    message: "",
  },

  notes: "",
  internalNotes: "",
};

export default function ConsultationPage() {
  const { patientId: routePatientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Supports both /patients/:patientId/consultations/new and /consultations/new?patientId=...
  const patientId = routePatientId || searchParams.get("patientId") || "";

  const [patient, setPatient] = useState(null);
  const [previousConsultations, setPreviousConsultations] = useState([]);

  const [loadingPatient, setLoadingPatient] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [consultationStarted, setConsultationStarted] =
    useState(false);

  const [dirty, setDirty] = useState(false);

  const [showTypeSelector, setShowTypeSelector] =
    useState(true);

  const [form, setForm] = useState(initialForm);

  const [expandedSections, setExpandedSections] = useState({
    patient: true,
    symptoms: true,
    visualAcuity: true,
    refraction: true,
    binocularVision: false,
    tests: true,
    slitLamp: true,
    fundus: true,
    diagnosis: true,
    advice: true,
    prescription: true,
    dispensing: true,
    therapeutics: true,
    recall: true,
    notes: true,
  });

  /* =========================================================
     LOAD PATIENT
  ========================================================= */

  useEffect(() => {
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

        setPatient(patientData);

        try {
          const consultationsResponse =
            await getPatientConsultations(patientId);

          const rows = Array.isArray(
            consultationsResponse?.data
          )
            ? consultationsResponse.data
            : Array.isArray(
                consultationsResponse?.data?.consultations
              )
              ? consultationsResponse.data.consultations
              : [];

          setPreviousConsultations(rows);
        } catch {
          setPreviousConsultations([]);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load patient record."
        );
      } finally {
        setLoadingPatient(false);
      }
    };

    loadPatient();
  }, [patientId]);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const age = useMemo(
    () => calculateAge(patient?.dateOfBirth),
    [patient?.dateOfBirth]
  );

  const selectedType = useMemo(
    () =>
      consultationTypes.find(
        (item) => item.value === form.consultationType
      ),
    [form.consultationType]
  );

  const isComprehensive =
    form.consultationType === "comprehensive";

  /* =========================================================
     FORM HELPERS
  ========================================================= */

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

  const updateDeep = (
    section,
    subsection,
    key,
    value
  ) => {
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

  const updateEyeField = (
    section,
    eye,
    field,
    value
  ) => {
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

  const toggleSection = (section) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  /* =========================================================
     CONSULTATION TYPE
  ========================================================= */

  const startConsultation = (type) => {
    setForm((current) => ({
      ...current,
      consultationType: type,
    }));

    setConsultationStarted(true);
    setShowTypeSelector(false);
    setError("");
  };

  const changeConsultationType = () => {
    setShowTypeSelector(true);
  };

  /* =========================================================
     TESTS
  ========================================================= */

  const addTest = () => {
    setForm((current) => ({
      ...current,
      additionalTests: [
        ...current.additionalTests,
        {
          name: "Visual Field",
          result: "",
        },
      ],
    }));
  };

  const updateTest = (index, field, value) => {
    setForm((current) => ({
      ...current,
      additionalTests: current.additionalTests.map(
        (test, testIndex) =>
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
    setForm((current) => ({
      ...current,
      additionalTests: current.additionalTests.filter(
        (_, testIndex) => testIndex !== index
      ),
    }));
  };

  /* =========================================================
     DIAGNOSIS
  ========================================================= */

  const addDiagnosis = () => {
    setForm((current) => ({
      ...current,
      diagnosis: [
        ...current.diagnosis,
        {
          condition: "",
          eye: "Both",
          notes: "",
        },
      ],
    }));
  };

  const updateDiagnosis = (
    index,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      diagnosis: current.diagnosis.map(
        (item, diagnosisIndex) =>
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
    setForm((current) => ({
      ...current,
      diagnosis: current.diagnosis.filter(
        (_, diagnosisIndex) =>
          diagnosisIndex !== index
      ),
    }));
  };

  /* =========================================================
     ADVICE
  ========================================================= */

  const adviceOptions = [
    ["distanceWork", "Follow 20-20-20 rule"],
    ["nearWork", "Maintain proper reading distance"],
    ["screenBreaks", "Take regular screen breaks"],
    ["hygiene", "Maintain eye hygiene"],
    ["sunProtection", "Use UV protection"],
    ["followUp", "Return for follow-up"],
    ["spectacleWear", "Wear spectacles as advised"],
    ["contactLensCare", "Follow contact lens care"],
  ];

  /* =========================================================
     SAVE
  ========================================================= */

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

      /*
       * We send both the new structured clinical data
       * and the existing fields expected by your current
       * Consultation controller.
       */

      const slitLampText = formatSlitLamp(
        form.slitLamp
      );

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

      const therapeuticText = [
        form.therapeutics.medication,
        form.therapeutics.dosage,
        form.therapeutics.frequency,
        form.therapeutics.duration,
        form.therapeutics.instructions,
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        patientId,

        consultationType: form.consultationType,

        symptoms: form.symptoms,

        medication: therapeuticText,

        allergy: form.allergies,

        pupils: "",

        ophthalmoscopy: fundusText,

        biomicroscopy: slitLampText,

        visualField:
          form.additionalTests
            .filter(
              (test) =>
                test.name === "Visual Field"
            )
            .map((test) => test.result)
            .filter(Boolean)
            .join("\n"),

        colourVision:
          form.additionalTests
            .filter(
              (test) =>
                test.name === "Colour Vision"
            )
            .map((test) => test.result)
            .filter(Boolean)
            .join("\n"),

        otherTests: form.additionalTests.filter(
          (test) =>
            ![
              "Visual Field",
              "Colour Vision",
            ].includes(test.name)
        ),

        previousRx: {
          right: form.refraction.previous.right,
          left: form.refraction.previous.left,
          note: "",
        },

        subjectiveRx: {
          right: form.refraction.subjective.right,
          left: form.refraction.subjective.left,
          note: form.prescription.note,
        },

        givenRx: {
          right: form.refraction.final.right,
          left: form.refraction.final.left,
          note: form.prescription.note,
        },

        pd: form.refraction.pd,

        recallDue: form.recall.enabled
          ? form.recall.date || null
          : null,

        recallLetter: form.recall.type || "",

        notes: [
          form.medicalHistory
            ? `Medical history: ${form.medicalHistory}`
            : "",
          form.ocularHistory
            ? `Ocular history: ${form.ocularHistory}`
            : "",
          form.familyHistory
            ? `Family history: ${form.familyHistory}`
            : "",
          diagnosisText
            ? `Diagnosis:\n${diagnosisText}`
            : "",
          adviceText
            ? `Advice:\n${adviceText}`
            : "",
          form.notes
            ? `Clinical notes:\n${form.notes}`
            : "",
          form.internalNotes
            ? `Internal notes:\n${form.internalNotes}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n"),

        /*
         * New structured fields.
         * These require the backend schema to accept them.
         */
        visualAcuity: form.visualAcuity,

        refraction: form.refraction,

        binocularVision:
          form.binocularVision,

        lowVision: form.lowVision,

        contactLenses:
          form.contactLenses,

        slitLamp: form.slitLamp,

        fundus: form.fundus,

        diagnosis: form.diagnosis,

        advice: form.advice,

        prescription: form.prescription,

        dispensing: form.dispensing,

        therapeutics: form.therapeutics,

        recall: form.recall,
      };

      const response =
        await createConsultation(payload);

      if (!response) {
        throw new Error(
          "Consultation could not be saved."
        );
      }

      setDirty(false);

      setSuccess(
        "Consultation saved successfully."
      );

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

  /* =========================================================
     LOADING
  ========================================================= */

  if (loadingPatient) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading patient record...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Patient record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 py-5 sm:py-7">
      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/patients/${patientId}`)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
          </button>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-600">
              Clinical workspace
            </div>

            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              New Consultation
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {consultationStarted && dirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
          {consultationStarted && (
            <button
              type="button"
              onClick={changeConsultationType}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
            >
              <Stethoscope size={14} />
              {selectedType?.label}
              <ChevronDown size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              navigate(`/patients/${patientId}`)
            }
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-700"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* =====================================================
          PATIENT HEADER
      ====================================================== */}

      <PatientHeader
        patient={patient}
        age={age}
      />

      {/* =====================================================
          CONSULTATION TYPE SELECTOR
      ====================================================== */}

      {showTypeSelector && (
        <ConsultationTypeSelector
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
          CONSULTATION FORM
      ====================================================== */}

      {consultationStarted && (
        <form
          id="consultation-form"
          onSubmit={handleSave}
          className="space-y-4"
        >
          {/* PATIENT / VISIT */}
          <ClinicalSection
            number="01"
            title="Patient & Visit"
            subtitle="Patient identification and consultation details"
            icon={UserRound}
            open={expandedSections.patient}
            onToggle={() =>
              toggleSection("patient")
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoField
                label="Patient"
                value={fullName(patient)}
              />

              <InfoField
                label="Patient number"
                value={patient.patientNumber}
              />

              <InfoField
                label="Date of birth"
                value={formatDate(
                  patient.dateOfBirth
                )}
              />

              <InfoField
                label="Age"
                value={
                  age !== null
                    ? `${age} years`
                    : "Not recorded"
                }
              />

              <InfoField
                label="Gender"
                value={patient.gender}
              />

              <InfoField
                label="Phone"
                value={patient.phone}
              />

              <InfoField
                label="Consultation"
                value={selectedType?.label}
              />

              <InfoField
                label="Previous visits"
                value={previousConsultations.length}
              />
            </div>
          </ClinicalSection>

          {/* SYMPTOMS */}
          <ClinicalSection
            number="02"
            title="Symptoms & History"
            subtitle="Reason for visit and relevant history"
            icon={History}
            open={expandedSections.symptoms}
            onToggle={() =>
              toggleSection("symptoms")
            }
          >
            <div className="space-y-5">
              <TextArea
                label="Presenting symptoms / reason for visit"
                value={form.symptoms}
                onChange={(value) =>
                  updateForm("symptoms", value)
                }
                placeholder="Describe the patient's main complaint, onset, duration and relevant symptoms..."
                rows={4}
              />

              <div className="grid gap-5 lg:grid-cols-2">
                <TextArea
                  label="Medical history"
                  value={form.medicalHistory}
                  onChange={(value) =>
                    updateForm(
                      "medicalHistory",
                      value
                    )
                  }
                  placeholder="Diabetes, hypertension, systemic conditions, previous surgeries..."
                />

                <TextArea
                  label="Ocular history"
                  value={form.ocularHistory}
                  onChange={(value) =>
                    updateForm(
                      "ocularHistory",
                      value
                    )
                  }
                  placeholder="Previous eye conditions, trauma, surgery, glaucoma, cataract..."
                />

                <TextArea
                  label="Family history"
                  value={form.familyHistory}
                  onChange={(value) =>
                    updateForm(
                      "familyHistory",
                      value
                    )
                  }
                  placeholder="Relevant family ocular or systemic history..."
                />

                <TextArea
                  label="Allergies"
                  value={form.allergies}
                  onChange={(value) =>
                    updateForm(
                      "allergies",
                      value
                    )
                  }
                  placeholder="Drug, food or other allergies..."
                />

                <TextArea
                  label="Current medications"
                  value={form.medications}
                  onChange={(value) =>
                    updateForm(
                      "medications",
                      value
                    )
                  }
                  placeholder="Current medication and treatment history..."
                />
              </div>
            </div>
          </ClinicalSection>

          {/* VISUAL ACUITY */}
          <ClinicalSection
            number="03"
            title="Visual Acuity"
            subtitle="Unaided, aided and pinhole visual acuity"
            icon={Eye}
            open={expandedSections.visualAcuity}
            onToggle={() =>
              toggleSection("visualAcuity")
            }
          >
            <EyeTable
              columns={[
                "Unaided Distance",
                "Aided Distance",
                "Pinhole",
                "Near",
              ]}
              rows={[
                {
                  label: "OD",
                  values:
                    form.visualAcuity.right,
                  eye: "right",
                },
                {
                  label: "OS",
                  values:
                    form.visualAcuity.left,
                  eye: "left",
                },
              ]}
              fields={[
                "unaidedDistance",
                "aidedDistance",
                "pinhole",
                "near",
              ]}
              onChange={(eye, field, value) =>
                updateDeep(
                  "visualAcuity",
                  eye,
                  field,
                  value
                )
              }
            />
          </ClinicalSection>

          {/* REFRACTION */}
          <ClinicalSection
            number="04"
            title="Refraction"
            subtitle="Previous, objective, subjective and final prescription"
            icon={Glasses}
            open={expandedSections.refraction}
            onToggle={() =>
              toggleSection("refraction")
            }
          >
            <div className="space-y-7">
              <RefractionBlock
                title="Previous Prescription"
                data={form.refraction.previous}
                onChange={(eye, field, value) =>
                  updateEyeField(
                    "refraction",
                    "previous",
                    eye,
                    field,
                    value
                  )
                }
              />

              <RefractionBlock
                title="Objective Refraction"
                data={form.refraction.objective}
                onChange={(eye, field, value) =>
                  updateEyeField(
                    "refraction",
                    "objective",
                    eye,
                    field,
                    value
                  )
                }
              />

              <RefractionBlock
                title="Subjective Refraction"
                data={form.refraction.subjective}
                onChange={(eye, field, value) =>
                  updateEyeField(
                    "refraction",
                    "subjective",
                    eye,
                    field,
                    value
                  )
                }
              />

              <RefractionBlock
                title="Final / Given Prescription"
                data={form.refraction.final}
                onChange={(eye, field, value) =>
                  updateEyeField(
                    "refraction",
                    "final",
                    eye,
                    field,
                    value
                  )
                }
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-xs font-bold text-slate-800">
                  Pupillary Distance
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Right PD"
                    value={
                      form.refraction.pd.right
                    }
                    onChange={(value) =>
                      updateDeep(
                        "refraction",
                        "pd",
                        "right",
                        value
                      )
                    }
                    placeholder="e.g. 31"
                  />

                  <Input
                    label="Left PD"
                    value={
                      form.refraction.pd.left
                    }
                    onChange={(value) =>
                      updateDeep(
                        "refraction",
                        "pd",
                        "left",
                        value
                      )
                    }
                    placeholder="e.g. 31"
                  />

                  <Input
                    label="Total PD"
                    value={
                      form.refraction.pd.total
                    }
                    onChange={(value) =>
                      updateDeep(
                        "refraction",
                        "pd",
                        "total",
                        value
                      )
                    }
                    placeholder="e.g. 62"
                  />
                </div>
              </div>
            </div>
          </ClinicalSection>

          {/* BINOCULAR VISION */}
          {(isComprehensive ||
            form.consultationType ===
              "binocular_vision") && (
            <ClinicalSection
              number="05"
              title="Binocular Vision"
              subtitle="Binocular vision and accommodation assessment"
              icon={Eye}
              open={expandedSections.binocularVision}
              onToggle={() =>
                toggleSection(
                  "binocularVision"
                )
              }
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Cover Test — Distance"
                  value={
                    form.binocularVision
                      .coverTestDistance
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
                    form.binocularVision
                      .coverTestNear
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
                  value={
                    form.binocularVision.npc
                  }
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
                    form.binocularVision
                      .worthFourDot
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
                    form.binocularVision
                      .stereopsis
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
                    form.binocularVision
                      .vergenceBI
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
                    form.binocularVision
                      .vergenceBO
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
                    form.binocularVision
                      .accommodation
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

              <div className="mt-5">
                <TextArea
                  label="Binocular vision findings"
                  value={
                    form.binocularVision
                      .findings
                  }
                  onChange={(value) =>
                    updateNested(
                      "binocularVision",
                      "findings",
                      value
                    )
                  }
                  rows={4}
                />
              </div>
            </ClinicalSection>
          )}

          {/* ADD TEST */}
          <ClinicalSection
            number="06"
            title="Additional Tests"
            subtitle="Add and record additional clinical tests"
            icon={Stethoscope}
            open={expandedSections.tests}
            onToggle={() =>
              toggleSection("tests")
            }
            action={
              <button
                type="button"
                onClick={addTest}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"
              >
                <Plus size={13} />
                Add Test
              </button>
            }
          >
            {form.additionalTests.length ===
            0 ? (
              <EmptyState
                icon={Stethoscope}
                title="No additional tests"
                description="Use Add Test to record visual field, colour vision, OCT, tonometry and other tests."
              />
            ) : (
              <div className="space-y-4">
                {form.additionalTests.map(
                  (test, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800">
                          Test {index + 1}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeTest(index)
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                        <Select
                          label="Test"
                          value={test.name}
                          options={testTypes}
                          onChange={(value) =>
                            updateTest(
                              index,
                              "name",
                              value
                            )
                          }
                        />

                        <TextArea
                          label="Result / Findings"
                          value={test.result}
                          onChange={(value) =>
                            updateTest(
                              index,
                              "result",
                              value
                            )
                          }
                          rows={3}
                          placeholder="Enter test findings..."
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* SPECIALIZED LOW VISION */}
            {form.consultationType ===
              "low_vision" && (
              <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
                <div className="mb-4 text-xs font-bold uppercase tracking-wider text-violet-700">
                  Low Vision Assessment
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Distance VA"
                    value={
                      form.lowVision
                        .distanceVA
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "distanceVA",
                        value
                      )
                    }
                  />

                  <Input
                    label="Near VA"
                    value={
                      form.lowVision.nearVA
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "nearVA",
                        value
                      )
                    }
                  />

                  <Input
                    label="Contrast"
                    value={
                      form.lowVision.contrast
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "contrast",
                        value
                      )
                    }
                  />

                  <Input
                    label="Visual Field"
                    value={
                      form.lowVision
                        .visualField
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "visualField",
                        value
                      )
                    }
                  />

                  <Input
                    label="Magnification"
                    value={
                      form.lowVision
                        .magnification
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "magnification",
                        value
                      )
                    }
                  />

                  <Input
                    label="Assistive Device"
                    value={
                      form.lowVision
                        .assistiveDevice
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "assistiveDevice",
                        value
                      )
                    }
                  />
                </div>

                <div className="mt-4">
                  <TextArea
                    label="Low vision advice"
                    value={
                      form.lowVision.advice
                    }
                    onChange={(value) =>
                      updateNested(
                        "lowVision",
                        "advice",
                        value
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* CONTACT LENS */}
            {form.consultationType ===
              "contact_lenses" && (
              <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5">
                <div className="mb-4 text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Contact Lens Assessment
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Lens Type"
                    value={
                      form.contactLenses
                        .lensType
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "lensType",
                        value
                      )
                    }
                  />

                  <Input
                    label="Brand"
                    value={
                      form.contactLenses
                        .brand
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "brand",
                        value
                      )
                    }
                  />

                  <Input
                    label="Base Curve"
                    value={
                      form.contactLenses
                        .baseCurve
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "baseCurve",
                        value
                      )
                    }
                  />

                  <Input
                    label="Diameter"
                    value={
                      form.contactLenses
                        .diameter
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "diameter",
                        value
                      )
                    }
                  />

                  <Input
                    label="OD Power"
                    value={
                      form.contactLenses
                        .rightPower
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "rightPower",
                        value
                      )
                    }
                  />

                  <Input
                    label="OS Power"
                    value={
                      form.contactLenses
                        .leftPower
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "leftPower",
                        value
                      )
                    }
                  />

                  <Input
                    label="Replacement"
                    value={
                      form.contactLenses
                        .replacement
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "replacement",
                        value
                      )
                    }
                  />

                  <Input
                    label="Wear Schedule"
                    value={
                      form.contactLenses
                        .wearSchedule
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "wearSchedule",
                        value
                      )
                    }
                  />

                  <Input
                    label="Solution"
                    value={
                      form.contactLenses
                        .solution
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "solution",
                        value
                      )
                    }
                  />
                </div>

                <div className="mt-4">
                  <TextArea
                    label="Contact lens advice"
                    value={
                      form.contactLenses.advice
                    }
                    onChange={(value) =>
                      updateNested(
                        "contactLenses",
                        "advice",
                        value
                      )
                    }
                  />
                </div>
              </div>
            )}
          </ClinicalSection>

          {/* SLIT LAMP */}
          {isComprehensive && (
            <ClinicalSection
              number="07"
              title="Slit Lamp Examination"
              subtitle="Anterior segment examination"
              icon={Eye}
              open={expandedSections.slitLamp}
              onToggle={() =>
                toggleSection("slitLamp")
              }
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
            </ClinicalSection>
          )}

          {/* FUNDUS */}
          {isComprehensive && (
            <ClinicalSection
              number="08"
              title="Fundus Examination"
              subtitle="Posterior segment examination"
              icon={Eye}
              open={expandedSections.fundus}
              onToggle={() =>
                toggleSection("fundus")
              }
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
            </ClinicalSection>
          )}

          {/* DIAGNOSIS */}
          <ClinicalSection
            number="09"
            title="Diagnosis"
            subtitle="Clinical findings and diagnosis"
            icon={HeartPulse}
            open={expandedSections.diagnosis}
            onToggle={() =>
              toggleSection("diagnosis")
            }
            action={
              <button
                type="button"
                onClick={addDiagnosis}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"
              >
                <Plus size={13} />
                Add Diagnosis
              </button>
            }
          >
            {form.diagnosis.length ===
            0 ? (
              <EmptyState
                icon={HeartPulse}
                title="No diagnosis added"
                description="Add one or more clinical diagnoses."
              />
            ) : (
              <div className="space-y-3">
                {form.diagnosis.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1fr_180px_1fr_auto]">
                        <Input
                          label="Diagnosis"
                          value={
                            item.condition
                          }
                          onChange={(value) =>
                            updateDiagnosis(
                              index,
                              "condition",
                              value
                            )
                          }
                          placeholder="Enter diagnosis"
                        />

                        <Select
                          label="Eye"
                          value={item.eye}
                          options={[
                            "Right",
                            "Left",
                            "Both",
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
                          label="Clinical note"
                          value={item.notes}
                          onChange={(value) =>
                            updateDiagnosis(
                              index,
                              "notes",
                              value
                            )
                          }
                          placeholder="Optional"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeDiagnosis(
                              index
                            )
                          }
                          className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="mt-5">
              <TextArea
                label="Additional diagnosis notes"
                value={form.diagnosisNotes}
                onChange={(value) =>
                  updateForm(
                    "diagnosisNotes",
                    value
                  )
                }
                placeholder="Additional clinical interpretation..."
                rows={4}
              />
            </div>
          </ClinicalSection>

          {/* ADVICE */}
          <ClinicalSection
            number="10"
            title="Advice"
            subtitle="Patient instructions and clinical advice"
            icon={FileText}
            open={expandedSections.advice}
            onToggle={() =>
              toggleSection("advice")
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {adviceOptions.map(
                ([key, label]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-medium transition ${
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
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />

                    {label}
                  </label>
                )
              )}
            </div>

            <div className="mt-5">
              <TextArea
                label="Additional advice"
                value={form.advice.custom}
                onChange={(value) =>
                  updateNested(
                    "advice",
                    "custom",
                    value
                  )
                }
                placeholder="Enter any additional instructions for the patient..."
                rows={4}
              />
            </div>
          </ClinicalSection>

          {/* PRESCRIPTION */}
          <ClinicalSection
            number="11"
            title="Prescription"
            subtitle="Final prescription and prescription notes"
            icon={Glasses}
            open={expandedSections.prescription}
            onToggle={() =>
              toggleSection("prescription")
            }
          >
            <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
              <Select
                label="Prescription type"
                value={
                  form.prescription.type
                }
                options={[
                  "spectacle",
                  "contact_lens",
                  "none",
                ]}
                onChange={(value) =>
                  updateNested(
                    "prescription",
                    "type",
                    value
                  )
                }
              />

              <TextArea
                label="Prescription note"
                value={
                  form.prescription.note
                }
                onChange={(value) =>
                  updateNested(
                    "prescription",
                    "note",
                    value
                  )
                }
                placeholder="Notes related to the prescription..."
                rows={3}
              />
            </div>

            <div className="mt-5 overflow-x-auto">
              <PrescriptionSummary
                data={form.refraction.final}
              />
            </div>
          </ClinicalSection>

          {/* DISPENSING */}
          <ClinicalSection
            number="12"
            title="Dispensing"
            subtitle="Spectacle and optical dispensing details"
            icon={Glasses}
            open={expandedSections.dispensing}
            onToggle={() =>
              toggleSection("dispensing")
            }
          >
            <div className="mb-5">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    form.dispensing
                      .spectacleRequired
                  }
                  onChange={(event) =>
                    updateNested(
                      "dispensing",
                      "spectacleRequired",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Spectacle required
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    Patient requires spectacle dispensing.
                  </div>
                </div>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Frame"
                value={
                  form.dispensing.frame
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "frame",
                    value
                  )
                }
                placeholder="Frame / SKU"
              />

              <Input
                label="Lens type"
                value={
                  form.dispensing.lensType
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "lensType",
                    value
                  )
                }
                placeholder="Single vision / progressive..."
              />

              <Input
                label="Material"
                value={
                  form.dispensing.material
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "material",
                    value
                  )
                }
              />

              <Input
                label="Coating"
                value={
                  form.dispensing.coating
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "coating",
                    value
                  )
                }
              />

              <Input
                label="PD"
                value={form.dispensing.pd}
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "pd",
                    value
                  )
                }
              />

              <Input
                label="Fitting height"
                value={
                  form.dispensing
                    .fittingHeight
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "fittingHeight",
                    value
                  )
                }
              />

              <Input
                label="Frame size"
                value={
                  form.dispensing.frameSize
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "frameSize",
                    value
                  )
                }
              />
            </div>

            <div className="mt-5">
              <TextArea
                label="Dispensing remarks"
                value={
                  form.dispensing.remarks
                }
                onChange={(value) =>
                  updateNested(
                    "dispensing",
                    "remarks",
                    value
                  )
                }
                rows={3}
              />
            </div>
          </ClinicalSection>

          {/* THERAPEUTICS */}
          <ClinicalSection
            number="13"
            title="Therapeutics"
            subtitle="Treatment and medication instructions"
            icon={HeartPulse}
            open={expandedSections.therapeutics}
            onToggle={() =>
              toggleSection("therapeutics")
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Medication / treatment"
                value={
                  form.therapeutics
                    .medication
                }
                onChange={(value) =>
                  updateNested(
                    "therapeutics",
                    "medication",
                    value
                  )
                }
                placeholder="Medication name"
              />

              <Input
                label="Dosage"
                value={
                  form.therapeutics.dosage
                }
                onChange={(value) =>
                  updateNested(
                    "therapeutics",
                    "dosage",
                    value
                  )
                }
              />

              <Input
                label="Frequency"
                value={
                  form.therapeutics
                    .frequency
                }
                onChange={(value) =>
                  updateNested(
                    "therapeutics",
                    "frequency",
                    value
                  )
                }
              />

              <Input
                label="Duration"
                value={
                  form.therapeutics
                    .duration
                }
                onChange={(value) =>
                  updateNested(
                    "therapeutics",
                    "duration",
                    value
                  )
                }
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              Therapeutic medication entry should be
              restricted to appropriately authorized
              clinical users according to your
              organization workflow.
            </div>

            <div className="mt-5">
              <TextArea
                label="Treatment instructions"
                value={
                  form.therapeutics
                    .instructions
                }
                onChange={(value) =>
                  updateNested(
                    "therapeutics",
                    "instructions",
                    value
                  )
                }
                rows={4}
              />
            </div>
          </ClinicalSection>

          {/* RECALL */}
          <ClinicalSection
            number="14"
            title="Recall"
            subtitle="Follow-up and recall scheduling"
            icon={CalendarDays}
            open={expandedSections.recall}
            onToggle={() =>
              toggleSection("recall")
            }
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={form.recall.enabled}
                onChange={(event) =>
                  updateNested(
                    "recall",
                    "enabled",
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />

              <div>
                <div className="text-xs font-bold text-slate-800">
                  Schedule recall
                </div>

                <div className="mt-0.5 text-[10px] text-slate-500">
                  Create a follow-up date for this patient.
                </div>
              </div>
            </label>

            {form.recall.enabled && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Input
                  label="Recall date"
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
                  label="Recall type"
                  value={form.recall.type}
                  options={[
                    "Routine review",
                    "Prescription review",
                    "Contact lens review",
                    "Clinical follow-up",
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

                <div className="sm:col-span-2">
                  <TextArea
                    label="Recall message"
                    value={
                      form.recall.message
                    }
                    onChange={(value) =>
                      updateNested(
                        "recall",
                        "message",
                        value
                      )
                    }
                    rows={3}
                    placeholder="Message or instruction for the next visit..."
                  />
                </div>
              </div>
            )}
          </ClinicalSection>

          {/* NOTES */}
          <ClinicalSection
            number="15"
            title="Notes"
            subtitle="Final clinical and internal notes"
            icon={FileText}
            open={expandedSections.notes}
            onToggle={() =>
              toggleSection("notes")
            }
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <TextArea
                label="Clinical notes"
                value={form.notes}
                onChange={(value) =>
                  updateForm("notes", value)
                }
                placeholder="Final clinical summary..."
                rows={6}
              />

              <TextArea
                label="Internal notes"
                value={form.internalNotes}
                onChange={(value) =>
                  updateForm(
                    "internalNotes",
                    value
                  )
                }
                placeholder="Internal staff notes..."
                rows={6}
              />
            </div>
          </ClinicalSection>

          {/* =================================================
              SAVE FOOTER
          ================================================= */}

          <div className="sticky bottom-3 z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {selectedType?.label}
                </div>

                <div className="mt-0.5 text-[10px] text-slate-400">
                  {fullName(patient)} ·{" "}
                  {patient.patientNumber ||
                    "No patient number"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/patients/${patientId}`
                    )
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-100 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      Saving consultation...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Consultation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/* =========================================================
   PATIENT HEADER
========================================================= */

function PatientHeader({ patient, age }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-100">
              {patient.firstName?.[0]}
              {patient.lastName?.[0]}
            </div>

            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-violet-600">
                Selected patient
              </div>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {fullName(patient)}
              </h2>

              <div className="mt-1 text-xs text-slate-500">
                {patient.patientNumber ||
                  "No patient number"}
                {" · "}
                {patient.gender || "Gender not recorded"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PatientMini
              label="DOB"
              value={formatDate(
                patient.dateOfBirth
              )}
            />

            <PatientMini
              label="Age"
              value={
                age !== null
                  ? `${age} yrs`
                  : "—"
              }
            />

            <PatientMini
              label="Phone"
              value={patient.phone || "—"}
            />

            <PatientMini
              label="Status"
              value={
                patient.status === "inactive"
                  ? "Inactive"
                  : "Active"
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function PatientMini({ label, value }) {
  return (
    <div className="rounded-xl border border-white bg-white/75 px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-bold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/* =========================================================
   CONSULTATION TYPE SELECTOR
========================================================= */

function ConsultationTypeSelector({
  currentType,
  onSelect,
  onClose,
  canClose,
}) {
  const [selected, setSelected] = useState(currentType || "comprehensive");

  useEffect(() => {
    setSelected(currentType || "comprehensive");
  }, [currentType]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && canClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canClose, onClose]);

  const selectedPrimary = consultationTypes.find(
    (item) => item.value === selected
  );

  const handleContinue = () => {
    onSelect(selected);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-type-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && canClose) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl">
        {/* Modal header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                <Stethoscope size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-600">
                  New clinical encounter
                </div>
                <h2
                  id="consultation-type-title"
                  className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
                >
                  What type of consultation are you starting?
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  Choose the main workflow. You can still record additional
                  examinations and clinical findings during the consultation.
                </p>
              </div>
            </div>

            {canClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close consultation type selector"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Modal body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Primary workflow
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Select one to continue.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              Step 1 of 1
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {consultationTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selected === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelected(type.value)}
                  className={`relative rounded-2xl border p-4 text-left transition-all sm:p-5 ${
                    isSelected
                      ? "border-violet-400 bg-violet-50/80 ring-2 ring-violet-100"
                      : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        isSelected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    {type.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    {type.description}
                  </p>

                  <div
                    className={`mt-4 text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? "text-violet-700" : "text-slate-400"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select workflow"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <ClipboardPlus size={15} className="text-slate-500" />
              <p className="text-xs font-bold text-slate-800">
                Specialized assessments
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              These can be documented within the encounter when clinically
              required.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {specializedTypes.map((item) => (
                <span
                  key={item.value}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {selectedPrimary && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-800">
                  Ready to begin
                </p>
                <p className="truncate text-xs text-emerald-700">
                  {selectedPrimary.label} consultation selected.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-[10px] leading-4 text-slate-400">
            You can change the consultation type later from the workspace header.
          </p>

          <div className="flex w-full gap-2 sm:w-auto">
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:flex-none"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 sm:flex-none"
            >
              Start consultation
              <ArrowLeft size={14} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CLINICAL SECTION
========================================================= */

function ClinicalSection({
  number,
  title,
  subtitle,
  icon: Icon,
  children,
  open,
  onToggle,
  action,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-violet-500">
                {number}
              </span>

              <h2 className="text-sm font-bold text-slate-900">
                {title}
              </h2>
            </div>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
              {subtitle}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {action}

          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {open && (
        <div className="p-5 sm:p-6">
          {children}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   REFRACTION
========================================================= */

function RefractionBlock({
  title,
  data,
  onChange,
}) {
  const fields = [
    ["sphere", "Sphere"],
    ["cylinder", "Cylinder"],
    ["axis", "Axis"],
    ["va", "Distance VA"],
    ["add", "ADD"],
    ["nearVa", "Near VA"],
    ["prism", "Prism"],
    ["base", "Base"],
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-bold text-slate-800">
          {title}
        </div>

        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          OD / OS
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-20 px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Eye
              </th>

              {fields.map(([, label]) => (
                <th
                  key={label}
                  className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[
              ["right", "OD"],
              ["left", "OS"],
            ].map(([eye, label]) => (
              <tr
                key={eye}
                className="border-b border-slate-100 last:border-0"
              >
                <th
                  className={`px-4 py-3 text-left text-xs font-bold ${
                    eye === "right"
                      ? "bg-blue-50 text-blue-800"
                      : "bg-rose-50 text-rose-800"
                  }`}
                >
                  {label}
                </th>

                {fields.map(
                  ([field]) => (
                    <td
                      key={field}
                      className="px-2 py-2"
                    >
                      <input
                        value={
                          data?.[eye]?.[
                            field
                          ] || ""
                        }
                        onChange={(event) =>
                          onChange(
                            eye,
                            field,
                            event.target.value
                          )
                        }
                        className="h-9 w-full min-w-[90px] rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   VISUAL ACUITY TABLE
========================================================= */

function EyeTable({
  columns,
  rows,
  fields,
  onChange,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-20 px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Eye
            </th>

            {columns.map((column) => (
              <th
                key={column}
                className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.eye}
              className="border-b border-slate-100 last:border-0"
            >
              <th
                className={`px-4 py-3 text-left text-xs font-bold ${
                  row.eye === "right"
                    ? "bg-blue-50 text-blue-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {row.label}
              </th>

              {fields.map((field) => (
                <td
                  key={field}
                  className="px-2 py-2"
                >
                  <input
                    value={
                      row.values?.[field] || ""
                    }
                    onChange={(event) =>
                      onChange(
                        row.eye,
                        field,
                        event.target.value
                      )
                    }
                    className="h-9 w-full min-w-[130px] rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
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
   SLIT LAMP
========================================================= */

function SlitLampTable({
  data,
  onChange,
}) {
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-48 px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Examination
            </th>

            <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-blue-600">
              OD
            </th>

            <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-rose-600">
              OS
            </th>
          </tr>
        </thead>

        <tbody>
          {fields.map(([field, label]) => (
            <tr
              key={field}
              className="border-b border-slate-100 last:border-0"
            >
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                {label}
              </th>

              <td className="px-3 py-2">
                <input
                  value={
                    data.right?.[field] || ""
                  }
                  onChange={(event) =>
                    onChange(
                      "right",
                      field,
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-300"
                />
              </td>

              <td className="px-3 py-2">
                <input
                  value={
                    data.left?.[field] || ""
                  }
                  onChange={(event) =>
                    onChange(
                      "left",
                      field,
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-300"
                />
              </td>
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

function FundusTable({
  data,
  onChange,
}) {
  const fields = [
    ["disc", "Disc"],
    ["cdRatio", "C/D Ratio"],
    ["macula", "Macula"],
    ["vessels", "Vessels"],
    ["retina", "Retina"],
    ["other", "Other"],
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-48 px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Examination
            </th>

            <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-blue-600">
              OD
            </th>

            <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-rose-600">
              OS
            </th>
          </tr>
        </thead>

        <tbody>
          {fields.map(([field, label]) => (
            <tr
              key={field}
              className="border-b border-slate-100 last:border-0"
            >
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                {label}
              </th>

              <td className="px-3 py-2">
                <input
                  value={
                    data.right?.[field] || ""
                  }
                  onChange={(event) =>
                    onChange(
                      "right",
                      field,
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-300"
                />
              </td>

              <td className="px-3 py-2">
                <input
                  value={
                    data.left?.[field] || ""
                  }
                  onChange={(event) =>
                    onChange(
                      "left",
                      field,
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-300"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   PRESCRIPTION SUMMARY
========================================================= */

function PrescriptionSummary({ data }) {
  const fields = [
    ["sphere", "Sphere"],
    ["cylinder", "Cylinder"],
    ["axis", "Axis"],
    ["va", "VA"],
    ["add", "ADD"],
    ["nearVa", "Near VA"],
    ["prism", "Prism"],
    ["base", "Base"],
  ];

  return (
    <table className="w-full min-w-[850px]">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Eye
          </th>

          {fields.map(([, label]) => (
            <th
              key={label}
              className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {[
          ["right", "OD"],
          ["left", "OS"],
        ].map(([eye, label]) => (
          <tr
            key={eye}
            className="border-b border-slate-100 last:border-0"
          >
            <th
              className={`px-4 py-3 text-left text-xs font-bold ${
                eye === "right"
                  ? "bg-blue-50 text-blue-800"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              {label}
            </th>

            {fields.map(([field]) => (
              <td
                key={field}
                className="px-2 py-3 text-center font-mono text-xs text-slate-700"
              >
                {data?.[eye]?.[field] ||
                  "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
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
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
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
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <select
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
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

function InfoField({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Icon size={17} />
      </div>

      <div className="mt-3 text-xs font-bold text-slate-600">
        {title}
      </div>

      <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   SERIALIZATION HELPERS
========================================================= */

function formatSlitLamp(slitLamp) {
  if (!slitLamp) return "";

  const sections = [];

  const fields = [
    ["lids", "Lids"],
    ["conjunctiva", "Conjunctiva"],
    ["cornea", "Cornea"],
    ["anteriorChamber", "Anterior Chamber"],
    ["iris", "Iris"],
    ["lens", "Lens"],
    ["other", "Other"],
  ];

  fields.forEach(([field, label]) => {
    const right =
      slitLamp.right?.[field];
    const left =
      slitLamp.left?.[field];

    if (right || left) {
      sections.push(
        `${label}: OD ${right || "—"} | OS ${
          left || "—"
        }`
      );
    }
  });

  return sections.join("\n");
}

function formatFundus(fundus) {
  if (!fundus) return "";

  const sections = [];

  const fields = [
    ["disc", "Disc"],
    ["cdRatio", "C/D Ratio"],
    ["macula", "Macula"],
    ["vessels", "Vessels"],
    ["retina", "Retina"],
    ["other", "Other"],
  ];

  fields.forEach(([field, label]) => {
    const right =
      fundus.right?.[field];
    const left =
      fundus.left?.[field];

    if (right || left) {
      sections.push(
        `${label}: OD ${right || "—"} | OS ${
          left || "—"
        }`
      );
    }
  });

  return sections.join("\n");
}