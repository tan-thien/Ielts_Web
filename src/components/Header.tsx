import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../services/auth.service";
import { FaUserCircle, FaBook, FaCog, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";
import { Dropdown } from "react-bootstrap";

function Header() {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (token) {
            loadProfile();
        }
    }, []);

    async function loadProfile() {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch {
            console.log("Cannot load profile");
        }
    }

    return (
        <Navbar
            expand="lg"
            fixed="top"
            className="main-navbar"
        >
            <Container>

                <Navbar.Brand
                    as={Link}
                    to="/home"
                    className="logo"
                >
                    🎓 IELTS Master
                </Navbar.Brand>

                <Navbar.Toggle />
                <Navbar.Offcanvas placement="end">
                    <Navbar.Collapse>

                        <Nav className="mx-auto">

                            <Nav.Link as={Link} to="/home">
                                Home
                            </Nav.Link>

                            <Nav.Link as={Link} to="/courses">
                                Courses
                            </Nav.Link>

                            <Nav.Link as={Link} to="/writing">
                                Writing
                            </Nav.Link>

                            <Nav.Link as={Link} to="/reading">
                                Reading
                            </Nav.Link>

                            <Nav.Link as={Link} to="/listening">
                                Listening
                            </Nav.Link>

                            <Nav.Link as={Link} to="/speaking">
                                Speaking
                            </Nav.Link>

                        </Nav>

                        {
                            token ? (

                                <Dropdown align="end" className="user-menu">

                                    <Dropdown.Toggle
                                        as="div"
                                        className="user-trigger"
                                    >

                                        <img
                                            src={
                                                profile?.detail?.Avatar ||
                                                "https://i.pravatar.cc/100"
                                            }
                                            className="user-avatar"
                                            alt=""
                                        />

                                        <div className="user-info">

                                            <span>
                                                {profile?.detail?.Name || "User"}
                                            </span>

                                            <small>
                                                {profile?.user?.Role}
                                            </small>

                                        </div>

                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>

                                        <Dropdown.Item
                                            as={Link}
                                            to="/profile"
                                        >
                                            <FaUserCircle className="me-2" />
                                            My Profile
                                        </Dropdown.Item>

                                        <Dropdown.Item
                                            as={Link}
                                            to="/my-courses"
                                        >
                                            <FaBook className="me-2" />
                                            My Courses
                                        </Dropdown.Item>

                                        <Dropdown.Item
                                            as={Link}
                                            to="/settings"
                                        >
                                            <FaCog className="me-2" />
                                            Settings
                                        </Dropdown.Item>

                                        {role?.toLowerCase() === "admin" && (
                                            <Dropdown.Item as={Link} to="/admin" className="fw-semibold">
                                                <FaTachometerAlt className="me-2" />
                                                Admin Dashboard
                                            </Dropdown.Item>
                                        )}

                                        <Dropdown.Divider />

                                        <Dropdown.Item
                                            className="text-danger"
                                            onClick={() => {
                                                localStorage.clear();
                                                window.location.href = "/login";
                                            }}
                                        >
                                            <FaSignOutAlt className="me-2" />
                                            Logout
                                        </Dropdown.Item>

                                    </Dropdown.Menu>

                                </Dropdown>

                            ) : (

                                <Button
                                    as={Link as any}
                                    to="/login"
                                    className="login-btn"
                                >
                                    Login
                                </Button>

                            )
                        }

                    </Navbar.Collapse>
                </Navbar.Offcanvas>
            </Container>

        </Navbar>
    );
}

export default Header;