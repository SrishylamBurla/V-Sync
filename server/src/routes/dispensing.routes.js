import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { listDispensing, getDispensing, updateDispensing } from "../controllers/dispensing.controller.js";

const router = express.Router();
router.use(protect);
router.get("/", requirePermission(PERMISSIONS.ORDER_VIEW), listDispensing);
router.get("/:id", requirePermission(PERMISSIONS.ORDER_VIEW), getDispensing);
router.put("/:id", requirePermission(PERMISSIONS.ORDER_UPDATE), updateDispensing);
export default router;
