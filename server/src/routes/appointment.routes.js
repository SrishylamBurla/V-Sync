import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

import {
  getAppointments,
  getAppointment,
  getClinicians,
  createAppointment,
  updateAppointment,
  getPatientAppointments,
} from "../controllers/appointment.controller.js";

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Clinicians
|--------------------------------------------------------------------------
*/
router.get(
  "/clinicians",
  requirePermission(PERMISSIONS.APPOINTMENT_VIEW),
  getClinicians,
);

/*
|--------------------------------------------------------------------------
| Patient-specific appointments
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This must be BEFORE "/:id"
|
| GET /appointments/patient/:patientId
|
*/
router.get(
  "/patient/:patientId",
  requirePermission(PERMISSIONS.APPOINTMENT_VIEW),
  getPatientAppointments,
);

/*
|--------------------------------------------------------------------------
| Single appointment
|--------------------------------------------------------------------------
|
| GET /appointments/:id
|
*/
router.get(
  "/:id",
  requirePermission(PERMISSIONS.APPOINTMENT_VIEW),
  getAppointment,
);

/*
|--------------------------------------------------------------------------
| All appointments
|--------------------------------------------------------------------------
|
| GET /appointments
|
*/
router.get(
  "/",
  requirePermission(PERMISSIONS.APPOINTMENT_VIEW),
  getAppointments,
);

/*
|--------------------------------------------------------------------------
| Create appointment
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  requirePermission(PERMISSIONS.APPOINTMENT_CREATE),
  createAppointment,
);

/*
|--------------------------------------------------------------------------
| Update appointment
|--------------------------------------------------------------------------
*/
router.put(
  "/:id",
  requirePermission(PERMISSIONS.APPOINTMENT_UPDATE),
  updateAppointment,
);

export default router;