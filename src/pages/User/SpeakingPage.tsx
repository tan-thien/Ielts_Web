import { useEffect, useRef, useState } from "react";
import { getAIHistory, getEvaluation, streamEvaluateSpeaking } from "../../services/ai.service";
import type { AIStreamEvent } from "../../services/ai.service";
import type { AICriterionResult, AIPracticeAttempt, SpeakingPart } from "../../types/ai";
import AIEvaluationPanel from "./AIEvaluationPanel";
import "./WritingPage.css";

const questions: Record<SpeakingPart, string> = {
    "1": "Let's talk about your hometown. What do you like most about living there?",
    "2": "Describe a useful skill you learned. You should say what it is, how you learned it, and why it is useful.",
    "3": "Why do you think people should continue learning new skills throughout their lives?",
};
const recordingMimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
];
const maxRecordingMs = 120_000;
const maxAudioBytes = 7 * 1024 * 1024;
const requestTimeoutMs = 210_000;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Không thể đọc bản ghi. Vui lòng thu âm lại."));
        reader.readAsDataURL(blob);
    });
}

function formatTime(totalSeconds: number): string {
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function SpeakingPage() {
    const [part, setPart] = useState<SpeakingPart>("1");
    const [question, setQuestion] = useState(questions["1"]);
    const [attempt, setAttempt] = useState<AIPracticeAttempt | null>(null);
    const [history, setHistory] = useState<AIPracticeAttempt[]>([]);
    const [recording, setRecording] = useState(false);
    const [processingRecording, setProcessingRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [audioUrl, setAudioUrl] = useState("");
    const [audio, setAudio] = useState<{ data: string; mimeType: string }>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [streamingFeedback, setStreamingFeedback] = useState("");
    const [streamingCriteria, setStreamingCriteria] = useState<AICriterionResult[]>([]);
    const recorder = useRef<MediaRecorder | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const audioUrlRef = useRef("");
    const chunks = useRef<Blob[]>([]);
    const streamController = useRef<AbortController | null>(null);
    const cancelRequested = useRef(false);
    const maxRecordingTimer = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAIHistory("Speaking")
            .then((items) => {
                if (!cancelled) setHistory(items);
            })
            .catch((historyError: unknown) => {
                console.error("Load Speaking history failed:", historyError);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!recording) return;
        const timer = window.setInterval(
            () => setRecordingSeconds((value) => value + 1),
            1000,
        );
        return () => window.clearInterval(timer);
    }, [recording]);

    useEffect(() => () => {
        streamController.current?.abort();
        if (recorder.current?.state === "recording") recorder.current.stop();
        mediaStream.current?.getTracks().forEach((track) => track.stop());
        if (maxRecordingTimer.current !== null) window.clearTimeout(maxRecordingTimer.current);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    }, []);

    const changePart = (value: SpeakingPart) => {
        if (busy || recording || processingRecording) return;
        setPart(value);
        setQuestion(questions[value]);
        setAudio(undefined);
        setAttempt(null);
        setRecordingSeconds(0);
        setError("");
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
        setAudioUrl("");
    };

    const startRecording = async () => {
        let stream: MediaStream | null = null;
        try {
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
                throw new Error("Trình duyệt này không hỗ trợ thu âm. Hãy thử Chrome hoặc Edge.");
            }
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const supportedMimeType = recordingMimeTypes.find((mimeType) =>
                MediaRecorder.isTypeSupported(mimeType),
            );
            const mediaRecorder = supportedMimeType
                ? new MediaRecorder(stream, { mimeType: supportedMimeType })
                : new MediaRecorder(stream);
            mediaStream.current = stream;
            chunks.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size) chunks.current.push(event.data);
            };
            mediaRecorder.onstop = () => {
                stream?.getTracks().forEach((track) => track.stop());
                mediaStream.current = null;
                setProcessingRecording(true);
                const mimeType = mediaRecorder.mimeType || supportedMimeType || "audio/webm";
                const blob = new Blob(chunks.current, { type: mimeType });
                if (!blob.size) {
                    setProcessingRecording(false);
                    setError("Không thu được âm thanh. Vui lòng kiểm tra microphone và thử lại.");
                    return;
                }
                if (blob.size > maxAudioBytes) {
                    setProcessingRecording(false);
                    setError("Bản ghi vượt quá giới hạn 7 MB. Hãy thu âm ngắn hơn hoặc giảm chất lượng microphone.");
                    return;
                }
                const nextAudioUrl = URL.createObjectURL(blob);
                setAudioUrl((previousUrl) => {
                    if (previousUrl) URL.revokeObjectURL(previousUrl);
                    audioUrlRef.current = nextAudioUrl;
                    return nextAudioUrl;
                });
                void blobToDataUrl(blob)
                    .then((data) => {
                        setAudio({ data, mimeType });
                        setProcessingRecording(false);
                    })
                    .catch((readError: unknown) => {
                        setProcessingRecording(false);
                        setError(readError instanceof Error ? readError.message : "Không thể đọc bản ghi.");
                    });
            };
            mediaRecorder.onerror = () => {
                stream?.getTracks().forEach((track) => track.stop());
                mediaStream.current = null;
                if (maxRecordingTimer.current !== null) {
                    window.clearTimeout(maxRecordingTimer.current);
                    maxRecordingTimer.current = null;
                }
                setProcessingRecording(false);
                setError("Trình duyệt không thể tạo bản ghi âm.");
                setRecording(false);
            };

            mediaRecorder.start(250);
            recorder.current = mediaRecorder;
            setRecordingSeconds(0);
            setProcessingRecording(false);
            setAudio(undefined);
            setAttempt(null);
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = "";
            setAudioUrl("");
            setError("");
            setRecording(true);
            maxRecordingTimer.current = window.setTimeout(() => {
                if (mediaRecorder.state === "recording") mediaRecorder.stop();
                recorder.current = null;
                maxRecordingTimer.current = null;
                setRecording(false);
            }, maxRecordingMs);
        } catch (recordingError) {
            stream?.getTracks().forEach((track) => track.stop());
            setError(recordingError instanceof Error
                ? recordingError.message
                : "Cần cấp quyền microphone để ghi âm câu trả lời.");
        }
    };

    const stopRecording = () => {
        if (maxRecordingTimer.current !== null) {
            window.clearTimeout(maxRecordingTimer.current);
            maxRecordingTimer.current = null;
        }
        if (recorder.current?.state === "recording") recorder.current.stop();
        recorder.current = null;
        setRecording(false);
    };

    const submit = async () => {
        if (processingRecording) {
            setError("Đang xử lý bản ghi. Vui lòng đợi một chút rồi gửi lại.");
            return;
        }
        if (!audio) {
            setError("Hãy thu âm câu trả lời trước khi gửi.");
            return;
        }

        setBusy(true);
        setError("");
        setAttempt(null);
        setStreamingFeedback("");
        setStreamingCriteria([]);

        const controller = new AbortController();
        streamController.current = controller;
        cancelRequested.current = false;
        const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const result = await streamEvaluateSpeaking(
                {
                    part,
                    question,
                    audioBase64: audio.data,
                    audioMimeType: audio.mimeType,
                },
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
                    ? "Bạn đã dừng đánh giá. Bản ghi vẫn được giữ lại."
                    : "Đánh giá mất quá nhiều thời gian và đã dừng. Bản ghi vẫn được giữ lại; vui lòng thử lại.");
            } else {
                setError(requestError instanceof Error
                    ? requestError.message
                    : "Không thể đánh giá bản ghi lúc này. Vui lòng thử lại.");
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
                <h1>Luyện kỹ năng Nói, biết rõ bước tiếp theo.</h1>
                <p>
                    Nhận band ước lượng theo 4 tiêu chí, transcript, ví dụ cần sửa và
                    bài luyện cụ thể. AI chỉ đánh giá phát âm từ tín hiệu âm thanh khi
                    chất lượng ghi âm cho phép.
                </p>
            </header>

            <div className="writing-layout">
                <main className="writing-card">
                    <div className="task-switch" aria-label="Chọn phần thi">
                        {(["1", "2", "3"] as SpeakingPart[]).map((value) => (
                            <button
                                type="button"
                                key={value}
                                className={part === value ? "active" : ""}
                                onClick={() => changePart(value)}
                                disabled={busy || recording || processingRecording}
                            >
                                Phần {value}
                            </button>
                        ))}
                    </div>

                    <label>
                        Câu hỏi
                        <textarea
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            rows={4}
                            disabled={busy || recording}
                        />
                    </label>

                    <div className="recording-panel">
                        <div>
                            <strong>
                                {recording
                                    ? "Đang ghi âm"
                                    : processingRecording
                                        ? "Đang xử lý bản ghi"
                                        : audio
                                            ? "Đã sẵn sàng đánh giá"
                                            : "Câu trả lời của bạn"}
                            </strong>
                            <span>{formatTime(recordingSeconds)} / 02:00</span>
                        </div>
                        <div className="recording-controls">
                            {!recording ? (
                                <button
                                    className="record-button"
                                    type="button"
                                    onClick={() => void startRecording()}
                                    disabled={busy || processingRecording}
                                >
                                    Bắt đầu ghi âm
                                </button>
                            ) : (
                                <button
                                    className="record-button recording"
                                    type="button"
                                    onClick={stopRecording}
                                >
                                    Dừng ghi âm
                                </button>
                            )}
                            {audioUrl && <audio controls src={audioUrl} />}
                        </div>
                        <small>
                            Tối đa 2 phút, dung lượng 7 MB. Hãy thu âm ở nơi yên tĩnh để
                            nhận xét phát âm đáng tin cậy hơn.
                        </small>
                    </div>

                    {error && <p className="ai-error" role="alert">{error}</p>}
                    <button
                        className="primary-ai-button"
                        type="button"
                        onClick={() => void submit()}
                        disabled={busy || recording || processingRecording || !audio}
                    >
                        {busy ? "Đang phân tích câu trả lời..." : "Nhận đánh giá kỹ năng Nói"}
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
                    {history.length === 0 && <p>Chưa có bài nói nào.</p>}
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
                                <span>{item.TaskType}</span>
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
                        Kết quả thường cần vài chục giây. Trang sẽ dừng yêu cầu nếu quá thời hạn.
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

export default SpeakingPage;
