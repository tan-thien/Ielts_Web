export type WritingTaskType = "task1" | "task2";
export type SpeakingPart = "1" | "2" | "3";

export interface AICriterionResult {
    name: string;
    band: number;
    strengths: string[];
    weaknesses: string[];
    evidence: string[];
    improvements: string[];
}

export interface AIErrorItem {
    type: string;
    quote: string;
    location?: string;
    explanation: string;
    suggestion: string;
}

export interface AIEvaluationResult {
    version?: 2;
    kind: "writing" | "speaking";
    transcriptionStatus?: "clear" | "no_audio" | "too_quiet" | "non_speech" | "unintelligible" | "uncertain";
    estimatedOverallBand: number;
    criteria: AICriterionResult[];
    strengths: string[];
    weaknesses: string[];
    priorityErrors: AIErrorItem[];
    actionPlan: string[];
    generalFeedback: string;
    bandRationale?: string;
    correctedResponse?: string;
    transcript?: string;
    limitation?: string;
    disclaimer: string;
}

export interface AIPracticeAttempt {
    _id: string;
    AIRequestID?: string | null;
    PracticeType: "Writing" | "Speaking";
    TaskType: string;
    Prompt: string;
    BandScore: number;
    Answers: { Answer: string; AIReview: AIEvaluationResult }[];
    createdAt: string;
}
