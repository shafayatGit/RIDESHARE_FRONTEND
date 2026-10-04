"use client";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function VerifyOTPForm() {
  const { verifyOTP, resendOTP } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await verifyOTP(email, otp);
      toast.success("Email verified — you're logged in");
      router.push(user.isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid or expired code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendOTP(email);
      toast.success("A new code has been sent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Verify your email</CardTitle>
        <CardDescription>
          {email
            ? `Enter the 6-digit code we sent to ${email}.`
            : "Enter the 6-digit code we sent to your email."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col items-center gap-6" onSubmit={handleSubmit}>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify email"}
          </Button>
        </form>
        <Button
          variant="link"
          className="mt-2 w-full"
          onClick={handleResend}
          disabled={isResending || !email}
        >
          {isResending ? "Resending..." : "Resend code"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense>
          <VerifyOTPForm />
        </Suspense>
      </main>
    </div>
  );
}
