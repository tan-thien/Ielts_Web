export type ConversationPart = "1" | "2" | "3";
export type ConversationMode = "free" | "topic";
export type ConversationRole = "user" | "assistant";
export type ConversationStatus = "active" | "completed";

export interface SpeakingConversationSession {
    _id: string;
    mode: ConversationMode;
    part: ConversationPart;
    topic: string;
    status: ConversationStatus;
    userTurnCount: number;
    messageCount: number;
    startedAt: string;
    lastActivityAt: string;
    endedAt?: string | null;
}

export interface SpeakingConversationMessage {
    _id: string;
    role: ConversationRole;
    content: string;
    createdAt: string;
}

export interface SpeakingConversationEvidence {
    quote: string;
    observation: string;
}

export interface SpeakingConversationResult {
    summary: string;
    strengths: string[];
    focusAreas: string[];
    evidence: SpeakingConversationEvidence[];
    disclaimer: string;
}

export interface SpeakingConversationDetail {
    session: SpeakingConversationSession;
    messages: SpeakingConversationMessage[];
    result: SpeakingConversationResult | null;
}

export interface SpeakingConversationStart {
    session: SpeakingConversationSession;
    messages: SpeakingConversationMessage[];
}
