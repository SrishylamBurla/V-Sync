import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {requirePermission} from "../middleware/permission.middleware.js";
import {PERMISSIONS} from "../config/permissions.js";
import {listNewsletters,getNewsletter,createNewsletter,updateNewsletter,sendNewsletter,listMessages,sendMessage} from "../controllers/marketing.controller.js";
const router=express.Router();router.use(protect,requirePermission(PERMISSIONS.PATIENT_VIEW));
router.get("/newsletters",listNewsletters);router.get("/newsletters/:id",getNewsletter);router.post("/newsletters",requirePermission(PERMISSIONS.PATIENT_UPDATE),createNewsletter);router.put("/newsletters/:id",requirePermission(PERMISSIONS.PATIENT_UPDATE),updateNewsletter);router.post("/newsletters/:id/send",requirePermission(PERMISSIONS.PATIENT_UPDATE),sendNewsletter);
router.get("/messages",listMessages);router.post("/messages",requirePermission(PERMISSIONS.PATIENT_UPDATE),sendMessage);
export default router;
