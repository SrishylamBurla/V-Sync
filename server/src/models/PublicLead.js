import mongoose from "mongoose";

const publicLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    organization: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180, index: true },
    phone: { type: String, required: true, trim: true, maxlength: 24 },
    role: { type: String, trim: true, maxlength: 80, default: "Other" },
    plan: { type: String, trim: true, enum: ["essential_clinic", "practice_plus", "hospital_franchise", "not_sure"], default: "not_sure" },
    branches: { type: Number, min: 1, max: 1000, default: 1 },
    message: { type: String, trim: true, maxlength: 1500, default: "" },
    status: { type: String, enum: ["new", "contacted", "qualified", "closed"], default: "new", index: true },
    statusNote: { type: String, trim: true, maxlength: 500, default: "" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

publicLeadSchema.index({ createdAt: -1 });
export default mongoose.model("PublicLead", publicLeadSchema);
