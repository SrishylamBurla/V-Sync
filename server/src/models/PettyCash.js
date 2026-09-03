import mongoose from "mongoose";
const schema=new mongoose.Schema({organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},branchId:{type:mongoose.Schema.Types.ObjectId,ref:"Branch",required:true},entryDate:{type:Date,default:Date.now},type:{type:String,enum:["in","out"],required:true},category:{type:String,required:true,trim:true},description:{type:String,required:true,trim:true},amount:{type:Number,required:true,min:0},reference:{type:String,default:""},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}},{timestamps:true});
schema.index({organizationId:1,entryDate:-1});
export default mongoose.model("PettyCash",schema);
