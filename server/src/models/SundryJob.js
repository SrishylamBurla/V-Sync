import mongoose from "mongoose";

const sundryJobSchema = new mongoose.Schema(
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
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },
    jobNumber: { type: String, required: true, unique: true, index: true },
    jobDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    item: {
      code: { type: String, default: "" },
      description: { type: String, default: "" },
      brand: { type: String, default: "" },
      model: { type: String, default: "" },
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: [
        "draft",
        "ordered",
        "not_ready",
        "ready",
        "notified",
        "collected",
        "cancelled",
      ],
      default: "ordered",
      index: true,
    },
    notes: { type: String, default: "" },
    stockDeductedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    jobReadyAt: { type: Date, default: null },
    lastNotifiedAt: { type: Date, default: null },
    notificationCount: { type: Number, default: 0 },
    collectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sundryJobSchema.index({ organizationId: 1, patientId: 1, createdAt: -1 });

export default mongoose.model("SundryJob", sundryJobSchema);
