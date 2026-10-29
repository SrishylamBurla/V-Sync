import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { listInvoices, getInvoice, createInvoice, updateInvoice, addPayment, addRefund, summary } from "../controllers/billing.controller.js";

const router = express.Router();
router.use(protect);
const canView = requirePermission(PERMISSIONS.BILLING_VIEW);
const canCreate = requirePermission(PERMISSIONS.BILLING_CREATE);
const canUpdate = requirePermission(PERMISSIONS.BILLING_UPDATE);
const canPay = requirePermission(PERMISSIONS.PAYMENT_CREATE);
const canRefund = requirePermission(PERMISSIONS.REFUND_CREATE);

router.get("/summary", canView, summary);
router.get("/", canView, listInvoices);
router.get("/:id", canView, getInvoice);
router.post("/", canCreate, createInvoice);
router.put("/:id", canUpdate, updateInvoice);
router.post("/:id/payments", canPay, addPayment);
router.post("/:id/refunds", canRefund, addRefund);

export default router;
