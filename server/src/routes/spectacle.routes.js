import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

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

const canView = requirePermission(PERMISSIONS.ORDER_VIEW);
const canCreate = requirePermission(PERMISSIONS.ORDER_CREATE);
const canUpdate = requirePermission(PERMISSIONS.ORDER_UPDATE);

/*
|--------------------------------------------------------------------------
| Dispensing / workflow
|--------------------------------------------------------------------------
*/

router.get(
  "/dispensing",
  canView,
  dispensingList,
);

router.get(
  "/patient/:patientId/latest-consultation",
  canView,
  latestConsultation,
);

router.get(
  "/patient/:patientId",
  canView,
  getPatientSpectacles,
);

/*
|--------------------------------------------------------------------------
| Individual spectacle
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  canView,
  getSpectacle,
);

router.post(
  "/",
  canCreate,
  createSpectacle,
);

router.put(
  "/:id",
  canUpdate,
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
  canUpdate,
  updateSpectacleStatus,
);

export default router;