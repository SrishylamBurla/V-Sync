import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";

const branch = async (org) =>
  Branch.findOne({
    organizationId: org,
    status: "active",
  }).sort({ createdAt: 1 });

const number = (prefix) =>
  `${prefix}-${Date.now().toString().slice(-9)}`;

const actorId = (req) => req.user?._id || req.user?.id || null;

const recalc = (invoice) => {
  const lines = (invoice.items || []).reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity || 0) *
        Number(item.unitPrice || 0) -
        Number(item.discount || 0)),
    0,
  );

  const subtotal = Math.max(0, lines);
  invoice.subtotal = subtotal;
  invoice.total = Math.max(
    0,
    subtotal -
      Number(invoice.discount || 0) +
      Number(invoice.tax || 0),
  );
  invoice.balance = Math.max(
    0,
    invoice.total - Number(invoice.paidAmount || 0),
  );

  invoice.status =
    invoice.balance <= 0
      ? "paid"
      : Number(invoice.paidAmount || 0) > 0
        ? "partially_paid"
        : invoice.status === "draft"
          ? "draft"
          : "issued";

  return invoice;
};

export const listInvoices = asyncHandler(async (req, res) => {
  const query = {
    organizationId: req.user.organizationId,
  };

  if (req.query.status) query.status = req.query.status;
  if (req.query.patientId) query.patientId = req.query.patientId;

  const list = await Invoice.find(query)
    .populate(
      "patientId",
      "patientNumber firstName middleName lastName phone",
    )
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .populate("discountUpdatedBy", "firstName lastName")
    .sort({ invoiceDate: -1, createdAt: -1 })
    .limit(250)
    .lean();

  res.json({
    success: true,
    data: list,
  });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  })
    .populate(
      "patientId",
      "patientNumber firstName middleName lastName phone email address",
    )
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .populate("discountUpdatedBy", "firstName lastName");

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const payments = await Payment.find({
    invoiceId: invoice._id,
    organizationId: req.user.organizationId,
  })
    .sort({ paymentDate: -1 })
    .populate("createdBy", "firstName lastName")
    .lean();

  const refunds = await Refund.find({
    invoiceId: invoice._id,
    organizationId: req.user.organizationId,
  })
    .sort({ refundDate: -1 })
    .populate("createdBy", "firstName lastName")
    .lean();

  res.json({
    success: true,
    data: {
      invoice,
      payments,
      refunds,
    },
  });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.body.patientId,
    organizationId: req.user.organizationId,
    status: "active",
  });

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const activeBranch = await branch(req.user.organizationId);

  if (!activeBranch) {
    res.status(400);
    throw new Error("An active practice branch is required");
  }

  const invoice = new Invoice({
    organizationId: req.user.organizationId,
    branchId: activeBranch._id,
    patientId: patient._id,
    invoiceNumber: number("INV"),
    invoiceDate: req.body.invoiceDate || new Date(),
    dueDate: req.body.dueDate,
    items: req.body.items || [],
    discount: Number(req.body.discount || 0),
    tax: Number(req.body.tax || 0),
    notes: req.body.notes,
    createdBy: actorId(req),
    updatedBy: actorId(req),
    discountUpdatedBy:
      Number(req.body.discount || 0) !== 0 ? actorId(req) : undefined,
    discountUpdatedAt:
      Number(req.body.discount || 0) !== 0 ? new Date() : undefined,
    status: req.body.status || "issued",
  });

  recalc(invoice);
  await invoice.save();

  await invoice.populate("createdBy", "firstName lastName");
  await invoice.populate("updatedBy", "firstName lastName");
  await invoice.populate("discountUpdatedBy", "firstName lastName");

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: invoice,
  });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  if (
    ["paid", "void", "refunded"].includes(invoice.status) &&
    req.body.items !== undefined
  ) {
    res.status(400);
    throw new Error(
      "Finalized invoices cannot have their items changed",
    );
  }

  const previousInvoiceDiscount = Number(invoice.discount || 0);
  const previousItemDiscounts = new Map(
    (invoice.items || []).map((item) => [
      String(item._id),
      Number(item.discount || 0),
    ]),
  );

  for (const key of [
    "items",
    "invoiceDate",
    "discount",
    "tax",
    "dueDate",
    "notes",
  ]) {
    if (req.body[key] !== undefined) {
      invoice[key] = req.body[key];
    }
  }

  const invoiceDiscountChanged =
    req.body.discount !== undefined &&
    Number(req.body.discount || 0) !== previousInvoiceDiscount;

  const itemDiscountChanged =
    req.body.items !== undefined &&
    req.body.items.some((item) => {
      if (!item?._id) return Number(item?.discount || 0) !== 0;
      return (
        Number(item?.discount || 0) !==
        Number(previousItemDiscounts.get(String(item._id)) || 0)
      );
    });

  invoice.updatedBy = actorId(req);
  invoice.updatedAt = new Date();

  if (invoiceDiscountChanged || itemDiscountChanged) {
    invoice.discountUpdatedBy = actorId(req);
    invoice.discountUpdatedAt = new Date();
  }

  recalc(invoice);
  await invoice.save();

  await invoice.populate("createdBy", "firstName lastName");
  await invoice.populate("updatedBy", "firstName lastName");
  await invoice.populate("discountUpdatedBy", "firstName lastName");

  res.json({
    success: true,
    message: "Invoice updated",
    data: invoice,
  });
});

export const addPayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const amount = Number(req.body.amount);

  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (amount > invoice.balance + 0.001) {
    throw new Error("Payment exceeds outstanding balance");
  }

  const payment = await Payment.create({
    organizationId: req.user.organizationId,
    branchId: invoice.branchId,
    patientId: invoice.patientId,
    invoiceId: invoice._id,
    receiptNumber: number("RCT"),
    paymentDate: req.body.paymentDate || new Date(),
    method: req.body.method || "cash",
    amount,
    reference: req.body.reference,
    notes: req.body.notes,
    createdBy: req.user._id,
  });

  invoice.paidAmount = Number(invoice.paidAmount || 0) + amount;
  invoice.updatedBy = actorId(req);
  invoice.updatedAt = new Date();
  recalc(invoice);
  await invoice.save();

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: {
      payment,
      invoice,
    },
  });
});

export const addRefund = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const amount = Number(req.body.amount);

  if (!amount || amount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }

  const already =
    (
      await Refund.aggregate([
        {
          $match: {
            invoiceId: invoice._id,
            organizationId: req.user.organizationId,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
    )[0]?.total || 0;

  if (
    amount >
    Number(invoice.paidAmount || 0) - already + 0.001
  ) {
    throw new Error("Refund exceeds refundable amount");
  }

  const refund = await Refund.create({
    organizationId: req.user.organizationId,
    branchId: invoice.branchId,
    patientId: invoice.patientId,
    invoiceId: invoice._id,
    refundNumber: number("REF"),
    refundDate: req.body.refundDate || new Date(),
    amount,
    method: req.body.method || "cash",
    reason: req.body.reason || "Customer refund",
    createdBy: req.user._id,
  });

  if (
    already + amount >=
    Number(invoice.paidAmount || 0)
  ) {
    invoice.status = "refunded";
  }

  invoice.updatedBy = actorId(req);
  invoice.updatedAt = new Date();
  await invoice.save();

  res.status(201).json({
    success: true,
    message: "Refund recorded successfully",
    data: {
      refund,
      invoice,
    },
  });
});

export const summary = asyncHandler(async (req, res) => {
  const base = {
    organizationId: req.user.organizationId,
  };

  const [issued, paid, outstanding] = await Promise.all([
    Invoice.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          total: { $sum: "$paidAmount" },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          total: { $sum: "$balance" },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      invoiced: issued[0]?.total || 0,
      paid: paid[0]?.total || 0,
      outstanding: outstanding[0]?.total || 0,
    },
  });
});
