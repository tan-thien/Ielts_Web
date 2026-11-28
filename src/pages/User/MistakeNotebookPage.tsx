import { useCallback, useEffect, useState } from "react";
import {
    deleteMistake,
    getMistakeNotebook,
    getMistakeNotebookSources,
    importMistakesFromSubmission,
    recordMistakeReview,
    updateMistake,
} from "../../services/mistakeNotebook.service";
import type {
    MistakeNotebookEntry,
    MistakeNotebookPageResult,
    MistakeNotebookSource,
    MistakeSkill,
    MistakeStatus,
} from "../../types/mistakeNotebook";
import { ieltsSkillName } from "../../utils/ieltsDisplay";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import { FaBook } from "react-icons/fa";
import "./MistakeNotebookPage.css";
import "../../styles/ieltsUtilityDesign.css";

/* eslint-disable react-hooks/set-state-in-effect */

const statusNames: Record<MistakeStatus, string> = {
    New: "Mới",
    Reviewing: "Đang ôn",
    Mastered: "Đã nắm vững",
};

const displayValue = (value: unknown) => {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "—";
    try { return JSON.stringify(value); } catch { return String(value); }
};

const formatDate = (value?: string | null) => value
    ? new Date(value).toLocaleDateString("vi-VN")
    : "Chưa lên lịch";

type EntryProps = {
    entry: MistakeNotebookEntry;
    busy: boolean;
    onSave: (entry: MistakeNotebookEntry, values: { Note: string; Status: MistakeStatus; NextReviewAt: string | null }) => void;
    onReview: (entry: MistakeNotebookEntry, wasCorrect: boolean) => void;
    onDelete: (entry: MistakeNotebookEntry) => void;
};

function MistakeEntry({ entry, busy, onSave, onReview, onDelete }: EntryProps) {
    const [note, setNote] = useState(entry.Note);
    const [status, setStatus] = useState<MistakeStatus>(entry.Status);
    const [reviewDate, setReviewDate] = useState(entry.NextReviewAt?.slice(0, 10) || "");
    const scheduledDate = reviewDate ? new Date(`${reviewDate}T12:00:00`).toISOString() : null;

    return (
        <article className="mistake-card">
            <header className="mistake-card-header">
                <div>
                    <span className="mistake-tag">{ieltsSkillName(entry.Skill)} · {entry.SourceType === "AI" ? "Đánh giá AI" : "Bài tập"}</span>
                    <h2>{entry.ErrorType || `Câu ${entry.QuestionOrder ?? ""}`}</h2>
                    <p className="mistake-source">{entry.SourceTitle || "Bài luyện tập"}{entry.QuestionOrder ? ` · Câu ${entry.QuestionOrder}` : ""}</p>
                </div>
                <span className={`mistake-status status-${entry.Status.toLowerCase()}`}>{statusNames[entry.Status]}</span>
            </header>
            {entry.Question && <p className="mistake-question"><b>Đề bài:</b> {entry.Question}</p>}
            {entry.ErrorQuote && <blockquote>{entry.ErrorQuote}</blockquote>}
            <div className="mistake-answer-grid">
                <div><small>Câu trả lời của bạn</small><p>{displayValue(entry.OriginalAnswer)}</p></div>
                {entry.SourceType === "Assignment" && <div><small>Đáp án chính xác</small><p>{displayValue(entry.CorrectAnswer)}</p></div>}
            </div>
            {entry.Explanation && <p className="mistake-explanation">{entry.Explanation}</p>}
            {entry.Suggestion && <p className="mistake-suggestion"><b>Gợi ý:</b> {entry.Suggestion}</p>}
            <div className="mistake-edit-grid">
                <label>Ghi chú cá nhân
                    <textarea value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} />
                </label>
                <label>Trạng thái
                    <select value={status} onChange={(event) => setStatus(event.target.value as MistakeStatus)}>
                        {Object.entries(statusNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                    </select>
                </label>
                <label>Ôn lại vào
                    <input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} />
                </label>
            </div>
            <p className="mistake-next-review">Lịch ôn: {formatDate(entry.NextReviewAt)}</p>
            <p className="mistake-next-review">
                Đã ôn {entry.ReviewCount ?? 0} lần · nhớ đúng {entry.CorrectReviewCount ?? 0} lần
                {entry.LastReviewedAt ? ` · Lần gần nhất: ${formatDate(entry.LastReviewedAt)}` : ""}
            </p>
            <div className="mistake-actions">
                <button className="primary" disabled={busy} onClick={() => onSave(entry, { Note: note, Status: status, NextReviewAt: scheduledDate })}>Lưu thay đổi</button>
                <button disabled={busy} onClick={() => onReview(entry, true)}>Đã nhớ</button>
                <button disabled={busy} onClick={() => onReview(entry, false)}>Chưa nhớ</button>
                <button className="danger" disabled={busy} onClick={() => onDelete(entry)}>Xóa</button>
            </div>
            {!!entry.ReviewHistory.length && <details className="mistake-history">
                <summary>Lịch sử ôn tập ({entry.ReviewHistory.length})</summary>
                <ol>{[...entry.ReviewHistory].reverse().map((review, index) => (
                    <li key={`${review.ReviewedAt}-${index}`}>
                        {formatDate(review.ReviewedAt)} · {review.WasCorrect === undefined ? "Đã ôn" : review.WasCorrect ? "Nhớ đúng" : "Chưa nhớ"} · {statusNames[review.Status]}
                        {review.Note && ` · ${review.Note}`}
                        {review.NextReviewAt && ` · Ôn lại: ${formatDate(review.NextReviewAt)}`}
                    </li>
                ))}</ol>
            </details>}
        </article>
    );
}

export function MistakeNotebookPage() {
    const [result, setResult] = useState<MistakeNotebookPageResult | null>(null);
    const [sources, setSources] = useState<MistakeNotebookSource[]>([]);
    const [sourceId, setSourceId] = useState("");
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [skill, setSkill] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState("");
    const [sourceError, setSourceError] = useState("");
    const [notice, setNotice] = useState("");

    const loadPage = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMistakeNotebook({ page, limit: 10, search, skill, status });
            setResult(data);
            setError("");
        } catch {
            setError("Không thể tải sổ lỗi cá nhân. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [page, search, skill, status]);

    const loadSources = useCallback(async () => {
        try {
            const data = await getMistakeNotebookSources();
            setSources(data);
            setSourceId((current) => current || data[0]?._id || "");
            setSourceError("");
        } catch (reason) {
            console.error("Không thể tải danh sách bài làm nguồn:", reason);
            setSourceError("Không thể tải danh sách bài làm nguồn. Vui lòng thử lại.");
        }
    }, []);

    useEffect(() => { void loadPage(); }, [loadPage]);
    useEffect(() => { void loadSources(); }, [loadSources]);

    const refresh = async () => {
        await Promise.all([loadPage(), loadSources()]);
    };

    const importSource = async () => {
        if (!sourceId) return;
        setImporting(true);
        setError("");
        setNotice("");
        try {
            const imported = await importMistakesFromSubmission(sourceId);
            setNotice(imported.imported
                ? `Đã thêm ${imported.imported} lỗi${imported.duplicates ? `, bỏ qua ${imported.duplicates} mục trùng` : ""}.`
                : "Không có lỗi mới đủ điều kiện để nhập.");
            await refresh();
        } catch {
            setError("Không thể nhập lỗi từ bài làm này.");
        } finally {
            setImporting(false);
        }
    };

    const saveEntry = async (
        entry: MistakeNotebookEntry,
        values: { Note: string; Status: MistakeStatus; NextReviewAt: string | null },
    ) => {
        setBusyId(entry._id);
        setError("");
        try {
            await updateMistake(entry._id, values);
            await loadPage();
            setNotice("Đã lưu ghi chú và lịch ôn.");
        } catch { setError("Không thể cập nhật lỗi này."); }
        finally { setBusyId(""); }
    };

    const reviewEntry = async (
        entry: MistakeNotebookEntry,
        wasCorrect: boolean,
    ) => {
        setBusyId(entry._id);
        setError("");
        try {
            await recordMistakeReview(entry._id, { WasCorrect: wasCorrect });
            await loadPage();
            setNotice(wasCorrect ? "Đã ghi nhận câu trả lời đúng và cập nhật lịch ôn." : "Đã ghi nhận câu trả lời chưa đúng và lên lịch ôn lại.");
        } catch { setError("Không thể ghi lại lần ôn tập."); }
        finally { setBusyId(""); }
    };

    const deleteEntry = async (entry: MistakeNotebookEntry) => {
        if (!window.confirm("Xóa lỗi này khỏi sổ cá nhân?")) return;
        setBusyId(entry._id);
        setError("");
        try {
            await deleteMistake(entry._id);
            await loadPage();
            setNotice("Đã xóa lỗi khỏi sổ.");
        } catch { setError("Không thể xóa lỗi này."); }
        finally { setBusyId(""); }
    };

    const applySearch = () => {
        setPage(1);
        setSearch(searchText.trim());
    };

    return (
        <main className="mistake-notebook-page">
            <UtilityPageHeader
                eyebrow="Công cụ học IELTS"
                title="Sổ lỗi sai của bạn"
                description="Hiểu lỗi, ghi chú cách sửa và ôn lại đúng thời điểm."
                icon={<FaBook />}
                actions={<button type="button" className="progress-primary-link" onClick={() => document.querySelector(".mistake-toolbar")?.scrollIntoView({ behavior: "smooth" })}>Ôn lỗi cần cải thiện</button>}
            />
            {!loading && result && (
                <section className="mistake-overview" aria-label="Tổng quan sổ lỗi">
                    {([
                        ["Tổng lỗi", result.total],
                        ["Mới trên trang", result.items.filter(item => item.Status === "New").length],
                        ["Đang ôn trên trang", result.items.filter(item => item.Status === "Reviewing").length],
                        ["Đã nắm trên trang", result.items.filter(item => item.Status === "Mastered").length],
                    ] as const).map(([label, value]) => (
                        <article key={label}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                        </article>
                    ))}
                </section>
            )}
            <section className="mistake-import-panel">
                <div>
                    <h2>Nhập lỗi từ bài đã hoàn thành</h2>
                    <p>Chỉ nhập câu Reading/Listening được đối chiếu với đáp án đúng hoặc lỗi có sẵn trong đánh giá AI thành công.</p>
                </div>
                <div className="mistake-import-controls">
                    <select aria-label="Chọn bài làm nguồn" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
                        {!sources.length &&                         <option value="">Không có bài đủ điều kiện</option>}
                        {sources.map((source) => <option key={source._id} value={source._id}>
                            {ieltsSkillName(source.Skill)} · {source.SourceTitle} · {source.ImportableCount} lỗi
                        </option>)}
                    </select>
                    <button className="primary" disabled={!sourceId || importing} onClick={() => void importSource()}>
                        {importing ? "Đang nhập…" : "Nhập lỗi"}
                    </button>
                </div>
                {sourceError && <p className="mistake-message error" role="alert">{sourceError}</p>}
            </section>
            <section className="mistake-toolbar" aria-label="Lọc sổ lỗi">
                <form className="mistake-search" onSubmit={(event) => { event.preventDefault(); applySearch(); }}>
                    <input aria-label="Tìm trong sổ lỗi" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Tìm câu hỏi, ghi chú, lỗi…" />
                    <button type="submit">Tìm</button>
                </form>
                <select aria-label="Lọc theo kỹ năng" value={skill} onChange={(event) => { setPage(1); setSkill(event.target.value); }}>
                    <option value="">Tất cả kỹ năng</option>
                    {(["Reading", "Listening", "Writing", "Speaking"] as MistakeSkill[]).map((value) => <option key={value} value={value}>{ieltsSkillName(value)}</option>)}
                </select>
                <select aria-label="Lọc theo trạng thái" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(statusNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                </select>
            </section>
            {error && <div className="mistake-message error" role="alert">{error}</div>}
            {notice && <div className="mistake-message success" role="status">{notice}</div>}
            {loading ? <div className="mistake-empty">Đang tải sổ lỗi…</div> : (
                <>
                    <div className="mistake-results-count">{result?.total ?? 0} lỗi đã lưu</div>
                    {result?.items.length
                        ? <div className="mistake-list">{result.items.map((entry) => (
                            <MistakeEntry key={`${entry._id}-${entry.updatedAt}`} entry={entry} busy={busyId === entry._id} onSave={saveEntry} onReview={reviewEntry} onDelete={deleteEntry} />
                        ))}</div>
                        : <div className="mistake-empty">Chưa có lỗi phù hợp. Hãy nhập từ một bài làm đã hoàn thành.</div>}
                    {!!result && result.totalPages > 1 && <nav className="mistake-pagination" aria-label="Phân trang sổ lỗi">
                        <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trước</button>
                        <span>Trang {result.page} / {result.totalPages}</span>
                        <button disabled={page >= result.totalPages} onClick={() => setPage((current) => current + 1)}>Sau</button>
                    </nav>}
                </>
            )}
        </main>
    );
}

export default MistakeNotebookPage;
