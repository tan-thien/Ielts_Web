import type {
    Assignment,
    AssignmentQuestion,
    AssignmentSubmission,
    SubmissionAnswer,
} from "./assignment";

export type PracticeQuestion = Omit<AssignmentQuestion, "CorrectAnswer" | "Explanation">;

export type PracticeAssignment = Omit<Assignment, "Questions"> & {
    Questions: PracticeQuestion[];
};

export interface PracticeReview {
    Questions: AssignmentQuestion[];
    Submission: Pick<
        AssignmentSubmission,
        | "_id"
        | "Status"
        | "Answers"
        | "TotalScore"
        | "BandScore"
        | "IsPassed"
        | "StartTime"
        | "SubmitTime"
        | "Duration"
    >;
}

export type PracticeReviewAnswer = SubmissionAnswer & {
    Score: number;
};
