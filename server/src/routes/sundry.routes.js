import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  listSundryJobs, getSundryJob, createSundryJob, updateSundryStatus, updateSundryJob,
} from "../controllers/sundry.controller.js";

const router = express.Router();
router.use(protect);
router.get("/", requirePermission(PERMISSIONS.ORDER_VIEW), listSundryJobs);
router.get("/:id", requirePermission(PERMISSIONS.ORDER_VIEW), getSundryJob);
router.post("/", requirePermission(PERMISSIONS.ORDER_CREATE), createSundryJob);
router.put("/:id", requirePermission(PERMISSIONS.ORDER_UPDATE), updateSundryJob);
router.patch("/:id/status", requirePermission(PERMISSIONS.ORDER_UPDATE), updateSundryStatus);
export default router;
