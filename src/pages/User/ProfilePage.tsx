import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FaCamera, FaSpinner, FaUser, FaUserEdit } from "react-icons/fa";
import { getProfile, updateProfile } from "../../services/auth.service";
import { uploadCloudinaryResource } from "../../services/cloudinary.service";
import type { ProfileData, ProfileUpdateRequest } from "../../types/auth";
import "./ProfilePage.css";

const emptyForm: ProfileUpdateRequest = {
    Name: "",
    Gender: "male",
    Phone: "",
    Address: "",
    Birthday: "",
    Avatar: "",
};

function dateInputValue(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (typeof data === "object" && data !== null && "message" in data &&
                typeof data.message === "string") {
                return data.message;
            }
        }
    }
    return error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
}

function toProfileForm(profile: ProfileData): ProfileUpdateRequest {
    return {
        Name: profile.detail?.Name ?? "",
        Gender: profile.detail?.Gender ?? "male",
        Phone: profile.detail?.Phone ?? "",
        Address: profile.detail?.Address ?? "",
        Birthday: dateInputValue(profile.detail?.Birthday),
        Avatar: profile.detail?.Avatar ?? "",
    };
}

function ProfilePage() {
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [form, setForm] = useState<ProfileUpdateRequest>(emptyForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        getProfile()
            .then((data) => {
                if (cancelled) return;
                setProfile(data);
                setForm(toProfileForm(data));
            })
            .catch((error: unknown) => {
                if (!cancelled) setErrorMessage(getErrorMessage(error));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = "";
        setErrorMessage("");
        setSuccessMessage("");

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Vui lòng chọn file ảnh.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Ảnh đại diện không được vượt quá 5 MB.");
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const avatarUrl = await uploadCloudinaryResource(file, "Image");
            const updated = await updateProfile({
                ...(profile ? toProfileForm(profile) : form),
                Avatar: avatarUrl,
            });
            setProfile(updated);
            setForm((current) => ({ ...current, Avatar: avatarUrl }));
            window.dispatchEvent(new Event("profile-updated"));
            setSuccessMessage("Đã cập nhật ảnh đại diện.");
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setIsSaving(true);
        try {
            const updated = await updateProfile(form);
            setProfile(updated);
            setForm(toProfileForm(updated));
            window.dispatchEvent(new Event("profile-updated"));
            setIsEditing(false);
            setSuccessMessage("Đã cập nhật thông tin tài khoản.");
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEditing = () => {
        if (profile) setForm(toProfileForm(profile));
        setIsEditing(false);
        setErrorMessage("");
    };

    if (isLoading) {
        return (
            <main className="profile-page container-fluid">
                <div className="profile-state">Đang tải thông tin tài khoản...</div>
            </main>
        );
    }

    return (
        <main className="profile-page container-fluid">
            <div className="profile-cover">
                <div className="page-header">
                    <h2>Hồ sơ của tôi</h2>
                    <p>Quản lý thông tin cá nhân của bạn</p>
                </div>
            </div>

            {errorMessage && <div className="profile-notice error" role="alert">{errorMessage}</div>}
            {successMessage && <div className="profile-notice success" role="status">{successMessage}</div>}
            {!profile ? (
                <div className="profile-state">Không thể tải thông tin tài khoản.</div>
            ) : (
                <div className="row g-4 profile-content">
                    <div className="col-lg-4 col-xl-3">
                        <section className="profile-card">
                            <div className="profile-avatar-wrap">
                                {profile.detail?.Avatar ? (
                                    <img
                                        src={profile.detail.Avatar}
                                        className="profile-avatar"
                                        alt={`Ảnh đại diện ${profile.detail.Name || profile.user.Email}`}
                                    />
                                ) : (
                                    <div className="profile-avatar profile-avatar-placeholder" aria-label="Chưa có ảnh đại diện">
                                        <FaUser />
                                    </div>
                                )}
                                <button
                                    className="profile-avatar-camera"
                                    type="button"
                                    aria-label="Thay đổi ảnh đại diện"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={isUploadingAvatar || isSaving}
                                >
                                    {isUploadingAvatar ? <FaSpinner className="profile-spinner" /> : <FaCamera />}
                                </button>
                            </div>
                            <input
                                ref={avatarInputRef}
                                className="profile-file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                            <h3 className="profile-name">{profile.detail?.Name || profile.user.Email}</h3>
                            <p className="profile-role">
                                {profile.user.Role === "admin"
                                    ? "Quản trị viên"
                                    : profile.user.Role === "teacher"
                                        ? "Giảng viên"
                                        : "Học viên"}
                            </p>
                            <div className="role-badge">{profile.user.Role.toUpperCase()}</div>
                            <button
                                className="btn btn-outline-primary change-avatar-btn mt-4"
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={isUploadingAvatar || isSaving}
                            >
                                {isUploadingAvatar
                                    ? <><FaSpinner className="profile-spinner me-2" />Đang tải ảnh...</>
                                    : <><FaCamera className="me-2" />Đổi ảnh đại diện</>}
                            </button>
                            <small className="profile-avatar-hint">JPG, PNG hoặc WebP · Tối đa 5 MB</small>
                        </section>
                    </div>

                    <div className="col-lg-8">
                        <section className="profile-info">
                            <header className="profile-title">
                                <div>
                                    <h4>Thông tin cá nhân</h4>
                                    <p>Email và vai trò chỉ xem, không thể thay đổi tại đây.</p>
                                </div>
                                {!isEditing && (
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        onClick={() => {
                                            setForm(toProfileForm(profile));
                                            setIsEditing(true);
                                            setSuccessMessage("");
                                        }}
                                    >
                                        <FaUserEdit className="me-2" />
                                        Chỉnh sửa hồ sơ
                                    </button>
                                )}
                            </header>

                            <form onSubmit={handleSave}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <label htmlFor="profile-name">Họ và tên</label>
                                        <input
                                            id="profile-name"
                                            className="form-control"
                                            value={form.Name}
                                            onChange={(event) => setForm({ ...form, Name: event.target.value })}
                                            disabled={!isEditing || isSaving}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="profile-email">Email</label>
                                        <input id="profile-email" className="form-control" value={profile.user.Email} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="profile-phone">Số điện thoại</label>
                                        <input
                                            id="profile-phone"
                                            className="form-control"
                                            type="tel"
                                            value={form.Phone}
                                            onChange={(event) => setForm({ ...form, Phone: event.target.value })}
                                            disabled={!isEditing || isSaving}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="profile-gender">Giới tính</label>
                                        <select
                                            id="profile-gender"
                                            className="form-control"
                                            value={form.Gender}
                                            onChange={(event) => setForm({
                                                ...form,
                                                Gender: event.target.value as ProfileUpdateRequest["Gender"],
                                            })}
                                            disabled={!isEditing || isSaving}
                                        >
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="profile-birthday">Ngày sinh</label>
                                        <input
                                            id="profile-birthday"
                                            className="form-control"
                                            type="date"
                                            value={form.Birthday}
                                            onChange={(event) => setForm({ ...form, Birthday: event.target.value })}
                                            disabled={!isEditing || isSaving}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="profile-role">Vai trò</label>
                                        <input id="profile-role" className="form-control" value={profile.user.Role} disabled />
                                    </div>
                                    <div className="col-12">
                                        <label htmlFor="profile-address">Địa chỉ</label>
                                        <textarea
                                            id="profile-address"
                                            className="form-control profile-address-input"
                                            rows={3}
                                            value={form.Address}
                                            onChange={(event) => setForm({ ...form, Address: event.target.value })}
                                            disabled={!isEditing || isSaving}
                                            required
                                        />
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="profile-form-actions">
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={cancelEditing}
                                            disabled={isSaving}
                                        >
                                            Hủy
                                        </button>
                                        <button className="btn btn-primary" type="submit" disabled={isSaving || isUploadingAvatar}>
                                            {isSaving
                                                ? <><FaSpinner className="profile-spinner me-2" />Đang lưu...</>
                                                : "Lưu thay đổi"}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </section>
                    </div>
                </div>
            )}
        </main>
    );
}

export default ProfilePage;
