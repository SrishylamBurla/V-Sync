import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  getRecallSummary,
  getRecallSettings,
  updateRecallSettings,
  createRecallList,
  getCurrentRecallList,
  updateRecallEntry,
  updateRecallList,
} from "../controllers/recall.controller.js";

const router = express.Router();
router.use(protect, requirePermission(PERMISSIONS.RECALL_VIEW));
router.get("/summary", getRecallSummary);
router.get("/settings", getRecallSettings);
router.put("/settings", requirePermission(PERMISSIONS.RECALL_UPDATE), updateRecallSettings);
router.post("/lists", requirePermission(PERMISSIONS.RECALL_CREATE), createRecallList);
router.get("/lists/current", getCurrentRecallList);
router.put("/lists/:id", requirePermission(PERMISSIONS.RECALL_UPDATE), updateRecallList);
router.put("/lists/:listId/entries/:entryId", requirePermission(PERMISSIONS.RECALL_UPDATE), updateRecallEntry);
export default router;
