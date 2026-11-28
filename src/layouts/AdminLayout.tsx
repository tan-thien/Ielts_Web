import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./AdminLayout.css";

function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 992px)");
        const updateViewport = () => {
            setIsMobile(media.matches);
            setMobileOpen(false);
            if (media.matches) {
                setCollapsed(false);
            }
        };
        updateViewport();
        media.addEventListener("change", updateViewport);
        return () => media.removeEventListener("change", updateViewport);
    }, []);

    const toggleSidebar = () => {
        if (isMobile) setMobileOpen((open) => !open);
        else setCollapsed((value) => !value);
    };

    return (
        <div className={`admin-layout ${mobileOpen ? "mobile-menu-open" : ""}`}>
            <Sidebar
                collapsed={!isMobile && collapsed}
                mobileOpen={mobileOpen}
                onNavigate={() => setMobileOpen(false)}
            />
            {mobileOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="Đóng menu quản trị" onClick={() => setMobileOpen(false)} />}
            <section className={`admin-content ${collapsed && !isMobile ? "collapsed" : ""}`}>
                <Navbar toggleSidebar={toggleSidebar} />
                <main className="admin-page">
                    <Outlet />
                </main>
            </section>
        </div>
    );
}

export default AdminLayout;
