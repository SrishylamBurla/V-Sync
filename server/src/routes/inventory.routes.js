import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {requirePermission} from "../middleware/permission.middleware.js";
import {PERMISSIONS} from "../config/permissions.js";
import {listInventory,getInventoryItem,createInventoryItem,updateInventoryItem,adjustInventory,inventorySummary,stocktake} from "../controllers/inventory.controller.js";

const router=express.Router();
router.use(protect);
router.get("/summary",requirePermission(PERMISSIONS.INVENTORY_VIEW),inventorySummary);
router.get("/",requirePermission(PERMISSIONS.INVENTORY_VIEW),listInventory);
router.get("/:id",requirePermission(PERMISSIONS.INVENTORY_VIEW),getInventoryItem);
router.post("/",requirePermission(PERMISSIONS.INVENTORY_CREATE),createInventoryItem);
router.put("/:id",requirePermission(PERMISSIONS.INVENTORY_UPDATE),updateInventoryItem);
router.post("/:id/adjust",requirePermission(PERMISSIONS.INVENTORY_UPDATE),adjustInventory);
router.post("/:id/stocktake",requirePermission(PERMISSIONS.INVENTORY_UPDATE),stocktake);
export default router;
