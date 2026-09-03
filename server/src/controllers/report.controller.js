import asyncHandler from "express-async-handler";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Consultation from "../models/Consultation.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import InventoryItem from "../models/InventoryItem.js";
import Spectacle from "../models/Spectacle.js";
import ContactLens from "../models/ContactLens.js";
import RecallList from "../models/RecallList.js";

const range = (req) => {
  const end = req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : new Date();
  const start = req.query.from ? new Date(`${req.query.from}T00:00:00`) : new Date(end.getFullYear(), end.getMonth(), 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    const err = new Error("A valid report date range is required"); err.status = 400; throw err;
  }
  return { start, end };
};
const base = (req, extra={}) => ({ organizationId: req.user.organizationId, ...extra });
const dateRange = (field, start, end) => ({ [field]: { $gte: start, $lte: end } });
const money = n => Math.round((Number(n)||0)*100)/100;

export const getOverview = asyncHandler(async (req,res)=>{
  const {start,end}=range(req);
  const org=req.user.organizationId;
  const [patients,appointments,consultations,invoices,payments,inventory,spectacles,contactLenses,recallDue]=await Promise.all([
    Patient.countDocuments(base(req,{status:"active"})),
    Appointment.countDocuments(base(req,dateRange("appointmentDate",start,end))),
    Consultation.countDocuments(base(req,dateRange("consultationDate",start,end))),
    Invoice.find(base(req,dateRange("invoiceDate",start,end))).select("status total paidAmount balance items").lean(),
    Payment.find(base(req,dateRange("paymentDate",start,end))).select("amount method").lean(),
    InventoryItem.find(base(req,{status:"active"})).select("category stock reorderLevel costPrice sellingPrice").lean(),
    Spectacle.countDocuments(base(req,dateRange("createdAt",start,end))),
    ContactLens.countDocuments(base(req,dateRange("createdAt",start,end))),
    Patient.countDocuments(base(req,{status:"active",nextRecallAt:{$gte:start,$lte:end}})),
  ]);
  const appointmentStatuses=await Appointment.aggregate([
    {$match:base(req,dateRange("appointmentDate",start,end))},{$group:{_id:"$status",count:{$sum:1}}},{$sort:{count:-1}}
  ]);
  const revenueByCategory=await Invoice.aggregate([
    {$match:base(req,dateRange("invoiceDate",start,end))},{$unwind:"$items"},
    {$group:{_id:"$items.category",value:{$sum:{$multiply:["$items.quantity",{$subtract:["$items.unitPrice","$items.discount"]}]}}}},{$sort:{value:-1}}
  ]);
  const paymentByMethod=await Payment.aggregate([
    {$match:base(req,dateRange("paymentDate",start,end))},{$group:{_id:"$method",value:{$sum:"$amount"}}},{$sort:{value:-1}}
  ]);
  const daily=await Invoice.aggregate([
    {$match:base(req,dateRange("invoiceDate",start,end))},{$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$invoiceDate"}},value:{$sum:"$total"},paid:{$sum:"$paidAmount"}}},{$sort:{_id:1}}
  ]);
  const lowStock=inventory.filter(i=>Number(i.stock||0)<=Number(i.reorderLevel||0)).length;
  const invoiceTotal=invoices.reduce((s,i)=>s+Number(i.total||0),0);
  const outstanding=invoices.reduce((s,i)=>s+Number(i.balance||0),0);
  const paid=payments.reduce((s,p)=>s+Number(p.amount||0),0);
  res.json({success:true,data:{range:{from:start,to:end},counts:{patients,appointments,consultations,spectacles,contactLenses,recallDue,lowStock},financial:{invoiceTotal:money(invoiceTotal),paid:money(paid),outstanding:money(outstanding)},appointmentStatuses,revenueByCategory:revenueByCategory.map(x=>({...x,value:money(x.value)})),paymentByMethod:paymentByMethod.map(x=>({...x,value:money(x.value)})),daily:daily.map(x=>({...x,value:money(x.value),paid:money(x.paid)}))}});
});

export const getOperational = asyncHandler(async(req,res)=>{
  const {start,end}=range(req);
  const [appointments,consultations,recalls,spectacles,contactLenses]=await Promise.all([
    Appointment.aggregate([{$match:base(req,dateRange("appointmentDate",start,end))},{$group:{_id:"$type",count:{$sum:1}}},{$sort:{count:-1}}]),
    Consultation.aggregate([{$match:base(req,dateRange("consultationDate",start,end))},{$group:{_id:"$consultationType",count:{$sum:1}}},{$sort:{count:-1}}]),
    RecallList.aggregate([{$match:base(req,dateRange("createdAt",start,end))},{$group:{_id:null,lists:{$sum:1},selected:{$sum:{$size:"$entries"}}}}]),
    Spectacle.aggregate([{$match:base(req,dateRange("createdAt",start,end))},{$group:{_id:"$status",count:{$sum:1}}},{$sort:{count:-1}}]),
    ContactLens.aggregate([{$match:base(req,dateRange("createdAt",start,end))},{$group:{_id:"$status",count:{$sum:1}}},{$sort:{count:-1}}]),
  ]);
  res.json({success:true,data:{appointments,consultations,recalls:recalls[0]||{lists:0,selected:0},spectacles,contactLenses}});
});

export const getInventory = asyncHandler(async(req,res)=>{
  const items=await InventoryItem.find(base(req,{status:"active"})).select("code barcode name description category brand model supplier stock reorderLevel costPrice sellingPrice").lean();
  const byCategory={};
  items.forEach(i=>{const c=i.category||"other";byCategory[c]=(byCategory[c]||0)+1;});
  const low=items.filter(i=>Number(i.stock||0)<=Number(i.reorderLevel||0));
  const value=items.reduce((s,i)=>s+Number(i.stock||0)*Number(i.costPrice||0),0);
  const retail=items.reduce((s,i)=>s+Number(i.stock||0)*Number(i.sellingPrice||0),0);
  res.json({success:true,data:{total:items.length,byCategory,lowStock:low.map(i=>({id:i._id,code:i.code,barcode:i.barcode,name:i.name||i.description||i.model||i.brand||"Item",category:i.category,stock:i.stock,reorderLevel:i.reorderLevel})),costValue:money(value),retailValue:money(retail)}});
});
