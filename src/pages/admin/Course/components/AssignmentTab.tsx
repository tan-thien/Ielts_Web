import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { FaCloudUploadAlt, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import {
    createAssignment,
    deleteAssignment,
    updateAssignment,
} from "../../../../services/assignment.service";
import { uploadCloudinaryResource } from "../../../../services/cloudinary.service";
import type {
    Assignment,
    AssignmentPayload,
    AssignmentQuestion,
    AssignmentQuestionType,
    AssignmentSkill,
    AssignmentType,
} from "../../../../types/assignment";
import "./AssignmentTab.css";

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
const questionTypeGroups: { label: string; types: AssignmentQuestionType[] }[] = [
    {
        label: "Reading and Listening",
        types: [
            "MultipleChoice", "Checkbox", "TrueFalse", "TrueFalseNotGiven",
            "YesNo", "YesNoNotGiven", "Matching", "MatchingHeadings", "MatchingInformation",
            "MatchingFeatures", "MatchingSentenceEndings", "Ordering",
        ],
    },
    {
        label: "Completion and short answers",
        types: [
            "FillBlank", "ShortAnswer", "SentenceCompletion", "NoteCompletion",
            "FormCompletion", "TableCompletion", "SummaryCompletion",
            "FlowChartCompletion", "MapLabeling", "DiagramLabeling",
        ],
    },
    {
        label: "Writing and Speaking",
        types: ["Essay", "Speaking"],
    },
];

const choiceQuestionTypes = new Set<AssignmentQuestionType>([
    "MultipleChoice", "Checkbox", "TrueFalse", "TrueFalseNotGiven",
    "YesNo", "YesNoNotGiven", "Matching", "MatchingHeadings",
    "MatchingInformation", "MatchingFeatures", "MatchingSentenceEndings",
    "Ordering",
]);
const fixedChoices: Partial<Record<AssignmentQuestionType, string[]>> = {
    TrueFalse: ["True", "False"],
    TrueFalseNotGiven: ["True", "False", "Not Given"],
    YesNo: ["Yes", "No"],
    YesNoNotGiven: ["Yes", "No", "Not Given"],
};
const questionTypeLabels: Record<AssignmentQuestionType, string> = {
    MultipleChoice: "Multiple choice",
    Checkbox: "Choose multiple answers",
    TrueFalse: "True / False",
    TrueFalseNotGiven: "True / False / Not Given",
    YesNo: "Yes / No",
    YesNoNotGiven: "Yes / No / Not Given",
    Matching: "Matching",
    MatchingHeadings: "Matching headings",
    MatchingInformation: "Matching information",
    MatchingFeatures: "Matching features",
    MatchingSentenceEndings: "Matching sentence endings",
    Ordering: "Plan / process ordering",
    FillBlank: "Fill in the blanks",
    ShortAnswer: "Short answer",
    SentenceCompletion: "Sentence completion",
    NoteCompletion: "Note completion",
    FormCompletion: "Form completion",
    TableCompletion: "Table completion",
    SummaryCompletion: "Summary completion",
    FlowChartCompletion: "Flow-chart completion",
    MapLabeling: "Map labelling",
    DiagramLabeling: "Diagram labelling",
    Essay: "Writing task / essay",
    Speaking: "Speaking response",
};
const questionTypeHints: Record<AssignmentQuestionType, string> = {
    MultipleChoice: "Add each option separately, then select the one correct answer.",
    Checkbox: "Add each option separately. Select every correct answer.",
    TrueFalse: "The answer choices are fixed to True and False.",
    TrueFalseNotGiven: "The answer choices are fixed to True, False and Not Given.",
    YesNo: "The answer choices are fixed to Yes and No.",
    YesNoNotGiven: "The answer choices are fixed to Yes, No and Not Given.",
    Matching: "Enter the prompts as separate questions and provide the matching options.",
    MatchingHeadings: "Enter one paragraph statement, then add the heading options below.",
    MatchingInformation: "Enter the information to locate, then add paragraph labels as options.",
    MatchingFeatures: "Add the people/features as options and choose the matching one.",
    MatchingSentenceEndings: "Enter the sentence beginning and add possible endings as options.",
    Ordering: "Add the steps as options and enter their correct order using option letters.",
    FillBlank: "Use ___ in the prompt for each blank. For multiple blanks, enter one answer per line.",
    ShortAnswer: "Enter accepted answers separated by |, for example: 16 | sixteen.",
    SentenceCompletion: "Use ___ in the sentence. Put accepted answers on one line per blank.",
    NoteCompletion: "Use ___ for each missing note. Put accepted answers on one line per blank.",
    FormCompletion: "Use ___ for each missing field. Put accepted answers on one line per blank.",
    TableCompletion: "Use ___ for each missing cell. Put accepted answers on one line per blank.",
    SummaryCompletion: "Paste the summary with ___ at each gap. One answer line per gap.",
    FlowChartCompletion: "Use ___ at each missing step. One answer line per gap.",
    MapLabeling: "Add a map image/resource above and use one answer line per label.",
    DiagramLabeling: "Add a diagram image/resource above and use one answer line per label.",
    Essay: "Add the IELTS Writing task prompt. This answer is submitted for teacher review.",
    Speaking: "Add the speaking cue card/prompt and optional audio resource. Teacher reviews the response.",
};
const resourceTypes: AssignmentQuestion["Resources"][number]["Type"][] = [
    "Text", "Image", "Audio", "Video", "PDF",
];

function createQuestion(
    order: number,
    type: AssignmentQuestionType = "MultipleChoice",
    skill: AssignmentSkill = "Reading",
): AssignmentQuestionForm {
    return {
        Order: order,
        Type: type,
        Part: null,
        GroupID: "",
        Instructions: "",
        AnswerCount: 1,
        WordLimit: null,
        Title: "",
        Question: "",
        Resources: skill === "Listening"
            ? [{ Type: "Audio", Url: "", Content: "" }]
            : [],
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

function formatAnswerForEditor(answer: unknown, type: AssignmentQuestionType): string {
    const parsed = parseAnswer(formatAnswer(answer));
    if (type === "Ordering" && Array.isArray(parsed)) return parsed.join(", ");
    if (Array.isArray(parsed) && !choiceQuestionTypes.has(type)) {
        return parsed
            .map((item) => Array.isArray(item) ? item.join(" | ") : String(item ?? ""))
            .join("\n");
    }
    if (typeof parsed === "string") return parsed;
    return parsed === null || parsed === undefined ? "" : JSON.stringify(parsed);
}

function parseAnswer(answer: string): unknown {
    if (!answer.trim()) return "";
    try {
        return JSON.parse(answer);
    } catch {
        return answer;
    }
}

function parseTextAnswers(answer: string): unknown {
    const lines = answer.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsedLines = lines.map((line) => {
        const alternatives = line.split("|").map((item) => item.trim()).filter(Boolean);
        if (alternatives.length > 1) return alternatives;
        return alternatives[0] ?? "";
    });
    if (parsedLines.length === 1 && !Array.isArray(parsedLines[0])) return parsedLines[0];
    return parsedLines;
}

function makeChoiceLines(type: AssignmentQuestionType, choices: AssignmentQuestion["Choices"]): string {
    const preset = fixedChoices[type];
    return (preset ?? choices.map((choice) => choice.Content))
        .join("\n");
}

function getCorrectChoiceKeys(question: AssignmentQuestionForm): string[] {
    const parsed = parseAnswer(question.CorrectAnswerText);
    const answers = Array.isArray(parsed) ? parsed : parsed === "" ? [] : [parsed];
    const choices = parseChoices(question.ChoicesText);
    return answers.map((answer) => {
        const normalized = String(answer).trim().toLowerCase();
        return choices.find((choice) =>
            choice.Key.toLowerCase() === normalized ||
            choice.Content.trim().toLowerCase() === normalized
        )?.Key ?? "";
    }).filter(Boolean);
}

function usesMultipleChoiceAnswers(
    question: Pick<AssignmentQuestionForm, "Type" | "AnswerCount">,
): boolean {
    return question.Type === "Checkbox" ||
        (question.AnswerCount > 1 && question.Type !== "Ordering");
}

function serializeCorrectAnswer(question: AssignmentQuestionForm): unknown {
    if (["Essay", "Speaking"].includes(question.Type)) return null;
    if (question.Type === "Ordering") {
        return question.CorrectAnswerText
            .split(/[,\n]/)
            .map((answer) => answer.trim())
            .filter(Boolean);
    }
    if (choiceQuestionTypes.has(question.Type)) return parseAnswer(question.CorrectAnswerText);
    if (question.CorrectAnswerText.trim().startsWith("[") ||
        question.CorrectAnswerText.trim().startsWith("{")) {
        return parseAnswer(question.CorrectAnswerText);
    }
    return parseTextAnswers(question.CorrectAnswerText);
}

function partCountForSkill(skill: AssignmentSkill): number {
    if (skill === "Reading" || skill === "Speaking") return 3;
    if (skill === "Writing") return 2;
    return 4;
}

function defaultQuestionType(skill: AssignmentSkill): AssignmentQuestionType {
    if (skill === "Writing") return "Essay";
    if (skill === "Speaking") return "Speaking";
    return "MultipleChoice";
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
    const [uploadingResourceKey, setUploadingResourceKey] = useState<string | null>(null);
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
                ChoicesText: makeChoiceLines(question.Type, question.Choices ?? []),
                CorrectAnswerText: formatAnswerForEditor(question.CorrectAnswer, question.Type),
                Resources: assignment.Skill === "Listening" &&
                    !(question.Resources ?? []).some((resource) => resource.Type === "Audio")
                    ? [...(question.Resources ?? []), { Type: "Audio", Url: "", Content: "" }]
                    : question.Resources ?? [],
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

    const changeQuestionType = (index: number, type: AssignmentQuestionType) => {
        updateQuestion(index, {
            Type: type,
            ChoicesText: fixedChoices[type]?.join("\n") ?? "",
            CorrectAnswerText: "",
            AnswerCount: type === "Checkbox" ? 2 : 1,
        });
    };

    const updateChoice = (index: number, choiceIndex: number, value: string) => {
        const question = form.Questions[index];
        const options = question.ChoicesText.split(/\r?\n/);
        options[choiceIndex] = value;
        updateQuestion(index, { ChoicesText: options.join("\n") });
    };

    const addChoice = (index: number) => {
        const question = form.Questions[index];
        updateQuestion(index, {
            ChoicesText: [
                ...parseChoices(question.ChoicesText).map((choice) => choice.Content),
                `Lựa chọn ${parseChoices(question.ChoicesText).length + 1}`,
            ].join("\n"),
        });
    };

    const removeChoice = (index: number, choiceIndex: number) => {
        const question = form.Questions[index];
        const options = question.ChoicesText.split(/\r?\n/);
        options.splice(choiceIndex, 1);
        updateQuestion(index, { ChoicesText: options.join("\n"), CorrectAnswerText: "" });
    };

    const updateResource = (
        questionIndex: number,
        resourceIndex: number,
        field: "Type" | "Url" | "Content",
        value: string,
    ) => {
        const question = form.Questions[questionIndex];
        const resources = question.Resources.map((resource, index) =>
            index === resourceIndex
                ? { ...resource, [field]: value }
                : resource
        );
        updateQuestion(questionIndex, { Resources: resources });
    };

    const handleResourceUpload = async (
        event: ChangeEvent<HTMLInputElement>,
        questionIndex: number,
        resourceIndex: number,
        resourceType: AssignmentQuestion["Resources"][number]["Type"],
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (resourceType === "Text") {
            setActionError("Tài liệu dạng Text được nhập trực tiếp, không cần tải file.");
            event.target.value = "";
            return;
        }

        const uploadKey = `${questionIndex}-${resourceIndex}`;
        setActionError("");
        setUploadingResourceKey(uploadKey);
        try {
            const url = await uploadCloudinaryResource(file, resourceType);
            updateResource(questionIndex, resourceIndex, "Url", url);
        } catch (error) {
            setActionError(
                error instanceof Error ? error.message : "Không thể tải tài liệu lên Cloudinary.",
            );
        } finally {
            setUploadingResourceKey(null);
            event.target.value = "";
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (uploadingResourceKey) {
            setActionError("Vui lòng đợi tải tài liệu hoàn tất trước khi lưu.");
            return;
        }
        if (form.Skill === "Listening") {
            const questionWithoutAudio = form.Questions.find((question) =>
                !(question.Resources ?? []).some(
                    (resource) => resource.Type === "Audio" && resource.Url.trim(),
                ),
            );
            if (questionWithoutAudio) {
                setActionError(
                    `Câu Listening số ${questionWithoutAudio.Order} chưa có audio. Hãy tải file audio lên trước khi lưu.`,
                );
                return;
            }
        }
        const invalidQuestion = form.Questions.find((question) => {
            if (["Essay", "Speaking"].includes(question.Type)) return false;
            if (choiceQuestionTypes.has(question.Type)) {
                const choices = parseChoices(question.ChoicesText);
                if (choices.length < 2) return true;
                if (question.Type === "Ordering") {
                    const correctOrder = serializeCorrectAnswer(question);
                    return !Array.isArray(correctOrder) ||
                        correctOrder.length !== choices.length ||
                        correctOrder.some((key) => !choices.some((choice) => choice.Key === key));
                }
                const correctCount = getCorrectChoiceKeys(question).length;
                return correctCount === 0 ||
                    (question.AnswerCount > 1 && correctCount !== question.AnswerCount);
            }
            const answer = serializeCorrectAnswer(question);
            if (typeof answer === "string") return !answer.trim();
            return !Array.isArray(answer) || answer.length === 0 ||
                (question.AnswerCount > 1 && answer.length !== question.AnswerCount);
        });
        if (invalidQuestion) {
            setActionError(
                `Hoàn thiện lựa chọn và đáp án đúng cho câu ${invalidQuestion.Order} trước khi lưu.`,
            );
            return;
        }

        setIsSaving(true);
        setActionError("");

        const payload: AssignmentPayload = {
            ...form,
            CourseID: courseId,
            StartDate: form.StartDate || undefined,
            EndDate: form.EndDate || undefined,
            Questions: form.Questions.map((question, index) => {
                const { ChoicesText, CorrectAnswerText, ...questionData } = question;
                return {
                    ...questionData,
                    Order: index + 1,
                    Choices: parseChoices(ChoicesText),
                    CorrectAnswer: serializeCorrectAnswer({
                        ...questionData,
                        ChoicesText,
                        CorrectAnswerText,
                    }),
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
                                            Questions: event.target.value === "Listening"
                                                ? form.Questions.map((question) => ({
                                                    ...question,
                                                    Resources: question.Resources.some(
                                                        (resource) => resource.Type === "Audio",
                                                    )
                                                        ? question.Resources
                                                        : [
                                                            ...question.Resources,
                                                            { Type: "Audio", Url: "", Content: "" },
                                                        ],
                                                }))
                                                : form.Questions,
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
                                    Duration (minutes, 0 = no limit)
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
                                    <div>
                                    <h6 className="mb-1">
                                        IELTS questions ({form.Questions.length})
                                    </h6>
                                    <small className="text-muted">
                                        Mỗi câu có mẫu nhập và cách chấm riêng theo dạng IELTS.
                                    </small>
                                    </div>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        type="button"
                                        disabled={uploadingResourceKey !== null}
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                Questions: [
                                                    ...form.Questions,
                                                    createQuestion(
                                                        form.Questions.length + 1,
                                                        defaultQuestionType(form.Skill),
                                                        form.Skill,
                                                    ),
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
                                                    disabled={uploadingResourceKey !== null}
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
                                            <p className="assignment-question-type-hint">
                                                {questionTypeHints[question.Type]}
                                            </p>

                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label">
                                                        Question type
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={question.Type}
                                                        onChange={(event) =>
                                                            changeQuestionType(
                                                                index,
                                                                event.target.value as AssignmentQuestionType,
                                                            )
                                                        }
                                                    >
                                                        {questionTypeGroups.map((group) => (
                                                            <optgroup key={group.label} label={group.label}>
                                                                {group.types.map((type) => (
                                                                    <option key={type} value={type}>
                                                                        {questionTypeLabels[type]}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
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
                                                        {Array.from(
                                                            { length: partCountForSkill(form.Skill) },
                                                            (_, partIndex) => partIndex + 1,
                                                        ).map((part) => (
                                                            <option key={part} value={part}>{part}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label">Điểm câu</label>
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
                                                    <label className="form-label">Nhãn câu / số câu</label>
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

                                                <div className="col-md-4">
                                                    <label className="form-label">Question group (optional)</label>
                                                    <input
                                                        className="form-control"
                                                        value={question.GroupID}
                                                        onChange={(event) => updateQuestion(index, {
                                                            GroupID: event.target.value,
                                                        })}
                                                        placeholder="Ví dụ: Passage 1 / Audio Part 2"
                                                    />
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label">
                                                        {question.Type === "Essay"
                                                            ? "Đề bài Writing"
                                                            : question.Type === "Speaking"
                                                                ? "Cue card / câu hỏi Speaking"
                                                                : "Câu hỏi / nội dung có chỗ trống"}
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={question.Type === "Essay" || question.Type === "Speaking" ? 4 : 3}
                                                        placeholder={
                                                            question.Type === "Essay"
                                                                ? "Ví dụ: Some people believe ... Discuss both views and give your opinion."
                                                                : question.Type === "Speaking"
                                                                    ? "Ví dụ: Describe a place you would like to visit..."
                                                                    : "Ví dụ: The capital of France is ___."
                                                        }
                                                        value={question.Question}
                                                        onChange={(event) =>
                                                            updateQuestion(index, {
                                                                Question: event.target.value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>

                                                {question.Type === "Essay" || question.Type === "Speaking" ? (
                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        {question.Type === "Essay" ? "Word limit (optional)" : "Thời lượng trả lời (giây, tùy chọn)"}
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        min={1}
                                                        value={question.WordLimit ?? ""}
                                                        onChange={(event) => updateQuestion(index, {
                                                            WordLimit: event.target.value ? Number(event.target.value) : null,
                                                        })}
                                                    />
                                                    <small className="text-muted">
                                                        Bài này được gửi giáo viên chấm thủ công.
                                                    </small>
                                                </div>
                                                ) : (
                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        {["FillBlank", "ShortAnswer", "SentenceCompletion", "NoteCompletion",
                                                            "FormCompletion", "TableCompletion", "SummaryCompletion",
                                                            "FlowChartCompletion", "MapLabeling", "DiagramLabeling"].includes(question.Type)
                                                            ? "Số chỗ trống / đáp án"
                                                            : question.Type === "Checkbox"
                                                                ? "Số lựa chọn đúng"
                                                                : "Số đáp án cần chọn"}
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        min={1}
                                                        max={20}
                                                        value={question.AnswerCount}
                                                        onChange={(event) => updateQuestion(index, {
                                                            AnswerCount: Math.max(1, Number(event.target.value)),
                                                        })}
                                                    />
                                                </div>
                                                )}

                                                {choiceQuestionTypes.has(question.Type) && (
                                                <>
                                                    <div className="col-md-6">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <label className="form-label mb-0">
                                                                {question.Type === "Ordering" ? "Các bước cần sắp xếp" : "Lựa chọn"}
                                                            </label>
                                                            {!fixedChoices[question.Type] && (
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm"
                                                                    type="button"
                                                                    onClick={() => addChoice(index)}
                                                                >
                                                                    <FaPlus className="me-1" /> Thêm lựa chọn
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="assignment-choice-editor">
                                                            {parseChoices(question.ChoicesText).map((choice, choiceIndex) => (
                                                                <div className="input-group mb-2" key={`${index}-${choice.Key}`}>
                                                                    <span className="input-group-text">{choice.Key}</span>
                                                                    <input
                                                                        className="form-control"
                                                                        value={choice.Content}
                                                                        disabled={Boolean(fixedChoices[question.Type])}
                                                                        onChange={(event) => updateChoice(index, choiceIndex, event.target.value)}
                                                                        aria-label={`Lựa chọn ${choice.Key}`}
                                                                    />
                                                                    {!fixedChoices[question.Type] && (
                                                                        <button
                                                                            className="btn btn-outline-danger"
                                                                            type="button"
                                                                            onClick={() => removeChoice(index, choiceIndex)}
                                                                            aria-label={`Xóa lựa chọn ${choice.Key}`}
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {parseChoices(question.ChoicesText).length === 0 && (
                                                                <p className="text-muted mb-0">Thêm lựa chọn để cấu hình đáp án.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <label className="form-label">
                                                            {usesMultipleChoiceAnswers(question)
                                                                ? "Đánh dấu tất cả đáp án đúng"
                                                                : question.Type === "Ordering"
                                                                    ? "Thứ tự đúng (ví dụ: B, A, C)"
                                                                    : "Chọn đáp án đúng"}
                                                        </label>
                                                        {question.Type === "Ordering" ? (
                                                            <input
                                                                className="form-control"
                                                                value={question.CorrectAnswerText}
                                                                onChange={(event) => updateQuestion(index, {
                                                                    CorrectAnswerText: event.target.value,
                                                                })}
                                                                placeholder="B, A, C"
                                                            />
                                                        ) : (
                                                            <div className="assignment-correct-answer-list">
                                                                {parseChoices(question.ChoicesText).map((choice) => {
                                                                    const selectedKeys = getCorrectChoiceKeys(question);
                                                                    const checked = selectedKeys.includes(choice.Key);
                                                                    return (
                                                                        <label className="form-check" key={`${index}-answer-${choice.Key}`}>
                                                                            <input
                                                                                className="form-check-input"
                                                                                type={usesMultipleChoiceAnswers(question) ? "checkbox" : "radio"}
                                                                                name={`correct-answer-${index}`}
                                                                                checked={checked}
                                                                                onChange={() => {
                                                                                    const nextKeys = usesMultipleChoiceAnswers(question)
                                                                                        ? checked
                                                                                            ? selectedKeys.filter((key) => key !== choice.Key)
                                                                                            : [...selectedKeys, choice.Key]
                                                                                        : [choice.Key];
                                                                                    updateQuestion(index, {
                                                                                        CorrectAnswerText: JSON.stringify(
                                                                                            usesMultipleChoiceAnswers(question) ? nextKeys : nextKeys[0],
                                                                                        ),
                                                                                    });
                                                                                }}
                                                                            />
                                                                            <span className="form-check-label">
                                                                                <strong>{choice.Key}.</strong> {choice.Content}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                                )}

                                                {!choiceQuestionTypes.has(question.Type) &&
                                                !["Essay", "Speaking"].includes(question.Type) && (
                                                <div className="col-12">
                                                    <label className="form-label">
                                                        Đáp án chấp nhận
                                                        {question.AnswerCount > 1 ? " (mỗi dòng cho một chỗ trống)" : ""}
                                                    </label>
                                                    {question.AnswerCount > 1 ? (
                                                        <textarea
                                                            className="form-control"
                                                            rows={Math.min(6, question.AnswerCount)}
                                                            value={question.CorrectAnswerText}
                                                            onChange={(event) => updateQuestion(index, {
                                                                CorrectAnswerText: event.target.value,
                                                            })}
                                                            placeholder={"Paris | the city of Paris\n16 | sixteen"}
                                                        />
                                                    ) : (
                                                        <input
                                                            className="form-control"
                                                            value={question.CorrectAnswerText}
                                                            onChange={(event) => updateQuestion(index, {
                                                                CorrectAnswerText: event.target.value,
                                                            })}
                                                            placeholder="Có thể nhập nhiều đáp án tương đương, cách nhau bằng |"
                                                        />
                                                    )}
                                                    <small className="text-muted">
                                                        {questionTypeHints[question.Type]}
                                                        {question.AnswerCount === 1 && " Dùng dấu | để nhập biến thể, ví dụ: 16 | sixteen."}
                                                    </small>
                                                </div>
                                                )}

                                                <div className="col-12">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <label className="form-label mb-0">Tài liệu cho câu hỏi (đoạn đọc, audio, hình, sơ đồ)</label>
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm"
                                                        type="button"
                                                        disabled={uploadingResourceKey !== null}
                                                        onClick={() => updateQuestion(index, {
                                                            Resources: [...(question.Resources ?? []), { Type: "Text", Url: "", Content: "" }],
                                                        })}
                                                    >
                                                        <FaPlus className="me-1" /> Thêm tài liệu
                                                    </button>
                                                </div>
                                                {(question.Resources ?? []).map((resource, resourceIndex) => (
                                                    <div className="row g-2 align-items-start mb-2" key={`${index}-resource-${resourceIndex}`}>
                                                        <div className="col-md-2">
                                                            <select
                                                                className="form-select"
                                                                aria-label="Loại tài liệu"
                                                                value={resource.Type}
                                                                disabled={uploadingResourceKey === `${index}-${resourceIndex}`}
                                                                onChange={(event) => updateResource(
                                                                    index,
                                                                    resourceIndex,
                                                                    "Type",
                                                                    event.target.value as AssignmentQuestion["Resources"][number]["Type"],
                                                                )}
                                                            >
                                                                {resourceTypes.map((type) => (
                                                                    <option value={type} key={type}>{type}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-9">
                                                            {resource.Type === "Text" ? (
                                                                <textarea
                                                                    className="form-control"
                                                                    rows={3}
                                                                    value={resource.Content}
                                                                    onChange={(event) => updateResource(index, resourceIndex, "Content", event.target.value)}
                                                                    placeholder="Dán passage / transcript / tài liệu đọc tại đây"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <div className="input-group mb-2">
                                                                        <input
                                                                            className="form-control"
                                                                            type="url"
                                                                            value={resource.Url}
                                                                            onChange={(event) => updateResource(index, resourceIndex, "Url", event.target.value)}
                                                                            placeholder={`URL ${resource.Type} hoặc tải file lên`}
                                                                        />
                                                                        <label className={`btn btn-outline-primary${uploadingResourceKey === `${index}-${resourceIndex}` ? " disabled" : ""}`}>
                                                                            <FaCloudUploadAlt className="me-1" />
                                                                            {uploadingResourceKey === `${index}-${resourceIndex}` ? "Đang tải..." : "Tải lên Cloudinary"}
                                                                            <input
                                                                                className="d-none"
                                                                                type="file"
                                                                                accept={
                                                                                    resource.Type === "Audio"
                                                                                        ? "audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                                                                                        : resource.Type === "Image"
                                                                                            ? "image/*"
                                                                                            : resource.Type === "Video"
                                                                                                ? "video/*"
                                                                                                : "application/pdf,.pdf"
                                                                                }
                                                                                disabled={uploadingResourceKey !== null}
                                                                                onChange={(event) => handleResourceUpload(
                                                                                    event,
                                                                                    index,
                                                                                    resourceIndex,
                                                                                    resource.Type,
                                                                                )}
                                                                            />
                                                                        </label>
                                                                    </div>
                                                                    <input
                                                                        className="form-control"
                                                                        value={resource.Content}
                                                                        onChange={(event) => updateResource(index, resourceIndex, "Content", event.target.value)}
                                                                        placeholder="Mô tả tài liệu (tùy chọn)"
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="col-md-1">
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                type="button"
                                                                aria-label="Xóa tài liệu"
                                                                disabled={uploadingResourceKey !== null}
                                                                onClick={() => updateQuestion(index, {
                                                                    Resources: (question.Resources ?? []).filter((_, itemIndex) => itemIndex !== resourceIndex),
                                                                })}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                        {form.Skill === "Listening" && (
                                                            <small className="text-muted d-block mt-1">
                                                                Câu Listening cần có audio. File tải lên sẽ được lưu trên Cloudinary.
                                                            </small>
                                                        )}
                                                    </div>
                                                ))}
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
