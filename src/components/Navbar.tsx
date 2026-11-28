import { useEffect, useRef, useState } from "react";
import {FaBars,FaBell,FaUser,FaArrowAltCircleLeft,FaCog} from "react-icons/fa";

import { getProfile } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import type { ProfileData } from "../types/auth";

type NavbarProps = {
    toggleSidebar: () => void;
};

export default function Navbar({ toggleSidebar }: NavbarProps) {

    const [user, setUser] = useState<ProfileData | null>(null);
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        getProfile()
            .then((data) => {
                if (isMounted) setUser(data);
            })
            .catch((error: unknown) => {
                console.error("Không thể tải hồ sơ quản trị viên:", error);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {

        function handleClick(e: MouseEvent) {

            if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {

                setOpen(false);

            }

        }

        document.addEventListener("click", handleClick);

        return () => document.removeEventListener("click", handleClick);

    }, []);

    return (

        <header className="admin-navbar">

            <div className="navbar-left">

                <button
                    className="menu-btn"
                    onClick={toggleSidebar}
                >

                    <FaBars />

                </button>

                <div>

                    <h4 className="page-title">Quản trị IELTS</h4>

                    <span>

                        Hệ thống quản lý học tập

                    </span>

                </div>

            </div>

            <div className="navbar-right">

                <button className="icon-btn">

                    <FaBell />

                    <span className="notification-dot"></span>

                </button>

                <div
                    className="profile-box"
                    ref={menuRef}
                >

                    <button
                        type="button"
                        className="profile-trigger"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-label="Mở menu hồ sơ quản trị"
                    >

                        <img
                            src={
                                user?.detail?.Avatar ||
                                "https://i.pravatar.cc/100"
                            }
                            className="avatar"
                            alt="Ảnh đại diện quản trị viên"
                        />

                        <div>

                            <div className="profile-name">

                                {user?.detail?.Name}

                            </div>

                            <small>

                                {user?.user?.Role === "admin" ? "Quản trị viên" : "Giảng viên"}

                            </small>

                        </div>

                        </button>

                    {
                        open &&
                        <div className="profile-dropdown">
                            <button onClick={() => navigate('/admin/profile')}>
                                <FaUser />
                                Hồ sơ cá nhân
                            </button>
                            <button onClick={() => { setOpen(false); navigate('/admin/settings'); }}>
                                <FaCog />
                                Cài đặt
                            </button>
                            <button onClick={() => navigate('/home')}>
                                <FaArrowAltCircleLeft />
                                Trang học viên
                            </button>
                        </div>

                    }

                </div>

            </div>

        </header>

    )

}