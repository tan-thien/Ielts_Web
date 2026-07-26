import { NavLink, useNavigate } from "react-router-dom";
import {
    FaChartPie,
    FaBook,
    FaBookOpen,
    FaClipboardList,
    FaUsers,
    FaChalkboardTeacher,
    FaMicrophone,
    FaPenNib,
    FaHeadphones,
    FaSignOutAlt,
    FaGraduationCap,
    FaCogs,
    FaCog
} from "react-icons/fa";

type SidebarProps = {
    collapsed: boolean;
};

function Sidebar({ collapsed }: SidebarProps) {

    const navigate = useNavigate();

    const handleLogout = () => {

        if (!window.confirm("Do you want to logout?"))
            return;

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");

        navigate("/login");
    };

    const menus = [
        {
            path: "/admin/dashboard",
            icon: <FaChartPie />,
            text: "Dashboard"
        },
        {
            path: "/admin/courses",
            icon: <FaBook />,
            text: "Courses"
        },
        {
            path: "/admin/lessons",
            icon: <FaBookOpen />,
            text: "Lessons"
        },
        {
            path: "/admin/assignments",
            icon: <FaClipboardList />,
            text: "Assignments"
        },
        {
            path: "/admin/users",
            icon: <FaUsers />,
            text: "Users"
        },
        {
            path: "/admin/teachers",
            icon: <FaChalkboardTeacher />,
            text: "Teachers"
        },
        {
            path: "/admin/speaking",
            icon: <FaMicrophone />,
            text: "Speaking"
        },
        {
            path: "/admin/writing",
            icon: <FaPenNib />,
            text: "Writing"
        },
        {
            path: "/admin/reading",
            icon: <FaBookOpen />,
            text: "Reading"
        },
        {
            path: "/admin/listening",
            icon: <FaHeadphones />,
            text: "Listening"
        },
        {
            path: "/admin/vocabulary",
            icon: <FaBook />,
            text: "Vocabulary"
        },
        {
            path: "/admin/reports",
            icon: <FaChartPie />,
            text: "Reports"
        },
        {
            path: "/admin/settings",
            icon: <FaCog />,
            text: "Settings"
        }
    ];

    return (

        <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>

            <div className="sidebar-logo">

                <FaGraduationCap className="logo-icon" />

                {!collapsed && (

                    <div>

                        <h2>IELTS Master</h2>

                        <p>Admin Panel</p>

                    </div>

                )}

            </div>

            <div className="sidebar-menu">

                {

                    menus.map((item) => (

                        <NavLink
                            key={item.path}
                            to={item.path}
                        >

                            <span className="menu-icon">

                                {item.icon}

                            </span>

                            {

                                !collapsed &&

                                <span>{item.text}</span>

                            }

                        </NavLink>

                    ))

                }

            </div>

            <div className="sidebar-footer">

                <button onClick={handleLogout}>

                    <FaSignOutAlt />

                    {

                        !collapsed &&

                        <span>Logout</span>

                    }

                </button>

            </div>

        </aside>

    );

}

export default Sidebar;