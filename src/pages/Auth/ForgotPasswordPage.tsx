import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/auth.service";
import "./LoginPage.css";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [resetUrl, setResetUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setLoading(true); setError(""); setMessage(""); setResetUrl("");
        try { const result = await requestPasswordReset(email); setMessage(result.message); setResetUrl(result.resetUrl || ""); }
        catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Không thể tạo yêu cầu đặt lại mật khẩu."); }
        finally { setLoading(false); }
    };
    return <div className="login-container"><div className="login-left"><div className="overlay"><h1>Học IELTS</h1><p>Khôi phục quyền truy cập tài khoản của bạn.</p></div></div><div className="login-right"><div className="login-card"><h2>Quên mật khẩu?</h2><p>Nhập địa chỉ email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p><form onSubmit={submit}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Địa chỉ email" required /><button type="submit" disabled={loading}>{loading ? "Đang xử lý..." : "Gửi yêu cầu"}</button></form>{message && <p className="login-status">{message}</p>}{resetUrl && <p className="login-setup"><Link to={resetUrl.replace(window.location.origin, "")}>Mở liên kết đặt lại mật khẩu (trên máy chủ cục bộ)</Link></p>}{error && <p className="login-error">{error}</p>}<p><Link to="/login">Quay lại đăng nhập</Link></p></div></div></div>;
}

export default ForgotPasswordPage;
