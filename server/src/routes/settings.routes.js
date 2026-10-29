import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();
router.use(protect);
router.get("/", requirePermission(PERMISSIONS.SETTINGS_VIEW), getSettings);
router.put("/", requirePermission(PERMISSIONS.SETTINGS_UPDATE), updateSettings);
export default router;
