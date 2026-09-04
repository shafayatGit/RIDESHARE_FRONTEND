"use client";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const OtpPageComponent = () => {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success">(
    "idle",
  );
  const [resendTimer, setResendTimer] = useState(45);
  const firstSlotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    firstSlotRef.current?.focus();
  }, []);

  const handleVerify = () => {
    if (otp.length < 6) return;
    setStatus("verifying");
    setTimeout(() => {
      setStatus("success");
    }, 1600);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setOtp("");
    setResendTimer(45);
    setStatus("idle");
  };

  const handleReset = () => {
    setOtp("");
    setStatus("idle");
    setResendTimer(45);
  };
  return (
    <div>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10">
        {/* Ambient glow accents */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />

        {/* Main card */}
        <div className="relative w-full max-w-md">
          {/* Soft gradient ring */}
          <div className="absolute -inset-px rounded-3xl bg-linear-to-b from-primary/40 via-primary/20 to-transparent" />

          <div className="relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl px-8 py-12 sm:px-10 shadow-xl shadow-slate-900/5">
            {/* Icon badge */}
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

            {/* Heading */}
            <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
              Verify your account
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-700">
                user@example.com
              </span>
              . Enter it below to continue.
            </p>

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
            ) : status === "error" ? (
              <div className="mt-10 flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-200">
                  <X className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Invalid code
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    The code you entered is incorrect. Please try again.
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  className="mt-2 h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  Try again
                </Button>
              </div>
            ) : (
              <>
                {/* OTP input */}
                <div className="mt-10 flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                    }}
                    containerClassName="gap-2 sm:gap-3"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                      />
                      <InputOTPSlot
                        index={1}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                      />
                      <InputOTPSlot
                        index={2}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator className="text-slate-300" />
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={3}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                      />
                      <InputOTPSlot
                        index={4}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                      />
                      <InputOTPSlot
                        index={5}
                        className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-slate-300 bg-slate-50/50 text-xl font-semibold text-slate-900 transition-all duration-200 focus:border-primary focus:bg-primary focus:ring-2 focus:ring-primary/30 data-[active]:border-primary data-[active]:ring-2 data-[active]:ring-primary/40"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* Verify button */}
                <Button
                  onClick={handleVerify}
                  disabled={otp.length < 6 || status === "verifying"}
                  className="mt-8 w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:from-primary hover:to-primary hover:shadow-primary/35 disabled:opacity-40 disabled:shadow-none"
                >
                  {status === "verifying" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify code"
                  )}
                </Button>

                {/* Resend + timer */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                  <span className="text-slate-400">Didn't receive a code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-medium text-slate-500">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="font-semibold text-primary transition-colors hover:text-primary"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Subtle footer note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Never share your verification code with anyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpPageComponent;
