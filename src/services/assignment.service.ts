import api from "./api";
import type { Assignment, AssignmentPayload } from "../types/assignment";

export const getAssignments = async (): Promise<Assignment[]> => {
    const res = await api.get("/assignment/get-all");
    return res.data.data;
};

export const createAssignment = async (data: AssignmentPayload) => {
    const res = await api.post("/assignment/create", data);
    return res.data.data as Assignment;
};

export const updateAssignment = async (id: string, data: AssignmentPayload) => {
    const res = await api.put(`/assignment/update/${id}`, data);
    return res.data.data as Assignment;
};

export const deleteAssignment = async (id: string) => {
    const res = await api.delete(`/assignment/delete/${id}`);
    return res.data.data as Assignment;
};
