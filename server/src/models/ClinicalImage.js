import mongoose from "mongoose";

const clinicalImageSchema = new mongoose.Schema({
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  branchId:{type:mongoose.Schema.Types.ObjectId,ref:"Branch",required:true,index:true},
  patientId:{type:mongoose.Schema.Types.ObjectId,ref:"Patient",required:true,index:true},
  consultationId:{type:mongoose.Schema.Types.ObjectId,ref:"Consultation",default:null},
  title:{type:String,required:true,trim:true,maxlength:200},
  category:{type:String,enum:["clinical_photo","scan","drawing","document","other"],default:"clinical_photo"},
  imageUrl:{type:String,required:true,trim:true,maxlength:200000},
  notes:{type:String,trim:true,maxlength:2000,default:""},
  capturedAt:{type:Date,default:Date.now},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true});
clinicalImageSchema.index({organizationId:1,patientId:1,createdAt:-1});
export default mongoose.model("ClinicalImage",clinicalImageSchema);
