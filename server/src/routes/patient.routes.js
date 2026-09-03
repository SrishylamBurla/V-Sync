import express from "express";

import {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patient.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { requirePermission } from "../middleware/permission.middleware.js";

import { PERMISSIONS } from "../config/permissions.js";
import upload from "../middleware/patientDocumentUpload.js";
import {
  getPatientDocuments,
  uploadPatientDocument,
  streamPatientDocument,
  deletePatientDocument,
} from "../controllers/patientDocument.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", requirePermission(PERMISSIONS.PATIENT_VIEW), getPatients);

router.get("/:id/documents", requirePermission(PERMISSIONS.PATIENT_VIEW), getPatientDocuments);

router.get("/:id/documents/:documentId/file", requirePermission(PERMISSIONS.PATIENT_VIEW), streamPatientDocument);

router.post(
  "/:id/documents",
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  upload.single("file"),
  uploadPatientDocument,
);

router.delete(
  "/:id/documents/:documentId",
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  deletePatientDocument,
);

router.post("/", requirePermission(PERMISSIONS.PATIENT_CREATE), createPatient);

router.get("/:id", requirePermission(PERMISSIONS.PATIENT_VIEW), getPatient);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  updatePatient,
);

router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PATIENT_DELETE),
  deletePatient,
);

export default router;
