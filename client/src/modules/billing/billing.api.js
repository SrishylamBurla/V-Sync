import api from "../../services/api";
export const getBillingSummary=async()=> (await api.get("/billing/summary")).data;
export const getInvoices=async(params={})=> (await api.get("/billing",{params})).data;
export const getInvoice=async(id)=> (await api.get(`/billing/${id}`)).data;
export const createInvoice=async(payload)=> (await api.post("/billing",payload)).data;
export const updateInvoice=async(id,payload)=> (await api.put(`/billing/${id}`,payload)).data;
export const addPayment=async(id,payload)=> (await api.post(`/billing/${id}/payments`,payload)).data;
export const addRefund=async(id,payload)=> (await api.post(`/billing/${id}/refunds`,payload)).data;
