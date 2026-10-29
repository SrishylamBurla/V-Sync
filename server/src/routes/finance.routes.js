import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  financialSummary, listExpenses, createExpense, listPettyCash, createPettyCash,
  listBulkAccounts, createBulkAccount, listBulkBillings, createBulkBilling, updateBulkPayment,
} from "../controllers/finance.controller.js";

const router = Router();
router.use(protect);
const canView = requirePermission(PERMISSIONS.FINANCE_VIEW);
const canCreate = requirePermission(PERMISSIONS.FINANCE_CREATE);
const canUpdate = requirePermission(PERMISSIONS.FINANCE_UPDATE);
const canPay = requirePermission(PERMISSIONS.PAYMENT_CREATE);

router.get("/summary", canView, financialSummary);
router.get("/expenses", canView, listExpenses);
router.post("/expenses", canCreate, createExpense);
router.get("/petty-cash", canView, listPettyCash);
router.post("/petty-cash", canCreate, createPettyCash);
router.get("/bulk-accounts", canView, listBulkAccounts);
router.post("/bulk-accounts", canCreate, createBulkAccount);
router.get("/bulk-billing", canView, listBulkBillings);
router.post("/bulk-billing", canCreate, createBulkBilling);
router.post("/bulk-billing/:id/payments", canPay, updateBulkPayment);

export default router;
