import mongoose from "mongoose";

// --------------------------------------------------
// EYE PRESCRIPTION
// --------------------------------------------------
const eyePrescriptionSchema = new mongoose.Schema(
  {
    sphere: { type: String, trim: true, default: "" },
    cylinder: { type: String, trim: true, default: "" },
    axis: { type: String, trim: true, default: "" },

    // Visual acuity
    va: { type: String, trim: true, default: "" },
    nearVa: { type: String, trim: true, default: "" },

    // Near addition
    add: { type: String, trim: true, default: "" },

    // Intermediate
    inter: { type: String, trim: true, default: "" },

    // Prism
    prism: { type: String, trim: true, default: "" },
    base: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// --------------------------------------------------
// PRESCRIPTION
// --------------------------------------------------
const prescriptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["previous", "objective", "subjective", "final", "given"],
      required: true,
    },

    right: {
      type: eyePrescriptionSchema,
      default: () => ({}),
    },

    left: {
      type: eyePrescriptionSchema,
      default: () => ({}),
    },

    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// VISUAL ACUITY
// --------------------------------------------------
const visualAcuityEyeSchema = new mongoose.Schema(
  {
    distance: {
      type: String,
      trim: true,
      default: "",
    },

    near: {
      type: String,
      trim: true,
      default: "",
    },

    unaided: {
      type: String,
      trim: true,
      default: "",
    },

    aided: {
      type: String,
      trim: true,
      default: "",
    },

    pinhole: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const visualAcuitySchema = new mongoose.Schema(
  {
    right: {
      type: visualAcuityEyeSchema,
      default: () => ({}),
    },

    left: {
      type: visualAcuityEyeSchema,
      default: () => ({}),
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// PD
// --------------------------------------------------
const pdSchema = new mongoose.Schema(
  {
    right: {
      type: String,
      trim: true,
      default: "",
    },

    left: {
      type: String,
      trim: true,
      default: "",
    },

    total: {
      type: String,
      trim: true,
      default: "",
    },

    near: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// BINOCULAR VISION
// --------------------------------------------------
const binocularVisionSchema = new mongoose.Schema(
  {
    coverTestDistance: {
      type: String,
      trim: true,
      default: "",
    },

    coverTestNear: {
      type: String,
      trim: true,
      default: "",
    },

    npc: {
      type: String,
      trim: true,
      default: "",
    },

    worthFourDot: {
      type: String,
      trim: true,
      default: "",
    },

    stereopsis: {
      type: String,
      trim: true,
      default: "",
    },

    vergenceBI: {
      type: String,
      trim: true,
      default: "",
    },

    vergenceBO: {
      type: String,
      trim: true,
      default: "",
    },

    accommodation: {
      type: String,
      trim: true,
      default: "",
    },

    findings: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// SLIT LAMP
// --------------------------------------------------
const slitLampEyeSchema = new mongoose.Schema(
  {
    lids: {
      type: String,
      trim: true,
      default: "",
    },

    conjunctiva: {
      type: String,
      trim: true,
      default: "",
    },

    cornea: {
      type: String,
      trim: true,
      default: "",
    },

    anteriorChamber: {
      type: String,
      trim: true,
      default: "",
    },

    iris: {
      type: String,
      trim: true,
      default: "",
    },

    lens: {
      type: String,
      trim: true,
      default: "",
    },

    other: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const slitLampSchema = new mongoose.Schema(
  {
    right: {
      type: slitLampEyeSchema,
      default: () => ({}),
    },

    left: {
      type: slitLampEyeSchema,
      default: () => ({}),
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// FUNDUS
// --------------------------------------------------
const fundusEyeSchema = new mongoose.Schema(
  {
    disc: {
      type: String,
      trim: true,
      default: "",
    },

    cdRatio: {
      type: String,
      trim: true,
      default: "",
    },

    macula: {
      type: String,
      trim: true,
      default: "",
    },

    vessels: {
      type: String,
      trim: true,
      default: "",
    },

    retina: {
      type: String,
      trim: true,
      default: "",
    },

    other: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const fundusSchema = new mongoose.Schema(
  {
    right: {
      type: fundusEyeSchema,
      default: () => ({}),
    },

    left: {
      type: fundusEyeSchema,
      default: () => ({}),
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// ADDITIONAL TEST
// --------------------------------------------------
const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    result: {
      type: String,
      trim: true,
      maxlength: 4000,
    },
  },
  { _id: false }
);

// --------------------------------------------------
// DIAGNOSIS
// --------------------------------------------------
const diagnosisSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    code: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// ADVICE
// --------------------------------------------------
const adviceSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// LOW VISION
// --------------------------------------------------
const lowVisionSchema = new mongoose.Schema(
  {
    distanceVA: {
      type: String,
      trim: true,
      default: "",
    },

    nearVA: {
      type: String,
      trim: true,
      default: "",
    },

    contrastSensitivity: {
      type: String,
      trim: true,
      default: "",
    },

    visualField: {
      type: String,
      trim: true,
      default: "",
    },

    magnification: {
      type: String,
      trim: true,
      default: "",
    },

    assistiveDevice: {
      type: String,
      trim: true,
      default: "",
    },

    advice: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// CONTACT LENS
// --------------------------------------------------
const contactLensEyeSchema = new mongoose.Schema(
  {
    power: {
      type: String,
      trim: true,
      default: "",
    },

    sphere: {
      type: String,
      trim: true,
      default: "",
    },

    cylinder: {
      type: String,
      trim: true,
      default: "",
    },

    axis: {
      type: String,
      trim: true,
      default: "",
    },

    baseCurve: {
      type: String,
      trim: true,
      default: "",
    },

    diameter: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const contactLensSchema = new mongoose.Schema(
  {
    lensType: {
      type: String,
      trim: true,
      default: "",
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    right: {
      type: contactLensEyeSchema,
      default: () => ({}),
    },

    left: {
      type: contactLensEyeSchema,
      default: () => ({}),
    },

    replacementSchedule: {
      type: String,
      trim: true,
      default: "",
    },

    wearSchedule: {
      type: String,
      trim: true,
      default: "",
    },

    solution: {
      type: String,
      trim: true,
      default: "",
    },

    advice: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// DISPENSING
// --------------------------------------------------
const dispensingSchema = new mongoose.Schema(
  {
    spectacleRequired: {
      type: Boolean,
      default: false,
    },

    frame: {
      type: String,
      trim: true,
      default: "",
    },

    lensType: {
      type: String,
      trim: true,
      default: "",
    },

    lensMaterial: {
      type: String,
      trim: true,
      default: "",
    },

    coating: {
      type: String,
      trim: true,
      default: "",
    },

    pd: {
      type: String,
      trim: true,
      default: "",
    },

    fittingHeight: {
      type: String,
      trim: true,
      default: "",
    },

    frameA: {
      type: String,
      trim: true,
      default: "",
    },

    frameB: {
      type: String,
      trim: true,
      default: "",
    },

    frameDBL: {
      type: String,
      trim: true,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// THERAPEUTICS
// --------------------------------------------------
const therapeuticItemSchema = new mongoose.Schema(
  {
    medication: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    dosage: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    frequency: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    duration: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    instructions: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: false }
);

// --------------------------------------------------
// RECALL
// --------------------------------------------------
const recallSchema = new mongoose.Schema(
  {
    due: {
      type: Date,
      default: null,
    },

    type: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    sendReminder: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// --------------------------------------------------
// CONSULTATION
// --------------------------------------------------
const consultationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    optometristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    consultationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // --------------------------------------------------
    // NEW CONSULTATION TYPE
    // --------------------------------------------------
    consultationType: {
      type: String,
      enum: ["comprehensive", "short_consult"],
      default: "comprehensive",
      index: true,
    },

    // Optional specialist workflows
    consultationOptions: {
      type: [
        {
          type: String,
          enum: [
            "binocular_vision",
            "low_vision",
            "contact_lenses",
          ],
        },
      ],
      default: [],
    },

    // --------------------------------------------------
    // BASIC CLINICAL INFORMATION
    // --------------------------------------------------
    reasonForVisit: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    symptoms: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    medicalHistory: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    ocularHistory: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    familyHistory: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    medication: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    allergy: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    pupils: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    // --------------------------------------------------
    // VISUAL ACUITY
    // --------------------------------------------------
    visualAcuity: {
      type: visualAcuitySchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // REFRACTION
    // --------------------------------------------------
    previousRx: {
      type: prescriptionSchema,
      default: null,
    },

    objectiveRx: {
      type: prescriptionSchema,
      default: null,
    },

    subjectiveRx: {
      type: prescriptionSchema,
      default: null,
    },

    finalRx: {
      type: prescriptionSchema,
      default: null,
    },

    givenRx: {
      type: prescriptionSchema,
      default: null,
    },

    refractionNotes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    pd: {
      type: pdSchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // BINOCULAR VISION
    // --------------------------------------------------
    binocularVision: {
      type: binocularVisionSchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // SLIT LAMP
    // --------------------------------------------------
    slitLamp: {
      type: slitLampSchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // FUNDUS
    // --------------------------------------------------
    fundus: {
      type: fundusSchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // ADDITIONAL TESTS
    // --------------------------------------------------
    otherTests: {
      type: [testSchema],
      default: [],
    },

    // --------------------------------------------------
    // DIAGNOSIS
    // --------------------------------------------------
    diagnosis: {
      type: [diagnosisSchema],
      default: [],
    },

    // --------------------------------------------------
    // ADVICE
    // --------------------------------------------------
    advice: {
      type: [adviceSchema],
      default: [],
    },

    // --------------------------------------------------
    // SPECIALIZED MODULES
    // --------------------------------------------------
    lowVision: {
      type: lowVisionSchema,
      default: () => ({}),
    },

    contactLens: {
      type: contactLensSchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // DISPENSING
    // --------------------------------------------------
    dispensing: {
      type: dispensingSchema,
      default: () => ({}),
    },

    // --------------------------------------------------
    // THERAPEUTICS
    // --------------------------------------------------
    therapeutics: {
      type: [therapeuticItemSchema],
      default: [],
    },

    // --------------------------------------------------
    // LEGACY CLINICAL FIELDS
    // Keep these so old records continue to work.
    // --------------------------------------------------
    ophthalmoscopy: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    biomicroscopy: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    visualField: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    colourVision: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },

    // --------------------------------------------------
    // RECALL
    // --------------------------------------------------
    recall: {
      type: recallSchema,
      default: () => ({}),
    },

    // Legacy recall fields
    recallDue: {
      type: Date,
      default: null,
    },

    recallLetter: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // --------------------------------------------------
    // NOTES
    // --------------------------------------------------
    clinicalNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    patientInstructions: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    internalNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    // --------------------------------------------------
    // AUDIT
    // --------------------------------------------------
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------------------------
// INDEXES
// --------------------------------------------------
consultationSchema.index({
  patientId: 1,
  consultationDate: -1,
});

consultationSchema.index({
  organizationId: 1,
  branchId: 1,
  consultationDate: -1,
});

consultationSchema.index({
  organizationId: 1,
  consultationType: 1,
  consultationDate: -1,
});

export default mongoose.model("Consultation", consultationSchema);