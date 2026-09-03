import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { listDispensing, getDispensing, updateDispensing } from "../controllers/dispensing.controller.js";
const r = express.Router();
r.use(protect);
r.get("/", listDispensing);
r.get("/:id", getDispensing);
r.put("/:id", updateDispensing);
export default r;
