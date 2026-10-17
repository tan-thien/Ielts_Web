import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import {
    completeGoogleRegistration,
    googleLogin,
    login,
} from "../../services/auth.service";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { GoogleRegistrationProfile } from "../../types/auth";
import "./LoginPage.css";

interface GoogleCredentialResponse {
    credential: string;
}

interface GoogleIdentityServices {
    accounts: {
        id: {
            initialize: (options: {
                client_id: string;
                callback: (response: GoogleCredentialResponse) => void;
                auto_select: boolean;
            }) => void;
            renderButton: (
                parent: HTMLElement,
                options: {
                    theme: "outline";
                    size: "large";
                    width: number;
                    text: "signin_with";
                    shape: "rectangular";
                },
            ) => void;
        };
    };
}

declare global {
    interface Window {
        google?: GoogleIdentityServices;
    }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [googleEmail, setGoogleEmail] = useState("");
    const [googleRegistrationToken, setGoogleRegistrationToken] = useState("");
    const [registrationProfile, setRegistrationProfile] = useState<GoogleRegistrationProfile>({
        Name: "",
        Gender: "male",
        Phone: "",
        Address: "",
        Birthday: "",
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const finishLogin = useCallback((role: string) => {
        if (role === "admin") {
            navigate("/admin");
            return;
        }
        const redirect = searchParams.get("redirect");
        navigate(redirect?.startsWith("/") ? redirect : "/home");
    }, [navigate, searchParams]);

    const handleGoogleCredential = useCallback(async (credential: string) => {
        setSubmitting(true);
        setErrorMessage("");
        try {
            const result = await googleLogin(credential);
            if (result.registrationRequired) {
                setGoogleRegistrationToken(result.registrationToken);
                setGoogleEmail(result.profile.Email);
                setRegistrationProfile((current) => ({
                    ...current,
                    Name: result.profile.Name || current.Name,
                }));
            } else {
                finishLogin(result.role);
            }
        } catch (error: unknown) {
            setErrorMessage(
                axios.isAxiosError<{ message?: string }>(error)
                    ? error.response?.data?.message || "Đăng nhập Google thất bại."
                    : error instanceof Error ? error.message : "Đăng nhập Google thất bại.",
            );
        } finally {
            setSubmitting(false);
        }
    }, [finishLogin]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

        const renderGoogleButton = () => {
            if (!window.google || !googleButtonRef.current) return;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response) => {
                    void handleGoogleCredential(response.credential);
                },
                auto_select: false,
            });
            googleButtonRef.current.replaceChildren();
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: "outline",
                size: "large",
                width: Math.min(370, googleButtonRef.current.clientWidth || 370),
                text: "signin_with",
                shape: "rectangular",
            });
        };

        let script = document.querySelector<HTMLScriptElement>(
            'script[data-google-identity-services="true"]',
        );
        if (window.google) {
            renderGoogleButton();
        } else if (script) {
            script.addEventListener("load", renderGoogleButton, { once: true });
        } else {
            const googleScript = document.createElement("script");
            googleScript.src = "https://accounts.google.com/gsi/client";
            googleScript.async = true;
            googleScript.defer = true;
            googleScript.dataset.googleIdentityServices = "true";
            googleScript.addEventListener("load", renderGoogleButton, { once: true });
            googleScript.addEventListener("error", () => {
                setErrorMessage("Không thể tải dịch vụ đăng nhập Google.");
            }, { once: true });
            document.head.appendChild(googleScript);
            script = googleScript;
        }

        return () => {
            script?.removeEventListener("load", renderGoogleButton);
        };
    }, [googleRegistrationToken, handleGoogleCredential]);

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setErrorMessage("");
        try {
            const result = await login({
                Email: email,
                Password: password,
            });
            finishLogin(result.role);
        } catch (error: unknown) {
            setErrorMessage(
                axios.isAxiosError<{ message?: string }>(error)
                    ? error.response?.data?.message || "Đăng nhập thất bại."
                    : error instanceof Error ? error.message : "Đăng nhập thất bại.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteRegistration = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!googleRegistrationToken) return;
        setSubmitting(true);
        setErrorMessage("");
        try {
            const result = await completeGoogleRegistration(
                googleRegistrationToken,
                registrationProfile,
            );
            finishLogin(result.role);
        } catch (error: unknown) {
            setErrorMessage(
                axios.isAxiosError<{ message?: string }>(error)
                    ? error.response?.data?.message || "Không thể hoàn tất đăng ký."
                    : error instanceof Error ? error.message : "Không thể hoàn tất đăng ký.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="overlay">
                    <h1>IELTS Learning</h1>
                    <p>Learn English smarter. Practice IELTS with AI.</p>
                </div>
            </div>
            <div className="login-right">
                <div className="login-card">
                    {!googleRegistrationToken ? (
                        <>
                            <h2>Welcome Back 👋</h2>
                            <p>Please login to continue</p>
                            <form onSubmit={handleLogin}>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
                                <button type="submit" disabled={submitting}>
                                    {submitting ? "Đang đăng nhập..." : "Login"}
                                </button>
                            </form>
                            <div className="login-divider"><span>hoặc</span></div>
                            {GOOGLE_CLIENT_ID ? (
                                <>
                                    <div className="google-signin-button" ref={googleButtonRef} />
                                    {submitting && <p className="login-status">Đang xác thực Google...</p>}
                                </>
                            ) : (
                                <p className="login-setup">
                                    Đăng nhập Google chưa được cấu hình. Hãy thêm
                                    {" "}VITE_GOOGLE_CLIENT_ID vào file .env của frontend.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <h2>Hoàn tất đăng ký</h2>
                            <p>Tài khoản Google chưa có hồ sơ. Bổ sung thông tin để tiếp tục.</p>
                            <p className="google-account-email">{googleEmail}</p>
                            <form onSubmit={handleCompleteRegistration}>
                                <input
                                    name="Name"
                                    type="text"
                                    placeholder="Họ và tên"
                                    value={registrationProfile.Name}
                                    onChange={(event) => setRegistrationProfile({
                                        ...registrationProfile,
                                        Name: event.target.value,
                                    })}
                                    required
                                />
                                <select
                                    name="Gender"
                                    value={registrationProfile.Gender}
                                    onChange={(event) => setRegistrationProfile({
                                        ...registrationProfile,
                                        Gender: event.target.value as GoogleRegistrationProfile["Gender"],
                                    })}
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                                <input
                                    name="Phone"
                                    type="tel"
                                    placeholder="Số điện thoại"
                                    autoComplete="tel"
                                    value={registrationProfile.Phone}
                                    onChange={(event) => setRegistrationProfile({
                                        ...registrationProfile,
                                        Phone: event.target.value,
                                    })}
                                    required
                                />
                                <input
                                    name="Address"
                                    type="text"
                                    placeholder="Địa chỉ"
                                    autoComplete="street-address"
                                    value={registrationProfile.Address}
                                    onChange={(event) => setRegistrationProfile({
                                        ...registrationProfile,
                                        Address: event.target.value,
                                    })}
                                    required
                                />
                                <input
                                    name="Birthday"
                                    type="date"
                                    aria-label="Ngày sinh"
                                    max={new Date().toISOString().slice(0, 10)}
                                    value={registrationProfile.Birthday}
                                    onChange={(event) => setRegistrationProfile({
                                        ...registrationProfile,
                                        Birthday: event.target.value,
                                    })}
                                    required
                                />
                                <button type="submit" disabled={submitting}>
                                    {submitting ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
                                </button>
                                <button
                                    className="login-secondary-button"
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setGoogleRegistrationToken("")}
                                >
                                    Quay lại đăng nhập
                                </button>
                            </form>
                        </>
                    )}
                    {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
                </div>
            </div>
        </div>
    );
}

export default LoginPage;