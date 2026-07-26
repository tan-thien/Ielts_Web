import { Outlet } from "react-router-dom";
import Header from "../shared/components/Header";
import Footer from "../shared/components/Footer";
import "./UserLayout.css";

function UserLayout() {

    return (
        <>
            <Header />
            <main className="page-wrapper">
                <Outlet />
            </main>
            <Footer />
        </>
    );

}

export default UserLayout;