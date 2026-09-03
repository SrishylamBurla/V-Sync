import mongoose from "mongoose";

const eyePrescriptionSchema = new mongoose.Schema(
  {
    sphere: { type: String, trim: true, default: "" },
    cylinder: { type: String, trim: true, default: "" },
    axis: { type: String, trim: true, default: "" },
    va: { type: String, trim: true, default: "" },
    add: { type: String, trim: true, default: "" },
    inter: { type: String, trim: true, default: "" },
    prism: { type: String, trim: true, default: "" },
    base: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const prescriptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["previous", "subjective", "given"],
      required: true,
    },
    right: { type: eyePrescriptionSchema, default: () => ({}) },
    left: { type: eyePrescriptionSchema, default: () => ({}) },
    note: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { _id: false },
);

const testSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 150 },
    result: { type: String, trim: true, maxlength: 4000 },
  },
  { _id: false },
);

const consultationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    optometristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    consultationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    consultationType: {
      type: String,
      enum: ["spectacle", "short_spectacle", "contact_lens"],
      default: "spectacle",
    },

    medication: { type: String, trim: true, maxlength: 4000, default: "" },
    allergy: { type: String, trim: true, maxlength: 4000, default: "" },
    pupils: { type: String, trim: true, maxlength: 4000, default: "" },
    symptoms: { type: String, trim: true, maxlength: 4000, default: "" },
    ophthalmoscopy: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
    biomicroscopy: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
    visualField: { type: String, trim: true, maxlength: 4000, default: "" },
    colourVision: { type: String, trim: true, maxlength: 4000, default: "" },
    otherTests: { type: [testSchema], default: [] },

    previousRx: { type: prescriptionSchema, default: null },
    subjectiveRx: { type: prescriptionSchema, default: null },
    givenRx: { type: prescriptionSchema, default: null },

    pd: {
      right: { type: String, trim: true, default: "" },
      left: { type: String, trim: true, default: "" },
      total: { type: String, trim: true, default: "" },
    },

    recallDue: { type: Date, default: null },
    recallLetter: { type: String, trim: true, maxlength: 50, default: "" },
    notes: { type: String, trim: true, maxlength: 5000, default: "" },

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
  { timestamps: true },
);

consultationSchema.index({ patientId: 1, consultationDate: -1 });
consultationSchema.index({ organizationId: 1, branchId: 1, consultationDate: -1 });

export default mongoose.model("Consultation", consultationSchema);
