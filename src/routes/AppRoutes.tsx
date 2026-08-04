import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import HomePage from "../pages/User/HomePage";

import DashboardPage from "../pages/Dashboard/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import CoursePage from "../pages/Course/CoursePage";
import ProfilePage from "../pages/User/ProfilePage";
import ManagementCoursePage from "../pages/Course/ManagementCoursePage";
import LessonFormPage from "../pages/Lesson/LessonFormPage";
import LessonDetailPage from "../pages/Lesson/LessonDetailPage";
import LessonDetailFormPage from "../pages/Lesson/LessonDetailFormPage";

function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            /*Student route */
            <Route path="/" element={<UserLayout />} >
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="profile" element={<ProfilePage />} />

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
                <Route path="courses" element={<CoursePage />} />
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