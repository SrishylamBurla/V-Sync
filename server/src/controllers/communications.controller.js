import asyncHandler from "express-async-handler";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import PatientLetter from "../models/PatientLetter.js";
import ClinicalImage from "../models/ClinicalImage.js";

const getBranch=async(organizationId)=>Branch.findOne({organizationId,status:"active"}).sort({createdAt:1});
const base=(req)=>({organizationId:req.user.organizationId});

export const listLetters=asyncHandler(async(req,res)=>{
 const q={...base(req)}; if(req.query.patientId)q.patientId=req.query.patientId;
 const data=await PatientLetter.find(q).populate("patientId","firstName middleName lastName patientNumber phone email").sort({createdAt:-1}).limit(200).lean();
 res.json({success:true,data});
});
export const getLetter=asyncHandler(async(req,res)=>{
 const data=await PatientLetter.findOne({_id:req.params.id,...base(req)}).populate("patientId","firstName middleName lastName patientNumber phone email").lean();
 if(!data){res.status(404);throw new Error("Letter not found");} res.json({success:true,data});
});
export const createLetter=asyncHandler(async(req,res)=>{
 const branch=await getBranch(req.user.organizationId); if(!branch){res.status(400);throw new Error("An active practice branch is required");}
 const patient=await Patient.findOne({_id:req.body.patientId,...base(req)}); if(!patient){res.status(404);throw new Error("Patient not found");}
 if(!req.body.title||!req.body.body){res.status(400);throw new Error("Title and letter body are required");}
 const data=await PatientLetter.create({...req.body,organizationId:req.user.organizationId,branchId:branch._id,createdBy:req.user._id});
 res.status(201).json({success:true,data});
});
export const updateLetter=asyncHandler(async(req,res)=>{
 const data=await PatientLetter.findOne({_id:req.params.id,...base(req)}); if(!data){res.status(404);throw new Error("Letter not found");}
 ["title","template","body","status"].forEach(k=>{if(req.body[k]!==undefined)data[k]=req.body[k]});
 if(data.status==="printed")data.printedAt=data.printedAt||new Date(); else if(req.body.status&&req.body.status!=="printed")data.printedAt=null;
 data.updatedBy=req.user._id; await data.save(); res.json({success:true,data});
});

export const listImages=asyncHandler(async(req,res)=>{
 const q={...base(req)}; if(req.query.patientId)q.patientId=req.query.patientId; if(req.query.category)q.category=req.query.category;
 const data=await ClinicalImage.find(q).populate("patientId","firstName middleName lastName patientNumber").sort({capturedAt:-1,createdAt:-1}).limit(300).lean();
 res.json({success:true,data});
});
export const createImage=asyncHandler(async(req,res)=>{
 const branch=await getBranch(req.user.organizationId); if(!branch){res.status(400);throw new Error("An active practice branch is required");}
 const patient=await Patient.findOne({_id:req.body.patientId,...base(req)}); if(!patient){res.status(404);throw new Error("Patient not found");}
 if(!req.body.title||!req.body.imageUrl){res.status(400);throw new Error("Image title and image URL are required");}
 if(req.body.imageUrl.length>200000){res.status(400);throw new Error("Image payload is too large");}
 const data=await ClinicalImage.create({...req.body,organizationId:req.user.organizationId,branchId:branch._id,createdBy:req.user._id});
 res.status(201).json({success:true,data});
});
export const deleteImage=asyncHandler(async(req,res)=>{
 const data=await ClinicalImage.findOneAndDelete({_id:req.params.id,...base(req)}); if(!data){res.status(404);throw new Error("Clinical image not found");}
 res.json({success:true,message:"Clinical image deleted"});
});
