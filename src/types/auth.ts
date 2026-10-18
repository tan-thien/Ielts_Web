export interface LoginRequest {
    Email: string;
    Password: string;
}

export interface LoginResponse {
    message: string;
    token: string;
    userId: string;
    role: string;
}

export interface RegisterRequest {
  Email: string;
  Password: string;
  Name: string;
  Gender: "male" | "female" | "other";
  Phone: string;
  Address: string;
  Birthday: string;
  Avatar: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    _id: string;
    Email: string;
    Role: string;
  };
}

export interface GoogleRegistrationProfile {
  Name: string;
  Gender: "male" | "female" | "other";
  Phone: string;
  Address: string;
  Birthday: string;
}

export interface ProfileData {
  user: {
    _id: string;
    Email: string;
    Role: string;
  };
  detail: {
    Name?: string;
    Gender?: "male" | "female" | "other";
    Phone?: string;
    Address?: string;
    Birthday?: string;
    Avatar?: string;
  } | null;
}

export interface ProfileUpdateRequest {
  Name: string;
  Gender: "male" | "female" | "other";
  Phone: string;
  Address: string;
  Birthday: string;
  Avatar: string;
}

export type GoogleAuthResponse =
  | {
      registrationRequired: true;
      registrationToken: string;
      profile: {
        Email: string;
        Name: string;
        Avatar: string;
      };
    }
  | (LoginResponse & {
      registrationRequired?: false;
    });