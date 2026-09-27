
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
);

// --------------------------------------------------
// BINOCULAR VISION
// --------------------------------------------------

const binocularSensorySchema = new mongoose.Schema(
  {
    stereopsisNear: {
      type: String,
      trim: true,
      default: "",
    },

    wfdtDistance: {
      type: String,
      trim: true,
      default: "",
    },

    wfdtIntermediate: {
      type: String,
      trim: true,
      default: "",
    },

    wfdtNear: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const binocularMotorSchema = new mongoose.Schema(
  {
    eomOD: {
      type: String,
      trim: true,
      default: "",
    },

    eomOS: {
      type: String,
      trim: true,
      default: "",
    },

    saccades: {
      type: String,
      trim: true,
      default: "",
    },

    pursuits: {
      type: String,
      trim: true,
      default: "",
    },

    coverTestMethod: {
      type: String,
      trim: true,
      default: "",
    },

    coverDistance: {
      type: String,
      trim: true,
      default: "",
    },

    coverNear: {
      type: String,
      trim: true,
      default: "",
    },

    phoriaHorizontalDistance: {
      type: String,
      trim: true,
      default: "",
    },

    phoriaHorizontalNear: {
      type: String,
      trim: true,
      default: "",
    },

    phoriaVerticalDistance: {
      type: String,
      trim: true,
      default: "",
    },

    phoriaVerticalNear: {
      type: String,
      trim: true,
      default: "",
    },

    gradientACA: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const accommodationSchema = new mongoose.Schema(
  {
    npcAccommodativeSubjective: {
      type: String,
      trim: true,
      default: "",
    },

    npcAccommodativeObjective: {
      type: String,
      trim: true,
      default: "",
    },

    npcAccommodativeBreak: {
      type: String,
      trim: true,
      default: "",
    },

    npcAccommodativeRecovery: {
      type: String,
      trim: true,
      default: "",
    },

    npcRGSubjective: {
      type: String,
      trim: true,
      default: "",
    },

    npcRGObjective: {
      type: String,
      trim: true,
      default: "",
    },

    npcRGBreak: {
      type: String,
      trim: true,
      default: "",
    },

    npcRGRecovery: {
      type: String,
      trim: true,
      default: "",
    },

    npaOD: {
      type: String,
      trim: true,
      default: "",
    },

    npaOS: {
      type: String,
      trim: true,
      default: "",
    },

    npaOU: {
      type: String,
      trim: true,
      default: "",
    },

    aaOD: {
      type: String,
      trim: true,
      default: "",
    },

    aaOS: {
      type: String,
      trim: true,
      default: "",
    },

    aaOU: {
      type: String,
      trim: true,
      default: "",
    },

    hofstetterMinimumAA: {
      type: String,
      trim: true,
      default: "",
    },

    memOD: {
      type: String,
      trim: true,
      default: "",
    },

    memOS: {
      type: String,
      trim: true,
      default: "",
    },

    nra: {
      type: String,
      trim: true,
      default: "",
    },

    pra: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const fusionalVergenceSchema = new mongoose.Schema(
  {
    biDistance: {
      type: String,
      trim: true,
      default: "",
    },

    biNear: {
      type: String,
      trim: true,
      default: "",
    },

    boDistance: {
      type: String,
      trim: true,
      default: "",
    },

    boNear: {
      type: String,
      trim: true,
      default: "",
    },

    vertical: {
      type: String,
      trim: true,
      default: "",
    },

    recovery: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const vergenceFacilitySchema = new mongoose.Schema(
  {
    prism: {
      type: String,
      trim: true,
      default: "",
    },

    testDistance: {
      type: String,
      trim: true,
      default: "",
    },

    od: {
      type: String,
      trim: true,
      default: "",
    },

    os: {
      type: String,
      trim: true,
      default: "",
    },

    ou: {
      type: String,
      trim: true,
      default: "",
    },

    cpm: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const accommodativeFacilitySchema = new mongoose.Schema(
  {
    lensPower: {
      type: String,
      trim: true,
      default: "",
    },

    testDistance: {
      type: String,
      trim: true,
      default: "",
    },

    amplitude: {
      type: String,
      trim: true,
      default: "",
    },

    scaledFacility: {
      type: String,
      trim: true,
      default: "",
    },

    odCPM: {
      type: String,
      trim: true,
      default: "",
    },

    osCPM: {
      type: String,
      trim: true,
      default: "",
    },

    ouCPM: {
      type: String,
      trim: true,
      default: "",
    },

    comments: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    interpretation: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  { _id: false },
);

const finalGlassRxEyeSchema = new mongoose.Schema(
  {
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

    add: {
      type: String,
      trim: true,
      default: "",
    },

    va: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const finalGlassRxSchema = new mongoose.Schema(
  {
    od: {
      type: finalGlassRxEyeSchema,
      default: () => ({}),
    },

    os: {
      type: finalGlassRxEyeSchema,
      default: () => ({}),
    },

    addOD: {
      type: String,
      trim: true,
      default: "",
    },

    addOS: {
      type: String,
      trim: true,
      default: "",
    },

    prismOD: {
      type: String,
      trim: true,
      default: "",
    },

    prismOS: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);
const binocularVisionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      trim: true,
      default: "",
    },

    time: {
      type: String,
      trim: true,
      default: "",
    },

    workUpBy: {
      type: String,
      trim: true,
      default: "",
    },

    occupation: {
      type: String,
      trim: true,
      default: "",
    },

    regNo: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      default: "",
    },

    place: {
      type: String,
      trim: true,
      default: "",
    },

    chiefComplaints: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    refractionNote: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    // -----------------------------
    // SENSORY
    // -----------------------------
    sensory: {
      type: new mongoose.Schema(
        {
          stereopsisNear: {
            type: String,
            default: "",
          },

          wfdtDistance: {
            type: String,
            default: "",
          },

          wfdtIntermediate: {
            type: String,
            default: "",
          },

          wfdtNear: {
            type: String,
            default: "",
          },
        },
        { _id: false },
      ),

      default: () => ({}),
    },

    // -----------------------------
    // MOTOR
    // -----------------------------
    motor: {
      type: new mongoose.Schema(
        {
          eomOD: {
            type: String,
            default: "",
          },

          eomOS: {
            type: String,
            default: "",
          },

          saccades: {
            type: String,
            default: "",
          },

          pursuits: {
            type: String,
            default: "",
          },

          coverTestMethod: {
            type: String,
            default: "",
          },

          coverDistance: {
            type: String,
            default: "",
          },

          coverNear: {
            type: String,
            default: "",
          },

          phoriaHorizontalDistance: {
            type: String,
            default: "",
          },

          phoriaHorizontalNear: {
            type: String,
            default: "",
          },

          phoriaVerticalDistance: {
            type: String,
            default: "",
          },

          phoriaVerticalNear: {
            type: String,
            default: "",
          },

          gradientACA: {
            type: String,
            default: "",
          },
        },
        { _id: false },
      ),

      default: () => ({}),
    },

    // ==================================================
    // ACCOMMODATION
    // ==================================================
    accommodation: {
      type: new mongoose.Schema(
        {
          npcAccommodativeSubjective: {
            type: String,
            trim: true,
            default: "",
          },

          npcAccommodativeObjective: {
            type: String,
            trim: true,
            default: "",
          },

          npcAccommodativeBreak: {
            type: String,
            trim: true,
            default: "",
          },

          npcAccommodativeRecovery: {
            type: String,
            trim: true,
            default: "",
          },

          npcRGSubjective: {
            type: String,
            trim: true,
            default: "",
          },

          npcRGObjective: {
            type: String,
            trim: true,
            default: "",
          },

          npcRGBreak: {
            type: String,
            trim: true,
            default: "",
          },

          npcRGRecovery: {
            type: String,
            trim: true,
            default: "",
          },

          npaOD: {
            type: String,
            trim: true,
            default: "",
          },

          npaOS: {
            type: String,
            trim: true,
            default: "",
          },

          npaOU: {
            type: String,
            trim: true,
            default: "",
          },

          aaOD: {
            type: String,
            trim: true,
            default: "",
          },

          aaOS: {
            type: String,
            trim: true,
            default: "",
          },

          aaOU: {
            type: String,
            trim: true,
            default: "",
          },

          hofstetterMinimumAA: {
            type: String,
            trim: true,
            default: "",
          },

          memOD: {
            type: String,
            trim: true,
            default: "",
          },

          memOS: {
            type: String,
            trim: true,
            default: "",
          },

          nra: {
            type: String,
            trim: true,
            default: "",
          },

          pra: {
            type: String,
            trim: true,
            default: "",
          },
        },
        {
          _id: false,
        },
      ),

      default: () => ({}),
    },

    // -----------------------------
    // FUSIONAL VERGENCE
    // -----------------------------
    fusionalVergence: {
      type: new mongoose.Schema(
        {
          biDistance: {
            type: String,
            default: "",
          },

          biNear: {
            type: String,
            default: "",
          },

          boDistance: {
            type: String,
            default: "",
          },

          boNear: {
            type: String,
            default: "",
          },

          vertical: {
            type: String,
            default: "",
          },

          recovery: {
            type: String,
            default: "",
          },

          nfvDistanceBlur: {
            type: String,
            default: "",
          },

          nfvDistanceBreak: {
            type: String,
            default: "",
          },

          nfvDistanceRecovery: {
            type: String,
            default: "",
          },

          nfvNearBlur: {
            type: String,
            default: "",
          },

          nfvNearBreak: {
            type: String,
            default: "",
          },

          nfvNearRecovery: {
            type: String,
            default: "",
          },

          pfvDistanceBlur: {
            type: String,
            default: "",
          },

          pfvDistanceBreak: {
            type: String,
            default: "",
          },

          pfvDistanceRecovery: {
            type: String,
            default: "",
          },

          pfvNearBlur: {
            type: String,
            default: "",
          },

          pfvNearBreak: {
            type: String,
            default: "",
          },

          pfvNearRecovery: {
            type: String,
            default: "",
          },

          comments: {
            type: String,
            default: "",
          },

          interpretation: {
            type: String,
            default: "",
          },
        },
        { _id: false },
      ),

      default: () => ({}),
    },

    // -----------------------------
    // VERGENCE FACILITY
    // -----------------------------
    vergenceFacility: {
      type: new mongoose.Schema(
        {
          prism: {
            type: String,
            default: "",
          },

          testDistance: {
            type: String,
            default: "",
          },

          od: {
            type: String,
            default: "",
          },

          os: {
            type: String,
            default: "",
          },

          ou: {
            type: String,
            default: "",
          },

          cpm: {
            type: String,
            default: "",
          },

          comments: {
            type: String,
            default: "",
          },

          interpretation: {
            type: String,
            default: "",
          },
        },
        { _id: false },
      ),

      default: () => ({}),
    },

    // -----------------------------
    // ACCOMMODATIVE FACILITY
    // -----------------------------
    accommodativeFacility: {
      type: new mongoose.Schema(
        {
          lensPower: {
            type: String,
            default: "",
          },

          testDistance: {
            type: String,
            default: "",
          },

          amplitude: {
            type: String,
            default: "",
          },

          scaledFacility: {
            type: String,
            default: "",
          },

          odCPM: {
            type: String,
            default: "",
          },

          osCPM: {
            type: String,
            default: "",
          },

          ouCPM: {
            type: String,
            default: "",
          },

          cpm: {
            type: String,
            default: "",
          },

          comments: {
            type: String,
            default: "",
          },

          interpretation: {
            type: String,
            default: "",
          },
        },
        { _id: false },
      ),

      default: () => ({}),
    },

    // -----------------------------
    // OTHER BINOCULAR TESTS
    // -----------------------------
    cissScore: {
      type: String,
      trim: true,
      default: "",
    },

    fixationDisparity: {
      type: String,
      trim: true,
      default: "",
    },

    otherTests: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    // -----------------------------
    // FINAL GLASS RX
    // -----------------------------
    finalGlassRx: {
      type: new mongoose.Schema(
        {
          od: {
            type: new mongoose.Schema(
              {
                sphere: {
                  type: String,
                  default: "",
                },

                cylinder: {
                  type: String,
                  default: "",
                },

                axis: {
                  type: String,
                  default: "",
                },

                add: {
                  type: String,
                  default: "",
                },

                va: {
                  type: String,
                  default: "",
                },
              },
              { _id: false },
            ),

            default: () => ({}),
          },

          os: {
            type: new mongoose.Schema(
              {
                sphere: {
                  type: String,
                  default: "",
                },

                cylinder: {
                  type: String,
                  default: "",
                },

                axis: {
                  type: String,
                  default: "",
                },

                add: {
                  type: String,
                  default: "",
                },

                va: {
                  type: String,
                  default: "",
                },
              },
              { _id: false },
            ),

            default: () => ({}),
          },

          addOD: {
            type: String,
            default: "",
          },

          addOS: {
            type: String,
            default: "",
          },

          prismOD: {
            type: String,
            default: "",
          },

          prismOS: {
            type: String,
            default: "",
          },
        },
        { _id: false },
      ),

      default: () => ({}),
    },

    // -----------------------------
    // DIAGNOSIS / ADVICE
    // -----------------------------
    diagnosis: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    advice: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    followUp: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    // -----------------------------
    // LEGACY FIELDS
    // -----------------------------
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

    findings: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
  },
  {
    _id: false,
  },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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

    contrast: {
      type: String,
      trim: true,
      default: "",
    },

    // Backward-compatible legacy field.
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
  { _id: false },
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
    // CONSULTATION TYPE
    // --------------------------------------------------
    consultationType: {
      type: String,
      enum: [
        "comprehensive",
        "short_consult",
        "binocular_vision",
        "contact_lenses",
        "low_vision",
      ],
      default: "comprehensive",
      index: true,
    },

    status: {
      type: String,
      enum: ["completed"],
      default: "completed",
      index: true,
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
  type: mongoose.Schema.Types.Mixed,
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

    // Current frontend field.
    contactLenses: {
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
  },
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


console.log(
  "🔥🔥🔥 CONSULTATION MODEL FILE LOADED 🔥🔥🔥"
);

console.log(
  "🔥 binocularVision:",
  consultationSchema.path("binocularVision")?.instance
);

console.log(
  "🔥 accommodation:",
  consultationSchema.path(
    "binocularVision.accommodation"
  )?.instance
);
export default mongoose.model("Consultation", consultationSchema);
