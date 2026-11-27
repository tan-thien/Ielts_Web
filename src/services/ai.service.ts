import api from "./api";
import type { AIEvaluationResult, AIPracticeAttempt, SpeakingPart, WritingTaskType } from "../types/ai";

export type AIStreamEvent = "started" | "feedback" | "criterion_score" | "correction" | "completed" | "error";
type StreamHandler = (event: AIStreamEvent, data: unknown) => void;

async function streamRequest(
    path: string,
    body: Record<string, unknown> & { requestId: string },
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
        const errorBody = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(errorBody?.message || `Yêu cầu AI thất bại (${response.status}). Vui lòng thử lại.`);
    }
    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
        const errorBody = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(errorBody?.message || "Máy chủ không trả về luồng đánh giá hợp lệ.");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed: AIPracticeAttempt | null = null;
    let streamError = "";
    let malformedEvent = false;
    const dispatch = (block: string) => {
        const lines = block.split(/\r?\n/);
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() as AIStreamEvent | undefined;
        const dataLines = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).replace(/^ /, ""));
        if (!event || dataLines.length === 0) return;
        try {
            const data = JSON.parse(dataLines.join("\n")) as { attempt?: AIPracticeAttempt; message?: string } | AIPracticeAttempt;
            if (event === "completed" && "attempt" in data && data.attempt && getEvaluation(data.attempt)) completed = data.attempt;
            if (event === "error" && "message" in data && data.message) streamError = data.message;
            onEvent(event, data);
        } catch (error) {
            malformedEvent = true;
            streamError = error instanceof Error ? error.message : "Luồng đánh giá không hợp lệ.";
        }
    };
    try {
        while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() || "";
            blocks.forEach(dispatch);
            if (done) break;
        }
        buffer += decoder.decode();
        if (buffer.trim()) dispatch(buffer);
    } catch (error) {
        await reader.cancel().catch(() => {});
        throw error;
    }
    if (!completed) {
        const message = malformedEvent
            ? streamError
            : streamError || "Luồng đánh giá đã kết thúc trước khi có đủ kết quả. Bài làm vẫn được giữ lại; vui lòng thử lại.";
        throw new Error(message);
    }
    return completed;
}

export async function evaluateWriting(data: {
    requestId: string;
    taskType: WritingTaskType;
    prompt: string;
    answer: string;
    image?: { mimeType: string; data: string };
}, signal?: AbortSignal): Promise<AIPracticeAttempt> {
    const response = await api.post<{ data: AIPracticeAttempt }>("/ai/writing/evaluate", data, {
        timeout: 130_000,
        signal,
    });
    return response.data.data;
}

export async function evaluateSpeaking(data: {
    requestId: string;
    part: SpeakingPart;
    question: string;
    audioBase64: string;
    audioMimeType: string;
}, signal?: AbortSignal): Promise<AIPracticeAttempt> {
    const response = await api.post<{ data: AIPracticeAttempt }>("/ai/speaking/evaluate", data, {
        timeout: 130_000,
        signal,
    });
    return response.data.data;
}

export function streamEvaluateWriting(
    data: { requestId: string; taskType: WritingTaskType; prompt: string; answer: string; image?: { mimeType: string; data: string } },
    onEvent: StreamHandler,
    signal?: AbortSignal,
) {
    return streamRequest("/ai/writing/evaluate/stream", data, onEvent, signal);
}

export function streamEvaluateSpeaking(
    data: { requestId: string; part: SpeakingPart; question: string; audioBase64: string; audioMimeType: string },
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
    if (!result || !Number.isFinite(result.estimatedOverallBand) || !Array.isArray(result.criteria) || result.criteria.length !== 4) return null;
    if (result.criteria.some((criterion) => !Number.isFinite(criterion.band) || criterion.band < 0 || criterion.band > 9 || !Number.isInteger(criterion.band * 2))) return null;
    if (result.version === 2) {
        if (!result.generalFeedback?.trim() || !result.bandRationale?.trim() || !Array.isArray(result.actionPlan) || !result.actionPlan.length) return null;
        if (result.criteria.some((criterion) =>
            !Array.isArray(criterion.strengths) || !criterion.strengths.length
            || !Array.isArray(criterion.weaknesses) || !criterion.weaknesses.length
            || !Array.isArray(criterion.evidence) || !criterion.evidence.length
            || !Array.isArray(criterion.improvements) || !criterion.improvements.length
        )) return null;
        if (attempt.PracticeType === "Speaking" && !result.transcript?.trim()) return null;
        if (attempt.PracticeType === "Speaking" && result.transcriptionStatus && result.transcriptionStatus !== "clear") return null;
    }
    const calculatedOverall = Math.round(result.criteria.reduce((total, criterion) => total + criterion.band, 0) / 4 * 2) / 2;
    if (result.estimatedOverallBand !== calculatedOverall) return null;
    const rawPriorityErrors: unknown = result.priorityErrors;
    const priorityErrors = Array.isArray(rawPriorityErrors)
        ? rawPriorityErrors.flatMap((item): NonNullable<AIEvaluationResult["priorityErrors"]>[number][] => {
            if (typeof item === "string") {
                return [{
                    type: "Writing issue",
                    quote: "",
                    explanation: item,
                    suggestion: "",
                }];
            }
            if (typeof item !== "object" || item === null) return [];
            const value = item as Record<string, unknown>;
            return [{
                type: typeof value.type === "string" ? value.type : "Cần cải thiện",
                quote: typeof value.quote === "string" ? value.quote : "",
                location: typeof value.location === "string" ? value.location : "",
                explanation: typeof value.explanation === "string" ? value.explanation : "",
                suggestion: typeof value.suggestion === "string" ? value.suggestion : "",
            }];
        })
        : [];
    return { ...result, priorityErrors };
}
