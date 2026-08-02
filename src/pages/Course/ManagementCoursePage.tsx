import { useEffect, useState } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import {
    FaArrowLeft,
    FaBook,
    FaClipboardList,
    FaUsers,
    FaDollarSign,
    FaEdit
} from "react-icons/fa";
import "./ManagementCoursePage.css";
import { getLessonByCourseId } from "../../services/lesson.service";

function ManagementCoursePage() {

    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course] = useState<any>();
    const [lessons, setLessons] = useState<any[]>([]);

    useEffect(() => {
        if (courseId) {
            loadCourse();
            loadLessons();
        }
    }, [courseId]);

    async function loadCourse() {

        // gọi API

        // const data = await getCourseById(courseId);

        // setCourse(data);

    }
    async function loadLessons(){

    const data = await getLessonByCourseId(courseId!);

    setLessons(data);

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

                    <h2>
                        {course?.Name || "IELTS Academic"}
                    </h2>

                    <p>
                        {course?.Description || "Course Description"}
                    </p>

                    <div className="course-tags">

                        <span className="tag active">
                            Active
                        </span>

                        <span className="tag open">
                            Open
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
                    onClick={() => navigate("overview")}
                >
                    Overview
                </button>

                <button
                    onClick={() => navigate("lessons")}
                >
                    Lessons
                </button>

                <button
                    onClick={() => navigate("assignments")}
                >
                    Assignments
                </button>

                <button
                    onClick={() => navigate("students")}
                >
                    Students
                </button>

                <button
                    onClick={() => navigate("settings")}
                >
                    Settings
                </button>

            </div>

            <div className="course-content">

                <Outlet />

            </div>

        </div>

    );

}

export default ManagementCoursePage;