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
const skillLabels: Record<AssignmentSkill, string> = {
    Reading: "Đọc",
    Listening: "Nghe",
    Writing: "Viết",
    Speaking: "Nói",
};
const assignmentTypeLabels: Record<AssignmentType, string> = {
    Practice: "Luyện tập",
    Quiz: "Kiểm tra nhanh",
    Exam: "Bài thi",
    Homework: "Bài tập về nhà",
};
const questionTypeGroups: { label: string; types: AssignmentQuestionType[] }[] = [
    {
        label: "Đọc và Nghe",
        types: [
            "MultipleChoice", "Checkbox", "TrueFalse", "TrueFalseNotGiven",
            "YesNo", "YesNoNotGiven", "Matching", "MatchingHeadings", "MatchingInformation",
            "MatchingFeatures", "MatchingSentenceEndings", "Ordering",
        ],
    },
    {
        label: "Dạng điền từ và trả lời ngắn",
        types: [
            "FillBlank", "ShortAnswer", "SentenceCompletion", "NoteCompletion",
            "FormCompletion", "TableCompletion", "SummaryCompletion",
            "FlowChartCompletion", "MapLabeling", "DiagramLabeling",
        ],
    },
    {
        label: "Viết và Nói",
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
    MultipleChoice: "Trắc nghiệm một đáp án",
    Checkbox: "Chọn nhiều đáp án",
    TrueFalse: "Đúng / Sai",
    TrueFalseNotGiven: "Đúng / Sai / Không có thông tin",
    YesNo: "Có / Không",
    YesNoNotGiven: "Có / Không / Không có thông tin",
    Matching: "Nối đáp án",
    MatchingHeadings: "Nối tiêu đề",
    MatchingInformation: "Nối thông tin",
    MatchingFeatures: "Nối đặc điểm",
    MatchingSentenceEndings: "Nối phần kết câu",
    Ordering: "Sắp xếp trình tự",
    FillBlank: "Điền vào chỗ trống",
    ShortAnswer: "Trả lời ngắn",
    SentenceCompletion: "Hoàn thành câu",
    NoteCompletion: "Hoàn thành ghi chú",
    FormCompletion: "Hoàn thành biểu mẫu",
    TableCompletion: "Hoàn thành bảng",
    SummaryCompletion: "Hoàn thành phần tóm tắt",
    FlowChartCompletion: "Hoàn thành lưu đồ",
    MapLabeling: "Ghi chú trên bản đồ",
    DiagramLabeling: "Ghi chú trên sơ đồ",
    Essay: "Bài viết",
    Speaking: "Câu trả lời nói",
};
const questionTypeHints: Record<AssignmentQuestionType, string> = {
    MultipleChoice: "Thêm từng lựa chọn riêng, sau đó chọn một đáp án đúng.",
    Checkbox: "Thêm từng lựa chọn riêng và chọn tất cả đáp án đúng.",
    TrueFalse: "Các lựa chọn cố định là Đúng và Sai.",
    TrueFalseNotGiven: "Các lựa chọn cố định là Đúng, Sai và Không có thông tin.",
    YesNo: "Các lựa chọn cố định là Có và Không.",
    YesNoNotGiven: "Các lựa chọn cố định là Có, Không và Không có thông tin.",
    Matching: "Nhập từng câu hỏi riêng và thêm các lựa chọn cần nối.",
    MatchingHeadings: "Nhập nội dung đoạn văn, sau đó thêm các tiêu đề lựa chọn.",
    MatchingInformation: "Nhập thông tin cần tìm, sau đó thêm nhãn đoạn văn làm lựa chọn.",
    MatchingFeatures: "Thêm người hoặc đặc điểm vào danh sách lựa chọn.",
    MatchingSentenceEndings: "Nhập phần đầu câu và thêm các phương án kết thúc.",
    Ordering: "Thêm các bước làm lựa chọn và nhập thứ tự đúng bằng ký tự đáp án.",
    FillBlank: "Dùng ___ để đánh dấu mỗi chỗ trống. Mỗi dòng là một đáp án.",
    ShortAnswer: "Nhập các đáp án được chấp nhận, phân cách bằng |. Ví dụ: 16 | sixteen.",
    SentenceCompletion: "Dùng ___ trong câu để đánh dấu chỗ trống. Mỗi dòng là một đáp án.",
    NoteCompletion: "Dùng ___ để đánh dấu chỗ trống trong ghi chú. Mỗi dòng là một đáp án.",
    FormCompletion: "Dùng ___ để đánh dấu từng ô còn thiếu. Mỗi dòng là một đáp án.",
    TableCompletion: "Dùng ___ để đánh dấu từng ô còn thiếu. Mỗi dòng là một đáp án.",
    SummaryCompletion: "Dán phần tóm tắt và dùng ___ tại mỗi chỗ trống. Mỗi dòng là một đáp án.",
    FlowChartCompletion: "Dùng ___ để đánh dấu từng bước còn thiếu. Mỗi dòng là một đáp án.",
    MapLabeling: "Thêm hình ảnh bản đồ ở trên và nhập một đáp án cho mỗi nhãn.",
    DiagramLabeling: "Thêm hình ảnh sơ đồ ở trên và nhập một đáp án cho mỗi nhãn.",
    Essay: "Thêm đề bài Viết IELTS. Câu trả lời sẽ được gửi cho giáo viên chấm.",
    Speaking: "Thêm thẻ gợi ý/câu hỏi Nói và tệp âm thanh nếu cần. Giáo viên sẽ chấm câu trả lời.",
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

    return error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
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
        if (!window.confirm(`Bạn có chắc muốn xóa bài tập "${assignment.Title}" không?`)) return;

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
                <h4 className="mb-0">Danh sách bài tập</h4>
                <button className="btn btn-primary" onClick={openCreateForm}>
                    <FaPlus className="me-2" />
                    Thêm bài tập
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
                            {editingId ? "Chỉnh sửa bài tập" : "Tạo bài tập"}
                        </h5>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="assignment-title">
                                    Tiêu đề
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
                                    Kỹ năng
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
                                        <option key={skill} value={skill}>{skillLabels[skill]}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label" htmlFor="assignment-type">
                                    Dạng bài tập
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
                                        <option key={type} value={type}>{assignmentTypeLabels[type]}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12">
                                <label className="form-label" htmlFor="assignment-description">
                                    Mô tả
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
                                    Bài học
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
                                    <option value="">Bài tập chung của khóa học</option>
                                    {lessons.map((lesson) => (
                                        <option key={lesson._id} value={lesson._id}>
                                            {lesson.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label" htmlFor="assignment-duration">
                                    Thời lượng (phút, 0 = không giới hạn)
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
                                    Tổng điểm
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
                                    Số lượt làm tối đa
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
                                    Ngày bắt đầu
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
                                    Ngày kết thúc
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
                                        Mở bài tập cho học viên
                                    </label>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                    <h6 className="mb-1">
                                        Câu hỏi IELTS ({form.Questions.length})
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
                                        Thêm câu hỏi
                                    </button>
                                </div>

                                {form.Questions.map((question, index) => (
                                    <div className="card bg-light mb-3" key={index}>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Câu hỏi {index + 1}</h6>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    type="button"
                                                    aria-label={`Xóa câu hỏi ${index + 1}`}
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
                                                        Dạng câu hỏi
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
                                                    <label className="form-label">Phần thi</label>
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
                                                        <option value="">Chưa chọn</option>
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
                                                    <label className="form-label">Nhóm câu hỏi (không bắt buộc)</label>
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
                                                                ? "Thẻ gợi ý / câu hỏi Nói"
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
                                                        {question.Type === "Essay"                                                         ? "Giới hạn số từ (không bắt buộc)" : "Thời lượng trả lời (giây, không bắt buộc)"}
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
                                                    <label className="form-label">Hướng dẫn</label>
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
                                                    <label className="form-label">Giải thích đáp án</label>
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
                                {isSaving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo bài tập"}
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setIsEditorOpen(false)}
                                disabled={isSaving}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Bài học</th>
                            <th>Kỹ năng</th>
                            <th>Dạng bài</th>
                            <th>Số câu hỏi</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
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
                                    )?.Name ?? "Bài tập toàn khóa"}
                                </td>
                                <td>{skillLabels[assignment.Skill]}</td>
                                <td>{assignmentTypeLabels[assignment.AssignmentType]}</td>
                                <td>{assignment.Questions?.length ?? 0}</td>
                                <td>
                                    <span className={`badge ${assignment.IsOpen ? "bg-success" : "bg-secondary"}`}>
                                        {assignment.IsOpen ? "Đang mở" : "Đã đóng"}
                                    </span>
                                </td>
                                <td className="text-nowrap">
                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        aria-label={`Chỉnh sửa ${assignment.Title}`}
                                        onClick={() => openEditForm(assignment)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        aria-label={`Xóa ${assignment.Title}`}
                                        onClick={() => handleDelete(assignment)}
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-5 text-muted">
                                    {loadError ? "Không thể tải bài tập." : "Khóa học chưa có bài tập."}
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
