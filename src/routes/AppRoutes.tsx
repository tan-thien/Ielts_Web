import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import HomePage from "../features/User/HomePage";

import DashboardPage from "../features/Admin/pages/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import CoursePage from "../features/Admin/course/CoursePage";
import ProfilePage from "../features/auth/pages/ProfilePage";

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
            </Route>

        </Routes>

        
    );
}

export default AppRoutes;