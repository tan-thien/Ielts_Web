import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaLock } from "react-icons/fa";
import { getCourseById, getCourseOrder } from "../../../services/course.service";
import { getCourseAssignments, getMySubmissions } from "../../../services/assignment.service";
import {
    completeLesson as saveLessonCompletion,
    getCourseLessonProgress,
    getLessonByCourseId,
    getLessonDetailsByLessonId,
} from "../../../services/lesson.service";
import type { Course } from "../../../types/course";
import type { Assignment, AssignmentSubmission } from "../../../types/assignment";
import type { Lesson, LessonDetail } from "../../../types/lesson";
import AssignmentCard from "./AssignmentCard";
import "./CourseLearningPage.css";

function CourseLearningPage() {
    const { courseId } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [selectedGlobalAssignmentId, setSelectedGlobalAssignmentId] = useState("");
    const [details, setDetails] = useState<LessonDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingLesson, setIsLoadingLesson] = useState(true);
    const [error, setError] = useState("");
    const [lessonError, setLessonError] = useState("");
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
    const [isCompletingLesson, setIsCompletingLesson] = useState(false);

    useEffect(() => {
        if (!courseId) return;

        if (!localStorage.getItem("token") || localStorage.getItem("role") !== "user") return;

        let isMounted = true;
        Promise.all([
            getCourseById(courseId),
            getCourseOrder(courseId),
            getLessonByCourseId(courseId),
            getCourseLessonProgress(courseId).catch(() => []),
        ])
            .then(async ([courseData, order, lessonData, completedIds]: [
                Course,
                Awaited<ReturnType<typeof getCourseOrder>>,
                Lesson[],
                string[],
            ]) => {
                if (!isMounted) return;
                setCourse(courseData);
                setCompletedLessonIds(completedIds);
                if (order?.Status !== "Paid") {
                    setError("Bạn cần thanh toán khóa học trước khi bắt đầu học.");
                    return;
                }
                const availableLessons = lessonData.filter(
                    (lesson) => !lesson.IsDeleted && lesson.Status === "Active",
                );
                setLessons(availableLessons);
                setSelectedLessonId(availableLessons[0]?._id || "");
                const [courseAssignments, userSubmissions] = await Promise.all([
                    getCourseAssignments(courseId),
                    getMySubmissions(),
                ]);
                if (!isMounted) return;
                setAssignments(courseAssignments);
                setSubmissions(userSubmissions);
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
    const globalAssignments = assignments.filter((assignment) => !assignment.LessonID);
    const selectedGlobalAssignment = globalAssignments.find(
        (assignment) => assignment._id === selectedGlobalAssignmentId,
    );
    const assignmentsForSelectedLesson = assignments.filter((assignment) => {
        const lessonId = typeof assignment.LessonID === "string"
            ? assignment.LessonID
            : assignment.LessonID?._id;
        return lessonId === selectedLessonId;
    });
    const refreshSubmissions = async () => {
        setSubmissions(await getMySubmissions());
    };
    const selectedLessonCompleted = selectedLesson?._id
        ? completedLessonIds.includes(selectedLesson._id)
        : false;
    const handleCompleteLesson = async () => {
        const lessonId = selectedLesson?._id;
        if (!lessonId || selectedLessonCompleted || isCompletingLesson) return;
        setIsCompletingLesson(true);
        setLessonError("");
        try {
            await saveLessonCompletion(lessonId);
            setCompletedLessonIds((current) => [...new Set([...current, lessonId])]);
        } catch {
            setLessonError("Không thể lưu tiến độ bài học. Vui lòng thử lại.");
        } finally {
            setIsCompletingLesson(false);
        }
    };

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
                                            setSelectedGlobalAssignmentId("");
                                            if (lesson._id !== selectedLessonId) {
                                                setIsLoadingLesson(true);
                                                setLessonError("");
                                                setSelectedLessonId(lesson._id || "");
                                            }
                                        }}
                                    >
                                        <span>{String(index + 1).padStart(2, "0")}</span>
                                        {lesson.Name}
                                        {lesson._id && completedLessonIds.includes(lesson._id) && (
                                            <strong className="course-learning-completed">Đã học</strong>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                    <h3 className="course-learning-sidebar-subheading">Bài tập khóa học</h3>
                    {globalAssignments.length === 0 ? (
                            <p>Chưa có bài tập chung của khóa học.</p>
                    ) : (
                            <ul className="course-learning-global-assignments">
                                {globalAssignments.map((assignment) => (
                                    <li key={assignment._id}>
                                        <button
                                            className={selectedGlobalAssignmentId === assignment._id ? "active" : ""}
                                            type="button"
                                            onClick={() => setSelectedGlobalAssignmentId(assignment._id)}
                                        >
                                            <span><FaBookOpen aria-hidden="true" /></span>
                                            {assignment.Title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                    )}
                </aside>
                <section className="course-learning-content">
                    {selectedGlobalAssignment ? (
                            <>
                                <span className="course-learning-unit">BÀI TẬP TOÀN KHÓA</span>
                                <h2>{selectedGlobalAssignment.Title}</h2>
                                <AssignmentCard
                                    assignment={selectedGlobalAssignment}
                                    submissions={submissions}
                                    onSubmissionChange={refreshSubmissions}
                                />
                            </>
                    ) : selectedLesson ? (
                        <>
                            <span className="course-learning-unit">{selectedLesson.Unit}</span>
                            <h2>{selectedLesson.Name}</h2>
                            <p className="course-learning-description">{selectedLesson.Description}</p>
                            {isLoadingLesson && <p role="status">Đang tải nội dung...</p>}
                            {lessonError && <p className="course-learning-error" role="alert">{lessonError}</p>}
                            <div className="course-learning-progress-action">
                                <span>
                                    Đã hoàn thành {completedLessonIds.length}/{lessons.length} bài học
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void handleCompleteLesson()}
                                    disabled={selectedLessonCompleted || isCompletingLesson}
                                >
                                    {selectedLessonCompleted
                                        ? "Đã hoàn thành bài học"
                                        : isCompletingLesson
                                            ? "Đang lưu tiến độ..."
                                            : "Đánh dấu hoàn thành"}
                                </button>
                            </div>
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
                            {assignmentsForSelectedLesson.length > 0 && (
                                <section className="course-learning-lesson-assignments">
                                    <h3>Bài tập của bài học</h3>
                                    {assignmentsForSelectedLesson.map((assignment) => (
                                        <AssignmentCard
                                            key={assignment._id}
                                            assignment={assignment}
                                            submissions={submissions}
                                            onSubmissionChange={refreshSubmissions}
                                        />
                                    ))}
                                </section>
                            )}
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
