import express from "express";

import {
  getConsultations,
  getPatientConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
} from "../controllers/consultation.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// All consultations
router.get("/", getConsultations);

// Patient consultation history
router.get(
  "/patient/:patientId",
  getPatientConsultations
);

// Single consultation
router.get(
  "/:id",
  getConsultation
);

// Create consultation
router.post(
  "/",
  createConsultation
);

// Update consultation
router.put(
  "/:id",
  updateConsultation
);

export default router;