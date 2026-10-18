import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import {
    bulkImportVocabulary,
    createVocabularyTopic,
    createVocabularyWord,
    deleteVocabularyTopic,
    deleteVocabularyWord,
    getVocabularyTopics,
    getVocabularyWords,
    lookupVocabularyWord,
    updateVocabularyTopic,
    updateVocabularyWord,
} from "../../../services/vocabulary.service";
import type { VocabularyTopic, VocabularyWord } from "../../../types/vocabulary";
import "./VocabularyAdminPage.css";

type WordForm = {
    TopicID: string;
    Word: string;
    Meaning: string;
    Translation: string;
    PartOfSpeech: string;
    Example: string;
    ExampleTranslation: string;
    Pronunciation: string;
    Level: string;
    IsActive: boolean;
};

const blankWord: WordForm = {
    TopicID: "",
    Word: "",
    Meaning: "",
    Translation: "",
    PartOfSpeech: "",
    Example: "",
    ExampleTranslation: "",
    Pronunciation: "",
    Level: "",
    IsActive: true,
};

const topicSuggestions: Record<string, string[]> = {
    environment: ["sustainable", "renewable", "emission", "biodiversity", "conservation", "deforestation", "ecosystem", "carbon footprint", "greenhouse gas", "climate change"],
    education: ["curriculum", "scholarship", "literacy", "tuition", "assessment", "academic", "compulsory", "qualification", "pedagogy", "enrolment"],
    technology: ["innovation", "automation", "artificial intelligence", "cybersecurity", "algorithm", "privacy", "digital divide", "device", "data-driven", "outsource"],
    health: ["well-being", "obesity", "sedentary", "nutrition", "prevention", "diagnosis", "treatment", "outbreak", "immunity", "healthcare"],
    work: ["productivity", "employee", "employer", "workforce", "promotion", "remuneration", "flexible", "occupation", "unemployment", "entrepreneur"],
    travel: ["destination", "itinerary", "hospitality", "tourism", "landmark", "accommodation", "souvenir", "heritage", "expedition", "sustainable tourism"],
};

function VocabularyAdminPage() {
    const [topics, setTopics] = useState<VocabularyTopic[]>([]);
    const [words, setWords] = useState<VocabularyWord[]>([]);
    const [selectedTopic, setSelectedTopic] = useState("");
    const [topicName, setTopicName] = useState("");
    const [topicDescription, setTopicDescription] = useState("");
    const [wordForm, setWordForm] = useState<WordForm>(blankWord);
    const [bulkText, setBulkText] = useState("");
    const [editingWord, setEditingWord] = useState("");
    const [editingTopic, setEditingTopic] = useState("");
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [topicData, wordData] = await Promise.all([
                getVocabularyTopics(true),
                getVocabularyWords({ includeInactive: true, topicId: selectedTopic || undefined }),
            ]);
            setTopics(topicData);
            setWords(wordData);
        } catch (loadError) {
            console.error("Không thể tải dữ liệu từ vựng:", loadError);
            setError("Không thể tải dữ liệu từ vựng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [selectedTopic]);

    useEffect(() => {
        void load();
    }, [load]);

    const submitTopic = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");
        try {
            const body = { Name: topicName.trim(), Description: topicDescription.trim(), IsActive: true };
            const topic = editingTopic
                ? await updateVocabularyTopic(editingTopic, body)
                : await createVocabularyTopic(body);
            setSelectedTopic(topic._id);
            setTopicName("");
            setTopicDescription("");
            setEditingTopic("");
            setMessage("Đã lưu chủ đề.");
            await load();
        } catch (saveError) {
            console.error("Không thể lưu chủ đề từ vựng:", saveError);
            setError("Không thể lưu chủ đề. Tên chủ đề có thể đã tồn tại.");
        }
    };

    const lookupWord = async () => {
        if (!wordForm.Word.trim()) {
            setError("Vui lòng nhập từ tiếng Anh trước khi tra cứu.");
            return;
        }
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const result = await lookupVocabularyWord(wordForm.Word.trim());
            setWordForm((current) => ({ ...current, ...result }));
            setMessage("Đã tra cứu nghĩa và bản dịch. Vui lòng kiểm tra trước khi lưu.");
        } catch (lookupError) {
            console.error("Không thể tra cứu từ vựng:", lookupError);
            setError("Không tìm thấy từ này. Hãy kiểm tra chính tả hoặc thử lại sau.");
        } finally {
            setBusy(false);
        }
    };

    const importWordList = async () => {
        if (!selectedTopic) {
            setError("Vui lòng chọn chủ đề trước khi nhập từ.");
            return;
        }
        if (!bulkText.trim()) {
            setError("Hãy nhập các từ, phân cách bằng dòng mới, dấu phẩy hoặc dấu chấm phẩy.");
            return;
        }
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const result = await bulkImportVocabulary(selectedTopic, bulkText);
            setBulkText("");
            setMessage(`Đã nhập ${result.imported.length} từ${result.failed.length ? `; ${result.failed.length} từ chưa nhập được` : ""}.`);
            if (result.failed.length) {
                setError(result.failed.map((item) => `${item.word}: ${item.message}`).join(" | "));
            }
            await load();
        } catch (importError) {
            console.error("Không thể nhập danh sách từ vựng:", importError);
            setError("Nhập hàng loạt không thành công. Mỗi lần có thể nhập tối đa 50 từ.");
        } finally {
            setBusy(false);
        }
    };

    const submitWord = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");
        try {
            if (editingWord) {
                await updateVocabularyWord(editingWord, wordForm);
            } else {
                await createVocabularyWord(wordForm);
            }
            setWordForm({ ...blankWord, TopicID: selectedTopic });
            setEditingWord("");
            setMessage("Đã lưu từ vựng.");
            await load();
        } catch (saveError) {
            console.error("Không thể lưu từ vựng:", saveError);
            setError("Không thể lưu từ vựng. Vui lòng kiểm tra thông tin và thử lại.");
        }
    };

    const editWord = (word: VocabularyWord) => {
        const topicId = typeof word.TopicID === "string" ? word.TopicID : word.TopicID._id;
        setSelectedTopic(topicId);
        setEditingWord(word._id);
        setWordForm({
            TopicID: topicId,
            Word: word.Word,
            Meaning: word.Meaning,
            Translation: word.Translation,
            PartOfSpeech: word.PartOfSpeech,
            Example: word.Example,
            ExampleTranslation: word.ExampleTranslation,
            Pronunciation: word.Pronunciation,
            Level: word.Level,
            IsActive: word.IsActive,
        });
    };

    const resetWord = () => {
        setEditingWord("");
        setWordForm({ ...blankWord, TopicID: selectedTopic });
    };

    const deleteTopic = async (topic: VocabularyTopic) => {
        if (!window.confirm(`Xóa chủ đề "${topic.Name}" cùng toàn bộ từ vựng bên trong?`)) return;
        setError("");
        setMessage("");
        try {
            await deleteVocabularyTopic(topic._id);
            if (selectedTopic === topic._id) {
                setSelectedTopic("");
            } else {
                await load();
            }
            setMessage("Đã xóa chủ đề.");
        } catch (deleteError) {
            console.error("Không thể xóa chủ đề từ vựng:", deleteError);
            setError("Không thể xóa chủ đề. Vui lòng thử lại.");
        }
    };

    const deleteWord = async (word: VocabularyWord) => {
        if (!window.confirm(`Xóa từ "${word.Word}" khỏi từ điển?`)) return;
        setError("");
        setMessage("");
        try {
            await deleteVocabularyWord(word._id);
            setMessage("Đã xóa từ vựng.");
            await load();
        } catch (deleteError) {
            console.error("Không thể xóa từ vựng:", deleteError);
            setError("Không thể xóa từ vựng. Vui lòng thử lại.");
        }
    };

    const selectedTopicName = topics.find((topic) => topic._id === selectedTopic)?.Name.toLowerCase() || "";
    const suggestions = Object.entries(topicSuggestions).find(([key]) => selectedTopicName.includes(key))?.[1] || [];

    return (
        <div className="vocab-admin-page">
            <header className="vocab-admin-heading">
                <span>QUẢN LÝ NỘI DUNG</span>
                <h1>Từ điển từ vựng</h1>
                <p>Quản lý chủ đề và xây dựng từ điển IELTS có thể tra cứu.</p>
            </header>

            {message && <div className="admin-success" role="status">{message}</div>}
            {error && <div className="admin-error" role="alert">{error}</div>}

            {suggestions.length > 0 && (
                <div className="topic-suggestion-bar">
                    <strong>Gợi ý từ cho chủ đề {topics.find((topic) => topic._id === selectedTopic)?.Name}:</strong>
                    {suggestions.map((word) => (
                        <button
                            type="button"
                            key={word}
                            onClick={() => setBulkText((current) => current ? `${current}\n${word}` : word)}
                        >
                            {word}
                        </button>
                    ))}
                </div>
            )}

            <div className="vocab-admin-layout">
                <section className="admin-panel">
                    <h2><FaPlus /> {editingTopic ? "Chỉnh sửa chủ đề" : "Thêm chủ đề"}</h2>
                    <form onSubmit={(event) => void submitTopic(event)}>
                        <input
                            value={topicName}
                            onChange={(event) => setTopicName(event.target.value)}
                            placeholder="Tên chủ đề"
                            aria-label="Tên chủ đề"
                            required
                        />
                        <textarea
                            value={topicDescription}
                            onChange={(event) => setTopicDescription(event.target.value)}
                            placeholder="Mô tả chủ đề"
                            aria-label="Mô tả chủ đề"
                        />
                        <button type="submit">{editingTopic ? "Cập nhật chủ đề" : "Tạo chủ đề"}</button>
                        {editingTopic && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    setEditingTopic("");
                                    setTopicName("");
                                    setTopicDescription("");
                                }}
                            >
                                Hủy chỉnh sửa
                            </button>
                        )}
                    </form>

                    <h2 className="list-title">Chủ đề</h2>
                    {loading && topics.length === 0 && <p>Đang tải chủ đề...</p>}
                    {topics.map((topic) => (
                        <div
                            className={`topic-row ${selectedTopic === topic._id ? "selected" : ""}`}
                            key={topic._id}
                            onClick={() => setSelectedTopic(topic._id)}
                        >
                            <div>
                                <strong>{topic.Name}</strong>
                                <small>{topic.Description || "Chưa có mô tả"}</small>
                            </div>
                            <span>
                                <button
                                    type="button"
                                    title="Chỉnh sửa chủ đề"
                                    aria-label={`Chỉnh sửa chủ đề ${topic.Name}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setEditingTopic(topic._id);
                                        setTopicName(topic.Name);
                                        setTopicDescription(topic.Description);
                                    }}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    type="button"
                                    title="Xóa chủ đề"
                                    aria-label={`Xóa chủ đề ${topic.Name}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void deleteTopic(topic);
                                    }}
                                >
                                    <FaTrash />
                                </button>
                            </span>
                        </div>
                    ))}
                </section>

                <section className="admin-panel">
                    <h2><FaPlus /> {editingWord ? "Chỉnh sửa từ" : "Thêm từ vựng"}</h2>
                    <div className="bulk-import">
                        <h3>Nhập danh sách từ vựng</h3>
                        <p>Chọn chủ đề, sau đó dán danh sách từ được phân cách bằng dòng mới, dấu phẩy hoặc dấu chấm phẩy. Hệ thống sẽ tự động tra cứu thông tin từ điển.</p>
                        <textarea
                            value={bulkText}
                            onChange={(event) => setBulkText(event.target.value)}
                            placeholder={"sustainable\nrenewable\ncarbon footprint"}
                            aria-label="Danh sách từ vựng cần nhập"
                        />
                        <button type="button" onClick={() => void importWordList()} disabled={busy}>
                            {busy ? "Đang nhập..." : "Tự động nhập từ vựng"}
                        </button>
                    </div>

                    <p className="helper-text">Với từng từ riêng lẻ, hãy tra cứu tự động và kiểm tra thông tin trước khi lưu.</p>
                    <form className="word-form" onSubmit={(event) => void submitWord(event)}>
                        <select
                            value={wordForm.TopicID}
                            onChange={(event) => {
                                setSelectedTopic(event.target.value);
                                setWordForm((current) => ({ ...current, TopicID: event.target.value }));
                            }}
                            aria-label="Chủ đề của từ vựng"
                            required
                        >
                            <option value="">Chọn chủ đề</option>
                            {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.Name}</option>)}
                        </select>
                        <div className="form-two">
                            <div className="lookup-word-input">
                                <input
                                    value={wordForm.Word}
                                    onChange={(event) => setWordForm((current) => ({ ...current, Word: event.target.value }))}
                                    placeholder="Từ tiếng Anh"
                                    aria-label="Từ tiếng Anh"
                                    required
                                />
                                <button type="button" onClick={() => void lookupWord()} disabled={busy}>
                                    {busy ? "Đang tra cứu..." : "Tra cứu tự động"}
                                </button>
                            </div>
                            <input
                                value={wordForm.PartOfSpeech}
                                onChange={(event) => setWordForm((current) => ({ ...current, PartOfSpeech: event.target.value }))}
                                placeholder="Từ loại"
                                aria-label="Từ loại"
                            />
                        </div>
                        <input
                            value={wordForm.Translation}
                            onChange={(event) => setWordForm((current) => ({ ...current, Translation: event.target.value }))}
                            placeholder="Nghĩa tiếng Việt"
                            aria-label="Nghĩa tiếng Việt"
                            required
                        />
                        <textarea
                            value={wordForm.Meaning}
                            onChange={(event) => setWordForm((current) => ({ ...current, Meaning: event.target.value }))}
                            placeholder="Định nghĩa tiếng Anh"
                            aria-label="Định nghĩa tiếng Anh"
                            required
                        />
                        <textarea
                            value={wordForm.Example}
                            onChange={(event) => setWordForm((current) => ({ ...current, Example: event.target.value }))}
                            placeholder="Câu ví dụ tiếng Anh"
                            aria-label="Câu ví dụ tiếng Anh"
                            required
                        />
                        <input
                            value={wordForm.ExampleTranslation}
                            onChange={(event) => setWordForm((current) => ({ ...current, ExampleTranslation: event.target.value }))}
                            placeholder="Dịch câu ví dụ"
                            aria-label="Dịch câu ví dụ"
                        />
                        <div className="form-two">
                            <input
                                value={wordForm.Pronunciation}
                                onChange={(event) => setWordForm((current) => ({ ...current, Pronunciation: event.target.value }))}
                                placeholder="Phiên âm"
                                aria-label="Phiên âm"
                            />
                            <input
                                value={wordForm.Level}
                                onChange={(event) => setWordForm((current) => ({ ...current, Level: event.target.value }))}
                                placeholder="Band IELTS / trình độ"
                                aria-label="Band IELTS / trình độ"
                            />
                        </div>
                        <label className="word-active">
                            <input
                                type="checkbox"
                                checked={wordForm.IsActive}
                                onChange={(event) => setWordForm((current) => ({ ...current, IsActive: event.target.checked }))}
                            />
                            Hiển thị từ vựng
                        </label>
                        <button type="submit">{editingWord ? "Cập nhật từ" : "Lưu từ vựng"}</button>
                        {editingWord && <button type="button" className="secondary" onClick={resetWord}>Hủy chỉnh sửa</button>}
                    </form>

                    <div className="word-list-heading">
                        <h2>Danh sách từ</h2>
                        <select
                            value={selectedTopic}
                            onChange={(event) => {
                                setSelectedTopic(event.target.value);
                                setWordForm({ ...blankWord, TopicID: event.target.value });
                            }}
                            aria-label="Lọc từ theo chủ đề"
                        >
                            <option value="">Tất cả chủ đề</option>
                            {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.Name}</option>)}
                        </select>
                    </div>
                    {loading && <p>Đang tải từ vựng...</p>}
                    {!loading && words.length === 0 && <p>Chưa có từ vựng trong chủ đề này.</p>}
                    {words.map((word) => (
                        <div className="word-row" key={word._id}>
                            <div>
                                <strong>{word.Word}</strong>
                                <small>{word.Translation} · {word.PartOfSpeech}</small>
                                <small>{word.Example}</small>
                                {!word.IsActive && <small>Đang ẩn</small>}
                            </div>
                            <span>
                                <button
                                    type="button"
                                    title="Chỉnh sửa từ vựng"
                                    aria-label={`Chỉnh sửa từ ${word.Word}`}
                                    onClick={() => editWord(word)}
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    type="button"
                                    title="Xóa từ vựng"
                                    aria-label={`Xóa từ ${word.Word}`}
                                    onClick={() => void deleteWord(word)}
                                >
                                    <FaTrash />
                                </button>
                            </span>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
}

export default VocabularyAdminPage;
