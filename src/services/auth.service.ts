import api from "../apis/api";
import { loginApi, registerApi } from "../apis/auth.api";
import type { LoginRequest, RegisterRequest } from "../types/auth";

export const login = async (data: LoginRequest) => {

    const result = await loginApi(data);

    localStorage.setItem("token", result.token);
    localStorage.setItem("role", result.role);
    localStorage.setItem("userId", result.userId);
    

    return result;
};

export const register = async (data: RegisterRequest) => {
  return await registerApi(data);
};

export const getProfile = async () => {
    const token = localStorage.getItem("token");

    const res = await api.get("/auth/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return res.data;
};
