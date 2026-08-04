import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft, FaPlus, FaEdit, FaTrash, FaFileAlt, FaVideo,
    FaFilePdf, FaImage, FaHeadphones, FaQuestionCircle
} from "react-icons/fa";
import "./LessonDetailForm.css"
import { getLessonById, deleteLessonDetail } from "../../services/lesson.service";

function LessonDetailPage() {

    const { courseId, lessonId } = useParams();

    const navigate = useNavigate();

    const [lesson, setLesson] = useState<any>();

    const [details, setDetails] = useState<any[]>([]);

    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    async function loadLesson() {

        const res = await getLessonById(lessonId!);

        setLesson(res.Lesson);

        setDetails(res.Details);

    }

    async function handleDelete(id: string) {

        if (!window.confirm("Delete this content?")) return;

        await deleteLessonDetail(id);

        loadLesson();

    }

    function getIcon(type: string) {

        switch (type) {

            case "Video":
                return <FaVideo color="#dc3545" />;

            case "PDF":
                return <FaFilePdf color="#d9534f" />;

            case "Image":
                return <FaImage color="#198754" />;

            case "Audio":
                return <FaHeadphones color="#0d6efd" />;

            case "Quiz":
                return <FaQuestionCircle color="#ffc107" />;

            default:
                return <FaFileAlt color="#6c757d" />;

        }

    }

    return (

        <div className="container py-4">

            <button
                className="btn btn-outline-secondary mb-4"
                onClick={() =>
                    navigate(`/admin/courses/${courseId}?tab=lessons`)
                }
            >
                <FaArrowLeft className="me-2" />
                Back
            </button>

            <div className="card shadow border-0">

                <div className="card-body p-4">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>

                            <h2 className="fw-bold mb-1">

                                {lesson?.Name}

                            </h2>

                            <p className="text-muted mb-2">

                                {lesson?.Description}

                            </p>

                            <div className="d-flex gap-2">

                                <span className="badge bg-primary">

                                    {details.length} Contents

                                </span>

                                <span className="badge bg-success">

                                    {lesson?.Status}

                                </span>

                            </div>

                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() =>
                                navigate(`/admin/courses/${courseId}/lessons/${lessonId}/details/create`)
                            }
                        >
                            <FaPlus className="me-2" />

                            Add Content

                        </button>

                    </div>

                    <hr />

                    {

                        details.length === 0 ?

                            <div className="text-center py-5">

                                <FaFileAlt
                                    size={60}
                                    className="text-secondary mb-3"
                                />

                                <h5>

                                    No lesson content

                                </h5>

                                <p className="text-muted">

                                    Click Add Content to create your first lesson item.

                                </p>

                            </div>

                            :

                            details.map((detail, index) => (

                                <div
                                    key={detail._id}
                                    className="py-3 border-bottom detail-row"
                                >

                                    <div className="d-flex justify-content-between">

                                        <div className="d-flex">

                                            <div
                                                className="me-4 fs-4 fw-bold text-primary"
                                                style={{ width: 40 }}
                                            >

                                                {index + 1}

                                            </div>

                                            <div>

                                                <h5 className="mb-1">

                                                    {detail.Title}

                                                </h5>

                                                <div className="mb-2">

                                                    <span className="badge bg-light text-dark border me-2">

                                                        {detail.Type}

                                                    </span>

                                                    {

                                                        detail.Duration > 0 &&

                                                        <span className="text-muted">

                                                            ⏱ {detail.Duration}s

                                                        </span>

                                                    }

                                                </div>

                                                <div className="text-secondary">

                                                    {

                                                        detail.Content?.length > 120
                                                            ?

                                                            detail.Content.substring(0, 120) + "..."

                                                            :

                                                            detail.Content

                                                    }

                                                </div>

                                            </div>

                                        </div>

                                        <div className="d-flex align-items-center">

                                            <button
                                                className="btn btn-light me-2"
                                                onClick={() =>
                                                    navigate(`/admin/courses/${courseId}/lessons/${lessonId}/details/${detail._id}`)
                                                }
                                            >

                                                View

                                            </button>

                                            <button
                                                className="btn btn-outline-warning me-2"
                                                onClick={() =>
                                                    navigate(`/admin/courses/${courseId}/lessons/${lessonId}/details/${detail._id}/edit`)
                                                }
                                            >

                                                <FaEdit />

                                            </button>

                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() =>
                                                    handleDelete(detail._id)
                                                }
                                            >

                                                <FaTrash />

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            ))

                    }

                </div>

            </div>

        </div>

    );

}

export default LessonDetailPage;