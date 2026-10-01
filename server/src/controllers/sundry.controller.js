import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import SundryJob from "../models/SundryJob.js";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import InventoryItem from "../models/InventoryItem.js";
import InventoryTransaction from "../models/InventoryTransaction.js";

const statuses = [
  "draft",
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];
const nextStage = {
  draft: "ordered",
  ordered: "not_ready",
  not_ready: "ready",
  ready: "notified",
  notified: "collected",
};
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
};
const number = async () => {
  let value;
  do {
    value = `SD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 90 + 10)}`;
  } while (await SundryJob.exists({ jobNumber: value }));
  return value;
};

const patientAccess = async (req, patientId) => {
  if (!mongoose.isValidObjectId(patientId)) return null;
  const patient = await Patient.findOne({
    _id: patientId,
    organizationId: req.user.organizationId,
    status: "active",
  });
  if (!patient) return null;
  const branch = await Branch.findOne({
    _id: patient.registeredBranchId,
    organizationId: req.user.organizationId,
    status: "active",
  });
  if (!branch) return null;
  const assigned = Array.isArray(req.user?.branchIds)
    ? req.user.branchIds.map(String)
    : [];
  const role = req.user?.role;
  if (
    role !== "super_admin" &&
    role !== "organization_admin" &&
    !assigned.includes(String(branch._id)) &&
    String(req.user?.defaultBranchId || "") !== String(branch._id)
  )
    return null;
  return { patient, branch };
};

const populate = (q) =>
  q
    .populate("patientId", "patientNumber firstName middleName lastName phone")
    .populate(
      "inventoryItemId",
      "code description brand model sellingPrice stock category",
    )
    .populate("createdBy", "firstName lastName role");

export const listSundryJobs = asyncHandler(async (req, res) => {
  const q = { organizationId: req.user.organizationId };
  if (req.query.patientId) {
    if (!mongoose.isValidObjectId(req.query.patientId)) {
      res.status(400);
      throw new Error("Invalid patient ID");
    }
    q.patientId = req.query.patientId;
  }
  if (req.query.status) q.status = req.query.status;
  const search = clean(req.query.search);
  let rows = await populate(
    SundryJob.find(q).sort({ updatedAt: -1 }).limit(500),
  ).lean();
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((x) =>
      [
        x.jobNumber,
        x.item?.code,
        x.item?.description,
        x.item?.brand,
        x.item?.model,
        x.patientId?.patientNumber,
        x.patientId?.firstName,
        x.patientId?.lastName,
        x.patientId?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }
  res.json({ success: true, data: rows });
});

export const getSundryJob = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid sundry job ID");
  }
  const row = await populate(
    SundryJob.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    }),
  ).lean();
  if (!row) {
    res.status(404);
    throw new Error("Sundry job not found");
  }
  const access = await patientAccess(req, row.patientId?._id || row.patientId);
  if (!access) {
    res.status(403);
    throw new Error("You do not have access to this patient");
  }
  res.json({ success: true, data: row });
});

export const createSundryJob = asyncHandler(async (req, res) => {
  const { patientId, inventoryItemId } = req.body || {};
  const access = await patientAccess(req, patientId);
  if (!access) {
    res.status(403);
    throw new Error("You do not have access to this patient");
  }
  if (!mongoose.isValidObjectId(inventoryItemId)) {
    res.status(400);
    throw new Error("A valid sundry item is required");
  }
  const item = await InventoryItem.findOne({
    _id: inventoryItemId,
    organizationId: req.user.organizationId,
    status: "active",
    category: "sundry",
  });
  if (!item) {
    res.status(404);
    throw new Error("Sundry inventory item not found");
  }
  const quantity = Math.max(1, Math.floor(Number(req.body.quantity || 1)));
  const unitPrice = money(req.body.unitPrice ?? item.sellingPrice);
  const discount = money(req.body.discount);
  const total = money(quantity * unitPrice - discount);
  const job = await SundryJob.create({
    organizationId: req.user.organizationId,
    branchId: access.branch._id,
    patientId: access.patient._id,
    inventoryItemId: item._id,
    jobNumber: await number(),
    jobDate: req.body.jobDate || new Date(),
    dueDate: req.body.dueDate || null,
    item: {
      code: item.code,
      description: item.description,
      brand: item.brand,
      model: item.model,
    },
    quantity,
    unitPrice,
    discount,
    total,
    status: "ordered",
    notes: clean(req.body.notes),
    createdBy: req.user._id,
  });
  const populated = await populate(SundryJob.findById(job._id));
  res
    .status(201)
    .json({
      success: true,
      message: "Sundry job created successfully",
      data: await populated.lean(),
    });
});

export const updateSundryStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid sundry job ID");
  }
  const job = await SundryJob.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  });
  if (!job) {
    res.status(404);
    throw new Error("Sundry job not found");
  }
  const access = await patientAccess(req, job.patientId);
  if (!access) {
    res.status(403);
    throw new Error("You do not have access to this patient");
  }
  const status = req.body.status;
  if (!statuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid sundry status");
  }
  const current = job.status;
  const valid =
    current === status ||
    nextStage[current] === status ||
    (status === "cancelled" && current !== "collected");
  if (!valid) {
    res.status(400);
    throw new Error(`Cannot move ${current} to ${status}`);
  }
  if (status === "collected" && !job.stockDeductedAt) {
    const item = await InventoryItem.findOne({
      _id: job.inventoryItemId,
      organizationId: req.user.organizationId,
      status: "active",
      category: "sundry",
    });
    if (!item) {
      res.status(404);
      throw new Error("Sundry inventory item not found");
    }
    if (Number(item.stock) < Number(job.quantity)) {
      res.status(400);
      throw new Error(
        `Insufficient stock for ${item.code || item.description || "this sundry"}`,
      );
    }
    const before = Number(item.stock);
    item.stock = before - Number(job.quantity);
    item.updatedBy = req.user._id;
    await item.save();
    await InventoryTransaction.create({
      organizationId: req.user.organizationId,
      branchId: item.branchId,
      itemId: item._id,
      type: "sale",
      quantity: -Number(job.quantity),
      beforeStock: before,
      afterStock: item.stock,
      reason: `Sundry job ${job.jobNumber}`,
      reference: job._id.toString(),
      createdBy: req.user._id,
    });
    job.stockDeductedAt = new Date();
  }
  job.status = status;
  job.updatedBy = req.user._id;
  if (status === "ready") job.jobReadyAt = new Date();
  if (status === "notified") {
    job.lastNotifiedAt = new Date();
    job.notificationCount = Number(job.notificationCount || 0) + 1;
  }
  if (status === "collected") job.collectedAt = new Date();
  await job.save();
  const populated = await populate(SundryJob.findById(job._id));
  res.json({
    success: true,
    message: "Sundry status updated",
    data: await populated.lean(),
  });
});

export const updateSundryJob = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid sundry job ID");
  }
  const job = await SundryJob.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  });
  if (!job) {
    res.status(404);
    throw new Error("Sundry job not found");
  }
  const access = await patientAccess(req, job.patientId);
  if (!access) {
    res.status(403);
    throw new Error("You do not have access to this patient");
  }
  if (["collected", "cancelled"].includes(job.status)) {
    res.status(400);
    throw new Error("This sundry job can no longer be edited");
  }
  const quantity = Math.max(
    1,
    Math.floor(Number(req.body.quantity ?? job.quantity)),
  );
  const unitPrice = money(req.body.unitPrice ?? job.unitPrice);
  const discount = money(req.body.discount ?? job.discount);
  job.quantity = quantity;
  job.unitPrice = unitPrice;
  job.discount = discount;
  job.total = money(quantity * unitPrice - discount);
  if (req.body.dueDate !== undefined) job.dueDate = req.body.dueDate || null;
  if (req.body.notes !== undefined) job.notes = clean(req.body.notes);
  job.updatedBy = req.user._id;
  await job.save();
  const populated = await populate(SundryJob.findById(job._id));
  res.json({
    success: true,
    message: "Sundry job updated",
    data: await populated.lean(),
  });
});
