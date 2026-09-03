import api from "../../services/api";
export const getReportOverview=async(params={})=>(await api.get("/reports/overview",{params})).data;
export const getOperationalReports=async(params={})=>(await api.get("/reports/operational",{params})).data;
export const getInventoryReport=async()=>(await api.get("/reports/inventory")).data;
