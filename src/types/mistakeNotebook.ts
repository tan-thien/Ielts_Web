export type MistakeSkill = "Reading" | "Listening" | "Writing" | "Speaking";
export type MistakeStatus = "New" | "Reviewing" | "Mastered";

export interface MistakeReview {
    ReviewedAt: string;
    WasCorrect?: boolean;
    Status: MistakeStatus;
    Note: string;
    NextReviewAt: string | null;
}

export interface MistakeNotebookEntry {
    _id: string;
    SourceType: "Assignment" | "AI";
    SourceSubmissionID: string;
    AssignmentID: string | null;
    Skill: MistakeSkill;
    QuestionOrder: number | null;
    AIErrorIndex: number | null;
    SourceTitle: string;
    Question: string;
    OriginalAnswer: unknown;
    CorrectAnswer: unknown;
    ErrorType: string;
    ErrorQuote: string;
    Explanation: string;
    Suggestion: string;
    Note: string;
    Status: MistakeStatus;
    NextReviewAt: string | null;
    LastReviewedAt: string | null;
    ReviewCount: number;
    CorrectReviewCount: number;
    ReviewHistory: MistakeReview[];
    createdAt: string;
    updatedAt: string;
}

export interface MistakeNotebookSource {
    _id: string;
    Skill: MistakeSkill;
    SourceTitle: string;
    createdAt: string;
    ImportableCount: number;
}

export interface MistakeNotebookPageResult {
    items: MistakeNotebookEntry[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
