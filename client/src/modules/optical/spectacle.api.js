import api from "../../services/api";
export const getSpectacle=async(id)=>(await api.get(`/spectacles/${id}`)).data;
export const getLatestConsultationForPatient=async(patientId)=>(await api.get(`/spectacles/patient/${patientId}/latest-consultation`)).data;
export const getPatientSpectacles=async(patientId)=>(await api.get(`/spectacles/patient/${patientId}`)).data;
export const createSpectacle=async(payload)=>(await api.post("/spectacles",payload)).data;
export const updateSpectacle=async(id,payload)=>(await api.put(`/spectacles/${id}`,payload)).data;
export const getDispensingList=async(params={})=>(await api.get("/spectacles/dispensing",{params})).data;
