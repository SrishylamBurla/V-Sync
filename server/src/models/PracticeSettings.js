import mongoose from "mongoose";

const practiceSettingsSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true, index: true },
  practiceName: { type: String, default: "" },
  appointment: {
    startHour: { type: Number, default: 9 },
    endHour: { type: Number, default: 18 },
    defaultDurationMinutes: { type: Number, default: 30 },
    colourBy: { type: String, enum: ["optometrist", "type"], default: "optometrist" },
  },
  recall: {
    firstMonths: { type: Number, default: 24 },
    secondMonths: { type: Number, default: 36 },
    thirdMonths: { type: Number, default: 48 },
    fourthMonths: { type: Number, default: 60 },
    fifthMonths: { type: Number, default: 0 },
    defaultLetter: { type: String, default: "Recall" },
  },
  consultation: {
    spectaclePrescriptionExpiryMonths: { type: Number, default: 24 },
    contactLensPrescriptionExpiryMonths: { type: Number, default: 12 },
    headings: { type: [String], default: ["History", "Examination", "Tests", "Clinical Notes"] },
    rxHeadings: { type: [String], default: ["Subjective Rx", "Given Rx"] },
  },
  dispensing: {
    defaultDueDays: { type: Number, default: 7 },
    autoNotify: { type: Boolean, default: false },
  },
  billing: {
    currency: { type: String, default: "INR" },
    taxPercent: { type: Number, default: 0 },
    invoicePrefix: { type: String, default: "INV" },
    receiptPrefix: { type: String, default: "REC" },
  },
  lensExtras: [{ name: String, category: { type: String, enum: ["tint", "coating", "hardening", "other"], default: "other" }, active: { type: Boolean, default: true } }],
  communication: {
    emailEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    senderName: { type: String, default: "VividOpt" },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("PracticeSettings", practiceSettingsSchema);
