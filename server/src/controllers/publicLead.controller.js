import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import PublicLead from "../models/PublicLead.js";

const allowedPlans = new Set(["essential_clinic", "practice_plus", "hospital_franchise", "not_sure"]);

export const createPublicLead = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const organization = String(req.body?.organization || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();
  const role = String(req.body?.role || "Other").trim().slice(0, 80);
  const rawPlan = String(req.body?.plan || "not_sure").trim();
  const plan = allowedPlans.has(rawPlan) ? rawPlan : "not_sure";
  const message = String(req.body?.message || "").trim();
  const branches = Number(req.body?.branches || 1);

  if (!name || !organization || !email || !phone) {
    return res.status(400).json({ success: false, message: "Contact person, organization, email and phone are required." });
  }
  if (name.length > 100 || organization.length > 160 || email.length > 180 || phone.length > 24 || message.length > 1500) {
    return res.status(400).json({ success: false, message: "One or more fields exceed the allowed length." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }
  if (!/^[+0-9() .-]{8,24}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Enter a valid phone number." });
  }
  if (!Number.isInteger(branches) || branches < 1 || branches > 1000) {
    return res.status(400).json({ success: false, message: "Branch count must be between 1 and 1000." });
  }

  const lead = await PublicLead.create({ name, organization, email, phone, role, plan, branches, message });
  return res.status(201).json({ success: true, message: "Enquiry submitted successfully.", data: { id: lead._id } });
});

export const listPublicLeads = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 25));
  const status = String(req.query.status || "");
  const search = String(req.query.q || "").trim().slice(0, 120);
  const baseFilter = {};

  if (search) {
    // Escape regular-expression syntax so search text cannot alter the query pattern.
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(escapedSearch, "i");
    baseFilter.$or = [
      { name: expression },
      { organization: expression },
      { email: expression },
      { phone: expression },
      { role: expression },
    ];
  }

  const filter = { ...baseFilter };
  if (["new", "contacted", "qualified", "closed"].includes(status)) filter.status = status;

  const [data, total, newCount, contactedCount, qualifiedCount, closedCount] = await Promise.all([
    PublicLead.find(filter)
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PublicLead.countDocuments(filter),
    PublicLead.countDocuments({ ...baseFilter, status: "new" }),
    PublicLead.countDocuments({ ...baseFilter, status: "contacted" }),
    PublicLead.countDocuments({ ...baseFilter, status: "qualified" }),
    PublicLead.countDocuments({ ...baseFilter, status: "closed" }),
  ]);

  res.json({
    success: true,
    data,
    summary: {
      total: newCount + contactedCount + qualifiedCount + closedCount,
      new: newCount,
      contacted: contactedCount,
      qualified: qualifiedCount,
      closed: closedCount,
    },
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const updatePublicLeadStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid enquiry ID." });
  }
  const { status, statusNote } = req.body || {};
  if (!["new", "contacted", "qualified", "closed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Choose a valid enquiry status." });
  }
  const lead = await PublicLead.findByIdAndUpdate(
    req.params.id,
    { $set: { status, statusNote: String(statusNote || "").trim().slice(0, 500) } },
    { new: true, runValidators: true },
  ).lean();
  if (!lead) return res.status(404).json({ success: false, message: "Enquiry not found." });
  res.json({ success: true, data: lead });
});
