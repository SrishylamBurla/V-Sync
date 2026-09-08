import express from "express";

import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
} from "../controllers/adminOrganization.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { superAdminOnly } from "../middleware/superAdmin.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

router.use(protect);
router.use(superAdminOnly);

router.get(
  "/",
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  getOrganizations
);

router.post(
  "/",
  requirePermission(PERMISSIONS.ORGANIZATION_CREATE),
  createOrganization
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  getOrganization
);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  updateOrganization
);

router.patch(
  "/:id/status",
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  updateOrganizationStatus
);

export default router;