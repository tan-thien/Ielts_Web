import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBookOpen, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { deleteLesson, getAllLessons } from "../../../services/lesson.service";
import type { LessonWithCourse } from "../../../types/lesson";

function getCourseId(lesson: LessonWithCourse): string {
    if (!lesson.CourseID) return "";
    return typeof lesson.CourseID === "string" ? lesson.CourseID : lesson.CourseID._id;
}

function getCourseName(lesson: LessonWithCourse): string {
    return typeof lesson.CourseID === "object" && lesson.CourseID
        ? lesson.CourseID.Name
        : "Unknown course";
}

function LessonManagementPage() {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState<LessonWithCourse[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLessons = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            setLessons(await getAllLessons());
        } catch (requestError) {
            console.error("Load lessons error:", requestError);
            setError("Failed to load lessons. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getAllLessons()
            .then(setLessons)
            .catch((requestError) => {
                console.error("Load lessons error:", requestError);
                setError("Failed to load lessons. Please try again.");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const filteredLessons = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) return lessons;
        return lessons.filter((lesson) =>
            [lesson.Name, lesson.Unit, getCourseName(lesson), lesson.Status]
                .some((value) => value.toLocaleLowerCase().includes(query))
        );
    }, [lessons, search]);

    const handleDelete = async (lesson: LessonWithCourse) => {
        if (!window.confirm(`Delete lesson "${lesson.Name}"?`)) return;
        try {
            await deleteLesson(lesson._id!);
            await loadLessons();
        } catch (requestError) {
            console.error("Delete lesson error:", requestError);
            setError("Failed to delete lesson. Please try again.");
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h1 className="h3 mb-1">Lesson management</h1>
                    <p className="text-muted mb-0">Create, edit and organize course lessons.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate("/admin/lessons/create")}
                >
                    <FaPlus className="me-2" />
                    New lesson
                </button>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="lesson-search">Search lessons</label>
                            <input
                                id="lesson-search"
                                className="form-control"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by lesson, unit, course or status"
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Lesson</th>
                                    <th>Course</th>
                                    <th>Unit</th>
                                    <th>Status</th>
                                    <th>Visibility</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center py-5">Loading lessons...</td></tr>
                                ) : filteredLessons.length ? filteredLessons.map((lesson) => (
                                    <tr key={lesson._id}>
                                        <td>
                                            <div className="fw-semibold">{lesson.Name}</div>
                                            <small className="text-muted">{lesson.Description}</small>
                                        </td>
                                        <td>{getCourseName(lesson)}</td>
                                        <td>{lesson.Unit}</td>
                                        <td><span className="badge bg-secondary">{lesson.Status}</span></td>
                                        <td>
                                            <span className={`badge ${lesson.IsOpen ? "bg-success" : "bg-secondary"}`}>
                                                {lesson.IsOpen ? "Open" : "Closed"}
                                            </span>
                                        </td>
                                        <td className="text-nowrap">
                                            <button
                                                className="btn btn-outline-primary btn-sm me-2"
                                                title="Manage lesson details"
                                                disabled={!getCourseId(lesson)}
                                                onClick={() => navigate(`/admin/courses/${getCourseId(lesson)}/lessons/${lesson._id}/details`)}
                                            >
                                                <FaBookOpen />
                                            </button>
                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                title="Edit lesson"
                                                onClick={() => navigate(`/admin/lessons/${lesson._id}/edit`)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                title="Delete lesson"
                                                onClick={() => void handleDelete(lesson)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="text-center py-5 text-muted">No lessons found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-muted small">Showing {filteredLessons.length} of {lessons.length} lessons</div>
                </div>
            </div>
        </div>
    );
}

export default LessonManagementPage;
