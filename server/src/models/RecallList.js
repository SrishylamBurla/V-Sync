import mongoose from "mongoose";

const recallEntrySchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    patientNumber: { type: String, default: "" },
    patientName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    lastVisit: { type: Date, default: null },
    nextRecall: { type: Date, required: true },
    recallStage: { type: Number, min: 1, max: 5, required: true },
    letter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "printed", "held", "phoned", "completed"],
      default: "pending",
    },
    printedAt: { type: Date, default: null },
    contactedAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { _id: true },
);

const recallListSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    exclusionMonths: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "active", "completed"], default: "active", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAtDate: { type: Date, default: Date.now },
    printedAt: { type: Date, default: null },
    entries: { type: [recallEntrySchema], default: [] },
  },
  { timestamps: true },
);

recallListSchema.index({ organizationId: 1, fromDate: 1, toDate: 1 });

export default mongoose.model("RecallList", recallListSchema);
