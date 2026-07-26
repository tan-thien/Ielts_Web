import { useState } from "react";
import { login } from "../auth.service";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const handleLogin = async () => {

        try {

            const result = await login({
                Email: email,
                Password: password
            });

            alert(result.message);

            if (result.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/home");
            }

        } catch (error: any) {

            alert(error.response?.data?.message);

        }

    };

    return (

        <div className="login-container">

            <div className="login-left">

                <div className="overlay">

                    <h1>IELTS Learning</h1>

                    <p>
                        Learn English smarter.
                        Practice IELTS with AI.
                    </p>

                </div>

            </div>

            <div className="login-right">

                <div className="login-card">

                    <h2>Welcome Back 👋</h2>

                    <p>Please login to continue</p>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button onClick={handleLogin}>
                        Login
                    </button>

                </div>

            </div>

        </div>

    );

}

export default LoginPage;