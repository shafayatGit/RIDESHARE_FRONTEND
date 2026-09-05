import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SendOTPPayload,
  VerifyOTPPayload,
  VerifyOTPResponse,
} from "@/types/auth";

export function useRegister() {
  return useMutation<
    AuthResponse,
    Error,
    { payload: RegisterPayload; onSuccess?: (email: string) => void }
  >({
    mutationFn: async ({ payload }) => authService.register(payload),
    onSuccess: (_data, { onSuccess, payload }) => {
      onSuccess?.(payload.email);
    },
  });
}

export function useLogin() {
  return useMutation<
    { accessToken: string; refreshToken: string; token: string },
    Error,
    LoginPayload
  >({
    mutationFn: (payload) => authService.login(payload),
  });
}

export function useSendOTP() {
  return useMutation<{ email: string }, Error, SendOTPPayload>({
    mutationFn: (payload) => authService.sendOTP(payload),
  });
}

export function useResendOTP() {
  return useMutation<{ email: string }, Error, SendOTPPayload>({
    mutationFn: (payload) => authService.resendOTP(payload),
  });
}

export function useVerifyOTP() {
  return useMutation<VerifyOTPResponse, Error, VerifyOTPPayload>({
    mutationFn: (payload) => authService.verifyOTP(payload),
  });
}
