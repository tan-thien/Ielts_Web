
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
    FaGraduationCap,
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

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        getProfile()
            .then((data) => {
                if (!cancelled) setProfile(data);
            })
            .catch(() => console.log("Cannot load profile"));
        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        const refreshProfile = () => {
            if (!token) return;
            getProfile()
                .then(setProfile)
                .catch(() => console.log("Cannot load profile"));
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
                {/* BRAND */}
                <Link to="/home" className="navbar-brand header-brand">
                    <span className="brand-icon"><FaGraduationCap /></span>
                    <span className="brand-name">IELTS<span> NGTANTH_</span></span>
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
                            <span className="brand-name">
                                IELTS<span>AI</span>
                            </span>
                        </Offcanvas.Title>
                    </Offcanvas.Header>

                    <Offcanvas.Body>
                        {/* NAVIGATION */}
                        <Nav className="header-nav mx-lg-auto">
                            <NavLink to="/home" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Home</NavLink>

                            <NavLink to="/courses" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Courses</NavLink>

                            <NavLink to="/writingAI" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Writing AI</NavLink>

                            {/* <NavLink to="/reading" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Reading</NavLink>

                            <NavLink to="/listening" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Listening</NavLink> */}

                            <NavLink to="/speakingAI" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Speaking AI</NavLink>

                            <NavLink to="/vocabulary" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Vocabulary</NavLink>
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
                                            alt="User avatar"
                                        />

                                        <span className="user-info">
                                            <strong>
                                                {profile?.detail?.Name || "User"}
                                            </strong>

                                            <small>
                                                {profile?.user?.Role || role || "Member"}
                                            </small>
                                        </span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="user-dropdown">
                                        <Link to="/profile" className="dropdown-item"><FaUserCircle /> My Profile</Link>

                                        <Link to="/my-courses" className="dropdown-item"><FaBook /> My Courses</Link>

                                        <Link to="/settings" className="dropdown-item"><FaCog /> Settings</Link>

                                        {role?.toLowerCase() === "admin" && (
                                            <Link to="/admin" className="dropdown-item admin-dropdown-item"><FaTachometerAlt /> Admin Dashboard</Link>
                                        )}

                                        <Dropdown.Divider />

                                        <Dropdown.Item
                                            onClick={handleLogout}
                                            className="logout-item"
                                        >
                                            <FaSignOutAlt />
                                            Logout
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            ) : (
                                <div className="guest-actions">
                                    <Link to="/login" className="header-login-btn">
                                        Login
                                    </Link>

                                    <Link to="/register" className="header-start-btn">
                                        Get Started
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
