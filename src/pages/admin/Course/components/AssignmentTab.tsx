import { useMemo, useState, type FormEvent } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import {
    createAssignment,
    deleteAssignment,
    updateAssignment,
} from "../../../../services/assignment.service";
import type {
    Assignment,
    AssignmentPayload,
    AssignmentQuestion,
    AssignmentQuestionType,
    AssignmentSkill,
    AssignmentType,
} from "../../../../types/assignment";

interface LessonOption {
    _id?: string;
    Name: string;
}

interface Props {
    assignments: Assignment[];
    lessons: LessonOption[];
    courseId: string;
    loadError: string;
    onChange: () => Promise<void>;
}

interface AssignmentQuestionForm extends Omit<AssignmentQuestion, "CorrectAnswer" | "Choices"> {
    CorrectAnswerText: string;
    ChoicesText: string;
}

type AssignmentForm = Omit<AssignmentPayload, "CourseID" | "Questions"> & {
    Questions: AssignmentQuestionForm[];
};

const emptyForm: AssignmentForm = {
    Title: "",
    Description: "",
    Skill: "Reading",
    AssignmentType: "Practice",
    LessonID: null,
    Duration: 0,
    TotalScore: 9,
    AttemptLimit: 0,
    StartDate: "",
    EndDate: "",
    IsOpen: false,
    Questions: [],
};

const skills: AssignmentSkill[] = ["Reading", "Listening", "Writing", "Speaking"];
const assignmentTypes: AssignmentType[] = ["Practice", "Quiz", "Exam", "Homework"];
const questionTypes: AssignmentQuestionType[] = [
    "MultipleChoice", "Checkbox", "TrueFalse", "YesNo",
    "TrueFalseNotGiven", "YesNoNotGiven", "FillBlank", "ShortAnswer",
    "Matching", "MatchingHeadings", "MatchingInformation",
    "MatchingFeatures", "MatchingSentenceEndings", "Ordering",
    "SentenceCompletion", "NoteCompletion", "FormCompletion",
    "TableCompletion", "SummaryCompletion", "FlowChartCompletion",
    "MapLabeling", "DiagramLabeling", "Essay", "Speaking",
];

function createQuestion(order: number): AssignmentQuestionForm {
    return {
        Order: order,
        Type: "MultipleChoice",
        Part: null,
        GroupID: "",
        Instructions: "",
        AnswerCount: 1,
        WordLimit: null,
        Title: "",
        Question: "",
        Resources: [],
        ChoicesText: "",
        CorrectAnswerText: "",
        Explanation: "",
        Score: 1,
    };
}

function formatAnswer(answer: unknown): string {
    if (answer === null || answer === undefined) return "";
    return typeof answer === "string" ? JSON.stringify(answer) : JSON.stringify(answer) ?? "";
}

function parseAnswer(answer: string): unknown {
    if (!answer.trim()) return "";
    try {
        return JSON.parse(answer);
    } catch {
        return answer;
    }
}

function parseChoices(choicesText: string): AssignmentQuestion["Choices"] {
    return choicesText
        .split("\n")
        .map((content) => content.trim())
        .filter(Boolean)
        .map((content, index) => ({
            Key: String.fromCharCode(65 + index),
            Content: content,
        }));
}

function getReferenceId(reference: Assignment["CourseID"]): string | undefined {
    return typeof reference === "string" ? reference : reference?._id;
}

function getDateInputValue(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
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

    return error instanceof Error ? error.message : "Something went wrong.";
}

function AssignmentTab({
    assignments,
    lessons,
    courseId,
    loadError,
    onChange,
}: Props) {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<AssignmentForm>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [actionError, setActionError] = useState("");

    const courseAssignments = useMemo(() => {
        const lessonIds = new Set(lessons.map((lesson) => lesson._id));
        return assignments.filter((assignment) =>
            getReferenceId(assignment.CourseID) === courseId ||
            (Boolean(getReferenceId(assignment.LessonID)) &&
                lessonIds.has(getReferenceId(assignment.LessonID)!))
        );
    }, [assignments, courseId, lessons]);

    const openCreateForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setActionError("");
        setIsEditorOpen(true);
    };

    const openEditForm = (assignment: Assignment) => {
        setEditingId(assignment._id);
        setForm({
            Title: assignment.Title,
            Description: assignment.Description ?? "",
            Skill: assignment.Skill,
            AssignmentType: assignment.AssignmentType,
            LessonID: getReferenceId(assignment.LessonID) ?? null,
            Duration: assignment.Duration ?? 0,
            TotalScore: assignment.TotalScore ?? 9,
            AttemptLimit: assignment.AttemptLimit ?? 0,
            StartDate: getDateInputValue(assignment.StartDate),
            EndDate: getDateInputValue(assignment.EndDate),
            IsOpen: assignment.IsOpen,
            Questions: (assignment.Questions ?? []).map((question) => ({
                ...question,
                ChoicesText: question.Choices.map((choice) => choice.Content).join("\n"),
                CorrectAnswerText: formatAnswer(question.CorrectAnswer),
            })),
        });
        setActionError("");
        setIsEditorOpen(true);
    };

    const updateQuestion = (
        index: number,
        updates: Partial<AssignmentQuestionForm>
    ) => {
        setForm((current) => ({
            ...current,
            Questions: current.Questions.map((question, questionIndex) =>
                questionIndex === index ? { ...question, ...updates } : question
            ),
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setActionError("");

        const payload: AssignmentPayload = {
            ...form,
            CourseID: courseId,
            StartDate: form.StartDate || undefined,
            EndDate: form.EndDate || undefined,
            Questions: form.Questions.map((question, index) => {
                const {
                    ChoicesText,
                    CorrectAnswerText,
                    ...questionData
                } = question;
                return {
                    ...questionData,
                    Order: index + 1,
                    Choices: parseChoices(ChoicesText),
                    CorrectAnswer: parseAnswer(CorrectAnswerText),
                };
            }),
        };

        try {
            if (editingId) {
                await updateAssignment(editingId, payload);
            } else {
                await createAssignment(payload);
            }

            setIsEditorOpen(false);
            setEditingId(null);
            setForm(emptyForm);
            await onChange();
        } catch (error) {
            console.error("Save assignment error:", error);
            setActionError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (assignment: Assignment) => {
        if (!window.confirm(`Delete assignment "${assignment.Title}"?`)) return;

        setActionError("");
        try {
            await deleteAssignment(assignment._id);
            await onChange();
        } catch (error) {
            console.error("Delete assignment error:", error);
            setActionError(getErrorMessage(error));
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Assignment List</h4>
                <button className="btn btn-primary" onClick={openCreateForm}>
                    <FaPlus className="me-2" />
                    New Assignment
                </button>
            </div>

            {(loadError || actionError) && (
                <div className="alert alert-danger" role="alert">
                    {actionError || loadError}
                </div>
            )}

            {isEditorOpen && (
                <form className="card border-0 shadow-sm mb-4" onSubmit={handleSubmit}>
                    <div className="card-body">
                        <h5 className="mb-3">
                            {editingId ? "Edit Assignment" : "Create Assignment"}
                        </h5>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="assignment-title">
                                    Title
                                </label>
                                <input
                                    id="assignment-title"
                                    className="form-control"
                                    value={form.Title}
                                    onChange={(event) =>
                                        setForm({ ...form, Title: event.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label" htmlFor="assignment-skill">
                                    Skill
                                </label>
                                <select
                                    id="assignment-skill"
                                    className="form-select"
                                    value={form.Skill}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            Skill: event.target.value as AssignmentSkill,
                                        })
                                    }
                                >
                                    {skills.map((skill) => (
                                        <option key={skill} value={skill}>{skill}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label" htmlFor="assignment-type">
                                    Type
                                </label>
                                <select
                                    id="assignment-type"
                                    className="form-select"
                                    value={form.AssignmentType}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            AssignmentType: event.target.value as AssignmentType,
                                        })
                                    }
                                >
                                    {assignmentTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12">
                                <label className="form-label" htmlFor="assignment-description">
                                    Description
                                </label>
                                <textarea
                                    id="assignment-description"
                                    className="form-control"
                                    rows={2}
                                    value={form.Description}
                                    onChange={(event) =>
                                        setForm({ ...form, Description: event.target.value })
                                    }
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label" htmlFor="assignment-lesson">
                                    Lesson
                                </label>
                                <select
                                    id="assignment-lesson"
                                    className="form-select"
                                    value={form.LessonID ?? ""}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            LessonID: event.target.value || null,
                                        })
                                    }
                                >
                                    <option value="">Course-wide assignment</option>
                                    {lessons.map((lesson) => (
                                        <option key={lesson._id} value={lesson._id}>
                                            {lesson.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label" htmlFor="assignment-duration">
                                    Duration (minutes)
                                </label>
                                <input
                                    id="assignment-duration"
                                    className="form-control"
                                    type="number"
                                    min={0}
                                    value={form.Duration}
                                    onChange={(event) =>
                                        setForm({ ...form, Duration: Number(event.target.value) })
                                    }
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label" htmlFor="assignment-score">
                                    Total score
                                </label>
                                <input
                                    id="assignment-score"
                                    className="form-control"
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={form.TotalScore}
                                    onChange={(event) =>
                                        setForm({ ...form, TotalScore: Number(event.target.value) })
                                    }
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label" htmlFor="assignment-attempts">
                                    Attempt limit
                                </label>
                                <input
                                    id="assignment-attempts"
                                    className="form-control"
                                    type="number"
                                    min={0}
                                    value={form.AttemptLimit}
                                    onChange={(event) =>
                                        setForm({ ...form, AttemptLimit: Number(event.target.value) })
                                    }
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label" htmlFor="assignment-start-date">
                                    Start date
                                </label>
                                <input
                                    id="assignment-start-date"
                                    className="form-control"
                                    type="date"
                                    value={form.StartDate}
                                    onChange={(event) =>
                                        setForm({ ...form, StartDate: event.target.value })
                                    }
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label" htmlFor="assignment-end-date">
                                    End date
                                </label>
                                <input
                                    id="assignment-end-date"
                                    className="form-control"
                                    type="date"
                                    value={form.EndDate}
                                    onChange={(event) =>
                                        setForm({ ...form, EndDate: event.target.value })
                                    }
                                />
                            </div>

                            <div className="col-md-6 d-flex align-items-end">
                                <div className="form-check mb-2">
                                    <input
                                        id="assignment-open"
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={form.IsOpen}
                                        onChange={(event) =>
                                            setForm({ ...form, IsOpen: event.target.checked })
                                        }
                                    />
                                    <label className="form-check-label" htmlFor="assignment-open">
                                        Open for students
                                    </label>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0">
                                        Questions ({form.Questions.length})
                                    </h6>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                Questions: [
                                                    ...form.Questions,
                                                    createQuestion(form.Questions.length + 1),
                                                ],
                                            })
                                        }
                                    >
                                        <FaPlus className="me-2" />
                                        Add Question
                                    </button>
                                </div>

                                {form.Questions.map((question, index) => (
                                    <div className="card bg-light mb-3" key={index}>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Question {index + 1}</h6>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    type="button"
                                                    aria-label={`Remove question ${index + 1}`}
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            Questions: form.Questions.filter(
                                                                (_, questionIndex) => questionIndex !== index
                                                            ),
                                                        })
                                                    }
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label">
                                                        Question type
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={question.Type}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Type: event.target.value as AssignmentQuestionType,
                                                            })
                                                        }
                                                    >
                                                        {questionTypes.map((type) => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label">Part</label>
                                                    <select
                                                        className="form-select"
                                                        value={question.Part ?? ""}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Part: event.target.value
                                                                    ? Number(event.target.value)
                                                                    : null,
                                                            })
                                                        }
                                                    >
                                                        <option value="">Not set</option>
                                                        {[1, 2, 3, 4].map((part) => (
                                                            <option key={part} value={part}>{part}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label">Score</label>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        min={0}
                                                        step="any"
                                                        value={question.Score}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Score: Number(event.target.value),
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label">Question title</label>
                                                    <input
                                                        className="form-control"
                                                        value={question.Title}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Title: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label">Question</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={2}
                                                        value={question.Question}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Question: event.target.value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        Choices (one per line)
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={3}
                                                        value={question.ChoicesText}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                ChoicesText: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        Correct answer (JSON supported)
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={3}
                                                        value={question.CorrectAnswerText}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                CorrectAnswerText: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Instructions</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={2}
                                                        value={question.Instructions}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Instructions: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Explanation</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={2}
                                                        value={question.Explanation}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Explanation: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button className="btn btn-primary" type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create"}
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setIsEditorOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Title</th>
                            <th>Lesson</th>
                            <th>Skill</th>
                            <th>Type</th>
                            <th>Questions</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courseAssignments.length > 0 ? courseAssignments.map((assignment) => (
                            <tr key={assignment._id}>
                                <td>
                                    <div className="fw-semibold">{assignment.Title}</div>
                                    {assignment.Description && (
                                        <small className="text-muted">{assignment.Description}</small>
                                    )}
                                </td>
                                <td>
                                    {lessons.find(
                                        (lesson) => lesson._id === getReferenceId(assignment.LessonID)
                                    )?.Name ?? "Course-wide"}
                                </td>
                                <td>{assignment.Skill}</td>
                                <td>{assignment.AssignmentType}</td>
                                <td>{assignment.Questions?.length ?? 0}</td>
                                <td>
                                    <span className={`badge ${assignment.IsOpen ? "bg-success" : "bg-secondary"}`}>
                                        {assignment.IsOpen ? "Open" : "Closed"}
                                    </span>
                                </td>
                                <td className="text-nowrap">
                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        aria-label={`Edit ${assignment.Title}`}
                                        onClick={() => openEditForm(assignment)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        aria-label={`Delete ${assignment.Title}`}
                                        onClick={() => handleDelete(assignment)}
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-5 text-muted">
                                    {loadError ? "Assignments could not be loaded." : "No assignments found for this course."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AssignmentTab;
