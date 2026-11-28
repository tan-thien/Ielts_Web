
import { useEffect, useState } from "react";
import {
    Navbar,
    Nav,
    Container,
    Dropdown,
    Offcanvas,
} from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import {
    FaUserCircle,
    FaBook,
    FaCog,
    FaSignOutAlt,
    FaTachometerAlt,
    FaArrowRight,
} from "react-icons/fa";

import { getProfile } from "../services/auth.service";
import type { ProfileData } from "../types/auth";
import "./Header.css";

function Header() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const isAdmin = profile?.user?.Role?.toLowerCase() === "admin" || role?.toLowerCase() === "admin";

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        getProfile()
            .then((data) => {
                if (!cancelled) setProfile(data);
            })
            .catch((error: unknown) => console.error("Cannot load profile:", error));
        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        const refreshProfile = () => {
            if (!token) return;
            getProfile()
                .then(setProfile)
                .catch((error: unknown) => console.error("Cannot refresh profile:", error));
        };
        window.addEventListener("profile-updated", refreshProfile);
        return () => window.removeEventListener("profile-updated", refreshProfile);
    }, [token]);

    function handleLogout() {
        localStorage.clear();
        window.location.href = "/login";
    }

    return (
        <Navbar
            expand="lg"
            className="main-navbar"
            collapseOnSelect
        >
            <Container>
                <Link to={isAdmin ? "/admin/dashboard" : "/home"} className="navbar-brand header-brand">
                    <img className="header-logo" src="/Logo_Name.png" alt="IELTS Học Tập" />
                </Link>

                {/* MOBILE MENU */}
                <Navbar.Toggle
                    aria-controls="main-navbar-menu"
                    className="header-toggler"
                />

                <Navbar.Offcanvas
                    id="main-navbar-menu"
                    placement="end"
                    className="header-offcanvas"
                    aria-labelledby="main-navbar-title"
                >
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title id="main-navbar-title">
                            <img className="header-logo" src="/Logo_Name.png" alt="IELTS Học Tập" />
                        </Offcanvas.Title>
                    </Offcanvas.Header>

                    <Offcanvas.Body>
                        <Nav className="header-nav mx-lg-auto">
                            <NavLink to="/home" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Trang chủ</NavLink>
                            <NavLink to="/courses" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Khóa học</NavLink>
                            <NavLink to="/writingAI" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Luyện Viết AI</NavLink>
                            <NavLink to="/speakingAI" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Luyện Nói AI</NavLink>
                            <NavLink to="/vocabulary" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Từ vựng</NavLink>

                            {token && (
                                <Dropdown as={Nav.Item} className="learning-tools-dropdown">
                                    <Dropdown.Toggle id="learning-tools-toggle" className="learning-tools-toggle">
                                        Tiện ích học tập
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="user-dropdown learning-tools-menu">
                                        <Link to="/progress" className="dropdown-item">Phân tích tiến bộ IELTS</Link>
                                        <Link to="/study-plan" className="dropdown-item">Lộ trình học cá nhân</Link>
                                        <Link to="/mistake-notebook" className="dropdown-item">Sổ lỗi sai cá nhân</Link>
                                        <Link to="/practice-center" className="dropdown-item">Luyện Đọc &amp; Nghe</Link>
                                        <Link to="/speaking-conversation" className="dropdown-item">Hội thoại luyện Nói với AI</Link>
                                        <Link to="/flashcards" className="dropdown-item">Thẻ ghi nhớ</Link>
                                        <Link to="/vocabulary/review" className="dropdown-item">Ôn từ vựng thông minh</Link>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </Nav>

                        {/* ACCOUNT */}
                        <div className="header-actions">
                            {token ? (
                                <Dropdown
                                    align="end"
                                    className="user-menu"
                                >
                                    <Dropdown.Toggle
                                        id="user-menu-toggle"
                                        className="user-trigger"
                                    >
                                        <img
                                            src={
                                                profile?.detail?.Avatar ||
                                                "https://i.pravatar.cc/100"
                                            }
                                            className="user-avatar"
                                            alt="Ảnh đại diện người dùng"
                                        />

                                        <span className="user-info">
                                            <strong>
                                                {profile?.detail?.Name || "Người dùng"}
                                            </strong>

                                            <small>
                                                {isAdmin
                                                    ? "Quản trị viên"
                                                    : profile?.user?.Role === "teacher" || role === "teacher"
                                                        ? "Giảng viên"
                                                        : "Học viên"}
                                            </small>
                                        </span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="user-dropdown">
                                        {isAdmin ? <>
                                            <Link to="/admin/profile" className="dropdown-item"><FaUserCircle /> Hồ sơ quản trị</Link>
                                            <Link to="/admin/settings" className="dropdown-item"><FaCog /> Cài đặt</Link>
                                            <Link to="/admin/dashboard" className="dropdown-item admin-dropdown-item"><FaTachometerAlt /> Tổng quan quản trị</Link>
                                        </> : <>
                                            <Link to="/profile" className="dropdown-item"><FaUserCircle /> Hồ sơ của tôi</Link>
                                            <Link to="/my-courses" className="dropdown-item"><FaBook /> Khóa học của tôi</Link>
                                            <Link to="/settings" className="dropdown-item"><FaCog /> Cài đặt</Link>
                                        </>}

                                        <Dropdown.Divider />

                                        <Dropdown.Item
                                            onClick={handleLogout}
                                            className="logout-item"
                                        >
                                            <FaSignOutAlt />
                                            Đăng xuất
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            ) : (
                                <div className="guest-actions">
                                    <Link to="/login" className="header-login-btn">
                                        Đăng nhập
                                    </Link>

                                    <Link to="/register" className="header-start-btn">
                                        Bắt đầu học
                                        <FaArrowRight />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>
        </Navbar>
    );
}

export default Header;
