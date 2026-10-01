import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
    FaArrowLeft,
    FaPlus,
    FaEdit,
    FaTrash,
    FaGripVertical,
    FaFileAlt,
    FaVideo,
    FaFilePdf,
    FaImage,
    FaHeadphones,
    FaQuestionCircle
} from "react-icons/fa";

import {
    getLessonById,
    getLessonDetailsByLessonId,
    deleteLessonDetail,
    reorderLessonDetails
} from "../../services/lesson.service";

import type { Lesson, LessonDetail } from "../../types/lesson";

import "./LessonDetailForm.css";

function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

type SortableDetailProps = {
    detail: LessonDetail;
    disabled: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
};

function SortableDetail({ detail, disabled, onEdit, onDelete }: SortableDetailProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: detail._id!,
        disabled
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };
    const showsContent = detail.Type === "Text" || detail.Type === "Quiz";
    const validFileUrl = detail.FileUrl && isValidHttpUrl(detail.FileUrl);

    return (
        <div ref={setNodeRef} style={style} className="content-item">
            <button
                type="button"
                className="btn btn-light content-drag-handle"
                aria-label={`Reorder ${detail.Type} content`}
                title="Drag to reorder"
                {...attributes}
                {...listeners}
            >
                <FaGripVertical />
            </button>

            <span className="content-order">{detail.Order}</span>

            <div className={`content-icon ${detail.Type.toLowerCase()}`}>
                {detail.Type === "Video" ? <FaVideo />
                    : detail.Type === "Audio" ? <FaHeadphones />
                        : detail.Type === "PDF" ? <FaFilePdf />
                            : detail.Type === "Image" ? <FaImage />
                                : detail.Type === "Quiz" ? <FaQuestionCircle />
                                    : <FaFileAlt />}
            </div>

            <div className="content-info">
                <div className="content-top">
                    <span className="content-type">{detail.Type}</span>
                    <span className={detail.Status ? "content-status active" : "content-status inactive"}>
                        {detail.Status ? "Active" : "Inactive"}
                    </span>
                </div>

                <div className="content-preview">
                    {showsContent
                        ? detail.Content || "No content"
                        : detail.FileUrl || "No file"}
                </div>

                {detail.Type === "Image" && validFileUrl && (
                    <img
                        src={detail.FileUrl}
                        alt="Lesson content preview"
                        className="content-image-preview"
                        onError={(event) => {
                            event.currentTarget.hidden = true;
                        }}
                    />
                )}

                {!showsContent && validFileUrl && (
                    <a
                        href={detail.FileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="file-link"
                    >
                        Open {detail.Type}
                    </a>
                )}
            </div>

            <div className="content-actions">
                <button
                    className="btn btn-outline-warning"
                    aria-label="Edit content"
                    onClick={() => onEdit(detail._id!)}
                >
                    <FaEdit />
                </button>
                <button
                    className="btn btn-outline-danger"
                    aria-label="Delete content"
                    onClick={() => onDelete(detail._id!)}
                >
                    <FaTrash />
                </button>
            </div>
        </div>
    );
}

function LessonDetailPage() {

    const { courseId, lessonId } = useParams();

    const navigate = useNavigate();

    const [lesson, setLesson] = useState<Lesson | null>(null);

    const [details, setDetails] = useState<LessonDetail[]>([]);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 6 }
    }));

    useEffect(() => {
        if (!lessonId) return;

        let cancelled = false;

        Promise.all([
            getLessonById(lessonId),
            getLessonDetailsByLessonId(lessonId)
        ]).then(([lessonData, lessonDetails]) => {
            if (cancelled) return;

            setLesson(lessonData.Lesson);
            setDetails([...lessonDetails].sort((first, second) => first.Order - second.Order));
            setOrderError(null);
        }).catch(error => {
            console.error("Load lesson content error:", error);
        });

        return () => {
            cancelled = true;
        };
    }, [lessonId]);

    async function loadLesson() {
        try {
            const [lessonData, lessonDetails] = await Promise.all([
                getLessonById(lessonId!),
                getLessonDetailsByLessonId(lessonId!)
            ]);

            setLesson(lessonData.Lesson);
            setDetails([...lessonDetails].sort((first, second) => first.Order - second.Order));
            setOrderError(null);
        } catch (error) {
            console.error("Reload lesson content error:", error);
        }
    }

    async function handleDelete(id: string) {

        if (!window.confirm("Delete this content?")) {
            return;
        }

        try {

            await deleteLessonDetail(id);

            loadLesson();

        }
        catch (error) {

            console.log(error);

        }

    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id || isSavingOrder || !lessonId) return;

        const oldIndex = details.findIndex(detail => detail._id === active.id);
        const newIndex = details.findIndex(detail => detail._id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const reorderedDetails = arrayMove(details, oldIndex, newIndex).map((detail, index) => ({
            ...detail,
            Order: index + 1
        }));
        setDetails(reorderedDetails);
        setOrderError(null);
        setIsSavingOrder(true);

        try {
            const savedDetails = await reorderLessonDetails(
                lessonId,
                reorderedDetails.map(detail => detail._id!)
            );
            setDetails(savedDetails);
        } catch (error) {
            setDetails(details);
            const responseMessage = (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            setOrderError(responseMessage || "Could not save the new content order.");
        } finally {
            setIsSavingOrder(false);
        }
    }

    function handleAddContent() {

        navigate(
            `/admin/courses/${courseId}/lessons/${lessonId}/details/create`
        );

    }

    function handleEditContent(id: string) {

        navigate(
            `/admin/courses/${courseId}/lessons/${lessonId}/details/${id}/edit`
        );

    }

    return (

        <div className="container py-4">

            {/* Back */}

            <button
                className="btn btn-outline-secondary mb-4"
                onClick={() =>
                    navigate(`/admin/courses/${courseId}?tab=lessons`)
                }
            >

                <FaArrowLeft className="me-2" />

                Back to Lessons

            </button>


            {/* Main Card */}

            <div className="lesson-content-card">

                {/* Header */}

                <div className="lesson-content-header">

                    <div>

                        <div className="lesson-label">

                            LESSON CONTENT

                        </div>

                        <h2>

                            {lesson?.Name || "Lesson"}

                        </h2>

                        <p>

                            {lesson?.Description || "Manage lesson content"}

                        </p>

                    </div>


                    <button
                        className="btn btn-primary add-content-btn"
                        onClick={handleAddContent}
                    >
                        <FaPlus className="me-2" />
                        Add Content
                    </button>

                </div>

                {/* Stats */}

                <div className="content-summary">

                    <div className="summary-item">

                        <span className="summary-number">

                            {details.length}

                        </span>

                        <span className="summary-label">

                            Content Items

                        </span>

                    </div>


                    <div className="summary-divider" />

                    <div className="summary-item">

                        <span className="summary-number">

                            {details.filter(item => item.Status).length}

                        </span>

                        <span className="summary-label">

                            Active

                        </span>

                    </div>


                    <div className="summary-divider" />


                    <div className="summary-item">

                        <span className="summary-number">

                            {details.filter(item => item.Type === "Text").length}

                        </span>

                        <span className="summary-label">

                            Text

                        </span>

                    </div>

                </div>


                {isSavingOrder && (
                    <div className="alert alert-info mx-4 mt-3 mb-0" role="status">
                        Saving content order...
                    </div>
                )}

                {orderError && (
                    <div className="alert alert-danger mx-4 mt-3 mb-0" role="alert">
                        {orderError}
                    </div>
                )}

                {/* Content List */}

                <div className="content-list">

                    {details.length === 0 ? (

                        <div className="empty-content">

                            <div className="empty-icon">

                                <FaFileAlt />

                            </div>

                            <h5>

                                No content yet

                            </h5>

                            <p>

                                Add your first content to this lesson.

                            </p>

                            <button
                                className="btn btn-primary"
                                onClick={handleAddContent}
                            >

                                <FaPlus className="me-2" />

                                Add Content

                            </button>

                        </div>

                    ) : (

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={details.map(detail => detail._id!)}
                                strategy={verticalListSortingStrategy}
                            >
                                {details.map(detail => (
                                    <SortableDetail
                                        key={detail._id}
                                        detail={detail}
                                        disabled={isSavingOrder}
                                        onEdit={handleEditContent}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                    )}

                </div>

            </div>

        </div>

    );

}

export default LessonDetailPage;