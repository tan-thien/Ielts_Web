import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaLock } from "react-icons/fa";
import { getCourseById, getCourseOrder } from "../../../services/course.service";
import { getLessonByCourseId, getLessonDetailsByLessonId } from "../../../services/lesson.service";
import type { Course } from "../../../types/course";
import type { Lesson, LessonDetail } from "../../../types/lesson";
import "./CourseLearningPage.css";

function CourseLearningPage() {
    const { courseId } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [details, setDetails] = useState<LessonDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingLesson, setIsLoadingLesson] = useState(true);
    const [error, setError] = useState("");
    const [lessonError, setLessonError] = useState("");

    useEffect(() => {
        if (!courseId) return;

        if (!localStorage.getItem("token") || localStorage.getItem("role") !== "user") return;

        let isMounted = true;
        Promise.all([
            getCourseById(courseId),
            getCourseOrder(courseId),
            getLessonByCourseId(courseId),
        ])
            .then(([courseData, order, lessonData]: [Course, Awaited<ReturnType<typeof getCourseOrder>>, Lesson[]]) => {
                if (!isMounted) return;
                setCourse(courseData);
                if (order?.Status !== "Paid") {
                    setError("Bạn cần thanh toán khóa học trước khi bắt đầu học.");
                    return;
                }
                const availableLessons = lessonData.filter(
                    (lesson) => !lesson.IsDeleted && lesson.Status === "Active",
                );
                setLessons(availableLessons);
                setSelectedLessonId(availableLessons[0]?._id || "");
            })
            .catch(() => {
                if (isMounted) setError("Không thể tải khóa học. Vui lòng thử lại.");
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [courseId]);

    useEffect(() => {
        if (!selectedLessonId) return;
        let isMounted = true;

        getLessonDetailsByLessonId(selectedLessonId)
            .then((lessonDetails: LessonDetail[]) => {
                if (isMounted) setDetails(lessonDetails.filter((detail) => detail.Status));
            })
            .catch(() => {
                if (isMounted) {
                    setDetails([]);
                    setLessonError("Không thể tải bài học. Hãy kiểm tra lại quyền truy cập hoặc thử lại.");
                }
            })
            .finally(() => {
                if (isMounted) setIsLoadingLesson(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedLessonId]);

    if (!localStorage.getItem("token") || localStorage.getItem("role") !== "user") {
        return (
            <div className="course-learning-state course-learning-error">
                <FaLock aria-hidden="true" />
                <p>Vui lòng đăng nhập bằng tài khoản học viên để truy cập khóa học.</p>
                <Link to={`/login?redirect=${encodeURIComponent(`/courses/${courseId}/learn`)}`}>
                    Đăng nhập
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return <div className="course-learning-state" role="status">Đang tải khóa học...</div>;
    }

    if (error || !course) {
        return (
            <div className="course-learning-state course-learning-error" role="alert">
                <FaLock aria-hidden="true" />
                <p>{error || "Không tìm thấy khóa học."}</p>
                <Link to={courseId ? `/courses/${courseId}` : "/courses"}>Quay lại khóa học</Link>
            </div>
        );
    }

    const selectedLesson = lessons.find((lesson) => lesson._id === selectedLessonId);

    return (
        <main className="course-learning-page">
            <header className="course-learning-header">
                <Link to={`/courses/${courseId}`}><FaArrowLeft aria-hidden="true" /> Chi tiết khóa học</Link>
                <h1>{course.Name}</h1>
            </header>
            <div className="course-learning-layout">
                <aside className="course-learning-sidebar">
                    <h2><FaBookOpen aria-hidden="true" /> Nội dung học</h2>
                    {lessons.length === 0 ? (
                        <p>Khóa học chưa có bài học được xuất bản.</p>
                    ) : (
                        <ol>
                            {lessons.map((lesson, index) => (
                                <li key={lesson._id}>
                                    <button
                                        className={selectedLessonId === lesson._id ? "active" : ""}
                                        type="button"
                                        onClick={() => {
                                            if (lesson._id !== selectedLessonId) {
                                                setIsLoadingLesson(true);
                                                setLessonError("");
                                                setSelectedLessonId(lesson._id || "");
                                            }
                                        }}
                                    >
                                        <span>{String(index + 1).padStart(2, "0")}</span>
                                        {lesson.Name}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </aside>
                <section className="course-learning-content">
                    {selectedLesson ? (
                        <>
                            <span className="course-learning-unit">{selectedLesson.Unit}</span>
                            <h2>{selectedLesson.Name}</h2>
                            <p className="course-learning-description">{selectedLesson.Description}</p>
                            {isLoadingLesson && <p role="status">Đang tải nội dung...</p>}
                            {lessonError && <p className="course-learning-error" role="alert">{lessonError}</p>}
                            {!isLoadingLesson && !lessonError && details.length === 0 && (
                                <p className="course-learning-empty">Bài học chưa có nội dung.</p>
                            )}
                            {!isLoadingLesson && details.map((detail) => (
                                <article className="course-learning-detail" key={detail._id}>
                                    {detail.Type === "Text" && <p>{detail.Content}</p>}
                                    {detail.Type === "Video" && detail.FileUrl && (
                                        <video controls preload="metadata" src={detail.FileUrl}>
                                            Trình duyệt của bạn không hỗ trợ video.
                                        </video>
                                    )}
                                    {detail.Type === "Audio" && detail.FileUrl && (
                                        <audio controls preload="metadata" src={detail.FileUrl}>
                                            Trình duyệt của bạn không hỗ trợ audio.
                                        </audio>
                                    )}
                                    {detail.Type === "Image" && detail.FileUrl && (
                                        <img src={detail.FileUrl} alt={detail.Content || selectedLesson.Name} />
                                    )}
                                    {detail.Type === "PDF" && detail.FileUrl && (
                                        <a href={detail.FileUrl} target="_blank" rel="noreferrer">
                                            {detail.Content || "Mở tài liệu PDF"}
                                        </a>
                                    )}
                                    {detail.Type === "Quiz" && <p>{detail.Content || "Bài tập sẽ sớm được cập nhật."}</p>}
                                </article>
                            ))}
                        </>
                    ) : (
                        <p className="course-learning-empty">Chọn một bài học để bắt đầu.</p>
                    )}
                </section>
            </div>
        </main>
    );
}

export default CourseLearningPage;
