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
    // FaHeadphones,
    FaSignOutAlt,
    FaCog
} from "react-icons/fa";

type SidebarProps = {
    collapsed: boolean;
};

function Sidebar({ collapsed }: SidebarProps) {

    const navigate = useNavigate();

    const handleLogout = () => {

        if (!window.confirm("Bạn có muốn đăng xuất không?"))
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
            text: "Tổng quan"
        },
        {
            path: "/admin/courses",
            icon: <FaBook />,
            text: "Khóa học"
        },
        {
            path: "/admin/lessons",
            icon: <FaBookOpen />,
            text: "Bài học"
        },
        {
            path: "/admin/assignments",
            icon: <FaClipboardList />,
            text: "Bài tập"
        },
        {
            path: "/admin/students",
            icon: <FaUsers />,
            text: "Học viên"
        },
        {
            path: "/admin/teachers",
            icon: <FaChalkboardTeacher />,
            text: "Giảng viên"
        },
        {
            path: "/admin/speakingAI",
            icon: <FaMicrophone />,
            text: "Luyện Nói AI"
        },
        {
            path: "/admin/writingAI",
            icon: <FaPenNib />,
            text: "Luyện Viết AI"
        },
        // {
        //     path: "/admin/reading",
        //     icon: <FaBookOpen />,
        //     text: "Reading"
        // },
        // {
        //     path: "/admin/listening",
        //     icon: <FaHeadphones />,
        //     text: "Listening"
        // },
        {
            path: "/admin/vocabulary",
            icon: <FaBook />,
            text: "Từ vựng"
        },
        {
            path: "/admin/reports",
            icon: <FaChartPie />,
            text: "Báo cáo"
        },
        {
            path: "/admin/settings",
            icon: <FaCog />,
            text: "Cài đặt"
        }
    ];

    return (

        <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>

            <div className="sidebar-logo">

                <img className="logo-icon" src="/Logo.png" alt="" />

                {!collapsed && (

                    <div>

                        <h2>IELTS HỌC TẬP</h2>

                        <p>Khu vực quản trị</p>

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

                        <span>Đăng xuất</span>

                    }

                </button>

            </div>

        </aside>

    );

}

export default Sidebar;
