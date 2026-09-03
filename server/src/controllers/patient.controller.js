import asyncHandler from "express-async-handler";

import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";

import { generatePatientNumber } from "../utils/generatePatientNumber.js";

const getSinglePracticeBranch = async (organizationId) =>
  Branch.findOne({ organizationId, status: "active" }).sort({ createdAt: 1 });

const validateBranchAccess = async (user, branchId) => {
  return Branch.findOne({
    _id: branchId,
    organizationId: user.organizationId,
    status: "active",
  });
};

// --------------------------------------------------
// CREATE PATIENT
// --------------------------------------------------

export const createPatient = asyncHandler(async (req, res) => {
  const {
    registeredBranchId,
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    alternatePhone,
    email,
    address,
    emergencyContact,
    occupation,
    preferredLanguage,
    source,
    notes,
  } = req.body;

  if (!firstName) {
    res.status(400);
    throw new Error("First name is required");
  }

  // VividOpt currently operates as a single-practice/single-branch system.
  // Keep branchId in the data model for future multi-branch expansion, but
  // never ask staff to select a branch in the UI.
  let resolvedBranchId = registeredBranchId;
  if (!resolvedBranchId) {
    const activeBranch = await Branch.findOne({
      organizationId: req.user.organizationId,
      status: "active",
    }).sort({ createdAt: 1 });
    resolvedBranchId = activeBranch?._id;
  }

  if (!resolvedBranchId) {
    res.status(400);
    throw new Error("An active practice branch is required");
  }

  const branch = await validateBranchAccess(req.user, resolvedBranchId);

  if (!branch) {
    res.status(403);

    throw new Error("You do not have access to this branch");
  }

  const normalizedPhone = phone?.trim();

  if (normalizedPhone) {
    const existingPatient = await Patient.findOne({
      organizationId: req.user.organizationId,

      phone: normalizedPhone,

      status: "active",
    });

    if (existingPatient) {
      res.status(409);

      throw new Error("A patient with this phone number already exists");
    }
  }

  const patientNumber = await generatePatientNumber(req.user.organizationId);

  const patient = await Patient.create({
    organizationId: req.user.organizationId,

    registeredBranchId: resolvedBranchId,

    patientNumber,

    firstName: firstName.trim(),

    middleName: middleName?.trim() || "",

    lastName: lastName?.trim() || "",

    dateOfBirth,

    gender,

    phone: normalizedPhone,

    alternatePhone: alternatePhone?.trim(),

    email: email?.trim().toLowerCase(),

    address,

    emergencyContact,

    occupation: occupation?.trim(),

    preferredLanguage,

    source,

    notes: notes?.trim(),

    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,

    message: "Patient created successfully",

    data: patient,
  });
});

// --------------------------------------------------
// GET PATIENTS
// --------------------------------------------------

export const getPatients = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    status = "active",
    branchId,
  } = req.query;

  const pageNumber = Math.max(Number(page), 1);

  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    organizationId: req.user.organizationId,

    status,
  };

  // Single-branch mode: all active patients belong to the practice.
  // branchId remains accepted internally for future multi-branch support.


  if (search.trim()) {
    const regex = new RegExp(search.trim(), "i");

    query.$or = [
      {
        patientNumber: regex,
      },
      {
        firstName: regex,
      },
      {
        middleName: regex,
      },
      {
        lastName: regex,
      },
      {
        phone: regex,
      },
      {
        email: regex,
      },
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .populate("registeredBranchId", "name code")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Patient.countDocuments(query),
  ]);

  res.json({
    success: true,

    data: {
      patients,

      pagination: {
        page: pageNumber,

        limit: limitNumber,

        total,

        totalPages: Math.ceil(total / limitNumber),
      },
    },
  });
});

// --------------------------------------------------
// GET PATIENT
// --------------------------------------------------

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,

    organizationId: req.user.organizationId,
  })
    .populate("registeredBranchId", "name code")
    .populate("createdBy", "firstName lastName");

  if (!patient) {
    res.status(404);

    throw new Error("Patient not found");
  }


  res.json({
    success: true,

    data: patient,
  });
});

// --------------------------------------------------
// UPDATE PATIENT
// --------------------------------------------------

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,

    organizationId: req.user.organizationId,
  });

  if (!patient) {
    res.status(404);

    throw new Error("Patient not found");
  }

  const allowedFields = [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "gender",
    "phone",
    "alternatePhone",
    "email",
    "address",
    "emergencyContact",
    "occupation",
    "preferredLanguage",
    "source",
    "notes",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      patient[field] = req.body[field];
    }
  });

  patient.updatedBy = req.user._id;

  await patient.save();

  res.json({
    success: true,

    message: "Patient updated successfully",

    data: patient,
  });
});

// --------------------------------------------------
// DEACTIVATE PATIENT
// --------------------------------------------------

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,

    organizationId: req.user.organizationId,
  });

  if (!patient) {
    res.status(404);

    throw new Error("Patient not found");
  }

  patient.status = "inactive";

  patient.updatedBy = req.user._id;

  await patient.save();

  res.json({
    success: true,

    message: "Patient deactivated successfully",
  });
});
