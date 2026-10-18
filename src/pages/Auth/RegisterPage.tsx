
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaGraduationCap,
    FaUser,
    FaEnvelope,
    FaLock,
    FaPhone,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaCamera,
    FaArrowLeft,
    FaArrowRight,
    FaCheckCircle,
    FaSpinner,
} from "react-icons/fa";

import { register } from "../../services/auth.service";
import type { RegisterRequest } from "../../types/auth";
import "./RegisterPage.css";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function RegisterPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<RegisterRequest>({
        Email: "",
        Password: "",
        Name: "",
        Gender: "male",
        Phone: "",
        Address: "",
        Birthday: "",
        Avatar: "",
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [preview, setPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                name === "Gender"
                    ? (value as "male" | "female" | "other")
                    : value,
        }));
    };

    const handleAvatarChange = async (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMessage("");
        setSuccessMessage("");

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Vui lòng chọn một file ảnh.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Ảnh không được vượt quá 5 MB.");
            e.target.value = "";
            return;
        }

        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            setErrorMessage(
                "Chưa cấu hình Cloudinary. Vui lòng kiểm tra file .env."
            );
            e.target.value = "";
            return;
        }

        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("upload_preset", UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: uploadData,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error?.message || "Không thể tải ảnh lên."
                );
            }

            setForm((prev) => ({
                ...prev,
                Avatar: result.secure_url,
            }));

            setPreview(result.secure_url);
            setSuccessMessage("Tải ảnh đại diện thành công.");
        } catch (error) {
            setForm((prev) => ({ ...prev, Avatar: "" }));
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Đã xảy ra lỗi khi tải ảnh lên."
            );
        } finally {
            setUploading(false);
        }
    };

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (uploading) {
            setErrorMessage("Vui lòng đợi ảnh tải lên hoàn tất.");
            return;
        }

        if (form.Password !== confirmPassword) {
            setErrorMessage("Mật khẩu xác nhận không khớp.");
            return;
        }

        if (form.Password.length < 6) {
            setErrorMessage("Mật khẩu cần có ít nhất 6 ký tự.");
            return;
        }

        setSubmitting(true);

        try {
            const result = await register(form);
            alert(result.message || "Đăng ký thành công!");
            navigate("/login");
        } catch (error: any) {
            setErrorMessage(
                error?.response?.data?.message ||
                    "Đăng ký thất bại. Vui lòng thử lại."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-decoration register-decoration-one" />
            <div className="register-decoration register-decoration-two" />

            <section className="register-card">
                <aside className="register-intro">
                    <Link to="/home" className="register-brand">
                        <span className="register-brand-icon">
                            <FaGraduationCap />
                        </span>
                        <span>
                            IELTS<span className="register-brand-accent"> THÔNG MINH</span>
                        </span>
                    </Link>

                    <div className="register-intro-content">
                        <span className="register-eyebrow">
                            HÀNH TRÌNH CỦA BẠN BẮT ĐẦU TỪ ĐÂY
                        </span>
                        <h1>
                            Học IELTS
                            <br />
                            <span>Hiệu quả hơn cùng AI.</span>
                        </h1>
                        <p>
                            Tạo tài khoản để bắt đầu hành trình học IELTS,
                            luyện tập bốn kỹ năng và theo dõi tiến độ của bạn.
                        </p>

                        <div className="register-benefit">
                            <span><FaCheckCircle /></span>
                            <div>
                                <strong>Học theo nhịp độ riêng</strong>
                                <small>Học theo mục tiêu của riêng bạn</small>
                            </div>
                        </div>

                        <div className="register-benefit">
                            <span><FaCheckCircle /></span>
                            <div>
                                <strong>Luyện tập đầy tự tin</strong>
                                <small>Luyện tập từng bước mỗi ngày</small>
                            </div>
                        </div>
                    </div>

                    <div className="register-intro-footer">
                        Phát triển kỹ năng. Chinh phục mục tiêu.
                    </div>
                </aside>

                <div className="register-form-panel">
                    <div className="register-form-heading">
                        <Link to="/login" className="register-back-link">
                            <FaArrowLeft aria-hidden="true" />
                            Quay lại đăng nhập
                        </Link>
                        <span className="register-form-label">
                            BẮT ĐẦU HỌC MIỄN PHÍ
                        </span>
                        <h2>Tạo tài khoản</h2>
                        <p>Điền thông tin bên dưới để đăng ký.</p>
                    </div>

                    <form onSubmit={handleRegister}>
                        <div className="avatar-upload">
                            <button
                                type="button"
                                className="avatar-preview"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                aria-label="Chọn ảnh đại diện"
                            >
                                {preview ? (
                                    <img src={preview} alt="Ảnh đại diện xem trước" />
                                ) : (
                                    <FaUser />
                                )}
                                <span className="avatar-camera">
                                    {uploading ? (
                                        <FaSpinner className="spin-icon" />
                                    ) : (
                                        <FaCamera />
                                    )}
                                </span>
                            </button>

                            <div className="avatar-upload-text">
                                <strong>Ảnh đại diện</strong>
                                <span>
                                    {uploading
                                        ? "Đang tải ảnh lên..."
                                        : "JPG, PNG hoặc WebP · Tối đa 5 MB"}
                                </span>
                                <button
                                    type="button"
                                    className="avatar-select-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? "Đang tải..." : "Chọn ảnh"}
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                className="avatar-file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        {errorMessage && (
                            <div className="register-alert register-alert-error">
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div className="register-alert register-alert-success">
                                {successMessage}
                            </div>
                        )}

                        <div className="register-fields">
                            <div className="register-field">
                                <label htmlFor="Name">Họ và tên *</label>
                                <div className="register-input-wrap">
                                    <FaUser />
                                    <input
                                        id="Name"
                                        name="Name"
                                        value={form.Name}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn A"
                                        autoComplete="name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="Email">Email *</label>
                                <div className="register-input-wrap">
                                    <FaEnvelope />
                                    <input
                                        id="Email"
                                        name="Email"
                                        type="email"
                                        value={form.Email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="Password">Mật khẩu *</label>
                                <div className="register-input-wrap">
                                    <FaLock />
                                    <input
                                        id="Password"
                                        name="Password"
                                        type="password"
                                        value={form.Password}
                                        onChange={handleChange}
                                        placeholder="Ít nhất 6 ký tự"
                                        autoComplete="new-password"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="ConfirmPassword">
                                    Xác nhận mật khẩu *
                                </label>
                                <div className="register-input-wrap">
                                    <FaLock />
                                    <input
                                        id="ConfirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        placeholder="Nhập lại mật khẩu"
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="Gender">Giới tính</label>
                                <select
                                    id="Gender"
                                    name="Gender"
                                    value={form.Gender}
                                    onChange={handleChange}
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div className="register-field">
                                <label htmlFor="Phone">Số điện thoại</label>
                                <div className="register-input-wrap">
                                    <FaPhone />
                                    <input
                                        id="Phone"
                                        name="Phone"
                                        type="tel"
                                        value={form.Phone}
                                        onChange={handleChange}
                                        placeholder="Nhập số điện thoại"
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="Birthday">Ngày sinh</label>
                                <div className="register-input-wrap">
                                    <FaCalendarAlt />
                                    <input
                                        id="Birthday"
                                        name="Birthday"
                                        type="date"
                                        value={form.Birthday}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="register-field">
                                <label htmlFor="Address">Địa chỉ</label>
                                <div className="register-input-wrap">
                                    <FaMapMarkerAlt />
                                    <input
                                        id="Address"
                                        name="Address"
                                        value={form.Address}
                                        onChange={handleChange}
                                        placeholder="Nhập địa chỉ"
                                        autoComplete="street-address"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={submitting || uploading}
                        >
                            {submitting ? (
                                <>
                                    <FaSpinner className="spin-icon" />
                                    Đang tạo tài khoản...
                                </>
                            ) : (
                                <>
                                    Tạo tài khoản
                                    <FaArrowRight />
                                </>
                            )}
                        </button>

                        <p className="register-login">
                            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                        </p>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default RegisterPage;
