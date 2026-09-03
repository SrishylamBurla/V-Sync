import mongoose from "mongoose";
const schema=new mongoose.Schema({organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},branchId:{type:mongoose.Schema.Types.ObjectId,ref:"Branch",required:true},expenseDate:{type:Date,default:Date.now},category:{type:String,required:true,trim:true},description:{type:String,required:true,trim:true},amount:{type:Number,required:true,min:0},paymentMethod:{type:String,enum:["cash","card","upi","bank_transfer","other"],default:"cash"},reference:{type:String,trim:true,default:""},notes:{type:String,default:""},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}},{timestamps:true});
schema.index({organizationId:1,expenseDate:-1});
export default mongoose.model("Expense",schema);
