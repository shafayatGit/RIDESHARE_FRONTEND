import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/services/auth";
import type { RegisterPayload, RegisterResponse } from "@/types/registration";

export function useRegistration() {
  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: registerUser,
  });
}
