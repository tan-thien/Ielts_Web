import api from "./api";
import type { ManagementDashboard } from "../types/management";

export interface ManagementDashboardQuery {
    studentsPage?: number;
    studentsSearch?: string;
    accountsPage?: number;
    accountsSearch?: string;
    accountsRole?: "all" | "user" | "teacher";
    coursesPage?: number;
    coursesSearch?: string;
}

export const getManagementDashboard = async (
    query: ManagementDashboardQuery = {},
): Promise<ManagementDashboard> => {
    const response = await api.get("/admin/management/dashboard", { params: query });
    return response.data.data as ManagementDashboard;
};

export const updateAccountRole = async (accountId: string, role: "user" | "teacher") => {
    const response = await api.put(`/admin/management/accounts/${accountId}/role`, { role });
    return response.data.data;
};

export const updateCourseTeachers = async (courseId: string, teacherIds: string[]) => {
    const response = await api.put(`/admin/management/courses/${courseId}/teachers`, { teacherIds });
    return response.data.data;
};
