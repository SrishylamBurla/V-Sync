import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import branchRoutes from "./routes/branch.routes.js";
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
import { notFound, errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(helmet());

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     credentials: true,
//   }),
// );

const allowedOrigins = [
  "https://v-sync.in",
  "https://www.v-sync.in",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "OptiCore API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/branches", branchRoutes);
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`OptiCore API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start OptiCore:", error.message);
    process.exit(1);
  }
};

startServer();
