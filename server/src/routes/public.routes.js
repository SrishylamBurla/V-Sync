import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.middleware.js";
import { superAdminOnly } from "../middleware/superAdmin.middleware.js";
import { createPublicLead, listPublicLeads, updatePublicLeadStatus } from "../controllers/publicLead.controller.js";

const router = express.Router();
const leadSubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many enquiries from this connection. Please try again shortly." },
});

// Public endpoint used by the marketing site; listing and status updates require super-admin access.
router.post("/leads", leadSubmissionLimit, createPublicLead);
router.get("/leads", protect, superAdminOnly, listPublicLeads);
router.patch("/leads/:id/status", protect, superAdminOnly, updatePublicLeadStatus);

export default router;
