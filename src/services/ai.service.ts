import api from "./api";
import type { AIEvaluationResult, AIPracticeAttempt, SpeakingPart, WritingTaskType } from "../types/ai";

export type AIStreamEvent = "started" | "feedback" | "criterion_score" | "correction" | "completed" | "error";
type StreamHandler = (event: AIStreamEvent, data: unknown) => void;

async function streamRequest(
    path: string,
    body: unknown,
    onEvent: StreamHandler,
    signal?: AbortSignal,
): Promise<AIPracticeAttempt> {
    const baseUrl = api.defaults.baseURL || "http://localhost:3000/api";
    const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(body),
        signal,
    });
    if (!response.ok || !response.body) {
        throw new Error(`AI request failed (${response.status})`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed: AIPracticeAttempt | null = null;
    let streamError = "";
    const dispatch = (block: string) => {
        const lines = block.split("\n");
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() as AIStreamEvent | undefined;
        const dataLine = lines.find((line) => line.startsWith("data:"))?.slice(5).trim();
        if (!event || !dataLine) return;
        try {
            const data = JSON.parse(dataLine) as { attempt?: AIPracticeAttempt; message?: string } | AIPracticeAttempt;
            if (event === "completed" && "attempt" in data && data.attempt) completed = data.attempt;
            if (event === "error" && "message" in data && data.message) streamError = data.message;
            onEvent(event, data);
        } catch {
            onEvent("error", { message: "Invalid streaming event received." });
        }
    };
    while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        blocks.forEach(dispatch);
        if (done) break;
    }
    if (buffer.trim()) dispatch(buffer);
    if (!completed) throw new Error(streamError || "AI stream ended before completion.");
    return completed;
}

export async function evaluateWriting(data: {
    taskType: WritingTaskType;
    prompt: string;
    answer: string;
    image?: { mimeType: string; data: string };
}): Promise<AIPracticeAttempt> {
    const response = await api.post<{ data: AIPracticeAttempt }>("/ai/writing/evaluate", data);
    return response.data.data;
}

export async function evaluateSpeaking(data: {
    part: SpeakingPart;
    question: string;
    audioBase64: string;
    audioMimeType: string;
}): Promise<AIPracticeAttempt> {
    const response = await api.post<{ data: AIPracticeAttempt }>("/ai/speaking/evaluate", data);
    return response.data.data;
}

export function streamEvaluateWriting(
    data: { taskType: WritingTaskType; prompt: string; answer: string; image?: { mimeType: string; data: string } },
    onEvent: StreamHandler,
    signal?: AbortSignal,
) {
    return streamRequest("/ai/writing/evaluate/stream", data, onEvent, signal);
}

export function streamEvaluateSpeaking(
    data: { part: SpeakingPart; question: string; audioBase64: string; audioMimeType: string },
    onEvent: StreamHandler,
    signal?: AbortSignal,
) {
    return streamRequest("/ai/speaking/evaluate/stream", data, onEvent, signal);
}

export async function getAIHistory(skill?: "Writing" | "Speaking"): Promise<AIPracticeAttempt[]> {
    const response = await api.get<{ data: AIPracticeAttempt[] }>("/ai/history", { params: skill ? { skill } : {} });
    return response.data.data;
}

export function getEvaluation(attempt: AIPracticeAttempt | null): AIEvaluationResult | null {
    const result = attempt?.Answers?.[0]?.AIReview;
    if (!result || !Number.isFinite(result.estimatedOverallBand) || result.criteria.length !== 4) return null;
    if (result.criteria.some((criterion) => !Number.isFinite(criterion.band) || criterion.band < 0 || criterion.band > 9)) return null;
    const rawPriorityErrors = (result as AIEvaluationResult & { priorityErrors: unknown[] }).priorityErrors;
    const priorityErrors = Array.isArray(rawPriorityErrors) ? rawPriorityErrors.map((item) => {
        if (typeof item !== "string") return item;
        return { type: "Writing issue", quote: "", location: "", explanation: item, suggestion: "" };
    }) : [];
    return { ...result, priorityErrors };
}
