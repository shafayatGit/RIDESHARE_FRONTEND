export interface RegisterPayload {
  name: string;
  email: string;
  gender: "MALE" | "FEMALE";
  phoneNumber: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  gender: string;
  phoneNumber: string | null;
  image: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: RegisterUser;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SendOTPPayload {
  email: string;
}

export interface VerifyOTPPayload {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  accessToken: string;
  refreshToken: string;
  token: string;
  user: RegisterUser;
}
