import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams  } from "react-router-dom";
import { FaArrowLeft, FaBook, FaChalkboardTeacher, FaClipboardList, FaEdit, FaUsers } from "react-icons/fa";
import "./ManagementCoursePage.css";
import { getLessonByCourseId } from "../../../services/lesson.service";
import { getCourseById } from "../../../services/course.service";
import { getAssignments } from "../../../services/assignment.service";
import { getManagementDashboard } from "../../../services/management.service";
import type { Assignment } from "../../../types/assignment";
import type { Course } from "../../../types/course";
import type { Lesson } from "../../../types/lesson";
import type { ManagedStudent, ManagementDashboard, ManagementTeacher } from "../../../types/management";
import OverviewTab from "./components/OverviewTab";
import LessonTab from "./components/LessonTab";
import AssignmentTab from "./components/AssignmentTab";
import StudentTab from "./components/StudentTab";
import SettingTab from "./components/SettingTab";



function ManagementCoursePage() {

    //const [ setActiveTab] = useState("overview");
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [assignmentError, setAssignmentError] = useState("");
    const [managementDashboard, setManagementDashboard] = useState<ManagementDashboard | null>(null);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [participantsError, setParticipantsError] = useState("");

    const activeTab = searchParams.get("tab") || "overview";
    const loadLessons = useCallback(async () => {
        if (!courseId) return;
        try {
            const data = await getLessonByCourseId(courseId);
            setLessons(data);
        }
        catch (error) {
            console.error(error);
        }
    }, [courseId]);

    const loadAssignments = useCallback(async () => {
        try {
            const data = await getAssignments();
            setAssignments(data);
            setAssignmentError("");
        }
        catch (error) {
            console.error(error);
            setAssignmentError("Failed to load assignments. Please try again.");
        }
    }, []);

    useEffect(() => {
        if (courseId) {
            getCourseById(courseId)
                .then(setCourse)
                .catch((error) => console.error(error));
            getLessonByCourseId(courseId)
                .then(setLessons)
                .catch((error) => console.error(error));
            getAssignments()
                .then((data) => {
                    setAssignments(data);
                    setAssignmentError("");
                })
                .catch((error) => {
                    console.error(error);
                    setAssignmentError("Failed to load assignments. Please try again.");
                });
        }
    }, [courseId]);

    useEffect(() => {
        let cancelled = false;
        const loadParticipants = async () => {
            if (!courseId) return;
            setParticipantsLoading(true);
            setParticipantsError("");
            try {
                const firstPage = await getManagementDashboard({ studentsPage: 1, coursesSearch: course?.Name });
                const totalPages = firstPage.pagination.students.totalPages;
                const remainingPages = totalPages > 1
                    ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) =>
                        getManagementDashboard({ studentsPage: index + 2, coursesSearch: course?.Name }),
                    ))
                    : [];
                if (cancelled) return;
                setManagementDashboard({
                    ...firstPage,
                    students: [firstPage.students, ...remainingPages.map((page) => page.students)].flat(),
                });
            } catch (error) {
                if (cancelled) return;
                console.error("Load course participants failed", error);
                setParticipantsError("Unable to load the students and teachers for this course.");
            } finally {
                if (!cancelled) setParticipantsLoading(false);
            }
        };
        void loadParticipants();
        return () => { cancelled = true; };
    }, [courseId, course?.Name]);

    const courseAssignments = useMemo(() => assignments.filter((assignment) => {
        const courseRef = typeof assignment.CourseID === "string" ? assignment.CourseID : assignment.CourseID?._id;
        const lessonRef = typeof assignment.LessonID === "string" ? assignment.LessonID : assignment.LessonID?._id;
        return courseRef === courseId || lessons.some((lesson) => lesson._id === lessonRef);
    }), [assignments, courseId, lessons]);

    const courseManagementData = managementDashboard?.courses.find((item) => item._id === courseId);
    const courseTeachers: ManagementTeacher[] = courseManagementData?.Teachers || [];
    const courseStudents: ManagedStudent[] = managementDashboard?.students.filter((student) =>
        student.Courses.some((item) => item._id === courseId),
    ) || [];

    return (

        <div className="course-management">
            <button
                className="back-btn"
                onClick={() => navigate("/admin/courses")}
            >
                <FaArrowLeft />
                Quay lại
            </button>

            <div className="course-banner">
                <div>
                    <h2>{course?.Name}</h2>
                    <p>{course?.Description}</p>
                    <div className="course-tags">
                        <span className={`tag ${course?.Status ? "active" : "inactive"}`}>
                            {course?.Status ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </span>

                        <span className={`tag ${course?.IsOpen ? "open" : "closed"}`}>
                            {course?.IsOpen ? "Đang mở đăng ký" : "Đã đóng đăng ký"}
                        </span>
                    </div>

                </div>

                <button className="edit-course">
                    <FaEdit />
                    Chỉnh sửa khóa học
                </button>

            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <FaBook />
                    <h3>{lessons.length}</h3>
                    <p>Bài học</p>
                </div>

                <div className="stat-card">
                    <FaClipboardList />
                    <h3>{courseAssignments.length}</h3>
                    <p>Bài tập</p>
                </div>

                <div className="stat-card">
                    <FaUsers />
                    <h3>{courseStudents.length}</h3>
                    <p>Học viên</p>
                </div>

                <div className="stat-card">
                    <FaChalkboardTeacher />
                    <h3>{courseTeachers.length}</h3>
                    <p>Giảng viên</p>
                </div>

            </div>

            <div className="course-tabs">

                <button
                    className={activeTab === "overview" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "overview" })}
                >
                    Tổng quan
                </button>

                <button
                    className={activeTab === "lessons" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "lessons" })}
                >
                    Bài học
                </button>

                <button
                    className={activeTab === "assignments" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "assignments" })}
                >
                    Bài tập
                </button>

                <button
                    className={activeTab === "students" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "students" })}
                >
                    Học viên và giảng viên
                </button>

                {/* <button
                    className={activeTab === "settings" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "settings" })}
                >
                    Cài đặt
                </button> */}

            </div>


            <div className="course-content">

                {activeTab === "overview" && (
                    <OverviewTab course={course} lessons={lessons} assignments={courseAssignments} studentCount={courseStudents.length} teachers={courseTeachers} />
                )}

                {activeTab === "lessons" && (
                    <LessonTab
                        lessons={lessons}
                        onDelete={loadLessons}
                    />
                )}

                {activeTab === "assignments" && (
                    <AssignmentTab
                        assignments={assignments}
                        lessons={lessons}
                        courseId={courseId ?? ""}
                        loadError={assignmentError}
                        onChange={loadAssignments}
                    />
                )}

                {activeTab === "students" && (
                    <StudentTab courseId={courseId ?? ""} students={courseStudents} teachers={courseTeachers} loading={participantsLoading} error={participantsError} />
                )}

                {activeTab === "settings" && (
                    <SettingTab course={course} />
                )}

            </div>



        </div>

    );

}

export default ManagementCoursePage;
