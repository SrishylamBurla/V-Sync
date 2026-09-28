import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {listContactLenses,getContactLens,createContactLens,updateContactLens,latestContactLensConsultation} from "../controllers/contactLens.controller.js";

const r=express.Router();
r.use(protect);
const canView=requirePermission(PERMISSIONS.ORDER_VIEW);
const canCreate=requirePermission(PERMISSIONS.ORDER_CREATE);
const canUpdate=requirePermission(PERMISSIONS.ORDER_UPDATE);

r.get("/patient/:patientId/latest-consultation",canView,latestContactLensConsultation);
r.get("/patient/:patientId",canView,listContactLenses);
r.get("/",canView,listContactLenses);
r.get("/:id",canView,getContactLens);
r.post("/",canCreate,createContactLens);
r.put("/:id",canUpdate,updateContactLens);
export default r;
