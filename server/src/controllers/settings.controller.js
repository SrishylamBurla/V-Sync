import PracticeSettings from "../models/PracticeSettings.js";

const defaults = () => ({
  appointment: { startHour: 9, endHour: 18, defaultDurationMinutes: 30, colourBy: "optometrist" },
  recall: { firstMonths: 24, secondMonths: 36, thirdMonths: 48, fourthMonths: 60, fifthMonths: 0, defaultLetter: "Recall" },
  consultation: { spectaclePrescriptionExpiryMonths: 24, contactLensPrescriptionExpiryMonths: 12, headings: ["History", "Examination", "Tests", "Clinical Notes"], rxHeadings: ["Subjective Rx", "Given Rx"] },
  dispensing: { defaultDueDays: 7, autoNotify: false },
  billing: { currency: "INR", taxPercent: 0, invoicePrefix: "INV", receiptPrefix: "REC" },
  lensExtras: [],
  communication: { emailEnabled: false, smsEnabled: false, senderName: "VividOpt" },
});

export const getSettings = async (req, res, next) => {
  try {
    let settings = await PracticeSettings.findOne({ organizationId: req.user.organizationId });
    if (!settings) settings = await PracticeSettings.create({ organizationId: req.user.organizationId, ...defaults(), practiceName: req.user.organizationName || "" });
    res.json({ success: true, data: settings });
  } catch (e) { next(e); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const payload = { ...req.body, organizationId: req.user.organizationId, updatedBy: req.user.id };
    const settings = await PracticeSettings.findOneAndUpdate({ organizationId: req.user.organizationId }, payload, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
    res.json({ success: true, data: settings, message: "Practice settings saved" });
  } catch (e) { next(e); }
};
