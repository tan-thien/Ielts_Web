import { useEffect, useState } from "react";
import { FaUserEdit, FaCamera } from "react-icons/fa";
import { getProfile } from "../../services/auth.service";
import "./ProfilePage.css";

function ProfilePage() {

    const [profile, setProfile] = useState<any>();

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const data = await getProfile();
        setProfile(data);
    }

    return (

        <div className="profile-page container-fluid">


            <div className="profile-cover">
                <div className="page-header">

                    <h2>My Profile</h2>

                    <p>
                        Manage your personal information
                    </p>

                </div>

            </div>

            <div className="row g-4 profile-content">

                <div className="col-lg-4 col-xl-3">

                    <div className="profile-card">

                        <img
                            src={
                                profile?.detail?.Avatar ||
                                "https://i.pravatar.cc/300"
                            }
                            className="profile-avatar"
                            alt=""
                        />

                        <h3 className="profile-name">
                            {profile?.detail?.Name}
                        </h3>

                        <p className="profile-role">
                            {profile?.user?.Role === "admin"
                                ? "Administrator"
                                : "Student"}
                        </p>

                        <div className="role-badge">
                            {profile?.user?.Role?.toUpperCase()}
                        </div>

                        <button className="btn btn-outline-primary change-avatar-btn mt-4">

                            <FaCamera className="me-2" />

                            Change Avatar

                        </button>

                    </div>

                </div>

                <div className="col-lg-8">

                    <div className="profile-info">

                        <h4>

                            Personal Information

                        </h4>

                        <div className="row">

                            <div className="col-md-6">

                                <label>Full Name</label>

                                <input
                                    className="form-control"
                                    value={profile?.detail?.Name || ""}
                                    disabled
                                />

                            </div>

                            <div className="col-md-6">

                                <label>Email</label>

                                <input
                                    className="form-control"
                                    value={profile?.user?.Email || ""}
                                    disabled
                                />

                            </div>

                            <div className="col-md-6">

                                <label>Phone</label>

                                <input
                                    className="form-control"
                                    value={profile?.detail?.Phone || ""}
                                    disabled
                                />

                            </div>

                            <div className="col-md-6">

                                <label>Gender</label>

                                <input
                                    className="form-control"
                                    value={profile?.detail?.Gender || ""}
                                    disabled
                                />

                            </div>

                            <div className="col-md-6">

                                <label>Birthday</label>

                                <input
                                    className="form-control"
                                    value={
                                        profile?.detail?.Birthday
                                            ? new Date(
                                                profile.detail.Birthday
                                            ).toLocaleDateString()
                                            : ""
                                    }
                                    disabled
                                />

                            </div>

                            <div className="col-md-6">

                                <label>Role</label>

                                <input
                                    className="form-control"
                                    value={profile?.user?.Role || ""}
                                    disabled
                                />

                            </div>

                            <div className="col-12">

                                <label>Address</label>

                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={profile?.detail?.Address || ""}
                                    disabled
                                />

                            </div>

                        </div>

                        <button className="btn btn-primary mt-4">

                            <FaUserEdit />

                            Edit Profile

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default ProfilePage;