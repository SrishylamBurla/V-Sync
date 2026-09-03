import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {listInvoices,getInvoice,createInvoice,updateInvoice,addPayment,addRefund,summary} from "../controllers/billing.controller.js";
const r=express.Router();r.use(protect);r.get("/summary",summary);r.get("/",listInvoices);r.get("/:id",getInvoice);r.post("/",createInvoice);r.put("/:id",updateInvoice);r.post("/:id/payments",addPayment);r.post("/:id/refunds",addRefund);export default r;
