import api from "./api";
import type {
    MistakeNotebookEntry,
    MistakeNotebookPageResult,
    MistakeNotebookSource,
    MistakeStatus,
} from "../types/mistakeNotebook";

const data = <T>(response: { data: { data: T } }) => response.data.data;

export const getMistakeNotebook = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    skill?: string;
    status?: string;
}) => data<MistakeNotebookPageResult>(await api.get("/mistake-notebook", { params }));

export const getMistakeNotebookSources = async () =>
    data<MistakeNotebookSource[]>(await api.get("/mistake-notebook/sources"));

export const importMistakesFromSubmission = async (submissionId: string) =>
    data<{ imported: number; duplicates: number; ignored: number }>(
        await api.post(`/mistake-notebook/import/${encodeURIComponent(submissionId)}`)
    );

export const updateMistake = async (
    id: string,
    body: { Note?: string; Status?: MistakeStatus; NextReviewAt?: string | null },
) => data<MistakeNotebookEntry>(await api.patch(`/mistake-notebook/${encodeURIComponent(id)}`, body));

export const recordMistakeReview = async (
    id: string,
    body: { WasCorrect: boolean; Note?: string },
) => data<MistakeNotebookEntry>(
    await api.post(`/mistake-notebook/${encodeURIComponent(id)}/reviews`, body)
);

export const deleteMistake = async (id: string) =>
    data<{ deleted: boolean }>(await api.delete(`/mistake-notebook/${encodeURIComponent(id)}`));
