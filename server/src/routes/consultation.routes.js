import express from "express";

import {
  createConsultation,
  getPatientConsultations,
  getConsultation,
  updateConsultation,
} from "../controllers/consultation.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

router.use(protect);

router.get(
  "/patient/:patientId",
  requirePermission(PERMISSIONS.CLINICAL_VIEW),
  getPatientConsultations,
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.CLINICAL_VIEW),
  getConsultation,
);

router.post(
  "/",
  requirePermission(PERMISSIONS.CLINICAL_CREATE),
  createConsultation,
);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.CLINICAL_UPDATE),
  updateConsultation,
);

export default router;
