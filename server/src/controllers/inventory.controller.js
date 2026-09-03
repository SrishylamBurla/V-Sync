import asyncHandler from "express-async-handler";
import InventoryItem from "../models/InventoryItem.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import Branch from "../models/Branch.js";

const getSingleBranch = async organizationId => Branch.findOne({organizationId,status:"active"}).sort({createdAt:1});
const allowedCategory = ["frame","lens","sundry"];

const normalize = body => ({
  category: body.category,
  code: body.code?.trim(),
  barcode: body.barcode?.trim() || "",
  brand: body.brand?.trim() || "",
  model: body.model?.trim() || "",
  description: body.description?.trim() || "",
  colour: body.colour?.trim() || "",
  size: body.size?.trim() || "",
  material: body.material?.trim() || "",
  index: body.index?.trim() || "",
  supplier: body.supplier?.trim() || "",
  costPrice: Number(body.costPrice || 0),
  sellingPrice: Number(body.sellingPrice || 0),
  stock: Math.max(Number(body.stock || 0),0),
  reorderLevel: Math.max(Number(body.reorderLevel || 0),0),
  imageUrl: body.imageUrl?.trim() || "",
  status: body.status || "active",
  notes: body.notes || "",
});

export const listInventory = asyncHandler(async (req,res)=>{
  const {category,search="",status="active",lowStock} = req.query;
  const query={organizationId:req.user.organizationId,status};
  if(category && allowedCategory.includes(category)) query.category=category;
  if(search.trim()){
    const regex=new RegExp(search.trim(),"i");
    query.$or=[{code:regex},{barcode:regex},{brand:regex},{model:regex},{description:regex},{supplier:regex}];
  }
  let items=await InventoryItem.find(query).sort({category:1,brand:1,code:1}).lean();
  if(lowStock === "true") items=items.filter(i=>Number(i.stock)<=Number(i.reorderLevel));
  res.json({success:true,data:items});
});

export const getInventoryItem = asyncHandler(async(req,res)=>{
  const item=await InventoryItem.findOne({_id:req.params.id,organizationId:req.user.organizationId}).lean();
  if(!item){res.status(404);throw new Error("Inventory item not found");}
  const transactions=await InventoryTransaction.find({itemId:item._id,organizationId:req.user.organizationId}).populate("createdBy","firstName lastName role").sort({createdAt:-1}).limit(50).lean();
  res.json({success:true,data:{item,transactions}});
});

export const createInventoryItem = asyncHandler(async(req,res)=>{
  const branch=await getSingleBranch(req.user.organizationId);
  if(!branch){res.status(400);throw new Error("An active practice branch is required");}
  const data=normalize(req.body);
  if(!allowedCategory.includes(data.category)){res.status(400);throw new Error("Valid inventory category is required");}
  if(!data.code){res.status(400);throw new Error("Item code is required");}
  const duplicate=await InventoryItem.findOne({organizationId:req.user.organizationId,code:data.code});
  if(duplicate){res.status(409);throw new Error("An inventory item with this code already exists");}
  const item=await InventoryItem.create({...data,organizationId:req.user.organizationId,branchId:branch._id,createdBy:req.user._id});
  if(item.stock>0) await InventoryTransaction.create({organizationId:req.user.organizationId,branchId:branch._id,itemId:item._id,type:"opening",quantity:item.stock,beforeStock:0,afterStock:item.stock,reason:"Opening stock",createdBy:req.user._id});
  res.status(201).json({success:true,message:"Inventory item created successfully",data:item});
});

export const updateInventoryItem = asyncHandler(async(req,res)=>{
  const item=await InventoryItem.findOne({_id:req.params.id,organizationId:req.user.organizationId});
  if(!item){res.status(404);throw new Error("Inventory item not found");}
  const data=normalize({...item.toObject(),...req.body});
  if(data.code!==item.code){const duplicate=await InventoryItem.findOne({organizationId:req.user.organizationId,code:data.code,_id:{$ne:item._id}});if(duplicate){res.status(409);throw new Error("An inventory item with this code already exists");}}
  Object.assign(item,data,{updatedBy:req.user._id});
  await item.save();
  res.json({success:true,message:"Inventory item updated successfully",data:item});
});

export const adjustInventory = asyncHandler(async(req,res)=>{
  const item=await InventoryItem.findOne({_id:req.params.id,organizationId:req.user.organizationId});
  if(!item){res.status(404);throw new Error("Inventory item not found");}
  const quantity=Number(req.body.quantity);
  const reason=req.body.reason?.trim();
  if(!Number.isFinite(quantity) || quantity===0){res.status(400);throw new Error("A non-zero stock adjustment is required");}
  if(!reason){res.status(400);throw new Error("Adjustment reason is required");}
  const before=item.stock;
  const after=before+quantity;
  if(after<0){res.status(400);throw new Error("Stock cannot become negative");}
  item.stock=after;item.updatedBy=req.user._id;await item.save();
  const tx=await InventoryTransaction.create({organizationId:req.user.organizationId,branchId:item.branchId,itemId:item._id,type:"adjustment",quantity,beforeStock:before,afterStock:after,reason,reference:req.body.reference||"",createdBy:req.user._id});
  res.json({success:true,message:"Stock adjusted successfully",data:{item,transaction:tx}});
});

export const inventorySummary = asyncHandler(async(req,res)=>{
  const org=req.user.organizationId;
  const [total,frames,lenses,sundries,lowStock,value] = await Promise.all([
    InventoryItem.countDocuments({organizationId:org,status:"active"}),
    InventoryItem.countDocuments({organizationId:org,status:"active",category:"frame"}),
    InventoryItem.countDocuments({organizationId:org,status:"active",category:"lens"}),
    InventoryItem.countDocuments({organizationId:org,status:"active",category:"sundry"}),
    InventoryItem.countDocuments({organizationId:org,status:"active",$expr:{$lte:["$stock","$reorderLevel"]}}),
    InventoryItem.aggregate([{ $match:{organizationId:org,status:"active"}},{$group:{_id:null,cost:{$sum:{$multiply:["$stock","$costPrice"]}},retail:{$sum:{$multiply:["$stock","$sellingPrice"]}}}}]),
  ]);
  res.json({success:true,data:{total,frames,lenses,sundries,lowStock,costValue:value[0]?.cost||0,retailValue:value[0]?.retail||0}});
});

export const stocktake = asyncHandler(async(req,res)=>{
  const item=await InventoryItem.findOne({_id:req.params.id,organizationId:req.user.organizationId});
  if(!item){res.status(404);throw new Error("Inventory item not found");}
  const counted=Number(req.body.countedStock);
  if(!Number.isFinite(counted) || counted<0){res.status(400);throw new Error("Valid counted stock is required");}
  const difference=counted-item.stock;
  if(difference===0){return res.json({success:true,message:"Stocktake matches current stock",data:{item,difference:0}});}
  const before=item.stock;item.stock=counted;item.updatedBy=req.user._id;await item.save();
  const tx=await InventoryTransaction.create({organizationId:req.user.organizationId,branchId:item.branchId,itemId:item._id,type:"stocktake",quantity:difference,beforeStock:before,afterStock:counted,reason:req.body.reason?.trim()||"Stocktake variance",createdBy:req.user._id});
  res.json({success:true,message:"Stocktake recorded successfully",data:{item,difference,transaction:tx}});
});
