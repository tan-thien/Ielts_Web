import api from "./api";
import type { ReportsData } from "../types/reports";

export const getAdminReports = async (months: number): Promise<ReportsData> => {
    const response = await api.get("/admin/management/reports", { params: { months } });
    return response.data.data as ReportsData;
};
