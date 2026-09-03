import mongoose from "mongoose";

const patientLetterSchema = new mongoose.Schema({
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  branchId:{type:mongoose.Schema.Types.ObjectId,ref:"Branch",required:true,index:true},
  patientId:{type:mongoose.Schema.Types.ObjectId,ref:"Patient",required:true,index:true},
  consultationId:{type:mongoose.Schema.Types.ObjectId,ref:"Consultation",default:null},
  title:{type:String,required:true,trim:true,maxlength:200},
  template:{type:String,trim:true,default:""},
  body:{type:String,required:true,maxlength:15000},
  status:{type:String,enum:["draft","final","printed"],default:"draft",index:true},
  printedAt:{type:Date,default:null},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
},{timestamps:true});
patientLetterSchema.index({organizationId:1,patientId:1,createdAt:-1});
export default mongoose.model("PatientLetter",patientLetterSchema);
