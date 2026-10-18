import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FaClipboardCheck } from "react-icons/fa";
import {
    createAssignmentSubmission,
    saveAssignmentSubmission,
    submitAssignmentSubmission,
} from "../../../services/assignment.service";
import type {
    Assignment,
    AssignmentSkill,
    AssignmentQuestion,
    AssignmentSubmission,
    SubmissionAnswer,
} from "../../../types/assignment";

const skillLabels: Record<AssignmentSkill, string> = {
    Reading: "Đọc",
    Listening: "Nghe",
    Writing: "Viết",
    Speaking: "Nói",
};

const assignmentTypeLabels: Record<Assignment["AssignmentType"], string> = {
    Practice: "Luyện tập",
    Quiz: "Kiểm tra nhanh",
    Exam: "Bài thi",
    Homework: "Bài tập về nhà",
};

interface Props {
    assignment: Assignment;
    submissions: AssignmentSubmission[];
    onSubmissionChange: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (
            typeof response === "object" &&
            response !== null &&
            "data" in response &&
            typeof response.data === "object" &&
            response.data !== null &&
            "message" in response.data &&
            typeof response.data.message === "string"
        ) {
            return response.data.message;
        }
    }
    return error instanceof Error ? error.message : "Không thể xử lý bài tập.";
}

function assignmentIdFor(submission: AssignmentSubmission): string {
    if (!submission.AssignmentID) return "";
    return typeof submission.AssignmentID === "string"
        ? submission.AssignmentID
        : submission.AssignmentID._id;
}

function formatTime(totalSeconds: number): string {
    const seconds = Math.max(0, totalSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return [hours, minutes, remainingSeconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
}

function AssignmentCard({ assignment, submissions, onSubmissionChange }: Props) {
    const attempts = useMemo(
        () => submissions
            .filter((submission) => assignmentIdFor(submission) === assignment._id)
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
        [assignment._id, submissions],
    );
    const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
    const initialSubmission = attempts.find((item) => item.Status === "Doing") || attempts[0] || null;
    const [answers, setAnswers] = useState<Record<number, unknown>>(() => Object.fromEntries(
        (initialSubmission?.Answers || []).map((answer) => [answer.QuestionOrder, answer.Answer]),
    ));
    const [isBusy, setIsBusy] = useState(false);
    const [isEditing, setIsEditing] = useState(initialSubmission?.Status === "Doing");
    const [error, setError] = useState("");
    const [timerNow, setTimerNow] = useState(() => Date.now());
    const autoSubmitStarted = useRef(false);
    const submitLock = useRef(false);

    const currentSubmission = submission || initialSubmission;
    const attemptLimitReached = assignment.AttemptLimit > 0 &&
        attempts.length >= assignment.AttemptLimit;
    const pendingTeacherReview = currentSubmission?.Status === "Submitted";
    const currentAttemptIndex = attempts.findIndex((item) => item._id === currentSubmission?._id);
    const currentAttemptNumber = currentAttemptIndex >= 0
        ? currentAttemptIndex + 1
        : attempts.length + 1;
    const startedAt = currentSubmission ? new Date(currentSubmission.StartTime).getTime() : 0;
    const durationSeconds = Math.max(0, assignment.Duration * 60);
    const expiresAt = durationSeconds > 0 ? startedAt + durationSeconds * 1000 : 0;
    const remainingSeconds = durationSeconds > 0
        ? Math.max(0, Math.ceil((expiresAt - timerNow) / 1000))
        : Math.max(0, Math.floor((timerNow - startedAt) / 1000));
    const timeExpired = durationSeconds > 0 && remainingSeconds === 0 &&
        currentSubmission?.Status === "Doing";
    const timeIsLow = durationSeconds > 0 && remainingSeconds <= 60;

    const startAttempt = async () => {
        setIsBusy(true);
        setError("");
        try {
            const created = await createAssignmentSubmission(assignment._id);
            setSubmission(created);
            setAnswers({});
            setIsEditing(true);
            setTimerNow(Date.now());
            autoSubmitStarted.current = false;
            await onSubmissionChange();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setIsBusy(false);
        }
    };

    const buildAnswers = useCallback((): SubmissionAnswer[] =>
        assignment.Questions.map((question) => ({
            QuestionOrder: question.Order,
            Answer: answers[question.Order] ?? "",
        })), [answers, assignment.Questions]);

    const saveDraft = async (): Promise<AssignmentSubmission | null> => {
        if (!currentSubmission) return null;
        const saved = await saveAssignmentSubmission(currentSubmission._id, buildAnswers());
        setSubmission(saved);
        await onSubmissionChange();
        return saved;
    };

    const submitCurrentAttempt = useCallback(async (confirmBeforeSubmit: boolean) => {
        if (!currentSubmission || submitLock.current) return;
        if (confirmBeforeSubmit &&
            !window.confirm("Bạn chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể sửa đáp án.")) {
            return;
        }

        submitLock.current = true;
        setIsBusy(true);
        setError("");
        try {
            const submitted = await submitAssignmentSubmission(
                currentSubmission._id,
                buildAnswers(),
            );
            setSubmission(submitted);
            setIsEditing(false);
            await onSubmissionChange();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            submitLock.current = false;
            setIsBusy(false);
        }
    }, [buildAnswers, currentSubmission, onSubmissionChange]);

    const handleSaveDraft = async () => {
        setIsBusy(true);
        setError("");
        try {
            await saveDraft();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setIsBusy(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await submitCurrentAttempt(true);
    };

    const setAnswer = (order: number, answer: unknown) => {
        setAnswers((current) => ({ ...current, [order]: answer }));
    };

    useEffect(() => {
        if (currentSubmission?.Status !== "Doing") return;
        const timer = window.setInterval(() => setTimerNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [currentSubmission?._id, currentSubmission?.Status]);

    useEffect(() => {
        if (!timeExpired || autoSubmitStarted.current) return;
        autoSubmitStarted.current = true;
        void submitCurrentAttempt(false);
    }, [timeExpired, currentSubmission?._id, submitCurrentAttempt]);

    return (
        <article className="course-assignment-card">
            <div className="course-assignment-heading">
                <FaClipboardCheck aria-hidden="true" />
                <div>
                    <h3>{assignment.Title}</h3>
                    <p>
                        {skillLabels[assignment.Skill]} · {assignmentTypeLabels[assignment.AssignmentType]}
                        {assignment.Duration > 0 ? ` · ${assignment.Duration} phút` : ""}
                        {assignment.AttemptLimit > 0 ? ` · Tối đa ${assignment.AttemptLimit} lần` : ""}
                    </p>
                </div>
            </div>
            {assignment.Description && (
                <p className="course-assignment-description">{assignment.Description}</p>
            )}

            {currentSubmission && (
                <div className={`course-assignment-result ${pendingTeacherReview ? "pending" : ""}`}>
                    {pendingTeacherReview ? (
                        <>
                            <strong>Đã nộp bài · Đang chờ giáo viên chấm</strong>
                            {currentSubmission.BandScore > 0 && (
                                <span>Điểm trắc nghiệm tạm tính: {currentSubmission.BandScore}/{assignment.TotalScore}</span>
                            )}
                        </>
                    ) : currentSubmission.Status === "Graded" ? (
                        <strong>Điểm: {currentSubmission.BandScore}/{assignment.TotalScore}</strong>
                    ) : (
                        <strong>Đang làm · Lần {currentAttemptNumber}</strong>
                    )}
                    {currentSubmission.Status !== "Doing" && (
                        <span>Tổng điểm câu tự chấm: {currentSubmission.TotalScore}</span>
                    )}
                    {currentSubmission.Status !== "Doing" && (
                        <span>Thời gian làm: {formatTime(currentSubmission.Duration)}</span>
                    )}
                </div>
            )}

            {currentSubmission?.Status === "Doing" && (
                <div className={`course-assignment-timer ${timeIsLow ? "low" : ""}`} role="timer">
                    <span>{durationSeconds > 0 ? "Thời gian còn lại" : "Thời gian làm"}</span>
                    <strong>{formatTime(remainingSeconds)}</strong>
                </div>
            )}

            {(!currentSubmission || currentSubmission.Status !== "Doing") && !attemptLimitReached && (
                <button
                    type="button"
                    className="course-assignment-start"
                    onClick={() => void startAttempt()}
                    disabled={isBusy || attemptLimitReached}
                >
                    {isBusy
                        ? "Đang bắt đầu..."
                        : currentSubmission
                            ? `Làm lại bài (lượt ${attempts.length + 1})`
                            : "Bắt đầu làm bài"}
                </button>
            )}
            {attemptLimitReached && currentSubmission?.Status !== "Doing" && (
                <p className="course-assignment-attempt-limit">Bạn đã sử dụng hết lượt làm bài.</p>
            )}

            {currentSubmission?.Status === "Doing" && !isEditing && (
                <button
                    type="button"
                    className="course-assignment-start"
                    onClick={() => setIsEditing(true)}
                >
                    Tiếp tục làm bài
                </button>
            )}

            {currentSubmission?.Status === "Doing" && isEditing && (
                <form className="course-assignment-form" onSubmit={handleSubmit}>
                    {assignment.Questions.map((question) => (
                        <QuestionInput
                            key={question.Order}
                            question={question}
                            value={answers[question.Order]}
                            disabled={isBusy || timeExpired}
                            onChange={(value) => setAnswer(question.Order, value)}
                        />
                    ))}
                    <div className="course-assignment-actions">
                        <button type="button" onClick={() => void handleSaveDraft()} disabled={isBusy}>
                            Lưu bài làm
                        </button>
                        <button type="submit" disabled={isBusy || timeExpired}>
                            {isBusy ? "Đang nộp..." : timeExpired ? "Đã hết giờ" : "Nộp bài"}
                        </button>
                        {timeExpired && (
                            <button
                                type="button"
                                onClick={() => void submitCurrentAttempt(false)}
                                disabled={isBusy}
                            >
                                {isBusy ? "Đang tự nộp..." : "Nộp bài ngay"}
                            </button>
                        )}
                    </div>
                </form>
            )}

            {error && <p className="course-assignment-error" role="alert">{error}</p>}
        </article>
    );
}

function QuestionInput({
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
    const isOrdering = question.Type === "Ordering";
    const isMultiSelect = question.Type === "Checkbox" ||
        (question.AnswerCount > 1 && !isOrdering);
    const hasChoices = question.Choices.length > 0;
    const isLongAnswer = ["Essay", "Speaking"].includes(question.Type);
    const serializedValue = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
    const selectedAnswers = Array.isArray(value) ? value : [];

    return (
        <fieldset className="course-assignment-question" disabled={disabled}>
            <legend>
                <span>Câu {question.Order}</span>
                {question.Title && <strong>{question.Title}</strong>}
            </legend>
            {question.Instructions && <p>{question.Instructions}</p>}
            {(question.Resources ?? []).map((resource, index) => (
                <div className="course-assignment-resource" key={`${resource.Url}-${index}`}>
                    {resource.Type === "Text" && <p>{resource.Content}</p>}
                    {resource.Type === "Image" && resource.Url && <img src={resource.Url} alt={resource.Content || "Tài liệu câu hỏi"} />}
                    {resource.Type === "Audio" && resource.Url && <audio controls src={resource.Url} />}
                    {resource.Type === "Video" && resource.Url && <video controls src={resource.Url} />}
                    {resource.Type === "PDF" && resource.Url && (
                        <a href={resource.Url} target="_blank" rel="noreferrer">
                            {resource.Content || "Mở tài liệu PDF"}
                        </a>
                    )}
                </div>
            ))}
            <p className="course-assignment-question-text">{question.Question}</p>
            {hasChoices && isMultiSelect && question.Choices.map((choice) => {
                return (
                    <label className="course-assignment-choice" key={choice.Key}>
                        <input
                            type="checkbox"
                            checked={selectedAnswers.includes(choice.Key)}
                            onChange={(event) => {
                                if (
                                    event.target.checked &&
                                    selectedAnswers.length >= question.AnswerCount
                                ) return;
                                onChange(
                                    event.target.checked
                                        ? [...selectedAnswers, choice.Key]
                                        : selectedAnswers.filter((item) => item !== choice.Key),
                                );
                            }}
                        />
                        <span>{choice.Key}. {choice.Content}</span>
                    </label>
                );
            })}
            {hasChoices && isOrdering && Array.from(
                { length: question.Choices.length },
                (_, position) => (
                    <label className="course-assignment-choice course-assignment-order" key={`position-${position}`}>
                        <span>Bước {position + 1}</span>
                        <select
                            aria-label={`Chọn bước thứ ${position + 1}`}
                            value={selectedAnswers[position] ?? ""}
                            onChange={(event) => {
                                const next = [...selectedAnswers];
                                next[position] = event.target.value;
                                onChange(next);
                            }}
                        >
                            <option value="">Chọn bước</option>
                            {question.Choices.map((choice) => (
                                <option
                                    key={choice.Key}
                                    value={choice.Key}
                                    disabled={selectedAnswers.some((answer, index) =>
                                        index !== position && answer === choice.Key
                                    )}
                                >
                                    {choice.Key}. {choice.Content}
                                </option>
                            ))}
                        </select>
                    </label>
                ),
            )}
            {hasChoices && !isMultiSelect && !isOrdering && question.Choices.map((choice) => (
                <label className="course-assignment-choice" key={choice.Key}>
                    <input
                        type="radio"
                        name={`question-${question.Order}`}
                        value={choice.Key}
                        checked={value === choice.Key}
                        onChange={() => onChange(choice.Key)}
                    />
                    <span>{choice.Key}. {choice.Content}</span>
                </label>
            ))}
            {!hasChoices && !isLongAnswer && question.AnswerCount > 1 ? (
                <div className="course-assignment-gap-answers">
                    {Array.from({ length: question.AnswerCount }, (_, index) => (
                        <label key={`gap-${index}`}>
                            <span>Chỗ trống {index + 1}</span>
                            <input
                                type="text"
                                value={selectedAnswers[index] ?? ""}
                                onChange={(event) => {
                                    const next = [...selectedAnswers];
                                    next[index] = event.target.value;
                                    onChange(next);
                                }}
                                placeholder={`Đáp án ${index + 1}`}
                            />
                        </label>
                    ))}
                </div>
            ) : !hasChoices && (isLongAnswer || question.Type.startsWith("Matching")) ? (
                <>
                    <textarea
                        rows={isLongAnswer ? 6 : 3}
                        value={serializedValue}
                        onChange={(event) => onChange(event.target.value)}
                        placeholder={isLongAnswer ? "Nhập câu trả lời của bạn" : "Nhập câu trả lời"}
                    />
                    {isLongAnswer && (
                        <small>Câu trả lời này sẽ được giáo viên chấm thủ công.</small>
                    )}
                </>
            ) : !hasChoices && (
                <input
                    type="text"
                    value={serializedValue}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Nhập câu trả lời"
                />
            )}
        </fieldset>
    );
}

export default AssignmentCard;
