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

function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={<UserLayout />} >
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="profile" element={<ProfilePage />} />

            </Route>

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
                <Route path="/admin/courses/:courseId" element={<ManagementCoursePage />}>
    
                </Route>

            </Route>

        </Routes>


    );
}

export default AppRoutes;