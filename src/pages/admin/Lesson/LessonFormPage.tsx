import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createLesson,
    getLessonById,
    updateLesson
} from "../../../services/lesson.service";
import { getCourses } from "../../../services/course.service";
import type { Course } from "../../../types/course";
import type { Lesson } from "../../../types/lesson";

function LessonFormPage() {

    const navigate = useNavigate();
    const { courseId, lessonId } = useParams();
    const isEdit = !!lessonId;
    const isStandalone = !courseId;
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadError, setLoadError] = useState("");
    const [lesson, setLesson] = useState<Omit<Lesson, "Details">>({
        Name: "",
        Description: "",
        Time: "",
        Unit: "",
        CourseID: courseId || "",
        Status: "Draft",
        IsOpen: false
    });

    useEffect(() => {
        getCourses()
            .then(setCourses)
            .catch((error) => {
                console.error("Load lesson courses error:", error);
                setLoadError("Không thể tải danh sách khóa học. Vui lòng thử lại.");
            });
    }, []);

    useEffect(() => {
        if (!lessonId) return;

        let cancelled = false;

        getLessonById(lessonId).then(res => {
            if (cancelled) return;

            setLesson({
                Name: res.Lesson.Name,
                Description: res.Lesson.Description,
                Time: res.Lesson.Time,
                Unit: res.Lesson.Unit,
                CourseID: res.Lesson.CourseID?._id || res.Lesson.CourseID || courseId || "",
                Status: res.Lesson.Status,
                IsOpen: res.Lesson.IsOpen,
                IsDeleted: res.Lesson.IsDeleted
            });
        }).catch(error => {
            console.error("Load lesson error:", error);
        });

        return () => {
            cancelled = true;
        };
    }, [courseId, lessonId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {

        const { name, value } = e.target;

        setLesson(prev => ({
            ...prev,
            [name]: value
        }));



    }

    function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {

        setLesson(prev => ({
            ...prev,
            IsOpen: e.target.checked
        }));

    }

    async function handleSubmit(e: React.FormEvent) {

        e.preventDefault();

        try {

            if (!lesson.Name.trim()) {
                alert("Vui lòng nhập tên bài học.");
                return;
            }

            if (!lesson.Description.trim()) {
                alert("Vui lòng nhập mô tả bài học.");
                return;
            }

            if (!lesson.Unit.trim()) {
                alert("Vui lòng nhập tên chương.");
                return;
            }

            if (!lesson.CourseID) {
                alert("Vui lòng chọn khóa học.");
                return;
            }

            const lessonPayload: Omit<Lesson, "Details"> = {
                Name: lesson.Name,
                Description: lesson.Description,
                Time: lesson.Time,
                Unit: lesson.Unit,
                CourseID: lesson.CourseID,
                Status: lesson.Status,
                IsOpen: lesson.IsOpen,
                ...(lesson.IsDeleted === undefined ? {} : { IsDeleted: lesson.IsDeleted })
            };
            let savedLessonId = lessonId;

            if (isEdit) {

                const response = await updateLesson(
                    lessonId!,
                    lessonPayload
                );

                console.log("Update lesson:", response);

            } else {

                const response = await createLesson(
                    lessonPayload
                );

                console.log("Create lesson:", response);
                savedLessonId = response?.lesson?._id || response?.data?.lesson?._id;
            }

            alert(
                isEdit
                    ? "Cập nhật bài học thành công!"
                    : "Tạo bài học thành công!"
            );

            if (isStandalone) {
                navigate("/admin/lessons");
            } else {
                navigate(savedLessonId
                    ? `/admin/courses/${lesson.CourseID}/lessons/${savedLessonId}/details`
                    : `/admin/courses/${lesson.CourseID}?tab=lessons`);
            }

        } catch (err: unknown) {

            console.error("Save lesson error:", err);

            const errorDetails = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const message =
                errorDetails?.response?.data?.message ||
                errorDetails?.message ||
                "Không thể lưu bài học.";

            alert(message);
        }
    }

    return (

        <div className="container mt-4">

            <div className="card">

                <div className="card-header text-white">

                    <h3>
                        {isEdit ? "Cập nhật bài học" : "Tạo bài học"}
                    </h3>

                </div>

                <div className="card-body">

                    {loadError && <div className="alert alert-danger">{loadError}</div>}

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">

                            <label htmlFor="CourseID">Khóa học</label>
                            <select
                                id="CourseID"
                                className="form-select"
                                name="CourseID"
                                value={lesson.CourseID}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn khóa học</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>{course.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">

                            <label>Tên bài học</label>

                            <input
                                className="form-control"
                                name="Name"
                                value={lesson.Name}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="mb-3">

                            <label>Mô tả</label>

                            <textarea
                                className="form-control"
                                name="Description"
                                value={lesson.Description}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="row">

                            <div className="col-md-4">

                                <label>Chương</label>

                                <input
                                    className="form-control"
                                    name="Unit"
                                    value={lesson.Unit}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-4">

                                <label>Ngày học</label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="Time"
                                    value={lesson.Time?.substring(0, 10)}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-4">

                                <label>Trạng thái</label>

                                <select
                                    className="form-select"
                                    name="Status"
                                    value={lesson.Status}
                                    onChange={handleChange}
                                >

                                    <option value="Draft">Bản nháp</option>
                                    <option value="Pending">Đang chờ duyệt</option>
                                    <option value="Active">Đang hoạt động</option>
                                    <option value="Finished">Đã hoàn tất</option>

                                </select>

                            </div>

                        </div>

                        <div className="form-check mt-3">

                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={lesson.IsOpen}
                                onChange={handleCheckbox}
                            />

                            <label className="form-check-label">

                                Công khai bài học

                            </label>

                        </div>

                        <div className="mt-4">

                            <button
                                className="btn btn-primary me-2"
                                type="submit"
                            >

                                Lưu bài học

                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate(-1)}
                            >

                                Hủy

                            </button>

                        </div>

                    </form>

                </div>

            </div>
        </div>




    );




}



export default LessonFormPage;