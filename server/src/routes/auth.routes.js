import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerOrganization,
  login,
  getMe,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many registration attempts. Please try again later." },
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many token refresh requests. Please sign in again." },
});

router.get("/me", protect, getMe);
router.post("/register", registrationLimiter, registerOrganization);
router.post("/refresh", refreshLimiter, refreshAccessToken);
router.post("/login", loginLimiter, login);

export default router;
