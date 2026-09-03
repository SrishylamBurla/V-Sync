import mongoose from "mongoose";

const appointmentHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: "" },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const appointmentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    clinicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    appointmentDate: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 30, min: 5, max: 480 },
    type: { type: String, trim: true, default: "Eye Examination" },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["booked", "confirmed", "here", "examining", "complete", "cancelled", "no_show"], default: "booked", index: true },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    history: { type: [appointmentHistorySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

appointmentSchema.index({ organizationId: 1, appointmentDate: 1, status: 1 });

export default mongoose.model("Appointment", appointmentSchema);
