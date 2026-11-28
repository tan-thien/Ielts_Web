import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaHeadphones, FaBookOpen, FaClock } from "react-icons/fa";
import {
    createAssignmentSubmission,
    getMySubmissions,
    saveAssignmentSubmission,
    submitAssignmentSubmission,
} from "../../services/assignment.service";
import {
    getReadingListeningPracticeAssignments,
    getReadingListeningPracticeReview,
} from "../../services/readingListeningPractice.service";
import type {
    AssignmentQuestion,
    AssignmentSubmission,
    SubmissionAnswer,
} from "../../types/assignment";
import type {
    PracticeAssignment,
    PracticeReview,
} from "../../types/readingListeningPractice";
import { assignmentTypeName, ieltsSkillName } from "../../utils/ieltsDisplay";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import LearningEmptyState from "../../components/learning/LearningEmptyState";
import "./ReadingListeningPracticeCenter.css";
import "../../styles/ieltsUtilityDesign.css";

type SkillFilter = "All" | "Reading" | "Listening";

const practiceErrorTranslations: Record<string, string> = {
    "Assignment is not available": "Bài luyện tập hiện không khả dụng.",
    "Assignment has not started yet": "Bài luyện tập chưa bắt đầu.",
    "Assignment has ended": "Thời gian làm bài đã kết thúc.",
    "A successful course payment is required to submit this assignment": "Bạn cần có quyền truy cập khóa học để nộp bài.",
    "Assignment attempt limit reached": "Bạn đã sử dụng hết số lượt làm bài.",
    "You already have an attempt in progress": "Bạn đang có một lượt làm bài chưa hoàn thành.",
    "Assignment time limit exceeded": "Đã vượt quá thời gian làm bài.",
    "Submission not found": "Không tìm thấy bài nộp.",
    "Submission is no longer in progress": "Lượt làm bài này không còn ở trạng thái đang làm.",
    "Submit this attempt before viewing the answer review": "Hãy nộp bài trước khi xem phần chữa bài.",
    "Cannot review a submission that is still in progress": "Không thể xem chữa bài khi lượt làm vẫn đang diễn ra.",
    "Answers must be an array": "Dữ liệu câu trả lời không hợp lệ.",
    "Invalid or duplicate question order in answers": "Thứ tự câu trả lời không hợp lệ hoặc bị trùng.",
    "Only submissions in progress can be updated": "Chỉ có thể cập nhật lượt làm đang diễn ra.",
};

const errorMessage = (error: unknown) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
                return practiceErrorTranslations[data.message] || "Không thể xử lý bài luyện tập. Vui lòng thử lại.";
            }
        }
        if (
            typeof response === "object" &&
            response !== null &&
            "status" in response &&
            typeof response.status === "number"
        ) return `Không thể xử lý bài luyện tập (mã lỗi ${response.status}). Vui lòng thử lại.`;
    }
    return "Không thể xử lý bài luyện tập. Vui lòng thử lại.";
};

const getAssignmentId = (submission: AssignmentSubmission) =>
    typeof submission.AssignmentID === "string"
        ? submission.AssignmentID
        : submission.AssignmentID?._id || "";

const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainder = safeSeconds % 60;
    return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
};

const answerIsFilled = (value: unknown) => {
    if (Array.isArray(value)) return value.some(answerIsFilled);
    if (value && typeof value === "object") return Object.values(value).some(answerIsFilled);
    return value !== undefined && value !== null && String(value).trim() !== "";
};

const stringifyAnswer = (value: unknown) => {
    if (value === undefined || value === null || value === "") return "Chưa trả lời";
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
};

function ReadingListeningPracticeCenterPage() {
    const [assignments, setAssignments] = useState<PracticeAssignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<SkillFilter>("All");
    const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
    const [answers, setAnswers] = useState<Record<number, unknown>>({});
    const [review, setReview] = useState<PracticeReview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState("");
    const [timerNow, setTimerNow] = useState(0);
    const submitLock = useRef(false);
    const autoSubmitStarted = useRef(false);

    const refreshSubmissions = useCallback(async () => {
        setSubmissions(await getMySubmissions());
    }, []);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            getReadingListeningPracticeAssignments(),
            getMySubmissions(),
        ])
            .then(([nextAssignments, nextSubmissions]) => {
                if (!mounted) return;
                setAssignments(nextAssignments);
                setSubmissions(nextSubmissions);
                setSelectedAssignmentId(nextAssignments[0]?._id || "");
                const firstAssignment = nextAssignments[0];
                const firstAttempts = firstAssignment
                    ? nextSubmissions
                        .filter((submission) => getAssignmentId(submission) === firstAssignment._id)
                        .sort((left, right) =>
                            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
                        )
                    : [];
                const firstAttempt = firstAttempts.find((item) => item.Status === "Doing") || firstAttempts[0];
                setAnswers(Object.fromEntries(
                    (firstAttempt?.Answers || []).map((answer) => [answer.QuestionOrder, answer.Answer]),
                ));
            })
            .catch((loadError: unknown) => {
                if (mounted) setError(errorMessage(loadError));
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const visibleAssignments = useMemo(
        () => assignments.filter((assignment) =>
            selectedSkill === "All" || assignment.Skill === selectedSkill
        ),
        [assignments, selectedSkill],
    );
    const selectedAssignment = visibleAssignments.find(
        (assignment) => assignment._id === selectedAssignmentId,
    ) || visibleAssignments[0] || null;
    const attempts = useMemo(() => selectedAssignment
        ? submissions
            .filter((submission) => getAssignmentId(submission) === selectedAssignment._id)
            .sort((left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
            )
        : [], [selectedAssignment, submissions]);
    const activeSubmission = selectedSubmission ||
        attempts.find((submission) => submission.Status === "Doing") ||
        attempts[0] || null;
    const isEditing = activeSubmission?.Status === "Doing";
    const durationSeconds = Math.max(0, (selectedAssignment?.Duration || 0) * 60);
    const startedAt = activeSubmission ? new Date(activeSubmission.StartTime).getTime() : 0;
    const remainingSeconds = durationSeconds > 0
        ? Math.max(0, Math.ceil((startedAt + durationSeconds * 1000 - timerNow) / 1000))
        : Math.max(0, Math.floor((timerNow - startedAt) / 1000));
    const timeExpired = Boolean(isEditing && durationSeconds > 0 && remainingSeconds === 0);
    const savedAnswers = new Map(
        (activeSubmission?.Answers || []).map((answer) => [answer.QuestionOrder, answer.Answer]),
    );
    const completedAnswers = selectedAssignment?.Questions.filter((question) =>
        answerIsFilled(savedAnswers.get(question.Order))
    ).length || 0;
    const currentAnswersCompleted = selectedAssignment?.Questions.filter((question) =>
        answerIsFilled(answers[question.Order])
    ).length || 0;
    const progress = selectedAssignment?.Questions.length
        ? Math.round((completedAnswers / selectedAssignment.Questions.length) * 100)
        : 0;
    const attemptLimitReached = Boolean(
        selectedAssignment?.AttemptLimit &&
        attempts.length >= selectedAssignment.AttemptLimit &&
        !attempts.some((submission) => submission.Status === "Doing")
    );

    useEffect(() => {
        const initializeTimer = window.setTimeout(() => setTimerNow(Date.now()), 0);
        const timer = window.setInterval(() => setTimerNow(Date.now()), 1000);
        return () => {
            window.clearTimeout(initializeTimer);
            window.clearInterval(timer);
        };
    }, []);

    const buildAnswers = useCallback((): SubmissionAnswer[] =>
        (selectedAssignment?.Questions || []).map((question) => ({
            QuestionOrder: question.Order,
            Answer: answers[question.Order] ?? "",
        })), [answers, selectedAssignment]);

    const showReview = useCallback(async (
        assignment: PracticeAssignment,
        submission: AssignmentSubmission,
    ) => {
        setError("");
        setReview(null);
        try {
            setReview(await getReadingListeningPracticeReview(assignment._id, submission._id));
            setSelectedSubmission(submission);
        } catch (reviewError) {
            setError(errorMessage(reviewError));
        }
    }, []);

    const startAttempt = async () => {
        if (!selectedAssignment) return;
        setIsBusy(true);
        setError("");
        setReview(null);
        try {
            const attempt = await createAssignmentSubmission(selectedAssignment._id);
            setSelectedSubmission(attempt);
            setAnswers({});
            setTimerNow(Date.now());
            await refreshSubmissions();
        } catch (requestError) {
            setError(errorMessage(requestError));
        } finally {
            setIsBusy(false);
        }
    };

    const submitAttempt = useCallback(async (confirm = true) => {
        if (!activeSubmission || !selectedAssignment || submitLock.current) return;
        if (confirm && !window.confirm("Bạn chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể sửa đáp án.")) return;
        submitLock.current = true;
        setIsBusy(true);
        setError("");
        try {
            const submitted = await submitAssignmentSubmission(
                activeSubmission._id,
                buildAnswers(),
            );
            setSelectedSubmission(submitted);
            await refreshSubmissions();
            await showReview(selectedAssignment, submitted);
        } catch (requestError) {
            setError(errorMessage(requestError));
        } finally {
            submitLock.current = false;
            setIsBusy(false);
        }
    }, [activeSubmission, buildAnswers, refreshSubmissions, selectedAssignment, showReview]);

    useEffect(() => {
        if (!timeExpired || autoSubmitStarted.current) return;
        autoSubmitStarted.current = true;
        void submitAttempt(false);
    }, [submitAttempt, timeExpired]);

    const saveDraft = async () => {
        if (!activeSubmission || !selectedAssignment) return;
        setIsBusy(true);
        setError("");
        try {
            const saved = await saveAssignmentSubmission(activeSubmission._id, buildAnswers());
            setSelectedSubmission(saved);
            await refreshSubmissions();
        } catch (requestError) {
            setError(errorMessage(requestError));
        } finally {
            setIsBusy(false);
        }
    };

    const chooseAssignment = (assignment: PracticeAssignment) => {
        setSelectedAssignmentId(assignment._id);
        setSelectedSubmission(null);
        setReview(null);
        setError("");
        const nextAttempts = submissions
            .filter((submission) => getAssignmentId(submission) === assignment._id)
            .sort((left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
            );
        const nextAttempt = nextAttempts.find((item) => item.Status === "Doing") || nextAttempts[0];
        setAnswers(Object.fromEntries(
            (nextAttempt?.Answers || []).map((answer) => [answer.QuestionOrder, answer.Answer]),
        ));
        autoSubmitStarted.current = false;
    };

    const handleAnswerChange = (order: number, value: unknown) => {
        setAnswers((current) => ({ ...current, [order]: value }));
    };

    return (
        <main className="practice-center">
            <UtilityPageHeader
                eyebrow="Luyện các kỹ năng IELTS"
                title="Trung tâm luyện tập"
                description="Chọn bài Reading hoặc Listening phù hợp và bắt đầu luyện ngay."
                icon={<FaBookOpen />}
                actions={<span className="practice-result-count">{assignments.length} bài khả dụng</span>}
            />

            <section className="practice-skill-grid" aria-label="Chọn kỹ năng">
                {([
                    ["Reading", "Đọc", <FaBookOpen />],
                    ["Listening", "Nghe", <FaHeadphones />],
                ] as const).map(([skill, label, icon]) => {
                    const count = assignments.filter(assignment => assignment.Skill === skill).length;
                    const completed = submissions.filter(submission =>
                        submission.Status === "Graded" &&
                        assignments.some(assignment => assignment._id === getAssignmentId(submission) && assignment.Skill === skill)
                    ).length;
                    return (
                        <button
                            type="button"
                            className={`practice-skill-card ${selectedSkill === skill ? "active" : ""}`}
                            key={skill}
                            onClick={() => setSelectedSkill(skill)}
                        >
                            <span className="practice-skill-card-icon">{icon}</span>
                            <span>
                                <strong>{label}</strong>
                                <small>{count} bài khả dụng · {completed} lượt đã hoàn thành</small>
                            </span>
                        </button>
                    );
                })}
            </section>

            <div className="practice-center-filters" role="group" aria-label="Lọc kỹ năng">
                {([
                    ["All", "Tất cả"],
                    ["Reading", "Đọc"],
                    ["Listening", "Nghe"],
                ] as const).map(([skill, label]) => (
                    <button
                        key={skill}
                        type="button"
                        className={selectedSkill === skill ? "active" : ""}
                        aria-pressed={selectedSkill === skill}
                        onClick={() => {
                            setSelectedSkill(skill);
                            const nextAssignment = assignments.find((assignment) =>
                                skill === "All" || assignment.Skill === skill
                            );
                            if (nextAssignment) chooseAssignment(nextAssignment);
                        }}
                    >
                        {label}
                    </button>
                ))}
                {!isLoading && <span>{visibleAssignments.length} bài có thể luyện</span>}
            </div>

            {isLoading && <p className="practice-center-message" role="status">Đang tải bài luyện tập...</p>}
            {error && <p className="practice-center-error" role="alert">{error}</p>}
            {!isLoading && !visibleAssignments.length && (
                <LearningEmptyState
                    icon={<FaBookOpen />}
                    title="Chưa có bài luyện phù hợp"
                    description="Chưa có bài Đọc hoặc Nghe đang mở trong các khóa học bạn đã mua. Hãy kiểm tra khóa học và quyền truy cập."
                />
            )}

            {!isLoading && visibleAssignments.length > 0 && (
                <div className="practice-center-layout">
                    <aside className="practice-center-list" aria-label="Danh sách bài luyện">
                        {visibleAssignments.map((assignment) => {
                            const assignmentAttempts = submissions.filter(
                                (submission) => getAssignmentId(submission) === assignment._id,
                            );
                            const latestGraded = assignmentAttempts.find(
                                (submission) => submission.Status === "Graded",
                            );
                            return (
                                <button
                                    type="button"
                                    key={assignment._id}
                                    className={`practice-center-assignment ${assignment._id === selectedAssignment?._id ? "selected" : ""}`}
                                    onClick={() => chooseAssignment(assignment)}
                                >
                                    <span className="practice-center-skill-icon">
                                        {assignment.Skill === "Reading" ? <FaBookOpen /> : <FaHeadphones />}
                                    </span>
                                    <span className="practice-center-assignment-copy">
                                        <strong>{assignment.Title}</strong>
                                        <small>{ieltsSkillName(assignment.Skill)} · {assignment.Questions.length} câu</small>
                                        {latestGraded && <small>Điểm gần nhất: {latestGraded.BandScore}/{assignment.TotalScore}</small>}
                                    </span>
                                </button>
                            );
                        })}
                    </aside>

                    {selectedAssignment && (
                        <section className="practice-center-workspace">
                            <div className="practice-center-assignment-heading">
                                <div>
                                    <span className="practice-center-eyebrow">
                                        {ieltsSkillName(selectedAssignment.Skill)} · {assignmentTypeName(selectedAssignment.AssignmentType)}
                                    </span>
                                    <h2>{selectedAssignment.Title}</h2>
                                    {selectedAssignment.Description && <p>{selectedAssignment.Description}</p>}
                                </div>
                                <div className="practice-center-meta">
                                    <span><FaClock aria-hidden="true" /> {selectedAssignment.Duration > 0 ? `${selectedAssignment.Duration} phút` : "Không giới hạn giờ"}</span>
                                    <span>{selectedAssignment.Questions.length} câu hỏi</span>
                                </div>
                            </div>

                            {activeSubmission && (
                                <div className={`practice-center-result ${activeSubmission.Status === "Submitted" ? "pending" : ""}`}>
                                    {activeSubmission.Status === "Doing" ? (
                                        <strong>Đang làm bài · {attempts.length || 1} lượt</strong>
                                    ) : activeSubmission.Status === "Submitted" ? (
                                        <strong>Đã nộp · Đang chờ giáo viên chấm</strong>
                                    ) : (
                                        <strong>Điểm: {activeSubmission.BandScore}/{selectedAssignment.TotalScore}</strong>
                                    )}
                                    {activeSubmission.Status !== "Doing" && (
                                        <span>Điểm câu hỏi: {activeSubmission.TotalScore} · Thời gian: {formatDuration(activeSubmission.Duration)}</span>
                                    )}
                                </div>
                            )}

                            {isEditing && (
                                <>
                                    <div className={`practice-center-timer ${timeExpired ? "expired" : remainingSeconds <= 60 && durationSeconds > 0 ? "low" : ""}`} role="timer">
                                        <span>{durationSeconds > 0 ? "Thời gian còn lại" : "Thời gian đã dùng"}</span>
                                        <strong>{formatDuration(remainingSeconds)}</strong>
                                    </div>
                                    <div className="practice-center-progress" aria-label={`Đã lưu ${completedAnswers} trên ${selectedAssignment.Questions.length} câu`}>
                                        <div>
                                            <span>Tiến độ đã lưu trên máy chủ</span>
                                            <strong>{completedAnswers}/{selectedAssignment.Questions.length} câu · {progress}%</strong>
                                        </div>
                                        <div className="practice-center-progress-track"><span style={{ width: `${progress}%` }} /></div>
                                        {currentAnswersCompleted !== completedAnswers && (
                                            <small>{currentAnswersCompleted} câu hiện đã điền, chưa lưu.</small>
                                        )}
                                    </div>
                                </>
                            )}

                            {!isEditing && !activeSubmission && (
                                <button
                                    type="button"
                                    className="practice-center-primary"
                                    onClick={() => void startAttempt()}
                                    disabled={isBusy || attemptLimitReached}
                                >
                                    {isBusy ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
                                </button>
                            )}
                            {!isEditing && activeSubmission && (
                                <div className="practice-center-attempt-actions">
                                    {activeSubmission.Status !== "Doing" && !attemptLimitReached && (
                                        <button
                                            type="button"
                                            className="practice-center-primary"
                                            onClick={() => void startAttempt()}
                                            disabled={isBusy}
                                        >
                                            {isBusy ? "Đang bắt đầu..." : "Làm lượt mới"}
                                        </button>
                                    )}
                                    {activeSubmission.Status !== "Doing" && (
                                        <button
                                            type="button"
                                            className="practice-center-secondary"
                                            onClick={() => void showReview(selectedAssignment, activeSubmission)}
                                            disabled={isBusy}
                                        >
                                            Xem chữa bài
                                        </button>
                                    )}
                                </div>
                            )}
                            {attemptLimitReached && !isEditing && (
                                <p className="practice-center-message">Bạn đã sử dụng hết số lượt làm bài.</p>
                            )}

                            {isEditing && (
                                <form
                                    className="practice-center-question-list"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void submitAttempt();
                                    }}
                                >
                                    {selectedAssignment.Questions.map((question) => (
                                        <PracticeQuestionInput
                                            key={question.Order}
                                            question={question}
                                            value={answers[question.Order]}
                                            disabled={isBusy || timeExpired}
                                            onChange={(value) => handleAnswerChange(question.Order, value)}
                                        />
                                    ))}
                                    <div className="practice-center-actions">
                                        <button type="button" className="practice-center-secondary" onClick={() => void saveDraft()} disabled={isBusy}>
                                            Lưu tiến độ
                                        </button>
                                        <button type="submit" className="practice-center-primary" disabled={isBusy || timeExpired}>
                                            {isBusy ? "Đang nộp..." : timeExpired ? "Đã hết giờ" : "Nộp bài"}
                                        </button>
                                        {timeExpired && (
                                            <>
                                                <span role="status">Hết giờ — hệ thống đang tự nộp bài của bạn.</span>
                                                <button
                                                    type="button"
                                                    className="practice-center-secondary"
                                                    onClick={() => void submitAttempt(false)}
                                                    disabled={isBusy}
                                                >
                                                    Thử nộp lại
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}

                            {review && activeSubmission && (
                                <section className="practice-center-review" aria-label="Chữa bài">
                                    <div className="practice-center-review-heading">
                                        <div>
                                            <span className="practice-center-eyebrow">KẾT QUẢ TỪ HỆ THỐNG</span>
                                            <h3>{review.Submission.Status === "Graded" ? `Điểm ${review.Submission.BandScore}/${selectedAssignment.TotalScore}` : "Đáp án đã lưu"}</h3>
                                        </div>
                                        <span>{formatDuration(review.Submission.Duration)} làm bài</span>
                                    </div>
                                    {review.Questions.map((question) => {
                                        const submitted = review.Submission.Answers.find(
                                            (answer) => answer.QuestionOrder === question.Order,
                                        );
                                        return (
                                            <article className="practice-center-review-question" key={question.Order}>
                                                <h4>Câu {question.Order}{question.Title ? ` · ${question.Title}` : ""}</h4>
                                                <p>{question.Question}</p>
                                                <div className="practice-center-review-answers">
                                                    <span>Đáp án của bạn: <strong>{stringifyAnswer(submitted?.Answer)}</strong></span>
                                                    <span>Đáp án đúng: <strong>{stringifyAnswer(question.CorrectAnswer)}</strong></span>
                                                    <span>Điểm: <strong>{submitted?.Score ?? 0}/{question.Score}</strong></span>
                                                </div>
                                                {question.Explanation && <p className="practice-center-explanation">{question.Explanation}</p>}
                                            </article>
                                        );
                                    })}
                                </section>
                            )}

                            {attempts.length > 1 && (
                                <details className="practice-center-history">
                                    <summary>Lịch sử {attempts.length} lượt làm</summary>
                                    {attempts.map((attempt, index) => (
                                        <div key={attempt._id} className="practice-center-history-item">
                                            <span>Lượt {attempts.length - index} · {new Date(attempt.createdAt).toLocaleString("vi-VN")}</span>
                                            <span>{attempt.Status === "Doing" ? "Đang làm" : attempt.Status === "Submitted" ? "Chờ chấm" : `${attempt.BandScore}/${selectedAssignment.TotalScore}`}</span>
                                            {attempt.Status !== "Doing" && (
                                                <button type="button" onClick={() => void showReview(selectedAssignment, attempt)}>
                                                    Xem bài chữa
                                                </button>
                                            )}
                                            {attempt.Status === "Doing" && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSubmission(attempt);
                                                        setReview(null);
                                                        setAnswers(Object.fromEntries(
                                                            attempt.Answers.map((answer) => [answer.QuestionOrder, answer.Answer]),
                                                        ));
                                                        autoSubmitStarted.current = false;
                                                    }}
                                                >
                                                    Tiếp tục làm
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </details>
                            )}
                        </section>
                    )}
                </div>
            )}
        </main>
    );
}

function PracticeQuestionInput({
    question,
    value,
    disabled,
    onChange,
}: {
    question: AssignmentQuestion;
    value: unknown;
    disabled: boolean;
    onChange: (value: unknown) => void;
}) {
    const choices = question.Choices || [];
    const selected = Array.isArray(value) ? value : [];
    const multiSelect = question.Type === "Checkbox" ||
        (question.AnswerCount > 1 && question.Type !== "Ordering");
    const ordering = question.Type === "Ordering";
    const textValue = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
    return (
        <fieldset className="practice-center-question" disabled={disabled}>
            <legend>
                <span>Câu {question.Order}</span>
                {question.Title && <strong>{question.Title}</strong>}
                <small>{question.Score} điểm</small>
            </legend>
            {question.Instructions && <p className="practice-center-instructions">{question.Instructions}</p>}
            {(question.Resources || []).map((resource, index) => (
                <div className="practice-center-resource" key={`${resource.Type}-${resource.Url}-${index}`}>
                    {resource.Type === "Text" && <p>{resource.Content}</p>}
                    {resource.Type === "Image" && resource.Url && <img src={resource.Url} alt={resource.Content || "Tài liệu bài tập"} />}
                    {resource.Type === "Audio" && resource.Url && <audio controls preload="none" src={resource.Url} />}
                    {resource.Type === "Video" && resource.Url && <video controls preload="none" src={resource.Url} />}
                    {resource.Type === "PDF" && resource.Url && <a href={resource.Url} target="_blank" rel="noreferrer">{resource.Content || "Mở tài liệu PDF"}</a>}
                </div>
            ))}
            <p className="practice-center-question-text">{question.Question}</p>
            {choices.length > 0 && multiSelect && choices.map((choice) => (
                <label key={choice.Key} className="practice-center-choice">
                    <input
                        type="checkbox"
                        checked={selected.includes(choice.Key)}
                        onChange={(event) => {
                            if (event.target.checked && selected.length >= question.AnswerCount) return;
                            onChange(event.target.checked
                                ? [...selected, choice.Key]
                                : selected.filter((item) => item !== choice.Key));
                        }}
                    />
                    <span>{choice.Key}. {choice.Content}</span>
                </label>
            ))}
            {choices.length > 0 && ordering && Array.from({ length: choices.length }, (_, index) => (
                <label key={`order-${index}`} className="practice-center-choice practice-center-order">
                    <span>Vị trí {index + 1}</span>
                    <select
                        aria-label={`Chọn đáp án cho vị trí ${index + 1}`}
                        value={selected[index] || ""}
                        onChange={(event) => {
                            const next = [...selected];
                            next[index] = event.target.value;
                            onChange(next);
                        }}
                    >
                        <option value="">Chọn đáp án</option>
                        {choices.map((choice) => (
                            <option
                                key={choice.Key}
                                value={choice.Key}
                                disabled={selected.some((answer, position) => position !== index && answer === choice.Key)}
                            >
                                {choice.Key}. {choice.Content}
                            </option>
                        ))}
                    </select>
                </label>
            ))}
            {choices.length > 0 && !multiSelect && !ordering && choices.map((choice) => (
                <label key={choice.Key} className="practice-center-choice">
                    <input
                        type="radio"
                        name={`practice-question-${question.Order}`}
                        checked={value === choice.Key}
                        onChange={() => onChange(choice.Key)}
                    />
                    <span>{choice.Key}. {choice.Content}</span>
                </label>
            ))}
            {choices.length === 0 && question.AnswerCount > 1 ? (
                <div className="practice-center-gap-answers">
                    {Array.from({ length: question.AnswerCount }, (_, index) => (
                        <label key={`gap-${index}`}>
                            <span>Chỗ trống {index + 1}</span>
                            <input
                                value={selected[index] || ""}
                                onChange={(event) => {
                                    const next = [...selected];
                                    next[index] = event.target.value;
                                    onChange(next);
                                }}
                            />
                        </label>
                    ))}
                </div>
            ) : choices.length === 0 && (
                <textarea
                    rows={3}
                    value={textValue}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Nhập câu trả lời"
                />
            )}
        </fieldset>
    );
}

export default ReadingListeningPracticeCenterPage;
export { ReadingListeningPracticeCenterPage };
