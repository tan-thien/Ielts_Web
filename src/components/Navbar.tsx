import { useEffect, useRef, useState } from "react";
import {FaBars,FaBell,FaUser,FaArrowAltCircleLeft,FaKey} from "react-icons/fa";

import { getProfile } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

type NavbarProps = {
    toggleSidebar: () => void;
};

export default function Navbar({ toggleSidebar }: NavbarProps) {

    const [user, setUser] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {

        loadProfile();

    }, []);

    async function loadProfile() {

        try {

            const data = await getProfile();

            setUser(data);

        }
        catch {

        }

    }

    useEffect(() => {

        function handleClick(e: any) {

            if (menuRef.current &&
                !menuRef.current.contains(e.target)) {

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

                    <h4 className="page-title">

                        IELTS Admin

                    </h4>

                    <span>

                        Learning Management System

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

                    <div
                        className="profile-trigger"
                        onClick={() => setOpen(!open)}
                    >

                        <img
                            src={
                                user?.detail?.Avatar ||
                                "https://i.pravatar.cc/100"
                            }
                            className="avatar"
                        />

                        <div>

                            <div className="profile-name">

                                {user?.detail?.Name}

                            </div>

                            <small>

                                {user?.user?.Role}

                            </small>

                        </div>

                    </div>

                    {
                        open &&
                        <div className="profile-dropdown">
                            <button onClick={() => navigate('/admin/profile')}>
                                <FaUser />
                                Profile
                            </button>
                            <button>
                                <FaKey />
                                Change password
                            </button>
                            <button onClick={() => navigate('/home')}>
                                <FaArrowAltCircleLeft />
                                Page user
                            </button>
                        </div>

                    }

                </div>

            </div>

        </header>

    )

}