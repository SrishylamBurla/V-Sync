import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema({
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  branchId:{type:mongoose.Schema.Types.ObjectId,ref:"Branch",required:true},
  category:{type:String,enum:["frame","lens","sundry"],required:true,index:true},
  code:{type:String,required:true,trim:true},
  barcode:{type:String,trim:true,default:""},
  brand:{type:String,trim:true,default:""},
  model:{type:String,trim:true,default:""},
  description:{type:String,trim:true,default:""},
  colour:{type:String,trim:true,default:""},
  size:{type:String,trim:true,default:""},
  material:{type:String,trim:true,default:""},
  index:{type:String,trim:true,default:""},
  supplier:{type:String,trim:true,default:""},
  costPrice:{type:Number,default:0,min:0},
  sellingPrice:{type:Number,default:0,min:0},
  stock:{type:Number,default:0,min:0},
  reorderLevel:{type:Number,default:0,min:0},
  imageUrl:{type:String,default:""},
  status:{type:String,enum:["active","inactive"],default:"active"},
  notes:{type:String,default:""},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
},{timestamps:true});

inventoryItemSchema.index({organizationId:1,category:1,code:1},{unique:true});
inventoryItemSchema.index({organizationId:1,barcode:1},{sparse:true});
inventoryItemSchema.index({organizationId:1,category:1,status:1});

export default mongoose.model("InventoryItem",inventoryItemSchema);
