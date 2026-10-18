import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
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