import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { KeyboardEvent } from "react";
import { FaBookmark, FaRandom } from "react-icons/fa";
import {
    createVocabularyFlashcardSet,
    deleteVocabularyFlashcardSet,
    getSavedVocabulary,
    getVocabularyFlashcardSets,
    getVocabularyReviewCards,
    getVocabularyReviewHistory,
    getVocabularyTopics,
    removeSavedVocabulary,
    saveVocabularyWord,
    submitVocabularyReview,
} from "../../services/vocabulary.service";
import type {
    SavedVocabulary,
    VocabularyFlashcardSet,
    VocabularyPageResult,
    VocabularyReviewCard,
    VocabularyReviewHistory,
    VocabularyReviewMode,
    VocabularyReviewRating,
    VocabularyTopic,
} from "../../types/vocabulary";
import { getVocabularySenses } from "../../utils/vocabulary";
import "./VocabularyStudyPages.css";
import "../../styles/ieltsUtilityDesign.css";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import { FaLayerGroup, FaBrain } from "react-icons/fa";

/* eslint-disable react-hooks/set-state-in-effect */

const pageSize = 50;
const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const errorText = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    return /[À-ỹĐđ]/.test(message) ? message : "Không thể tải dữ liệu. Vui lòng thử lại.";
};

type SessionProps = {
    cards: VocabularyReviewCard[];
    onSubmit: (wordId: string, rating: VocabularyReviewRating) => Promise<void>;
    savedIds: string[];
    onToggleFavorite: (wordId: string, isSaved: boolean) => Promise<boolean>;
};

const shuffled = <T,>(items: T[]) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
};

function ReviewSession({ cards, onSubmit, savedIds, onToggleFavorite }: SessionProps) {
    const [queue, setQueue] = useState(cards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [favoriteBusy, setFavoriteBusy] = useState(false);
    const [favorites, setFavorites] = useState(() => new Set(savedIds));
    const [error, setError] = useState("");

    useEffect(() => {
        setQueue(cards);
        setCurrentIndex(0);
        setRevealed(false);
    }, [cards]);
    useEffect(() => { setFavorites(new Set(savedIds)); }, [savedIds]);
    const card = queue[currentIndex];
    const toggleRevealed = () => setRevealed((value) => !value);
    const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleRevealed();
        }
    };
    const rate = async (rating: VocabularyReviewRating) => {
        if (!card || busy) return;
        setBusy(true);
        setError("");
        try {
            await onSubmit(card.Word._id, rating);
            const remaining = queue.length - 1;
            setQueue(items => items.filter((item) => item.Word._id !== card.Word._id));
            setCurrentIndex((index) => index >= remaining ? Math.max(0, remaining - 1) : index);
            setRevealed(false);
        } catch (reason) {
            setError(errorText(reason));
        } finally {
            setBusy(false);
        }
    };

    const toggleFavorite = async () => {
        if (!card || favoriteBusy) return;
        const isSaved = favorites.has(card.Word._id);
        setFavoriteBusy(true);
        setError("");
        try {
            const nextState = await onToggleFavorite(card.Word._id, isSaved);
            setFavorites((current) => {
                const next = new Set(current);
                if (nextState) next.add(card.Word._id);
                else next.delete(card.Word._id);
                return next;
            });
        } catch (reason) {
            setError(errorText(reason));
        } finally {
            setFavoriteBusy(false);
        }
    };

    if (!card) return <div className="study-empty">Đã hoàn thành các thẻ trong trang này. Chọn trang khác hoặc đổi chế độ ôn tập.</div>;
    const word = card.Word;
    const topic = typeof word.TopicID === "string" ? "" : word.TopicID?.Name;
    const senses = getVocabularySenses(word);

    return (
        <section className="study-session">
            <div className="study-progress"><span>{queue.length} thẻ còn lại · thẻ {currentIndex + 1} / {queue.length}</span><span>{topic || (card.Due ? "Đến hạn ôn" : "Từ đã lưu")}</span></div>
            <div className="study-session-actions">
                <button type="button" disabled={currentIndex === 0} onClick={() => { setCurrentIndex(index => index - 1); setRevealed(false); }}>Trước</button>
                <button type="button" onClick={() => { setQueue(items => shuffled(items)); setCurrentIndex(0); setRevealed(false); }} disabled={queue.length < 2}><FaRandom /> Xáo trộn</button>
                <button type="button" onClick={() => void toggleFavorite()} disabled={favoriteBusy}>
                    <FaBookmark /> {favorites.has(word._id) ? "Đã lưu · bỏ lưu" : "Lưu từ"}
                </button>
                <button type="button" disabled={currentIndex >= queue.length - 1} onClick={() => { setCurrentIndex(index => index + 1); setRevealed(false); }}>Tiếp</button>
            </div>
            <div className={`study-flashcard ${revealed ? "revealed" : ""}`} role="button" tabIndex={0} onClick={toggleRevealed} onKeyDown={handleCardKeyDown} aria-expanded={revealed} aria-label={revealed ? "Ẩn mặt sau" : "Lật thẻ để xem nghĩa"}>
                <span className="study-card-hint">{revealed ? "MẶT SAU · NHẤN ĐỂ ẨN" : "MẶT TRƯỚC · NHẤN ĐỂ LẬT"}</span>
                <strong>{word.Word}</strong>
                {word.Pronunciation && <span className="study-pronunciation">/{word.Pronunciation.replace(/^\/+|\/+$/g, "")}/</span>}
                {revealed && <div className="study-card-answer">
                    {senses.map((sense, index) => <div className="study-sense" key={`${word._id}-${index}`}>
                        <span>{index + 1}{sense.PartOfSpeech ? ` · ${sense.PartOfSpeech}` : ""}</span>
                        <p>{sense.Meaning}</p>
                        <p className="study-translation">{sense.Translation || "Chưa có bản dịch tiếng Việt."}</p>
                        {sense.Example ? <small>“{sense.Example}”{sense.ExampleTranslation ? ` — ${sense.ExampleTranslation}` : ""}</small> : <small>Nguồn từ điển không cung cấp ví dụ cho nghĩa này.</small>}
                    </div>)}
                </div>}
            </div>
            {error && <p className="study-error" role="alert">{error}</p>}
            <div className="study-rating">
                <p>Đánh giá mức độ ghi nhớ</p>
                <div>
                    {([
                        ["again", "Chưa nhớ", "10 phút"],
                        ["hard", "Khó", "1 ngày+"],
                        ["good", "Đã nhớ", "Theo lịch"],
                        ["easy", "Nhớ rõ", "4 ngày+"],
                    ] as const).map(([rating, label, interval]) => <button key={rating} type="button" disabled={!revealed || busy} onClick={() => void rate(rating)}><b>{label}</b><small>{interval}</small></button>)}
                </div>
                {!revealed && <small>Lật thẻ trước khi đánh giá để xem nghĩa và ví dụ.</small>}
            </div>
        </section>
    );
}

function PageControls({ result, page, onPage }: { result: VocabularyPageResult<unknown> | null; page: number; onPage: (page: number) => void }) {
    if (!result || result.pages <= 1) return null;
    return <div className="study-pagination"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trang trước</button><span>Trang {page} / {result.pages} · {result.total} mục</span><button type="button" disabled={page >= result.pages} onClick={() => onPage(page + 1)}>Trang sau</button></div>;
}

export function FlashcardsPage() {
    const [sets, setSets] = useState<VocabularyPageResult<VocabularyFlashcardSet> | null>(null);
    const [saved, setSaved] = useState<SavedVocabulary[]>([]);
    const [topics, setTopics] = useState<VocabularyTopic[]>([]);
    const [quickTopicId, setQuickTopicId] = useState("");
    const [quickCount, setQuickCount] = useState(20);
    const [quickCards, setQuickCards] = useState<VocabularyReviewCard[] | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [setPage, setSetPage] = useState(1);
    const [practice, setPractice] = useState<{ setId: string; page: number; result: VocabularyPageResult<VocabularyReviewCard> } | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const savedIds = useMemo(() => saved.filter((item) => item.WordID?._id).map((item) => item.WordID._id), [saved]);

    const loadSets = async (page = setPage) => setSets(await getVocabularyFlashcardSets(page, 20));
    useEffect(() => {
        let active = true;
        Promise.all([getVocabularyFlashcardSets(1, 20), getSavedVocabulary(), getVocabularyTopics()])
            .then(([setData, savedData, topicData]) => { if (active) { setSets(setData); setSaved(savedData); setTopics(topicData); } })
            .catch(reason => { if (active) setError(errorText(reason)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const createSet = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim() || !selected.length || busy) return;
        setBusy(true);
        setError("");
        try {
            await createVocabularyFlashcardSet({ Name: name.trim(), Description: description.trim(), WordIDs: selected });
            setName(""); setDescription(""); setSelected([]);
            setSetPage(1);
            await loadSets(1);
        } catch (reason) { setError(errorText(reason)); }
        finally { setBusy(false); }
    };

    const openSet = async (setId: string, page = 1) => {
        setBusy(true);
        setError("");
        try {
            const result = await getVocabularyReviewCards({ mode: "saved", setId, page, limit: pageSize });
            setPractice({ setId, page, result });
        } catch (reason) { setError(errorText(reason)); }
        finally { setBusy(false); }
    };
    const openQuickStudy = async () => {
        setBusy(true);
        setError("");
        try {
            const result = await getVocabularyReviewCards({
                mode: quickTopicId ? "topic" : "all",
                topicId: quickTopicId || undefined,
                page: 1,
                limit: Math.max(1, Math.min(50, quickCount)),
            });
            setQuickCards(result.items);
        } catch (reason) {
            setError(errorText(reason));
        } finally {
            setBusy(false);
        }
    };
    const submit = async (wordId: string, rating: VocabularyReviewRating) => { await submitVocabularyReview(wordId, rating, requestId()); };
    const toggleFavorite = async (wordId: string, isSaved: boolean) => {
        if (isSaved) {
            await removeSavedVocabulary(wordId);
            setSaved((items) => items.filter((item) => item.WordID?._id !== wordId));
            return false;
        }
        const item = await saveVocabularyWord(wordId);
        setSaved((items) => [item, ...items.filter((current) => current.WordID?._id !== wordId)]);
        return true;
    };
    const removeSet = async (setId: string) => {
        if (!window.confirm("Xóa bộ thẻ này? Từ vựng và lịch sử ôn tập của bạn vẫn được giữ nguyên.")) return;
        try { await deleteVocabularyFlashcardSet(setId); await loadSets(); }
        catch (reason) { setError(errorText(reason)); }
    };

    return <main className="vocab-study-page">
        <UtilityPageHeader
            eyebrow="Từ vựng IELTS"
            title="Học từ vựng với Flashcards"
            description="Học theo chủ đề hoặc toàn bộ Vocabulary Master, không bắt buộc lưu yêu thích."
            icon={<FaLayerGroup />}
        />
        {error && <div className="study-error" role="alert">{error}</div>}
        {practice ? <>
            <div className="study-section-heading"><div><h2>Đang ôn bộ thẻ</h2><p>Thẻ chỉ chứa những từ đang có trong danh sách đã lưu.</p></div><button type="button" onClick={() => setPractice(null)}>Quay lại bộ thẻ</button></div>
            <ReviewSession key={`${practice.setId}-${practice.page}`} cards={practice.result.items} onSubmit={submit} savedIds={savedIds} onToggleFavorite={toggleFavorite} />
            <PageControls result={practice.result} page={practice.page} onPage={page => void openSet(practice.setId, page)} />
        </> : <>
            {quickCards ? (
                <section className="study-panel">
                    <div className="study-section-heading">
                        <div><h2>Học nhanh từ Vocabulary Master</h2><p>Tiến độ được lưu riêng và không yêu cầu lưu từ yêu thích.</p></div>
                        <button type="button" onClick={() => setQuickCards(null)}>Quay lại</button>
                    </div>
                    <ReviewSession cards={quickCards} onSubmit={submit} savedIds={savedIds} onToggleFavorite={toggleFavorite} />
                </section>
            ) : (
                <section className="study-panel">
                    <div className="study-section-heading"><div><h2>Học nhanh</h2><p>Chọn chủ đề hoặc học trực tiếp từ toàn bộ kho từ chung.</p></div></div>
                    <div className="study-review-filters">
                        <label>Chủ đề
                            <select value={quickTopicId} onChange={(event) => setQuickTopicId(event.target.value)}>
                                <option value="">Toàn bộ Vocabulary Master</option>
                                {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.Name}</option>)}
                            </select>
                        </label>
                        <label>Số thẻ
                            <input type="number" min="1" max="50" value={quickCount} onChange={(event) => setQuickCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} />
                        </label>
                    </div>
                    <button type="button" className="study-primary" onClick={() => void openQuickStudy()} disabled={busy}>{busy ? "Đang tải..." : "Bắt đầu học nhanh"}</button>
                </section>
            )}
            <section className="study-panel">
                <div className="study-section-heading"><div><h2>Tạo bộ thẻ</h2><p>Chọn các từ đã lưu để thêm vào bộ thẻ mới.</p></div><span>{selected.length} từ chọn</span></div>
                <form className="study-create-form" onSubmit={event => void createSet(event)}>
                    <label>Tên bộ thẻ<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="Ví dụ: Môi trường - Bài viết IELTS" /></label>
                    <label>Mô tả<textarea maxLength={500} value={description} onChange={event => setDescription(event.target.value)} placeholder="Mục tiêu ôn tập (không bắt buộc)" /></label>
                    <div className="study-word-picker">
                        {saved.length ? saved.filter(item => item.WordID?._id).map(item => <label key={item.WordID._id}><input type="checkbox" checked={selected.includes(item.WordID._id)} onChange={event => setSelected(ids => event.target.checked ? [...new Set([...ids, item.WordID._id])] : ids.filter(id => id !== item.WordID._id))} /><span><b>{item.WordID.Word}</b><small>{item.WordID.Translation}</small></span></label>) :                         <p>Bạn chưa lưu từ nào. Hãy lưu từ trong trang Từ vựng trước khi tạo thẻ.</p>}
                    </div>
                    <button className="study-primary" disabled={busy || !selected.length}>{busy ? "Đang lưu..." : "Tạo bộ thẻ"}</button>
                </form>
            </section>
            <section className="study-panel">
                <div className="study-section-heading"><div><h2>Bộ thẻ đã tạo</h2><p>{sets?.total ?? 0} bộ thẻ trong tài khoản của bạn.</p></div></div>
                {loading ? <p className="study-empty">Đang tải bộ thẻ...</p> : sets?.items.length ? <div className="study-set-list">{sets.items.map(set => <article key={set._id} className="study-set">
                    <div><h3>{set.Name}</h3><p>{set.Description || "Bộ từ vựng cá nhân"} · {set.WordIDs.length} thẻ</p></div>
                    <div><button type="button" className="study-primary" disabled={busy || !set.WordIDs.length} onClick={() => void openSet(set._id)}>Ôn tập</button><button type="button" className="study-danger" onClick={() => void removeSet(set._id)}>Xóa</button></div>
                </article>)}</div> : <p className="study-empty">Chưa có bộ thẻ nào. Tạo bộ đầu tiên từ các từ đã lưu.</p>}
                <PageControls result={sets} page={setPage} onPage={page => { setSetPage(page); void loadSets(page); }} />
            </section>
        </>}
    </main>;
}

export function VocabularyReviewPage() {
    const [topics, setTopics] = useState<VocabularyTopic[]>([]);
    const [mode, setMode] = useState<VocabularyReviewMode>("due");
    const [topicId, setTopicId] = useState("");
    const [dueOnly, setDueOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [cards, setCards] = useState<VocabularyPageResult<VocabularyReviewCard> | null>(null);
    const [history, setHistory] = useState<VocabularyPageResult<VocabularyReviewHistory> | null>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const [savedWords, setSavedWords] = useState<SavedVocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const queryReady = mode !== "topic" || Boolean(topicId);
    const savedIds = useMemo(() => savedWords.filter((item) => item.WordID?._id).map((item) => item.WordID._id), [savedWords]);

    useEffect(() => {
        let active = true;
        getVocabularyTopics().then(items => { if (active) setTopics(items); }).catch(reason => { if (active) setError(errorText(reason)); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        let active = true;
        getSavedVocabulary().then(items => { if (active) setSavedWords(items); }).catch(reason => { if (active) setError(errorText(reason)); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!queryReady) { setCards(null); setLoading(false); return; }
        let active = true;
        setLoading(true); setError("");
        getVocabularyReviewCards({ mode, topicId: mode === "topic" ? topicId : undefined, dueOnly: dueOnly || undefined, page, limit: pageSize })
            .then(result => { if (active) setCards(result); })
            .catch(reason => { if (active) setError(errorText(reason)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [mode, topicId, dueOnly, page, queryReady]);
    useEffect(() => {
        let active = true;
        getVocabularyReviewHistory(historyPage, 10).then(result => { if (active) setHistory(result); }).catch(reason => { if (active) setError(errorText(reason)); });
        return () => { active = false; };
    }, [historyPage]);

    const submit = async (wordId: string, rating: VocabularyReviewRating) => {
        await submitVocabularyReview(wordId, rating, requestId());
        setCards(current => current ? { ...current, items: current.items.filter(item => item.Word._id !== wordId), total: Math.max(0, current.total - 1) } : current);
        if (mode === "due" || dueOnly) {
            setPage(1);
            try {
                const refreshed = await getVocabularyReviewCards({ mode, topicId: mode === "topic" ? topicId : undefined, dueOnly: dueOnly || undefined, page: 1, limit: pageSize });
                setCards(refreshed);
            } catch (reason) { setError(`Đã ghi nhận lần ôn, nhưng không thể tải thẻ tiếp theo: ${errorText(reason)}`); }
        }
        setHistoryPage(1);
        try {
            const latest = await getVocabularyReviewHistory(1, 10);
            setHistory(latest);
        } catch { setError("Đã ghi nhận lần ôn, nhưng chưa thể cập nhật lịch sử."); }
    };
    const toggleFavorite = async (wordId: string, isSaved: boolean) => {
        if (isSaved) {
            await removeSavedVocabulary(wordId);
            setSavedWords((items) => items.filter((item) => item.WordID?._id !== wordId));
            return false;
        }
        const item = await saveVocabularyWord(wordId);
        setSavedWords((items) => [item, ...items.filter((current) => current.WordID?._id !== wordId)]);
        return true;
    };

    return <main className="vocab-study-page">
        <UtilityPageHeader
            eyebrow="Ôn tập thông minh"
            title="Ôn từ vựng đúng thời điểm"
            description="Ưu tiên từ đến hạn, từ thường trả lời sai và từ mới; không yêu cầu lưu yêu thích."
            icon={<FaBrain />}
        />
        {cards && (
            <section className="vocabulary-review-overview" aria-label="Tổng quan ôn từ vựng">
                <article><span>Đến hạn</span><strong>{cards.items.filter(card => card.Due).length}</strong></article>
                <article><span>Từ mới</span><strong>{cards.items.filter(card => !card.Review).length}</strong></article>
                <article><span>Đang học</span><strong>{cards.items.filter(card => card.Review && card.Review.CurrentStatus !== "Mastered").length}</strong></article>
                <article><span>Đã thành thạo</span><strong>{cards.items.filter(card => card.Review?.CurrentStatus === "Mastered").length}</strong></article>
            </section>
        )}
        {error && <div className="study-error" role="alert">{error}</div>}
        <section className="study-panel">
            <div className="study-section-heading"><div><h2>Chọn lượt ôn</h2><p>{cards?.total ?? 0} thẻ trong chế độ hiện tại.</p></div></div>
            <div className="study-review-filters">
                <label>Chế độ<select value={mode} onChange={event => { setMode(event.target.value as VocabularyReviewMode); setPage(1); }}><option value="due">Đến hạn</option><option value="all">Toàn bộ Vocabulary Master</option><option value="saved">Tất cả từ đã lưu</option><option value="topic">Theo chủ đề</option></select></label>
                {mode === "topic" && <label>Chủ đề<select value={topicId} onChange={event => { setTopicId(event.target.value); setPage(1); }}><option value="">Chọn chủ đề</option>{topics.map(topic => <option key={topic._id} value={topic._id}>{topic.Name}</option>)}</select></label>}
                {mode !== "due" && <label className="study-checkbox"><input type="checkbox" checked={dueOnly} onChange={event => { setDueOnly(event.target.checked); setPage(1); }} /> Chỉ xem từ đến hạn</label>}
            </div>
        </section>
        {loading ? <p className="study-empty">Đang tải lượt ôn...</p> : cards && <ReviewSession key={`${mode}-${topicId}-${dueOnly}-${page}`} cards={cards.items} onSubmit={submit} savedIds={savedIds} onToggleFavorite={toggleFavorite} />}
        {mode !== "due" && !dueOnly && <PageControls result={cards} page={page} onPage={setPage} />}
        <section className="study-panel study-history">
            <div className="study-section-heading"><div><h2>Lịch sử ôn tập</h2><p>Các lần ôn gần đây của bạn.</p></div></div>
            {history?.items.length ? <div className="study-history-list">{history.items.map(item => <article key={item._id}><div><b>{item.WordID?.Word || "Từ đã bị gỡ"}</b><small>{new Date(item.ReviewedAt).toLocaleString("vi-VN")}</small></div><span className={`rating-${item.Rating}`}>{({ again: "Chưa nhớ", hard: "Khó", good: "Tốt", easy: "Dễ" })[item.Rating]}</span></article>)}</div> : <p className="study-empty">Chưa có lịch sử ôn tập.</p>}
            <PageControls result={history} page={historyPage} onPage={setHistoryPage} />
        </section>
    </main>;
}

export default FlashcardsPage;
