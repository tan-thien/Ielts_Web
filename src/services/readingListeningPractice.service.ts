import api from "./api";
import type {
    PracticeAssignment,
    PracticeReview,
} from "../types/readingListeningPractice";

export const getReadingListeningPracticeAssignments = async (): Promise<PracticeAssignment[]> => {
    const response = await api.get("/assignment/practice-center");
    return response.data.data as PracticeAssignment[];
};

export const getReadingListeningPracticeReview = async (
    assignmentId: string,
    submissionId: string,
): Promise<PracticeReview> => {
    const response = await api.get(
        `/assignment/practice-center/${assignmentId}/review/${submissionId}`,
    );
    return response.data.data as PracticeReview;
};
