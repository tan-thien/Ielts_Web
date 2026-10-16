import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams  } from "react-router-dom";
import { FaArrowLeft, FaBook, FaClipboardList, FaUsers, FaDollarSign, FaEdit } from "react-icons/fa";
import "./ManagementCoursePage.css";
import { getLessonByCourseId } from "../../../services/lesson.service";
import { getCourseById } from "../../../services/course.service";
import { getAssignments } from "../../../services/assignment.service";
import type { Assignment } from "../../../types/assignment";
import type { Course } from "../../../types/course";
import type { Lesson } from "../../../types/lesson";
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

    return (

        <div className="course-management">
            <button
                className="back-btn"
                onClick={() => navigate("/admin/courses")}
            >
                <FaArrowLeft />
                Back
            </button>

            <div className="course-banner">
                <div>
                    <h2>{course?.Name}</h2>
                    <p>{course?.Description}</p>
                    <div className="course-tags">
                        <span className={`tag ${course?.Status ? "active" : "inactive"}`}>
                            {course?.Status ? "Active" : "Inactive"}
                        </span>

                        <span className={`tag ${course?.IsOpen ? "open" : "closed"}`}>
                            {course?.IsOpen ? "Open" : "Closed"}
                        </span>
                    </div>

                </div>

                <button className="edit-course">
                    <FaEdit />
                    Edit Course
                </button>

            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <FaBook />
                    <h3>{lessons.length}</h3>
                    <p>Lessons</p>
                </div>

                <div className="stat-card">
                    <FaClipboardList />
                    <h3>{assignments.filter((assignment) => {
                        const courseRef = typeof assignment.CourseID === "string"
                            ? assignment.CourseID
                            : assignment.CourseID?._id;
                        const lessonRef = typeof assignment.LessonID === "string"
                            ? assignment.LessonID
                            : assignment.LessonID?._id;

                        return courseRef === courseId ||
                            lessons.some((lesson) => lesson._id === lessonRef);
                    }).length}</h3>
                    <p>Assignments</p>
                </div>

                <div className="stat-card">
                    <FaUsers />
                    <h3>35</h3>
                    <p>Students</p>
                </div>

                <div className="stat-card">
                    <FaDollarSign />
                    <h3>$250</h3>
                    <p>Revenue</p>
                </div>

            </div>

            <div className="course-tabs">

                <button
                    className={activeTab === "overview" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "overview" })}
                >
                    Overview
                </button>

                <button
                    className={activeTab === "lessons" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "lessons" })}
                >
                    Lessons
                </button>

                <button
                    className={activeTab === "assignments" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "assignments" })}
                >
                    Assignments
                </button>

                <button
                    className={activeTab === "students" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "students" })}
                >
                    Students
                </button>

                <button
                    className={activeTab === "settings" ? "active" : ""}
                    onClick={() => setSearchParams({ tab: "settings" })}
                >
                    Settings
                </button>

            </div>


            <div className="course-content">

                {activeTab === "overview" && (
                    <OverviewTab course={course} lessons={lessons} />
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
                    <StudentTab />
                )}

                {activeTab === "settings" && (
                    <SettingTab course={course} />
                )}

            </div>



        </div>

    );

}

export default ManagementCoursePage;