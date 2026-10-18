import api from "./api";
import type {
    GoogleAuthResponse,
    GoogleRegistrationProfile,
    LoginRequest,
    LoginResponse,
    ProfileData,
    ProfileUpdateRequest,
    RegisterRequest,
} from "../types/auth";

const saveSession = (result: LoginResponse) => {
    localStorage.setItem("token", result.token);
    localStorage.setItem("role", result.role);
    localStorage.setItem("userId", result.userId);
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    const result = response.data;

    saveSession(result);

    return result;
};

export const requestPasswordReset = async (email: string): Promise<{ message: string; resetUrl?: string }> => {
    const response = await api.post<{ message: string; resetUrl?: string }>("/auth/forgot-password", { email });
    return response.data;
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/auth/reset-password", { token, password });
    return response.data;
};

export const googleLogin = async (credential: string): Promise<GoogleAuthResponse> => {
    const response = await api.post<GoogleAuthResponse>("/auth/google", { credential });
    const result = response.data;
    if (!result.registrationRequired) {
        saveSession(result);
    }
    return result;
};

export const completeGoogleRegistration = async (
    registrationToken: string,
    profile: GoogleRegistrationProfile,
): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/google/complete-registration", {
        registrationToken,
        profile,
    });
    saveSession(response.data);
    return response.data;
};

export const register = async (data: RegisterRequest) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export const getProfile = async (): Promise<ProfileData> => {
    const response = await api.get<ProfileData>("/auth/me");
    return response.data;
};

export const updateProfile = async (
    data: ProfileUpdateRequest,
): Promise<ProfileData> => {
    const response = await api.put<ProfileData>("/auth/me", data);
    return response.data;
};
