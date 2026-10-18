import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBookmark, FaLanguage, FaSearch } from "react-icons/fa";
import {
    getSavedVocabulary,
    getVocabularyTopics,
    getVocabularyWords,
    removeSavedVocabulary,
    saveExternalVocabularyWord,
    saveVocabularyWord,
    searchExternalVocabulary,
    translateVocabulary,
    updateSavedVocabulary,
} from "../../services/vocabulary.service";
import type { SavedVocabulary, VocabularySense, VocabularyTopic, VocabularyTranslation, VocabularyWord } from "../../types/vocabulary";
import "./VocabularyPage.css";

/* Loading and error flags are synchronized with the remote API requests below. */
/* eslint-disable react-hooks/set-state-in-effect */

const legacySenses = (word: VocabularyWord): VocabularySense[] => word.Senses?.length
    ? word.Senses
    : [{ PartOfSpeech: word.PartOfSpeech, Meaning: word.Meaning, Translation: word.Translation, Example: word.Example, ExampleTranslation: word.ExampleTranslation }];

type WordCardProps = {
    word: VocabularyWord;
    saved?: SavedVocabulary;
    onSave: () => void;
    onTranslate: () => void;
    translation?: VocabularyTranslation;
    onNote: (item: SavedVocabulary) => void;
};

function WordCard({ word, saved, onSave, onTranslate, translation, onNote }: WordCardProps) {
    const senses = translation?.senses?.length ? translation.senses : legacySenses(word);
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
                        <p className="translation"><b>Dịch nghĩa:</b> {sense.Translation}</p>
                        {sense.Example && <div className="example"><b>Ví dụ:</b> “{sense.Example}”{sense.ExampleTranslation && <small>{sense.ExampleTranslation}</small>}</div>}
                    </div>
                ))}
            </div>
            <div className="vocab-actions">
                <button onClick={onTranslate}><FaLanguage /> Tra từ</button>
                {saved && <button onClick={() => onNote(saved)}>Ghi chú</button>}
            </div>
            {translation && <div className="ai-translation"><b>Bản dịch tra cứu</b><p>{translation.translation}</p></div>}
        </article>
    );
}

function VocabularyPage() {
    const [topics, setTopics] = useState<VocabularyTopic[]>([]);
    const [words, setWords] = useState<VocabularyWord[]>([]);
    const [saved, setSaved] = useState<SavedVocabulary[]>([]);
    const [topicId, setTopicId] = useState("");
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"topics" | "saved">("topics");
    const [translation, setTranslation] = useState<Record<string, VocabularyTranslation>>({});
    const [externalWord, setExternalWord] = useState<VocabularyWord | null>(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (tab !== "topics" || topicId) return;
        let active = true;
        setLoading(true);
        setError("");
        Promise.all([getVocabularyTopics(), getSavedVocabulary().catch(() => [])])
            .then(([topicData, savedData]) => { if (active) { setTopics(topicData); setSaved(savedData); } })
            .catch(() => { if (active) setError("Không thể tải danh sách chủ đề. Vui lòng thử lại."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [tab, topicId]);

    useEffect(() => {
        if (tab !== "topics" || !topicId) return;
        let active = true;
        setLoading(true);
        setError("");
        Promise.all([getVocabularyWords({ topicId }), getSavedVocabulary().catch(() => [])])
            .then(([wordData, savedData]) => { if (active) { setWords(wordData); setSaved(savedData); } })
            .catch(() => { if (active) setError("Không thể tải từ vựng trong chủ đề. Vui lòng thử lại."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [tab, topicId]);

    useEffect(() => {
        if (tab !== "saved") return;
        let active = true;
        getSavedVocabulary()
            .then(set => { if (active) setSaved(set); })
            .catch(() => { if (active) setError("Không thể tải danh sách từ đã lưu."); });
        return () => { active = false; };
    }, [tab]);

    const query = search.toLocaleLowerCase("vi");
    const visibleWords = useMemo(() => words.filter((word) => !query || word.Word.toLocaleLowerCase("vi").includes(query) || legacySenses(word).some((sense) => `${sense.Translation} ${sense.Meaning}`.toLocaleLowerCase("vi").includes(query))), [words, query]);
    const visibleSaved = useMemo(() => saved.filter((item) => item.WordID && (!query || item.WordID.Word.toLocaleLowerCase("vi").includes(query) || legacySenses(item.WordID).some((sense) => sense.Translation.toLocaleLowerCase("vi").includes(query)))), [saved, query]);
    const savedIds = new Set(saved.filter((item) => item.WordID).map((item) => item.WordID._id));

    const chooseTopic = (id: string) => { setExternalWord(null); setSearch(""); setTopicId(id); setTab("topics"); };
    const save = async (word: VocabularyWord) => {
        try {
            if (word._id && savedIds.has(word._id)) {
                await removeSavedVocabulary(word._id);
                setSaved((items) => items.filter((item) => item.WordID?._id !== word._id));
            } else {
                const item = word._id ? await saveVocabularyWord(word._id) : await saveExternalVocabularyWord(word.Word);
                setSaved((items) => [item, ...items]);
            }
        } catch { setError("Không thể lưu từ này lúc này."); }
    };
    const translate = async (word: VocabularyWord) => {
        try {
            const result = await translateVocabulary(word.Word, word.Meaning);
            setTranslation((items) => ({ ...items, [word._id || word.Word]: result }));
        } catch { setError("Không thể tra từ này lúc này."); }
    };
    const searchOutside = async () => {
        if (!search.trim()) return;
        setSearching(true);
        setError("");
        try { setExternalWord(await searchExternalVocabulary(search.trim())); }
        catch { setExternalWord(null); setError("Không tìm thấy từ trong từ điển bên ngoài."); }
        finally { setSearching(false); }
    };
    const note = async (item: SavedVocabulary) => {
        const value = window.prompt("Ghi chú nghĩa của bạn", item.Note);
        if (value === null) return;
        try {
            const result = await updateSavedVocabulary(item.WordID._id, { Note: value, IsLearned: item.IsLearned });
            setSaved((items) => items.map((current) => current._id === item._id ? result : current));
        } catch { setError("Không thể lưu ghi chú."); }
    };

    return (
        <main className="vocab-page">
            <header className="vocab-hero">
                <span>TỪ VỰNG IELTS</span>
                <h1>Học từ vựng theo chủ đề</h1>
                <p>Chọn chủ đề để học bộ từ vựng được tuyển chọn, hoặc tra cứu một từ tiếng Anh bất kỳ.</p>
            </header>
            <div className="vocab-toolbar">
                <div className="vocab-search">
                    <FaSearch aria-hidden="true" />
                    <input aria-label="Tìm từ vựng" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchOutside(); }} placeholder="Nhập từ tiếng Anh cần tra cứu..." />
                    <button onClick={() => void searchOutside()} disabled={searching}>{searching ? "Đang tra..." : "Tra từ"}</button>
                </div>
                <div className="vocab-tabs">
                    <button className={tab === "topics" ? "active" : ""} onClick={() => { setTab("topics"); setTopicId(""); }}>Chủ đề</button>
                    <button className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}><FaBookmark /> Từ đã lưu ({saved.length})</button>
                </div>
            </div>
            {error && <div className="vocab-error" role="alert">{error}</div>}
            {tab === "topics" && !topicId && !externalWord && (loading
                ? <div className="vocab-empty">Đang tải chủ đề...</div>
                : <div className="topic-card-grid">{topics.map((topic) => <button className="topic-card" key={topic._id} onClick={() => chooseTopic(topic._id)}><span>CHỦ ĐỀ</span><h2>{topic.Name}</h2><p>{topic.Description || "Học các từ vựng IELTS theo chủ đề này."}</p><strong>Vào học <span aria-hidden="true">→</span></strong></button>)}</div>)}
            {tab === "topics" && (topicId || externalWord) && <>
                <button className="back-topic" onClick={() => { setTopicId(""); setExternalWord(null); setSearch(""); }}><FaArrowLeft /> Tất cả chủ đề</button>
                {externalWord && <section className="external-result"><h2>Kết quả tra từ điển</h2><WordCard word={externalWord} onSave={() => void save(externalWord)} saved={saved.find((item) => item.WordID?.Word.toLowerCase() === externalWord.Word.toLowerCase())} onTranslate={() => void translate(externalWord)} translation={translation[externalWord._id || externalWord.Word]} onNote={note} /></section>}
                {!externalWord && (loading ? <div className="vocab-empty">Đang tải từ vựng...</div> : <div className="vocab-grid">{visibleWords.map((word) => <WordCard key={word._id} word={word} saved={saved.find((item) => item.WordID?._id === word._id)} onSave={() => void save(word)} onTranslate={() => void translate(word)} translation={translation[word._id]} onNote={note} />)}</div>)}
            </>}
            {tab === "saved" && <div className="vocab-grid">{visibleSaved.map((item) => item.WordID && <WordCard key={item._id} word={item.WordID} saved={item} onSave={() => void save(item.WordID)} onTranslate={() => void translate(item.WordID)} translation={translation[item.WordID._id]} onNote={note} />)}</div>}
            {tab === "saved" && !visibleSaved.length && <div className="vocab-empty">Bạn chưa lưu từ vựng nào.</div>}
        </main>
    );
}

export default VocabularyPage;
