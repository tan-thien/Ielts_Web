import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../shared/components/Sidebar";
import Navbar from "../shared/components/Navbar";

import "./AdminLayout.css";

function AdminLayout() {

    const [collapsed, setCollapsed] = useState(false);

    return (

        <div className="admin-layout">

            <Sidebar
                collapsed={collapsed}
            />

            <section
                className={`admin-content ${collapsed ? "collapsed" : ""}`}
            >

                <Navbar
                    toggleSidebar={() => setCollapsed(!collapsed)}
                />

                <main className="admin-page">

                    <Outlet />

                </main>

            </section>

        </div>

    );

}

export default AdminLayout;