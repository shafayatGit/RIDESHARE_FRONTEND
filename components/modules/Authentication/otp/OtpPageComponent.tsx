"use client";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useResendOTP, useVerifyOTP } from "@/hooks/use-auth";
import { authStore } from "@/hooks/auth-store";
import { getApiErrorMessage } from "@/services/api-client";

const OtpPageComponent = () => {
  const router = useRouter();
  const { mutateAsync: resendOtp, isPending: resending } = useResendOTP();
  const { mutateAsync: verifyOtp, isPending: verifying } = useVerifyOTP();

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(45);

  const email = authStore.getPendingEmail() ?? "";

  useEffect(() => {
    if (authStore.isVerified()) {
      router.replace("/dashboard");
      return;
    }
    if (!email) {
      router.replace("/registration");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!email || authStore.isVerified()) {
    return null;
  }

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setStatus("verifying");
    setError(null);
    try {
      await verifyOtp({ email, otp });
      authStore.setVerified();
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err) {
      setStatus("error");
      setError(getApiErrorMessage(err));
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await resendOtp({ email });
      setOtp("");
      setResendTimer(45);
      setStatus("idle");
      setSuccessMessage("A new code has been sent to your email.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleReset = () => {
    setOtp("");
    setStatus("idle");
    setError(null);
    setSuccessMessage(null);
    setResendTimer(45);
  };

  return (
    <div>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />

        <div className="relative w-full max-w-md">
          <div className="absolute -inset-px rounded-3xl bg-linear-to-b from-primary/40 via-primary/20 to-transparent" />

          <div className="relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl px-8 py-12 sm:px-10 shadow-xl shadow-slate-900/5">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/25 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/60 bg-gradient-to-b from-primary/10 to-primary/5 shadow-sm">
                  {status === "success" ? (
                    <CheckCircle2 className="h-8 w-8 text-primary animate-in zoom-in-50 duration-500" />
                  ) : status === "error" ? (
                    <X className="h-8 w-8 text-red-500 animate-in zoom-in-50 duration-500" />
                  ) : (
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
            </div>

            <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
              Verify your account
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-700">{email || "your email"}</span>.
              Enter it below to continue.
            </p>

            {successMessage && (
              <Alert className="mt-6">
                <CheckCircle2 className="size-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {status === "success" ? (
              <div className="mt-10 flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/60">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Verification complete
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your account has been confirmed successfully.
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="mt-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  Verify another code
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-10 flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    containerClassName="gap-2 sm:gap-3"
                  >
                    <InputOTPGroup>
                      {[0, 1, 2].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                        />
                      ))}
                    </InputOTPGroup>
                    <InputOTPSeparator className="text-slate-300" />
                    <InputOTPGroup>
                      {[3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={otp.length < 6 || status === "verifying" || verifying}
                  className="mt-8 w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:from-primary hover:to-primary hover:shadow-primary/35 disabled:opacity-40 disabled:shadow-none"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify code"
                  )}
                </Button>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                  <span className="text-slate-400">Didn&apos;t receive a code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-medium text-slate-500">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="font-semibold text-primary transition-colors hover:text-primary disabled:opacity-50"
                    >
                      {resending ? "Resending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Never share your verification code with anyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpPageComponent;
