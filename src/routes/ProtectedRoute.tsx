import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
    children: React.ReactNode;
    allowedRoles?: string[];
};

function ProtectedRoute({
    children,
    allowedRoles,
}: ProtectedRouteProps) {

    // Lấy thông tin từ Local Storage
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Chưa đăng nhập
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Có truyền danh sách quyền thì kiểm tra
    if (
        allowedRoles &&
        role &&
        !allowedRoles.includes(role)
    ) {
        return <Navigate to="/home" replace />;
    }

    // Được phép truy cập
    return <>{children}</>;
}

export default ProtectedRoute;