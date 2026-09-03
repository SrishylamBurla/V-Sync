import mongoose from "mongoose";

const inventoryTransactionSchema = new mongoose.Schema({
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  branchId:{type:mongoose.Schema.Types.ObjectId,ref:"Branch",required:true},
  itemId:{type:mongoose.Schema.Types.ObjectId,ref:"InventoryItem",required:true,index:true},spectacleId:{type:mongoose.Schema.Types.ObjectId,ref:"Spectacle",default:null,index:true},
  type:{type:String,enum:["opening","purchase","sale","adjustment","stocktake"],required:true},
  quantity:{type:Number,required:true},
  beforeStock:{type:Number,required:true},
  afterStock:{type:Number,required:true},
  reason:{type:String,default:""},
  reference:{type:String,default:""},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
},{timestamps:true});

inventoryTransactionSchema.index({organizationId:1,itemId:1,createdAt:-1});
export default mongoose.model("InventoryTransaction",inventoryTransactionSchema);
