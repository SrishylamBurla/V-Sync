import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Consultation from "../models/Consultation.js";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

// --------------------------------------------------
// BRANCH ACCESS
// --------------------------------------------------
const validateBranchAccess = async (user, branchId) => {
  if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
    return null;
  }

  const branch = await Branch.findOne({
    _id: branchId,
    organizationId: user.organizationId,
    status: "active",
  });

  if (!branch) {
    return null;
  }

  // Organization-level admins can access all branches.
  if (
    user.role === "super_admin" ||
    user.role === "organization_admin"
  ) {
    return branch;
  }

  // Other users must be assigned to the branch.
  const hasAccess =
    Array.isArray(user.branchIds) &&
    user.branchIds.some(
      (id) => id.toString() === branchId.toString()
    );

  return hasAccess ? branch : null;
};

// --------------------------------------------------
// PATIENT ACCESS
// --------------------------------------------------
const getPatientForUser = async (user, patientId) => {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return null;
  }

  const patient = await Patient.findOne({
    _id: patientId,
    organizationId: user.organizationId,
  });

  if (!patient) {
    return null;
  }

  const branch = await validateBranchAccess(
    user,
    patient.registeredBranchId
  );

  if (!branch) {
    return null;
  }

  return patient;
};

// --------------------------------------------------
// CLINICIAN VALIDATION
// --------------------------------------------------
const validateOptometrist = async (
  user,
  optometristId
) => {
  const id = optometristId || user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return User.findOne({
    _id: id,
    organizationId: user.organizationId,
    status: "active",
    role: {
      $in: ["optometrist", "doctor"],
    },
  });
};

// --------------------------------------------------
// PRESCRIPTION SANITIZER
// --------------------------------------------------
const sanitizePrescription = (rx, type) => {
  if (!rx || typeof rx !== "object") {
    return null;
  }

  return {
    type,

    right: {
      sphere: rx.right?.sphere || "",
      cylinder: rx.right?.cylinder || "",
      axis: rx.right?.axis || "",
      va: rx.right?.va || "",
      nearVa: rx.right?.nearVa || "",
      add: rx.right?.add || "",
      inter: rx.right?.inter || "",
      prism: rx.right?.prism || "",
      base: rx.right?.base || "",
      hPrism: rx.right?.hPrism || "",
      vPrism: rx.right?.vPrism || "",
    },

    left: {
      sphere: rx.left?.sphere || "",
      cylinder: rx.left?.cylinder || "",
      axis: rx.left?.axis || "",
      va: rx.left?.va || "",
      nearVa: rx.left?.nearVa || "",
      add: rx.left?.add || "",
      inter: rx.left?.inter || "",
      prism: rx.left?.prism || "",
      base: rx.left?.base || "",
      hPrism: rx.left?.hPrism || "",
      vPrism: rx.left?.vPrism || "",
    },

    note: rx.note || "",
  };
};

// --------------------------------------------------
// DATE VALIDATION
// --------------------------------------------------
const getConsultationDate = (value) => {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

// --------------------------------------------------
// CONSULTATION STATUS WORKFLOW
// --------------------------------------------------
const CONSULTATION_STATUSES = [
  "draft",
  "in_progress",
  "completed",
  "cancelled",
];

const CONSULTATION_STATUS_TRANSITIONS = {
  draft: ["in_progress", "completed", "cancelled"],
  in_progress: ["draft", "completed", "cancelled"],
  completed: ["draft", "in_progress", "cancelled"],
  cancelled: ["draft", "in_progress", "completed"],
};

const validateConsultationStatusTransition = (
  currentStatus,
  nextStatus,
) => {
  if (!CONSULTATION_STATUSES.includes(nextStatus)) {
    const error = new Error("Invalid consultation status.");
    error.statusCode = 400;
    throw error;
  }

  if (currentStatus === nextStatus) {
    return;
  }

  const allowed =
    CONSULTATION_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    const error = new Error(
      `Invalid consultation status transition: ${currentStatus} → ${nextStatus}.`,
    );
    error.statusCode = 400;
    throw error;
  }
};

export const getConsultations = asyncHandler(
  async (req, res) => {
    const organizationId = req.user.organizationId;

    const page = Math.max(
      1,
      Number(req.query.page || 1),
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.query.limit || 25),
      ),
    );

    const skip = (page - 1) * limit;

    const filter = {
      organizationId,
    };

    // Restrict practice users to their assigned branches. Organization
    // administrators and super admins can view all branches in the org.
    if (!["super_admin", "organization_admin"].includes(req.user.role)) {
      const branchIds = Array.isArray(req.user.branchIds)
        ? req.user.branchIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
        : [];

      filter.branchId = { $in: branchIds };

      if (!branchIds.length) {
        return res.json({
          success: true,
          data: {
            consultations: [],
            pagination: { page, limit, total: 0, totalPages: 1 },
          },
        });
      }
    }

    if (req.query.patientId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.query.patientId,
        )
      ) {
        res.status(400);
        throw new Error("Invalid patient ID");
      }

      filter.patientId = req.query.patientId;
    }

    if (req.query.consultationType) {
      filter.consultationType =
        req.query.consultationType;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const search = String(
      req.query.search || "",
    ).trim();

    if (search) {
      const patients = await Patient.find({
        organizationId,
        $or: [
          {
            firstName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            middleName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            lastName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            patientNumber: {
              $regex: search,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      })
        .select("_id")
        .lean();

      filter.patientId = {
        $in: patients.map(
          (patient) => patient._id,
        ),
      };
    }

    const [rows, total] =
      await Promise.all([
        Consultation.find(filter)
          .populate(
            "patientId",
            "patientNumber firstName middleName lastName phone",
          )
          .populate(
            "optometristId",
            "firstName lastName role",
          )
          .sort({
            consultationDate: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Consultation.countDocuments(filter),
      ]);

    res.json({
      success: true,
      data: {
        consultations: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.ceil(total / limit) || 1,
        },
      },
    });
  },
);
// --------------------------------------------------
// CONSULTATION TYPE
// --------------------------------------------------
const normalizeConsultationType = (type) => {
  const allowed = [
    "comprehensive",
    "short_consult",
    "binocular_vision",
    "contact_lenses",
    "low_vision",
  ];

  /*
   * Backward compatibility:
   * Older frontend versions sent:
   *
   * consultationType: "specialized"
   * specializedType: "binocular_vision"
   *
   * We no longer use that internally, but the request can
   * still be converted safely.
   */
  if (type === "specialized") {
    return "specialized";
  }

  return allowed.includes(type)
    ? type
    : "comprehensive";
};

// --------------------------------------------------
// LEGACY SPECIALIZED TYPE
// --------------------------------------------------
const normalizeSpecializedType = (type) => {
  const allowed = [
    "contact_lenses",
    "binocular_vision",
    "low_vision",
  ];

  return allowed.includes(type)
    ? type
    : "";
};

// --------------------------------------------------
// CONSULTATION OPTIONS
// --------------------------------------------------
const normalizeConsultationOptions = (options) => {
  if (!Array.isArray(options)) {
    return [];
  }

  const allowed = [
    "binocular_vision",
    "low_vision",
    "contact_lenses",
  ];

  return [
    ...new Set(
      options.filter((option) =>
        allowed.includes(option)
      )
    ),
  ];
};

// --------------------------------------------------
// EMPTY ACCOMMODATION OBJECT
// --------------------------------------------------
const createEmptyAccommodation = () => ({
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
});

// --------------------------------------------------
// NORMALIZE ACCOMMODATION
// --------------------------------------------------
const normalizeAccommodation = (value) => {
  const empty = createEmptyAccommodation();

  /*
   * IMPORTANT:
   *
   * accommodation MUST remain an object.
   *
   * Never do:
   *
   * accommodation: value || ""
   *
   * because that can result in a String being passed
   * into the Mongoose nested schema.
   */

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return empty;
  }

  return {
    npcAccommodativeSubjective:
      value.npcAccommodativeSubjective ?? "",

    npcAccommodativeObjective:
      value.npcAccommodativeObjective ?? "",

    npcAccommodativeBreak:
      value.npcAccommodativeBreak ?? "",

    npcAccommodativeRecovery:
      value.npcAccommodativeRecovery ?? "",

    npcRGSubjective:
      value.npcRGSubjective ?? "",

    npcRGObjective:
      value.npcRGObjective ?? "",

    npcRGBreak:
      value.npcRGBreak ?? "",

    npcRGRecovery:
      value.npcRGRecovery ?? "",

    npaOD:
      value.npaOD ?? "",

    npaOS:
      value.npaOS ?? "",

    npaOU:
      value.npaOU ?? "",

    aaOD:
      value.aaOD ?? "",

    aaOS:
      value.aaOS ?? "",

    aaOU:
      value.aaOU ?? "",

    hofstetterMinimumAA:
      value.hofstetterMinimumAA ?? "",

    memOD:
      value.memOD ?? "",

    memOS:
      value.memOS ?? "",

    nra:
      value.nra ?? "",

    pra:
      value.pra ?? "",
  };
};

// --------------------------------------------------
// NORMALIZE BINOCULAR VISION
// --------------------------------------------------
const normalizeBinocularVision = (value) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return {
    ...value,

    // Current form uses `fusional`; the database schema stores
    // `fusionalVergence`. Normalize both names to the canonical field.
    fusionalVergence: normalizeObject(
      value.fusionalVergence || value.fusional
    ),

    // CRITICAL: keep accommodation as an object, never a string.
    accommodation: normalizeAccommodation(value.accommodation),
  };
};

// --------------------------------------------------
// NORMALIZE SPECIALIZED OBJECTS
// --------------------------------------------------
const normalizeObject = (value) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value;
};

// Convert the current form's key/value advice object into the persisted
// advice array while remaining compatible with older clients that send arrays.
const normalizeAdvice = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        text: String(item.text ?? "").trim(),
        category: String(item.category ?? "").trim(),
      }))
      .filter((item) => item.text);
  }

  if (!value || typeof value !== "object") return [];

  const rows = Object.entries(value)
    .filter(([key, enabled]) => key !== "custom" && enabled === true)
    .map(([key]) => ({
      category: key,
      text: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
    }));

  const custom = String(value.custom ?? "").trim();
  if (custom) rows.push({ category: "custom", text: custom });
  return rows;
};

// Accept both current UI diagnosis objects ({ condition, eye, notes }) and
// the older API representation ({ name, code, notes }).
const normalizeDiagnosis = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      name: String(item.name ?? item.condition ?? "").trim(),
      condition: String(item.condition ?? item.name ?? "").trim(),
      code: String(item.code ?? "").trim(),
      eye: String(item.eye ?? "OU").trim(),
      notes: String(item.notes ?? "").trim(),
    }))
    .filter((item) => item.name || item.condition || item.code || item.notes);
};

// --------------------------------------------------
// MODEL VALIDATION
// --------------------------------------------------
const validateLoadedConsultationSchema = () => {
  const binocularVisionPath =
    Consultation.schema.path(
      "binocularVision"
    );

  if (!binocularVisionPath) {
    throw new Error(
      "Consultation model does not contain binocularVision. Check the imported Consultation model."
    );
  }

  const accommodationPath =
    Consultation.schema.path(
      "binocularVision.accommodation"
    );

  if (!accommodationPath) {
    throw new Error(
      "Consultation model does not contain binocularVision.accommodation. Update models/Consultation.js."
    );
  }

  /*
   * This is the exact problem we have been debugging.
   *
   * If this prints String, the backend is loading the OLD
   * Consultation model.
   */
  if (accommodationPath.instance === "String") {
    throw new Error(
      "BACKEND MODEL ERROR: Consultation.schema.path('binocularVision.accommodation') is String. It MUST be a nested object schema. Check ../models/Consultation.js and restart the backend."
    );
  }

  return true;
};

// --------------------------------------------------
// BUILD CONSULTATION DATA
// --------------------------------------------------
const buildConsultationData = (
  req,
  patient,
  clinician
) => {
  const body = req.body || {};

  const consultationDate =
    getConsultationDate(
      body.consultationDate
    );

  if (!consultationDate) {
    return {
      error: "Invalid consultation date",
    };
  }

  /*
   * --------------------------------------------------
   * CONSULTATION TYPE
   * --------------------------------------------------
   *
   * New system:
   *
   * comprehensive
   * short_consult
   * binocular_vision
   * contact_lenses
   * low_vision
   *
   * Specialized types are NOT child options anymore.
   */

  let consultationType =
    normalizeConsultationType(
      body.consultationType
    );

  /*
   * Backward compatibility for old requests.
   */
  if (
    body.consultationType === "specialized"
  ) {
    const legacyType =
      normalizeSpecializedType(
        body.specializedType
      );

    if (legacyType) {
      consultationType = legacyType;
    }
  }

  return {
    organizationId:
      req.user.organizationId,

    branchId:
      patient.registeredBranchId,

    patientId:
      patient._id,

    optometristId:
      clinician._id,

    consultationDate,

    consultationType,

    /*
     * Keep this empty for the new structure.
     *
     * It remains only for compatibility with old
     * documents/controllers.
     */
    specializedType: "",

    status: "completed",

    completedAt: new Date(),

    completedBy:
      req.user._id,

    consultationOptions:
      normalizeConsultationOptions(
        body.consultationOptions
      ),

    // ----------------------------------------------
    // BASIC
    // ----------------------------------------------
    reasonForVisit:
      body.reasonForVisit || "",

    symptoms:
      body.symptoms || "",

    medicalHistory:
      body.medicalHistory || "",

    ocularHistory:
      body.ocularHistory || "",

    familyHistory:
      body.familyHistory || "",

    medication:
      body.medication || "",

    allergy:
      body.allergy || "",

    pupils:
      body.pupils || "",

    // ----------------------------------------------
    // VISUAL ACUITY
    // ----------------------------------------------
    visualAcuity:
      normalizeObject(
        body.visualAcuity
      ),

    // ----------------------------------------------
    // REFRACTION
    // ----------------------------------------------
    previousRx:
      sanitizePrescription(
        body.previousRx || body.refraction?.previous,
        "previous"
      ),

    objectiveRx:
      sanitizePrescription(
        body.objectiveRx || body.refraction?.objective,
        "objective"
      ),

    subjectiveRx:
      sanitizePrescription(
        body.subjectiveRx || body.refraction?.subjective,
        "subjective"
      ),

    finalRx:
      sanitizePrescription(
        body.finalRx || body.refraction?.final,
        "final"
      ),

    givenRx:
      sanitizePrescription(
        body.givenRx || body.refraction?.final,
        "given"
      ),

    refractionNotes:
      body.refractionNotes || "",

    pd:
      normalizeObject(body.pd || body.refraction?.pd),

    refraction:
      normalizeObject(body.refraction),

    subjectiveRxSlots:
      Array.isArray(body.subjectiveRxSlots)
        ? body.subjectiveRxSlots
        : Array.isArray(body.refraction?.subjectiveSlots)
          ? body.refraction.subjectiveSlots
          : [],

    // ----------------------------------------------
    // BINOCULAR VISION
    // ----------------------------------------------
    binocularVision:
      normalizeBinocularVision(
        body.binocularVision
      ),

    // ----------------------------------------------
    // TESTS
    // ----------------------------------------------
    slitLamp:
      normalizeObject(
        body.slitLamp
      ),

    fundus:
      normalizeObject(
        body.fundus
      ),

    otherTests:
      Array.isArray(body.otherTests)
        ? body.otherTests
        : [],

    // ----------------------------------------------
    // DIAGNOSIS
    // ----------------------------------------------
    diagnosis:
      normalizeDiagnosis(body.diagnosis),

    // ----------------------------------------------
    // ADVICE
    // ----------------------------------------------
    advice:
      normalizeAdvice(body.advice),

    // ----------------------------------------------
    // LOW VISION
    // ----------------------------------------------
    lowVision:
      normalizeObject(
        body.lowVision
      ),

    // ----------------------------------------------
    // CONTACT LENS
    // ----------------------------------------------
    contactLens:
      normalizeObject(
        body.contactLens ||
          body.contactLenses
      ),

    contactLenses:
      normalizeObject(
        body.contactLenses ||
          body.contactLens
      ),

    // ----------------------------------------------
    // DISPENSING
    // ----------------------------------------------
    dispensing:
      normalizeObject(
        body.dispensing
      ),

    // ----------------------------------------------
    // THERAPEUTICS
    // ----------------------------------------------
    therapeutics:
      Array.isArray(body.therapeutics)
        ? body.therapeutics
        : [],

    // ----------------------------------------------
    // LEGACY CLINICAL FIELDS
    // ----------------------------------------------
    ophthalmoscopy:
      body.ophthalmoscopy || "",

    biomicroscopy:
      body.biomicroscopy || "",

    visualField:
      body.visualField || "",

    colourVision:
      body.colourVision || "",

    // ----------------------------------------------
    // RECALL
    // ----------------------------------------------
    recall: {
      due: body.recall?.due || body.recall?.date || body.recallDue || null,
      type: body.recall?.type || "",
      message: body.recall?.message || body.recall?.type || body.recallLetter || "",
      sendReminder: Boolean(body.recall?.sendReminder),
    },

    recallDue:
      body.recall?.due ||
      body.recall?.date ||
      body.recallDue ||
      null,

    recallLetter:
      body.recall?.message ||
      body.recall?.type ||
      body.recallLetter ||
      "",

    // ----------------------------------------------
    // NOTES
    // ----------------------------------------------
    clinicalNotes:
      body.clinicalNotes || "",

    patientInstructions:
      body.patientInstructions || "",

    internalNotes:
      body.internalNotes || "",

    notes:
      body.notes || "",

    createdBy:
      req.user._id,
  };
};

// --------------------------------------------------
// UPDATE PATIENT RECALL INFORMATION
// --------------------------------------------------
const updatePatientFromConsultation =
  async (
    patient,
    consultation,
    userId
  ) => {
    patient.updatedBy = userId;

    patient.lastConsultationAt =
      consultation.consultationDate;

    patient.lastOptometristId =
      consultation.optometristId;

    patient.nextRecallAt =
      consultation.recall?.due ||
      consultation.recallDue ||
      null;

    patient.nextRecallLetter =
      consultation.recall?.message ||
      consultation.recallLetter ||
      "";

    patient.recallStage = 1;

    patient.lastRecallAt = null;

    await patient.save();
  };

// ==================================================
// CREATE CONSULTATION
// ==================================================
export const createConsultation =
  asyncHandler(async (req, res) => {
    const { patientId } =
      req.body || {};

    if (!patientId) {
      res.status(400);

      throw new Error(
        "Patient is required"
      );
    }

    // ----------------------------------------------
    // VERIFY ACTUAL LOADED MODEL
    // ----------------------------------------------
    validateLoadedConsultationSchema();

    // ----------------------------------------------
    // PATIENT ACCESS
    // ----------------------------------------------
    const patient =
      await getPatientForUser(
        req.user,
        patientId
      );

    if (!patient) {
      res.status(403);

      throw new Error(
        "You do not have access to this patient"
      );
    }

    // ----------------------------------------------
    // BRANCH ACCESS
    // ----------------------------------------------
    const branch =
      await validateBranchAccess(
        req.user,
        patient.registeredBranchId
      );

    if (!branch) {
      res.status(403);

      throw new Error(
        "You do not have access to this patient's branch"
      );
    }

    // ----------------------------------------------
    // CLINICIAN
    // ----------------------------------------------
    let clinician =
      await validateOptometrist(
        req.user,
        req.body.optometristId
      );

    if (!clinician) {
      clinician =
        await User.findOne({
          organizationId:
            req.user.organizationId,

          status: "active",

          role: {
            $in: [
              "optometrist",
              "doctor",
            ],
          },
        }).sort({
          firstName: 1,
          lastName: 1,
        });
    }

    if (!clinician) {
      res.status(400);

      throw new Error(
        "No active optometrist or doctor is available for this branch"
      );
    }

    // ----------------------------------------------
    // BUILD DATA
    // ----------------------------------------------
    const data =
      buildConsultationData(
        req,
        patient,
        clinician
      );

    if (data.error) {
      res.status(400);

      throw new Error(
        data.error
      );
    }

    // ----------------------------------------------
    // DEBUG / SAFETY CHECK
    // ----------------------------------------------
    if (
      data.binocularVision &&
      typeof data.binocularVision
        .accommodation !==
        "object"
    ) {
      res.status(400);

      throw new Error(
        "Invalid binocular vision accommodation data. Expected an object."
      );
    }

    // ----------------------------------------------
    // CREATE
    // ----------------------------------------------
    const consultation =
      await Consultation.create(
        data
      );

    // ----------------------------------------------
    // UPDATE PATIENT
    // ----------------------------------------------
    await updatePatientFromConsultation(
      patient,
      consultation,
      req.user._id
    );

    // ----------------------------------------------
    // POPULATE
    // ----------------------------------------------
    const populated =
      await Consultation.findById(
        consultation._id
      )
        .populate(
          "patientId",
          "patientNumber firstName middleName lastName dateOfBirth"
        )
        .populate(
          "optometristId",
          "firstName lastName role"
        )
        .populate(
          "createdBy",
          "firstName lastName"
        )
        .populate(
          "updatedBy",
          "firstName lastName"
        );

    res.status(201).json({
      success: true,

      message:
        "Consultation saved successfully",

      data: populated,
    });
  });

// ==================================================
// LIST PATIENT CONSULTATIONS
// ==================================================
export const getPatientConsultations =
  asyncHandler(async (req, res) => {
    const patient =
      await getPatientForUser(
        req.user,
        req.params.patientId
      );

    if (!patient) {
      res.status(403);

      throw new Error(
        "You do not have access to this patient"
      );
    }

    const consultations =
      await Consultation.find({
        organizationId:
          req.user.organizationId,

        patientId:
          patient._id,
      })
        .populate(
          "optometristId",
          "firstName lastName role"
        )
        .sort({
          consultationDate: -1,
        })
        .lean();

    res.json({
      success: true,
      data: consultations,
    });
  });

// ==================================================
// GET SINGLE CONSULTATION
// ==================================================
export const getConsultation =
  asyncHandler(async (req, res) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      res.status(400);

      throw new Error(
        "Invalid consultation ID"
      );
    }

    const consultation =
      await Consultation.findOne({
        _id: req.params.id,

        organizationId:
          req.user.organizationId,
      })
        .populate(
          "patientId",
          "patientNumber firstName middleName lastName dateOfBirth registeredBranchId"
        )
        .populate(
          "optometristId",
          "firstName lastName role"
        )
        .populate(
          "createdBy",
          "firstName lastName"
        )
        .populate(
          "updatedBy",
          "firstName lastName"
        );

    if (!consultation) {
      res.status(404);

      throw new Error(
        "Consultation not found"
      );
    }

    const patient =
      await getPatientForUser(
        req.user,
        consultation.patientId._id
      );

    if (!patient) {
      res.status(403);

      throw new Error(
        "You do not have access to this consultation"
      );
    }

    res.json({
      success: true,
      data: consultation,
    });
  });

// ==================================================
// UPDATE CONSULTATION
// ==================================================
export const updateConsultation =
  asyncHandler(async (req, res) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      res.status(400);

      throw new Error(
        "Invalid consultation ID"
      );
    }

    // ----------------------------------------------
    // VERIFY ACTUAL LOADED MODEL
    // ----------------------------------------------
    validateLoadedConsultationSchema();

    // ----------------------------------------------
    // FIND CONSULTATION
    // ----------------------------------------------
    const consultation =
      await Consultation.findOne({
        _id: req.params.id,

        organizationId:
          req.user.organizationId,
      });

    if (!consultation) {
      res.status(404);

      throw new Error(
        "Consultation not found"
      );
    }

    // ----------------------------------------------
    // PATIENT ACCESS
    // ----------------------------------------------
    const patient =
      await getPatientForUser(
        req.user,
        consultation.patientId
      );

    if (!patient) {
      res.status(403);

      throw new Error(
        "You do not have access to this consultation"
      );
    }

    // ----------------------------------------------
    // SIMPLE FIELDS
    // ----------------------------------------------
    const fields = [
      "consultationDate",

      "reasonForVisit",
      "symptoms",
      "medicalHistory",
      "ocularHistory",
      "familyHistory",
      "medication",
      "allergy",
      "pupils",

      "visualAcuity",

      "refraction",
      "subjectiveRxSlots",
      "refractionNotes",

      "pd",

      "slitLamp",
      "fundus",

      "otherTests",

      "diagnosis",
      "advice",

      "lowVision",

      "contactLens",
      "contactLenses",

      "dispensing",

      "therapeutics",

      "ophthalmoscopy",
      "biomicroscopy",
      "visualField",
      "colourVision",

      "clinicalNotes",
      "patientInstructions",
      "internalNotes",
      "notes",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "advice") {
          consultation.advice = normalizeAdvice(req.body.advice);
        } else if (field === "diagnosis") {
          consultation.diagnosis = normalizeDiagnosis(req.body.diagnosis);
        } else {
          consultation[field] = req.body[field];
        }
      }
    });

    // ----------------------------------------------
    // CONSULTATION TYPE
    // ----------------------------------------------
    if (
      req.body.consultationType !==
      undefined
    ) {
      let type =
        normalizeConsultationType(
          req.body.consultationType
        );

      /*
       * Backward compatibility:
       * specialized + specializedType
       */
      if (
        req.body.consultationType ===
        "specialized"
      ) {
        const legacyType =
          normalizeSpecializedType(
            req.body.specializedType
          );

        if (legacyType) {
          type = legacyType;
        }
      }

      consultation.consultationType =
        type;

      /*
       * New system does not use specializedType.
       */
      if (
        "specializedType" in
        consultation
      ) {
        consultation.specializedType =
          "";
      }
    }

    // ----------------------------------------------
    // REFRACTION COMPATIBILITY
    // ----------------------------------------------
    if (req.body.refraction !== undefined) {
      const rx = req.body.refraction || {};
      consultation.refraction = normalizeObject(rx);
      consultation.pd = normalizeObject(req.body.pd || rx.pd);
      consultation.subjectiveRxSlots =
        Array.isArray(req.body.subjectiveRxSlots)
          ? req.body.subjectiveRxSlots
          : Array.isArray(rx.subjectiveSlots)
            ? rx.subjectiveSlots
            : consultation.subjectiveRxSlots;

      const rxMappings = [
        ["previousRx", rx.previous, "previous"],
        ["objectiveRx", rx.objective, "objective"],
        ["subjectiveRx", rx.subjective, "subjective"],
        ["finalRx", rx.final, "final"],
        ["givenRx", rx.final, "given"],
      ];
      for (const [field, value, type] of rxMappings) {
        if (value !== undefined) {
          consultation[field] = sanitizePrescription(value, type);
        }
      }
    }

    // ----------------------------------------------
    // BINOCULAR VISION
    // ----------------------------------------------
    if (
      req.body.binocularVision !==
      undefined
    ) {
      consultation.binocularVision =
        normalizeBinocularVision(
          req.body.binocularVision
        );
    }

    // ----------------------------------------------
    // PRESCRIPTIONS
    // ----------------------------------------------
    if (
      req.body.previousRx !==
      undefined
    ) {
      consultation.previousRx =
        sanitizePrescription(
          req.body.previousRx,
          "previous"
        );
    }

    if (
      req.body.objectiveRx !==
      undefined
    ) {
      consultation.objectiveRx =
        sanitizePrescription(
          req.body.objectiveRx,
          "objective"
        );
    }

    if (req.body.objectiveRx !== undefined) {
      consultation.objectiveRx =
        sanitizePrescription(req.body.objectiveRx, "objective");
    }

    if (
      req.body.subjectiveRx !==
      undefined
    ) {
      consultation.subjectiveRx =
        sanitizePrescription(
          req.body.subjectiveRx,
          "subjective"
        );
    }

    if (
      req.body.finalRx !==
      undefined
    ) {
      consultation.finalRx =
        sanitizePrescription(
          req.body.finalRx,
          "final"
        );
    }

    if (
      req.body.givenRx !==
      undefined
    ) {
      consultation.givenRx =
        sanitizePrescription(
          req.body.givenRx,
          "given"
        );
    }

    // ----------------------------------------------
    // OPTIONS
    // ----------------------------------------------
    if (
      req.body.consultationOptions !==
      undefined
    ) {
      consultation.consultationOptions =
        normalizeConsultationOptions(
          req.body.consultationOptions
        );
    }

    // ----------------------------------------------
    // RECALL
    // ----------------------------------------------
    if (
      req.body.recall !==
      undefined
    ) {
      const recallInput = normalizeObject(req.body.recall);
      const recallDue = recallInput.due || recallInput.date || null;
      const recallType = recallInput.type || "";
      const recallMessage = recallInput.message || recallType;

      consultation.recall = {
        due: recallDue,
        type: recallType,
        message: recallMessage,
        sendReminder: Boolean(recallInput.sendReminder),
      };

      consultation.recallDue = recallDue;
      consultation.recallLetter = recallMessage;
    }

    if (
      req.body.recallDue !==
      undefined
    ) {
      consultation.recallDue =
        req.body.recallDue ||
        null;
    }

    if (
      req.body.recallLetter !==
      undefined
    ) {
      consultation.recallLetter =
        req.body.recallLetter ||
        "";
    }

    // ----------------------------------------------
    // CLINICIAN
    // ----------------------------------------------
    if (
      req.body.optometristId !==
      undefined
    ) {
      const clinician =
        await validateOptometrist(
          req.user,
          req.body.optometristId
        );

      if (!clinician) {
        res.status(400);

        throw new Error(
          "A valid optometrist or doctor is required"
        );
      }

      consultation.optometristId =
        clinician._id;
    }

    // ----------------------------------------------
    // DATE
    // ----------------------------------------------
    if (
      req.body.consultationDate !==
      undefined
    ) {
      const date =
        getConsultationDate(
          req.body.consultationDate
        );

      if (!date) {
        res.status(400);

        throw new Error(
          "Invalid consultation date"
        );
      }

      consultation.consultationDate =
        date;
    }

    // ----------------------------------------------
    // STATUS
    // ----------------------------------------------
    // Status has a dedicated endpoint so clinical edits cannot
    // accidentally change workflow state.
    if (req.body.status !== undefined) {
      res.status(400);

      throw new Error(
        "Use the consultation status endpoint to change consultation status",
      );
    }

    consultation.updatedBy = req.user._id;

    // ----------------------------------------------
    // SAVE
    // ----------------------------------------------
    await consultation.save();

    // ----------------------------------------------
    // UPDATE PATIENT
    // ----------------------------------------------
    await updatePatientFromConsultation(
      patient,
      consultation,
      req.user._id
    );

    // ----------------------------------------------
    // POPULATE
    // ----------------------------------------------
    const populated =
      await Consultation.findById(
        consultation._id
      )
        .populate(
          "patientId",
          "patientNumber firstName middleName lastName dateOfBirth"
        )
        .populate(
          "optometristId",
          "firstName lastName role"
        )
        .populate(
          "createdBy",
          "firstName lastName"
        )
        .populate(
          "updatedBy",
          "firstName lastName"
        );

    res.json({
      success: true,

      message:
        "Consultation updated successfully",

      data: populated,
    });
  });

// ==================================================
// UPDATE CONSULTATION STATUS
// ==================================================
export const updateConsultationStatus =
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid consultation ID");
    }

    const nextStatus = String(req.body?.status || "")
      .trim()
      .toLowerCase();

    if (!CONSULTATION_STATUSES.includes(nextStatus)) {
      res.status(400);
      throw new Error("Invalid consultation status");
    }

    const consultation = await Consultation.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!consultation) {
      res.status(404);
      throw new Error("Consultation not found");
    }

    const patient = await getPatientForUser(
      req.user,
      consultation.patientId,
    );

    if (!patient) {
      res.status(403);
      throw new Error(
        "You do not have access to this consultation",
      );
    }

    const currentStatus =
      consultation.status || "completed";

    validateConsultationStatusTransition(
      currentStatus,
      nextStatus,
    );

    consultation.status = nextStatus;
    consultation.updatedBy = req.user._id;

    if (nextStatus === "completed") {
      consultation.completedAt =
        consultation.completedAt || new Date();
      consultation.completedBy = req.user._id;
    } else {
      consultation.completedAt = null;
      consultation.completedBy = null;
    }

    await consultation.save();

    const populated = await Consultation.findById(
      consultation._id,
    )
      .populate(
        "patientId",
        "patientNumber firstName middleName lastName dateOfBirth phone",
      )
      .populate(
        "optometristId",
        "firstName lastName role",
      )
      .populate(
        "createdBy",
        "firstName lastName",
      )
      .populate(
        "updatedBy",
        "firstName lastName",
      )
      .populate(
        "completedBy",
        "firstName lastName",
      );

    res.json({
      success: true,
      message: "Consultation status updated successfully",
      data: populated,
    });
  });

