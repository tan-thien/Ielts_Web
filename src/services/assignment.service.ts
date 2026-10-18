import api from "./api";
import type { Assignment, AssignmentPayload, AssignmentSubmission, SubmissionAnswer } from "../types/assignment";

export const getAssignments = async (): Promise<Assignment[]> => {
    const res = await api.get("/assignment/get-all");
    return res.data.data;
};

export const getCourseAssignments = async (courseId: string): Promise<Assignment[]> => {
    const res = await api.get(`/assignment/course/${courseId}`);
    return res.data.data;
};

export const getMySubmissions = async (): Promise<AssignmentSubmission[]> => {
    const res = await api.get("/submition/my");
    return res.data.data;
};

export const createAssignmentSubmission = async (assignmentId: string): Promise<AssignmentSubmission> => {
    const res = await api.post("/submition/create", { AssignmentID: assignmentId });
    return res.data.data;
};

export const saveAssignmentSubmission = async (
    submissionId: string,
    answers: SubmissionAnswer[],
): Promise<AssignmentSubmission> => {
    const res = await api.put(`/submition/update/${submissionId}`, { Answers: answers });
    return res.data.data;
};

export const submitAssignmentSubmission = async (
    submissionId: string,
    answers?: SubmissionAnswer[],
): Promise<AssignmentSubmission> => {
    const res = await api.put(`/submition/submit/${submissionId}`, answers ? { Answers: answers } : {});
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
