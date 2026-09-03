import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {listContactLensCodes,createContactLensCode,updateContactLensCode} from "../controllers/catalogue.controller.js";
const r=express.Router();r.use(protect);r.get("/",listContactLensCodes);r.post("/",createContactLensCode);r.put("/:id",updateContactLensCode);export default r;
