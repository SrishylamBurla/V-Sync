import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    line1: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    line2: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    pincode: {
      type: String,
      trim: true,
      maxlength: 10,
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },
  },
  { _id: false },
);

const patientDocumentSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    storedName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, trim: true, maxlength: 150 },
    size: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: [
        "referral",
        "prescription",
        "clinical_report",
        "identity",
        "clinical_image",
        "insurance",
        "other",
      ],
      default: "other",
    },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    relationship: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
  },
  { _id: false },
);

const patientSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    registeredBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    patientNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    middleName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    address: {
      type: addressSchema,
      default: {},
    },

    emergencyContact: {
      type: emergencyContactSchema,
      default: {},
    },

    occupation: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    preferredLanguage: {
      type: String,
      trim: true,
      default: "English",
    },

    source: {
      type: String,
      enum: [
        "walk_in",
        "appointment",
        "website",
        "referral",
        "campaign",
        "other",
      ],
      default: "walk_in",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    documents: {
      type: [patientDocumentSchema],
      default: [],
    },

    lastConsultationAt: {
      type: Date,
      default: null,
      index: true,
    },

    lastOptometristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    nextRecallAt: {
      type: Date,
      default: null,
      index: true,
    },

    nextRecallLetter: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    recallStage: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
      index: true,
    },

    lastRecallAt: {
      type: Date,
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

patientSchema.index(
  {
    organizationId: 1,
    patientNumber: 1,
  },
  {
    unique: true,
  },
);

patientSchema.index({
  organizationId: 1,
  phone: 1,
});

patientSchema.index({
  organizationId: 1,
  email: 1,
});

patientSchema.index({
  organizationId: 1,
  lastName: 1,
  firstName: 1,
});

export default mongoose.model("Patient", patientSchema);
