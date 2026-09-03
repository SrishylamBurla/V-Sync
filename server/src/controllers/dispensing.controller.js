import asyncHandler from "express-async-handler";
import Spectacle from "../models/Spectacle.js";
import ContactLens from "../models/ContactLens.js";

const stages = ["ordered", "not_ready", "ready", "notified", "collected", "cancelled"];
const nextStage = { draft: "ordered", ordered: "not_ready", not_ready: "ready", ready: "notified", notified: "collected" };

const base = (req) => ({ organizationId: req.user.organizationId });

const populate = (q) => q.populate("patientId", "patientNumber firstName middleName lastName phone dob");

export const listDispensing = asyncHandler(async (req, res) => {
  const q = base(req);
  if (req.query.status) q.status = req.query.status;
  const search = String(req.query.search || "").trim();
  const [spectacles, contactLenses] = await Promise.all([
    populate(Spectacle.find(q).sort({ updatedAt: -1 }).limit(500)).lean(),
    populate(ContactLens.find(q).sort({ updatedAt: -1 }).limit(500)).lean(),
  ]);
  let rows = [
    ...spectacles.map(x => ({ ...x, source: "spectacle", recordNumber: x.jobNumber, itemType: "Spectacle", amount: Math.max(0, Number(x.frame?.price || 0) + Number(x.lens?.price || 0) + (x.extras || []).reduce((a,e) => a + Number(e.price || 0), 0) - Number(x.discount || 0)) })),
    ...contactLenses.map(x => ({ ...x, source: "contact_lens", recordNumber: x.orderNumber, itemType: "Contact Lens", amount: Number(x.total || 0) }))
  ];
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(x => [x.recordNumber, x.patientId?.patientNumber, x.patientId?.firstName, x.patientId?.lastName, x.patientId?.phone, x.brand, x.model].filter(Boolean).join(" ").toLowerCase().includes(s));
  }
  rows.sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json({ success: true, data: rows });
});

export const getDispensing = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, organizationId: req.user.organizationId };
  const [spectacle, contactLens] = await Promise.all([
    populate(Spectacle.findOne(filter)).lean(),
    populate(ContactLens.findOne(filter)).lean()
  ]);
  if (spectacle) return res.json({ success: true, data: { ...spectacle, source: "spectacle", recordNumber: spectacle.jobNumber, itemType: "Spectacle" } });
  if (contactLens) return res.json({ success: true, data: { ...contactLens, source: "contact_lens", recordNumber: contactLens.orderNumber, itemType: "Contact Lens" } });
  res.status(404); throw new Error("Dispensing job not found");
});

export const updateDispensing = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!stages.includes(status)) { res.status(400); throw new Error("Invalid dispensing status"); }
  const filter = { _id: req.params.id, organizationId: req.user.organizationId };
  let item = await Spectacle.findOne(filter);
  let source = "spectacle";
  if (!item) { item = await ContactLens.findOne(filter); source = "contact_lens"; }
  if (!item) { res.status(404); throw new Error("Dispensing job not found"); }
  const current = item.status;
  const valid = current === status || nextStage[current] === status || (status === "cancelled" && current !== "collected");
  if (!valid) { res.status(400); throw new Error(`Cannot move ${current} to ${status}`); }
  item.status = status;
  if (status === "ready") item.jobReadyAt = new Date();
  if (status === "notified") { item.lastNotifiedAt = new Date(); item.notificationCount = Number(item.notificationCount || 0) + 1; }
  if (status === "collected") item.collectedAt = new Date();
  await item.save();
  res.json({ success: true, message: "Dispensing status updated", data: { ...item.toObject(), source, recordNumber: source === "spectacle" ? item.jobNumber : item.orderNumber, itemType: source === "spectacle" ? "Spectacle" : "Contact Lens" } });
});
