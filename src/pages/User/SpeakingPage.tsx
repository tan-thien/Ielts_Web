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
    "audio/ogg",
    "audio/wav",
];
const maxRecordingMs = 120_000;
const maxAudioBytes = 7 * 1024 * 1024;
const requestTimeoutMs = 190_000;
type RequestStage = "sending" | "analyzing" | "receiving";
const supportedPlaybackMimeTypes = new Set([
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
]);

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

function getRecordingMimeType(recorder: MediaRecorder, firstChunk?: Blob): string {
    return (recorder.mimeType || firstChunk?.type || "").split(";", 1)[0].trim().toLowerCase();
}

async function hasExpectedAudioSignature(blob: Blob, mimeType: string): Promise<boolean> {
    const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    const startsWith = (...expected: number[]) => expected.every((value, index) => bytes[index] === value);
    if (mimeType === "audio/webm") return startsWith(0x1a, 0x45, 0xdf, 0xa3);
    if (mimeType === "audio/ogg") return String.fromCharCode(...bytes.slice(0, 4)) === "OggS";
    if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
        return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
            && String.fromCharCode(...bytes.slice(8, 12)) === "WAVE";
    }
    if (mimeType === "audio/mp4") return String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
    if (mimeType === "audio/mpeg") {
        return String.fromCharCode(...bytes.slice(0, 3)) === "ID3"
            || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    }
    return false;
}

function formatTime(totalSeconds: number): string {
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function SpeakingPage() {
    const [part, setPart] = useState<SpeakingPart>("1");
    const [question, setQuestion] = useState(questions["1"]);
    const [attempt, setAttempt] = useState<AIPracticeAttempt | null>(null);
    const [history, setHistory] = useState<AIPracticeAttempt[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");
    const [recording, setRecording] = useState(false);
    const [requestingMicrophone, setRequestingMicrophone] = useState(false);
    const [microphoneMonitorUnavailable, setMicrophoneMonitorUnavailable] = useState(false);
    const [microphoneMeterReady, setMicrophoneMeterReady] = useState(false);
    const [processingRecording, setProcessingRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [microphoneLevel, setMicrophoneLevel] = useState(0);
    const [audioUrl, setAudioUrl] = useState("");
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audio, setAudio] = useState<{ data: string; mimeType: string; canSubmit: boolean }>();
    const [busy, setBusy] = useState(false);
    const [evaluationFailed, setEvaluationFailed] = useState(false);
    const [error, setError] = useState("");
    const [streamingFeedback, setStreamingFeedback] = useState("");
    const [streamingCriteria, setStreamingCriteria] = useState<AICriterionResult[]>([]);
    const [requestStage, setRequestStage] = useState<RequestStage>("sending");
    const recorder = useRef<MediaRecorder | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const audioUrlRef = useRef("");
    const audioPlayingRef = useRef(false);
    const chunks = useRef<Blob[]>([]);
    const streamController = useRef<AbortController | null>(null);
    const cancelRequested = useRef(false);
    const maxRecordingTimer = useRef<number | null>(null);
    const recordingStartLock = useRef(false);
    const discardRecording = useRef(false);
    const audioContext = useRef<AudioContext | null>(null);
    const microphoneAnalyser = useRef<AnalyserNode | null>(null);
    const microphoneMeterTimer = useRef<number | null>(null);
    const microphoneMeterAvailable = useRef(false);
    const microphoneInputDetected = useRef(false);
    const mounted = useRef(false);
    const submitLock = useRef(false);
    const retryRequestId = useRef<string | null>(null);

    const updateAudioPlaying = (playing: boolean) => {
        audioPlayingRef.current = playing;
        setAudioPlaying(playing);
    };

    const clearAudio = () => {
        if (audioPlayingRef.current) return false;
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
        setAudioUrl("");
        setAudio(undefined);
        retryRequestId.current = null;
        return true;
    };

    const stopMicrophoneMeter = () => {
        if (microphoneMeterTimer.current !== null) {
            window.clearInterval(microphoneMeterTimer.current);
            microphoneMeterTimer.current = null;
        }
        microphoneAnalyser.current = null;
        const context = audioContext.current;
        audioContext.current = null;
        if (context && context.state !== "closed") {
            void context.close().catch((closeError: unknown) => {
                console.warn("Could not close the microphone audio context:", closeError);
            });
        }
        if (mounted.current) {
            setMicrophoneLevel(0);
            setMicrophoneMeterReady(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        getAIHistory("Speaking")
            .then((items) => {
                if (!cancelled) setHistory(items);
            })
            .catch((historyError: unknown) => {
                console.error("Load Speaking history failed:", historyError);
                if (!cancelled) setHistoryError("Không thể tải lịch sử luyện nói.");
            })
            .finally(() => {
                if (!cancelled) setHistoryLoading(false);
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

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            streamController.current?.abort();
            if (recorder.current?.state === "recording") recorder.current.stop();
            mediaStream.current?.getTracks().forEach((track) => track.stop());
            if (microphoneMeterTimer.current !== null) window.clearInterval(microphoneMeterTimer.current);
            if (audioContext.current && audioContext.current.state !== "closed") {
                void audioContext.current.close().catch((closeError: unknown) => {
                    console.warn("Could not close the microphone audio context:", closeError);
                });
            }
            if (maxRecordingTimer.current !== null) window.clearTimeout(maxRecordingTimer.current);
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = "";
        };
    }, []);

    const changePart = (value: SpeakingPart) => {
        if (busy || recording || processingRecording || requestingMicrophone || audioPlayingRef.current) return;
        setPart(value);
        setQuestion(questions[value]);
        clearAudio();
        setAttempt(null);
        setRecordingSeconds(0);
        setError("");
        setEvaluationFailed(false);
    };

    const startRecording = async () => {
        if (recordingStartLock.current || recording || processingRecording || busy) return;
        if (audioPlayingRef.current) {
            setError("Hãy nghe xong hoặc tạm dừng bản ghi trước khi thu âm lại.");
            return;
        }
        recordingStartLock.current = true;
        setRequestingMicrophone(true);
        let stream: MediaStream | null = null;
        try {
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
                throw new Error("Trình duyệt này không hỗ trợ thu âm. Hãy thử Chrome hoặc Edge.");
            }
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!mounted.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            microphoneInputDetected.current = false;
            microphoneMeterAvailable.current = false;
            setMicrophoneMeterReady(false);
            setMicrophoneMonitorUnavailable(typeof window.AudioContext === "undefined");
            setMicrophoneLevel(0);
            if (typeof window.AudioContext !== "undefined") {
                try {
                    const context = new AudioContext();
                    audioContext.current = context;
                    const analyser = context.createAnalyser();
                    analyser.fftSize = 512;
                    context.createMediaStreamSource(stream).connect(analyser);
                    const silentOutput = context.createGain();
                    silentOutput.gain.value = 0;
                    analyser.connect(silentOutput).connect(context.destination);
                    await context.resume();
                    if (!mounted.current) {
                        await context.close();
                        stream.getTracks().forEach((track) => track.stop());
                        return;
                    }
                    audioContext.current = context;
                    microphoneAnalyser.current = analyser;
                    microphoneMeterAvailable.current = true;
                    setMicrophoneMeterReady(true);
                    setMicrophoneMonitorUnavailable(false);
                    const samples = new Uint8Array(analyser.fftSize);
                    microphoneMeterTimer.current = window.setInterval(() => {
                        if (!mounted.current) return;
                        analyser.getByteTimeDomainData(samples);
                        const meanSquare = samples.reduce((sum, sample) => {
                            const amplitude = (sample - 128) / 128;
                            return sum + amplitude * amplitude;
                        }, 0) / samples.length;
                        const rms = Math.sqrt(meanSquare);
                        if (rms > 0.006) microphoneInputDetected.current = true;
                        setMicrophoneLevel(Math.min(100, Math.round(rms * 500)));
                    }, 150);
                } catch (meterError) {
                    microphoneMeterAvailable.current = false;
                    setMicrophoneMeterReady(false);
                    setMicrophoneMonitorUnavailable(true);
                    stopMicrophoneMeter();
                    console.warn("Live microphone input monitoring is unavailable:", meterError);
                }
            }
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
                recorder.current = null;
                if (maxRecordingTimer.current !== null) {
                    window.clearTimeout(maxRecordingTimer.current);
                    maxRecordingTimer.current = null;
                }
                if (mounted.current) setRecording(false);
                const hasMicrophoneSignal = microphoneInputDetected.current;
                const couldCheckMicrophone = microphoneMeterAvailable.current;
                stopMicrophoneMeter();
                if (discardRecording.current) {
                    discardRecording.current = false;
                    chunks.current = [];
                    if (mounted.current) setProcessingRecording(false);
                    return;
                }
                if (!mounted.current) return;
                setProcessingRecording(true);
                const mimeType = getRecordingMimeType(mediaRecorder, chunks.current[0]);
                const chunkMimeTypes = new Set(
                    chunks.current
                        .map((chunk) => chunk.type.split(";", 1)[0].trim().toLowerCase())
                        .filter(Boolean),
                );
                const blob = mimeType ? new Blob(chunks.current, { type: mimeType }) : new Blob(chunks.current);
                if (!blob.size || !chunks.current.length) {
                    setProcessingRecording(false);
                    setError("Không thu được âm thanh. Vui lòng kiểm tra microphone và thử lại.");
                    return;
                }
                if (!supportedPlaybackMimeTypes.has(mimeType)) {
                    setProcessingRecording(false);
                    setError("Trình duyệt tạo định dạng âm thanh không được hỗ trợ. Hãy thử Chrome hoặc Edge.");
                    return;
                }
                if ([...chunkMimeTypes].some((chunkType) => chunkType !== mimeType)) {
                    setProcessingRecording(false);
                    setError("Các phần âm thanh có định dạng không nhất quán. Hãy thu âm lại.");
                    return;
                }
                void (async () => {
                    try {
                        if (!await hasExpectedAudioSignature(blob, mimeType)) {
                            throw new Error("Dữ liệu bản ghi không khớp với định dạng âm thanh. Vui lòng thu âm lại.");
                        }
                        if (!mounted.current) return;
                        if (blob.size > maxAudioBytes) {
                            if (!clearAudio()) throw new Error("Hãy nghe xong bản ghi trước khi thay thế.");
                            const nextAudioUrl = URL.createObjectURL(blob);
                            audioUrlRef.current = nextAudioUrl;
                            setAudioUrl(nextAudioUrl);
                            setAudio({ data: "", mimeType, canSubmit: false });
                            setError("Bản ghi vượt quá giới hạn 7 MB. Tệp vẫn được giữ để nghe lại; hãy thu ngắn hơn rồi thu âm lại.");
                            return;
                        }
                        const data = await blobToDataUrl(blob);
                        if (!mounted.current) return;
                        if (!clearAudio()) throw new Error("Hãy nghe xong bản ghi trước khi thay thế.");
                        const nextAudioUrl = URL.createObjectURL(blob);
                        audioUrlRef.current = nextAudioUrl;
                        setAudioUrl(nextAudioUrl);
                        setAudio({ data, mimeType, canSubmit: !couldCheckMicrophone || hasMicrophoneSignal });
                        updateAudioPlaying(false);
                        retryRequestId.current = null;
                        setError(couldCheckMicrophone && !hasMicrophoneSignal
                            ? "Không phát hiện đủ tín hiệu microphone. Bản ghi được giữ để nghe lại nhưng không thể gửi chấm điểm; hãy kiểm tra âm lượng hoặc thu âm lại."
                            : "");
                    } catch (readError) {
                        if (mounted.current) {
                            setError(readError instanceof Error ? readError.message : "Không thể xử lý bản ghi.");
                        }
                    } finally {
                        if (mounted.current) setProcessingRecording(false);
                    }
                })();
            };
            mediaRecorder.onerror = () => {
                stream?.getTracks().forEach((track) => track.stop());
                mediaStream.current = null;
                stopMicrophoneMeter();
                if (maxRecordingTimer.current !== null) {
                    window.clearTimeout(maxRecordingTimer.current);
                    maxRecordingTimer.current = null;
                }
                recorder.current = null;
                if (mounted.current) {
                    setProcessingRecording(false);
                    setError("Trình duyệt không thể tạo bản ghi âm.");
                    setRecording(false);
                }
            };

            mediaRecorder.start(250);
            recorder.current = mediaRecorder;
            setRecordingSeconds(0);
            setProcessingRecording(false);
            setAttempt(null);
            setError("");
            setEvaluationFailed(false);
            setRecording(true);
            maxRecordingTimer.current = window.setTimeout(() => {
                if (mediaRecorder.state === "recording") mediaRecorder.stop();
                recorder.current = null;
                maxRecordingTimer.current = null;
                setRecording(false);
            }, maxRecordingMs);
        } catch (recordingError) {
            stopMicrophoneMeter();
            stream?.getTracks().forEach((track) => track.stop());
            mediaStream.current = null;
            recorder.current = null;
            if (mounted.current) {
                setError(recordingError instanceof Error
                    ? recordingError.message
                    : "Cần cấp quyền microphone để ghi âm câu trả lời.");
            }
        } finally {
            recordingStartLock.current = false;
            if (mounted.current) setRequestingMicrophone(false);
        }
    };

    const stopRecording = (discard = false) => {
        discardRecording.current = discard;
        setProcessingRecording(true);
        if (maxRecordingTimer.current !== null) {
            window.clearTimeout(maxRecordingTimer.current);
            maxRecordingTimer.current = null;
        }
        if (recorder.current?.state === "recording") recorder.current.stop();
        recorder.current = null;
        setRecording(false);
    };

    const submit = async () => {
        if (submitLock.current) return;
        if (processingRecording) {
            setError("Đang xử lý bản ghi. Vui lòng đợi một chút rồi gửi lại.");
            return;
        }
        if (!audio) {
            setError("Hãy thu âm câu trả lời trước khi gửi.");
            return;
        }
        if (!audio.canSubmit) {
            setError("Bản ghi chưa đủ điều kiện gửi. Hãy nghe lại hoặc thu âm lại bằng microphone có tín hiệu rõ.");
            return;
        }

        submitLock.current = true;
        setBusy(true);
        setEvaluationFailed(false);
        setRequestStage("sending");
        setError("");
        setAttempt(null);
        setStreamingFeedback("");
        setStreamingCriteria([]);

        const controller = new AbortController();
        streamController.current = controller;
        cancelRequested.current = false;
        const requestId = retryRequestId.current || crypto.randomUUID();
        retryRequestId.current = requestId;
        const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const result = await streamEvaluateSpeaking(
                {
                    requestId,
                    part,
                    question,
                    audioBase64: audio.data,
                    audioMimeType: audio.mimeType,
                },
                (event: AIStreamEvent, data: unknown) => {
                    if (!isRecord(data)) return;
                    if (event === "started") setRequestStage("analyzing");
                    if (event === "feedback" && typeof data.text === "string") {
                        setRequestStage("receiving");
                        setStreamingFeedback((current) =>
                            [current, data.text].filter(Boolean).join("\n\n"),
                        );
                    }
                    if (event === "criterion_score" && typeof data.name === "string") {
                        setRequestStage("receiving");
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
            retryRequestId.current = null;
            setEvaluationFailed(false);
            setHistory((items) => [
                result,
                ...items.filter((item) => item._id !== result._id),
            ].slice(0, 20));
        } catch (requestError) {
            setEvaluationFailed(true);
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
            submitLock.current = false;
            setBusy(false);
        }
    };

    const currentResult = getEvaluation(attempt);

    return (
        <div className="ai-practice-page">
            <header className="ai-page-hero">
                <span>IELTS SPEAKING PRACTICE · LUYỆN NÓI IELTS</span>
                <h1>Luyện kỹ năng Nói, biết rõ bước tiếp theo.</h1>
                <p>
                    Nhận band ước lượng theo 4 tiêu chí, transcript, ví dụ cần sửa và
                    bài luyện cụ thể. AI chỉ đánh giá phát âm từ tín hiệu âm thanh khi
                    chất lượng ghi âm cho phép.
                </p>
                <p className="ai-task-target">
                    {part === "1"
                        ? "Part 1: trả lời trực tiếp, sau đó mở rộng vừa đủ và tự nhiên."
                        : part === "2"
                            ? "Part 2: bao quát cue card, sắp xếp ý và duy trì bài nói."
                            : "Part 3: giải thích quan điểm, phân tích vấn đề và phát triển ví dụ."}
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
                                aria-pressed={part === value}
                                onClick={() => changePart(value)}
                                disabled={busy || recording || processingRecording || requestingMicrophone || audioPlaying}
                            >
                                Phần {value}
                            </button>
                        ))}
                    </div>

                    <label>
                        Câu hỏi
                        <textarea
                            value={question}
                            onChange={(event) => {
                                setQuestion(event.target.value);
                                retryRequestId.current = null;
                            }}
                            rows={4}
                            disabled={busy || recording}
                        />
                    </label>

                    <div className="recording-panel">
                        <div>
                            <strong>
                                {recording
                                    ? "Đang ghi âm"
                                    : requestingMicrophone
                                        ? "Đang kết nối microphone"
                                    : processingRecording
                                        ? "Đang xử lý bản ghi"
                                        : audio
                                        ? "Đã ghi âm · sẵn sàng nghe lại"
                                            : "Câu trả lời của bạn"}
                            </strong>
                            <span>{formatTime(recordingSeconds)} / 02:00</span>
                        </div>
                        {recording && microphoneMeterReady && (
                        <div
                            className="microphone-meter"
                            role="meter"
                            aria-label="Mức tín hiệu microphone"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={microphoneLevel}
                        >
                            <span style={{ width: `${microphoneLevel}%` }} />
                        </div>
                        )}
                        <div className="recording-controls">
                            {!recording ? (
                                <button
                                    className="record-button"
                                    type="button"
                                    onClick={() => void startRecording()}
                                    disabled={busy || processingRecording || requestingMicrophone || audioPlaying}
                                >
                                    {requestingMicrophone ? "Đang kết nối..." : "Bắt đầu ghi âm"}
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="record-button recording"
                                        type="button"
                                        onClick={() => stopRecording()}
                                    >
                                        Dừng và lưu bản ghi
                                    </button>
                                    <button
                                        className="ai-cancel-button"
                                        type="button"
                                        onClick={() => stopRecording(true)}
                                    >
                                        Hủy bản ghi
                                    </button>
                                </>
                            )}
                            {audioUrl && (
                                <>
                                    <audio
                                        controls={!recording && !processingRecording && !busy}
                                        src={audioUrl}
                                        onError={() => {
                                            updateAudioPlaying(false);
                                            setError("Không phát được bản ghi trong trình duyệt này. Tệp vẫn được giữ để thử lại hoặc thu âm lại.");
                                        }}
                                        onPlay={() => {
                                            updateAudioPlaying(true);
                                            setError("");
                                        }}
                                        onPause={() => updateAudioPlaying(false)}
                                        onEnded={() => updateAudioPlaying(false)}
                                    />
                                    <button
                                        type="button"
                                        className="ai-cancel-button"
                                        disabled={audioPlaying}
                                        onClick={() => {
                                            clearAudio();
                                            setError("");
                                        }}
                                    >
                                        Xóa bản ghi
                                    </button>
                                </>
                            )}
                        </div>
                        <small>
                            Tối đa 2 phút, dung lượng 7 MB. Có thể nghe lại nhiều lần,
                            xóa hoặc thu âm lại trước khi gửi. Không lưu audio vào lịch sử.
                        </small>
                        {audioPlaying && (
                            <small role="status">Đang phát bản ghi; hãy chờ phát xong hoặc tạm dừng trước khi thu lại, đổi Part hay xóa tệp.</small>
                        )}
                        {microphoneMonitorUnavailable && (
                            <small role="status">Không thể hiển thị mức microphone trực tiếp; dữ liệu âm thanh vẫn được kiểm tra sau khi ghi.</small>
                        )}
                    </div>

                    {error && <p className="ai-error" role="alert">{error}</p>}
                    <button
                        className="primary-ai-button"
                        type="button"
                        onClick={() => void submit()}
                        disabled={busy || recording || processingRecording || !audio || !audio.canSubmit}
                    >
                        {busy
                            ? requestStage === "sending"
                                ? "Đang gửi bản ghi..."
                                : requestStage === "analyzing"
                                    ? "AI đang phân tích câu trả lời..."
                                    : "Đang nhận kết quả..."
                            : error
                                ? evaluationFailed ? "Thử lại đánh giá" : "Nhận đánh giá kỹ năng Nói"
                                : "Nhận đánh giá kỹ năng Nói"}
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
                    <div className="writing-history-list" role="region" aria-label="Danh sách lịch sử luyện tập">
                        {historyLoading && <p>Đang tải lịch sử...</p>}
                        {historyError && <p className="ai-error" role="alert">{historyError}</p>}
                        {!historyLoading && !historyError && history.length === 0 && <p>Chưa có bài nói nào.</p>}
                        {history.map((item) => {
                            const result = getEvaluation(item);
                            return (
                                <button
                                    type="button"
                                    key={item._id}
                                    disabled={busy}
                                    onClick={() => {
                                        setAttempt(item);
                                        setError("");
                                        setEvaluationFailed(false);
                                    }}
                                >
                                    <span>{item.TaskType}</span>
                                    <strong>{result ? result.estimatedOverallBand.toFixed(1) : "—"}</strong>
                                    <small>{item.Prompt}</small>
                                    <small>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</small>
                                </button>
                            );
                        })}
                    </div>
                    <p className="ai-muted">Bản ghi âm không được lưu vào lịch sử; chỉ transcript và báo cáo được lưu.</p>
                </aside>
            </div>

            {busy && (
                <section className="ai-result stream-preview" aria-live="polite">
                    <h2>Đang phân tích theo tiêu chí IELTS</h2>
                    <p className="ai-muted">
                        {requestStage === "sending" ? "Đang gửi bản ghi đến máy chủ." : null}
                        {requestStage === "analyzing" ? "AI đang nghe và đánh giá nội dung câu trả lời." : null}
                        {requestStage === "receiving" ? "Đang nhận và kiểm tra phản hồi theo tiêu chí." : null}
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
