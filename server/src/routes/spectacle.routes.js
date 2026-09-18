import express from "express";

import { protect } from "../middleware/auth.middleware.js";

import {
  getSpectacle,
  getPatientSpectacles,
  latestConsultation,
  createSpectacle,
  updateSpectacle,
  updateSpectacleStatus,
  dispensingList,
} from "../controllers/spectacle.controller.js";

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Dispensing / workflow
|--------------------------------------------------------------------------
*/

router.get(
  "/dispensing",
  dispensingList,
);

router.get(
  "/patient/:patientId/latest-consultation",
  latestConsultation,
);

router.get(
  "/patient/:patientId",
  getPatientSpectacles,
);

/*
|--------------------------------------------------------------------------
| Individual spectacle
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getSpectacle,
);

router.post(
  "/",
  createSpectacle,
);

router.put(
  "/:id",
  updateSpectacle,
);

/*
|--------------------------------------------------------------------------
| Status workflow
|--------------------------------------------------------------------------
|
| draft
|   → ordered
|   → not_ready
|   → ready
|   → notified
|   → collected
|
*/

router.patch(
  "/:id/status",
  updateSpectacleStatus,
);

export default router;