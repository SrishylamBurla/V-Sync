import asyncHandler from "express-async-handler";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import RecallList from "../models/RecallList.js";
import RecallSettings from "../models/RecallSettings.js";

const getBranch = (organizationId) =>
  Branch.findOne({ organizationId, status: "active" }).sort({ createdAt: 1 });

const getSettings = async (organizationId) => {
  let settings = await RecallSettings.findOne({ organizationId });
  if (!settings) settings = await RecallSettings.create({ organizationId });
  return settings;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + Number(months || 0));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
};

const cumulativePeriods = (settings) => [
  Number(settings.firstRecallMonths || 0),
  Number(settings.secondRecallMonths || 0),
  Number(settings.thirdRecallMonths || 0),
  Number(settings.fourthRecallMonths || 0),
  Number(settings.fifthRecallMonths || 0),
];

const nextDueFromStage = (patient, settings) => {
  const periods = cumulativePeriods(settings);
  const stage = Math.max(1, Number(patient.recallStage || 1));
  if (stage >= 5 || !periods[stage]) return null;
  const currentPeriod = periods[stage - 1] || 0;
  const nextPeriod = periods[stage] || 0;
  if (!nextPeriod) return null;
  return addMonths(patient.nextRecallAt || patient.lastConsultationAt || new Date(), Math.max(0, nextPeriod - currentPeriod));
};

const patientQuery = (req) => ({
  organizationId: req.user.organizationId,
  status: "active",
  nextRecallAt: { $ne: null },
});

export const getRecallSummary = asyncHandler(async (req, res) => {
  const lists = await RecallList.find({ organizationId: req.user.organizationId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("fromDate toDate createdAt printedAt entries status")
    .lean();

  const data = lists.map((list) => ({
    ...list,
    selected: list.entries.length,
    noPrinted: list.entries.filter((e) => e.status === "pending").length,
    noHold: list.entries.filter((e) => e.status === "held").length,
    noPhoned: list.entries.filter((e) => e.status === "phoned").length,
    noPrintedTotal: list.entries.filter((e) => e.status === "printed").length,
  }));

  res.json({ success: true, data });
});

export const getRecallSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings(req.user.organizationId);
  res.json({ success: true, data: settings });
});

export const updateRecallSettings = asyncHandler(async (req, res) => {
  const allowed = ["firstRecallMonths", "secondRecallMonths", "thirdRecallMonths", "fourthRecallMonths", "fifthRecallMonths", "defaultLetter"];
  const settings = await getSettings(req.user.organizationId);
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  });
  await settings.save();
  res.json({ success: true, message: "Recall settings updated", data: settings });
});

export const createRecallList = asyncHandler(async (req, res) => {
  const fromDate = new Date(`${req.body.fromDate}T00:00:00`);
  const toDate = new Date(`${req.body.toDate}T23:59:59.999`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
    res.status(400); throw new Error("A valid start and end date are required");
  }

  const branch = await getBranch(req.user.organizationId);
  if (!branch) { res.status(400); throw new Error("An active practice branch is required"); }

  const overlapping = await RecallList.findOne({
    organizationId: req.user.organizationId,
    status: { $in: ["draft", "active"] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate },
  });
  if (overlapping) { res.status(409); throw new Error("An overlapping recall list already exists. Modify or complete the existing list first."); }

  const patients = await Patient.find({ ...patientQuery(req), registeredBranchId: branch._id, nextRecallAt: { $gte: fromDate, $lte: toDate } })
    .sort({ nextRecallAt: 1, lastName: 1, firstName: 1 })
    .lean();

  const entries = patients.map((p) => ({
    patientId: p._id,
    patientNumber: p.patientNumber,
    patientName: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" "),
    phone: p.phone || p.alternatePhone || "",
    email: p.email || "",
    lastVisit: p.lastConsultationAt,
    nextRecall: p.nextRecallAt,
    recallStage: p.recallStage || 1,
    letter: p.nextRecallLetter || "",
  }));

  const list = await RecallList.create({
    organizationId: req.user.organizationId,
    branchId: branch._id,
    fromDate,
    toDate,
    exclusionMonths: Number(req.body.exclusionMonths || 0),
    createdBy: req.user._id,
    entries,
  });

  res.status(201).json({ success: true, message: `Recall list created with ${entries.length} patient(s)`, data: list });
});

export const getCurrentRecallList = asyncHandler(async (req, res) => {
  const list = await RecallList.findOne({ organizationId: req.user.organizationId, status: { $in: ["draft", "active"] } })
    .sort({ createdAt: -1 })
    .populate("entries.patientId", "patientNumber firstName middleName lastName phone email address")
    .lean();
  res.json({ success: true, data: list });
});

export const updateRecallEntry = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!["pending", "printed", "held", "phoned", "completed"].includes(status)) {
    res.status(400); throw new Error("Invalid recall status");
  }
  const list = await RecallList.findOne({ organizationId: req.user.organizationId, _id: req.params.listId });
  if (!list) { res.status(404); throw new Error("Recall list not found"); }
  const entry = list.entries.id(req.params.entryId);
  if (!entry) { res.status(404); throw new Error("Recall entry not found"); }

  entry.status = status;
  if (note !== undefined) entry.note = note;
  if (status === "printed") entry.printedAt = new Date();
  if (status === "phoned" || status === "completed") entry.contactedAt = new Date();

  const patient = await Patient.findOne({ _id: entry.patientId, organizationId: req.user.organizationId });
  if (patient && ["printed", "phoned", "completed"].includes(status)) {
    const settings = await getSettings(req.user.organizationId);
    const nextDue = nextDueFromStage(patient, settings);
    patient.lastRecallAt = new Date();
    if (nextDue) {
      patient.nextRecallAt = nextDue;
      patient.recallStage = Math.min(5, Number(patient.recallStage || 1) + 1);
    } else {
      patient.nextRecallAt = null;
      patient.nextRecallLetter = "";
      patient.recallStage = 5;
    }
    await patient.save();
  }

  await list.save();
  res.json({ success: true, message: "Recall entry updated", data: list });
});

export const updateRecallList = asyncHandler(async (req, res) => {
  const list = await RecallList.findOne({ organizationId: req.user.organizationId, _id: req.params.id });
  if (!list) { res.status(404); throw new Error("Recall list not found"); }
  if (req.body.status) list.status = req.body.status;
  if (req.body.entries && Array.isArray(req.body.entries)) {
    req.body.entries.forEach((incoming) => {
      const entry = list.entries.id(incoming.id || incoming._id);
      if (entry && incoming.note !== undefined) entry.note = incoming.note;
    });
  }
  await list.save();
  res.json({ success: true, message: "Recall list updated", data: list });
});
