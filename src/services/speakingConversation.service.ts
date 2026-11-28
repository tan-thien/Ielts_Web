import api from "./api";
import type {
    ConversationMode,
    ConversationPart,
    SpeakingConversationDetail,
    SpeakingConversationResult,
    SpeakingConversationSession,
    SpeakingConversationStart,
} from "../types/speakingConversation";

export async function listSpeakingConversationSessions(): Promise<SpeakingConversationSession[]> {
    const response = await api.get<{ data: SpeakingConversationSession[] }>("/ai/speaking-conversation/sessions");
    return response.data.data;
}

export async function getSpeakingConversationSession(sessionId: string): Promise<SpeakingConversationDetail> {
    const response = await api.get<{ data: SpeakingConversationDetail }>(
        `/ai/speaking-conversation/sessions/${encodeURIComponent(sessionId)}`,
    );
    return response.data.data;
}

export async function startSpeakingConversation(data: {
    mode: ConversationMode;
    part: ConversationPart;
    topic?: string;
}): Promise<SpeakingConversationStart> {
    const response = await api.post<{ data: SpeakingConversationStart }>(
        "/ai/speaking-conversation/sessions",
        data,
        { timeout: 70_000 },
    );
    return response.data.data;
}

export async function sendSpeakingConversationMessage(
    sessionId: string,
    message: string,
): Promise<SpeakingConversationStart> {
    const response = await api.post<{ data: SpeakingConversationStart }>(
        `/ai/speaking-conversation/sessions/${encodeURIComponent(sessionId)}/messages`,
        { message },
        { timeout: 70_000 },
    );
    return response.data.data;
}

export async function endSpeakingConversation(
    sessionId: string,
): Promise<{ session: SpeakingConversationSession; result: SpeakingConversationResult }> {
    const response = await api.post<{ data: { session: SpeakingConversationSession; result: SpeakingConversationResult } }>(
        `/ai/speaking-conversation/sessions/${encodeURIComponent(sessionId)}/end`,
        {},
        { timeout: 70_000 },
    );
    return response.data.data;
}
