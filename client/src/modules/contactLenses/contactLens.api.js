import api from "../../services/api";
export const getContactLenses=async(params={})=>(await api.get("/contact-lenses",{params})).data;
export const getPatientContactLenses=async(patientId)=>(await api.get(`/contact-lenses/patient/${patientId}`)).data;
export const getContactLens=async(id)=>(await api.get(`/contact-lenses/${id}`)).data;
export const createContactLens=async(payload)=>(await api.post("/contact-lenses",payload)).data;
export const updateContactLens=async(id,payload)=>(await api.put(`/contact-lenses/${id}`,payload)).data;
export const getLatestContactLensConsultation=async(patientId)=>(await api.get(`/contact-lenses/patient/${patientId}/latest-consultation`)).data;
