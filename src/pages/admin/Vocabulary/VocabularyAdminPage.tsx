import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { FaBook, FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import {
    bulkImportVocabulary,
    createVocabularyTopic,
    createVocabularyWord,
    deleteVocabularyTopic,
    deleteVocabularyWord,
    getVocabularyAdminSummary,
    getVocabularyTopics,
    getVocabularyWordPage,
    lookupVocabularyWord,
    startVocabularyGenerate,
    runVocabularyGenerateBatch,
    getVocabularyGenerateJobs,
    updateVocabularyGeneratePreview,
    approveVocabularyGenerate,
    updateVocabularyTopic,
    updateVocabularyWord,
} from "../../../services/vocabulary.service";
import type { VocabularyAdminSummary, VocabularyGenerateJob, VocabularyPageResult, VocabularySense, VocabularyTopic, VocabularyWord } from "../../../types/vocabulary";
import { getVocabularySenses } from "../../../utils/vocabulary";
import ListPagination from "../../../components/ListPagination";
import "./VocabularyAdminPage.css";

type WordDraft = {
    TopicID: string;
    Word: string;
    Senses: VocabularySense[];
    Pronunciation: string;
    Level: string;
    IsActive: boolean;
};

const blankSense = (): VocabularySense => ({
    PartOfSpeech: "",
    Meaning: "",
    Translation: "",
    Example: "",
    ExampleTranslation: "",
});

const blankWord = (topicId = ""): WordDraft => ({
    TopicID: topicId,
    Word: "",
    Senses: [blankSense()],
    Pronunciation: "",
    Level: "",
    IsActive: true,
});

const emptySummary: VocabularyAdminSummary = {
    activeTopics: 0,
    inactiveTopics: 0,
    totalWords: 0,
    activeWords: 0,
    inactiveWords: 0,
};

const topicSuggestions: Record<string, string[]> = {
    environment: ["sustainable", "renewable", "emission", "biodiversity", "conservation", "deforestation", "ecosystem", "carbon footprint", "greenhouse gas", "climate change"],
    education: ["curriculum", "scholarship", "literacy", "tuition", "assessment", "academic", "compulsory", "qualification", "pedagogy", "enrolment"],
    technology: ["innovation", "automation", "artificial intelligence", "cybersecurity", "algorithm", "privacy", "digital divide", "device", "data-driven", "outsource"],
    health: ["well-being", "obesity", "sedentary", "nutrition", "prevention", "diagnosis", "treatment", "outbreak", "immunity", "healthcare"],
    work: ["productivity", "employee", "employer", "workforce", "promotion", "remuneration", "flexible", "occupation", "unemployment", "entrepreneur"],
    travel: ["destination", "itinerary", "hospitality", "tourism", "landmark", "accommodation", "souvenir", "heritage", "expedition", "sustainable tourism"],
};

const errorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || fallback
        : error instanceof Error ? error.message : fallback;

const topicIdOf = (topic: VocabularyWord["TopicID"]) => typeof topic === "string" ? topic : topic._id;

function VocabularyAdminPage() {
    const [topics, setTopics] = useState<VocabularyTopic[]>([]);
    const [summary, setSummary] = useState(emptySummary);
    const [wordPageResult, setWordPageResult] = useState<VocabularyPageResult<VocabularyWord> | null>(null);
    const [selectedTopic, setSelectedTopic] = useState("");
    const [topicName, setTopicName] = useState("");
    const [topicDescription, setTopicDescription] = useState("");
    const [topicIsActive, setTopicIsActive] = useState(true);
    const [wordForm, setWordForm] = useState<WordDraft>(blankWord());
    const [bulkText, setBulkText] = useState("");
    const [wordSearch, setWordSearch] = useState("");
    const [wordStatus, setWordStatus] = useState<"all" | "active" | "inactive">("all");
    const [editingWord, setEditingWord] = useState("");
    const [editingTopic, setEditingTopic] = useState("");
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [warning, setWarning] = useState("");
    const [error, setError] = useState("");
    const [wordPage, setWordPage] = useState(1);
    const [generateJob, setGenerateJob] = useState<VocabularyGenerateJob | null>(null);
    const [generateTarget, setGenerateTarget] = useState(20);
    const [generateLevel, setGenerateLevel] = useState("B1-B2");
    const pageSize = 50;

    const loadAdminData = useCallback(async () => {
        const [topicData, summaryData] = await Promise.all([
            getVocabularyTopics(true),
            getVocabularyAdminSummary(),
        ]);
        setTopics(topicData);
        setSummary(summaryData);
    }, []);

    const loadWords = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getVocabularyWordPage({
                includeInactive: true,
                topicId: selectedTopic || undefined,
                search: wordSearch.trim() || undefined,
                status: wordStatus === "all" ? undefined : wordStatus,
                page: wordPage,
                limit: pageSize,
            });
            setWordPageResult(result);
        } catch (reason) {
            setError(errorMessage(reason, "Không thể tải danh sách từ."));
        } finally {
            setLoading(false);
        }
    }, [selectedTopic, wordSearch, wordStatus, wordPage]);

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            loadAdminData().catch((reason: unknown) => {
                if (active) setError(errorMessage(reason, "Không thể tải dữ liệu quản trị."));
            });
        }, 0);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [loadAdminData]);

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            loadWords().catch((reason: unknown) => {
                if (active) setError(errorMessage(reason, "Không thể tải danh sách từ."));
            });
        }, 180);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [loadWords]);

    useEffect(() => {
        if (!selectedTopic) return;
        let active = true;
        getVocabularyGenerateJobs(selectedTopic)
            .then((jobs) => { if (active) setGenerateJob(jobs[0] || null); })
            .catch((reason: unknown) => { if (active) setError(errorMessage(reason, "Không thể tải trạng thái tạo từ bằng AI.")); });
        return () => { active = false; };
    }, [selectedTopic]);

    const selectedTopicName = topics.find((topic) => topic._id === selectedTopic)?.Name.toLowerCase() || "";
    const suggestions = useMemo(
        () => Object.entries(topicSuggestions).find(([key]) => selectedTopicName.includes(key))?.[1] || [],
        [selectedTopicName],
    );
    const words = wordPageResult?.items || [];
    const topicCount = summary.activeTopics + summary.inactiveTopics;

    const submitTopic = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const body = { Name: topicName.trim(), Description: topicDescription.trim(), IsActive: topicIsActive };
            const topic = editingTopic
                ? await updateVocabularyTopic(editingTopic, body)
                : await createVocabularyTopic(body);
            setSelectedTopic(topic._id);
            setTopicName("");
            setTopicDescription("");
            setTopicIsActive(true);
            setEditingTopic("");
            setMessage("Đã lưu chủ đề.");
            await loadAdminData();
        } catch (reason) {
            setError(errorMessage(reason, "Không thể lưu chủ đề. Tên chủ đề có thể đã tồn tại."));
        } finally {
            setBusy(false);
        }
    };

    const lookupWord = async () => {
        if (!wordForm.Word.trim()) {
            setError("Nhập từ tiếng Anh trước khi tra cứu.");
            return;
        }
        setBusy(true);
        setError("");
        setWarning("");
        setMessage("");
        try {
            const result = await lookupVocabularyWord(wordForm.Word.trim());
            const senses = result.Senses?.length ? result.Senses : getVocabularySenses({
                ...result,
                _id: "",
                TopicID: selectedTopic,
                IsActive: true,
            });
            setWordForm((current) => ({
                ...current,
                Word: result.Word,
                Senses: senses,
                Pronunciation: result.Pronunciation || "",
                Level: result.Level || "",
            }));
            setMessage(`${senses.length} nghĩa đã tra cứu. Hãy kiểm tra nguồn và bổ sung trường còn thiếu trước khi lưu.`);
            if (result.warnings.length) setWarning(result.warnings.join(" "));
        } catch (reason) {
            setError(errorMessage(reason, "Không thể tra cứu từ. Kiểm tra chính tả hoặc thử lại sau."));
        } finally {
            setBusy(false);
        }
    };

    const importWordList = async () => {
        if (!selectedTopic) {
            setError("Chọn chủ đề trước khi nhập danh sách từ.");
            return;
        }
        if (!bulkText.trim()) {
            setError("Nhập các từ, phân cách bằng dòng mới, dấu phẩy hoặc dấu chấm phẩy.");
            return;
        }
        setBusy(true);
        setError("");
        setWarning("");
        setMessage("");
        try {
            const result = await bulkImportVocabulary(selectedTopic, bulkText);
            setBulkText(result.failed.map((item) => item.word).join("\n"));
            const skippedCount = result.skipped?.length || 0;
            setMessage(`Đã nhập ${result.imported.length} từ${skippedCount ? `; giữ nguyên ${skippedCount} từ đã có` : ""}${result.failed.length ? `; ${result.failed.length} từ cần thử lại` : ""}.`);
            if (result.failed.length) setError(result.failed.map((item) => `${item.word}: ${item.message}`).join(" | "));
            await Promise.all([loadAdminData(), loadWords()]);
        } catch (reason) {
            setError(errorMessage(reason, "Nhập danh sách thất bại. Mỗi lần có thể xử lý tối đa 50 từ."));
        } finally {
            setBusy(false);
        }
    };

    const startGenerate = async () => {
        if (!selectedTopic) return setError("Chọn chủ đề trước khi tạo từ bằng AI.");
        setBusy(true);
        setError("");
        setWarning("");
        setMessage("");
        try {
            const job = await startVocabularyGenerate({
                topicId: selectedTopic,
                level: generateLevel,
                targetCount: generateTarget,
            });
            setGenerateJob(job);
            setMessage("Đã tạo tiến trình Generate. Chạy Batch để nhận dữ liệu Preview.");
        } catch (reason) {
            setError(errorMessage(reason, "Không thể bắt đầu tạo từ bằng AI."));
        } finally {
            setBusy(false);
        }
    };

    const runGenerateBatch = async () => {
        if (!generateJob) return;
        setBusy(true);
        setError("");
        setWarning("");
        try {
            const job = await runVocabularyGenerateBatch(generateJob._id);
            setGenerateJob(job);
            setMessage(job.ErrorMessage || "Batch đã hoàn tất. Hãy kiểm tra Preview trước khi duyệt.");
        } catch (reason) {
            setError(errorMessage(reason, "Không thể chạy Batch tạo từ."));
        } finally {
            setBusy(false);
        }
    };

    const approveGenerate = async (previewKey?: string) => {
        if (!generateJob) return;
        setBusy(true);
        setError("");
        try {
            const result = await approveVocabularyGenerate(generateJob._id, previewKey ? [previewKey] : []);
            setGenerateJob(result.job);
            setMessage(`Đã duyệt và lưu ${result.approved} từ.`);
            await Promise.all([loadAdminData(), loadWords()]);
        } catch (reason) {
            setError(errorMessage(reason, "Không thể duyệt Preview."));
        } finally {
            setBusy(false);
        }
    };

    const rejectGeneratePreview = async (previewKey: string) => {
        if (!generateJob) return;
        try {
            setGenerateJob(await updateVocabularyGeneratePreview(generateJob._id, previewKey, { remove: true }));
        } catch (reason) {
            setError(errorMessage(reason, "Không thể bỏ Preview."));
        }
    };

    const editGeneratePreviewSense = async (previewKey: string, senseIndex: number) => {
        if (!generateJob) return;
        const preview = generateJob.Previews.find((item) => item.Key === previewKey);
        const senses = preview?.Preview?.Senses;
        if (!senses?.[senseIndex]) return;
        const translation = window.prompt("Bản dịch tiếng Việt cho nghĩa này", senses[senseIndex].Translation || "");
        if (translation === null) return;
        const nextSenses = senses.map((sense, index) =>
            index === senseIndex ? { ...sense, Translation: translation.trim() } : sense
        );
        try {
            setGenerateJob(await updateVocabularyGeneratePreview(generateJob._id, previewKey, {
                preview: { ...(preview?.Preview || {}), Senses: nextSenses },
            }));
        } catch (reason) {
            setError(errorMessage(reason, "Không thể cập nhật Preview."));
        }
    };

    const submitWord = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const senses = wordForm.Senses.filter((sense) => sense.Meaning.trim());
        if (!senses.length) {
            setError("Mỗi từ cần ít nhất một định nghĩa tiếng Anh.");
            return;
        }
        const firstSense = senses[0];
        const body = {
            ...wordForm,
            Senses: senses,
            Meaning: firstSense.Meaning,
            Translation: firstSense.Translation,
            PartOfSpeech: firstSense.PartOfSpeech,
            Example: firstSense.Example,
            ExampleTranslation: firstSense.ExampleTranslation,
        };
        setBusy(true);
        setError("");
        setWarning("");
        setMessage("");
        try {
            if (editingWord) await updateVocabularyWord(editingWord, body);
            else await createVocabularyWord(body);
            setWordForm(blankWord(selectedTopic));
            setEditingWord("");
            setMessage("Đã lưu từ và các nghĩa.");
            await Promise.all([loadAdminData(), loadWords()]);
        } catch (reason) {
            setError(errorMessage(reason, "Không thể lưu từ vựng. Kiểm tra thông tin và thử lại."));
        } finally {
            setBusy(false);
        }
    };

    const editWord = (word: VocabularyWord) => {
        const topicId = topicIdOf(word.TopicID);
        setSelectedTopic(topicId);
        setEditingWord(word._id);
        setWordForm({
            TopicID: topicId,
            Word: word.Word,
            Senses: getVocabularySenses(word),
            Pronunciation: word.Pronunciation || "",
            Level: word.Level || "",
            IsActive: word.IsActive,
        });
        setMessage("");
        setWarning("");
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetWord = () => {
        setEditingWord("");
        setWordForm(blankWord(selectedTopic));
        setWarning("");
    };

    const deleteTopic = async (topic: VocabularyTopic) => {
        if (!window.confirm(`Xóa mềm chủ đề "${topic.Name}"? Các từ bên trong sẽ được giữ nguyên nhưng không còn hiển thị cho học viên.`)) return;
        setError("");
        setMessage("");
        try {
            await deleteVocabularyTopic(topic._id);
            if (selectedTopic === topic._id) {
                setSelectedTopic("");
                setWordForm(blankWord());
            }
            setMessage("Đã ẩn chủ đề; các từ bên trong vẫn được giữ nguyên.");
            await loadAdminData();
        } catch (reason) {
            setError(errorMessage(reason, "Không thể xóa mềm chủ đề."));
        }
    };

    const deleteWord = async (word: VocabularyWord) => {
        if (!window.confirm(`Ẩn từ "${word.Word}" khỏi từ điển?`)) return;
        try {
            await deleteVocabularyWord(word._id);
            setMessage("Đã ẩn từ vựng.");
            await Promise.all([loadAdminData(), loadWords()]);
        } catch (reason) {
            setError(errorMessage(reason, "Không thể ẩn từ vựng."));
        }
    };

    const toggleTopic = async (topic: VocabularyTopic) => {
        try {
            await updateVocabularyTopic(topic._id, {
                Name: topic.Name,
                Description: topic.Description,
                IsActive: !topic.IsActive,
            });
            await loadAdminData();
        } catch (reason) {
            setError(errorMessage(reason, "Không thể cập nhật trạng thái chủ đề."));
        }
    };

    const toggleWord = async (word: VocabularyWord) => {
        const firstSense = getVocabularySenses(word)[0];
        if (!firstSense) return;
        try {
            await updateVocabularyWord(word._id, {
                TopicID: topicIdOf(word.TopicID),
                Word: word.Word,
                Senses: getVocabularySenses(word),
                Meaning: firstSense.Meaning,
                Translation: firstSense.Translation,
                PartOfSpeech: firstSense.PartOfSpeech,
                Example: firstSense.Example,
                ExampleTranslation: firstSense.ExampleTranslation,
                Pronunciation: word.Pronunciation || "",
                Level: word.Level || "",
                IsActive: !word.IsActive,
            });
            await Promise.all([loadAdminData(), loadWords()]);
        } catch (reason) {
            setError(errorMessage(reason, "Không thể cập nhật trạng thái từ."));
        }
    };

    const updateSense = (index: number, field: keyof VocabularySense, value: string) => {
        setWordForm((current) => ({
            ...current,
            Senses: current.Senses.map((sense, senseIndex) =>
                senseIndex === index ? { ...sense, [field]: value } : sense
            ),
        }));
    };

    return (
        <div className="vocab-admin-page">
            <header className="vocab-admin-heading">
                <span className="vocab-admin-kicker">QUẢN LÝ NỘI DUNG</span>
                <h1>Từ điển từ vựng IELTS</h1>
                <p>Tra cứu, kiểm tra nguồn và quản lý riêng từng nghĩa, ví dụ, bản dịch.</p>
            </header>

            <section className="vocab-admin-stats" aria-label="Thống kê từ điển">
                <article><span>Chủ đề</span><strong>{topicCount}</strong><small>{summary.activeTopics} đang hiển thị</small></article>
                <article><span>Tổng số từ</span><strong>{summary.totalWords}</strong><small>{summary.activeWords} đang hiển thị</small></article>
                <article><span>Chủ đề ẩn</span><strong>{summary.inactiveTopics}</strong><small>Có thể bật lại bất kỳ lúc nào</small></article>
                <article><span>Từ đang ẩn</span><strong>{summary.inactiveWords}</strong><small>Không bị xóa khỏi dữ liệu</small></article>
            </section>

            {message && <div className="admin-success" role="status">{message}</div>}
            {warning && <div className="admin-warning" role="status">{warning}</div>}
            {error && <div className="admin-error" role="alert">{error}</div>}

            {suggestions.length > 0 && (
                <div className="topic-suggestion-bar">
                    <strong>Gợi ý từ cho {topics.find((topic) => topic._id === selectedTopic)?.Name}:</strong>
                    {suggestions.map((word) => (
                        <button type="button" key={word} onClick={() => setBulkText((current) => current ? `${current}\n${word}` : word)}>
                            {word}
                        </button>
                    ))}
                </div>
            )}

            <div className="vocab-admin-layout">
                <aside className="admin-panel topic-panel">
                    <div className="panel-heading"><div><span className="panel-kicker">DANH MỤC</span><h2>Chủ đề</h2></div><span className="panel-count">{topics.length}</span></div>
                    <form className="topic-form" onSubmit={(event) => void submitTopic(event)}>
                        <label>Tên chủ đề<input value={topicName} onChange={(event) => setTopicName(event.target.value)} placeholder="Ví dụ: Environment" aria-label="Tên chủ đề" required /></label>
                        <label>Mô tả<textarea value={topicDescription} onChange={(event) => setTopicDescription(event.target.value)} placeholder="Mô tả ngắn về nhóm từ" aria-label="Mô tả chủ đề" /></label>
                        <label className="vocab-checkbox"><input type="checkbox" checked={topicIsActive} onChange={(event) => setTopicIsActive(event.target.checked)} /> Hiển thị cho học viên</label>
                        <div className="topic-form-actions">
                            <button type="submit" disabled={busy}>{editingTopic ? "Cập nhật chủ đề" : "Tạo chủ đề"}</button>
                            {editingTopic && <button type="button" className="secondary" onClick={() => { setEditingTopic(""); setTopicName(""); setTopicDescription(""); setTopicIsActive(true); }}>Hủy</button>}
                        </div>
                    </form>

                    <div className="topic-list-heading"><h3>Danh sách chủ đề</h3><button type="button" onClick={() => setSelectedTopic("")} className={!selectedTopic ? "active" : ""}>Tất cả từ</button></div>
                    <div className="topic-list">
                        {topics.map((topic) => (
                            <article className={`topic-row ${selectedTopic === topic._id ? "selected" : ""}`} key={topic._id}>
                                <button type="button" className="topic-select" onClick={() => { setSelectedTopic(topic._id); setWordPage(1); }}>
                                    <strong>{topic.Name}</strong>
                                    <small>{topic.ActiveWordCount ?? 0} / {topic.WordCount ?? 0} từ hiển thị</small>
                                </button>
                                <div className="topic-actions">
                                    <button type="button" title={topic.IsActive ? "Ẩn chủ đề" : "Hiển thị chủ đề"} aria-label={topic.IsActive ? `Ẩn chủ đề ${topic.Name}` : `Hiển thị chủ đề ${topic.Name}`} onClick={() => void toggleTopic(topic)}>{topic.IsActive ? "Ẩn" : "Hiện"}</button>
                                    <button type="button" title="Sửa chủ đề" aria-label={`Sửa chủ đề ${topic.Name}`} onClick={() => { setEditingTopic(topic._id); setTopicName(topic.Name); setTopicDescription(topic.Description); setTopicIsActive(topic.IsActive); }}><FaEdit /></button>
                                    <button type="button" className="danger-icon" title="Xóa mềm chủ đề" aria-label={`Xóa chủ đề ${topic.Name}`} onClick={() => void deleteTopic(topic)}><FaTrash /></button>
                                </div>
                            </article>
                        ))}
                        {!topics.length && <p className="empty-hint">Chưa có chủ đề.</p>}
                    </div>
                </aside>

                <section className="admin-panel word-workspace">
                    <div className="panel-heading"><div><span className="panel-kicker">TỪ ĐIỂN</span><h2>{editingWord ? "Chỉnh sửa từ" : "Thêm và quản lý từ"}</h2></div><FaBook className="panel-heading-icon" /></div>

                    <details className="bulk-import">
                        <summary><FaPlus /> Nhập danh sách từ hàng loạt <span>Tối đa 50 từ · từ đã có được giữ nguyên</span></summary>
                        <p>Tra cứu tuần tự có giới hạn; kết quả từng từ được ghi nhận độc lập. Những từ thất bại vẫn được giữ trong ô để thử lại.</p>
                        <textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder={"sustainable\nrenewable\ncarbon footprint"} aria-label="Danh sách từ vựng cần nhập" />
                        <button type="button" onClick={() => void importWordList()} disabled={busy || !selectedTopic}>{busy ? "Đang nhập..." : "Nhập từ vào chủ đề đã chọn"}</button>
                        {!selectedTopic && <small>Chọn chủ đề trước khi nhập.</small>}
                    </details>

                    <details className="bulk-import vocabulary-ai-generate">
                        <summary><FaPlus /> Tạo từ bằng AI theo chủ đề <span>20 từ/Batch · Preview và duyệt trước khi lưu</span></summary>
                        <div className="vocabulary-generate-controls">
                            <label>Trình độ
                                <select value={generateLevel} onChange={(event) => setGenerateLevel(event.target.value)}>
                                    <option value="A2-B1">A2-B1</option>
                                    <option value="B1-B2">B1-B2</option>
                                    <option value="B2-C1">B2-C1</option>
                                </select>
                            </label>
                            <label>Mục tiêu
                                <input type="number" min="1" max="500" value={generateTarget} onChange={(event) => setGenerateTarget(Math.max(1, Math.min(500, Number(event.target.value) || 1)))} />
                            </label>
                            <button type="button" onClick={() => void startGenerate()} disabled={busy || !selectedTopic}>Tạo tiến trình</button>
                        </div>
                        {generateJob && (
                            <div className="vocabulary-generate-status">
                                <div>
                                    <strong>Batch {generateJob.BatchNumber || 0}</strong>
                                    <span>{generateJob.BatchStatus} · Mục tiêu {generateJob.TargetCount} · Đã duyệt {generateJob.ApprovedCount}</span>
                                    <small>Đã sinh {generateJob.GeneratedCount} · Hợp lệ {generateJob.ValidCount} · Trùng {generateJob.DuplicateCount}</small>
                                </div>
                                <button type="button" onClick={() => void runGenerateBatch()} disabled={busy || generateJob.ApprovedCount >= generateJob.TargetCount || generateJob.BatchStatus === "Processing"}>
                                    {busy ? "Đang tạo..." : "Chạy Batch tiếp theo"}
                                </button>
                            </div>
                        )}
                        {generateJob?.ErrorMessage && <p className="admin-warning">{generateJob.ErrorMessage}</p>}
                        {(generateJob?.Previews?.length || 0) > 0 && (
                            <div className="vocabulary-preview-list">
                                {(generateJob?.Previews || []).map((preview) => (
                                    <article key={preview.Key} className={`vocabulary-preview preview-${preview.Status.toLowerCase()}`}>
                                        <div>
                                            <strong>{preview.Word}</strong>
                                            <span>{preview.Status}</span>
                                        </div>
                                        {preview.Error && <p className="admin-error">{preview.Error}</p>}
                                        {preview.Preview?.Senses?.map((sense, index) => (
                                            <p key={`${preview.Key}-${index}`}><b>{sense.PartOfSpeech || "Nghĩa"}:</b> {sense.Meaning} — {sense.Translation || "Chưa có bản dịch"}</p>
                                        ))}
                                        {preview.Status === "Pending" && (
                                            <div className="vocabulary-preview-actions">
                                                <button type="button" onClick={() => void approveGenerate(preview.Key)}>Duyệt từ này</button>
                                                {preview.Preview?.Senses?.map((_sense, index) => (
                                                    <button
                                                        type="button"
                                                        className="secondary"
                                                        key={`${preview.Key}-edit-${index}`}
                                                        onClick={() => void editGeneratePreviewSense(preview.Key, index)}
                                                    >
                                                        Sửa nghĩa {index + 1}
                                                    </button>
                                                ))}
                                                <button type="button" className="secondary" onClick={() => void rejectGeneratePreview(preview.Key)}>Bỏ</button>
                                            </div>
                                        )}
                                    </article>
                                ))}
                                {(generateJob?.Previews || []).some((preview) => preview.Status === "Pending") && (
                                    <button type="button" onClick={() => void approveGenerate()} disabled={busy}>Duyệt toàn bộ Preview đang chờ</button>
                                )}
                            </div>
                        )}
                    </details>

                    <form className="word-form" onSubmit={(event) => void submitWord(event)}>
                        <div className="word-form-top">
                            <label>Chủ đề<select value={wordForm.TopicID} onChange={(event) => { setSelectedTopic(event.target.value); setWordForm((current) => ({ ...current, TopicID: event.target.value })); }} required>
                                <option value="">Chọn chủ đề</option>
                                {topics.filter((topic) => !topic.IsDeleted).map((topic) => <option key={topic._id} value={topic._id}>{topic.Name}</option>)}
                            </select></label>
                            <label>Từ tiếng Anh<div className="lookup-word-input">
                                <input value={wordForm.Word} onChange={(event) => setWordForm((current) => ({ ...current, Word: event.target.value }))} placeholder="Ví dụ: milestone" aria-label="Từ tiếng Anh" required />
                                <button type="button" onClick={() => void lookupWord()} disabled={busy}>{busy ? "Đang tra..." : "Tra từ điển"}</button>
                            </div></label>
                        </div>
                        <div className="word-form-meta">
                            <label>Phiên âm<input value={wordForm.Pronunciation} onChange={(event) => setWordForm((current) => ({ ...current, Pronunciation: event.target.value }))} placeholder="/ˈmaɪl.stoʊn/" /></label>
                            <label>Trình độ<input value={wordForm.Level} onChange={(event) => setWordForm((current) => ({ ...current, Level: event.target.value }))} placeholder="Band / trình độ (không bắt buộc)" /></label>
                            <label className="vocab-checkbox"><input type="checkbox" checked={wordForm.IsActive} onChange={(event) => setWordForm((current) => ({ ...current, IsActive: event.target.checked }))} /> Hiển thị từ</label>
                        </div>

                        <div className="sense-editor-heading"><div><h3>Các nghĩa</h3><p>Mỗi nghĩa có bản dịch và ví dụ riêng; không có ví dụ thì để trống.</p></div><button type="button" className="secondary" onClick={() => setWordForm((current) => ({ ...current, Senses: [...current.Senses, blankSense()] }))}><FaPlus /> Thêm nghĩa</button></div>
                        <div className="sense-editors">
                            {wordForm.Senses.map((sense, index) => (
                                <section className="sense-editor" key={`sense-${index}`}>
                                    <div className="sense-editor-title"><strong>Nghĩa {index + 1}</strong>{wordForm.Senses.length > 1 && <button type="button" className="danger-icon" aria-label={`Xóa nghĩa ${index + 1}`} onClick={() => setWordForm((current) => ({ ...current, Senses: current.Senses.filter((_, senseIndex) => senseIndex !== index) }))}><FaTrash /></button>}</div>
                                    <label>Từ loại<input value={sense.PartOfSpeech} onChange={(event) => updateSense(index, "PartOfSpeech", event.target.value)} placeholder="noun, verb..." /></label>
                                    <label>Định nghĩa tiếng Anh<textarea required value={sense.Meaning} onChange={(event) => updateSense(index, "Meaning", event.target.value)} placeholder="Định nghĩa theo nguồn đã tra cứu" /></label>
                                    <label>Nghĩa tiếng Việt<input value={sense.Translation} onChange={(event) => updateSense(index, "Translation", event.target.value)} placeholder="Có thể bổ sung thủ công" /></label>
                                    <div className="example-edit-grid">
                                        <label>Ví dụ tiếng Anh<textarea value={sense.Example} onChange={(event) => updateSense(index, "Example", event.target.value)} placeholder="Để trống nếu nguồn không cung cấp" /></label>
                                        <label>Dịch ví dụ<textarea value={sense.ExampleTranslation} onChange={(event) => updateSense(index, "ExampleTranslation", event.target.value)} placeholder="Bản dịch của đúng ví dụ trên" /></label>
                                    </div>
                                </section>
                            ))}
                        </div>
                        <div className="word-form-actions">
                            <button type="submit" disabled={busy || !wordForm.TopicID}>{editingWord ? "Lưu thay đổi" : "Lưu từ điển"}</button>
                            {editingWord && <button type="button" className="secondary" onClick={resetWord}>Hủy sửa</button>}
                        </div>
                    </form>

                    <div className="word-list-toolbar">
                        <div><span className="panel-kicker">NỘI DUNG ĐÃ LƯU</span><h3>Danh sách từ {wordPageResult ? `(${wordPageResult.total})` : ""}</h3></div>
                        <div className="word-list-filters">
                            <label className="word-search"><FaSearch /><input value={wordSearch} onChange={(event) => { setWordSearch(event.target.value); setWordPage(1); }} placeholder="Tìm từ, nghĩa, bản dịch..." /></label>
                            <select value={wordStatus} onChange={(event) => { setWordStatus(event.target.value as typeof wordStatus); setWordPage(1); }} aria-label="Lọc trạng thái từ">
                                <option value="all">Mọi trạng thái</option><option value="active">Đang hiển thị</option><option value="inactive">Đang ẩn</option>
                            </select>
                            <select value={selectedTopic} onChange={(event) => { setSelectedTopic(event.target.value); setWordPage(1); }} aria-label="Lọc từ theo chủ đề">
                                <option value="">Tất cả chủ đề</option>
                                {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.Name}</option>)}
                            </select>
                        </div>
                    </div>
                    {loading && <p className="empty-hint">Đang tải từ vựng...</p>}
                    {!loading && !words.length && <p className="empty-hint">Không có từ phù hợp với bộ lọc hiện tại.</p>}
                    <div className="admin-word-list">
                        {words.map((word) => (
                            <article className="admin-word-row" key={word._id}>
                                <div className="admin-word-content">
                                    <div className="admin-word-title"><h4>{word.Word}</h4><span className={word.IsActive ? "status-active" : "status-inactive"}>{word.IsActive ? "Đang hiển thị" : "Đang ẩn"}</span></div>
                                    <p className="admin-word-topic">{typeof word.TopicID === "string" ? "" : word.TopicID?.Name} · {getVocabularySenses(word).length} nghĩa</p>
                                    {getVocabularySenses(word).slice(0, 3).map((sense, index) => <p className="admin-word-sense" key={`${word._id}-${index}`}><b>{sense.PartOfSpeech || `Nghĩa ${index + 1}`}:</b> {sense.Meaning} <span>{sense.Translation || "Chưa có bản dịch"}</span></p>)}
                                    {getVocabularySenses(word).length > 3 && <small>Còn {getVocabularySenses(word).length - 3} nghĩa khác</small>}
                                </div>
                                <div className="admin-word-actions">
                                    <button type="button" title={word.IsActive ? "Ẩn từ" : "Hiển thị từ"} onClick={() => void toggleWord(word)}>{word.IsActive ? "Ẩn" : "Hiện"}</button>
                                    <button type="button" title="Chỉnh sửa từ" aria-label={`Chỉnh sửa từ ${word.Word}`} onClick={() => editWord(word)}><FaEdit /></button>
                                    <button type="button" className="danger-icon" title="Ẩn từ" aria-label={`Ẩn từ ${word.Word}`} onClick={() => void deleteWord(word)}><FaTrash /></button>
                                </div>
                            </article>
                        ))}
                    </div>
                    {wordPageResult && <ListPagination total={wordPageResult.total} page={wordPage} pageSize={pageSize} onPageChange={setWordPage} />}
                </section>
            </div>
        </div>
    );
}

export default VocabularyAdminPage;
