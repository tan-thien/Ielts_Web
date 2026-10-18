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
        : "Chưa xác định khóa học";
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        Draft: "Bản nháp",
        Pending: "Đang chờ duyệt",
        Active: "Đang hoạt động",
        Finished: "Đã hoàn tất",
    };
    return labels[status] || status;
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
            setError("Không thể tải danh sách bài học. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getAllLessons()
            .then(setLessons)
            .catch((requestError) => {
                console.error("Load lessons error:", requestError);
                setError("Không thể tải danh sách bài học. Vui lòng thử lại.");
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
        if (!window.confirm(`Bạn có chắc muốn xóa bài học "${lesson.Name}" không?`)) return;
        try {
            await deleteLesson(lesson._id!);
            await loadLessons();
        } catch (requestError) {
            console.error("Delete lesson error:", requestError);
            setError("Không thể xóa bài học. Vui lòng thử lại.");
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h1 className="h3 mb-1">Quản lý bài học</h1>
                    <p className="text-muted mb-0">Tạo, chỉnh sửa và sắp xếp bài học trong khóa học.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate("/admin/lessons/create")}
                >
                    <FaPlus className="me-2" />
                    Thêm bài học
                </button>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="lesson-search">Tìm bài học</label>
                            <input
                                id="lesson-search"
                                className="form-control"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm theo tên bài, chương, khóa học hoặc trạng thái"
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Bài học</th>
                                    <th>Khóa học</th>
                                    <th>Chương</th>
                                    <th>Trạng thái</th>
                                    <th>Hiển thị</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center py-5">Đang tải bài học...</td></tr>
                                ) : filteredLessons.length ? filteredLessons.map((lesson) => (
                                    <tr key={lesson._id}>
                                        <td>
                                            <div className="fw-semibold">{lesson.Name}</div>
                                            <small className="text-muted">{lesson.Description}</small>
                                        </td>
                                        <td>{getCourseName(lesson)}</td>
                                        <td>{lesson.Unit}</td>
                                        <td><span className="badge bg-secondary">{getStatusLabel(lesson.Status)}</span></td>
                                        <td>
                                            <span className={`badge ${lesson.IsOpen ? "bg-success" : "bg-secondary"}`}>
                                                {lesson.IsOpen ? "Đang mở" : "Đang đóng"}
                                            </span>
                                        </td>
                                        <td className="text-nowrap">
                                            <button
                                                className="btn btn-outline-primary btn-sm me-2"
                                                title="Quản lý nội dung bài học"
                                                disabled={!getCourseId(lesson)}
                                                onClick={() => navigate(`/admin/courses/${getCourseId(lesson)}/lessons/${lesson._id}/details`)}
                                            >
                                                <FaBookOpen />
                                            </button>
                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                title="Chỉnh sửa bài học"
                                                onClick={() => navigate(`/admin/lessons/${lesson._id}/edit`)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                title="Xóa bài học"
                                                onClick={() => void handleDelete(lesson)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="text-center py-5 text-muted">Không tìm thấy bài học.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-muted small">Đang hiển thị {filteredLessons.length}/{lessons.length} bài học</div>
                </div>
            </div>
        </div>
    );
}

export default LessonManagementPage;
