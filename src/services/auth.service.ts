import api from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest } from "../types/auth";

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    const result = response.data;

    localStorage.setItem("token", result.token);
    localStorage.setItem("role", result.role);
    localStorage.setItem("userId", result.userId);

    return result;
};

export const register = async (data: RegisterRequest) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export const getProfile = async () => {
    const token = localStorage.getItem("token");

    const res = await api.get("/auth/me", {
        headers: {
            Authorization: token ? `Bearer ${token}` : ""
        }
    });

    return res.data;
};
