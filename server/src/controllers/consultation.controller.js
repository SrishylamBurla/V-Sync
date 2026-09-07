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
const validateOptometrist = async (user, optometristId) => {
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
  if (!rx) return null;

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
// NORMALIZE CONSULTATION TYPE
// --------------------------------------------------
const normalizeConsultationType = (type) => {
  const allowed = [
    "comprehensive",
    "short_consult",
  ];

  return allowed.includes(type)
    ? type
    : "comprehensive";
};

// --------------------------------------------------
// NORMALIZE CONSULTATION OPTIONS
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
// BUILD CONSULTATION DATA
// --------------------------------------------------
const buildConsultationData = (req, patient, clinician) => {
  const body = req.body;

  const consultationDate = getConsultationDate(
    body.consultationDate
  );

  if (!consultationDate) {
    return {
      error: "Invalid consultation date",
    };
  }

  return {
    organizationId: req.user.organizationId,

    branchId: patient.registeredBranchId,

    patientId: patient._id,

    optometristId: clinician._id,

    consultationDate,

    consultationType:
      normalizeConsultationType(
        body.consultationType
      ),

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
      body.visualAcuity || {},

    // ----------------------------------------------
    // REFRACTION
    // ----------------------------------------------
    previousRx: sanitizePrescription(
      body.previousRx,
      "previous"
    ),

    objectiveRx: sanitizePrescription(
      body.objectiveRx,
      "objective"
    ),

    subjectiveRx: sanitizePrescription(
      body.subjectiveRx,
      "subjective"
    ),

    finalRx: sanitizePrescription(
      body.finalRx,
      "final"
    ),

    givenRx: sanitizePrescription(
      body.givenRx,
      "given"
    ),

    refractionNotes:
      body.refractionNotes || "",

    pd: body.pd || {},

    // ----------------------------------------------
    // BINOCULAR VISION
    // ----------------------------------------------
    binocularVision:
      body.binocularVision || {},

    // ----------------------------------------------
    // TESTS
    // ----------------------------------------------
    slitLamp:
      body.slitLamp || {},

    fundus:
      body.fundus || {},

    otherTests:
      Array.isArray(body.otherTests)
        ? body.otherTests
        : [],

    // ----------------------------------------------
    // DIAGNOSIS
    // ----------------------------------------------
    diagnosis:
      Array.isArray(body.diagnosis)
        ? body.diagnosis
        : [],

    // ----------------------------------------------
    // ADVICE
    // ----------------------------------------------
    advice:
      Array.isArray(body.advice)
        ? body.advice
        : [],

    // ----------------------------------------------
    // SPECIALIZED
    // ----------------------------------------------
    lowVision:
      body.lowVision || {},

    contactLens:
      body.contactLens || {},

    // ----------------------------------------------
    // DISPENSING
    // ----------------------------------------------
    dispensing:
      body.dispensing || {},

    // ----------------------------------------------
    // THERAPEUTICS
    // ----------------------------------------------
    therapeutics:
      Array.isArray(body.therapeutics)
        ? body.therapeutics
        : [],

    // ----------------------------------------------
    // LEGACY FIELDS
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
    recall:
      body.recall || {},

    recallDue:
      body.recall?.due ||
      body.recallDue ||
      null,

    recallLetter:
      body.recall?.message ||
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

    createdBy: req.user._id,
  };
};

// --------------------------------------------------
// UPDATE PATIENT RECALL INFORMATION
// --------------------------------------------------
const updatePatientFromConsultation = async (
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
export const createConsultation = asyncHandler(
  async (req, res) => {
    const { patientId } = req.body;

    if (!patientId) {
      res.status(400);
      throw new Error("Patient is required");
    }

    // ----------------------------------------------
    // PATIENT ACCESS
    // ----------------------------------------------
    const patient = await getPatientForUser(
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
    const branch = await validateBranchAccess(
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

    // ----------------------------------------------
    // BUILD DATA
    // ----------------------------------------------
    const data = buildConsultationData(
      req,
      patient,
      clinician
    );

    if (data.error) {
      res.status(400);
      throw new Error(data.error);
    }

    // ----------------------------------------------
    // CREATE
    // ----------------------------------------------
    const consultation =
      await Consultation.create(data);

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
        );

    res.status(201).json({
      success: true,
      message:
        "Consultation saved successfully",
      data: populated,
    });
  }
);

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

        patientId: patient._id,
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
      "consultationType",
      "reasonForVisit",
      "symptoms",
      "medicalHistory",
      "ocularHistory",
      "familyHistory",
      "medication",
      "allergy",
      "pupils",
      "visualAcuity",
      "refractionNotes",
      "pd",
      "binocularVision",
      "slitLamp",
      "fundus",
      "otherTests",
      "diagnosis",
      "advice",
      "lowVision",
      "contactLens",
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
        consultation[field] =
          req.body[field];
      }
    });

    // ----------------------------------------------
    // TYPE
    // ----------------------------------------------
    if (
      req.body.consultationType !== undefined
    ) {
      consultation.consultationType =
        normalizeConsultationType(
          req.body.consultationType
        );
    }

    // ----------------------------------------------
    // OPTIONS
    // ----------------------------------------------
    if (
      req.body.consultationOptions !== undefined
    ) {
      consultation.consultationOptions =
        normalizeConsultationOptions(
          req.body.consultationOptions
        );
    }

    // ----------------------------------------------
    // PRESCRIPTIONS
    // ----------------------------------------------
    if (
      req.body.previousRx !== undefined
    ) {
      consultation.previousRx =
        sanitizePrescription(
          req.body.previousRx,
          "previous"
        );
    }

    if (
      req.body.objectiveRx !== undefined
    ) {
      consultation.objectiveRx =
        sanitizePrescription(
          req.body.objectiveRx,
          "objective"
        );
    }

    if (
      req.body.subjectiveRx !== undefined
    ) {
      consultation.subjectiveRx =
        sanitizePrescription(
          req.body.subjectiveRx,
          "subjective"
        );
    }

    if (
      req.body.finalRx !== undefined
    ) {
      consultation.finalRx =
        sanitizePrescription(
          req.body.finalRx,
          "final"
        );
    }

    if (
      req.body.givenRx !== undefined
    ) {
      consultation.givenRx =
        sanitizePrescription(
          req.body.givenRx,
          "given"
        );
    }

    // ----------------------------------------------
    // RECALL
    // ----------------------------------------------
    if (
      req.body.recall !== undefined
    ) {
      consultation.recall =
        req.body.recall || {};
    }

    if (
      req.body.recallDue !== undefined
    ) {
      consultation.recallDue =
        req.body.recallDue || null;
    }

    if (
      req.body.recallLetter !== undefined
    ) {
      consultation.recallLetter =
        req.body.recallLetter || "";
    }

    // Keep legacy and new recall values synchronized.
    if (req.body.recall !== undefined) {
      consultation.recallDue =
        req.body.recall?.due || null;

      consultation.recallLetter =
        req.body.recall?.message || "";
    }

    // ----------------------------------------------
    // CLINICIAN
    // ----------------------------------------------
    if (
      req.body.optometristId !== undefined
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
      req.body.consultationDate !== undefined
    ) {
      const date = getConsultationDate(
        req.body.consultationDate
      );

      if (!date) {
        res.status(400);
        throw new Error(
          "Invalid consultation date"
        );
      }

      consultation.consultationDate = date;
    }

    consultation.updatedBy =
      req.user._id;

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