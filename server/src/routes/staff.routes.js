import express from "express";

import {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword,
} from "../controllers/staff.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

router.use(protect);

/**
 * Staff list
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.USER_VIEW),
  getStaff
);

/**
 * Create staff
 */
router.post(
  "/",
  requirePermission(PERMISSIONS.USER_CREATE),
  createStaff
);

/**
 * Single staff member
 */
router.get(
  "/:id",
  requirePermission(PERMISSIONS.USER_VIEW),
  getStaffMember
);

/**
 * Update staff
 */
router.put(
  "/:id",
  requirePermission(PERMISSIONS.USER_UPDATE),
  updateStaff
);

/**
 * Activate / deactivate / suspend
 */
router.patch(
  "/:id/status",
  requirePermission(PERMISSIONS.USER_UPDATE),
  updateStaffStatus
);

/**
 * Reset password
 */
router.post(
  "/:id/reset-password",
  requirePermission(PERMISSIONS.USER_UPDATE),
  resetStaffPassword
);

export default router;