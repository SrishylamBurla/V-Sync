import {Router} from "express";
import {protect} from "../middleware/auth.middleware.js";
import {financialSummary,listExpenses,createExpense,listPettyCash,createPettyCash,listBulkAccounts,createBulkAccount,listBulkBillings,createBulkBilling,updateBulkPayment} from "../controllers/finance.controller.js";
const r=Router();r.use(protect);r.get("/summary",financialSummary);r.get("/expenses",listExpenses);r.post("/expenses",createExpense);r.get("/petty-cash",listPettyCash);r.post("/petty-cash",createPettyCash);r.get("/bulk-accounts",listBulkAccounts);r.post("/bulk-accounts",createBulkAccount);r.get("/bulk-billing",listBulkBillings);r.post("/bulk-billing",createBulkBilling);r.post("/bulk-billing/:id/payments",updateBulkPayment);export default r;
