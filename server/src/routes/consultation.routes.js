import express from "express";

import {
  getConsultations,
  getPatientConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  updateConsultationStatus,
} from "../controllers/consultation.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();
router.use(protect);

const canViewClinical = requirePermission(PERMISSIONS.CLINICAL_VIEW);
const canCreateClinical = requirePermission(PERMISSIONS.CLINICAL_CREATE);
const canUpdateClinical = requirePermission(PERMISSIONS.CLINICAL_UPDATE);

// Keep specific routes above /:id so they cannot be mistaken for an ID.
router.get("/patient/:patientId", canViewClinical, getPatientConsultations);
router.get("/", canViewClinical, getConsultations);
router.get("/:id", canViewClinical, getConsultation);
router.post("/", canCreateClinical, createConsultation);
router.put("/:id", canUpdateClinical, updateConsultation);
router.patch("/:id/status", canUpdateClinical, updateConsultationStatus);

export default router;
