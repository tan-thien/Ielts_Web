import api from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "../types/auth";

export const loginApi = async ( data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>( "/auth/login", data );
    return response.data;
};

export const registerApi = async ( data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>( "/auth/register", data );
    return response.data;
};

