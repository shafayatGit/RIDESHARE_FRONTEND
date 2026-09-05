"use client";

import { authStore } from "@/hooks/auth-store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    if (authStore.isVerified()) {
      router.replace("/dashboard");
      return;
    }
    if (authStore.isPending()) {
      router.replace("/otp-verification");
    }
  }, [router]);

  return !authStore.isVerified() && !authStore.isPending();
}
