import asyncHandler from "express-async-handler";

import Consultation from "../models/Consultation.js";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

const getSinglePracticeBranch = async (organizationId) =>
  Branch.findOne({ organizationId, status: "active" }).sort({ createdAt: 1 });

const getPatientForUser = async (user, patientId) => {
  const patient = await Patient.findOne({
    _id: patientId,
    organizationId: user.organizationId,
  });
  if (!patient) return null;
  const branch = await getSinglePracticeBranch(user.organizationId);
  if (!branch || patient.registeredBranchId.toString() !== branch._id.toString()) return null;
  return patient;
};

const validateOptometrist = async (user, optometristId) => {
  const id = optometristId || user._id;
  return User.findOne({
    _id: id,
    organizationId: user.organizationId,
    status: "active",
    role: { $in: ["optometrist", "doctor"] },
  });
};

const sanitizePrescription = (rx, type) => {
  if (!rx) return null;

  return {
    type,
    right: rx.right || {},
    left: rx.left || {},
    note: rx.note || "",
  };
};

// --------------------------------------------------
// CREATE CONSULTATION
// --------------------------------------------------
export const createConsultation = asyncHandler(async (req, res) => {
  const { patientId } = req.body;

  if (!patientId) {
    res.status(400);
    throw new Error("Patient is required");
  }

  const patient = await getPatientForUser(req.user, patientId);
  if (!patient) {
    res.status(403);
    throw new Error("You do not have access to this patient");
  }

  const branch = await getSinglePracticeBranch(req.user.organizationId);
  if (!branch || patient.registeredBranchId.toString() !== branch._id.toString()) {
    res.status(403);
    throw new Error("Patient does not belong to the active practice");
  }

  const clinician = await validateOptometrist(req.user, req.body.optometristId);
  if (!clinician) {
    res.status(400);
    throw new Error("A valid optometrist or doctor is required");
  }

  const consultationDate = req.body.consultationDate
    ? new Date(req.body.consultationDate)
    : new Date();

  if (Number.isNaN(consultationDate.getTime())) {
    res.status(400);
    throw new Error("Invalid consultation date");
  }

  const consultation = await Consultation.create({
    organizationId: req.user.organizationId,
    branchId: patient.registeredBranchId,
    patientId: patient._id,
    optometristId: clinician._id,
    consultationDate,
    consultationType: req.body.consultationType || "spectacle",

    medication: req.body.medication || "",
    allergy: req.body.allergy || "",
    pupils: req.body.pupils || "",
    symptoms: req.body.symptoms || "",
    ophthalmoscopy: req.body.ophthalmoscopy || "",
    biomicroscopy: req.body.biomicroscopy || "",
    visualField: req.body.visualField || "",
    colourVision: req.body.colourVision || "",
    otherTests: req.body.otherTests || [],

    previousRx: sanitizePrescription(req.body.previousRx, "previous"),
    subjectiveRx: sanitizePrescription(req.body.subjectiveRx, "subjective"),
    givenRx: sanitizePrescription(req.body.givenRx, "given"),

    pd: req.body.pd || {},
    recallDue: req.body.recallDue || null,
    recallLetter: req.body.recallLetter || "",
    notes: req.body.notes || "",
    createdBy: req.user._id,
  });

  // Consultation is the source of truth for the patient's latest visit/recall.
  patient.updatedBy = req.user._id;
  patient.lastConsultationAt = consultation.consultationDate;
  patient.lastOptometristId = clinician._id;
  patient.nextRecallAt = consultation.recallDue || null;
  patient.nextRecallLetter = consultation.recallLetter || "";
  patient.recallStage = 1;
  patient.lastRecallAt = null;
  await patient.save();

  const populated = await Consultation.findById(consultation._id)
    .populate("patientId", "patientNumber firstName middleName lastName")
    .populate("optometristId", "firstName lastName role")
    .populate("createdBy", "firstName lastName");

  res.status(201).json({
    success: true,
    message: "Consultation saved successfully",
    data: populated,
  });
});

// --------------------------------------------------
// LIST PATIENT CONSULTATIONS
// --------------------------------------------------
export const getPatientConsultations = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user, req.params.patientId);

  if (!patient) {
    res.status(403);
    throw new Error("You do not have access to this patient");
  }

  const consultations = await Consultation.find({
    organizationId: req.user.organizationId,
    patientId: patient._id,
  })
    .populate("optometristId", "firstName lastName role")
    .sort({ consultationDate: -1 })
    .lean();

  res.json({ success: true, data: consultations });
});

// --------------------------------------------------
// GET CONSULTATION
// --------------------------------------------------
export const getConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  })
    .populate("patientId", "patientNumber firstName middleName lastName")
    .populate("optometristId", "firstName lastName role")
    .populate("createdBy", "firstName lastName");

  if (!consultation) {
    res.status(404);
    throw new Error("Consultation not found");
  }

  const patient = await getPatientForUser(req.user, consultation.patientId._id);
  if (!patient) {
    res.status(403);
    throw new Error("You do not have access to this consultation");
  }

  res.json({ success: true, data: consultation });
});

// --------------------------------------------------
// UPDATE CONSULTATION
// --------------------------------------------------
export const updateConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  });

  if (!consultation) {
    res.status(404);
    throw new Error("Consultation not found");
  }

  const patient = await getPatientForUser(req.user, consultation.patientId);
  if (!patient) {
    res.status(403);
    throw new Error("You do not have access to this consultation");
  }

  const fields = [
    "consultationDate",
    "consultationType",
    "medication",
    "allergy",
    "pupils",
    "symptoms",
    "ophthalmoscopy",
    "biomicroscopy",
    "visualField",
    "colourVision",
    "otherTests",
    "pd",
    "recallDue",
    "recallLetter",
    "notes",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) consultation[field] = req.body[field];
  });

  if (req.body.previousRx !== undefined) {
    consultation.previousRx = sanitizePrescription(req.body.previousRx, "previous");
  }
  if (req.body.subjectiveRx !== undefined) {
    consultation.subjectiveRx = sanitizePrescription(req.body.subjectiveRx, "subjective");
  }
  if (req.body.givenRx !== undefined) {
    consultation.givenRx = sanitizePrescription(req.body.givenRx, "given");
  }

  if (req.body.optometristId !== undefined) {
    const clinician = await validateOptometrist(req.user, req.body.optometristId);
    if (!clinician) {
      res.status(400);
      throw new Error("A valid optometrist or doctor is required");
    }
    consultation.optometristId = clinician._id;
  }

  consultation.updatedBy = req.user._id;
  await consultation.save();

  patient.updatedBy = req.user._id;
  patient.lastConsultationAt = consultation.consultationDate;
  patient.lastOptometristId = consultation.optometristId;
  patient.nextRecallAt = consultation.recallDue || null;
  patient.nextRecallLetter = consultation.recallLetter || "";
  patient.recallStage = 1;
  patient.lastRecallAt = null;
  await patient.save();

  res.json({
    success: true,
    message: "Consultation updated successfully",
    data: consultation,
  });
});
