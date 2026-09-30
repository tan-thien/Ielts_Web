import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    FaArrowLeft,
    FaPlus,
    FaEdit,
    FaTrash,
    FaFileAlt,
    FaVideo,
    FaFilePdf,
    FaImage,
    FaHeadphones,
    FaQuestionCircle
} from "react-icons/fa";

import {
    getLessonById,
    deleteLessonDetail
} from "../../services/lesson.service";

import type { Lesson, LessonDetail } from "../../types/lesson";

import "./LessonDetailForm.css";

function LessonDetailPage() {

    const { courseId, lessonId } = useParams();

    const navigate = useNavigate();

    const [lesson, setLesson] = useState<Lesson | null>(null);

    const [details, setDetails] = useState<LessonDetail[]>([]);

    useEffect(() => {

        loadLesson();

    }, [lessonId]);

    async function loadLesson() {

        try {

            const res = await getLessonById(lessonId!);

            setLesson(res.Lesson);

            setDetails(res.Details || []);

        }
        catch (error) {

            console.log(error);

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

    function getIcon(type: LessonDetail["Type"]) {

        switch (type) {

            case "Video":
                return <FaVideo />;

            case "Audio":
                return <FaHeadphones />;

            case "PDF":
                return <FaFilePdf />;

            case "Image":
                return <FaImage />;

            case "Quiz":
                return <FaQuestionCircle />;

            default:
                return <FaFileAlt />;

        }

    }

    function getPreview(detail: LessonDetail) {

        if (detail.Type === "Text" || detail.Type === "Quiz") {

            if (!detail.Content) {
                return "No content";
            }

            if (detail.Content.length > 180) {

                return detail.Content.substring(0, 180) + "...";

            }

            return detail.Content;

        }

        if (detail.FileUrl) {

            return "File uploaded";

        }

        return "No file";

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

                        details.map((detail) => (

                            <div
                                className="content-item"
                                key={detail._id}
                            >

                                {/* Icon */}

                                <div className={`content-icon ${detail.Type.toLowerCase()}`}>

                                    {getIcon(detail.Type)}

                                </div>


                                {/* Information */}

                                <div className="content-info">

                                    <div className="content-top">

                                        <span className="content-type">

                                            {detail.Type}

                                        </span>

                                        <span
                                            className={
                                                detail.Status
                                                    ? "content-status active"
                                                    : "content-status inactive"
                                            }
                                        >

                                            {detail.Status
                                                ? "Active"
                                                : "Inactive"}

                                        </span>

                                    </div>


                                    <div className="content-preview">

                                        {getPreview(detail)}

                                    </div>


                                    {detail.FileUrl && (

                                        <a
                                            href={detail.FileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="file-link"
                                        >

                                            View uploaded file

                                        </a>

                                    )}

                                </div>

                                <div className="content-actions">

                                    <button
                                        className="btn btn-outline-warning"
                                        onClick={() =>
                                            handleEditContent(detail._id!)
                                        }
                                    >
                                        <FaEdit />

                                    </button>

                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() =>
                                            handleDelete(detail._id!)
                                        }
                                    >

                                        <FaTrash />

                                    </button>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </div>

    );

}

export default LessonDetailPage;