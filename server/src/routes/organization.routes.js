import express from "express";

import {
  getMyOrganization,
  updateMyOrganization,
  getOrganizationSummary,
} from "../controllers/organization.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

router.use(protect);

// Current user's organization
router.get(
  "/me",
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  getMyOrganization
);

router.get(
  "/me/summary",
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  getOrganizationSummary
);

router.put(
  "/me",
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  updateMyOrganization
);

export default router;