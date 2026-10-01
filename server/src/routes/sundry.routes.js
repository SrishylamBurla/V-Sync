import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listSundryJobs,
  getSundryJob,
  createSundryJob,
  updateSundryStatus,
  updateSundryJob,
} from "../controllers/sundry.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", listSundryJobs);
router.get("/:id", getSundryJob);
router.post("/", createSundryJob);
router.put("/:id", updateSundryJob);
router.patch("/:id/status", updateSundryStatus);

export default router;
