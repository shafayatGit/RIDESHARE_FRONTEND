import { http } from "@/services/api-client";
import type {
  ApiEnvelope,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SendOTPPayload,
  VerifyOTPPayload,
  VerifyOTPResponse,
} from "@/types/auth";

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await http.post<ApiEnvelope<AuthResponse>>(
      "/auth/register",
      payload,
    );
    return data.data;
  },

  async login(
    payload: LoginPayload,
  ): Promise<{ accessToken: string; refreshToken: string; token: string }> {
    const { data } = await http.post<
      ApiEnvelope<{
        accessToken: string;
        refreshToken: string;
        token: string;
      }>
    >("/auth/login", payload);
    return data.data;
  },

  async sendOTP(payload: SendOTPPayload): Promise<{ email: string }> {
    const { data } = await http.post<ApiEnvelope<{ email: string }>>(
      "/auth/send-otp",
      payload,
    );
    return data.data;
  },

  async resendOTP(payload: SendOTPPayload): Promise<{ email: string }> {
    const { data } = await http.post<ApiEnvelope<{ email: string }>>(
      "/auth/resend-otp",
      payload,
    );
    return data.data;
  },

  async verifyOTP(payload: VerifyOTPPayload): Promise<VerifyOTPResponse> {
    const { data } = await http.post<ApiEnvelope<VerifyOTPResponse>>(
      "/auth/verify-otp",
      payload,
    );
    return data.data;
  },
};
