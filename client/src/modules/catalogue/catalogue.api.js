import api from "../../services/api";
export const getSuppliers = async () =>
  (await api.get("/catalogue/suppliers")).data;
export const createSupplier = async (p) =>
  (await api.post("/catalogue/suppliers", p)).data;
export const updateSupplier = async (id, p) =>
  (await api.put(`/catalogue/suppliers/${id}`, p)).data;
export const getLensCodes = async () =>
  (await api.get("/catalogue/lens-codes")).data;
export const createLensCode = async (p) =>
  (await api.post("/catalogue/lens-codes", p)).data;
export const updateLensCode = async (id, p) =>
  (await api.put(`/catalogue/lens-codes/${id}`, p)).data;
export const getLensExtras = async () =>
  (await api.get("/catalogue/lens-extras")).data;
export const createLensExtra = async (p) =>
  (await api.post("/catalogue/lens-extras", p)).data;
export const updateLensExtra = async (id, p) =>
  (await api.put(`/catalogue/lens-extras/${id}`, p)).data;
export const getContactLensCodes = async () =>
  (await api.get("/contact-lens-catalogue")).data;
export const createContactLensCode = async (p) =>
  (await api.post("/contact-lens-catalogue", p)).data;
export const updateContactLensCode = async (id, p) =>
  (await api.put(`/contact-lens-catalogue/${id}`, p)).data;
