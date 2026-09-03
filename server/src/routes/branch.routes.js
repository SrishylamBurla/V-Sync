import express from "express";

import {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
} from "../controllers/branch.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { requirePermission } from "../middleware/permission.middleware.js";

import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

router.use(protect);

router.get("/", requirePermission(PERMISSIONS.BRANCH_VIEW), getBranches);

router.post("/", requirePermission(PERMISSIONS.BRANCH_CREATE), createBranch);

router.get("/:id", requirePermission(PERMISSIONS.BRANCH_VIEW), getBranch);

router.put("/:id", requirePermission(PERMISSIONS.BRANCH_UPDATE), updateBranch);

export default router;
