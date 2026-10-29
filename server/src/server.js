import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import adminOrganizationRoutes from "./routes/adminOrganization.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import consultationRoutes from "./routes/consultation.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import spectacleRoutes from "./routes/spectacle.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import contactLensRoutes from "./routes/contactLens.routes.js";
import dispensingRoutes from "./routes/dispensing.routes.js";
import recallRoutes from "./routes/recall.routes.js";
import communicationsRoutes from "./routes/communications.routes.js";
import marketingRoutes from "./routes/marketing.routes.js";
import reportRoutes from "./routes/report.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import catalogueRoutes from "./routes/catalogue.routes.js";
import contactLensCatalogueRoutes from "./routes/contactLensCatalogue.routes.js";
import sundryRoutes from "./routes/sundry.routes.js";
import publicRoutes from "./routes/public.routes.js";

import { notFound, errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// Set TRUST_PROXY to a deployment-appropriate value (commonly 1 behind Render).
if (process.env.TRUST_PROXY) {
  const trustProxyValue = process.env.TRUST_PROXY.trim().toLowerCase();
  const trustProxySetting = trustProxyValue === "true"
    ? 1
    : trustProxyValue === "false"
      ? false
      : /^\d+$/.test(trustProxyValue)
        ? Number(trustProxyValue)
        : process.env.TRUST_PROXY;
  app.set("trust proxy", trustProxySetting);
} else if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* =========================================================
   SECURITY
========================================================= */

app.use(helmet());

/* =========================================================
   CORS
========================================================= */

const isProduction = process.env.NODE_ENV === "production";
const localDevelopmentOrigins = isProduction ? [] : ["http://localhost:5173"];
const configuredOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(","),
  "https://v-sync.in",
  "https://www.v-sync.in",
  ...localDevelopmentOrigins,
]
  .map((origin) => String(origin || "").trim().replace(/\/$/, ""))
  .filter(Boolean)
  .filter((origin) => !isProduction || !/^https?:\/\/localhost(?::\d+)?$/i.test(origin));

const allowedOrigins = new Set(configuredOrigins);
const vercelPreviewRegex =
  /^https:\/\/client-git-v-sync-b1-[a-z0-9-]+-srishylamburlas-projects\.vercel\.app$/i;

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // non-browser tools and service-to-service requests
  const normalizedOrigin = String(origin).replace(/\/$/, "");
  return allowedOrigins.has(normalizedOrigin) || vercelPreviewRegex.test(normalizedOrigin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn("Blocked CORS origin:", origin);
        const error = new Error("Not allowed by CORS");
        error.status = 403;
        callback(error);
      }
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  }),
);

/* =========================================================
   BODY / COOKIE MIDDLEWARE
========================================================= */

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || "1mb", parameterLimit: 1000 }));
app.use(cookieParser());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "V-Sync API is running",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/v1/public", publicRoutes);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/organizations", organizationRoutes);

app.use("/api/v1/admin/organizations", adminOrganizationRoutes);

app.use("/api/v1/branches", branchRoutes);

app.use("/api/v1/staff", staffRoutes);

app.use("/api/v1/patients", patientRoutes);

app.use("/api/v1/consultations", consultationRoutes);

app.use("/api/v1/appointments", appointmentRoutes);

app.use("/api/v1/spectacles", spectacleRoutes);

app.use("/api/v1/inventory", inventoryRoutes);

app.use("/api/v1/billing", billingRoutes);

app.use("/api/v1/contact-lenses", contactLensRoutes);

app.use("/api/v1/dispensing", dispensingRoutes);

app.use("/api/v1/recall", recallRoutes);

app.use("/api/v1/communications", communicationsRoutes);

app.use("/api/v1/marketing", marketingRoutes);

app.use("/api/v1/reports", reportRoutes);

app.use("/api/v1/settings", settingsRoutes);

app.use("/api/v1/finance", financeRoutes);

app.use("/api/v1/catalogue", catalogueRoutes);

app.use("/api/v1/contact-lens-catalogue", contactLensCatalogueRoutes);

app.use("/api/v1/sundry-jobs", sundryRoutes);

/* =========================================================
   ERROR HANDLING
========================================================= */

app.use(notFound);
app.use(errorHandler);

/* =========================================================
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const accessSecret = String(process.env.JWT_ACCESS_SECRET || "");
    const refreshSecret = String(process.env.JWT_REFRESH_SECRET || "");
    const isPlaceholderSecret = (value) => /^(replace-with|change-me|your-secret|example-secret)/i.test(value.trim());

    if (accessSecret.length < 32 || (isProduction && isPlaceholderSecret(accessSecret))) {
      throw new Error("JWT_ACCESS_SECRET must be a unique random secret of at least 32 characters");
    }
    if (refreshSecret.length < 32 || (isProduction && isPlaceholderSecret(refreshSecret))) {
      throw new Error("JWT_REFRESH_SECRET must be a unique random secret of at least 32 characters");
    }
    if (accessSecret === refreshSecret) {
      throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values");
    }
    await connectDB();

    app.listen(PORT, () => {
      console.log(`V-Sync API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start V-Sync:", error.message);

    process.exit(1);
  }
};

startServer();