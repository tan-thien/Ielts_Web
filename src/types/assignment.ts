export type AssignmentSkill = "Reading" | "Listening" | "Writing" | "Speaking";
export type AssignmentType = "Practice" | "Quiz" | "Exam" | "Homework";
export type AssignmentQuestionType =
    | "MultipleChoice" | "Checkbox" | "TrueFalse" | "YesNo"
    | "TrueFalseNotGiven" | "YesNoNotGiven" | "FillBlank" | "ShortAnswer"
    | "Matching" | "MatchingHeadings" | "MatchingInformation"
    | "MatchingFeatures" | "MatchingSentenceEndings" | "Ordering"
    | "SentenceCompletion" | "NoteCompletion" | "FormCompletion"
    | "TableCompletion" | "SummaryCompletion" | "FlowChartCompletion"
    | "MapLabeling" | "DiagramLabeling" | "Essay" | "Speaking";

export interface AssignmentQuestion {
    Order: number;
    Type: AssignmentQuestionType;
    Part: number | null;
    GroupID: string;
    Instructions: string;
    AnswerCount: number;
    WordLimit: number | null;
    Title: string;
    Question: string;
    Resources: {
        Type: "Text" | "Image" | "Audio" | "Video" | "PDF";
        Url: string;
        Content: string;
    }[];
    Choices: { Key: string; Content: string }[];
    CorrectAnswer: unknown;
    Explanation: string;
    Score: number;
}

export interface Assignment {
    _id: string;
    Title: string;
    Description: string;
    Skill: AssignmentSkill;
    AssignmentType: AssignmentType;
    LessonID?: string | { _id: string } | null;
    CourseID?: string | { _id: string } | null;
    Duration: number;
    TotalScore: number;
    AttemptLimit: number;
    StartDate?: string;
    EndDate?: string;
    IsOpen: boolean;
    IsDeleted: boolean;
    Questions: AssignmentQuestion[];
}

export interface AssignmentPayload {
    Title: string;
    Description: string;
    Skill: AssignmentSkill;
    AssignmentType: AssignmentType;
    LessonID: string | null;
    CourseID: string;
    Duration: number;
    TotalScore: number;
    AttemptLimit: number;
    StartDate?: string;
    EndDate?: string;
    IsOpen: boolean;
    Questions: AssignmentQuestion[];
}
