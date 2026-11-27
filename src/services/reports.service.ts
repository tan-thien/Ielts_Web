import api from "./api";
import type { ReportsData } from "../types/reports";

export interface AdminReportsQuery {
    months: number;
    popularCoursesPage?: number;
    recentOrdersPage?: number;
}

export const getAdminReports = async (query: AdminReportsQuery): Promise<ReportsData> => {
    const response = await api.get("/admin/management/reports", { params: query });
    return response.data.data as ReportsData;
};
