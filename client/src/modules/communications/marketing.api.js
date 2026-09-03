import api from "../../services/api";
export const getNewsletters=async(params={})=>(await api.get("/marketing/newsletters",{params})).data;
export const getNewsletter=async(id)=>(await api.get(`/marketing/newsletters/${id}`)).data;
export const createNewsletter=async(payload)=>(await api.post("/marketing/newsletters",payload)).data;
export const updateNewsletter=async(id,payload)=>(await api.put(`/marketing/newsletters/${id}`,payload)).data;
export const sendNewsletter=async(id)=>(await api.post(`/marketing/newsletters/${id}/send`)).data;
export const getMessages=async(params={})=>(await api.get("/marketing/messages",{params})).data;
export const sendMessage=async(payload)=>(await api.post("/marketing/messages",payload)).data;
