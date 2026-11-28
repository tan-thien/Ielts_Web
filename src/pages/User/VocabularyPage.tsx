import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBookmark, FaCheck, FaLanguage, FaSearch } from "react-icons/fa";
import axios from "axios";
import {
    getSavedVocabulary,
    getVocabularyTopics,
    getVocabularyWordPage,
    removeSavedVocabulary,
    saveExternalVocabularyWord,
    saveVocabularyWord,
    searchExternalVocabulary,
    translateVocabulary,
    updateSavedVocabulary,
} from "../../services/vocabulary.service";
import type { SavedVocabulary, VocabularyPageResult, VocabularyTopic, VocabularyTranslation, VocabularyWord } from "../../types/vocabulary";
import { getVocabularySenses } from "../../utils/vocabulary";
import ListPagination from "../../components/ListPagination";
import "./VocabularyPage.css";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import { FaBook } from "react-icons/fa";

/* eslint-disable react-hooks/set-state-in-effect */

const pageSize = 50;

const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || fallback
        : error instanceof Error ? error.message : fallback;

type WordCardProps = {
    word: VocabularyWord;
    saved?: SavedVocabulary;
    onSave: () => void;
    onTranslate: () => void;
    translation?: VocabularyTranslation;
    onNote: (item: SavedVocabulary) => void;
    onToggleLearned: (item: SavedVocabulary) => void;
};

function WordCard({ word, saved, onSave, onTranslate, translation, onNote, onToggleLearned }: WordCardProps) {
    const senses = translation?.senses?.length ? translation.senses : getVocabularySenses(word);
    const topicName = typeof word.TopicID === "string" ? "Từ điển bên ngoài" : word.TopicID?.Name ?? "Từ vựng IELTS";

    return (
        <article className="vocab-card">
            <div className="vocab-card-top">
                <span className="vocab-topic">{topicName}</span>
                <button className={`bookmark-button ${saved ? "saved" : ""}`} onClick={onSave} title={saved ? "Bỏ lưu" : "Lưu từ"} aria-label={saved ? "Bỏ lưu từ" : "Lưu từ"}>
                    <FaBookmark />
                </button>
            </div>
            <h2>{word.Word}</h2>
            {word.Pronunciation && <div className="pronunciation">/{word.Pronunciation.replace(/^\/+|\/+$/g, "")}/</div>}
            <div className="sense-list">
                {senses.map((sense, index) => (
                    <div className="sense-item" key={`${word.Word}-${index}`}>
                        <div className="vocab-meta"><span>{index + 1}</span>{sense.PartOfSpeech && <span>{sense.PartOfSpeech}</span>}</div>
                        <p><b>Định nghĩa:</b> {sense.Meaning}</p>
                        <p className="translation"><b>Dịch nghĩa:</b> {sense.Translation || "Chưa có bản dịch tiếng Việt."}</p>
                        {sense.Example
                            ? <div className="example"><b>Ví dụ:</b> “{sense.Example}”<small>{sense.ExampleTranslation || "Chưa có bản dịch ví dụ."}</small></div>
                            : <p className="vocab-source-note">Nguồn từ điển không cung cấp ví dụ cho nghĩa này.</p>}
                    </div>
                ))}
            </div>
            <div className="vocab-actions">
                <button type="button" onClick={onTranslate}><FaLanguage /> Tra lại từ điển</button>
                {saved && <button type="button" onClick={() => onNote(saved)}>Ghi chú</button>}
                {saved && <button type="button" className={saved.IsLearned ? "learned" : ""} onClick={() => onToggleLearned(saved)}>
                    {saved.IsLearned ? <FaCheck /> : null}{saved.IsLearned ? "Đã học" : "Đánh dấu đã học"}
                </button>}
            </div>
            {saved?.Note && <p className="vocab-saved-note"><b>Ghi chú của bạn:</b> {saved.Note}</p>}
            {translation && <div className="ai-translation"><b>Kết quả tra cứu mới</b><p>{translation.translation || "Chưa có bản dịch từ điển cho từ này."}</p></div>}
        </article>
    );
}

function VocabularyPage() {
    const [topics, setTopics] = useState<VocabularyTopic[]>([]);
    const [wordPageResult, setWordPageResult] = useState<VocabularyPageResult<VocabularyWord> | null>(null);
    const [saved, setSaved] = useState<SavedVocabulary[]>([]);
    const [topicId, setTopicId] = useState("");
    const [search, setSearch] = useState("");
    const [wordPage, setWordPage] = useState(1);
    const [savedPage, setSavedPage] = useState(1);
    const [tab, setTab] = useState<"topics" | "saved">("topics");
    const [translation, setTranslation] = useState<Record<string, VocabularyTranslation>>({});
    const [externalWord, setExternalWord] = useState<VocabularyWord | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const [savedError, setSavedError] = useState("");
    const [editingNote, setEditingNote] = useState<SavedVocabulary | null>(null);
    const [noteDraft, setNoteDraft] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getVocabularyTopics()
            .then((topicData) => { if (active) setTopics(topicData); })
            .catch((reason: unknown) => { if (active) setError(getErrorMessage(reason, "Không thể tải danh sách chủ đề.")); })
            .finally(() => { if (active) setLoading(false); });
        getSavedVocabulary()
            .then((savedData) => { if (active) { setSaved(savedData); setSavedError(""); } })
            .catch((reason: unknown) => { if (active) setSavedError(getErrorMessage(reason, "Không thể tải trạng thái từ đã lưu.")); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (tab !== "topics" || !topicId) return;
        let active = true;
        const timer = window.setTimeout(() => {
            setLoading(true);
            setError("");
            getVocabularyWordPage({ topicId, search: search.trim() || undefined, page: wordPage, limit: pageSize })
                .then((result) => { if (active) setWordPageResult(result); })
                .catch((reason: unknown) => { if (active) setError(getErrorMessage(reason, "Không thể tải từ vựng trong chủ đề.")); })
                .finally(() => { if (active) setLoading(false); });
        }, 220);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [tab, topicId, search, wordPage]);

    useEffect(() => {
        if (tab !== "saved") return;
        let active = true;
        setLoadingSaved(true);
        setSavedError("");
        getSavedVocabulary()
            .then((items) => { if (active) setSaved(items); })
            .catch((reason: unknown) => { if (active) setSavedError(getErrorMessage(reason, "Không thể tải danh sách từ đã lưu.")); })
            .finally(() => { if (active) setLoadingSaved(false); });
        return () => { active = false; };
    }, [tab]);

    const visibleSaved = useMemo(() => saved.filter((item) => {
        if (!item.WordID) return false;
        const query = search.toLocaleLowerCase("vi");
        return !query || item.WordID.Word.toLocaleLowerCase("vi").includes(query)
            || getVocabularySenses(item.WordID).some((sense) =>
                `${sense.Translation} ${sense.Meaning}`.toLocaleLowerCase("vi").includes(query)
            );
    }), [saved, search]);
    const savedById = useMemo(
        () => new Map(saved.filter((item) => item.WordID).map((item) => [item.WordID._id, item])),
        [saved]
    );
    const savedPageCount = Math.max(1, Math.ceil(visibleSaved.length / pageSize));
    const currentSavedPage = Math.min(savedPage, savedPageCount);
    const visibleSavedPage = visibleSaved.slice((currentSavedPage - 1) * pageSize, currentSavedPage * pageSize);

    const chooseTopic = (id: string) => {
        setExternalWord(null);
        setSearch("");
        setWordPage(1);
        setWordPageResult(null);
        setLoading(true);
        setTopicId(id);
        setTab("topics");
    };

    const save = async (word: VocabularyWord) => {
        try {
            const existing = word._id ? savedById.get(word._id) : saved.find((item) => item.WordID?.Word.toLowerCase() === word.Word.toLowerCase());
            if (existing) {
                await removeSavedVocabulary(existing.WordID._id);
                setSaved((items) => items.filter((item) => item._id !== existing._id));
            } else {
                const item = word._id ? await saveVocabularyWord(word._id) : await saveExternalVocabularyWord(word.Word);
                setSaved((items) => [item, ...items.filter((current) => current._id !== item._id)]);
            }
            setError("");
        } catch (reason) {
            setError(getErrorMessage(reason, "Không thể cập nhật danh sách từ đã lưu."));
        }
    };

    const translate = async (word: VocabularyWord) => {
        try {
            const result = await translateVocabulary(word.Word, word.Meaning);
            setTranslation((items) => ({ ...items, [word._id || word.Word]: result }));
        } catch (reason) {
            setError(getErrorMessage(reason, "Không thể tra cứu từ này lúc này."));
        }
    };

    const searchOutside = async () => {
        if (!search.trim()) return;
        setSearching(true);
        setError("");
        try {
            setExternalWord(await searchExternalVocabulary(search.trim()));
        } catch (reason) {
            setExternalWord(null);
            setError(getErrorMessage(reason, "Không tìm thấy từ trong từ điển bên ngoài."));
        } finally {
            setSearching(false);
        }
    };

    const saveNote = async () => {
        if (!editingNote || savingNote) return;
        setSavingNote(true);
        setError("");
        try {
            const result = await updateSavedVocabulary(editingNote.WordID._id, { Note: noteDraft });
            setSaved((items) => items.map((item) => item._id === editingNote._id ? result : item));
            setEditingNote(null);
        } catch (reason) {
            setError(getErrorMessage(reason, "Không thể lưu ghi chú."));
        } finally {
            setSavingNote(false);
        }
    };

    const toggleLearned = async (item: SavedVocabulary) => {
        try {
            const result = await updateSavedVocabulary(item.WordID._id, { IsLearned: !item.IsLearned });
            setSaved((items) => items.map((current) => current._id === item._id ? result : current));
        } catch (reason) {
            setError(getErrorMessage(reason, "Không thể cập nhật trạng thái học từ."));
        }
    };

    const listWords = wordPageResult?.items || [];
    const savedWordCard = (word: VocabularyWord) => {
        const savedItem = (word._id && savedById.get(word._id))
            || saved.find((item) => item.WordID?.Word.toLowerCase() === word.Word.toLowerCase());
        return (
            <WordCard
                key={word._id || word.Word}
                word={word}
                saved={savedItem}
                onSave={() => void save(word)}
                onTranslate={() => void translate(word)}
                translation={translation[word._id || word.Word]}
                onNote={(item) => { setEditingNote(item); setNoteDraft(item.Note); }}
                onToggleLearned={(item) => void toggleLearned(item)}
            />
        );
    };

    return (
        <main className="vocab-page">
            <UtilityPageHeader
                eyebrow="Từ vựng IELTS"
                title="Học từ vựng theo chủ đề"
                description="Học đủ các nghĩa từ nguồn tra cứu, lưu lại từ cần nhớ và tự đánh dấu tiến độ."
                icon={<FaBook />}
            />
            <div className="vocab-toolbar">
                <div className="vocab-search">
                    <FaSearch aria-hidden="true" />
                    <input
                        aria-label="Tìm từ vựng"
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); setWordPage(1); setSavedPage(1); setLoading(Boolean(topicId)); }}
                        onKeyDown={(event) => { if (event.key === "Enter") void searchOutside(); }}
                        placeholder={tab === "saved" ? "Tìm trong từ đã lưu..." : "Lọc từ trong chủ đề hoặc nhập từ để tra..."}
                    />
                    <button type="button" onClick={() => void searchOutside()} disabled={searching}>
                        {searching ? "Đang tra..." : "Tra từ ngoài"}
                    </button>
                </div>
                <div className="vocab-tabs">
                    <button className={tab === "topics" ? "active" : ""} onClick={() => { setTab("topics"); setTopicId(""); setSearch(""); }}>Chủ đề</button>
                    <button className={tab === "saved" ? "active" : ""} onClick={() => { setTab("saved"); setSearch(""); setSavedPage(1); }}>
                        <FaBookmark /> Từ đã lưu ({saved.length})
                    </button>
                </div>
            </div>
            {error && <div className="vocab-error" role="alert">{error}</div>}
            {savedError && <div className="vocab-error" role="alert">{savedError}</div>}

            {tab === "topics" && !topicId && !externalWord && (loading
                ? <div className="vocab-empty">Đang tải chủ đề...</div>
                : <div className="topic-card-grid">{topics.map((topic) => (
                    <button className="topic-card" key={topic._id} onClick={() => chooseTopic(topic._id)}>
                        <span>CHỦ ĐỀ</span>
                        <h2>{topic.Name}</h2>
                        <p>{topic.Description || "Học các từ vựng IELTS theo chủ đề này."}</p>
                        <strong>{topic.WordCount ?? 0} từ <span aria-hidden="true">→</span></strong>
                    </button>
                ))}</div>)}

            {tab === "topics" && (topicId || externalWord) && <>
                <button className="back-topic" onClick={() => { setTopicId(""); setExternalWord(null); setSearch(""); }}>
                    <FaArrowLeft /> Tất cả chủ đề
                </button>
                {externalWord && <section className="external-result">
                    <h2>Kết quả tra từ điển</h2>
                    {savedWordCard(externalWord)}
                </section>}
                {!externalWord && (loading
                    ? <div className="vocab-empty">Đang tải từ vựng...</div>
                    : listWords.length
                        ? <>
                            <div className="vocab-grid">{listWords.map(savedWordCard)}</div>
                            <ListPagination total={wordPageResult?.total || 0} page={wordPage} pageSize={pageSize} onPageChange={setWordPage} />
                        </>
                        : <div className="vocab-empty">{search.trim() ? "Không tìm thấy từ phù hợp trong chủ đề này." : "Chủ đề này chưa có từ vựng."}</div>)}
            </>}

            {tab === "saved" && (loadingSaved
                ? <div className="vocab-empty">Đang tải từ đã lưu...</div>
                : visibleSavedPage.length
                    ? <>
                        <div className="vocab-grid">{visibleSavedPage.map((item) => item.WordID && savedWordCard(item.WordID))}</div>
                        <ListPagination total={visibleSaved.length} page={currentSavedPage} pageSize={pageSize} onPageChange={setSavedPage} />
                    </>
                    : <div className="vocab-empty">{search.trim() ? "Không tìm thấy từ đã lưu phù hợp." : "Bạn chưa lưu từ vựng nào."}</div>)}

            {editingNote && <div className="vocab-note-overlay" role="presentation" onClick={() => setEditingNote(null)}>
                <section className="vocab-note-dialog" role="dialog" aria-modal="true" aria-labelledby="vocab-note-title" onClick={(event) => event.stopPropagation()}>
                    <h2 id="vocab-note-title">Ghi chú: {editingNote.WordID.Word}</h2>
                    <label htmlFor="vocab-note-input">Ghi chú cá nhân</label>
                    <textarea id="vocab-note-input" maxLength={1000} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                    <div><button type="button" className="secondary" onClick={() => setEditingNote(null)}>Hủy</button><button type="button" onClick={() => void saveNote()} disabled={savingNote}>{savingNote ? "Đang lưu..." : "Lưu ghi chú"}</button></div>
                </section>
            </div>}
        </main>
    );
}

export default VocabularyPage;
