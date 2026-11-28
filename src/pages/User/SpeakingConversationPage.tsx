import { useEffect, useRef, useState, type FormEvent } from "react";
import {
    endSpeakingConversation,
    getSpeakingConversationSession,
    listSpeakingConversationSessions,
    sendSpeakingConversationMessage,
    startSpeakingConversation,
} from "../../services/speakingConversation.service";
import type {
    ConversationMode,
    ConversationPart,
    SpeakingConversationDetail,
    SpeakingConversationSession,
} from "../../types/speakingConversation";
import "./SpeakingConversationPage.css";
import "../../styles/ieltsUtilityDesign.css";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import { FaMicrophone } from "react-icons/fa";

const partLabels: Record<ConversationPart, string> = {
    "1": "Phần 1 · Phỏng vấn",
    "2": "Phần 2 · Trình bày",
    "3": "Phần 3 · Thảo luận",
};

const errorTranslations: Record<string, string> = {
    "AI returned an invalid response": "AI trả về phản hồi không hợp lệ.",
    "Gemini is not configured": "Dịch vụ AI chưa được cấu hình.",
    "Gemini request failed": "Không thể kết nối dịch vụ AI.",
    "AI returned an empty or oversized response": "AI trả về phản hồi trống hoặc vượt quá giới hạn.",
    "Request cancelled": "Yêu cầu đã bị hủy.",
    "AI request timed out": "Yêu cầu AI hết thời gian chờ.",
    "AI conversation is temporarily unavailable": "Tính năng hội thoại AI hiện tạm thời không khả dụng.",
    "AI response is missing required content": "Phản hồi AI thiếu nội dung bắt buộc.",
    "Speaking session was not found": "Không tìm thấy buổi luyện Nói này.",
    "Choose free or topic mode": "Hãy chọn chế độ luyện tự do hoặc theo chủ đề.",
    "Choose Speaking Part 1, 2, or 3": "Hãy chọn Phần 1, 2 hoặc 3 của bài thi Nói IELTS.",
    "Topic must be between 2 and 80 characters": "Chủ đề cần có từ 2 đến 80 ký tự.",
    "AI returned an empty response": "AI trả về phản hồi trống.",
    "Answer cannot be empty": "Câu trả lời không được để trống.",
    "Answer cannot exceed 3000 characters": "Câu trả lời không được vượt quá 3.000 ký tự.",
    "This speaking session has ended": "Buổi luyện Nói này đã kết thúc.",
    "A response is already being generated for this session": "Đang tạo phản hồi cho buổi luyện này, vui lòng chờ.",
    "This session has reached its turn limit": "Buổi luyện này đã đạt giới hạn số lượt trả lời.",
    "Complete at least two answer turns before ending for feedback": "Hãy gửi ít nhất hai câu trả lời trước khi kết thúc để nhận góp ý.",
    "Wait for the current response before ending this session": "Vui lòng chờ phản hồi hiện tại trước khi kết thúc buổi luyện.",
    "AI feedback did not include enough conversation evidence": "Phản hồi AI chưa có đủ dẫn chứng từ cuộc hội thoại.",
};

const errorMessage = (cause: unknown, fallback: string) => {
    let message = "";
    if (typeof cause === "object" && cause !== null && "response" in cause) {
        const response = cause.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
                message = data.message;
            }
        }
    }
    if (!message && cause instanceof Error) message = cause.message;
    return errorTranslations[message] || fallback;
};

function formatSessionLabel(session: SpeakingConversationSession): string {
    const date = new Date(session.lastActivityAt);
    const dateLabel = Number.isNaN(date.getTime()) ? "Buổi luyện tập" : date.toLocaleDateString("vi-VN");
    return `${partLabels[session.part]} · ${dateLabel}`;
}

export function SpeakingConversationPage() {
    const [mode, setMode] = useState<ConversationMode>("free");
    const [part, setPart] = useState<ConversationPart>("1");
    const [topic, setTopic] = useState("");
    const [draft, setDraft] = useState("");
    const [sessions, setSessions] = useState<SpeakingConversationSession[]>([]);
    const [detail, setDetail] = useState<SpeakingConversationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const messagesEnd = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;
        listSpeakingConversationSessions()
            .then((items) => {
                if (mounted) setSessions(items);
            })
            .catch((cause: unknown) => {
                if (mounted) setError(errorMessage(cause, "Không thể tải danh sách buổi luyện. Vui lòng thử lại."));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [detail?.messages.length]);

    const startSession = async () => {
        setBusy(true);
        setError("");
        try {
            const started = await startSpeakingConversation({
                mode,
                part,
                ...(mode === "topic" ? { topic: topic.trim() } : {}),
            });
            setDetail({ session: started.session, messages: started.messages, result: null });
            setSessions((current) => [started.session, ...current.filter((item) => item._id !== started.session._id)]);
            setDraft("");
        } catch (cause) {
            setError(errorMessage(cause, "Không thể bắt đầu buổi luyện. Vui lòng thử lại."));
        } finally {
            setBusy(false);
        }
    };

    const openSession = async (sessionId: string) => {
        setBusy(true);
        setError("");
        try {
            setDetail(await getSpeakingConversationSession(sessionId));
        } catch (cause) {
            setError(errorMessage(cause, "Không thể mở buổi luyện này. Vui lòng thử lại."));
        } finally {
            setBusy(false);
        }
    };

    const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!detail || detail.session.status !== "active" || !draft.trim()) return;
        setBusy(true);
        setError("");
        try {
            const response = await sendSpeakingConversationMessage(detail.session._id, draft.trim());
            setDetail((current) => current ? {
                ...current,
                session: response.session,
                messages: [...current.messages, ...response.messages],
            } : current);
            setDraft("");
            setSessions((current) => current.map((item) => item._id === response.session._id ? response.session : item));
        } catch (cause) {
            setError(errorMessage(cause, "Không thể gửi câu trả lời. Vui lòng thử lại."));
        } finally {
            setBusy(false);
        }
    };

    const finishSession = async () => {
        if (!detail) return;
        setBusy(true);
        setError("");
        try {
            const response = await endSpeakingConversation(detail.session._id);
            setDetail((current) => current ? {
                ...current,
                session: response.session,
                result: response.result,
            } : current);
            setSessions((current) => current.map((item) => item._id === response.session._id ? response.session : item));
        } catch (cause) {
            setError(errorMessage(cause, "Không thể kết thúc buổi luyện. Vui lòng thử lại."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="speaking-conversation-page">
            <UtilityPageHeader
                eyebrow="Luyện nói IELTS"
                title="Luyện Speaking cùng AI"
                description="Chọn Part, chọn chủ đề và thực hành hội thoại bằng tiếng Anh."
                icon={<FaMicrophone />}
            />

            {!detail && (
                <section className="speaking-part-grid" aria-label="Chọn Part Speaking">
                    {([
                        ["1", "Phỏng vấn", "Trả lời câu hỏi về bản thân và cuộc sống hằng ngày."],
                        ["2", "Trình bày", "Luyện mô tả chủ đề trong thời gian dài hơn."],
                        ["3", "Thảo luận", "Phát triển ý tưởng và trả lời câu hỏi chuyên sâu."],
                    ] as const).map(([value, title, description]) => (
                        <button
                            type="button"
                            key={value}
                            className={`speaking-part-card ${part === value ? "active" : ""}`}
                            onClick={() => setPart(value)}
                            aria-pressed={part === value}
                        >
                            <span>Phần {value}</span>
                            <strong>{title}</strong>
                            <small>{description}</small>
                        </button>
                    ))}
                </section>
            )}

            <div className="conversation-layout">
                <section className="conversation-main">
                    {!detail && (
                        <div className="conversation-card conversation-setup">
                            <h2>Bắt đầu lượt luyện</h2>
                            <p>Chọn phần thi Nói IELTS và cách thức hội thoại.</p>
                            <div className="conversation-options">
                                <label>
                                    Phần thi Nói IELTS
                                    <select value={part} onChange={(event) => setPart(event.target.value as ConversationPart)} disabled={busy}>
                                        {Object.entries(partLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </label>
                                <fieldset>
                                    <legend>Chế độ hội thoại</legend>
                                    <label className="conversation-radio">
                                        <input type="radio" name="conversation-mode" checked={mode === "free"} onChange={() => setMode("free")} disabled={busy} />
                                        Luyện tự do
                                    </label>
                                    <label className="conversation-radio">
                                        <input type="radio" name="conversation-mode" checked={mode === "topic"} onChange={() => setMode("topic")} disabled={busy} />
                                        Chọn chủ đề
                                    </label>
                                </fieldset>
                            </div>
                            {mode === "topic" && (
                                <label className="conversation-topic">
                                    Chủ đề
                                    <input value={topic} onChange={(event) => setTopic(event.target.value.slice(0, 80))} maxLength={80} placeholder="Ví dụ: Quê hương, du lịch, công nghệ" disabled={busy} />
                                    <small>{topic.length}/80 ký tự</small>
                                </label>
                            )}
                            <button className="conversation-primary" type="button" onClick={startSession} disabled={busy || (mode === "topic" && topic.trim().length < 2)}>
                                {busy ? "Đang bắt đầu…" : "Bắt đầu hội thoại"}
                            </button>
                        </div>
                    )}

                    {detail && (
                        <section className="conversation-card conversation-chat" aria-label="Hội thoại luyện Nói">
                            <div className="conversation-chat-heading">
                                <div>
                                    <span>{partLabels[detail.session.part]}</span>
                                    <h2>{detail.session.mode === "topic" ? detail.session.topic : "Luyện tự do"}</h2>
                                </div>
                                <button className="conversation-secondary" type="button" onClick={() => setDetail(null)} disabled={busy}>
                                    Lượt luyện mới
                                </button>
                            </div>
                            <div className="conversation-messages" aria-live="polite">
                                {detail.messages.map((message) => (
                                    <article className={`conversation-message ${message.role}`} key={message._id}>
                                        <span>{message.role === "assistant" ? "Đối tác luyện tập" : "Bạn"}</span>
                                        <p>{message.content}</p>
                                    </article>
                                ))}
                                <div ref={messagesEnd} />
                            </div>

                            {detail.result && (
                                <section className="conversation-result" aria-label="Góp ý luyện tập">
                                    <span>GÓP Ý LUYỆN TẬP</span>
                                    <h2>Nhận xét buổi luyện</h2>
                                    <p>{detail.result.summary}</p>
                                    <div className="conversation-feedback-columns">
                                        <div>
                                            <h3>Điểm làm tốt</h3>
                                            <ul>{detail.result.strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
                                        </div>
                                        <div>
                                            <h3>Điểm cần cải thiện</h3>
                                            <ul>{detail.result.focusAreas.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
                                        </div>
                                    </div>
                                    <h3>Dẫn chứng từ câu trả lời</h3>
                                    <div className="conversation-evidence">
                                        {detail.result.evidence.map((item, index) => (
                                            <blockquote key={`${index}-${item.quote}`}>
                                                “{item.quote}”
                                                <span>{item.observation}</span>
                                            </blockquote>
                                        ))}
                                    </div>
                                    <p className="conversation-disclaimer">{detail.result.disclaimer}</p>
                                </section>
                            )}

                            {detail.session.status === "active" && (
                                <>
                                    <form className="conversation-compose" onSubmit={submitAnswer}>
                                        <label htmlFor="conversation-answer">Câu trả lời của bạn</label>
                                        <textarea
                                            id="conversation-answer"
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value.slice(0, 3000))}
                                            maxLength={3000}
                                            rows={5}
                                            placeholder={detail.session.part === "2" ? "Nhập câu trả lời dài bằng tiếng Anh…" : "Nhập câu trả lời bằng tiếng Anh…"}
                                            disabled={busy}
                                        />
                                        <div className="conversation-compose-actions">
                                            <small>{draft.length}/3.000 · Lượt {detail.session.userTurnCount}/20</small>
                                            <button className="conversation-primary" type="submit" disabled={busy || !draft.trim() || detail.session.userTurnCount >= 20}>
                                                {busy ? "Đang xử lý…" : "Gửi câu trả lời"}
                                            </button>
                                        </div>
                                    </form>
                                    <div className="conversation-end-actions">
                                        <span>Hãy gửi ít nhất hai câu trả lời trước khi kết thúc để nhận góp ý có dẫn chứng.</span>
                                        <button className="conversation-secondary" type="button" onClick={finishSession} disabled={busy || detail.session.userTurnCount < 2}>
                                            Kết thúc và xem nhận xét
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {error && <p className="conversation-error" role="alert">{error}</p>}
                    {!detail && loading && <p className="conversation-muted">Đang tải các buổi luyện…</p>}
                </section>

                <aside className="conversation-card conversation-history">
                    <h2>Các buổi luyện gần đây</h2>
                    {sessions.length === 0 && !loading && <p className="conversation-muted">Các buổi luyện đang diễn ra và đã hoàn thành sẽ xuất hiện tại đây.</p>}
                    {sessions.map((session) => (
                        <button className="conversation-history-item" type="button" key={session._id} onClick={() => openSession(session._id)} disabled={busy}>
                            <strong>{formatSessionLabel(session)}</strong>
                            <span>{session.mode === "topic" && session.topic ? session.topic : "Luyện tự do"}</span>
                            <small>{session.status === "completed" ? "Đã hoàn thành" : `${session.userTurnCount} câu trả lời · Đang luyện`}</small>
                        </button>
                    ))}
                </aside>
            </div>
        </main>
    );
}

export default SpeakingConversationPage;
