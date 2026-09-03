import mongoose from "mongoose";

const recallSettingsSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
    firstRecallMonths: { type: Number, min: 0, default: 24 },
    secondRecallMonths: { type: Number, min: 0, default: 36 },
    thirdRecallMonths: { type: Number, min: 0, default: 48 },
    fourthRecallMonths: { type: Number, min: 0, default: 60 },
    fifthRecallMonths: { type: Number, min: 0, default: 72 },
    defaultLetter: { type: String, default: "Standard Recall" },
  },
  { timestamps: true },
);

export default mongoose.model("RecallSettings", recallSettingsSchema);
