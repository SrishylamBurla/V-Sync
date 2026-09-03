import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {listContactLenses,getContactLens,createContactLens,updateContactLens,latestContactLensConsultation} from "../controllers/contactLens.controller.js";
const r=express.Router();r.use(protect);r.get("/patient/:patientId/latest-consultation",latestContactLensConsultation);r.get("/patient/:patientId",listContactLenses);r.get("/",listContactLenses);r.get("/:id",getContactLens);r.post("/",createContactLens);r.put("/:id",updateContactLens);export default r;
