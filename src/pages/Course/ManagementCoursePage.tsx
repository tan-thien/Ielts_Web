import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams  } from "react-router-dom";
import { FaArrowLeft, FaBook, FaClipboardList, FaUsers, FaDollarSign, FaEdit } from "react-icons/fa";
import "./ManagementCoursePage.css";
import { getLessonByCourseId } from "../../services/lesson.service";
import { getCourseById } from "../../services/course.service";
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
    const [course, setCourse] = useState<any>();
    const [lessons, setLessons] = useState<any[]>([]);

    const activeTab = searchParams.get("tab") || "overview";
    useEffect(() => {
        if (courseId) {
            loadCourse();
            loadLessons();
        }
    }, [courseId]);

    async function loadCourse() {
        try {
            const data = await getCourseById(courseId!);
            setCourse(data);
        }
        catch (error) {
            console.error(error);
        }
    }

    async function loadLessons() {
        try {
            const data = await getLessonByCourseId(courseId!);
            setLessons(data);
        }
        catch (error) {
            console.error(error);
        }
    }

    async function handleDeleteLesson(id: string) {
        if (!window.confirm("Delete this lesson?")) return;

        // await deleteLesson(id);

        loadLessons();
    }

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
                    <h3>6</h3>
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
                        onDelete={handleDeleteLesson}
                    />
                )}

                {activeTab === "assignments" && (
                    <AssignmentTab />
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