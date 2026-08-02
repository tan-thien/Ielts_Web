import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired } from "./utils/auth";
import AppRoutes from "./routes/AppRoutes";

function App() {

    const navigate = useNavigate();

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) return;

        if (isTokenExpired(token)) {

            localStorage.clear();

            alert("Phiên đăng nhập đã hết hạn.");

            navigate("/login");

        }

    }, []);

    return (
        <AppRoutes />
    );
}

export default App;