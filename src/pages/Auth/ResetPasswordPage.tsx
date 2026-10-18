import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/auth.service";
import "./LoginPage.css";

function ResetPasswordPage() {
    const [params] = useSearchParams(); const navigate = useNavigate();
    const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setError(""); setMessage("");
        if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
        setLoading(true); try { const result = await resetPassword(params.get("token") || "", password); setMessage(result.message); setTimeout(() => navigate("/login"), 1200); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Không thể đặt lại mật khẩu."); } finally { setLoading(false); }
    };
    return <div className="login-container"><div className="login-left"><div className="overlay"><h1>    Học IELTS</h1><p>Tạo mật khẩu mới an toàn.</p></div></div><div className="login-right"><div className="login-card"><h2>Đặt lại mật khẩu</h2><form onSubmit={submit}><input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu mới" required /><input type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Nhập lại mật khẩu" required /><button type="submit" disabled={loading}>{loading ? "Đang cập nhật..." : "Đổi mật khẩu"}</button></form>{message && <p className="login-status">{message}</p>}{error && <p className="login-error">{error}</p>}<p><Link to="/login">Quay lại đăng nhập</Link></p></div></div></div>;
}

export default ResetPasswordPage;
