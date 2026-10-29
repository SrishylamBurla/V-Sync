import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { listContactLensCodes, createContactLensCode, updateContactLensCode } from "../controllers/catalogue.controller.js";

const router = express.Router();
router.use(protect);
router.get("/", requirePermission(PERMISSIONS.INVENTORY_VIEW), listContactLensCodes);
router.post("/", requirePermission(PERMISSIONS.INVENTORY_CREATE), createContactLensCode);
router.put("/:id", requirePermission(PERMISSIONS.INVENTORY_UPDATE), updateContactLensCode);
export default router;
