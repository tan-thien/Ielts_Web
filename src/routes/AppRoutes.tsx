import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import HomePage from "../pages/User/HomePage";

import DashboardPage from "../pages/admin/Dashboard/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import CoursePage from "../pages/admin/Course/CoursePage";
import ProfilePage from "../pages/User/ProfilePage";
import ManagementCoursePage from "../pages/admin/Course/ManagementCoursePage";
import LessonFormPage from "../pages/admin/Lesson/LessonFormPage";
import LessonDetailPage from "../pages/admin/Lesson/LessonDetailPage";
import LessonDetailFormPage from "../pages/admin/Lesson/LessonDetailFormPage";

import CoursePageUser from "../pages/User/CoursePage";
import CourseDetailPage from "../pages/User/Course/CourseDetailPage";
import CourseLearningPage from "../pages/User/Course/CourseLearningPage";
import PaymentResultPage from "../pages/User/Course/PaymentResultPage";
import WritingPage from "../pages/User/WritingPage";
import TeacherManagementPage from "../pages/admin/Management/TeacherManagementPage";
import StudentManagementPage from "../pages/admin/Management/StudentManagementPage";
import LessonManagementPage from "../pages/admin/Lesson/LessonManagementPage";
import AssignmentManagementPage from "../pages/admin/Course/AssignmentManagementPage";
import ReportsPage from "../pages/admin/Reports/ReportsPage";
import WritingAIPage from "../pages/admin/Dashboard/WritingAIPage";
import SpeakingAIPage from "../pages/admin/Dashboard/SpeakingAIPage";
    
function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            /*Student route */
            <Route path="/" element={<UserLayout />} >
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/courses" element={<CoursePageUser />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/courses/:courseId/learn" element={<CourseLearningPage />} />
                <Route path="/payment/result" element={<PaymentResultPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="/writingAI" element={<WritingPage />} />
            </Route>

            /*Admin  route */
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="writingAI" element={<WritingAIPage />} />
                <Route path="speakingAI" element={<SpeakingAIPage />} />
                {/* <Route path="vocabulary" element={<VocabularyPage />} /> */}
                <Route path="teachers" element={<TeacherManagementPage />} />
                <Route path="students" element={<StudentManagementPage />} />
                <Route path="courses" element={<CoursePage />} />
                <Route path="lessons" element={<LessonManagementPage />} />
                <Route path="lessons/create" element={<LessonFormPage />} />
                <Route path="lessons/:lessonId/edit" element={<LessonFormPage />} />
                <Route path="assignments" element={<AssignmentManagementPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="/admin/courses/:courseId" element={<ManagementCoursePage />} />
                <Route path="/admin/courses/:courseId/lessons/create" element={<LessonFormPage />} />
                <Route path="/admin/courses/:courseId/lessons/:lessonId/edit" element={<LessonFormPage />} />
                <Route path="/admin/courses/:courseId/lessons/:lessonId/details" element={<LessonDetailPage />}/>
                <Route path="/admin/courses/:courseId/lessons/:lessonId/details/create" element={<LessonDetailFormPage />}/>
                <Route path="/admin/courses/:courseId/lessons/:lessonId/details/:detailId/edit" element={<LessonDetailFormPage />}/>
                
            </Route>

        </Routes>


    );
}

export default AppRoutes;