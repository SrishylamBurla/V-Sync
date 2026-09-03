import express from "express";
import {
  registerOrganization,
  login,
  getMe,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.post("/register", registerOrganization);
router.post("/refresh", refreshAccessToken);
router.post("/login", login);

export default router;
