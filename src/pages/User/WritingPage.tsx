import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    getAIHistory,
    getEvaluation,
    streamEvaluateWriting,
} from "../../services/ai.service";
import type { AIStreamEvent } from "../../services/ai.service";
import type { AICriterionResult, AIPracticeAttempt, WritingTaskType } from "../../types/ai";
import AIEvaluationPanel from "./AIEvaluationPanel";
import "./WritingPage.css";

const prompts: Record<WritingTaskType, string> = {
    task1: "The chart below shows information about a topic. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    task2: "Some people believe that online education is more effective than traditional classroom education. To what extent do you agree or disagree?",
};
const requestTimeoutMs = 210_000;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getTaskLabel(taskType: string): string {
    return taskType === "task1" ? "Viết học thuật - Dạng 1" : "Viết - Dạng 2";
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh. Vui lòng thử lại."));
    reader.readAsDataURL(file);
});

function WritingPage() {
    const [taskType, setTaskType] = useState<WritingTaskType>("task2");
    const [prompt, setPrompt] = useState(prompts.task2);
    const [answer, setAnswer] = useState("");
    const [image, setImage] = useState<{ mimeType: string; data: string }>();
    const [imageName, setImageName] = useState("");
    const [attempt, setAttempt] = useState<AIPracticeAttempt | null>(null);
    const [history, setHistory] = useState<AIPracticeAttempt[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [streamingFeedback, setStreamingFeedback] = useState("");
    const [streamingCriteria, setStreamingCriteria] = useState<AICriterionResult[]>([]);
    const streamController = useRef<AbortController | null>(null);
    const cancelRequested = useRef(false);
    const wordCount = useMemo(
        () => answer.trim() ? answer.trim().split(/\s+/).length : 0,
        [answer],
    );
    const targetWords = taskType === "task1" ? 150 : 250;

    useEffect(() => {
        let cancelled = false;
        getAIHistory("Writing")
            .then((items) => {
                if (!cancelled) setHistory(items);
            })
            .catch((historyError: unknown) => {
                console.error("Load Writing history failed:", historyError);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => () => streamController.current?.abort(), []);

    const changeTask = (value: WritingTaskType) => {
        if (busy) return;
        setTaskType(value);
        setPrompt(prompts[value]);
        setAnswer("");
        setImage(undefined);
        setImageName("");
        setAttempt(null);
        setError("");
    };

    const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            setError("Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP.");
            event.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Ảnh cần nhỏ hơn 5 MB.");
            event.target.value = "";
            return;
        }
        try {
            setImage({ mimeType: file.type, data: await fileToDataUrl(file) });
            setImageName(file.name);
            setError("");
        } catch (imageError) {
            setError(imageError instanceof Error ? imageError.message : "Không thể tải ảnh.");
        }
    };

    const submit = async () => {
        if (answer.trim().split(/\s+/).filter(Boolean).length < 20) {
            setError("Vui lòng viết ít nhất 20 từ trước khi gửi.");
            return;
        }

        setError("");
        setBusy(true);
        setSeconds(0);
        setAttempt(null);
        setStreamingFeedback("");
        setStreamingCriteria([]);

        const controller = new AbortController();
        streamController.current = controller;
        cancelRequested.current = false;
        const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const result = await streamEvaluateWriting(
                { taskType, prompt, answer, image },
                (event: AIStreamEvent, data: unknown) => {
                    if (!isRecord(data)) return;
                    if (event === "feedback" && typeof data.text === "string") {
                        setStreamingFeedback((current) =>
                            [current, data.text].filter(Boolean).join("\n\n"),
                        );
                    }
                    if (event === "criterion_score" && typeof data.name === "string") {
                        const criterion = data as unknown as AICriterionResult;
                        setStreamingCriteria((current) => [
                            ...current.filter((item) => item.name !== criterion.name),
                            criterion,
                        ]);
                    }
                    if (event === "error" && typeof data.message === "string") {
                        setError(data.message);
                    }
                },
                controller.signal,
            );
            setAttempt(result);
            setHistory((items) => [
                result,
                ...items.filter((item) => item._id !== result._id),
            ].slice(0, 20));
        } catch (requestError) {
            if (controller.signal.aborted) {
                setError(cancelRequested.current
                    ? "Bạn đã dừng đánh giá. Bài viết vẫn được giữ lại."
                    : "Đánh giá mất quá nhiều thời gian và đã dừng. Bài viết của bạn vẫn được giữ lại; vui lòng thử lại.");
            } else {
                setError(requestError instanceof Error
                    ? requestError.message
                    : "Không thể đánh giá bài viết lúc này. Vui lòng thử lại.");
            }
        } finally {
            window.clearTimeout(timeout);
            streamController.current = null;
            setBusy(false);
        }
    };

    const currentResult = getEvaluation(attempt);

    return (
        <div className="ai-practice-page">
            <header className="ai-page-hero">
                <span>LUYỆN TẬP IELTS CÙNG AI</span>
                <h1>Luyện kỹ năng Viết, nhận góp ý có dẫn chứng.</h1>
                <p>
                    Xem band ước lượng theo 4 tiêu chí, lỗi quan trọng cần sửa và bản
                    chỉnh sửa tham khảo. Kết quả AI không thay thế giám khảo IELTS.
                </p>
            </header>

            <div className="writing-layout">
                <main className="writing-card">
                    <div className="task-switch" aria-label="Chọn dạng bài">
                        <button
                            type="button"
                            className={taskType === "task1" ? "active" : ""}
                            onClick={() => changeTask("task1")}
                            disabled={busy}
                        >
                            Viết học thuật - Dạng 1
                        </button>
                        <button
                            type="button"
                            className={taskType === "task2" ? "active" : ""}
                            onClick={() => changeTask("task2")}
                            disabled={busy}
                        >
                            Viết - Dạng 2
                        </button>
                    </div>

                    <label>
                        Đề bài
                        <textarea
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            rows={4}
                            disabled={busy}
                        />
                    </label>

                    {taskType === "task1" && (
                        <label className="upload-label">
                            Biểu đồ / hình ảnh đề bài (không bắt buộc)
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(event) => void handleImage(event)}
                                disabled={busy}
                            />
                            {imageName && <small>Đã đính kèm: {imageName}</small>}
                        </label>
                    )}

                    <label>
                        Bài viết của bạn
                        <textarea
                            className="writing-editor"
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                            placeholder="Viết bài tại đây..."
                            disabled={busy}
                        />
                    </label>
                    <div className="writing-meta">
                        <span>
                            {wordCount} từ · khuyến nghị tối thiểu {targetWords} từ
                        </span>
                        <span>
                            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                            {String(seconds % 60).padStart(2, "0")}
                        </span>
                    </div>

                    {error && <p className="ai-error" role="alert">{error}</p>}
                    <button
                        className="primary-ai-button"
                        type="button"
                        onClick={() => void submit()}
                        disabled={busy}
                    >
                        {busy ? "Đang phân tích bài viết..." : "Nhận đánh giá kỹ năng Viết"}
                    </button>
                    {busy && (
                        <button
                            className="ai-cancel-button"
                            type="button"
                            onClick={() => {
                                cancelRequested.current = true;
                                streamController.current?.abort();
                            }}
                        >
                            Dừng đánh giá
                        </button>
                    )}
                </main>

                <aside className="writing-history">
                    <h2>Lịch sử luyện tập</h2>
                    {history.length === 0 && <p>Chưa có bài viết nào.</p>}
                    {history.map((item) => {
                        const result = getEvaluation(item);
                        return (
                            <button
                                type="button"
                                key={item._id}
                                onClick={() => {
                                    setAttempt(item);
                                    setError("");
                                }}
                            >
                                <span>{getTaskLabel(item.TaskType)}</span>
                                <strong>{result ? result.estimatedOverallBand.toFixed(1) : "—"}</strong>
                                <small>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</small>
                            </button>
                        );
                    })}
                </aside>
            </div>

            {busy && (
                <section className="ai-result stream-preview" aria-live="polite">
                    <h2>Đang phân tích theo tiêu chí IELTS</h2>
                    <p className="ai-muted">
                        Thời gian: {Math.floor(seconds / 60)} phút {seconds % 60} giây.
                        Kết quả thường cần vài chục giây; trang sẽ tự dừng nếu quá thời hạn.
                    </p>
                    {streamingCriteria.length > 0 && (
                        <div className="criterion-grid">
                            {streamingCriteria.map((criterion) => (
                                <article key={criterion.name}>
                                    <span>{criterion.name}</span>
                                    <strong>{criterion.band.toFixed(1)}</strong>
                                </article>
                            ))}
                        </div>
                    )}
                    {streamingFeedback && <p>{streamingFeedback}</p>}
                </section>
            )}

            {attempt && !currentResult && !busy && (
                <p className="ai-error" role="alert">
                    Lần luyện này chưa có đủ dữ liệu band hợp lệ để hiển thị.
                </p>
            )}
            {currentResult && <AIEvaluationPanel result={currentResult} />}
        </div>
    );
}

export default WritingPage;
