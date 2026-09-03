import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { getAppointments, getAppointment, getClinicians, createAppointment, updateAppointment } from "../controllers/appointment.controller.js";

const router = express.Router();
router.use(protect);
router.get("/clinicians", requirePermission(PERMISSIONS.APPOINTMENT_VIEW), getClinicians);
router.get("/:id", requirePermission(PERMISSIONS.APPOINTMENT_VIEW), getAppointment);
router.get("/", requirePermission(PERMISSIONS.APPOINTMENT_VIEW), getAppointments);
router.post("/", requirePermission(PERMISSIONS.APPOINTMENT_CREATE), createAppointment);
router.put("/:id", requirePermission(PERMISSIONS.APPOINTMENT_UPDATE), updateAppointment);
export default router;
